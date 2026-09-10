import { isDemoAuthMode } from '@/lib/demoAuth'
import { demoListMyGroups } from '@/lib/demoStore'
import { supabase } from '@/lib/supabase'
import type {
  GroupType,
  Tables,
  TablesInsert,
  TablesUpdate,
} from '@/types/database'
import type { RealtimeChannel } from '@supabase/supabase-js'

export type Group = Tables<'groups'>
export type GroupMember = Tables<'group_members'>
export type GroupMessage = Tables<'group_messages'>

export type GroupWithMeta = Group & {
  course_translations?: Tables<'course_translations'>[]
  courses?: Tables<'courses'> & {
    course_translations: Tables<'course_translations'>[]
  } | null
  member_count?: number
}

export type GroupMemberWithProfile = GroupMember & {
  profiles: Tables<'profiles'> | null
}

export type GroupMessageWithSender = GroupMessage & {
  profiles: Pick<
    Tables<'profiles'>,
    'id' | 'full_name' | 'avatar_url'
  > | null
}

export interface CreateGroupInput {
  name: string
  name_ur?: string | null
  group_type?: GroupType
  course_id?: string | null
  description?: string | null
  created_by?: string | null
  /** Optional initial member user IDs (creator is always added as admin). */
  memberIds?: string[]
}

/**
 * Staff: create a course group (chat or announcement type).
 * Creator is added as group admin; optional members are added as members.
 */
export async function createGroup(input: CreateGroupInput): Promise<Group> {
  const {
    memberIds = [],
    name,
    name_ur,
    group_type = 'chat',
    course_id,
    description,
    created_by,
  } = input

  const payload: TablesInsert<'groups'> = {
    name,
    name_ur: name_ur ?? null,
    group_type,
    course_id: course_id ?? null,
    description: description ?? null,
    created_by: created_by ?? null,
    is_active: true,
  }

  const { data: group, error } = await supabase
    .from('groups')
    .insert(payload)
    .select('*')
    .single()

  if (error) throw error

  const members: TablesInsert<'group_members'>[] = []
  if (created_by) {
    members.push({
      group_id: group.id,
      user_id: created_by,
      role_in_group: 'admin',
    })
  }
  for (const userId of memberIds) {
    if (userId === created_by) continue
    members.push({
      group_id: group.id,
      user_id: userId,
      role_in_group: 'member',
    })
  }
  if (members.length > 0) {
    const { error: memErr } = await supabase.from('group_members').insert(members)
    if (memErr) throw memErr
  }

  return group
}

export async function addMember(
  groupId: string,
  userId: string,
  roleInGroup = 'member',
): Promise<GroupMember> {
  const { data, error } = await supabase
    .from('group_members')
    .upsert(
      {
        group_id: groupId,
        user_id: userId,
        role_in_group: roleInGroup,
      } satisfies TablesInsert<'group_members'>,
      { onConflict: 'group_id,user_id' },
    )
    .select('*')
    .single()

  if (error) throw error
  return data
}

export async function removeMember(
  groupId: string,
  userId: string,
): Promise<void> {
  const { error } = await supabase
    .from('group_members')
    .delete()
    .eq('group_id', groupId)
    .eq('user_id', userId)

  if (error) throw error
}

/** Staff mute: sets role_in_group to `muted` (client blocks send). */
export async function muteMember(
  groupId: string,
  userId: string,
): Promise<GroupMember> {
  return updateMemberRole(groupId, userId, 'muted')
}

export async function unmuteMember(
  groupId: string,
  userId: string,
): Promise<GroupMember> {
  return updateMemberRole(groupId, userId, 'member')
}

async function updateMemberRole(
  groupId: string,
  userId: string,
  role: string,
): Promise<GroupMember> {
  const { data, error } = await supabase
    .from('group_members')
    .update({ role_in_group: role } satisfies TablesUpdate<'group_members'>)
    .eq('group_id', groupId)
    .eq('user_id', userId)
    .select('*')
    .single()

  if (error) throw error
  return data
}

/**
 * Groups the current user belongs to (RLS). Staff who are not members
 * still see course-managed groups via groups_select policy.
 */
export async function listMyGroups(options?: {
  groupType?: GroupType
  courseId?: string
}): Promise<GroupWithMeta[]> {
  if (isDemoAuthMode()) {
    return demoListMyGroups(options) as GroupWithMeta[]
  }

  let query = supabase
    .from('groups')
    .select('*, courses(*, course_translations(*))')
    .eq('is_active', true)
    .order('updated_at', { ascending: false })

  if (options?.groupType) query = query.eq('group_type', options.groupType)
  if (options?.courseId) query = query.eq('course_id', options.courseId)

  const { data, error } = await query
  if (error) throw error
  return (data ?? []) as GroupWithMeta[]
}

export async function listGroupMembers(
  groupId: string,
): Promise<GroupMemberWithProfile[]> {
  const { data, error } = await supabase
    .from('group_members')
    .select('*, profiles(*)')
    .eq('group_id', groupId)
    .order('joined_at', { ascending: true })

  if (error) throw error
  return (data ?? []) as GroupMemberWithProfile[]
}

export async function getMyMembership(
  groupId: string,
  userId: string,
): Promise<GroupMember | null> {
  const { data, error } = await supabase
    .from('group_members')
    .select('*')
    .eq('group_id', groupId)
    .eq('user_id', userId)
    .maybeSingle()

  if (error) throw error
  return data
}

export async function sendMessage(input: {
  groupId: string
  senderId: string
  body: string
}): Promise<GroupMessage> {
  const membership = await getMyMembership(input.groupId, input.senderId)
  if (membership?.role_in_group === 'muted') {
    throw new Error('You are muted in this group')
  }

  const { data: group, error: gErr } = await supabase
    .from('groups')
    .select('group_type')
    .eq('id', input.groupId)
    .single()
  if (gErr) throw gErr

  // Announcement groups: only staff may post (also enforced by RLS)
  if (group.group_type === 'announcement') {
    // Client still attempts insert; RLS rejects non-staff
  }

  const payload: TablesInsert<'group_messages'> = {
    group_id: input.groupId,
    sender_id: input.senderId,
    body: input.body.trim(),
  }

  const { data, error } = await supabase
    .from('group_messages')
    .insert(payload)
    .select('*')
    .single()

  if (error) throw error
  return data
}

export async function listMessages(
  groupId: string,
  options?: { limit?: number; before?: string },
): Promise<GroupMessageWithSender[]> {
  if (isDemoAuthMode()) {
    void groupId
    void options
    return []
  }

  let query = supabase
    .from('group_messages')
    .select('*, profiles:sender_id(id, full_name, avatar_url)')
    .eq('group_id', groupId)
    .order('created_at', { ascending: true })
    .limit(options?.limit ?? 200)

  if (options?.before) {
    query = query.lt('created_at', options.before)
  }

  const { data, error } = await query
  if (error) throw error
  return (data ?? []) as GroupMessageWithSender[]
}

export async function deleteMessage(messageId: string): Promise<void> {
  const { error } = await supabase
    .from('group_messages')
    .delete()
    .eq('id', messageId)
  if (error) throw error
}

/**
 * Subscribe to new messages in a group via Supabase Realtime.
 * Returns an unsubscribe function.
 */
export function subscribeMessages(
  groupId: string,
  onInsert: (message: GroupMessage) => void,
): () => void {
  if (isDemoAuthMode()) {
    void groupId
    void onInsert
    return () => undefined
  }

  const channel: RealtimeChannel = supabase
    .channel(`group-messages:${groupId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'group_messages',
        filter: `group_id=eq.${groupId}`,
      },
      (payload) => {
        onInsert(payload.new as GroupMessage)
      },
    )
    .subscribe()

  return () => {
    void supabase.removeChannel(channel)
  }
}

export async function updateGroup(
  groupId: string,
  patch: TablesUpdate<'groups'>,
): Promise<Group> {
  const { data, error } = await supabase
    .from('groups')
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq('id', groupId)
    .select('*')
    .single()

  if (error) throw error
  return data
}

export async function deactivateGroup(groupId: string): Promise<Group> {
  return updateGroup(groupId, { is_active: false })
}

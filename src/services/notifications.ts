import { isDemoAuthMode } from '@/lib/demoAuth'
import {
  demoCreateNotification,
  demoListNotifications,
  demoMarkAllNotificationsRead,
  demoMarkNotificationRead,
  demoUnreadCount,
} from '@/lib/demoStore'
import { supabase } from '@/lib/supabase'
import type { RealtimeChannel } from '@supabase/supabase-js'
import type {
  NotificationType,
  Tables,
  TablesInsert,
} from '@/types/database'

export type Notification = Tables<'notifications'>

export async function listMine(
  userId: string,
  options?: { unreadOnly?: boolean; limit?: number },
): Promise<Notification[]> {
  if (isDemoAuthMode()) {
    return demoListNotifications(userId, options)
  }

  let query = supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(options?.limit ?? 100)

  if (options?.unreadOnly) query = query.eq('is_read', false)

  const { data, error } = await query
  if (error) throw error
  return data ?? []
}

export async function markRead(id: string): Promise<Notification> {
  if (isDemoAuthMode()) {
    return demoMarkNotificationRead(id)
  }

  const { data, error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('id', id)
    .select('*')
    .single()

  if (error) throw error
  return data
}

export async function markAllRead(userId: string): Promise<void> {
  if (isDemoAuthMode()) {
    demoMarkAllNotificationsRead(userId)
    return
  }

  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('user_id', userId)
    .eq('is_read', false)

  if (error) throw error
}

export async function unreadCount(userId: string): Promise<number> {
  if (isDemoAuthMode()) {
    return demoUnreadCount(userId)
  }

  const { count, error } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('is_read', false)

  if (error) throw error
  return count ?? 0
}

/** Staff helper to create a notification for a user. */
export async function createNotification(
  input: TablesInsert<'notifications'>,
): Promise<Notification> {
  if (isDemoAuthMode()) {
    return demoCreateNotification(input)
  }

  const { data, error } = await supabase
    .from('notifications')
    .insert(input)
    .select('*')
    .single()

  if (error) throw error
  return data
}

export async function notifyUser(input: {
  userId: string
  type?: NotificationType
  titleEn: string
  titleUr?: string | null
  bodyEn?: string | null
  bodyUr?: string | null
  link?: string | null
}): Promise<Notification> {
  return createNotification({
    user_id: input.userId,
    type: input.type ?? 'info',
    title_en: input.titleEn,
    title_ur: input.titleUr ?? null,
    body_en: input.bodyEn ?? null,
    body_ur: input.bodyUr ?? null,
    link: input.link ?? null,
    is_read: false,
  })
}

/**
 * Realtime subscription for the user's notifications.
 * Fires on INSERT (and optional UPDATE).
 */
export function subscribeRealtime(
  userId: string,
  handlers: {
    onInsert?: (n: Notification) => void
    onUpdate?: (n: Notification) => void
  },
): () => void {
  if (isDemoAuthMode()) {
    void userId
    void handlers
    return () => undefined
  }

  const channel: RealtimeChannel = supabase
    .channel(`notifications:${userId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${userId}`,
      },
      (payload) => {
        handlers.onInsert?.(payload.new as Notification)
      },
    )
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${userId}`,
      },
      (payload) => {
        handlers.onUpdate?.(payload.new as Notification)
      },
    )
    .subscribe()

  return () => {
    void supabase.removeChannel(channel)
  }
}

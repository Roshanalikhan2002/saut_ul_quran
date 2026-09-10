import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { Plus, UserMinus, VolumeX, Volume2, Users } from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '@/contexts/AuthContext'
import { ModuleShell } from '@/components/shared/ModuleShell'
import { GroupChatPanel } from '@/features/groups/GroupChatPanel'
import {
  addMember,
  createGroup,
  listGroupMembers,
  listMyGroups,
  muteMember,
  removeMember,
  unmuteMember,
  type GroupMemberWithProfile,
  type GroupWithMeta,
} from '@/services/groups'
import { listCourses, pickCourseTitle } from '@/services/courses'
import { listEnrollments } from '@/services/enrollments'
import { listStudents } from '@/services/students'
import type { CourseWithTranslations } from '@/services/courses'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { toError } from '@/lib/errors'

export function TeacherGroupsPage() {
  const { t, i18n } = useTranslation()
  const locale = i18n.language === 'ur' ? 'ur' : 'en'
  const { user, isStaff } = useAuth()
  const [groups, setGroups] = useState<GroupWithMeta[]>([])
  const [courses, setCourses] = useState<CourseWithTranslations[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [members, setMembers] = useState<GroupMemberWithProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [createOpen, setCreateOpen] = useState(false)
  const [addOpen, setAddOpen] = useState(false)
  const [enrolledStudents, setEnrolledStudents] = useState<
    Array<{ id: string; name: string; email: string }>
  >([])
  const [addMode, setAddMode] = useState<'pick' | 'uuid'>('pick')
  const [addUserId, setAddUserId] = useState('')
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [courseId, setCourseId] = useState('')
  const [groupType, setGroupType] = useState<'chat' | 'announcement'>('chat')

  const selected = useMemo(
    () => groups.find((g) => g.id === selectedId) ?? null,
    [groups, selectedId],
  )

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [g, c] = await Promise.all([
        listMyGroups({ groupType: 'chat' }),
        listCourses(),
      ])
      // Also include announcement groups for staff moderation context
      const ann = await listMyGroups({ groupType: 'announcement' })
      const merged = [...g, ...ann]
      setGroups(merged)
      setCourses(c)
      if (!selectedId && merged[0]) setSelectedId(merged[0].id)
    } catch (err) {
      setError(toError(err))
    } finally {
      setLoading(false)
    }
  }, [selectedId])

  useEffect(() => {
    void load()
    // eslint-disable-next-line react-hooks/exhaustive-deps -- initial load only
  }, [])

  useEffect(() => {
    if (!selectedId) {
      setMembers([])
      return
    }
    void listGroupMembers(selectedId)
      .then(setMembers)
      .catch((err) =>
        toast.error(err instanceof Error ? err.message : t('common.errorRetry')),
      )
  }, [selectedId, t])

  useEffect(() => {
    if (!selected?.course_id) {
      setEnrolledStudents([])
      return
    }
    void Promise.all([
      listEnrollments({
        courseId: selected.course_id,
        status: 'active',
      }),
      listStudents().catch(() => []),
    ]).then(([rows, students]) => {
      const byProfile = new Map(
        students.map((s) => [
          s.profile_id,
          {
            name: s.profiles?.full_name || s.profile_id.slice(0, 8),
            email: s.profiles?.email || '',
          },
        ]),
      )
      setEnrolledStudents(
        rows.map((r) => {
          const info = byProfile.get(r.student_id)
          return {
            id: r.student_id,
            name: info?.name || r.student_id.slice(0, 8),
            email: info?.email || '',
          }
        }),
      )
    })
  }, [selected?.course_id])

  async function handleCreate(e: FormEvent) {
    e.preventDefault()
    if (!user || !name.trim() || !courseId) return
    try {
      const group = await createGroup({
        name: name.trim(),
        description: description.trim() || null,
        course_id: courseId,
        group_type: groupType,
        created_by: user.id,
      })
      // Auto-add active enrolled students
      const enrollments = await listEnrollments({
        courseId,
        status: 'active',
      })
      for (const en of enrollments) {
        try {
          await addMember(group.id, en.student_id)
        } catch {
          /* ignore */
        }
      }
      toast.success(t('common.successCreated'))
      setCreateOpen(false)
      setName('')
      setDescription('')
      setSelectedId(group.id)
      await load()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('common.errorRetry'))
    }
  }

  async function handleAddMember(e: FormEvent) {
    e.preventDefault()
    if (!selectedId || !addUserId) return
    try {
      await addMember(selectedId, addUserId)
      toast.success(t('common.successSaved'))
      setAddOpen(false)
      setAddUserId('')
      setMembers(await listGroupMembers(selectedId))
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('common.errorRetry'))
    }
  }

  async function handleRemove(userId: string) {
    if (!selectedId) return
    try {
      await removeMember(selectedId, userId)
      setMembers((prev) => prev.filter((m) => m.user_id !== userId))
      toast.success(t('common.successDeleted'))
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('common.errorRetry'))
    }
  }

  async function handleMuteToggle(userId: string, currentlyMuted: boolean) {
    if (!selectedId) return
    try {
      if (currentlyMuted) await unmuteMember(selectedId, userId)
      else await muteMember(selectedId, userId)
      setMembers(await listGroupMembers(selectedId))
      toast.success(t('common.successSaved'))
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('common.errorRetry'))
    }
  }

  return (
    <ModuleShell
      title={t('nav.groups')}
      description={t('chat.subtitle')}
      loading={loading}
      error={error}
      onRetry={() => void load()}
      actions={
        <Button type="button" onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4" />
          {t('common.actions.create')}
        </Button>
      }
      empty={!loading && !error && groups.length === 0}
      emptyTitle={t('chat.noConversations')}
      emptyDescription={t('chat.startChat')}
    >
      <div className="grid gap-4 lg:grid-cols-[240px_1fr_220px]">
        <aside className="rounded-xl border border-border bg-card">
          <p className="border-b border-border px-3 py-2 text-xs font-semibold uppercase text-muted-foreground">
            {t('chat.conversations')}
          </p>
          <ul className="max-h-[560px] overflow-auto p-2">
            {groups.map((g) => (
              <li key={g.id}>
                <button
                  type="button"
                  onClick={() => setSelectedId(g.id)}
                  className={cn(
                    'mb-1 w-full rounded-md px-3 py-2 text-left text-sm transition-colors',
                    selectedId === g.id
                      ? 'bg-gold-soft text-navy'
                      : 'hover:bg-surface',
                  )}
                >
                  <span className="block font-medium">{g.name}</span>
                  <span className="text-[10px] capitalize text-muted-foreground">
                    {g.group_type}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </aside>

        <div>
          {selected ? (
            <GroupChatPanel
              group={selected}
              canModerate={isStaff}
            />
          ) : (
            <p className="text-sm text-muted-foreground">
              {t('chat.selectConversation')}
            </p>
          )}
        </div>

        <aside className="rounded-xl border border-border bg-card">
          <div className="flex items-center justify-between border-b border-border px-3 py-2">
            <p className="flex items-center gap-1 text-xs font-semibold uppercase text-muted-foreground">
              <Users className="h-3.5 w-3.5" />
              Members
            </p>
            {selected ? (
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => setAddOpen(true)}
              >
                <Plus className="h-3.5 w-3.5" />
              </Button>
            ) : null}
          </div>
          <ul className="max-h-[560px] space-y-1 overflow-auto p-2">
            {members.map((m) => {
              const muted = m.role_in_group === 'muted'
              return (
                <li
                  key={m.id}
                  className="flex items-start justify-between gap-1 rounded-md px-2 py-1.5 text-xs"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium text-navy">
                      {m.profiles?.full_name || m.user_id.slice(0, 8)}
                    </p>
                    <Badge
                      variant={muted ? 'warning' : 'secondary'}
                      className="mt-0.5 text-[10px]"
                    >
                      {m.role_in_group}
                    </Badge>
                  </div>
                  <div className="flex shrink-0 gap-0.5">
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7"
                      onClick={() => void handleMuteToggle(m.user_id, muted)}
                      aria-label={muted ? 'Unmute' : 'Mute'}
                    >
                      {muted ? (
                        <Volume2 className="h-3.5 w-3.5" />
                      ) : (
                        <VolumeX className="h-3.5 w-3.5" />
                      )}
                    </Button>
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7 text-destructive"
                      onClick={() => void handleRemove(m.user_id)}
                      aria-label={t('common.actions.remove')}
                    >
                      <UserMinus className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </li>
              )
            })}
          </ul>
        </aside>
      </div>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('common.actions.create')}</DialogTitle>
          </DialogHeader>
          <form className="space-y-3" onSubmit={(e) => void handleCreate(e)}>
            <div className="space-y-1.5">
              <Label htmlFor="g-name">{t('common.name')}</Label>
              <Input
                id="g-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label>Course</Label>
              <Select value={courseId} onValueChange={setCourseId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select course" />
                </SelectTrigger>
                <SelectContent>
                  {courses.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {pickCourseTitle(c, locale)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Type</Label>
              <Select
                value={groupType}
                onValueChange={(v) =>
                  setGroupType(v as 'chat' | 'announcement')
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="chat">Chat</SelectItem>
                  <SelectItem value="announcement">Announcement</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="g-desc">{t('common.description')}</Label>
              <Textarea
                id="g-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />
            </div>
            <DialogFooter>
              <Button type="submit" disabled={!name.trim() || !courseId}>
                {t('common.actions.create')}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('groups.addMember')}</DialogTitle>
          </DialogHeader>
          <form className="space-y-3" onSubmit={(e) => void handleAddMember(e)}>
            <div className="flex gap-2">
              <Button
                type="button"
                size="sm"
                variant={addMode === 'pick' ? 'default' : 'outline'}
                onClick={() => setAddMode('pick')}
              >
                {t('groups.pickStudent')}
              </Button>
              <Button
                type="button"
                size="sm"
                variant={addMode === 'uuid' ? 'default' : 'outline'}
                onClick={() => setAddMode('uuid')}
              >
                {t('groups.advancedUuid')}
              </Button>
            </div>

            {addMode === 'pick' ? (
              <div className="space-y-1.5">
                <Label>{t('nav.students')}</Label>
                <Select value={addUserId || undefined} onValueChange={setAddUserId}>
                  <SelectTrigger>
                    <SelectValue placeholder={t('groups.selectEnrolled')} />
                  </SelectTrigger>
                  <SelectContent>
                    {enrolledStudents.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.name}
                        {s.email ? ` · ${s.email}` : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {enrolledStudents.length === 0 ? (
                  <p className="text-xs text-muted-foreground">
                    {t('groups.noEnrolled')}
                  </p>
                ) : null}
              </div>
            ) : (
              <div className="space-y-1.5">
                <Label>{t('groups.studentUuid')}</Label>
                <Input
                  value={addUserId}
                  onChange={(e) => setAddUserId(e.target.value)}
                  placeholder="UUID"
                  required
                />
                <p className="text-xs text-muted-foreground">
                  {t('groups.uuidHint')}
                </p>
              </div>
            )}
            <DialogFooter>
              <Button type="submit" disabled={!addUserId}>
                {t('common.actions.add')}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </ModuleShell>
  )
}

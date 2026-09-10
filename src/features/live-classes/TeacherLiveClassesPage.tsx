import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { ExternalLink, Plus } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { ModuleShell } from '@/components/shared/ModuleShell'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { FileUpload } from '@/components/shared/FileUpload'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import {
  listCourses,
  pickCourseTitle,
  type CourseWithTranslations,
} from '@/services/courses'
import {
  createLiveClass,
  endAndAttachRecording,
  listAllLiveClasses,
  listCourseGroups,
  parseGroupFromNotes,
  setMeetingUrl,
  updateStatus,
  type Group,
  type LiveClassWithCourse,
} from '@/services/liveClasses'
import type { LiveClassStatus } from '@/types/database'
import { toError } from '@/lib/errors'

function toLocalInputValue(iso: string) {
  const d = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function statusBadgeKey(status: LiveClassStatus) {
  if (status === 'live') return 'liveNow'
  return status
}

export function TeacherLiveClassesPage() {
  const { t, i18n } = useTranslation()
  const locale = i18n.language === 'ur' ? 'ur' : 'en'
  const { user } = useAuth()
  const isMobile = useMediaQuery('(max-width: 768px)')

  const [courses, setCourses] = useState<CourseWithTranslations[]>([])
  const [groups, setGroups] = useState<Group[]>([])
  const [classes, setClasses] = useState<LiveClassWithCourse[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const [createOpen, setCreateOpen] = useState(false)
  const [titleEn, setTitleEn] = useState('')
  const [titleUr, setTitleUr] = useState('')
  const [courseId, setCourseId] = useState<string>('none')
  const [groupId, setGroupId] = useState<string>('none')
  const [scheduledAt, setScheduledAt] = useState('')
  const [meetingUrl, setMeetingUrlField] = useState('')
  const [saving, setSaving] = useState(false)

  const [urlEditId, setUrlEditId] = useState<string | null>(null)
  const [urlDraft, setUrlDraft] = useState('')

  const [recordingId, setRecordingId] = useState<string | null>(null)
  const [recordingUrl, setRecordingUrl] = useState('')
  const [recordingFile, setRecordingFile] = useState<File | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [courseList, classList] = await Promise.all([
        listCourses(),
        listAllLiveClasses(),
      ])
      setCourses(courseList)
      setClasses(classList)
    } catch (err) {
      setError(toError(err))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  useEffect(() => {
    const cid = courseId === 'none' ? undefined : courseId
    void listCourseGroups(cid)
      .then(setGroups)
      .catch(() => setGroups([]))
  }, [courseId])

  async function handleCreate() {
    if (!titleEn.trim() || !scheduledAt) {
      toast.error(t('common.required'))
      return
    }
    setSaving(true)
    try {
      const group =
        groupId !== 'none' ? groups.find((g) => g.id === groupId) : null
      await createLiveClass({
        titleEn: titleEn.trim(),
        titleUr: titleUr.trim() || null,
        courseId: courseId === 'none' ? null : courseId,
        groupId: group?.id ?? null,
        groupName: group?.name ?? null,
        scheduledAt: new Date(scheduledAt).toISOString(),
        meetingUrl: meetingUrl.trim() || null,
        hostId: user?.id ?? null,
      })
      toast.success(t('common.successCreated'))
      setCreateOpen(false)
      setTitleEn('')
      setTitleUr('')
      setMeetingUrlField('')
      setGroupId('none')
      await load()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err))
    } finally {
      setSaving(false)
    }
  }

  async function handleStart(id: string) {
    try {
      await updateStatus(id, 'live')
      toast.success(t('live.liveNow'))
      await load()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err))
    }
  }

  async function handleSaveUrl() {
    if (!urlEditId) return
    try {
      await setMeetingUrl(urlEditId, urlDraft.trim())
      toast.success(t('common.successSaved'))
      setUrlEditId(null)
      await load()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err))
    }
  }

  async function handleEndWithRecording() {
    if (!recordingId) return
    setSaving(true)
    try {
      await endAndAttachRecording(recordingId, {
        externalUrl: recordingUrl.trim() || null,
        file: recordingFile,
        uploadedBy: user?.id ?? null,
      })
      toast.success(t('live.recordingSaved'))
      setRecordingId(null)
      setRecordingUrl('')
      setRecordingFile(null)
      await load()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err))
    } finally {
      setSaving(false)
    }
  }

  function classTitle(row: LiveClassWithCourse) {
    return locale === 'ur' && row.title_ur ? row.title_ur : row.title_en
  }

  function renderActions(row: LiveClassWithCourse) {
    return (
      <div className="flex flex-wrap gap-2">
        {row.meeting_url ? (
          <Button type="button" size="sm" variant="outline" asChild>
            <a href={row.meeting_url} target="_blank" rel="noreferrer">
              <ExternalLink className="me-1 h-3.5 w-3.5" />
              {t('live.join')}
            </a>
          </Button>
        ) : (
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => {
              setUrlEditId(row.id)
              setUrlDraft('')
            }}
          >
            {t('live.link')}
          </Button>
        )}
        {row.status === 'scheduled' ? (
          <Button type="button" size="sm" onClick={() => void handleStart(row.id)}>
            {t('live.startClass')}
          </Button>
        ) : null}
        {row.status === 'live' || row.status === 'scheduled' ? (
          <Button
            type="button"
            size="sm"
            variant="secondary"
            onClick={() => {
              setRecordingId(row.id)
              setRecordingUrl('')
              setRecordingFile(null)
            }}
          >
            {t('live.endClass')}
          </Button>
        ) : null}
        {row.status === 'ended' ? (
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => {
              setRecordingId(row.id)
              setRecordingUrl('')
              setRecordingFile(null)
            }}
          >
            {t('live.addRecording')}
          </Button>
        ) : null}
      </div>
    )
  }

  return (
    <ModuleShell
      title={t('live.title')}
      description={t('live.subtitle')}
      loading={loading}
      error={error}
      onRetry={() => void load()}
      empty={!loading && !error && classes.length === 0}
      emptyTitle={t('live.noSessions')}
      actions={
        <Button type="button" onClick={() => setCreateOpen(true)}>
          <Plus className="me-2 h-4 w-4" />
          {t('live.createSession')}
        </Button>
      }
    >
      {isMobile ? (
        <ul className="space-y-3">
          {classes.map((row) => {
            const group = parseGroupFromNotes(row.notes)
            return (
              <li
                key={row.id}
                className="space-y-3 rounded-xl border border-border bg-card p-4"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-medium text-navy">{classTitle(row)}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(row.scheduled_at).toLocaleString()}
                    </p>
                    {row.courses ? (
                      <p className="text-xs text-muted-foreground">
                        {pickCourseTitle(row.courses, locale)}
                      </p>
                    ) : null}
                    {group.groupName ? (
                      <p className="text-xs text-muted-foreground">
                        {t('live.group')}: {group.groupName}
                      </p>
                    ) : null}
                  </div>
                  <StatusBadge status={statusBadgeKey(row.status)} />
                </div>
                {renderActions(row)}
              </li>
            )
          })}
        </ul>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('live.topic')}</TableHead>
              <TableHead>{t('attendance.class')}</TableHead>
              <TableHead>{t('live.group')}</TableHead>
              <TableHead>{t('live.startTime')}</TableHead>
              <TableHead>{t('attendance.status')}</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {classes.map((row) => {
              const group = parseGroupFromNotes(row.notes)
              return (
                <TableRow key={row.id}>
                  <TableCell className="font-medium">{classTitle(row)}</TableCell>
                  <TableCell>
                    {row.courses
                      ? pickCourseTitle(row.courses, locale)
                      : t('common.na')}
                  </TableCell>
                  <TableCell>{group.groupName || t('common.na')}</TableCell>
                  <TableCell>
                    {new Date(row.scheduled_at).toLocaleString()}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={statusBadgeKey(row.status)} />
                  </TableCell>
                  <TableCell>{renderActions(row)}</TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      )}

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t('live.createSession')}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3">
            <div className="space-y-2">
              <Label>{t('library.titleEn')}</Label>
              <Input value={titleEn} onChange={(e) => setTitleEn(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>{t('library.titleUr')}</Label>
              <Input value={titleUr} onChange={(e) => setTitleUr(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>{t('attendance.class')}</Label>
              <Select value={courseId} onValueChange={setCourseId}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">{t('common.optional')}</SelectItem>
                  {courses.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {pickCourseTitle(c, locale)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{t('live.group')}</Label>
              <Select value={groupId} onValueChange={setGroupId}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">{t('common.optional')}</SelectItem>
                  {groups.map((g) => (
                    <SelectItem key={g.id} value={g.id}>
                      {locale === 'ur' && g.name_ur ? g.name_ur : g.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{t('live.startTime')}</Label>
              <Input
                type="datetime-local"
                value={scheduledAt || toLocalInputValue(new Date().toISOString())}
                onChange={(e) => setScheduledAt(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>{t('live.meetingUrl')}</Label>
              <Input
                value={meetingUrl}
                onChange={(e) => setMeetingUrlField(e.target.value)}
                placeholder="https://meet.google.com/..."
              />
              <p className="text-xs text-muted-foreground">{t('live.meetingHint')}</p>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>
              {t('common.actions.cancel')}
            </Button>
            <Button type="button" disabled={saving} onClick={() => void handleCreate()}>
              {saving ? t('common.pleaseWait') : t('common.actions.create')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(urlEditId)}
        onOpenChange={(open) => !open && setUrlEditId(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('live.meetingUrl')}</DialogTitle>
          </DialogHeader>
          <Input
            value={urlDraft}
            onChange={(e) => setUrlDraft(e.target.value)}
            placeholder="https://meet.jit.si/..."
          />
          <p className="text-xs text-muted-foreground">{t('live.meetingHint')}</p>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setUrlEditId(null)}>
              {t('common.actions.cancel')}
            </Button>
            <Button type="button" onClick={() => void handleSaveUrl()}>
              {t('common.actions.save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(recordingId)}
        onOpenChange={(open) => !open && setRecordingId(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('live.addRecording')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-2">
              <Label>{t('live.recordingUrl')}</Label>
              <Input
                value={recordingUrl}
                onChange={(e) => setRecordingUrl(e.target.value)}
                placeholder="https://..."
              />
            </div>
            <div className="space-y-2">
              <Label>{t('live.recording')}</Label>
              <FileUpload
                accept="video/mp4,video/webm"
                onUpload={(file) => setRecordingFile(file)}
                onRemove={() => setRecordingFile(null)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setRecordingId(null)}>
              {t('common.actions.cancel')}
            </Button>
            <Button
              type="button"
              disabled={saving}
              onClick={() => void handleEndWithRecording()}
            >
              {saving ? t('common.pleaseWait') : t('live.endClass')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ModuleShell>
  )
}

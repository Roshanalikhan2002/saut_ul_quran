import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type FormEvent,
} from 'react'
import { useTranslation } from 'react-i18next'
import { Mic, Square, Send, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '@/contexts/AuthContext'
import {
  deleteMessage,
  listMessages,
  sendMessage,
  subscribeMessages,
  type Group,
  type GroupMessage,
  type GroupMessageWithSender,
} from '@/services/groups'
import { getSignedUrl, uploadFile } from '@/services/storage'
import { getErrorMessage } from '@/lib/errors'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'

interface GroupChatPanelProps {
  group: Group
  muted?: boolean
  canModerate?: boolean
  className?: string
}

export function GroupChatPanel({
  group,
  muted,
  canModerate,
  className,
}: GroupChatPanelProps) {
  const { t } = useTranslation()
  const { user } = useAuth()
  const [messages, setMessages] = useState<GroupMessageWithSender[]>([])
  const [body, setBody] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [recording, setRecording] = useState(false)
  const [mediaUrls, setMediaUrls] = useState<Record<string, string>>({})
  const bottomRef = useRef<HTMLDivElement>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const isAnnouncement = group.group_type === 'announcement'
  const canSend =
    !muted &&
    (!isAnnouncement || canModerate) &&
    Boolean(user)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      setMessages(await listMessages(group.id))
    } catch (err) {
      toast.error(getErrorMessage(err, t('common.errorRetry')))
    } finally {
      setLoading(false)
    }
  }, [group.id, t])

  useEffect(() => {
    void load()
  }, [load])

  useEffect(() => {
    const unsub = subscribeMessages(group.id, (msg: GroupMessage) => {
      setMessages((prev) => {
        if (prev.some((m) => m.id === msg.id)) return prev
        return [
          ...prev,
          {
            ...msg,
            profiles: null,
          },
        ]
      })
    })
    return unsub
  }, [group.id])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length])

  useEffect(() => {
    let cancelled = false
    async function resolveMedia() {
      const pending = messages.filter((m) => m.media_path && !mediaUrls[m.id])
      if (pending.length === 0) return
      const next: Record<string, string> = {}
      for (const m of pending) {
        if (!m.media_path) continue
        try {
          next[m.id] = await getSignedUrl('chat-media', m.media_path)
        } catch {
          /* ignore */
        }
      }
      if (!cancelled && Object.keys(next).length > 0) {
        setMediaUrls((prev) => ({ ...prev, ...next }))
      }
    }
    void resolveMedia()
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only re-resolve when message ids/paths change
  }, [messages])

  async function handleSend(e: FormEvent) {
    e.preventDefault()
    if (!user || !body.trim() || !canSend) return
    setSending(true)
    try {
      const msg = await sendMessage({
        groupId: group.id,
        senderId: user.id,
        body: body.trim(),
      })
      setMessages((prev) => {
        if (prev.some((m) => m.id === msg.id)) return prev
        return [
          ...prev,
          {
            ...msg,
            profiles: {
              id: user.id,
              full_name: null,
              avatar_url: null,
            },
          },
        ]
      })
      setBody('')
    } catch (err) {
      toast.error(getErrorMessage(err, t('common.errorRetry')))
    } finally {
      setSending(false)
    }
  }

  async function startRecording() {
    if (!user || !canSend || recording) return
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mime = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : MediaRecorder.isTypeSupported('audio/webm')
          ? 'audio/webm'
          : 'audio/ogg'
      const recorder = new MediaRecorder(stream, { mimeType: mime })
      chunksRef.current = []
      recorder.ondataavailable = (ev) => {
        if (ev.data.size > 0) chunksRef.current.push(ev.data)
      }
      recorder.onstop = () => {
        stream.getTracks().forEach((tr) => tr.stop())
        void finishVoiceNote(recorder.mimeType || mime)
      }
      mediaRecorderRef.current = recorder
      recorder.start()
      setRecording(true)
    } catch (err) {
      toast.error(getErrorMessage(err, t('chat.micDenied')))
    }
  }

  function stopRecording() {
    const rec = mediaRecorderRef.current
    if (!rec || rec.state === 'inactive') {
      setRecording(false)
      return
    }
    rec.stop()
    setRecording(false)
  }

  async function finishVoiceNote(mimeType: string) {
    if (!user || chunksRef.current.length === 0) return
    setSending(true)
    try {
      const baseMime = mimeType.split(';')[0]?.trim() || 'audio/webm'
      const ext = baseMime.includes('ogg')
        ? 'ogg'
        : baseMime.includes('mp4')
          ? 'm4a'
          : 'webm'
      const blob = new Blob(chunksRef.current, { type: baseMime })
      chunksRef.current = []
      const path = `${group.id}/${user.id}-${Date.now()}.${ext}`
      await uploadFile('chat-media', path, blob, {
        contentType: baseMime,
        allowedTypes: ['audio/webm', 'audio/ogg', 'audio/mpeg', 'audio/mp4', 'audio/*'],
        maxSizeBytes: 10 * 1024 * 1024,
      })
      const msg = await sendMessage({
        groupId: group.id,
        senderId: user.id,
        body: null,
        mediaPath: path,
        metadata: { type: 'voice', mime: mimeType },
      })
      setMessages((prev) => {
        if (prev.some((m) => m.id === msg.id)) return prev
        return [
          ...prev,
          {
            ...msg,
            profiles: {
              id: user.id,
              full_name: null,
              avatar_url: null,
            },
          },
        ]
      })
      toast.success(t('chat.voiceSent'))
    } catch (err) {
      toast.error(getErrorMessage(err, t('common.errorRetry')))
    } finally {
      setSending(false)
      mediaRecorderRef.current = null
    }
  }

  async function handleDelete(id: string) {
    try {
      await deleteMessage(id)
      setMessages((prev) => prev.filter((m) => m.id !== id))
      toast.success(t('common.successDeleted'))
    } catch (err) {
      toast.error(getErrorMessage(err, t('common.errorRetry')))
    }
  }

  return (
    <div
      className={cn(
        'flex h-[min(70vh,560px)] flex-col rounded-xl border border-border bg-card',
        className,
      )}
    >
      <div className="border-b border-border px-4 py-3">
        <p className="font-medium text-navy">{group.name}</p>
        <p className="text-xs capitalize text-muted-foreground">
          {group.group_type}
        </p>
      </div>

      <ScrollArea className="flex-1 px-4 py-3">
        {loading ? (
          <p className="text-sm text-muted-foreground">{t('common.loading')}</p>
        ) : messages.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            {t('chat.noMessages')}
          </p>
        ) : (
          <ul className="space-y-3">
            {messages.map((m) => {
              const mine = m.sender_id === user?.id
              const audioSrc = m.media_path ? mediaUrls[m.id] : null
              return (
                <li
                  key={m.id}
                  className={cn(
                    'flex flex-col gap-1',
                    mine ? 'items-end' : 'items-start',
                  )}
                >
                  <div
                    className={cn(
                      'max-w-[85%] rounded-lg px-3 py-2 text-sm',
                      mine
                        ? 'bg-navy text-primary-foreground'
                        : 'bg-surface text-foreground',
                    )}
                  >
                    {!mine ? (
                      <p className="mb-0.5 text-[10px] font-medium opacity-70">
                        {m.profiles?.full_name || t('common.unknown')}
                      </p>
                    ) : null}
                    {audioSrc ? (
                      <audio controls src={audioSrc} className="max-w-full" />
                    ) : m.media_path ? (
                      <p className="text-xs opacity-80">{t('chat.voiceNote')}</p>
                    ) : null}
                    {m.body && !m.media_path ? (
                      <p className="whitespace-pre-wrap">{m.body}</p>
                    ) : m.body && m.media_path && m.body !== '🎤 Voice note' ? (
                      <p className="mt-1 whitespace-pre-wrap">{m.body}</p>
                    ) : null}
                  </div>
                  <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                    <time dateTime={m.created_at}>
                      {new Date(m.created_at).toLocaleString()}
                    </time>
                    {canModerate || mine ? (
                      <button
                        type="button"
                        className="inline-flex items-center gap-0.5 hover:text-destructive"
                        onClick={() => void handleDelete(m.id)}
                        aria-label={t('common.actions.delete')}
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    ) : null}
                  </div>
                </li>
              )
            })}
            <div ref={bottomRef} />
          </ul>
        )}
      </ScrollArea>

      <form
        onSubmit={(e) => void handleSend(e)}
        className="flex gap-2 border-t border-border p-3"
      >
        <Button
          type="button"
          variant={recording ? 'destructive' : 'outline'}
          size="icon"
          disabled={!canSend || sending}
          onClick={() => {
            if (recording) stopRecording()
            else void startRecording()
          }}
          aria-label={recording ? t('chat.stopRecording') : t('chat.voiceNote')}
          title={recording ? t('chat.stopRecording') : t('chat.voiceNote')}
        >
          {recording ? (
            <Square className="h-4 w-4" />
          ) : (
            <Mic className="h-4 w-4" />
          )}
        </Button>
        <Input
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder={
            muted
              ? 'Muted'
              : recording
                ? t('chat.recording')
                : isAnnouncement && !canModerate
                  ? t('announcements.title')
                  : t('chat.typeMessage')
          }
          disabled={!canSend || sending || recording}
          maxLength={4000}
        />
        <Button type="submit" disabled={!canSend || sending || !body.trim() || recording}>
          <Send className="h-4 w-4" />
          <span className="sr-only sm:not-sr-only">{t('chat.send')}</span>
        </Button>
      </form>
    </div>
  )
}

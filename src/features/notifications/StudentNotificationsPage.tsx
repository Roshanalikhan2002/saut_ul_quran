import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { CheckCheck } from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '@/contexts/AuthContext'
import { ModuleShell } from '@/components/shared/ModuleShell'
import {
  listMine,
  markAllRead,
  markRead,
  subscribeRealtime,
  type Notification,
} from '@/services/notifications'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { toError } from '@/lib/errors'

export function StudentNotificationsPage() {
  const { t, i18n } = useTranslation()
  const locale = i18n.language === 'ur' ? 'ur' : 'en'
  const { user } = useAuth()
  const [items, setItems] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const load = useCallback(async () => {
    if (!user) return
    setLoading(true)
    setError(null)
    try {
      setItems(await listMine(user.id))
    } catch (err) {
      setError(toError(err))
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    void load()
  }, [load])

  useEffect(() => {
    if (!user) return
    return subscribeRealtime(user.id, {
      onInsert: (n) => {
        setItems((prev) => [n, ...prev.filter((x) => x.id !== n.id)])
        toast.message(
          locale === 'ur' && n.title_ur ? n.title_ur : n.title_en,
        )
      },
      onUpdate: (n) => {
        setItems((prev) => prev.map((x) => (x.id === n.id ? n : x)))
      },
    })
  }, [user, locale])

  async function handleMarkRead(id: string) {
    try {
      const updated = await markRead(id)
      setItems((prev) => prev.map((x) => (x.id === id ? updated : x)))
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('common.errorRetry'))
    }
  }

  async function handleMarkAll() {
    if (!user) return
    try {
      await markAllRead(user.id)
      setItems((prev) => prev.map((x) => ({ ...x, is_read: true })))
      toast.success(t('common.successSaved'))
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('common.errorRetry'))
    }
  }

  const unread = items.filter((i) => !i.is_read).length

  return (
    <ModuleShell
      title={t('notifications.title')}
      description={t('notifications.subtitle')}
      loading={loading}
      error={error}
      onRetry={() => void load()}
      actions={
        unread > 0 ? (
          <Button type="button" variant="outline" onClick={() => void handleMarkAll()}>
            <CheckCheck className="h-4 w-4" />
            {t('notifications.markAllRead')}
          </Button>
        ) : null
      }
      empty={!loading && !error && items.length === 0}
      emptyTitle={t('notifications.empty')}
    >
      <ul className="divide-y divide-border rounded-xl border border-border bg-card">
        {items.map((n) => {
          const title =
            locale === 'ur' && n.title_ur ? n.title_ur : n.title_en
          const body =
            locale === 'ur' && n.body_ur ? n.body_ur : n.body_en
          const content = (
            <div className="flex flex-1 flex-col gap-1">
              <div className="flex flex-wrap items-center gap-2">
                {!n.is_read ? (
                  <Badge variant="warning">{t('notifications.unread')}</Badge>
                ) : null}
                <Badge variant="secondary" className="capitalize">
                  {n.type}
                </Badge>
              </div>
              <p
                className={cn(
                  'text-sm text-navy',
                  !n.is_read && 'font-semibold',
                )}
              >
                {title}
              </p>
              {body ? (
                <p className="text-xs text-muted-foreground">{body}</p>
              ) : null}
              <time className="text-[10px] text-muted-foreground">
                {new Date(n.created_at).toLocaleString()}
              </time>
            </div>
          )

          return (
            <li
              key={n.id}
              className={cn(
                'flex items-start gap-3 px-4 py-3',
                !n.is_read && 'bg-gold-soft/30',
              )}
            >
              {n.link ? (
                <Link
                  to={n.link}
                  className="flex flex-1"
                  onClick={() => {
                    if (!n.is_read) void handleMarkRead(n.id)
                  }}
                >
                  {content}
                </Link>
              ) : (
                content
              )}
              {!n.is_read ? (
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => void handleMarkRead(n.id)}
                >
                  {t('notifications.markRead')}
                </Button>
              ) : null}
            </li>
          )
        })}
      </ul>
    </ModuleShell>
  )
}

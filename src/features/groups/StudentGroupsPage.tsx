import { useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '@/contexts/AuthContext'
import { ModuleShell } from '@/components/shared/ModuleShell'
import { GroupChatPanel } from '@/features/groups/GroupChatPanel'
import {
  getMyMembership,
  listMyGroups,
  type GroupWithMeta,
} from '@/services/groups'
import { cn } from '@/lib/utils'
import { toError } from '@/lib/errors'

export function StudentGroupsPage() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const [groups, setGroups] = useState<GroupWithMeta[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [muted, setMuted] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const selected = useMemo(
    () => groups.find((g) => g.id === selectedId) ?? null,
    [groups, selectedId],
  )

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      // RLS: only member groups (chat); students don't create groups
      const data = await listMyGroups({ groupType: 'chat' })
      setGroups(data)
      if (!selectedId && data[0]) setSelectedId(data[0].id)
    } catch (err) {
      setError(toError(err))
    } finally {
      setLoading(false)
    }
  }, [selectedId])

  useEffect(() => {
    void load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (!selectedId || !user) {
      setMuted(false)
      return
    }
    void getMyMembership(selectedId, user.id).then((m) => {
      setMuted(m?.role_in_group === 'muted')
    })
  }, [selectedId, user])

  return (
    <ModuleShell
      title={t('nav.groups')}
      description={t('chat.subtitle')}
      loading={loading}
      error={error}
      onRetry={() => void load()}
      empty={!loading && !error && groups.length === 0}
      emptyTitle={t('chat.noConversations')}
    >
      <div className="grid gap-4 lg:grid-cols-[240px_1fr]">
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
                  {g.name}
                </button>
              </li>
            ))}
          </ul>
        </aside>
        <div>
          {selected ? (
            <GroupChatPanel group={selected} muted={muted} />
          ) : (
            <p className="text-sm text-muted-foreground">
              {t('chat.selectConversation')}
            </p>
          )}
        </div>
      </div>
    </ModuleShell>
  )
}

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { Search } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { ModuleShell } from '@/components/shared/ModuleShell'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import {
  demoteFromRole,
  listProfilesWithRoles,
  promoteToRole,
  type ProfileWithRoles,
} from '@/services/students'
import type { AppRole } from '@/types/database'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toError } from '@/lib/errors'

type PendingAction =
  | { type: 'promote'; user: ProfileWithRoles; role: AppRole }
  | { type: 'demote'; user: ProfileWithRoles; role: AppRole }
  | null

export function AdminUsersPage() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const [profiles, setProfiles] = useState<ProfileWithRoles[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [query, setQuery] = useState('')
  const [pending, setPending] = useState<PendingAction>(null)
  const [busy, setBusy] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      setProfiles(await listProfilesWithRoles())
    } catch (err) {
      setError(toError(err))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return profiles
    return profiles.filter((p) => {
      const hay = `${p.full_name ?? ''} ${p.email ?? ''} ${p.roles.join(' ')}`.toLowerCase()
      return hay.includes(q)
    })
  }, [profiles, query])

  async function runPending() {
    if (!pending) return
    setBusy(true)
    try {
      if (pending.type === 'promote') {
        await promoteToRole(pending.user.id, pending.role, user?.id ?? null)
        toast.success(t('admin.promoteSuccess'))
      } else {
        await demoteFromRole(pending.user.id, pending.role)
        toast.success(t('admin.demoteSuccess'))
      }
      setPending(null)
      await load()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('common.errorRetry'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <ModuleShell
      title={t('admin.users')}
      description={t('admin.usersSubtitle')}
      loading={loading}
      error={error}
      onRetry={() => void load()}
    >
      <div className="mb-4 flex items-center gap-2">
        <div className="relative max-w-sm flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-9"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('admin.searchUsers')}
          />
        </div>
      </div>

      <ul className="divide-y divide-border rounded-xl border border-border bg-card">
        {filtered.map((profile) => (
          <li
            key={profile.id}
            className="flex flex-wrap items-center justify-between gap-3 px-4 py-3"
          >
            <div className="min-w-0">
              <p className="truncate font-medium text-navy">
                {profile.full_name || t('common.unknown')}
              </p>
              <p className="truncate text-xs text-muted-foreground">
                {profile.email || profile.id.slice(0, 8)}
              </p>
              <div className="mt-1 flex flex-wrap gap-1">
                {profile.roles.length === 0 ? (
                  <Badge variant="secondary">{t('common.none')}</Badge>
                ) : (
                  profile.roles.map((role) => (
                    <Badge key={role} variant="outline">
                      {t(`roles.${role}`)}
                    </Badge>
                  ))
                )}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Select
                onValueChange={(role) =>
                  setPending({
                    type: 'promote',
                    user: profile,
                    role: role as AppRole,
                  })
                }
              >
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder={t('admin.promote')} />
                </SelectTrigger>
                <SelectContent>
                  {(['student', 'teacher', 'admin'] as AppRole[]).map((role) => (
                    <SelectItem
                      key={role}
                      value={role}
                      disabled={profile.roles.includes(role)}
                    >
                      {t(`roles.${role}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {profile.roles
                .filter((r) => r !== 'student' || profile.roles.length > 1)
                .map((role) => (
                  <Button
                    key={`demote-${role}`}
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={profile.id === user?.id && role === 'admin'}
                    onClick={() =>
                      setPending({ type: 'demote', user: profile, role })
                    }
                  >
                    {t('admin.demote')} {t(`roles.${role}`)}
                  </Button>
                ))}
            </div>
          </li>
        ))}
      </ul>

      <ConfirmDialog
        open={Boolean(pending)}
        onOpenChange={(open) => {
          if (!open) setPending(null)
        }}
        title={
          pending?.type === 'promote'
            ? t('admin.confirmPromote')
            : t('admin.confirmDemote')
        }
        description={
          pending
            ? `${pending.user.full_name || pending.user.email || pending.user.id} â†’ ${t(`roles.${pending.role}`)}`
            : undefined
        }
        loading={busy}
        onConfirm={() => void runPending()}
      />
    </ModuleShell>
  )
}

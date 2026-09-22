import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react'
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
import {
  adminProvisionUser,
  adminResetPassword,
  type ProvisionRole,
} from '@/services/adminUsers'
import { suggestLoginId } from '@/lib/loginId'
import type { AppRole } from '@/types/database'
import { Input } from '@/components/ui/input'
import { PasswordInput } from '@/components/ui/password-input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
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

  const [fullName, setFullName] = useState('')
  const [loginId, setLoginId] = useState(suggestLoginId('student'))
  const [role, setRole] = useState<ProvisionRole>('student')
  const [password, setPassword] = useState('')
  const [creating, setCreating] = useState(false)

  const [resetUser, setResetUser] = useState<ProfileWithRoles | null>(null)
  const [resetPassword, setResetPassword] = useState('')
  const [resetting, setResetting] = useState(false)

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
      const hay =
        `${p.full_name ?? ''} ${p.email ?? ''} ${p.login_id ?? ''} ${p.roles.join(' ')}`.toLowerCase()
      return hay.includes(q)
    })
  }, [profiles, query])

  async function onCreate(e: FormEvent) {
    e.preventDefault()
    setCreating(true)
    try {
      const result = await adminProvisionUser({
        loginId,
        password,
        fullName,
        role,
      })
      toast.success(
        t('admin.userCreated', {
          loginId: result.loginId,
          role: t(`roles.${result.role}`),
        }),
      )
      setFullName('')
      setPassword('')
      setLoginId(suggestLoginId(role))
      await load()
    } catch (err) {
      toast.error(toError(err).message)
    } finally {
      setCreating(false)
    }
  }

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
      toast.error(toError(err).message)
    } finally {
      setBusy(false)
    }
  }

  async function runReset() {
    if (!resetUser) return
    setResetting(true)
    try {
      await adminResetPassword(resetUser.id, resetPassword)
      toast.success(t('admin.passwordResetSuccess'))
      setResetUser(null)
      setResetPassword('')
    } catch (err) {
      toast.error(toError(err).message)
    } finally {
      setResetting(false)
    }
  }

  return (
    <ModuleShell
      title={t('admin.users')}
      description={t('admin.usersProvisionSubtitle')}
      loading={loading}
      error={error}
      onRetry={() => void load()}
    >
      <form
        onSubmit={(e) => void onCreate(e)}
        className="mb-8 grid gap-3 rounded-xl border border-border bg-card p-4 sm:grid-cols-2 lg:grid-cols-5"
      >
        <div className="space-y-1.5 sm:col-span-2 lg:col-span-1">
          <Label htmlFor="prov-name">{t('common.name')}</Label>
          <Input
            id="prov-name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="prov-login">{t('auth.loginId')}</Label>
          <Input
            id="prov-login"
            value={loginId}
            onChange={(e) => setLoginId(e.target.value)}
            placeholder="STU-001"
            required
          />
        </div>
        <div className="space-y-1.5">
          <Label>{t('common.role')}</Label>
          <Select
            value={role}
            onValueChange={(v) => {
              const next = v as ProvisionRole
              setRole(next)
              setLoginId(suggestLoginId(next))
            }}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="student">{t('roles.student')}</SelectItem>
              <SelectItem value="teacher">{t('roles.teacher')}</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="prov-pass">{t('auth.password')}</Label>
          <PasswordInput
            id="prov-pass"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
          />
        </div>
        <div className="flex items-end">
          <Button type="submit" className="w-full" disabled={creating}>
            {creating ? t('common.loading') : t('admin.createUser')}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground sm:col-span-2 lg:col-span-5">
          {t('admin.createUserHint')}
        </p>
      </form>

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
                {profile.login_id
                  ? `${t('auth.loginId')}: ${profile.login_id}`
                  : profile.email || profile.id.slice(0, 8)}
              </p>
              <div className="mt-1 flex flex-wrap gap-1">
                {profile.roles.length === 0 ? (
                  <Badge variant="secondary">{t('common.none')}</Badge>
                ) : (
                  profile.roles.map((r) => (
                    <Badge key={r} variant="outline">
                      {t(`roles.${r}`)}
                    </Badge>
                  ))
                )}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                size="sm"
                variant="secondary"
                onClick={() => {
                  setResetUser(profile)
                  setResetPassword('')
                }}
              >
                {t('admin.resetPassword')}
              </Button>
              <Select
                onValueChange={(r) =>
                  setPending({
                    type: 'promote',
                    user: profile,
                    role: r as AppRole,
                  })
                }
              >
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder={t('admin.promote')} />
                </SelectTrigger>
                <SelectContent>
                  {/* Only one jamia admin (fehmidataj27@gmail.com) — never promote others to admin */}
                  {(['student', 'teacher'] as AppRole[]).map((r) => (
                    <SelectItem
                      key={r}
                      value={r}
                      disabled={profile.roles.includes(r)}
                    >
                      {t(`roles.${r}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
            ? `${pending.user.full_name || pending.user.login_id || pending.user.email} → ${t(`roles.${pending.role}`)}`
            : undefined
        }
        loading={busy}
        onConfirm={() => void runPending()}
      />

      <ConfirmDialog
        open={Boolean(resetUser)}
        onOpenChange={(open) => {
          if (!open) setResetUser(null)
        }}
        title={t('admin.resetPassword')}
        description={
          resetUser
            ? `${resetUser.full_name || resetUser.login_id || resetUser.email}`
            : undefined
        }
        loading={resetting}
        onConfirm={() => void runReset()}
        confirmLabel={t('admin.resetPassword')}
      >
        <div className="space-y-2 py-2">
          <Label htmlFor="reset-pass">{t('auth.newPassword')}</Label>
          <PasswordInput
            id="reset-pass"
            value={resetPassword}
            onChange={(e) => setResetPassword(e.target.value)}
            minLength={8}
            required
          />
        </div>
      </ConfirmDialog>
    </ModuleShell>
  )
}

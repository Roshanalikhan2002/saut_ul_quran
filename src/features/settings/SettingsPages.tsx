import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { useAuth } from '@/contexts/AuthContext'
import { ModuleShell } from '@/components/shared/ModuleShell'
import { AboutEditor } from '@/features/about/AboutEditor'
import { StudentGamification } from '@/features/gamification/StudentGamification'
import {
  getPreferences,
  setLocalePreference,
  updateProfile,
  upsertPreferences,
} from '@/services/preferences'
import { LanguageSwitcher } from '@/components/ui/language-switcher'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import type { AppLocale } from '@/types/database'

function ProfileForm() {
  const { t, i18n } = useTranslation()
  const { profile, user, refreshProfile } = useAuth()
  const [fullName, setFullName] = useState(profile?.full_name ?? '')
  const [fullNameUr, setFullNameUr] = useState(profile?.full_name_ur ?? '')
  const [phone, setPhone] = useState(profile?.phone ?? '')
  const [bio, setBio] = useState(profile?.bio ?? '')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    setFullName(profile?.full_name ?? '')
    setFullNameUr(profile?.full_name_ur ?? '')
    setPhone(profile?.phone ?? '')
    setBio(profile?.bio ?? '')
  }, [profile])

  async function handleSave(e: FormEvent) {
    e.preventDefault()
    if (!user) return
    setSaving(true)
    try {
      await updateProfile(user.id, {
        full_name: fullName.trim() || null,
        full_name_ur: fullNameUr.trim() || null,
        phone: phone.trim() || null,
        bio: bio.trim() || null,
        locale: (i18n.language === 'ur' ? 'ur' : 'en') as AppLocale,
      })
      await refreshProfile()
      toast.success(t('settings.saved'))
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('common.errorRetry'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <form className="max-w-lg space-y-3" onSubmit={(e) => void handleSave(e)}>
      <div className="space-y-1.5">
        <Label htmlFor="full-name">{t('common.name')} (EN)</Label>
        <Input
          id="full-name"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="full-name-ur">{t('common.name')} (UR)</Label>
        <Input
          id="full-name-ur"
          value={fullNameUr}
          onChange={(e) => setFullNameUr(e.target.value)}
          dir="rtl"
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="phone">{t('common.phone')}</Label>
        <Input
          id="phone"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="bio">Bio</Label>
        <Textarea
          id="bio"
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          rows={3}
        />
      </div>
      <Button type="submit" disabled={saving}>
        {t('settings.saveChanges')}
      </Button>
    </form>
  )
}

function LanguageAndNotifPrefs() {
  const { t, i18n } = useTranslation()
  const { user } = useAuth()
  const [emailNotif, setEmailNotif] = useState(true)
  const [pushNotif, setPushNotif] = useState(true)

  const load = useCallback(async () => {
    if (!user) return
    try {
      const prefs = await getPreferences(user.id)
      if (prefs) {
        setEmailNotif(prefs.notification_email)
        setPushNotif(prefs.notification_push)
      }
    } catch {
      /* optional row */
    }
  }, [user])

  useEffect(() => {
    void load()
  }, [load])

  async function persistNotifs(nextEmail: boolean, nextPush: boolean) {
    if (!user) return
    try {
      await upsertPreferences(user.id, {
        locale: (i18n.language === 'ur' ? 'ur' : 'en') as AppLocale,
        notification_email: nextEmail,
        notification_push: nextPush,
      })
      toast.success(t('settings.saved'))
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('common.errorRetry'))
    }
  }

  async function handleLanguagePersist() {
    if (!user) return
    const locale = (i18n.language === 'ur' ? 'ur' : 'en') as AppLocale
    try {
      await setLocalePreference(user.id, locale)
    } catch {
      /* local switcher already applied */
    }
  }

  return (
    <div className="max-w-lg space-y-4">
      <div>
        <p className="mb-1 text-sm font-medium">{t('settings.language')}</p>
        <p className="mb-2 text-xs text-muted-foreground">
          {t('settings.languageDesc')}
        </p>
        <div className="flex items-center gap-2">
          <LanguageSwitcher />
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => void handleLanguagePersist()}
          >
            {t('settings.saveChanges')}
          </Button>
        </div>
      </div>
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium">{t('notifications.emailNotifs')}</p>
        </div>
        <Switch
          checked={emailNotif}
          onCheckedChange={(v) => {
            setEmailNotif(v)
            void persistNotifs(v, pushNotif)
          }}
        />
      </div>
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium">{t('notifications.pushNotifs')}</p>
        </div>
        <Switch
          checked={pushNotif}
          onCheckedChange={(v) => {
            setPushNotif(v)
            void persistNotifs(emailNotif, v)
          }}
        />
      </div>
    </div>
  )
}

export function TeacherSettingsPage() {
  const { t } = useTranslation()
  const { primaryRole } = useAuth()
  const isAdmin = primaryRole === 'admin'

  return (
    <ModuleShell
      title={t('settings.title')}
      description={t('settings.subtitle')}
    >
      <div className="space-y-8">
        <section>
          <h2 className="mb-3 font-display text-lg font-semibold text-navy">
            {t('settings.profile')}
          </h2>
          <ProfileForm />
        </section>
        <Separator />
        <section>
          <h2 className="mb-3 font-display text-lg font-semibold text-navy">
            {t('settings.language')}
          </h2>
          <LanguageAndNotifPrefs />
        </section>
        {isAdmin ? (
          <>
            <Separator />
            <section>
              <h2 className="mb-3 font-display text-lg font-semibold text-navy">
                {t('about.title')}
              </h2>
              <AboutEditor />
            </section>
          </>
        ) : null}
        <Separator />
        <section className="rounded-xl border border-dashed border-border bg-surface/50 p-4 text-sm text-muted-foreground">
          <p className="font-medium text-navy">Promote roles</p>
          <p className="mt-1">
            New signups receive the <code>student</code> role by default. To
            promote a user to teacher or admin, insert into{' '}
            <code>user_roles</code> in the Supabase SQL editor (admin only),
            e.g.{' '}
            <code>
              insert into user_roles (user_id, role) values
              (&apos;&lt;uuid&gt;&apos;, &apos;teacher&apos;);
            </code>
          </p>
        </section>
      </div>
    </ModuleShell>
  )
}

export function StudentSettingsPage() {
  const { t } = useTranslation()
  const { user } = useAuth()

  return (
    <ModuleShell
      title={t('settings.title')}
      description={t('settings.subtitle')}
    >
      <div className="space-y-8">
        <section>
          <h2 className="mb-3 font-display text-lg font-semibold text-navy">
            {t('settings.profile')}
          </h2>
          <ProfileForm />
        </section>
        <Separator />
        <section>
          <h2 className="mb-3 font-display text-lg font-semibold text-navy">
            {t('settings.language')}
          </h2>
          <LanguageAndNotifPrefs />
        </section>
        <Separator />
        <section>
          <h2 className="mb-3 font-display text-lg font-semibold text-navy">
            {t('gamification.title')}
          </h2>
          {user ? <StudentGamification studentId={user.id} /> : null}
        </section>
      </div>
    </ModuleShell>
  )
}

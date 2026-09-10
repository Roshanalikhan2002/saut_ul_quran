import { useTranslation } from 'react-i18next'
import { useAuth } from '@/contexts/AuthContext'
import { ModuleShell } from '@/components/shared/ModuleShell'
import { StudentHifzPage } from '@/features/hifz/StudentHifzPage'
import { StudentTajweedPage } from '@/features/tajweed/StudentTajweedPage'
import { StudentTestsPage } from '@/features/tests/StudentTestsPage'
import { StudentAttendancePage } from '@/features/attendance/StudentAttendancePage'
import { StudentLiveClassesPage } from '@/features/live-classes/StudentLiveClassesPage'
import { StudentLibraryPage } from '@/features/library/StudentLibraryPage'
import { StudentDuasPage } from '@/features/duas/StudentDuasPage'
import { StudentGroupsPage } from '@/features/groups/StudentGroupsPage'
import { StudentAnnouncementsPage } from '@/features/announcements/AnnouncementsPages'
import { StudentCertificatesPage } from '@/features/certificates/CertificatesPages'
import { StudentNotificationsPage } from '@/features/notifications/StudentNotificationsPage'
import { StudentSettingsPage } from '@/features/settings/SettingsPages'
import { StudentGamification } from '@/features/gamification/StudentGamification'

export {
  StudentHifzPage,
  StudentTajweedPage,
  StudentTestsPage,
  StudentAttendancePage,
  StudentLiveClassesPage,
  StudentLibraryPage,
  StudentDuasPage,
  StudentCertificatesPage,
  StudentGroupsPage,
  StudentAnnouncementsPage,
  StudentNotificationsPage,
  StudentSettingsPage,
}

export function StudentProfilePage() {
  const { t } = useTranslation()
  const { profile, primaryRole, user } = useAuth()

  return (
    <ModuleShell
      title={t('nav.profile')}
      description={t('settings.profile')}
    >
      <dl className="mb-8 grid max-w-lg gap-4 rounded-xl border border-border bg-card p-6">
        <div>
          <dt className="text-xs uppercase text-muted-foreground">
            {t('common.name')}
          </dt>
          <dd className="font-medium text-navy">
            {profile?.full_name || t('common.unknown')}
          </dd>
        </div>
        <div>
          <dt className="text-xs uppercase text-muted-foreground">
            {t('common.email')}
          </dt>
          <dd className="font-medium text-navy">
            {profile?.email || user?.email || t('common.na')}
          </dd>
        </div>
        <div>
          <dt className="text-xs uppercase text-muted-foreground">
            {t('common.role')}
          </dt>
          <dd className="font-medium text-navy">
            {primaryRole ? t(`roles.${primaryRole}`) : t('common.na')}
          </dd>
        </div>
      </dl>

      {user ? (
        <div className="max-w-lg">
          <h2 className="mb-3 font-display text-lg font-semibold text-navy">
            {t('gamification.title')}
          </h2>
          <StudentGamification studentId={user.id} compact />
        </div>
      ) : null}
    </ModuleShell>
  )
}

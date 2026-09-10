import { lazy, Suspense, type ReactNode } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { GuestRoute } from '@/components/auth/GuestRoute'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { DashboardLayout } from '@/layouts/DashboardLayout'
import { PublicLayout } from '@/layouts/PublicLayout'
import LandingPage from '@/features/landing/LandingPage'
import AboutPage from '@/features/about/AboutPage'
import { SignInPage } from '@/features/auth/SignInPage'
import { SignUpPage } from '@/features/auth/SignUpPage'
import { ForgotPasswordPage } from '@/features/auth/ForgotPasswordPage'
import { UpdatePasswordPage } from '@/features/auth/UpdatePasswordPage'
import { CertificateVerifyPage } from '@/features/certificates/CertificateVerifyPage'
import { LoadingState } from '@/components/ui/loading-state'

const TeacherDashboardPage = lazy(() =>
  import('@/features/teacher/DashboardPage').then((m) => ({
    default: m.TeacherDashboardPage,
  })),
)
const TeacherCoursesPage = lazy(() =>
  import('@/features/teacher/CoursesPage').then((m) => ({
    default: m.TeacherCoursesPage,
  })),
)
const TeacherStudentsPage = lazy(() =>
  import('@/features/teacher/StudentsPage').then((m) => ({
    default: m.TeacherStudentsPage,
  })),
)
const TeacherCourseDetailPage = lazy(() =>
  import('@/features/courses/TeacherCourseDetailPage').then((m) => ({
    default: m.TeacherCourseDetailPage,
  })),
)
const StudentCourseDetailPage = lazy(() =>
  import('@/features/courses/StudentCourseDetailPage').then((m) => ({
    default: m.StudentCourseDetailPage,
  })),
)
const TeacherAnnouncementsPage = lazy(() =>
  import('@/features/teacher/modules').then((m) => ({
    default: m.TeacherAnnouncementsPage,
  })),
)
const TeacherAttendancePage = lazy(() =>
  import('@/features/teacher/modules').then((m) => ({
    default: m.TeacherAttendancePage,
  })),
)
const TeacherCertificatesPage = lazy(() =>
  import('@/features/teacher/modules').then((m) => ({
    default: m.TeacherCertificatesPage,
  })),
)
const TeacherDuasPage = lazy(() =>
  import('@/features/teacher/modules').then((m) => ({
    default: m.TeacherDuasPage,
  })),
)
const TeacherGroupsPage = lazy(() =>
  import('@/features/teacher/modules').then((m) => ({
    default: m.TeacherGroupsPage,
  })),
)
const TeacherHifzPage = lazy(() =>
  import('@/features/teacher/modules').then((m) => ({
    default: m.TeacherHifzPage,
  })),
)
const TeacherLibraryPage = lazy(() =>
  import('@/features/teacher/modules').then((m) => ({
    default: m.TeacherLibraryPage,
  })),
)
const TeacherLiveClassesPage = lazy(() =>
  import('@/features/teacher/modules').then((m) => ({
    default: m.TeacherLiveClassesPage,
  })),
)
const TeacherSettingsPage = lazy(() =>
  import('@/features/teacher/modules').then((m) => ({
    default: m.TeacherSettingsPage,
  })),
)
const TeacherTestsPage = lazy(() =>
  import('@/features/teacher/modules').then((m) => ({
    default: m.TeacherTestsPage,
  })),
)

const StudentDashboardPage = lazy(() =>
  import('@/features/student/DashboardPage').then((m) => ({
    default: m.StudentDashboardPage,
  })),
)
const StudentCoursesPage = lazy(() =>
  import('@/features/student/CoursesPage').then((m) => ({
    default: m.StudentCoursesPage,
  })),
)
const StudentAnnouncementsPage = lazy(() =>
  import('@/features/student/modules').then((m) => ({
    default: m.StudentAnnouncementsPage,
  })),
)
const StudentAttendancePage = lazy(() =>
  import('@/features/student/modules').then((m) => ({
    default: m.StudentAttendancePage,
  })),
)
const StudentCertificatesPage = lazy(() =>
  import('@/features/student/modules').then((m) => ({
    default: m.StudentCertificatesPage,
  })),
)
const StudentDuasPage = lazy(() =>
  import('@/features/student/modules').then((m) => ({
    default: m.StudentDuasPage,
  })),
)
const StudentGroupsPage = lazy(() =>
  import('@/features/student/modules').then((m) => ({
    default: m.StudentGroupsPage,
  })),
)
const StudentHifzPage = lazy(() =>
  import('@/features/student/modules').then((m) => ({
    default: m.StudentHifzPage,
  })),
)
const StudentLibraryPage = lazy(() =>
  import('@/features/student/modules').then((m) => ({
    default: m.StudentLibraryPage,
  })),
)
const StudentLiveClassesPage = lazy(() =>
  import('@/features/student/modules').then((m) => ({
    default: m.StudentLiveClassesPage,
  })),
)
const StudentNotificationsPage = lazy(() =>
  import('@/features/student/modules').then((m) => ({
    default: m.StudentNotificationsPage,
  })),
)
const StudentProfilePage = lazy(() =>
  import('@/features/student/modules').then((m) => ({
    default: m.StudentProfilePage,
  })),
)
const StudentSettingsPage = lazy(() =>
  import('@/features/student/modules').then((m) => ({
    default: m.StudentSettingsPage,
  })),
)
const StudentTajweedPage = lazy(() =>
  import('@/features/student/modules').then((m) => ({
    default: m.StudentTajweedPage,
  })),
)
const StudentTestsPage = lazy(() =>
  import('@/features/student/modules').then((m) => ({
    default: m.StudentTestsPage,
  })),
)

const AdminDashboardPage = lazy(() =>
  import('@/features/admin/AdminDashboardPage').then((m) => ({
    default: m.AdminDashboardPage,
  })),
)
const AdminUsersPage = lazy(() =>
  import('@/features/admin/AdminUsersPage').then((m) => ({
    default: m.AdminUsersPage,
  })),
)
const AdminQuranPage = lazy(() =>
  import('@/features/admin/AdminQuranPage').then((m) => ({
    default: m.AdminQuranPage,
  })),
)

function LazyPage({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={<LoadingState className="py-16" />}>
      {children}
    </Suspense>
  )
}

export function AppRoutes() {
  return (
    <Routes>
      <Route element={<PublicLayout />}>
        <Route index element={<LandingPage />} />
        <Route path="about" element={<AboutPage />} />
        <Route path="verify" element={<CertificateVerifyPage />} />
        <Route path="verify/:code" element={<CertificateVerifyPage />} />
        <Route path="certificates/verify" element={<CertificateVerifyPage />} />
        <Route
          path="certificates/verify/:code"
          element={<CertificateVerifyPage />}
        />
      </Route>

      <Route element={<GuestRoute />}>
        <Route path="auth/sign-in" element={<SignInPage />} />
        <Route path="auth/sign-up" element={<SignUpPage />} />
        <Route path="auth/forgot-password" element={<ForgotPasswordPage />} />
      </Route>

      {/* Outside GuestRoute: recovery session must not redirect to a dashboard. */}
      <Route path="auth/update-password" element={<UpdatePasswordPage />} />

      <Route path="admin" element={<ProtectedRoute roles={['admin']} />}>
        <Route element={<DashboardLayout />}>
          <Route
            index
            element={
              <LazyPage>
                <AdminDashboardPage />
              </LazyPage>
            }
          />
          <Route
            path="users"
            element={
              <LazyPage>
                <AdminUsersPage />
              </LazyPage>
            }
          />
          <Route
            path="courses"
            element={
              <LazyPage>
                <TeacherCoursesPage />
              </LazyPage>
            }
          />
          <Route
            path="quran"
            element={
              <LazyPage>
                <AdminQuranPage />
              </LazyPage>
            }
          />
          <Route
            path="settings"
            element={
              <LazyPage>
                <TeacherSettingsPage />
              </LazyPage>
            }
          />
        </Route>
      </Route>

      <Route
        path="teacher"
        element={<ProtectedRoute roles={['admin', 'teacher']} />}
      >
        <Route element={<DashboardLayout />}>
          <Route
            index
            element={
              <LazyPage>
                <TeacherDashboardPage />
              </LazyPage>
            }
          />
          <Route
            path="courses"
            element={
              <LazyPage>
                <TeacherCoursesPage />
              </LazyPage>
            }
          />
          <Route
            path="courses/:courseId"
            element={
              <LazyPage>
                <TeacherCourseDetailPage />
              </LazyPage>
            }
          />
          <Route
            path="students"
            element={
              <LazyPage>
                <TeacherStudentsPage />
              </LazyPage>
            }
          />
          <Route
            path="hifz"
            element={
              <LazyPage>
                <TeacherHifzPage />
              </LazyPage>
            }
          />
          <Route
            path="tests"
            element={
              <LazyPage>
                <TeacherTestsPage />
              </LazyPage>
            }
          />
          <Route
            path="attendance"
            element={
              <LazyPage>
                <TeacherAttendancePage />
              </LazyPage>
            }
          />
          <Route
            path="live-classes"
            element={
              <LazyPage>
                <TeacherLiveClassesPage />
              </LazyPage>
            }
          />
          <Route
            path="library"
            element={
              <LazyPage>
                <TeacherLibraryPage />
              </LazyPage>
            }
          />
          <Route
            path="duas"
            element={
              <LazyPage>
                <TeacherDuasPage />
              </LazyPage>
            }
          />
          <Route
            path="groups"
            element={
              <LazyPage>
                <TeacherGroupsPage />
              </LazyPage>
            }
          />
          <Route
            path="announcements"
            element={
              <LazyPage>
                <TeacherAnnouncementsPage />
              </LazyPage>
            }
          />
          <Route
            path="certificates"
            element={
              <LazyPage>
                <TeacherCertificatesPage />
              </LazyPage>
            }
          />
          <Route
            path="settings"
            element={
              <LazyPage>
                <TeacherSettingsPage />
              </LazyPage>
            }
          />
        </Route>
      </Route>

      <Route path="student" element={<ProtectedRoute roles={['student']} />}>
        <Route element={<DashboardLayout />}>
          <Route
            index
            element={
              <LazyPage>
                <StudentDashboardPage />
              </LazyPage>
            }
          />
          <Route
            path="courses"
            element={
              <LazyPage>
                <StudentCoursesPage />
              </LazyPage>
            }
          />
          <Route
            path="courses/:courseId"
            element={
              <LazyPage>
                <StudentCourseDetailPage />
              </LazyPage>
            }
          />
          <Route
            path="hifz"
            element={
              <LazyPage>
                <StudentHifzPage />
              </LazyPage>
            }
          />
          <Route
            path="tajweed"
            element={
              <LazyPage>
                <StudentTajweedPage />
              </LazyPage>
            }
          />
          <Route
            path="tests"
            element={
              <LazyPage>
                <StudentTestsPage />
              </LazyPage>
            }
          />
          <Route
            path="attendance"
            element={
              <LazyPage>
                <StudentAttendancePage />
              </LazyPage>
            }
          />
          <Route
            path="live-classes"
            element={
              <LazyPage>
                <StudentLiveClassesPage />
              </LazyPage>
            }
          />
          <Route
            path="library"
            element={
              <LazyPage>
                <StudentLibraryPage />
              </LazyPage>
            }
          />
          <Route
            path="duas"
            element={
              <LazyPage>
                <StudentDuasPage />
              </LazyPage>
            }
          />
          <Route
            path="certificates"
            element={
              <LazyPage>
                <StudentCertificatesPage />
              </LazyPage>
            }
          />
          <Route
            path="groups"
            element={
              <LazyPage>
                <StudentGroupsPage />
              </LazyPage>
            }
          />
          <Route
            path="announcements"
            element={
              <LazyPage>
                <StudentAnnouncementsPage />
              </LazyPage>
            }
          />
          <Route
            path="notifications"
            element={
              <LazyPage>
                <StudentNotificationsPage />
              </LazyPage>
            }
          />
          <Route
            path="profile"
            element={
              <LazyPage>
                <StudentProfilePage />
              </LazyPage>
            }
          />
          <Route
            path="settings"
            element={
              <LazyPage>
                <StudentSettingsPage />
              </LazyPage>
            }
          />
        </Route>
      </Route>

      <Route path="login" element={<Navigate to="/auth/sign-in" replace />} />
      <Route path="register" element={<Navigate to="/auth/sign-up" replace />} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

import type { LucideIcon } from 'lucide-react'
import {
  Award,
  Bell,
  BookMarked,
  BookOpen,
  CalendarCheck,
  Download,
  GraduationCap,
  HandHeart,
  LayoutDashboard,
  Library,
  Megaphone,
  Settings,
  Shield,
  Sparkles,
  Users,
  UserCircle,
  Video,
  ClipboardList,
} from 'lucide-react'
import type { AppRole } from '@/types/database'

export interface NavItem {
  to: string
  labelKey: string
  icon: LucideIcon
}

export const ADMIN_NAV: NavItem[] = [
  { to: '/admin', labelKey: 'nav.dashboard', icon: LayoutDashboard },
  { to: '/admin/users', labelKey: 'admin.users', icon: Shield },
  { to: '/admin/courses', labelKey: 'nav.courses', icon: BookOpen },
  { to: '/admin/quran', labelKey: 'admin.quranImport', icon: Download },
  { to: '/teacher/students', labelKey: 'nav.students', icon: GraduationCap },
  { to: '/teacher/hifz', labelKey: 'nav.hifz', icon: BookMarked },
  { to: '/teacher/tests', labelKey: 'nav.tests', icon: ClipboardList },
  { to: '/teacher/attendance', labelKey: 'nav.attendance', icon: CalendarCheck },
  { to: '/teacher/live-classes', labelKey: 'nav.live', icon: Video },
  { to: '/teacher/library', labelKey: 'nav.library', icon: Library },
  { to: '/teacher/duas', labelKey: 'nav.duas', icon: HandHeart },
  { to: '/teacher/groups', labelKey: 'nav.groups', icon: Users },
  { to: '/teacher/announcements', labelKey: 'nav.announcements', icon: Megaphone },
  { to: '/teacher/certificates', labelKey: 'nav.certificates', icon: Award },
  { to: '/admin/settings', labelKey: 'nav.settings', icon: Settings },
]

export const TEACHER_NAV: NavItem[] = [
  { to: '/teacher', labelKey: 'nav.dashboard', icon: LayoutDashboard },
  { to: '/teacher/courses', labelKey: 'nav.courses', icon: BookOpen },
  { to: '/teacher/students', labelKey: 'nav.students', icon: GraduationCap },
  { to: '/teacher/hifz', labelKey: 'nav.hifz', icon: BookMarked },
  { to: '/teacher/tests', labelKey: 'nav.tests', icon: ClipboardList },
  { to: '/teacher/attendance', labelKey: 'nav.attendance', icon: CalendarCheck },
  { to: '/teacher/live-classes', labelKey: 'nav.live', icon: Video },
  { to: '/teacher/library', labelKey: 'nav.library', icon: Library },
  { to: '/teacher/duas', labelKey: 'nav.duas', icon: HandHeart },
  { to: '/teacher/groups', labelKey: 'nav.groups', icon: Users },
  { to: '/teacher/announcements', labelKey: 'nav.announcements', icon: Megaphone },
  { to: '/teacher/certificates', labelKey: 'nav.certificates', icon: Award },
  { to: '/teacher/settings', labelKey: 'nav.settings', icon: Settings },
]

export const STUDENT_NAV: NavItem[] = [
  { to: '/student', labelKey: 'nav.dashboard', icon: LayoutDashboard },
  { to: '/student/courses', labelKey: 'nav.courses', icon: BookOpen },
  { to: '/student/hifz', labelKey: 'nav.hifz', icon: BookMarked },
  { to: '/student/tajweed', labelKey: 'nav.tajweed', icon: Sparkles },
  { to: '/student/tests', labelKey: 'nav.tests', icon: ClipboardList },
  { to: '/student/attendance', labelKey: 'nav.attendance', icon: CalendarCheck },
  { to: '/student/live-classes', labelKey: 'nav.live', icon: Video },
  { to: '/student/library', labelKey: 'nav.library', icon: Library },
  { to: '/student/duas', labelKey: 'nav.duas', icon: HandHeart },
  { to: '/student/certificates', labelKey: 'nav.certificates', icon: Award },
  { to: '/student/groups', labelKey: 'nav.groups', icon: Users },
  { to: '/student/announcements', labelKey: 'nav.announcements', icon: Megaphone },
  { to: '/student/notifications', labelKey: 'nav.notifications', icon: Bell },
  { to: '/student/profile', labelKey: 'nav.profile', icon: UserCircle },
  { to: '/student/settings', labelKey: 'nav.settings', icon: Settings },
]

export function navForRole(role: AppRole | null): NavItem[] {
  if (role === 'admin') return ADMIN_NAV
  if (role === 'teacher') return TEACHER_NAV
  return STUDENT_NAV
}

import { useEffect, useState } from 'react'
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Bell, LogOut, Menu } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { navForRole, type NavItem } from '@/lib/nav'
import { APP_NAME, JAMIA_NAME } from '@/lib/constants'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { LanguageSwitcher } from '@/components/ui/language-switcher'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import {
  unreadCount,
  subscribeRealtime,
} from '@/services/notifications'
import { toast } from 'sonner'

function NavLinks({
  items,
  onNavigate,
}: {
  items: NavItem[]
  onNavigate?: () => void
}) {
  const { t } = useTranslation()

  return (
    <nav className="flex flex-col gap-1 p-3">
      {items.map((item) => {
        const Icon = item.icon
        return (
          <NavLink
            key={item.to}
            to={item.to}
            end={
              item.to === '/teacher' ||
              item.to === '/student' ||
              item.to === '/admin'
            }
            onClick={onNavigate}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-gold-soft text-navy'
                  : 'text-primary-foreground/80 hover:bg-navy-soft hover:text-primary-foreground',
              )
            }
          >
            <Icon className="h-4 w-4 shrink-0" aria-hidden />
            <span>{t(item.labelKey)}</span>
          </NavLink>
        )
      })}
    </nav>
  )
}

function SidebarBrand() {
  return (
    <Link to="/" className="flex items-center gap-3 px-4 py-5">
      <img src="/logo.svg" alt="" className="h-10 w-10" />
      <div className="min-w-0">
        <p className="truncate font-display text-sm font-semibold text-gold">
          {APP_NAME}
        </p>
        <p className="truncate text-xs text-primary-foreground/60">
          {JAMIA_NAME}
        </p>
      </div>
    </Link>
  )
}

export function DashboardLayout() {
  const { t } = useTranslation()
  const { user, profile, primaryRole, signOut, isDemoMode } = useAuth()
  const navigate = useNavigate()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [notifUnread, setNotifUnread] = useState(0)
  const items = navForRole(primaryRole)
  const isStudent = primaryRole === 'student'

  const initials =
    profile?.full_name
      ?.split(' ')
      .map((p) => p[0])
      .join('')
      .slice(0, 2)
      .toUpperCase() || 'SQ'

  useEffect(() => {
    if (!user || !isStudent) {
      setNotifUnread(0)
      return
    }
    let cancelled = false
    void unreadCount(user.id)
      .then((n) => {
        if (!cancelled) setNotifUnread(n)
      })
      .catch(() => {
        /* ignore */
      })
    const unsub = subscribeRealtime(user.id, {
      onInsert: () => {
        setNotifUnread((c) => c + 1)
      },
      onUpdate: (n) => {
        if (n.is_read) {
          setNotifUnread((c) => Math.max(0, c - 1))
        }
      },
    })
    return () => {
      cancelled = true
      unsub()
    }
  }, [user, isStudent])

  async function handleSignOut() {
    try {
      await signOut()
      toast.success(t('auth.logoutSuccess'))
      navigate('/auth/sign-in')
    } catch {
      /* toasted in context */
    }
  }

  const sidebarInner = (
    <div className="flex h-full flex-col bg-navy text-primary-foreground">
      <SidebarBrand />
      <Separator className="bg-navy-soft" />
      <ScrollArea className="flex-1">
        <NavLinks items={items} onNavigate={() => setMobileOpen(false)} />
      </ScrollArea>
      <div className="border-t border-navy-soft p-4">
        <div className="mb-3 flex items-center gap-3">
          <Avatar className="h-9 w-9">
            {profile?.avatar_url ? (
              <AvatarImage src={profile.avatar_url} alt="" />
            ) : null}
            <AvatarFallback className="bg-navy-soft text-gold">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">
              {profile?.full_name || t('dashboard.welcomeGuest')}
            </p>
            <p className="truncate text-xs text-primary-foreground/60">
              {primaryRole ? t(`roles.${primaryRole}`) : ''}
            </p>
          </div>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="w-full border-navy-soft bg-transparent text-primary-foreground hover:bg-navy-soft"
          onClick={() => void handleSignOut()}
        >
          <LogOut className="h-4 w-4" />
          {t('nav.logout')}
        </Button>
      </div>
    </div>
  )

  return (
    <div className="flex min-h-screen bg-surface">
      <aside className="hidden w-64 shrink-0 lg:block">{sidebarInner}</aside>

      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="w-72 border-0 p-0">
          <SheetHeader className="sr-only">
            <SheetTitle>{t('nav.menu')}</SheetTitle>
          </SheetHeader>
          {sidebarInner}
        </SheetContent>
      </Sheet>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between gap-3 border-b border-border bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/80">
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="lg:hidden"
              aria-label={t('nav.openMenu')}
              onClick={() => setMobileOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </Button>
            <p className="font-display text-sm font-semibold text-navy lg:hidden">
              {APP_NAME}
            </p>
          </div>
          <div className="flex items-center gap-1">
            {isStudent ? (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="relative"
                aria-label={t('nav.notifications')}
                onClick={() => navigate('/student/notifications')}
              >
                <Bell className="h-5 w-5" />
                {notifUnread > 0 ? (
                  <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-gold px-1 text-[10px] font-bold text-navy">
                    {notifUnread > 99 ? '99+' : notifUnread}
                  </span>
                ) : null}
              </Button>
            ) : null}
            <LanguageSwitcher variant="ghost" />
          </div>
        </header>

        <main className="suq-safe-bottom min-w-0 flex-1 overflow-x-hidden p-4 md:p-6 lg:p-8">
          {isDemoMode ? (
            <div
              className="mb-4 rounded-lg border border-gold/40 bg-gold-soft/60 px-3 py-2 text-sm text-navy"
              role="status"
            >
              {t('common.demoDataBanner')}
            </div>
          ) : null}
          <Outlet />
        </main>
      </div>
    </div>
  )
}

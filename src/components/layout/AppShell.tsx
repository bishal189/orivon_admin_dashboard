import { useState, type ReactNode } from 'react'
import {
  Bell,
  LayoutDashboard,
  LogOut,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  X,
} from 'lucide-react'
import { navigation } from '../../data/dashboard'
import type { AuthUser } from '../../api/client'
import { ConfirmLogoutModal } from '../ConfirmDeleteModal'

interface SidebarProps {
  activeRoute: string
  collapsed: boolean
  onNavigate: (route: string) => void
  onToggleCollapse: () => void
  open: boolean
  onClose: () => void
}

function Sidebar({ activeRoute, collapsed, onNavigate, onToggleCollapse, open, onClose }: SidebarProps) {
  const navigate = (route: string) => {
    onNavigate(route)
    onClose()
  }

  return (
    <>
      {open && (
        <button
          aria-label="Close menu"
          className="fixed inset-0 z-40 bg-slate-950/40 lg:hidden"
          onClick={onClose}
          type="button"
        />
      )}
      <aside className={`fixed inset-y-0 left-0 z-50 flex w-[232px] flex-col border-r border-[#162d4d] bg-[#0b1f3a] text-white shadow-sm transition-[width,transform] duration-300 lg:translate-x-0 ${collapsed ? 'lg:w-[72px]' : 'lg:w-[232px]'} ${open ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className={`flex h-[72px] items-center border-b border-white/10 bg-[#0b1f3a] px-5 ${collapsed ? 'lg:justify-center lg:px-0' : 'justify-between'}`}>
          <span className={`text-sm font-semibold tracking-wide text-white ${collapsed ? 'lg:hidden' : ''}`}>
            Orivon Admin
          </span>
          <button
            aria-label="Close sidebar"
            className="ml-auto rounded-lg p-1.5 text-white/60 hover:bg-white/10 lg:hidden"
            onClick={onClose}
            type="button"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <button
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className="absolute -right-3 top-[84px] hidden h-7 w-7 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 shadow-sm transition hover:text-brand-700 lg:flex"
          onClick={onToggleCollapse}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          type="button"
        >
          {collapsed ? <PanelLeftOpen className="h-3.5 w-3.5" /> : <PanelLeftClose className="h-3.5 w-3.5" />}
        </button>

        <nav className="flex-1 overflow-y-auto px-3 py-3 [scrollbar-width:none]">
          <button
            aria-label="Dashboard"
            className={`mb-3 flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium ${collapsed ? 'lg:justify-center lg:px-0' : ''} ${activeRoute === 'dashboard' ? 'bg-white/10 text-white' : 'text-white/65 hover:bg-white/10 hover:text-white'}`}
            onClick={() => navigate('dashboard')}
            title={collapsed ? 'Dashboard' : undefined}
            type="button"
          >
            <LayoutDashboard className="h-4 w-4 shrink-0" />
            <span className={collapsed ? 'lg:hidden' : undefined}>Dashboard</span>
          </button>

          {navigation.map((section) => (
            <div className="mb-3" key={section.label}>
              <p className={`mb-1 px-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-white/35 ${collapsed ? 'lg:sr-only' : ''}`}>
                {section.label}
              </p>
              <div className="space-y-0.5">
                {section.items.map(({ label, icon: Icon, route }) => (
                  <button
                    aria-current={activeRoute === route ? 'page' : undefined}
                    aria-label={label}
                    className={`flex w-full items-center gap-3 rounded-lg px-3 py-1.5 text-left text-[12px] transition ${collapsed ? 'lg:justify-center lg:px-0' : ''} ${activeRoute === route ? 'bg-white/10 font-semibold text-white' : route ? 'text-white/65 hover:bg-white/10 hover:text-white' : 'cursor-default text-white/35'}`}
                    key={label}
                    onClick={route ? () => navigate(route) : undefined}
                    title={collapsed ? label : undefined}
                    type="button"
                  >
                    <Icon className="h-3.5 w-3.5 shrink-0" strokeWidth={1.8} />
                    <span className={collapsed ? 'lg:hidden' : undefined}>{label}</span>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </nav>
      </aside>
    </>
  )
}

function Header({
  onLogout,
  onMenu,
  user,
}: {
  onLogout: () => void | Promise<void>
  onMenu: () => void
  user: AuthUser
}) {
  const initials = user.name
    .split(/\s+/)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  return (
    <header className="sticky top-0 z-30 flex h-[72px] items-center border-b border-slate-200/80 bg-white/95 px-4 backdrop-blur md:px-7">
      <button
        aria-label="Open sidebar"
        className="mr-3 rounded-lg p-2 text-slate-500 hover:bg-slate-100 lg:hidden"
        onClick={onMenu}
        type="button"
      >
        <Menu className="h-5 w-5" />
      </button>

      <div className="ml-auto flex items-center gap-3 md:gap-5">
        <button aria-label="Notifications" className="relative rounded-lg p-2 text-slate-500 hover:bg-slate-100" type="button">
          <Bell className="h-5 w-5" />
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white" />
        </button>
        <div className="h-8 w-px bg-slate-200" />
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-900 text-xs font-semibold text-white">{initials}</span>
          <span className="hidden md:block">
            <span className="block text-xs font-semibold text-slate-800">{user.name}</span>
            <span className="block text-[11px] capitalize text-slate-500">{user.role.toLowerCase()}</span>
          </span>
          <button
            aria-label="Sign out"
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-red-600"
            onClick={onLogout}
            title="Sign out"
            type="button"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </header>
  )
}

interface AppShellProps {
  activeRoute: string
  children: ReactNode
  onLogout: () => void | Promise<void>
  onNavigate: (route: string) => void
  user: AuthUser
}

export function AppShell({ activeRoute, children, onLogout, onNavigate, user }: AppShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [confirmLogout, setConfirmLogout] = useState(false)

  return (
    <div className="min-h-screen bg-[#f7f8f7]">
      <Sidebar
        activeRoute={activeRoute}
        collapsed={sidebarCollapsed}
        onClose={() => setSidebarOpen(false)}
        onNavigate={onNavigate}
        onToggleCollapse={() => setSidebarCollapsed((current) => !current)}
        open={sidebarOpen}
      />
      <div className={`transition-[padding] duration-300 ${sidebarCollapsed ? 'lg:pl-[72px]' : 'lg:pl-[232px]'}`}>
        <Header onLogout={() => setConfirmLogout(true)} onMenu={() => setSidebarOpen(true)} user={user} />
        {children}
      </div>

      {confirmLogout && (
        <ConfirmLogoutModal
          onCancel={() => setConfirmLogout(false)}
          onConfirm={async () => {
            await onLogout()
            setConfirmLogout(false)
          }}
        />
      )}
    </div>
  )
}

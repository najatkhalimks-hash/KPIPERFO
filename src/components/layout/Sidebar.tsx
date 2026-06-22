import { NavLink } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  LayoutDashboard, User, BookOpen, FolderKanban,
  GraduationCap, Users, Mic2, Lightbulb, Briefcase,
  Globe, Star, Target, Settings, LogOut, ChevronLeft, ChevronRight, ShieldCheck
} from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useAppStore } from '@/store/auth'

const navItems = [
  { to: '/', icon: LayoutDashboard, labelKey: 'nav.dashboard', end: true },
  { to: '/profile', icon: User, labelKey: 'nav.profile' },
  { to: '/publications', icon: BookOpen, labelKey: 'nav.publications' },
  { to: '/projects', icon: FolderKanban, labelKey: 'nav.projects' },
  { to: '/training', icon: GraduationCap, labelKey: 'nav.training' },
  { to: '/supervision', icon: Users, labelKey: 'nav.supervision' },
  { to: '/communications', icon: Mic2, labelKey: 'nav.communications' },
  { to: '/patents', icon: Lightbulb, labelKey: 'nav.patents' },
  { to: '/services', icon: Briefcase, labelKey: 'nav.services' },
  { to: '/collaborations', icon: Globe, labelKey: 'nav.collaborations' },
  { to: '/expertise', icon: Star, labelKey: 'nav.expertise' },
  { to: '/forecasts', icon: Target, labelKey: 'nav.forecasts' },
]

export default function Sidebar() {
  const { t } = useTranslation()
  const { profile, role, signOut } = useAuth()
  const { sidebarCollapsed, toggleSidebar } = useAppStore()

  return (
    <aside
      className={`fixed left-0 top-0 h-full bg-white border-r border-um6p-border flex flex-col z-30 transition-all duration-300 ${
        sidebarCollapsed ? 'w-16' : 'w-64'
      }`}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-4 border-b border-um6p-border min-h-[64px]">
        <div className="w-8 h-8 bg-um6p-green rounded-lg flex items-center justify-center flex-shrink-0">
          <span className="text-white font-bold text-xs">G</span>
        </div>
        {!sidebarCollapsed && (
          <div className="overflow-hidden">
            <p className="text-sm font-bold text-um6p-navy truncate">{t('app.name')}</p>
            <p className="text-xs text-um6p-gray-dark">{t('app.subtitle')}</p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 scrollbar-thin space-y-0.5">
        {navItems.map(({ to, icon: Icon, labelKey, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `sidebar-link ${isActive ? 'active' : ''}`
            }
            title={sidebarCollapsed ? t(labelKey) : undefined}
          >
            <Icon size={18} className="flex-shrink-0" />
            {!sidebarCollapsed && <span className="truncate">{t(labelKey)}</span>}
          </NavLink>
        ))}

        {(role === 'admin' || role === 'direction') && (
          <NavLink
            to="/admin"
            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
            title={sidebarCollapsed ? t('nav.admin') : undefined}
          >
            <ShieldCheck size={18} className="flex-shrink-0" />
            {!sidebarCollapsed && <span>{t('nav.admin')}</span>}
          </NavLink>
        )}
      </nav>

      {/* User section */}
      <div className="border-t border-um6p-border p-2 space-y-0.5">
        {!sidebarCollapsed && profile && (
          <div className="px-3 py-2 mb-1">
            <p className="text-sm font-medium text-um6p-navy truncate">
              {profile.first_name} {profile.last_name}
            </p>
            <p className="text-xs text-um6p-gray-dark truncate">{profile.grade}</p>
          </div>
        )}
        <NavLink to="/settings" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
          <Settings size={18} className="flex-shrink-0" />
          {!sidebarCollapsed && <span>{t('nav.settings')}</span>}
        </NavLink>
        <button
          onClick={() => signOut()}
          className="sidebar-link w-full text-red-500 hover:bg-red-50 hover:text-red-600"
        >
          <LogOut size={18} className="flex-shrink-0" />
          {!sidebarCollapsed && <span>{t('nav.logout')}</span>}
        </button>
      </div>

      {/* Collapse toggle */}
      <button
        onClick={toggleSidebar}
        className="absolute -right-3 top-20 w-6 h-6 bg-white border border-um6p-border rounded-full
                   flex items-center justify-center shadow-sm hover:shadow-md transition-shadow z-40"
      >
        {sidebarCollapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
      </button>
    </aside>
  )
}

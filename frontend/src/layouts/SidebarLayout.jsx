import { useNavigate, useLocation } from 'react-router-dom'
import {
  Heart,
  LayoutDashboard,
  ListTodo,
  Map,
  User,
  LogOut,
  ScanText,
  MessageCircle,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'

const SidebarLayout = ({ children, type = 'ngo' }) => {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, logout } = useAuth()

  const isVolunteer = type === 'volunteer'

  const ngoMenuItems = [
    { name: 'Dashboard', icon: LayoutDashboard, path: '/ngo-dashboard' },
    { name: 'Tasks', icon: ListTodo, path: '/tasks' },
    { name: 'Upload Data', icon: ScanText, path: '/ocr' },
    { name: 'Messages', icon: MessageCircle, path: '/chat' },
    { name: 'Map', icon: Map, path: '/map' },
    { name: 'Profile', icon: User, path: '/profile' },
  ]

  const volunteerMenuItems = [
    { name: 'Dashboard', icon: LayoutDashboard, path: '/volunteer-dashboard' },
    { name: 'My Tasks', icon: ListTodo, path: '/my-tasks' },
    { name: 'Messages', icon: MessageCircle, path: '/chat' },
    { name: 'Map', icon: Map, path: '/map' },
  ]

  const menuItems = type === 'volunteer' ? volunteerMenuItems : ngoMenuItems

  const isActive = (path) => {
    if (path === '/ngo-dashboard' && location.pathname === '/ngo-dashboard') {
      return true
    }
    if (path === '/volunteer-dashboard' && location.pathname === '/volunteer-dashboard') {
      return true
    }
    if (path === '/my-tasks' && location.pathname === '/my-tasks') {
      return true
    }
    return location.pathname === path
  }

  const getInitials = (name) => {
    if (!name) return 'V'
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  }

  return (
    <div className="flex min-h-screen bg-black">
      {/* Sidebar */}
      <aside className="w-64 bg-zinc-950 border-r border-zinc-800 flex flex-col h-screen sticky top-0">
        {/* Logo */}
        <div className="p-6 border-b border-zinc-800">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 flex items-center justify-center">
              <img src="/logo.png" alt="Sahayogam Logo" className="w-full h-full object-contain drop-shadow-[0_0_10px_rgba(20,184,166,0.6)]" />
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-bold text-zinc-50 leading-tight">
                Sahayogam
              </span>
              <span className="text-xs text-brand-500 font-medium -mt-1">
                सहयोगम्
              </span>
            </div>
          </div>
        </div>

        {/* Profile Avatar */}
        <div className="px-4 py-4 border-b border-zinc-800">
          <button
            onClick={() => navigate('/profile')}
            className="group relative flex items-center gap-3 w-full px-2 py-2 rounded-xl hover:bg-zinc-900 transition-all"
          >
            <div className="w-10 h-10 rounded-full bg-brand-500/10 flex items-center justify-center overflow-hidden">
              {user?.avatar ? (
                <img
                  src={user.avatar}
                  alt={user?.name || 'Profile'}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-sm font-semibold text-brand-500">
                  {getInitials(user?.name)}
                </span>
              )}
            </div>
            <div className="flex-1 text-left">
              <p className="text-sm font-medium text-zinc-50 truncate">
                {user?.name || 'Volunteer'}
              </p>
              <p className="text-xs text-zinc-400 group-hover:text-zinc-300 transition-colors">View Profile</p>
            </div>
            {/* Tooltip */}
            <div className="absolute left-full ml-3 px-3 py-1.5 bg-gray-900 text-white text-xs font-medium rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap pointer-events-none z-50">
              View Profile
            </div>
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4">
          <ul className="space-y-1">
            {menuItems.map((item) => (
              <li key={item.name}>
                <button
                  onClick={() => navigate(item.path)}
                  className={`group w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all ${
                    isActive(item.path)
                      ? 'bg-zinc-900 text-brand-500'
                      : 'text-zinc-400 hover:bg-zinc-900 hover:text-zinc-50'
                  }`}
                >
                  <item.icon
                    className={`w-5 h-5 transition-colors ${
                      isActive(item.path) ? 'text-brand-500' : 'text-zinc-500 group-hover:text-zinc-400'
                    }`}
                  />
                  <span
                    className={`font-medium transition-colors ${
                      isActive(item.path) ? 'text-brand-500' : 'text-zinc-400 group-hover:text-zinc-50'
                    }`}
                  >
                    {item.name}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </nav>

        {/* Logout */}
        <div className="p-4 border-t border-zinc-800">
          <button
            onClick={() => {
              logout()
              navigate('/login')
            }}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-zinc-400 hover:bg-zinc-900 hover:text-red-500 transition-all"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  )
}

export default SidebarLayout

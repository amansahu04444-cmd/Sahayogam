import { useNavigate, useLocation } from 'react-router-dom'
import {
  Heart,
  LayoutDashboard,
  ListTodo,
  Map,
  User,
  LogOut,
} from 'lucide-react'

const VolunteerSidebar = () => {
  const navigate = useNavigate()
  const location = useLocation()

  const menuItems = [
    { name: 'Dashboard', icon: LayoutDashboard, path: '/volunteer-dashboard' },
    { name: 'Tasks', icon: ListTodo, path: '/volunteer-tasks' },
    { name: 'Map', icon: Map, path: '/map' },
    { name: 'Profile', icon: User, path: '/profile' },
  ]

  const isActive = (path) => {
    if (path === '/volunteer-dashboard' && location.pathname === '/volunteer-dashboard') {
      return true
    }
    return location.pathname === path
  }

  return (
    <aside className="w-64 bg-white border-r border-gray-200 min-h-screen flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 flex items-center justify-center">
            <img src="/logo.png" alt="Sahayogam Logo" className="w-full h-full object-contain drop-shadow-[0_0_10px_rgba(20,184,166,0.6)]" />
          </div>
          <div className="flex flex-col">
            <span className="text-lg font-bold text-gray-900 leading-tight">
              Sahayogam
            </span>
            <span className="text-xs text-brand-600 font-medium -mt-1">
              सहयोगम्
            </span>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4">
        <ul className="space-y-1">
          {menuItems.map((item) => (
            <li key={item.name}>
              <button
                onClick={() => navigate(item.path, item.state ? { state: item.state } : {})}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all ${
                  isActive(item.path)
                    ? 'bg-brand-50 text-brand-700'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <item.icon
                  className={`w-5 h-5 ${
                    isActive(item.path) ? 'text-brand-600' : 'text-gray-400'
                  }`}
                />
                <span
                  className={`font-medium ${
                    isActive(item.path) ? 'text-brand-700' : 'text-gray-700'
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
      <div className="p-4 border-t border-gray-100">
        <button
          onClick={() => navigate('/login')}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-gray-600 hover:bg-red-50 hover:text-red-600 transition-all"
        >
          <LogOut className="w-5 h-5" />
          <span className="font-medium">Logout</span>
        </button>
      </div>
    </aside>
  )
}

export default VolunteerSidebar

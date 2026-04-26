import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Heart, Menu, X, User, LogOut, ArrowLeft, Users, BrainCircuit, Bell } from 'lucide-react'
import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../context/AuthContext'
import { useNotifications } from '../context/NotificationContext'

const Navbar = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.scrollY > 20
    }
    return false
  })

  const location = useLocation()
  const navigate = useNavigate()
  const { user, isAuthenticated, logout } = useAuth()
  const { unreadCount, notifications, showDropdown, openDropdown, closeDropdown } = useNotifications()
  const dropdownRef = useRef(null)

  const role = user?.role
  const isTaskPage = location.pathname === "/tasks"
  const isLandingPage = location.pathname === '/'
  const dashboardPath = role === "ngo" ? "/ngo-dashboard" : "/volunteer-dashboard"

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handleScroll, { passive: true })
    handleScroll()
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        closeDropdown()
      }
    }

    if (showDropdown) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showDropdown, closeDropdown])

  // Action handlers
  const handleBack = () => navigate(dashboardPath)

  const handleProfile = () => {
    navigate('/profile')
    setIsMobileMenuOpen(false)
  }

  const handleLogout = () => {
    logout()
    navigate('/login')
    setIsMobileMenuOpen(false)
  }

  const handleLogoClick = () => {
    if (!isLandingPage) {
      navigate('/')
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
    setIsMobileMenuOpen(false)
  }

  const handleNotificationClick = (notification) => {
    closeDropdown()
    // Navigate based on notification type
    if (notification.type === 'TASK_INVITATION') {
      // Task invitation - go to volunteer dashboard which shows invitations
      navigate('/volunteer-dashboard')
    }
  }

  const formatTime = (timestamp) => {
    if (!timestamp) return ''
    const date = new Date(timestamp)
    const now = new Date()
    const diffMs = now - date
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    return date.toLocaleDateString()
  }

  const navLinks = isLandingPage ? [
    { name: 'Home', id: 'home' },
    { name: 'Impact', id: 'impact' },
    { name: 'How It Works', id: 'how-it-works' },
    { name: 'Features', id: 'features' },
    { name: 'Resources', id: 'resources' },
  ] : [
    { name: 'Home', path: '/' },
    { name: 'Tasks', path: '/tasks' },
    { name: 'Map', path: '/map' },
  ]

  const handleNavClick = (link) => {
    if (link.path) {
      navigate(link.path)
    } else if (link.id) {
      if (!isLandingPage) {
        navigate('/')
        setTimeout(() => document.getElementById(link.id)?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100)
      } else {
        document.getElementById(link.id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
    }
    setIsMobileMenuOpen(false)
  }

  // Unified Dark Premium Styling Patterns
  const baseLinkClass = "font-medium transition-colors text-white/80 hover:text-[#2dd4bf]"
  const activeLinkClass = "text-[#2dd4bf] font-semibold drop-shadow-[0_0_8px_rgba(45,212,191,0.5)]"

  const baseMobileClass = "w-full text-left block px-4 py-2 rounded-lg font-medium transition-colors text-white/80 hover:bg-white/10 hover:text-[#2dd4bf]"
  const activeMobileClass = "text-[#2dd4bf] bg-[#2dd4bf]/10 font-semibold"

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
      isScrolled
        ? 'bg-[#050506]/80 backdrop-blur-xl border-b border-white/10 shadow-[0_4px_30px_rgba(0,0,0,0.5)]'
        : 'bg-transparent border-b border-transparent'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 md:h-20">

          {/* Brand/Logo Area */}
          <div className="flex items-center gap-4">
            {isTaskPage && (
              <button
                onClick={handleBack}
                className="p-2 rounded-lg flex items-center justify-center transition-colors text-white/80 hover:bg-white/10 hover:text-white"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            )}

            <button onClick={handleLogoClick} className="flex items-center gap-3 cursor-pointer outline-none group">
              <div className="w-12 h-12 flex items-center justify-center rounded-full group-hover:scale-105 transition-all duration-300">
                <img src="/logo.png" alt="Circular Neural Network Logo" className="w-11 h-11 object-contain drop-shadow-[0_0_15px_rgba(20,184,166,0.8)]" />
              </div>
              <div className="flex flex-col text-left">
                <span className="text-2xl font-bold leading-tight text-white tracking-widest font-sans">
                  Sahayogam
                </span>
                <span className="text-xs font-medium -mt-1 text-brand-400">
                  सहयोगम्
                </span>
              </div>
            </button>
          </div>

          {/* Primary Desktop Nav */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => {
              const isActive = location.pathname === link.path
              return (
                <button
                  key={link.name}
                  onClick={() => handleNavClick(link)}
                  className={`${baseLinkClass} ${isActive ? activeLinkClass : ''}`}
                >
                  {link.name}
                </button>
              )
            })}
          </div>

          {/* Desktop Auth/Dash Functions */}
          <div className="hidden md:flex items-center gap-3">
            {isAuthenticated ? (
              <>
                {!isTaskPage && (
                  <Link to={dashboardPath} className={`px-4 py-2 ${baseLinkClass}`}>
                    Dashboard
                  </Link>
                )}

                {/* Notification Bell */}
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => showDropdown ? closeDropdown() : openDropdown()}
                    className="p-2 rounded-lg transition-colors text-white/80 hover:bg-white/10 hover:text-white relative"
                    title="Notifications"
                  >
                    <Bell className="w-5 h-5" />
                    {unreadCount > 0 && (
                      <>
                        {/* Red dot */}
                        <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-red-500 rounded-full animate-pulse">
                          {unreadCount > 9 ? '9+' : unreadCount}
                        </span>
                      </>
                    )}
                  </button>

                  {/* Notification Dropdown */}
                  {showDropdown && (
                    <div className="absolute right-0 mt-2 w-80 bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl overflow-hidden z-50">
                      <div className="px-4 py-3 border-b border-zinc-700 bg-zinc-800/50">
                        <h3 className="font-semibold text-white">Notifications</h3>
                        <p className="text-xs text-zinc-400">{unreadCount} unread</p>
                      </div>

                      <div className="max-h-96 overflow-y-auto">
                        {notifications.length === 0 ? (
                          <div className="px-4 py-8 text-center text-zinc-500">
                            <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
                            <p className="text-sm">No notifications yet</p>
                          </div>
                        ) : (
                          notifications.slice(0, 10).map((notification) => (
                            <button
                              key={notification.id}
                              onClick={() => handleNotificationClick(notification)}
                              className={`w-full px-4 py-3 text-left hover:bg-zinc-800/50 transition-colors border-b border-zinc-800 last:border-b-0 ${
                                !notification.isRead ? 'bg-zinc-800/30' : ''
                              }`}
                            >
                              <div className="flex items-start gap-3">
                                <div className="w-8 h-8 rounded-full bg-brand-600/20 flex items-center justify-center flex-shrink-0">
                                  <Bell className="w-4 h-4 text-brand-500" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium text-white truncate">
                                    {notification.senderName}
                                    <span className="text-zinc-400 font-normal">
                                      {' '}{notification.senderRole === 'ngo' ? '(NGO)' : '(Volunteer)'}
                                    </span>
                                  </p>
                                  <p className="text-xs text-zinc-400 truncate mt-0.5">
                                    {notification.messagePreview || notification.message || 'You have a new notification.'}
                                  </p>
                                  <p className="text-xs text-zinc-500 mt-1">
                                    {formatTime(notification.createdAt)}
                                  </p>
                                </div>
                                {!notification.isRead && (
                                  <div className="w-2 h-2 bg-red-500 rounded-full flex-shrink-0 mt-2" />
                                )}
                              </div>
                            </button>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <button
                  onClick={handleProfile}
                  className="p-2 rounded-lg transition-colors text-white/80 hover:bg-white/10 hover:text-white"
                >
                  <User className="w-5 h-5" />
                </button>
                <button
                  onClick={handleLogout}
                  className="p-2 rounded-lg transition-colors text-white/80 hover:bg-red-500/20 hover:text-red-400"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className={`px-4 py-2 ${baseLinkClass}`}>
                  Login
                </Link>
                <Link
                  to="/signup"
                  className="px-5 py-2 font-medium rounded-lg transition-all bg-white/10 text-white border border-white/20 hover:bg-white/20 backdrop-blur-md"
                >
                  Signup
                </Link>
              </>
            )}
          </div>

          {/* Mobile Display Toggle */}
          <button
            className="md:hidden p-2 transition-colors text-white/80 hover:text-white hover:bg-white/10 rounded-lg"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Expanded Mobile Interface */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t bg-[#050506]/95 backdrop-blur-xl border-white/10 shadow-2xl">
          <div className="px-4 py-4 space-y-3">
            {navLinks.map((link) => {
              const isActive = location.pathname === link.path
              return (
                <button
                  key={link.name}
                  onClick={() => handleNavClick(link)}
                  className={`${baseMobileClass} ${isActive ? activeMobileClass : ''}`}
                >
                  {link.name}
                </button>
              )
            })}

            <div className="pt-3 border-t border-white/10 flex flex-col gap-2">
              {isAuthenticated ? (
                <>
                  {!isTaskPage && (
                    <Link to={dashboardPath} onClick={() => setIsMobileMenuOpen(false)} className={baseMobileClass}>
                      Dashboard
                    </Link>
                  )}
                  <button onClick={handleProfile} className={baseMobileClass}>
                    Profile
                  </button>
                  <button onClick={handleLogout} className="w-full text-left block px-4 py-2 rounded-lg font-medium transition-colors text-red-400 hover:bg-red-500/20">
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="block w-full px-4 py-2 font-medium rounded-lg text-center transition-colors text-white border border-white/20 hover:bg-white/10"
                  >
                    Login
                  </Link>
                  <Link
                    to="/signup"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="block w-full px-4 py-2 font-medium rounded-lg text-center transition-colors bg-brand-600 text-white border border-brand-500 hover:bg-brand-500"
                  >
                    Signup
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  )
}

export default Navbar

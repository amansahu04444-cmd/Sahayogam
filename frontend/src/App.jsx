import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import { VolunteerProvider } from './context/VolunteerContext'
import { Loader2 } from 'lucide-react'
import { Toaster } from 'react-hot-toast'

// Layouts
import MainLayout from './layouts/MainLayout'
import SidebarLayout from './layouts/SidebarLayout'

// Public Pages
import LandingPage from './pages/LandingPage'
import LoginPage from './pages/LoginPage'
import SignupPage from './pages/SignupPage'

// Protected Pages
import NGODashboard from './pages/NGODashboard'
import VolunteerDashboard from './pages/VolunteerDashboard'
import TaskManagement from './pages/TaskManagement'
import MapPage from './pages/MapPage'
import ProfilePage from './pages/ProfilePage'
import NGOProfilePage from './pages/NGOProfilePage'
import MyTasksPage from './pages/MyTasksPage'
import OCRProcessingPage from './pages/OCRProcessingPage'
import ChatPage from './pages/ChatPage'

// Full-screen loading spinner while auth rehydrates
const AuthLoading = () => (
  <div style={{ minHeight: '100vh', backgroundColor: '#030712', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
      <Loader2 style={{ width: 40, height: 40, color: '#2dd4bf', animation: 'spin 1s linear infinite' }} />
      <p style={{ color: '#a1a1aa', fontSize: '14px' }}>Loading...</p>
    </div>
  </div>
)

// Protected Route Component
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { isAuthenticated, user, loading } = useAuth()

  if (loading) return <AuthLoading />

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />
  }

  return children
}

// Redirects authenticated users from public pages to their dashboard
const PublicRoute = ({ children }) => {
  const { isAuthenticated, user, loading } = useAuth()

  if (loading) return <AuthLoading />

  if (isAuthenticated && user) {
    const dashboardPath =
      user.role === 'ngo'
        ? '/ngo-dashboard'
        : '/volunteer-dashboard'
    return <Navigate to={dashboardPath} replace />
  }

  return children
}

function App() {
  const { user } = useAuth()

  return (
    <>
      <Routes>
      {/* Public Routes - No Layout */}
      <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
      <Route path="/signup" element={<PublicRoute><SignupPage /></PublicRoute>} />

      {/* Landing Page - Main Layout */}
      <Route path="/" element={<PublicRoute><MainLayout><LandingPage /></MainLayout></PublicRoute>} />

      {/* Protected Pages with Sidebar Layout */}
      <Route
        path="/ngo-dashboard"
        element={
          <ProtectedRoute allowedRoles={['ngo']}>
            <SidebarLayout type="ngo"><NGODashboard /></SidebarLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/volunteer-dashboard"
        element={
          <ProtectedRoute allowedRoles={['volunteer']}>
            <VolunteerProvider>
              <SidebarLayout type="volunteer"><VolunteerDashboard /></SidebarLayout>
            </VolunteerProvider>
          </ProtectedRoute>
        }
      />
      <Route
        path="/my-tasks"
        element={
          <ProtectedRoute allowedRoles={['volunteer']}>
            <VolunteerProvider>
              <SidebarLayout type="volunteer"><MyTasksPage /></SidebarLayout>
            </VolunteerProvider>
          </ProtectedRoute>
        }
      />

      <Route
        path="/ocr"
        element={
          <ProtectedRoute allowedRoles={['ngo']}>
            <SidebarLayout type="ngo">
              <OCRProcessingPage />
            </SidebarLayout>
          </ProtectedRoute>
        }
      />

      {/* Task & Map - Main Layout */}
      <Route
        path="/tasks"
        element={
          <ProtectedRoute>
            <MainLayout><TaskManagement /></MainLayout>
          </ProtectedRoute>
        }
      />
      <Route path="/map" element={<MapPage />} />
      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            {user?.role?.toLowerCase() === 'ngo' ? <NGOProfilePage /> : <ProfilePage />}
          </ProtectedRoute>
        }
      />

      {/* Chat Page */}
      <Route
        path="/chat"
        element={
          <ProtectedRoute>
            <SidebarLayout type={user?.role || 'ngo'}>
              <ChatPage />
            </SidebarLayout>
          </ProtectedRoute>
        }
      />
      </Routes>
      <Toaster position="top-right" />
    </>
  )
}

export default App

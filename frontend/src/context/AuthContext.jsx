import { createContext, useContext, useState, useEffect } from 'react'
import { onAuthStateChanged, signOut } from 'firebase/auth'
import { auth } from '../config/firebase'
import { authAPI, userAPI } from '../services/api'

const AuthContext = createContext()

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [loading, setLoading] = useState(true) // prevents flash-redirect on refresh

  // ── Listen to Firebase Auth state changes ────────────────────
  useEffect(() => {
    let timeoutId;

    // Safety timeout: if Firebase auth takes too long, stop loading
    timeoutId = setTimeout(() => {
      if (loading) {
        console.warn('[Auth] Firebase auth timed out after 5s — showing app without auth')
        setLoading(false)
      }
    }, 5000)

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      clearTimeout(timeoutId)

      if (firebaseUser) {
        try {
          // Ensure there is a fresh token available for backend requests
          const token = await firebaseUser.getIdToken(true)
          localStorage.setItem('authToken', token)
        } catch (tokenError) {
          console.warn('[Auth] Failed to refresh token on auth state change:', tokenError)
          localStorage.removeItem('authToken')
        }

        // Firebase user is signed in — fetch profile from backend
        try {
          const res = await userAPI.getProfile()
          const freshUser = res.data.data

          const userData = {
            id: freshUser.id || freshUser.uid || firebaseUser.uid,
            name: freshUser.name || firebaseUser.displayName || '',
            email: freshUser.email || firebaseUser.email,
            role: freshUser.role?.toLowerCase() || 'volunteer',
            skills: freshUser.skills || [],
            location: freshUser.location || {},
          }

          setUser(userData)
          setIsAuthenticated(true)
        } catch {
          // Profile not yet synced or token issue —
          // still mark as authenticated with basic info
          setUser({
            id: firebaseUser.uid,
            name: firebaseUser.displayName || '',
            email: firebaseUser.email,
            role: 'volunteer',
            skills: [],
            location: {},
          })
          setIsAuthenticated(true)
        }
      } else {
        // No Firebase user — signed out
        setUser(null)
        setIsAuthenticated(false)
        localStorage.removeItem('authToken')
      }

      setLoading(false)
    })

    return () => {
      clearTimeout(timeoutId)
      unsubscribe()
    }
  }, [])

  // ── Login: called after Firebase signup/login + backend sync ──
  const login = (userData) => {
    setUser({
      id: userData.id || userData.uid,
      name: userData.name || '',
      email: userData.email || '',
      role: userData.role?.toLowerCase() || 'volunteer',
      skills: userData.skills || [],
      location: userData.location || {},
    })
    setIsAuthenticated(true)
  }

  // ── Sync: call backend /api/auth/sync after Firebase auth ────
  const syncWithBackend = async (profileData) => {
    try {
      const res = await authAPI.sync(profileData)
      const syncedUser = res.data.data

      const userData = {
        id: syncedUser.id || syncedUser.uid,
        name: syncedUser.name,
        email: syncedUser.email,
        role: syncedUser.role?.toLowerCase() || 'volunteer',
        skills: syncedUser.skills || [],
        location: syncedUser.location || {},
      }

      setUser(userData)
      setIsAuthenticated(true)
      return userData
    } catch (error) {
      console.error('Backend sync failed:', error)
      throw error
    }
  }

  // ── Logout ──────────────────────────────────────────────────
  const logout = async () => {
    try {
      await signOut(auth)
    } catch (error) {
      console.error('Firebase sign out error:', error)
    }
    localStorage.removeItem('authToken')
    setUser(null)
    setIsAuthenticated(false)
  }

  // ── Dashboard path helper ───────────────────────────────────
  const getDashboardPath = () => {
    if (!user) return '/login'
    switch (user.role) {
      case 'ngo':
        return '/ngo-dashboard'
      case 'volunteer':
        return '/volunteer-dashboard'
      default:
        return '/'
    }
  }

  const value = {
    user,
    setUser,
    isAuthenticated,
    loading,
    login,
    logout,
    syncWithBackend,
    getDashboardPath,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export default AuthContext

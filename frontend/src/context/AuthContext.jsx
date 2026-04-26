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
    let isMounted = true

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!isMounted) return

      if (firebaseUser) {
        try {
          // 1. Force refresh token immediately to ensure we have a valid one
          const token = await firebaseUser.getIdToken(true)
          localStorage.setItem('authToken', token)
          
          // 2. Fetch profile ONLY after token is guaranteed to be set
          const res = await userAPI.getProfile()
          const freshUser = res.data.data

          if (isMounted) {
            setUser({
              id: freshUser.id || firebaseUser.uid,
              name: freshUser.name || firebaseUser.displayName || '',
              email: freshUser.email || firebaseUser.email,
              role: freshUser.role?.toLowerCase() || 'volunteer',
              skills: freshUser.skills || [],
              location: freshUser.location || {},
            })
            setIsAuthenticated(true)
          }
        } catch (error) {
          console.error('[Auth] Profile fetch failed on auth change:', error.message)
          
          if (isMounted) {
            // Fallback: Authenticated with Firebase but profile sync pending
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
        }
      } else {
        // No Firebase user — signed out
        if (isMounted) {
          setUser(null)
          setIsAuthenticated(false)
          localStorage.removeItem('authToken')
        }
      }

      if (isMounted) setLoading(false)
    })

    return () => {
      isMounted = false
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

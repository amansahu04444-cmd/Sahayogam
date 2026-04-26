import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { onAuthStateChanged } from 'firebase/auth'
import { auth, db } from '../config/firebase'
import { notificationAPI } from '../services/api'
import { collection, query, where, onSnapshot, orderBy, limit } from 'firebase/firestore'

const NotificationContext = createContext()

export const NotificationProvider = ({ children }) => {
  const [unreadCount, setUnreadCount] = useState(0)
  const [notifications, setNotifications] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [showDropdown, setShowDropdown] = useState(false)

  // Fetch notifications from backend API
  const fetchNotifications = useCallback(async () => {
    try {
      const res = await notificationAPI.getNotifications(false)
      if (res.data.success) {
        setNotifications(res.data.data)
        const unread = res.data.data.filter(n => !n.isRead).length
        setUnreadCount(unread)
      }
    } catch (error) {
      console.error('[Notification] Error fetching:', error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Set up real-time listener using Firestore onSnapshot
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user && user.uid) {
        // Initial fetch
        await fetchNotifications()

        // Real-time listener: listen for NEW notifications where receiverId == current user
        // NOTE: Avoiding orderBy to prevent composite index requirement
        
        try {
          const notificationsRef = collection(db, 'notifications')
          const q = query(
            notificationsRef,
            where('receiverId', '==', String(user.uid || '')),
            where('isRead', '==', false),
            limit(50)
          )

          const unsubscribeSnapshot = onSnapshot(q, (snapshot) => {
          const newUnread = snapshot.docs.length
          console.log('[Notification] Real-time update - unread:', newUnread)
          setUnreadCount(newUnread)

          // Build sorted notifications list
          const notifs = snapshot.docs
            .map(doc => ({ id: doc.id, ...doc.data() }))
            .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))

          setNotifications(notifs)
        }, (error) => {
          console.error('[Notification] Snapshot error:', error)
        })

        return () => {
          unsubscribeSnapshot()
        }
        } catch (error) {
          console.error('[Notification] Error setting up listener:', error);
          return () => {};
        }
      } else {
        setUnreadCount(0)
        setNotifications([])
        setIsLoading(false)
      }
    })

    return () => unsubscribe()
  }, [fetchNotifications])

  // Mark notifications as read
  const markAsRead = async () => {
    try {
      await notificationAPI.markAsRead()
      setUnreadCount(0)
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))
    } catch (error) {
      console.error('[Notification] Error marking as read:', error)
    }
  }

  // Mark all as read when opening dropdown
  const openDropdown = () => {
    setShowDropdown(true)
    // Mark as read after a short delay to allow user to see new notifications
    setTimeout(() => {
      if (unreadCount > 0) {
        markAsRead()
      }
    }, 1000)
  }

  const closeDropdown = () => {
    setShowDropdown(false)
  }

  const value = {
    unreadCount,
    notifications,
    isLoading,
    showDropdown,
    openDropdown,
    closeDropdown,
    markAsRead,
    refreshNotifications: fetchNotifications,
  }

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  )
}

export const useNotifications = () => {
  const context = useContext(NotificationContext)
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider')
  }
  return context
}

export default NotificationContext

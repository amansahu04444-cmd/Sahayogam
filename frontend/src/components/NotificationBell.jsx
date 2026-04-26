import { useState, useRef, useEffect } from 'react'
import { Bell } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { auth, db } from '../config/firebase'
import { collection, query, where, onSnapshot, limit, doc, updateDoc } from 'firebase/firestore'
import { notificationAPI } from '../services/api'

const NotificationBell = ({ role = 'ngo' }) => {
  const [isOpen, setIsOpen] = useState(false)
  const [hasNewPulse, setHasNewPulse] = useState(false)
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const dropdownRef = useRef(null)
  const prevUnreadRef = useRef(0)
  const navigate = useNavigate()

  // ── Real-time listener on `notifications` collection ────────────
  useEffect(() => {
    const currentUser = auth.currentUser
    
    if (!currentUser || !currentUser.uid) {
      return
    }

    try {
      const q = query(
        collection(db, 'notifications'),
        where('receiverId', '==', String(currentUser.uid || '')),
        where('isRead', '==', false),
        limit(50)
      )

      const unsubscribe = onSnapshot(q, (snapshot) => {
        const notifs = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        })).sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))

        setNotifications(notifs)
        setUnreadCount(notifs.length)

        if (notifs.length > prevUnreadRef.current) {
          setHasNewPulse(true)
          const timer = setTimeout(() => setHasNewPulse(false), 2000)
          return () => clearTimeout(timer)
        }

        prevUnreadRef.current = notifs.length
      }, (err) => {
        console.error('[NotificationBell] Snapshot error:', err.message)
      })

      return () => unsubscribe()
    } catch (e) {
      console.error('[NotificationBell] Error creating listener:', e);
      return () => {};
    }
  }, [])

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  const formatTime = (isoString) => {
    if (!isoString) return ''
    const date = new Date(isoString)
    const now = new Date()
    const diffMins = Math.floor((now - date) / 60000)

    if (diffMins < 1) return 'now'
    if (diffMins < 60) return `${diffMins}m`
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h`
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
  }

  const getSenderName = (notification) => {
    return notification.senderName || 'Someone'
  }

  const handleMarkAsRead = async (notification) => {
    try {
      await updateDoc(doc(db, 'notifications', notification.id), {
        isRead: true,
      })
    } catch (err) {
      console.error('[NotificationBell] Failed to mark as read:', err.message)
    }
  }

  const handleRespond = async (e, notification, status) => {
    e.stopPropagation()
    try {
      const res = await notificationAPI.respondToInvitation(notification.id, status)
      if (res.data.success) {
        console.log(`[NotificationBell] Successfully ${status} invitation`)
      }
    } catch (err) {
      console.error(`[NotificationBell] Failed to ${status} invitation:`, err.message)
    }
  }

  const handleNotificationClick = async (notification) => {
    if (notification.type === 'task_invitation' && notification.status === 'pending') {
      return
    }

    setIsOpen(false)
    await handleMarkAsRead(notification)

    if (notification.type === 'task_invitation') {
      navigate('/my-tasks')
    } else if (notification.type === 'CHAT_MESSAGE' && notification.chatId) {
      navigate('/chat', {
        state: { selectedChatId: notification.chatId },
      })
    }
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`relative p-2 text-zinc-400 hover:text-zinc-50 hover:bg-zinc-800 rounded-xl transition-all outline-none ${hasNewPulse ? 'animate-bounce' : ''}`}
      >
        <Bell className="w-6 h-6" />
        {unreadCount > 0 && (
          <span className="absolute top-0.5 right-0.5 flex items-center justify-center min-w-[20px] h-5 px-1 bg-red-500 text-white text-[11px] font-bold rounded-full border-2 border-zinc-900 shadow-sm">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div
          className="absolute right-0 mt-2 w-80 sm:w-96 bg-zinc-900 border border-zinc-700/50 rounded-2xl shadow-2xl z-50 overflow-hidden origin-top-right"
          style={{ animation: 'fadeSlideIn 0.2s ease-out' }}
        >
          <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800 bg-zinc-900/50">
            <h3 className="font-semibold text-zinc-50 flex items-center gap-2">
              <Bell className="w-4 h-4 text-brand-400" />
              Notifications
            </h3>
            {unreadCount > 0 && (
              <span className="text-xs font-medium text-brand-400 bg-brand-500/10 px-2 py-0.5 rounded-full">
                {unreadCount} unread
              </span>
            )}
          </div>

          <div className="max-h-[60vh] overflow-y-auto overscroll-contain">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center px-4 py-10 text-center">
                <Bell className="w-10 h-10 text-zinc-700 mb-3" />
                <p className="text-zinc-400 font-medium">All caught up!</p>
                <p className="text-sm text-zinc-500 mt-1">
                  You have no new notifications.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-zinc-800/50">
                {notifications.map((notification) => (
                  <button
                    key={notification.id}
                    onClick={() => handleNotificationClick(notification)}
                    className="w-full flex items-start gap-3 p-4 hover:bg-zinc-800/50 transition-colors text-left group"
                  >
                    <div className="flex-shrink-0 w-10 h-10 bg-brand-500/10 rounded-full flex items-center justify-center mt-1 group-hover:bg-brand-500/20 transition-colors">
                      <Bell className="w-5 h-5 text-brand-400" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline justify-between mb-1">
                        <span className="font-semibold text-zinc-50 truncate pr-2">
                          {getSenderName(notification)}
                        </span>
                        <span className="text-xs text-brand-400 font-medium whitespace-nowrap">
                          {formatTime(notification.createdAt)}
                        </span>
                      </div>

                      <p className="text-xs text-zinc-400 truncate mb-1">
                        Task: <span className="font-medium text-zinc-300">{notification.taskTitle || 'Task'}</span>
                      </p>

                      <div className="flex items-center justify-between">
                        <p className="text-sm text-zinc-300 font-medium truncate pr-3">
                          {notification.messagePreview || notification.message || 'You have a new notification.'}
                        </p>
                      </div>

                      {notification.type === 'task_invitation' && notification.status === 'pending' && (
                        <div className="flex items-center gap-2 mt-3">
                          <button
                            onClick={(e) => handleRespond(e, notification, 'accepted')}
                            className="px-3 py-1 bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold rounded-lg transition-colors"
                          >
                            Accept
                          </button>
                          <button
                            onClick={(e) => handleRespond(e, notification, 'rejected')}
                            className="px-3 py-1 bg-zinc-700 hover:bg-zinc-600 text-zinc-300 text-xs font-bold rounded-lg transition-colors"
                          >
                            Reject
                          </button>
                        </div>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateY(-8px) scale(0.95); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </div>
  )
}

export default NotificationBell
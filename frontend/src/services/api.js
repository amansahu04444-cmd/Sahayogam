import axios from 'axios'
import { auth } from '../config/firebase'
import { signOut } from 'firebase/auth'

// Standardize baseURL: append /api if missing from VITE_API_URL
const getBaseURL = () => {
  const url = import.meta.env.VITE_API_URL || 'http://localhost:5000'
  return url.endsWith('/api') ? url : `${url}/api`
}

const API = axios.create({
  baseURL: getBaseURL(),
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
})

// ── Request Interceptor: attach Fresh Firebase ID token ──
API.interceptors.request.use(
  async (config) => {
    try {
      // Force refresh token if user is signed in to avoid 401s on expired tokens
      if (auth.currentUser) {
        const token = await auth.currentUser.getIdToken(true)
        config.headers.Authorization = `Bearer ${token}`
        localStorage.setItem('authToken', token)
      } else {
        // Fallback to stored token if auth.currentUser is not yet ready
        const storedToken = localStorage.getItem('authToken')
        if (storedToken) {
          config.headers.Authorization = `Bearer ${storedToken}`
        }
      }
    } catch (error) {
      console.error('[API Interceptor] Failed to get fresh token:', error)
    }

    // Add cache-busting timestamp to GET requests
    if (config.method === 'get') {
      config.params = { ...config.params, _t: Date.now() }
    }
    return config
  },
  (error) => Promise.reject(error)
)

// ── Response Interceptor: handle 401/Unauthorized ──
API.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    if (error.response?.status === 401 && !originalRequest._retry) {
      console.warn('[API] 401 Unauthorized detected')
      localStorage.removeItem('authToken')
      
      // If we're not on a public page, redirect to login
      const publicPaths = ['/login', '/signup', '/']
      const isPublicPath = publicPaths.some(path => window.location.pathname === path)

      if (!isPublicPath) {
        try {
          await signOut(auth)
        } catch (err) {
          console.error('[API] Logout failed:', err)
        }
        window.location.href = '/login?expired=true'
      }
    }
    return Promise.reject(error)
  }
)

// ── Auth API (Firebase Auth + Backend Sync) ──────────────────
export const authAPI = {
  /**
   * Sync Firebase user with backend Firestore
   * Called after Firebase signup/login
   */
  sync: (data) =>
    API.post('/auth/sync', data),
}

// ── User API ─────────────────────────────────────────────────
export const userAPI = {
  getProfile: () =>
    API.get('/users/profile'),

  updateProfile: (data) =>
    API.put('/users/update', data),

  getVolunteersBySkill: (skill) =>
    API.get(`/users/volunteers/skill/${skill}`),
}

// ── Task API ─────────────────────────────────────────────────
export const taskAPI = {
  getAll: (params) =>
    API.get('/tasks', { params }),

  getById: (id) =>
    API.get(`/tasks/${id}`),

  create: (data) =>
    API.post('/tasks/create', data),

  update: (id, data) =>
    API.put(`/tasks/${id}`, data),

  delete: (id) =>
    API.delete(`/tasks/${id}`),

  updateStatus: (id, status) =>
    API.patch(`/tasks/${id}/status`, { status }),

  accept: (id, volunteerData) =>
    API.patch(`/tasks/${id}/accept`, volunteerData || {}),

  assign: (id) =>
    API.post(`/tasks/assign/${id}`),

  getStats: () =>
    API.get('/tasks/stats'),

  getHighPriority: () =>
    API.get('/tasks/high-priority'),

  getByPriority: () =>
    API.get('/tasks/priority'),

  getMatches: (id) =>
    API.get(`/tasks/matches/${id}`),

  getMyTasks: () =>
    API.get('/tasks/my-tasks'),
}

// ── Volunteer API ────────────────────────────────────────────
export const volunteerAPI = {
  getAll: () =>
    API.get('/volunteers'),
}

// ── Notification API ─────────────────────────────────────────
export const notificationAPI = {
  getNotifications: () =>
    API.get('/notifications'),

  sendInvitation: (data) =>
    API.post('/notifications/invite', data),

  respondToInvitation: (id, status) =>
    API.patch(`/notifications/${id}/respond`, { status }),

  getUnreadCount: () =>
    API.get('/notifications/count'),

  getInvitations: () =>
    API.get('/notifications/invitations'),

  markAsRead: () =>
    API.patch('/notifications/read'),
}

// ── Task Request API ─────────────────────────────────────────
export const taskRequestAPI = {
  // Get list of all volunteers (for NGO to browse)
  getVolunteers: () =>
    API.get('/task-requests/volunteers'),

  // Send invitation to a volunteer
  sendInvitation: (data) =>
    API.post('/task-requests/invite', data),

  // Get invitations sent by NGO
  getNGORequests: () =>
    API.get('/task-requests/ngo'),

  // Get invitations received by volunteer
  getVolunteerRequests: () =>
    API.get('/task-requests/volunteer'),

  // Accept an invitation
  acceptInvitation: (requestId) =>
    API.post(`/task-requests/${requestId}/accept`),

  // Reject an invitation
  rejectInvitation: (requestId) =>
    API.post(`/task-requests/${requestId}/reject`),
}

// ── Chat API ─────────────────────────────────────────────────
export const chatAPI = {
  sendMessage: (chatId, data) =>
    API.post(`/chats/${chatId}/messages`, data),

  deleteChat: (chatId) =>
    API.delete(`/chats/${chatId}`),
}

// ── Data API ─────────────────────────────────────────────────
export const dataAPI = {
  collect: (formData) =>
    API.post('/data/collect', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
}

// ── OCR API ──────────────────────────────────────────────────
export const ocrAPI = {
  upload: (formData) =>
    API.post('/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
}

export default API

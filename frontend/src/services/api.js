import axios from 'axios'
import { auth } from '../config/firebase'
import { signOut } from 'firebase/auth'

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0',
  },
})

const TOKEN_STORAGE_KEY = 'authToken'

const getStoredToken = () => localStorage.getItem(TOKEN_STORAGE_KEY)
const setStoredToken = (token) => token ? localStorage.setItem(TOKEN_STORAGE_KEY, token) : localStorage.removeItem(TOKEN_STORAGE_KEY)

// ── Request Interceptor: attach Firebase ID token + cache-bust GETs ──
API.interceptors.request.use(
  async (config) => {
    try {
      let token = getStoredToken()

      if (!token && auth.currentUser) {
        token = await auth.currentUser.getIdToken()
        setStoredToken(token)
      }

      if (token) {
        config.headers.Authorization = `Bearer ${token}`
      }
    } catch (error) {
      console.error('Error getting auth token for request:', error)
      setStoredToken(null)
    }

    // Add cache-busting timestamp to GET requests
    if (config.method === 'get') {
      config.params = { ...config.params, _t: Date.now() }
    }
    return config
  },
  (error) => Promise.reject(error)
)

// ── Response Interceptor: handle 401 ─────────────────────────
API.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      setStoredToken(null)
      try {
        await signOut(auth)
      } catch (signOutError) {
        console.warn('Failed to sign out after 401:', signOutError)
      }

      if (
        !window.location.pathname.includes('/login') &&
        !window.location.pathname.includes('/signup')
      ) {
        window.location.href = '/login'
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

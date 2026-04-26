import { useState, useEffect, lazy, Suspense } from 'react'
import {
  CheckCircle,
  ListTodo,
  Clock,
  XCircle,
  Loader2,
  AlertCircle,
  Filter,
  X,
  Search,
  Bell,
} from 'lucide-react'
import VolunteerTaskCard from '../components/VolunteerTaskCard'
import TaskDetailsModal from '../components/TaskDetailsModal'
import TaskInvitationsModal from '../components/TaskInvitationsModal'
import NotificationBell from '../components/NotificationBell'
import { useVolunteer } from '../context/VolunteerContext'
import { useAuth } from '../context/AuthContext'
import { taskAPI } from '../services/api'
import { auth } from '../config/firebase'
import { safeLower } from '../utils/stringUtils'

// Lazy load MapView to avoid React-Leaflet issues
const MapView = lazy(() => import('../components/MapView'))

// Common Indian states for filter options
const STATE_OPTIONS = [
  'All States',
  'Madhya Pradesh',
  'Maharashtra',
  'Delhi',
  'Gujarat',
  'Uttar Pradesh',
  'Rajasthan',
  'Tamil Nadu',
  'Karnataka',
  'West Bengal',
  'Andhra Pradesh',
  'Telangana',
  'Kerala',
  'Punjab',
  'Haryana',
  'Other',
]

import { TASK_CATEGORIES } from '../constants/categories'

const CATEGORY_OPTIONS = [
  { value: '', label: 'All Categories' },
  ...TASK_CATEGORIES.map(cat => ({ value: cat, label: cat }))
]

// Extract state from Nominatim address string
const extractState = (address) => {
  if (!address) return 'Other'
  const statePatterns = STATE_OPTIONS.filter(s => s !== 'All States')
  for (const state of statePatterns) {
    if (safeLower(address).includes(safeLower(state))) {
      return state
    }
  }
  return 'Other'
}

const VolunteerDashboard = () => {
  const { isAuthenticated, loading: authLoading } = useAuth()
  const [availableTasks, setAvailableTasks] = useState([])
  const [isLoadingTasks, setIsLoadingTasks] = useState(true)
  const { myTasks, addTask } = useVolunteer()
  const [feedback, setFeedback] = useState({ show: false, message: '', type: '' })
  const [isLoading, setIsLoading] = useState(false)
  const [filters, setFilters] = useState({
    priority: '',
    category: '',
    location: '',
  })
  const [selectedTask, setSelectedTask] = useState(null)
  const [showInvitations, setShowInvitations] = useState(false)

  // ── DEBUG: Log selected task changes ───────────────────────
  useEffect(() => {
    if (selectedTask) {
      console.log('✅ Selected Task:', {
        id: selectedTask.id,
        title: selectedTask.title,
        hasLocation: !!selectedTask.location,
        hasLat: !!selectedTask.lat,
        hasLng: !!selectedTask.lng,
        ngo: selectedTask.ngo,
      })
    }
  }, [selectedTask])

  const filteredTasks = availableTasks.filter(task => {
    return (
      (!filters.priority || task.priority === filters.priority) &&
      (!filters.category || task.category === filters.category) &&
      (!filters.location || safeLower(task.location).includes(safeLower(filters.location)))
    )
  })

  // ── Fetch available (pending) tasks — waits for auth to be ready ─────────────
  useEffect(() => {
    // Guard: do NOT fetch until Firebase auth is confirmed
    if (authLoading || !isAuthenticated) return
    fetchAvailableTasks()
  }, [isAuthenticated, authLoading])

  const fetchAvailableTasks = async () => {
    setIsLoadingTasks(true)
    try {
      const res = await taskAPI.getAll({ status: 'pending' })
      const tasks = (res.data.data || []).map((t) => ({
        ...t,
        priority: t.severity >= 7 ? 'High' : t.severity >= 4 ? 'Medium' : 'Low',
        location: t.location?.address || 'Unknown',
        lat: t.location?.lat,
        lng: t.location?.lng,
        estimatedTime: t.urgency >= 7 ? '6-8 hours' : t.urgency >= 4 ? '4-5 hours' : '2-3 hours',
        acceptedVolunteers: t.acceptedVolunteers || [],
        maxVolunteers: t.maxVolunteers || 10,
        ngo: t.ngo || {
          name: t.ngoName || 'Unknown Organization',
          email: t.ngoEmail,
          phone: t.ngoPhone,
        },
      }))
      setAvailableTasks(tasks)
    } catch {
      showFeedback('Failed to load tasks', 'error')
    } finally {
      setIsLoadingTasks(false)
    }
  }

  const showFeedback = (message, type) => {
    setFeedback({ show: true, message, type })
    setTimeout(() => {
      setFeedback({ show: false, message: '', type: '' })
    }, 3000)
  }

  const handleAccept = async (taskId) => {
    setIsLoading(true)
    try {
      const currentUser = auth.currentUser
      const volunteerData = {
        name: currentUser?.displayName || 'Volunteer',
        email: currentUser?.email || '',
        phone: currentUser?.phoneNumber || '',
      }

      console.log('📝 Accepting task with volunteer data:', volunteerData)

      await taskAPI.accept(taskId, volunteerData)
      const task = availableTasks.find((t) => t.id === taskId)
      if (task) {
        addTask(task)
        setAvailableTasks((prev) => prev.filter((t) => t.id !== taskId))
        showFeedback('Task Accepted!', 'success')
      }
    } catch (err) {
      showFeedback(err.response?.data?.message || 'Failed to accept task', 'error')
    } finally {
      setIsLoading(false)
    }
  }

  const handleReject = (taskId) => {
    setAvailableTasks((prev) => prev.filter((t) => t.id !== taskId))
    showFeedback('Task dismissed', 'info')
  }

  const stats = [
    {
      label: 'Available Tasks',
      value: availableTasks.length,
      color: 'bg-blue-500/10 text-blue-400 ring-1 ring-blue-500/20',
    },
    {
      label: 'My Tasks',
      value: myTasks.length,
      color: 'bg-yellow-500/10 text-yellow-400 ring-1 ring-yellow-500/20',
    },
    {
      label: 'Completed',
      value: myTasks.filter((t) => t.status === 'Completed').length,
      color: 'bg-green-500/10 text-green-400 ring-1 ring-green-500/20',
    },
  ]

  return (
    <div className="p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-end mb-8">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowInvitations(true)}
              className="flex items-center gap-2 px-4 py-2 bg-brand-600 text-white font-medium rounded-xl hover:bg-brand-500 transition-all"
            >
              <Bell className="w-4 h-4" />
              Invitations
            </button>
            <NotificationBell role="volunteer" />
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {stats.map((stat, index) => (
            <div
              key={index}
              className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-zinc-400 mb-1">{stat.label}</p>
                  <p className="text-3xl font-bold text-zinc-50">
                    {stat.value}
                  </p>
                </div>
                <div
                  className={`w-12 h-12 rounded-xl ${stat.color} flex items-center justify-center`}
                >
                  {index === 0 && <ListTodo className="w-6 h-6" />}
                  {index === 1 && <Clock className="w-6 h-6" />}
                  {index === 2 && <CheckCircle className="w-6 h-6" />}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Feedback Toast */}
        {feedback.show && (
          <div
            className={`fixed top-20 right-8 px-6 py-3 rounded-xl shadow-lg flex items-center gap-3 animate-fade-in z-50 bg-zinc-900 border ${
              feedback.type === 'success'
                ? 'text-green-400 border-green-500/20'
                : feedback.type === 'error'
                ? 'text-red-400 border-red-500/20'
                : 'text-blue-400 border-blue-500/20'
            }`}
          >
            {feedback.type === 'success' ? (
              <CheckCircle className="w-5 h-5" />
            ) : feedback.type === 'error' ? (
              <AlertCircle className="w-5 h-5" />
            ) : (
              <XCircle className="w-5 h-5" />
            )}
            <span className="font-medium">{feedback.message}</span>
          </div>
        )}

        {/* Available Tasks Section */}
        <section>
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-zinc-50 flex items-center gap-2">
              <span className="w-2 h-2 bg-brand-500 rounded-full" />
              Available Tasks
            </h2>
          </div>

          {/* Filter Bar */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 mb-6 flex flex-col md:flex-row gap-4 shadow-sm">
            {/* Priority */}
            <div className="flex-1">
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">Priority</label>
              <select
                value={filters.priority}
                onChange={(e) => setFilters({ ...filters, priority: e.target.value })}
                className="w-full bg-zinc-950 text-zinc-50 border border-zinc-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-brand-500 transition-colors"
              >
                <option value="">All Priorities</option>
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
            </div>
            
            {/* Category */}
            <div className="flex-1">
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">Category</label>
              <select
                value={filters.category}
                onChange={(e) => setFilters({ ...filters, category: e.target.value })}
                className="w-full bg-zinc-950 text-zinc-50 border border-zinc-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-brand-500 transition-colors"
              >
                {CATEGORY_OPTIONS.map(cat => (
                  <option key={cat.value} value={cat.value}>{cat.label}</option>
                ))}
              </select>
            </div>
            
            {/* Location */}
            <div className="flex-1">
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">Location</label>
              <div className="relative">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-zinc-500" />
                <input
                  type="text"
                  placeholder="Search city/state..."
                  value={filters.location}
                  onChange={(e) => setFilters({ ...filters, location: e.target.value })}
                  className="w-full bg-zinc-950 text-zinc-50 placeholder-zinc-600 border border-zinc-800 rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-brand-500 transition-colors"
                />
              </div>
            </div>

            {/* Reset Button */}
            <div className="flex items-end">
              <button
                onClick={() => setFilters({ priority: '', category: '', location: '' })}
                className="w-full md:w-auto px-4 py-2 text-sm text-zinc-400 font-medium hover:text-white bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <Filter className="w-4 h-4" />
                Reset
              </button>
            </div>
          </div>

          {isLoadingTasks ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-8 h-8 text-zinc-500 animate-spin" />
            </div>
          ) : filteredTasks.length === 0 ? (
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-12 text-center shadow-sm">
              <CheckCircle className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
              <p className="text-zinc-400">
                {availableTasks.length === 0 
                  ? "No available tasks at the moment. Check back later!" 
                  : "No tasks match your exact filters."}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {!availableTasks || !Array.isArray(availableTasks) ? (
                <p className="text-zinc-400 text-sm">Loading tasks...</p>
              ) : (
                filteredTasks?.map((task, index) => (
                  <VolunteerTaskCard
                    key={task?._id || task?.id || index}
                    task={task}
                    onAccept={handleAccept}
                    onReject={handleReject}
                    onViewDetails={setSelectedTask}
                  />
                ))
              )}
            </div>
          )}
        </section>
      </div>

      {/* Task Details Modal with Lazy-Loaded Map */}
      {selectedTask ? (
        <TaskDetailsModal 
          task={selectedTask} 
          onClose={() => {
            console.log('🔒 Closing modal')
            setSelectedTask(null)
          }}
          mapComponent={
            selectedTask?.lat && selectedTask?.lng ? (
              <Suspense fallback={<div className="h-64 w-full flex items-center justify-center bg-zinc-800/50 rounded-xl"><p className="text-zinc-400">Loading map...</p></div>}>
                <MapView
                  lat={Number(selectedTask.lat)}
                  lng={Number(selectedTask.lng)}
                  title={selectedTask.title}
                  address={selectedTask.location}
                />
              </Suspense>
            ) : null
          }
        />
      ) : null}

      {/* Task Invitations Modal */}
      {showInvitations && (
        <TaskInvitationsModal onClose={() => setShowInvitations(false)} />
      )}
    </div>
  )
}

export default VolunteerDashboard
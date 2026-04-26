import { useState, useEffect } from 'react'
import {
  ListTodo,
  AlertTriangle,
  CheckCircle,
  Plus,
  Loader2,
  AlertCircle,
  Users,
} from 'lucide-react'
import TaskCard from '../components/TaskCard'
import NotificationBell from '../components/NotificationBell'
import LocationPicker from '../components/LocationPicker'
import AssignVolunteerModal from '../components/AssignVolunteerModal'
import { taskAPI } from '../services/api'
import { useAuth } from '../context/AuthContext'
import { db } from '../config/firebase'
import { collection, query, onSnapshot, orderBy } from 'firebase/firestore'

import { TASK_CATEGORIES } from '../constants/categories'

const NGODashboard = () => {
  const { isAuthenticated, loading: authLoading } = useAuth()
  const [tasks, setTasks] = useState([])
  const [stats, setStats] = useState({ total: 0, highPriority: 0, completed: 0, activeVolunteers: 0 })
  const [showForm, setShowForm] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoadingTasks, setIsLoadingTasks] = useState(true)
  const [error, setError] = useState('')
  const [successMsg, setSuccessMsg] = useState('')
  const [selectedTaskForAssign, setSelectedTaskForAssign] = useState(null)
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    category: TASK_CATEGORIES[0],
    severity: 5,
    peopleAffected: '',
    urgency: 5,
    location: null,
    volunteersNeeded: 1,
  })
  const [errors, setErrors] = useState({})

  // ── Real-time listener for tasks — waits for auth to be ready ───────────────
  useEffect(() => {
    // Do NOT fetch until Firebase auth is confirmed
    if (authLoading || !isAuthenticated) return

    fetchStats()
    
    const q = query(collection(db, 'tasks'), orderBy('createdAt', 'desc'))
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const taskList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
      setTasks(taskList)
      setIsLoadingTasks(false)
    }, (err) => {
      console.error("Firestore error:", err)
      setError("Failed to sync tasks in real-time")
      setIsLoadingTasks(false)
    })

    const statsInterval = setInterval(fetchStats, 30000)
    return () => {
      unsubscribe()
      clearInterval(statsInterval)
    }
  }, [isAuthenticated, authLoading])

  const fetchStats = async () => {
    try {
      const res = await taskAPI.getStats()
      const data = res.data.data
      setStats({
        total: data.total || 0,
        highPriority: data.highPriority || 0,
        completed: data.completed || 0,
        activeVolunteers: data.activeVolunteers || 0,
      })
    } catch {
      // Stats are non-critical
    }
  }

  const showSuccess = (msg) => {
    setSuccessMsg(msg)
    setTimeout(() => setSuccessMsg(''), 3000)
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setNewTask((prev) => ({ ...prev, [name]: value }))
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }))
    }
  }

  const validateForm = () => {
    const newErrors = {}
    if (!newTask.title.trim()) {
      newErrors.title = 'Title is required'
    }
    if (!newTask.description.trim()) {
      newErrors.description = 'Description is required'
    }
    if (!newTask.peopleAffected || newTask.peopleAffected <= 0) {
      newErrors.peopleAffected = 'Enter valid number'
    }
    if (!newTask.volunteersNeeded || newTask.volunteersNeeded < 1) {
      newErrors.volunteersNeeded = 'Enter valid number'
    }
    if (!newTask.location) {
      newErrors.location = 'Location is required'
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleCreateTask = async (e) => {
    e.preventDefault()
    if (!validateForm()) return

    setIsSubmitting(true)
    try {
      const payload = {
        title: newTask.title,
        description: newTask.description,
        category: newTask.category,
        severity: parseInt(newTask.severity),
        urgency: parseInt(newTask.urgency),
        peopleAffected: parseInt(newTask.peopleAffected),
        location: newTask.location,
        volunteersNeeded: parseInt(newTask.volunteersNeeded),
      }

      await taskAPI.create(payload)

      setNewTask({
        title: '',
        description: '',
        category: TASK_CATEGORIES[0],
        severity: 5,
        peopleAffected: '',
        urgency: 5,
        location: null,
        volunteersNeeded: 1,
      })
      setShowForm(false)
      showSuccess('Task created successfully!')

      // Refresh data
      fetchTasks()
      fetchStats()
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create task')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleAssign = (taskId) => {
    const task = tasks.find(t => t.id === taskId)
    if (task) {
      setSelectedTaskForAssign(task)
    }
  }

  const statCards = [
    {
      label: 'Total Tasks',
      value: stats.total,
      icon: ListTodo,
      color: 'bg-blue-500/10 text-blue-400 ring-1 ring-blue-500/20',
    },
    {
      label: 'High Priority',
      value: stats.highPriority,
      icon: AlertTriangle,
      color: 'bg-red-500/10 text-red-400 ring-1 ring-red-500/20',
    },
    {
      label: 'Completed',
      value: stats.completed,
      icon: CheckCircle,
      color: 'bg-green-500/10 text-green-400 ring-1 ring-green-500/20',
    },
    {
      label: 'Volunteers',
      value: stats.activeVolunteers,
      icon: Users,
      color: 'bg-purple-500/10 text-purple-400 ring-1 ring-purple-500/20',
    },
  ]

  return (
    <div className="p-8">
      <div className="max-w-6xl mx-auto">
        {/* Success Toast */}
        {successMsg && (
          <div className="fixed top-20 right-8 px-6 py-3 rounded-xl shadow-lg flex items-center gap-3 z-50 bg-zinc-900 border text-green-400 border-green-500/20 animate-fade-in">
            <CheckCircle className="w-5 h-5" />
            <span className="font-medium">{successMsg}</span>
          </div>
        )}

        {/* Error Toast */}
        {error && (
          <div className="fixed top-20 right-8 px-6 py-3 rounded-xl shadow-lg flex items-center gap-3 z-50 bg-zinc-900 border text-red-400 border-red-500/20 animate-fade-in">
            <AlertCircle className="w-5 h-5" />
            <span className="font-medium">{error}</span>
            <button onClick={() => setError('')} className="text-zinc-500 hover:text-zinc-300 ml-2">✕</button>
          </div>
        )}

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div /> {/* Spacing container */}
          <div className="flex items-center gap-3">
            <NotificationBell role="ngo" />
            <button
              onClick={() => setShowForm(!showForm)}
              className="flex items-center gap-2 px-5 py-2.5 bg-brand-600 text-white font-medium rounded-xl hover:bg-brand-500 transition-all shadow-sm"
            >
              <Plus className="w-5 h-5" />
              Create Task
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {statCards.map((stat, index) => (
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
                <div className={`w-12 h-12 rounded-xl ${stat.color} flex items-center justify-center`}>
                  <stat.icon className="w-6 h-6" />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Task Creation Form */}
        {showForm && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 mb-8 shadow-sm">
            <h2 className="text-lg font-semibold text-zinc-50 mb-4">
              Create New Task
            </h2>
            <form onSubmit={handleCreateTask} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Title */}
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-1.5">
                    Title
                  </label>
                  <input
                    type="text"
                    name="title"
                    value={newTask.title}
                    onChange={handleInputChange}
                    placeholder="Task title"
                    className={`w-full px-4 py-2.5 bg-zinc-950 text-zinc-50 placeholder-zinc-500 border rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all ${
                      errors.title ? 'border-red-400' : 'border-zinc-800 hover:border-zinc-700'
                    }`}
                  />
                  {errors.title && (
                    <p className="mt-1 text-sm text-red-400">{errors.title}</p>
                  )}
                </div>

                {/* Category */}
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-1.5">
                    Category
                  </label>
                  <select
                    name="category"
                    value={newTask.category}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2.5 border border-zinc-800 bg-zinc-950 text-zinc-50 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 hover:border-zinc-700 transition-all"
                  >
                    {TASK_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat} className="bg-zinc-900">
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Description */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-zinc-300 mb-1.5">
                    Description
                  </label>
                  <textarea
                    name="description"
                    value={newTask.description}
                    onChange={handleInputChange}
                    placeholder="Describe the task..."
                    rows={3}
                    className={`w-full px-4 py-2.5 bg-zinc-950 text-zinc-50 placeholder-zinc-500 border rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all resize-none ${
                      errors.description ? 'border-red-400' : 'border-zinc-800 hover:border-zinc-700'
                    }`}
                  />
                  {errors.description && (
                    <p className="mt-1 text-sm text-red-400">{errors.description}</p>
                  )}
                </div>

                {/* Severity (1-10) */}
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-1.5">
                    Severity (1-10)
                  </label>
                  <input
                    type="range"
                    name="severity"
                    min="1"
                    max="10"
                    value={newTask.severity}
                    onChange={handleInputChange}
                    className="w-full accent-brand-500"
                  />
                  <div className="flex justify-between text-xs text-zinc-500 mt-1">
                    <span>Low</span>
                    <span className="text-zinc-300 font-semibold">{newTask.severity}</span>
                    <span>Critical</span>
                  </div>
                </div>

                {/* Urgency (1-10) */}
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-1.5">
                    Urgency (1-10)
                  </label>
                  <input
                    type="range"
                    name="urgency"
                    min="1"
                    max="10"
                    value={newTask.urgency}
                    onChange={handleInputChange}
                    className="w-full accent-brand-500"
                  />
                  <div className="flex justify-between text-xs text-zinc-500 mt-1">
                    <span>Low</span>
                    <span className="text-zinc-300 font-semibold">{newTask.urgency}</span>
                    <span>Critical</span>
                  </div>
                </div>

                {/* People Affected */}
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-1.5">
                    People Affected
                  </label>
                  <input
                    type="number"
                    name="peopleAffected"
                    value={newTask.peopleAffected}
                    onChange={handleInputChange}
                    placeholder="0"
                    min="1"
                    className={`w-full px-4 py-2.5 bg-zinc-950 text-zinc-50 placeholder-zinc-500 border rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all ${
                      errors.peopleAffected
                        ? 'border-red-400'
                        : 'border-zinc-800 hover:border-zinc-700'
                    }`}
                  />
                  {errors.peopleAffected && (
                    <p className="mt-1 text-sm text-red-400">
                      {errors.peopleAffected}
                    </p>
                  )}
                </div>
                {/* Volunteers Needed */}
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-1.5">
                    Volunteers Needed
                  </label>
                  <input
                    type="number"
                    name="volunteersNeeded"
                    value={newTask.volunteersNeeded}
                    onChange={handleInputChange}
                    placeholder="1"
                    min="1"
                    className={`w-full px-4 py-2.5 bg-zinc-950 text-zinc-50 placeholder-zinc-500 border rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all ${
                      errors.volunteersNeeded
                        ? 'border-red-400'
                        : 'border-zinc-800 hover:border-zinc-700'
                    }`}
                  />
                  {errors.volunteersNeeded && (
                    <p className="mt-1 text-sm text-red-400">
                      {errors.volunteersNeeded}
                    </p>
                  )}
                </div>

                {/* Location */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-zinc-300 mb-1.5">
                    Location
                  </label>
                  <LocationPicker
                    selectedLocation={newTask.location}
                    onLocationSelect={(loc) => setNewTask(prev => ({ ...prev, location: loc }))}
                    error={errors.location}
                  />
                </div>
              </div>

              {/* Form Actions */}
              <div className="flex justify-end gap-3 pt-4 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-5 py-2.5 text-zinc-400 font-medium rounded-xl hover:bg-zinc-800 hover:text-zinc-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center gap-2 px-5 py-2.5 bg-brand-600 text-white font-medium rounded-xl hover:bg-brand-700 transition-colors disabled:opacity-70"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    'Create Task'
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Task List */}
        <div>
          <h2 className="text-lg font-semibold text-zinc-50 mb-4">
            Recent Tasks
          </h2>
          {isLoadingTasks ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-8 h-8 text-zinc-500 animate-spin" />
            </div>
          ) : tasks.length === 0 ? (
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-12 text-center">
              <ListTodo className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
              <p className="text-zinc-400">No tasks yet. Create your first task!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Array.isArray(tasks) && tasks.map((task) => (
                <TaskCard key={task.id} task={task} onAssign={handleAssign} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Assignment Modal */}
      {selectedTaskForAssign && (
        <AssignVolunteerModal
          task={selectedTaskForAssign}
          onClose={() => setSelectedTaskForAssign(null)}
          onAssigned={() => {
            setSelectedTaskForAssign(null)
            showSuccess('Invitation sent successfully!')
          }}
        />
      )}
    </div>
  )
}

export default NGODashboard

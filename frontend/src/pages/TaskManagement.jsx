import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, ListTodo, AlertTriangle, CheckCircle, Loader2 } from 'lucide-react'
import FilterBar from '../components/FilterBar'
import TaskTable from '../components/TaskTable'
import TaskDetailsModal from '../components/TaskDetailsModal'
import EditTaskModal from '../components/EditTaskModal'
import { taskAPI } from '../services/api'
import { safeLower } from '../utils/stringUtils'

const TaskManagement = () => {
  const navigate = useNavigate()
  const [tasks, setTasks] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedTask, setSelectedTask] = useState(null)
  const [editingTask, setEditingTask] = useState(null)
  const [isViewingTask, setIsViewingTask] = useState(false)
  const [filters, setFilters] = useState({
    priority: 'All',
    status: 'All',
    category: 'All',
  })

  // ── Fetch tasks on mount ─────────────────────────────────────
  useEffect(() => {
    fetchTasks()
  }, [])

  const fetchTasks = async () => {
    setIsLoading(true)
    try {
      const res = await taskAPI.getAll()
      const apiTasks = (res.data.data || []).map((t) => ({
        ...t,
        id: t.id,
        title: t.title,
        category: t.category || 'other',
        priority: t.severity >= 7 ? 'High' : t.severity >= 4 ? 'Medium' : 'Low',
        status: (t.status || 'pending').charAt(0).toUpperCase() + (t.status || 'pending').slice(1),
        location: t.location?.address || 'Unknown',
      }))
      setTasks(apiTasks)
    } catch {
      setTasks([])
    } finally {
      setIsLoading(false)
    }
  }

  const handleFilterChange = (filterType, value) => {
    setFilters((prev) => ({ ...prev, [filterType]: value }))
  }

  const handleDelete = async (taskId) => {
    if (!window.confirm('Are you sure you want to delete this task?')) return
    try {
      await taskAPI.delete(taskId)
      setTasks((prev) => prev.filter((task) => task.id !== taskId))
    } catch {
      alert('Failed to delete task')
    }
  }

  const handleView = async (task) => {
    try {
      setIsLoading(true)
      const res = await taskAPI.getById(task.id)
      setSelectedTask(res.data.data)
      setIsViewingTask(true)
    } catch {
      alert('Failed to fetch task details')
    } finally {
      setIsLoading(false)
    }
  }

  const handleEdit = async (task) => {
    try {
      setIsLoading(true)
      const res = await taskAPI.getById(task.id)
      setEditingTask(res.data.data)
    } catch {
      alert('Failed to fetch task for editing')
    } finally {
      setIsLoading(false)
    }
  }

  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      const matchesSearch =
        safeLower(task.title).includes(safeLower(searchQuery)) ||
        safeLower(task.category).includes(safeLower(searchQuery))

      const matchesPriority =
        filters.priority === 'All' || task.priority === filters.priority

      const matchesStatus =
        filters.status === 'All' || task.status === filters.status

      const matchesCategory =
        filters.category === 'All' || task.category === filters.category

      return matchesSearch && matchesPriority && matchesStatus && matchesCategory
    })
  }, [tasks, searchQuery, filters])

  const stats = [
    {
      label: 'Total Tasks',
      value: tasks.length,
      icon: ListTodo,
      color: 'bg-blue-500/10 text-blue-400 ring-1 ring-blue-500/20',
    },
    {
      label: 'High Priority',
      value: tasks.filter((t) => t.priority === 'High').length,
      icon: AlertTriangle,
      color: 'bg-red-500/10 text-red-400 ring-1 ring-red-500/20',
    },
    {
      label: 'Completed',
      value: tasks.filter((t) => t.status === 'Completed').length,
      icon: CheckCircle,
      color: 'bg-green-500/10 text-green-400 ring-1 ring-green-500/20',
    },
  ]

  return (
    <div className="p-8 bg-zinc-950 min-h-screen">
      <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-12">
            <div>
              <h1 className="text-3xl font-black text-zinc-50 tracking-tight">
                Task Management
              </h1>
              <p className="text-zinc-400 mt-1.5 font-medium">
                Global overview of all rescue operations and task distributions
              </p>
            </div>
            <button
              onClick={() => navigate('/ngo-dashboard')}
              className="flex items-center gap-2.5 px-6 py-3 bg-brand-600 text-white font-bold rounded-2xl hover:bg-brand-500 transition-all shadow-lg shadow-brand-500/20 active:scale-95"
            >
              <Plus className="w-5 h-5" />
              Launch Mission
            </button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            {stats.map((stat, index) => (
              <div
                key={index}
                className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl relative overflow-hidden group hover:border-zinc-700 transition-all"
              >
                <div className="absolute top-0 right-0 w-24 h-24 bg-zinc-800/20 blur-2xl rounded-full -mr-12 -mt-12 group-hover:bg-zinc-800/40 transition-colors" />
                <div className="flex items-center justify-between relative z-10">
                  <div>
                    <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-1.5">{stat.label}</p>
                    <p className="text-3xl font-black text-zinc-50 tracking-tight">
                      {stat.value}
                    </p>
                  </div>
                  <div
                    className={`w-14 h-14 rounded-2xl ${stat.color} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}
                  >
                    <stat.icon className="w-7 h-7" />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Filter Bar */}
          <div className="mb-10">
            <FilterBar
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              filters={filters}
              onFilterChange={handleFilterChange}
            />
          </div>

          {/* Task List Header */}
          <div className="mb-6 flex items-center justify-between">
            <p className="text-xs font-bold text-zinc-500 uppercase tracking-[0.2em]">
              Operational Registry <span className="mx-2 text-zinc-800">|</span> 
              <span className="text-zinc-400 ml-1">{filteredTasks.length} Active Records</span>
            </p>
          </div>

          {/* Task Table */}
          {isLoading && tasks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-32 bg-zinc-900/30 border border-zinc-800 border-dashed rounded-3xl">
              <Loader2 className="w-10 h-10 text-brand-500/50 animate-spin mb-4" />
              <p className="text-zinc-500 font-bold uppercase tracking-widest text-xs">Accessing Database...</p>
            </div>
          ) : (
            <div className="bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden shadow-2xl relative">
               {isLoading && (
                 <div className="absolute inset-0 bg-zinc-950/40 backdrop-blur-[2px] z-10 flex items-center justify-center">
                    <Loader2 className="w-8 h-8 text-brand-500 animate-spin" />
                 </div>
               )}
               <TaskTable 
                 tasks={filteredTasks} 
                 onDelete={handleDelete} 
                 onView={handleView} 
                 onEdit={handleEdit}
               />
            </div>
          )}
        </div>

      {/* Details Modal */}
      {isViewingTask && (
        <TaskDetailsModal 
          task={selectedTask} 
          onClose={() => {
            setIsViewingTask(false)
            setSelectedTask(null)
          }} 
        />
      )}

      {/* Edit Modal */}
      {editingTask && (
        <EditTaskModal
          task={editingTask}
          onClose={() => setEditingTask(null)}
          onSuccess={fetchTasks}
        />
      )}
    </div>
  )
}

export default TaskManagement

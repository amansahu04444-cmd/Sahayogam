import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Filter, X, ArrowLeft, Loader2 } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import Heatmap from '../components/Heatmap'
import { taskAPI } from '../services/api'
import { TASK_CATEGORIES } from '../constants/categories'

const MapPage = () => {
  const navigate = useNavigate()
  const { user } = useAuth() || {}
  const [showFilters, setShowFilters] = useState(false)
  const [tasks, setTasks] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  const [isMounted, setIsMounted] = useState(false)
  useEffect(() => {
    const raf = requestAnimationFrame(() => setIsMounted(true))
    return () => cancelAnimationFrame(raf)
  }, [])

  const role = user?.role

  const fetchTasks = async () => {
    setIsLoading(true)
    try {
      const res = await taskAPI.getAll()
      const allTasks = res.data.data || []
      
      // Filter out completed tasks for the map
      const activeTasks = allTasks.filter(t => t.status !== 'completed')
      
      const apiTasks = activeTasks.map((t) => {
        const lat = parseFloat(t.location?.lat)
        const lng = parseFloat(t.location?.lng)
        return {
          id: t.id,
          title: t.title,
          priority: t.severity >= 7 ? 'High' : t.severity >= 4 ? 'Medium' : 'Low',
          category: t.category || 'other',
          latitude: !isNaN(lat) ? lat : null,
          longitude: !isNaN(lng) ? lng : null,
          location: t.location?.address || 'Unknown',
          description: t.description || '',
          createdAt: t.createdAt
        }
      })
      setTasks(apiTasks)
    } catch {
      setTasks([])
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchTasks()
    
    // Listen for task updates (e.g. from MyTasksPage)
    const handleUpdate = () => {
      console.log('[Map] Received taskUpdated event, refreshing data...')
      fetchTasks()
    }
    
    window.addEventListener('taskUpdated', handleUpdate)
    return () => window.removeEventListener('taskUpdated', handleUpdate)
  }, [])

  const handleBack = () => {
    if (role === 'ngo') {
      navigate('/ngo-dashboard')
    } else if (role === 'volunteer') {
      navigate('/volunteer-dashboard')
    } else {
      navigate('/')
    }
  }

  const [filters, setFilters] = useState({
    priority: 'All',
    category: 'All',
  })


  const priorities = ['All', 'High', 'Medium', 'Low']
  const categories = ['All', ...TASK_CATEGORIES]

  const handleFilterChange = (type, value) => {
    setFilters((prev) => ({ ...prev, [type]: value }))
  }

  const clearFilters = () => {
    setFilters({ priority: 'All', category: 'All' })
  }

  const hasActiveFilters = filters.priority !== 'All' || filters.category !== 'All'

  return (
    <div className="h-screen w-screen flex flex-col bg-zinc-950 text-white font-sans">
      {/* Minimal Top Bar (Dark Theme) */}
      <div className="absolute top-0 left-0 right-0 z-[1000] bg-zinc-950/80 backdrop-blur-md border-b border-zinc-800 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* Back Button */}
            <button
              onClick={handleBack}
              className="p-2 rounded-lg hover:bg-zinc-800 transition flex items-center gap-2 text-zinc-400 hover:text-zinc-50"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="text-sm font-medium">Back</span>
            </button>

            {/* Logo */}
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 flex items-center justify-center">
                <img src="/logo.png" alt="Sahayogam Logo" className="w-full h-full object-contain drop-shadow-[0_0_10px_rgba(20,184,166,0.6)]" />
              </div>
              <div className="flex flex-col">
                <span className="text-lg font-bold text-zinc-50 leading-tight">
                  Sahayogam
                </span>
                <span className="text-xs text-brand-500 font-medium -mt-1">
                  सहयोगम्
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Filter Toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all shadow-sm ${
                showFilters || hasActiveFilters
                  ? 'bg-brand-600 text-white'
                  : 'bg-zinc-900 border border-zinc-700 text-zinc-300 hover:bg-zinc-800'
              }`}
            >
              <Filter className="w-4 h-4" />
              Filters
            </button>
          </div>
        </div>
      </div>

      {/* Filter Panel (Dark Theme) */}
      {showFilters && (
        <div className="absolute top-16 right-4 z-[1000] bg-zinc-900 rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.5)] border border-zinc-800 p-5 w-80">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-semibold text-zinc-50">Filter Map</h3>
            <button
              onClick={() => setShowFilters(false)}
              className="p-1.5 rounded-md text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Priority Filter */}
          <div className="mb-5">
            <label className="block text-sm font-medium text-zinc-400 mb-2">
              Priority Level
            </label>
            <div className="flex flex-wrap gap-2">
              {priorities.map((p) => (
                <button
                  key={p}
                  onClick={() => handleFilterChange('priority', p)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                    filters.priority === p
                      ? 'bg-brand-600 text-white shadow-md'
                      : 'bg-zinc-950 border border-zinc-800 text-zinc-400 hover:border-zinc-600 hover:text-zinc-200'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          {/* Category Filter */}
          <div className="mb-5">
            <label className="block text-sm font-medium text-zinc-400 mb-2">
              Task Category
            </label>
            <div className="flex flex-wrap gap-2">
              {categories.map((c) => (
                <button
                  key={c}
                  onClick={() => handleFilterChange('category', c)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                    filters.category === c
                      ? 'bg-brand-600 text-white shadow-md'
                      : 'bg-zinc-950 border border-zinc-800 text-zinc-400 hover:border-zinc-600 hover:text-zinc-200'
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          {/* Clear Filters */}
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="w-full py-2.5 mt-2 text-sm text-red-400 font-medium hover:bg-red-500/10 border border-transparent hover:border-red-500/20 rounded-lg transition-colors"
            >
              Clear All Filters
            </button>
          )}
        </div>
      )}

      {/* Map Container */}
      <div className="flex-1 pt-14" style={{ minHeight: 0 }}>
        {isLoading ? (
          <div className="w-full h-full flex flex-col items-center justify-center bg-zinc-950">
            <Loader2 className="w-8 h-8 animate-spin text-brand-500 mb-4" />
            <span className="text-zinc-400 font-medium animate-pulse">Initializing Predictive Heatmap...</span>
          </div>
        ) : isMounted ? (
          <Heatmap tasks={tasks} filters={filters} />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-zinc-950">
            <Loader2 className="w-6 h-6 animate-spin text-zinc-500" />
          </div>
        )}
      </div>
    </div>
  )
}

export default MapPage

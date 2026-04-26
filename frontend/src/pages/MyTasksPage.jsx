import { Clock, CheckCircle } from 'lucide-react'
import { useState, useEffect } from 'react'
import MyTaskCard from '../components/MyTaskCard'
import { taskAPI } from '../services/api'
import { auth } from '../config/firebase'
import { useVolunteer } from '../context/VolunteerContext'

const MyTasksPage = () => {
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const { completeTask } = useVolunteer()

  // Fetch accepted tasks from backend on mount
  useEffect(() => {
    const fetchMyTasks = async () => {
      try {
        const response = await taskAPI.getMyTasks()
        console.log('[MyTasks] Fetched tasks from backend:', response.data.data)

        // Transform Firestore tasks to include local status tracking
        const transformedTasks = response.data.data.map(task => {
          const myAcceptance = task.acceptedVolunteers?.find(v =>
            (typeof v === 'object' ? v.id : v) === auth.currentUser?.uid
          )
          return {
            ...task,
            status: task.status === 'completed' ? 'Completed' : 
                    task.status === 'assigned' ? 'Accepted' : 'Accepted',
            completedAt: task.status === 'completed' ? new Date().toLocaleDateString() : null,
            acceptedAt: myAcceptance?.acceptedAt || null,
          }
        })

        setTasks(transformedTasks)
      } catch (error) {
        console.error('[MyTasks] Error fetching tasks:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchMyTasks()
  }, [])

  const handleCompleteTask = async (taskId) => {
    try {
      // Update status on backend
      await taskAPI.updateStatus(taskId, 'completed')
      
      // Update global context state (for dashboard stats)
      completeTask(taskId)

      // Remove from active My Tasks list
      setTasks(prev => prev.filter(task => task.id !== taskId))

      // 🔥 Trigger map update event for other components
      window.dispatchEvent(new Event('taskUpdated'))
      console.log('[MyTasks] Task completion event dispatched')
    } catch (error) {
      console.error('[MyTasks] Error completing task:', error)
    }
  }


  return (
    <div className="p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white/95">My Tasks</h1>
          <p className="text-gray-400 mt-1">
            Track and complete your accepted tasks
          </p>
        </div>

        {/* My Tasks Section */}
        <section>
          {loading ? (
            <div className="bg-white/5 border border-white/10 rounded-xl p-12 text-center backdrop-blur-xl">
              <Clock className="w-12 h-12 text-gray-600 mx-auto mb-4 animate-spin" />
              <p className="text-gray-400">Loading your tasks...</p>
            </div>
          ) : tasks.length === 0 ? (
            <div className="bg-white/5 border border-white/10 rounded-xl p-12 text-center backdrop-blur-xl">
              <Clock className="w-12 h-12 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400">
                You haven't accepted any tasks yet.
              </p>
              <p className="text-gray-500 text-sm mt-2">
                Browse available tasks from the Dashboard to get started.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {tasks.map((task) => (
                <MyTaskCard
                  key={task.id}
                  task={task}
                  onComplete={() => handleCompleteTask(task.id)}
                />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}

export default MyTasksPage
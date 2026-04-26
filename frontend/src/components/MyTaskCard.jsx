import { useNavigate } from 'react-router-dom'
import { MapPin, Clock, CheckCircle, MessageCircle } from 'lucide-react'
import { auth } from '../config/firebase'
import { useAuth } from '../context/AuthContext'
import { useChat } from '../context/ChatContext'

const statusColors = {
  Accepted: 'bg-blue-500/10 text-blue-400 ring-1 ring-blue-500/20',
  'In Progress': 'bg-yellow-500/10 text-yellow-400 ring-1 ring-yellow-500/20',
  Completed: 'bg-green-500/10 text-green-400 ring-1 ring-green-500/20',
}

const MyTaskCard = ({ task, onComplete }) => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { getOrCreateTaskChat } = useChat()
  const statusColor = statusColors[task.status] || statusColors.Accepted

  const handleChatWithNGO = async (e) => {
    e.preventDefault()
    try {
      // Get NGO info from task (usually createdBy contains NGO id, and ngoName should be available)
      const ngoId = task.createdBy || task.ngoId
      const ngoName = task.ngoName || 'NGO'
      
      if (!ngoId) {
        console.error('NGO info not available for this task')
        return
      }

      const chat = await getOrCreateTaskChat(
        task.id,
        ngoId,
        ngoName,
        user.id,
        user.name,
        task.title
      )

      if (chat) {
        navigate('/chat', { state: { selectedChatId: chat.id, chatData: chat } })
      }
    } catch (err) {
      console.error('Error opening chat:', err.message)
    }
  }

  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-5 hover:border-white/20 backdrop-blur-xl shadow-xl shadow-black/10 transition-all group">
      {/* Status Badge */}
      <div className="flex items-center justify-between mb-3">
        <span className={`px-2.5 py-1 rounded-lg text-xs font-medium ${statusColor}`}>
          {task.status}
        </span>
        <span className="text-xs text-gray-400">
          {task.completedAt && `Completed ${task.completedAt}`}
        </span>
      </div>

      {/* Title */}
      <h3 className="font-semibold text-white/95 mb-2 group-hover:text-brand-400 transition-colors">{task.title}</h3>

      {/* Location & Time */}
      <div className="space-y-1.5 mb-4">
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <MapPin className="w-4 h-4 text-gray-500 group-hover:text-gray-400 transition-colors" />
          <span>{task.location?.address || task.location || 'No location'}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <Clock className="w-4 h-4 text-gray-500 group-hover:text-gray-400 transition-colors" />
          <span>{task.estimatedTime || 'Time not set'}</span>
        </div>
      </div>

      {/* Actions */}
      {task.status !== 'Completed' && (
        <div className="pt-4 border-t border-white/5 space-y-3">
          <button
            onClick={() => onComplete(task.id)}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-green-600 text-white font-medium rounded-xl hover:bg-green-500 shadow-[0_0_10px_rgba(22,163,74,0.2)] hover:shadow-[0_0_15px_rgba(22,163,74,0.4)] transition-all"
          >
            <CheckCircle className="w-5 h-5" />
            Mark as Completed
          </button>
          <button
            onClick={handleChatWithNGO}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-500 shadow-[0_0_10px_rgba(37,99,235,0.2)] hover:shadow-[0_0_15px_rgba(37,99,235,0.4)] transition-all"
          >
            <MessageCircle className="w-5 h-5" />
            Chat with NGO
          </button>
        </div>
      )}

      {task.status === 'Completed' && (
        <div className="pt-4 border-t border-white/5 space-y-3">
          <div className="flex items-center justify-center gap-2 py-2.5 text-green-400 font-medium">
            <CheckCircle className="w-5 h-5" />
            Task Completed
          </div>
        </div>
      )}
    </div>
  )
}

export default MyTaskCard
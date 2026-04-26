import { Users, ChevronRight, MessageCircle } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useChat } from '../context/ChatContext'

const AcceptedByPreview = ({ task, onViewAll }) => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { getOrCreateTaskChat } = useChat()
  if (!task) return null

  const acceptedVolunteers = task.acceptedVolunteers || []
  const displayCount = 3
  const visibleVolunteers = acceptedVolunteers.slice(0, displayCount)
  const hiddenCount = Math.max(0, acceptedVolunteers.length - displayCount)

  if (acceptedVolunteers.length === 0) {
    return (
      <div className="mt-4 pt-4 border-t border-zinc-700">
        <p className="text-sm text-zinc-500 italic">No volunteers have accepted yet</p>
      </div>
    )
  }

  const handleMessageVolunteer = async (volunteer, e) => {
    e.stopPropagation()
    try {
      if (!user?.id) {
        console.error('User not authenticated')
        return
      }

      const chat = await getOrCreateTaskChat(
        task.id,
        user.id,
        user.name,
        volunteer.id,
        volunteer.name,
        task.title
      )

      if (chat) {
        navigate('/chat', { state: { selectedChatId: chat.id, chatData: chat } })
      }
    } catch (err) {
      console.error('Error opening chat with volunteer:', err.message)
    }
  }

  return (
    <div className="mt-4 pt-4 border-t border-zinc-700">
      <div className="mb-3 flex items-center gap-2">
        <Users className="w-4 h-4 text-zinc-400" />
        <span className="text-xs font-medium text-zinc-400">ACCEPTED BY</span>
      </div>

      <div className="space-y-2">
        {visibleVolunteers.map((volunteer, idx) => (
          <div
            key={volunteer.id || idx}
            className="flex items-center justify-between bg-zinc-800/30 rounded-lg px-3 py-2 text-sm group"
          >
            <div className="flex-1 min-w-0">
              <p className="font-medium text-zinc-50 truncate">
                {volunteer.name || 'Volunteer'}
              </p>
              <p className="text-xs text-zinc-500 truncate">
                {volunteer.email || 'No email'}
              </p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={(e) => handleMessageVolunteer(volunteer, e)}
                className="p-1.5 text-zinc-500 hover:text-brand-500 hover:bg-zinc-700 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                title="Message volunteer"
              >
                <MessageCircle className="w-4 h-4" />
              </button>
              <span className="text-xs bg-green-500/10 text-green-400 px-2 py-0.5 rounded">
                ✓
              </span>
            </div>
          </div>
        ))}

        {hiddenCount > 0 && (
          <button
            onClick={onViewAll}
            className="w-full mt-2 py-2 px-3 bg-zinc-800 text-zinc-400 text-sm font-medium rounded-lg hover:bg-zinc-700 hover:text-zinc-50 transition-all flex items-center justify-center gap-2"
          >
            View all {acceptedVolunteers.length} volunteers
            <ChevronRight className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  )
}

export default AcceptedByPreview

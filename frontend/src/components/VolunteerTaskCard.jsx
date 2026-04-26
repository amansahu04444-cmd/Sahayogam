import { MapPin, Clock, CheckCircle, Users, UserPlus } from 'lucide-react'

const priorityColors = {
  High: 'bg-red-500/10 text-red-400 ring-1 ring-red-500/20',
  Medium: 'bg-yellow-500/10 text-yellow-400 ring-1 ring-yellow-500/20',
  Low: 'bg-green-500/10 text-green-400 ring-1 ring-green-500/20',
}

const VolunteerTaskCard = ({ task, onAccept, onReject, onViewDetails }) => {
  const handleViewDetails = () => {
    if (!task) {
      console.error("Task is undefined")
      return
    }
    console.log("Selected Task:", task)
    onViewDetails(task)
  }

  const priorityColor = priorityColors[task.priority] || priorityColors.Low
  const acceptedCount = task.acceptedVolunteers?.length || 0
  const maxVolunteers = task.maxVolunteers || 10
  const isFull = acceptedCount >= maxVolunteers
  const fillPercent = Math.min((acceptedCount / maxVolunteers) * 100, 100)

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 hover:border-zinc-700 hover:bg-zinc-800/50 shadow-sm transition-all group">
      {/* Priority Badge */}
      <div className="flex items-center justify-between mb-3">
        <span className={`px-2.5 py-1 rounded-lg text-xs font-medium ${priorityColor}`}>
          {task.priority} Priority
        </span>
        <span className={`px-2.5 py-1 rounded-lg text-xs font-medium ${
          isFull
            ? 'bg-red-500/10 text-red-400 ring-1 ring-red-500/20'
            : 'bg-zinc-800 text-zinc-400'
        }`}>
          {isFull ? 'Full' : `${acceptedCount}/${maxVolunteers}`}
        </span>
      </div>

      {/* Title & Description */}
      <h3 className="font-semibold text-zinc-50 mb-2 group-hover:text-brand-500 transition-colors">{task.title}</h3>
      <p className="text-sm text-zinc-400 mb-4 line-clamp-2">
        {task.description}
      </p>

      {/* Location & Time */}
      <div className="space-y-1.5 mb-4">
        <div className="flex items-start gap-2 text-sm text-zinc-400">
          <MapPin className="w-4 h-4 text-zinc-500 mt-1 flex-shrink-0 group-hover:text-zinc-400 transition-colors" />
          <div className="flex flex-col">
            <span className="line-clamp-2">{task.location}</span>
            {task.lat && task.lng && (
              <a
                href={`https://www.google.com/maps?q=${task.lat},${task.lng}`}
                target="_blank"
                rel="noreferrer"
                className="mt-1 flex items-center text-brand-400 hover:text-brand-300 font-medium text-xs w-max"
              >
                View on Map ↗
              </a>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 text-sm text-zinc-400">
          <Clock className="w-4 h-4 text-zinc-500 group-hover:text-zinc-400 transition-colors" />
          <span>{task.estimatedTime}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-zinc-400">
          <Users className="w-4 h-4 text-zinc-500 group-hover:text-zinc-400 transition-colors" />
          <span>{acceptedCount} / {maxVolunteers} volunteers</span>
        </div>
      </div>

      {/* Capacity Progress Bar */}
      <div className="mb-4">
        <div className="w-full bg-zinc-800 rounded-full h-1.5">
          <div
            className={`h-1.5 rounded-full transition-all ${
              isFull ? 'bg-red-500' : fillPercent > 70 ? 'bg-yellow-500' : 'bg-brand-500'
            }`}
            style={{ width: `${fillPercent}%` }}
          />
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2 pt-4 border-t border-zinc-800">
        <button
          onClick={handleViewDetails}
          className="flex-1 py-2.5 px-4 border border-zinc-700 text-zinc-400 font-medium rounded-xl hover:bg-zinc-800 hover:text-zinc-50 transition-all"
        >
          Details
        </button>
        <button
          onClick={() => onReject(task.id)}
          className="flex-1 py-2.5 px-4 border border-zinc-700 text-zinc-400 font-medium rounded-xl hover:bg-zinc-800 hover:text-zinc-50 transition-all"
        >
          Reject
        </button>
        <button
          onClick={() => onAccept(task.id)}
          disabled={isFull}
          className={`flex-1 py-2.5 px-4 font-medium rounded-xl shadow-sm transition-all flex items-center justify-center gap-1.5 ${
            isFull
              ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed opacity-60'
              : 'bg-brand-600 text-white hover:bg-brand-500'
          }`}
        >
          {isFull ? (
            'Full'
          ) : (
            <>
              <UserPlus className="w-4 h-4" />
              Accept
            </>
          )}
        </button>
      </div>
    </div>
  )
}

export default VolunteerTaskCard

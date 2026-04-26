import { X, Mail, Phone, Calendar, Users } from 'lucide-react'

const AcceptedVolunteersModal = ({ task, onClose }) => {
  if (!task) return null

  const acceptedVolunteers = task.acceptedVolunteers || []
  const maxVolunteers = task.maxVolunteers || 10
  const remainingSlots = maxVolunteers - acceptedVolunteers.length

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A'
    const date = new Date(dateString)
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date)
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-zinc-800">
          <div>
            <h2 className="text-2xl font-bold text-zinc-50">Accepted Volunteers</h2>
            <p className="text-sm text-zinc-400 mt-1">{task.title}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-zinc-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-zinc-400" />
          </button>
        </div>

        {/* Stats */}
        <div className="px-6 pt-6 pb-4 border-b border-zinc-800 grid grid-cols-2 gap-4">
          <div className="bg-zinc-800/50 rounded-xl p-4">
            <p className="text-xs text-zinc-500 font-medium mb-1">ACCEPTED</p>
            <p className="text-2xl font-bold text-zinc-50 flex items-center gap-2">
              <Users className="w-5 h-5" />
              {acceptedVolunteers.length}
            </p>
          </div>
          <div className="bg-zinc-800/50 rounded-xl p-4">
            <p className="text-xs text-zinc-500 font-medium mb-1">REMAINING SLOTS</p>
            <p className={`text-2xl font-bold flex items-center gap-2 ${
              remainingSlots > 0 ? 'text-green-400' : 'text-red-400'
            }`}>
              {remainingSlots}
            </p>
          </div>
        </div>

        {/* Volunteers List */}
        <div className="flex-1 overflow-y-auto p-6">
          {acceptedVolunteers.length === 0 ? (
            <div className="flex items-center justify-center h-40">
              <p className="text-zinc-400">No volunteers have accepted this task yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {acceptedVolunteers.map((volunteer, idx) => (
                <div
                  key={volunteer.id || idx}
                  className="bg-zinc-800/50 rounded-xl p-4 border border-zinc-700 hover:border-zinc-600 transition-colors"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-semibold text-zinc-50">
                        {volunteer.name || 'Unnamed Volunteer'}
                      </h3>
                      <p className="text-xs text-zinc-400 mt-1">
                        Accepted {formatDate(volunteer.acceptedAt)}
                      </p>
                    </div>
                    <span className="px-2.5 py-1 rounded-lg text-xs font-medium bg-green-500/10 text-green-400 ring-1 ring-green-500/20">
                      ✓ Accepted
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    {volunteer.email && (
                      <a
                        href={`mailto:${volunteer.email}`}
                        className="flex items-center gap-2 text-sm text-brand-400 hover:text-brand-300 transition-colors"
                      >
                        <Mail className="w-4 h-4 flex-shrink-0" />
                        <span className="break-all">{volunteer.email}</span>
                      </a>
                    )}
                    {volunteer.phone && (
                      <a
                        href={`tel:${volunteer.phone}`}
                        className="flex items-center gap-2 text-sm text-brand-400 hover:text-brand-300 transition-colors"
                      >
                        <Phone className="w-4 h-4 flex-shrink-0" />
                        <span>{volunteer.phone}</span>
                      </a>
                    )}
                    {!volunteer.email && !volunteer.phone && (
                      <p className="text-sm text-zinc-500 italic">No contact information available</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-zinc-800">
          <button
            onClick={onClose}
            className="w-full py-3 px-4 bg-brand-600 text-white font-medium rounded-xl hover:bg-brand-500 transition-all"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

export default AcceptedVolunteersModal

import { useState, useEffect } from 'react'
import { X, Search, User, MapPin, Mail, Phone, Check, Loader2, Star, ArrowRight } from 'lucide-react'
import { userAPI, notificationAPI } from '../services/api'
import { auth } from '../config/firebase'
import { safeLower } from '../utils/stringUtils'

import { TASK_CATEGORIES } from '../constants/categories'

const AssignVolunteerModal = ({ task, onClose, onAssigned }) => {
  const [volunteers, setVolunteers] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedVolunteer, setSelectedVolunteer] = useState(null)
  const [isSending, setIsSending] = useState(false)
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    fetchVolunteers()
  }, [])

  const fetchVolunteers = async () => {
    setIsLoading(true)
    try {
      // Fetch volunteers matching the task category
      const res = await userAPI.getVolunteersBySkill(task.category)
      if (res.data.success) {
        // Filter out volunteers who are already assigned to this task
        const assignedIds = task.acceptedVolunteers?.map(v => v.id) || []
        const available = res.data.data.filter(v => !assignedIds.includes(v.id))
        setVolunteers(available)
      }
    } catch (err) {
      console.error('Error fetching volunteers:', err)
      setError('Failed to load volunteers')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSendInvitation = async (volunteer) => {
    setSelectedVolunteer(volunteer)
    setIsSending(true)
    setError('')
    setSuccess('')

    try {
      await notificationAPI.sendInvitation({
        taskId: task.id,
        taskTitle: task.title,
        volunteerId: volunteer.id,
        ngoId: auth.currentUser?.uid,
        ngoName: auth.currentUser?.displayName || 'NGO',
      })

      setSuccess(`Invitation sent to ${volunteer.name || 'volunteer'}!`)
      setSelectedVolunteer(null)

      // Refresh the list after a delay
      setTimeout(() => {
        fetchVolunteers()
        if (onAssigned) onAssigned()
      }, 1500)
    } catch (err) {
      console.error('Error sending invitation:', err)
      setError(err.response?.data?.message || 'Failed to send invitation')
      setSelectedVolunteer(null)
    } finally {
      setIsSending(false)
    }
  }

  const filteredVolunteers = volunteers.filter(v => {
    const query = safeLower(searchQuery)
    const name = safeLower(v.name || v.displayName)
    const email = safeLower(v.email)
    const skills = safeLower((v.skills || []).join(' '))
    const location = safeLower(v.location?.address || v.location)

    return name.includes(query) || email.includes(query) || skills.includes(query) || location.includes(query)
  })

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-zinc-800">
          <div>
            <h2 className="text-xl font-bold text-zinc-50">Assign Volunteer</h2>
            <p className="text-sm text-zinc-400 mt-1">{task.title}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-zinc-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-zinc-400" />
          </button>
        </div>

        {/* Task Info Banner */}
        <div className="px-6 py-4 bg-brand-600/10 border-b border-brand-500/20">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <p className="text-sm text-zinc-400">Category</p>
              <p className="text-white font-medium">{task.category || 'Other'}</p>
            </div>
            <div className="flex-1">
              <p className="text-sm text-zinc-400">Location</p>
              <p className="text-white font-medium truncate">{task.location?.address || 'Not specified'}</p>
            </div>
            <div className="flex-1">
              <p className="text-sm text-zinc-400">Volunteers</p>
              <p className="text-white font-medium">{task.acceptedVolunteers?.length || 0}/{task.maxVolunteers}</p>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="px-6 py-4 border-b border-zinc-800">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, skills, or location..."
              className="w-full pl-10 pr-4 py-2.5 bg-zinc-950 text-zinc-50 placeholder-zinc-500 border border-zinc-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all"
            />
          </div>
        </div>

        {/* Volunteer List */}
        <div className="flex-1 overflow-y-auto p-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 text-brand-500 animate-spin" />
            </div>
          ) : error && !success ? (
            <div className="text-center py-12">
              <p className="text-red-400 mb-4">{error}</p>
              <button
                onClick={fetchVolunteers}
                className="px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-500 transition-colors"
              >
                Retry
              </button>
            </div>
          ) : success ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Check className="w-8 h-8 text-green-400" />
              </div>
              <p className="text-green-400 font-medium">{success}</p>
              <p className="text-zinc-400 text-sm mt-2">The volunteer will receive a notification</p>
            </div>
          ) : filteredVolunteers.length === 0 ? (
            <div className="text-center py-12">
              <User className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
              <p className="text-zinc-400">
                {searchQuery ? 'No volunteers match your search' : 'No available volunteers found'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredVolunteers.map((volunteer) => (
                <div
                  key={volunteer.id}
                  className={`bg-zinc-800/50 rounded-xl p-4 border border-zinc-700 hover:border-brand-500/50 transition-all cursor-pointer ${
                    selectedVolunteer?.id === volunteer.id ? 'border-brand-500 bg-brand-500/10' : ''
                  }`}
                  onClick={() => !isSending && handleSendInvitation(volunteer)}
                >
                  <div className="flex items-start gap-4">
                    {/* Avatar */}
                    <div className="w-12 h-12 rounded-full bg-brand-600/20 flex items-center justify-center flex-shrink-0">
                      {volunteer.photoURL || volunteer.photo ? (
                        <img
                          src={volunteer.photoURL || volunteer.photo}
                          alt={volunteer.name}
                          className="w-12 h-12 rounded-full object-cover"
                        />
                      ) : (
                        <User className="w-6 h-6 text-brand-500" />
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-zinc-50">
                          {volunteer.name || volunteer.displayName || 'Unnamed Volunteer'}
                        </h3>
                        {selectedVolunteer?.id === volunteer.id && isSending && (
                          <Loader2 className="w-4 h-4 text-brand-500 animate-spin" />
                        )}
                        {selectedVolunteer?.id === volunteer.id && success && (
                          <Check className="w-4 h-4 text-green-400" />
                        )}
                      </div>

                      {/* Contact */}
                      <div className="flex items-center gap-4 mt-1 text-sm text-zinc-400">
                        {volunteer.email && (
                          <span className="flex items-center gap-1 truncate">
                            <Mail className="w-3 h-3" />
                            {volunteer.email}
                          </span>
                        )}
                        {volunteer.phone && (
                          <span className="flex items-center gap-1">
                            <Phone className="w-3 h-3" />
                            {volunteer.phone}
                          </span>
                        )}
                      </div>

                      {/* Location */}
                      {volunteer.location?.address && (
                        <p className="text-sm text-zinc-500 mt-1 flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {volunteer.location.address}
                        </p>
                      )}

                      {/* Skills */}
                      {volunteer.skills && volunteer.skills.length > 0 && (
                        <div className="flex items-center gap-2 mt-2 flex-wrap">
                          {volunteer.skills.slice(0, 4).map((skill, idx) => (
                            <span
                              key={idx}
                              className="px-2 py-0.5 bg-zinc-700 text-zinc-300 text-xs rounded-full"
                            >
                              {skill}
                            </span>
                          ))}
                          {volunteer.skills.length > 4 && (
                            <span className="text-xs text-zinc-500">
                              +{volunteer.skills.length - 4} more
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Action Arrow */}
                    <ArrowRight className="w-5 h-5 text-zinc-600 group-hover:text-brand-500 transition-colors flex-shrink-0" />
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
            className="w-full py-3 px-4 bg-zinc-800 text-zinc-300 font-medium rounded-xl hover:bg-zinc-700 transition-all"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

export default AssignVolunteerModal

import { useState, useEffect } from 'react'
import { X, Check, XCircle, Loader2, MapPin, CheckCircle, Bell } from 'lucide-react'
import { notificationAPI } from '../services/api'
import { useNavigate } from 'react-router-dom'

import { TASK_CATEGORIES } from '../constants/categories'

const TaskInvitationsModal = ({ onClose }) => {
  const [invitations, setInvitations] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [processingId, setProcessingId] = useState(null)
  const [successId, setSuccessId] = useState(null)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    fetchInvitations()
  }, [])

  const fetchInvitations = async () => {
    setIsLoading(true)
    try {
      const res = await notificationAPI.getInvitations()
      if (res.data.success) {
        // Filter to only show pending invitations
        const pending = res.data.data.filter(req => req.status === 'pending')
        setInvitations(pending)
      }
    } catch (err) {
      console.error('Error fetching invitations:', err)
      setError('Failed to load invitations')
    } finally {
      setIsLoading(false)
    }
  }

  const handleRespond = async (invitation, status) => {
    setProcessingId(invitation.id)
    setError('')

    try {
      await notificationAPI.respondToInvitation(invitation.id, status)
      
      if (status === 'accepted') {
        setSuccessId(invitation.id)
        setTimeout(() => {
          navigate('/my-tasks')
          onClose()
        }, 1500)
      } else {
        // Remove from list
        setInvitations(prev => prev.filter(req => req.id !== invitation.id))
      }
    } catch (err) {
      console.error(`Error ${status} invitation:`, err)
      setError(err.response?.data?.message || `Failed to ${status} invitation`)
    } finally {
      setProcessingId(null)
    }
  }

  const formatTime = (timestamp) => {
    if (!timestamp) return ''
    const date = new Date(timestamp)
    const now = new Date()
    const diffMs = now - date
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    return date.toLocaleDateString()
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-zinc-800">
          <div>
            <h2 className="text-xl font-bold text-zinc-50 flex items-center gap-2">
              <Bell className="w-5 h-5 text-brand-500" />
              Task Invitations
            </h2>
            <p className="text-sm text-zinc-400 mt-1">
              {invitations.length} pending invitation{invitations.length !== 1 ? 's' : ''}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-zinc-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-zinc-400" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 text-brand-500 animate-spin" />
            </div>
          ) : error && invitations.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-red-400 mb-4">{error}</p>
              <button
                onClick={fetchInvitations}
                className="px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-500 transition-colors"
              >
                Retry
              </button>
            </div>
          ) : invitations.length === 0 ? (
            <div className="text-center py-12">
              <CheckCircle className="w-16 h-16 text-green-500/50 mx-auto mb-4" />
              <p className="text-zinc-300 font-medium text-lg">All caught up!</p>
              <p className="text-zinc-500 mt-1">No pending task invitations</p>
            </div>
          ) : (
            <div className="space-y-4">
              {invitations.map((invitation) => (
                <div
                  key={invitation.id}
                  className={`bg-zinc-800/50 rounded-xl border border-zinc-700 p-5 transition-all ${
                    successId === invitation.id ? 'border-green-500/50 bg-green-500/10' : ''
                  }`}
                >
                  {/* NGO Info */}
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-full bg-brand-600/20 flex items-center justify-center">
                      <span className="text-brand-500 font-semibold">
                        {invitation.ngoName?.charAt(0)?.toUpperCase() || 'N'}
                      </span>
                    </div>
                    <div className="flex-1">
                      <p className="text-white font-medium">{invitation.ngoName || 'NGO'}</p>
                      <p className="text-xs text-zinc-500">
                        Invited you {formatTime(invitation.createdAt)}
                      </p>
                    </div>
                    <span className="px-2.5 py-1 bg-yellow-500/10 text-yellow-400 text-xs font-medium rounded-full border border-yellow-500/20">
                      Pending
                    </span>
                  </div>

                  {/* Task Info */}
                  <div className="bg-zinc-900/50 rounded-lg p-4 mb-4">
                    <h3 className="text-lg font-semibold text-zinc-50 mb-2">
                      {invitation.taskTitle}
                    </h3>
                    
                    <p className="text-sm text-zinc-300 mb-4 italic">
                      "{invitation.message || 'You have been invited to help with this task.'}"
                    </p>

                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <p className="text-zinc-500 text-xs">Category</p>
                        <p className="text-zinc-300">
                          {invitation.taskCategory || 'N/A'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  {successId === invitation.id ? (
                    <div className="flex items-center justify-center gap-2 py-3 text-green-400">
                      <CheckCircle className="w-5 h-5" />
                      <span className="font-medium">Accepted! Redirecting...</span>
                    </div>
                  ) : (
                    <div className="flex gap-3">
                      <button
                        onClick={() => handleRespond(invitation, 'rejected')}
                        disabled={processingId === invitation.id}
                        className="flex-1 flex items-center justify-center gap-2 py-3 px-4 bg-zinc-800 text-zinc-300 font-medium rounded-xl hover:bg-zinc-700 transition-colors disabled:opacity-50"
                      >
                        {processingId === invitation.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <XCircle className="w-4 h-4" />
                        )}
                        Reject
                      </button>
                      <button
                        onClick={() => handleRespond(invitation, 'accepted')}
                        disabled={processingId === invitation.id}
                        className="flex-1 flex items-center justify-center gap-2 py-3 px-4 bg-brand-600 text-white font-medium rounded-xl hover:bg-brand-500 transition-colors disabled:opacity-50"
                      >
                        {processingId === invitation.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Check className="w-4 h-4" />
                        )}
                        Accept
                      </button>
                    </div>
                  )}

                  {error && processingId === invitation.id && (
                    <p className="text-red-400 text-sm mt-2 text-center">{error}</p>
                  )}
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

export default TaskInvitationsModal

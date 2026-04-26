import { useState, useEffect } from 'react'
import { X, Save, Loader2, MapPin, AlertTriangle } from 'lucide-react'
import LocationPicker from './LocationPicker'
import { taskAPI } from '../services/api'

import { TASK_CATEGORIES } from '../constants/categories'

const EditTaskModal = ({ task, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: TASK_CATEGORIES[0],
    severity: 5,
    peopleAffected: 0,
    urgency: 5,
    maxVolunteers: 10,
    status: 'pending',
  })
  const [location, setLocation] = useState({ address: '', lat: null, lng: null })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (task) {
      setFormData({
        title: task.title || '',
        description: task.description || '',
        category: task.category || TASK_CATEGORIES[0],
        severity: task.severity || 5,
        peopleAffected: task.peopleAffected || 0,
        urgency: task.urgency || 5,
        maxVolunteers: task.maxVolunteers || 10,
        status: task.status || 'pending',
      })
      setLocation(task.location || { address: '', lat: null, lng: null })
    }
  }, [task])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError('')

    try {
      const payload = {
        ...formData,
        location,
        severity: parseInt(formData.severity),
        urgency: parseInt(formData.urgency),
        peopleAffected: parseInt(formData.peopleAffected),
        maxVolunteers: parseInt(formData.maxVolunteers),
      }

      await taskAPI.update(task.id, payload)
      onSuccess()
      onClose()
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update task')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!task) return null

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-300">
      <div className="bg-zinc-900 border border-zinc-800 rounded-[2.5rem] shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col relative">
        <div className="absolute top-0 right-0 w-64 h-64 bg-brand-500/5 blur-[100px] rounded-full -mr-32 -mt-32" />
        
        {/* Header */}
        <div className="flex items-center justify-between p-8 border-b border-zinc-800 relative z-10">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-zinc-800 rounded-2xl flex items-center justify-center border border-zinc-700 shadow-inner">
              <AlertTriangle className="w-6 h-6 text-yellow-500" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-zinc-50 tracking-tight">Edit Operation</h2>
              <p className="text-xs text-zinc-500 font-bold uppercase tracking-widest mt-1">Refine Mission Parameters</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-3 hover:bg-zinc-800 rounded-2xl transition-all border border-transparent hover:border-zinc-700 group"
          >
            <X className="w-6 h-6 text-zinc-500 group-hover:text-zinc-300" />
          </button>
        </div>

        {/* Form Body */}
        <div className="flex-1 overflow-y-auto p-8 relative z-10 custom-scrollbar">
          {error && (
            <div className="mb-8 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 text-sm font-bold flex items-center gap-3">
              <AlertTriangle className="w-5 h-5" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div>
                <label className="block text-xs font-black text-zinc-500 uppercase tracking-widest mb-2.5 ml-1">Mission Title</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-5 py-4 bg-zinc-950 border border-zinc-800 text-zinc-50 rounded-2xl focus:outline-none focus:ring-2 focus:ring-brand-500/50 hover:border-zinc-700 transition-all font-medium"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-black text-zinc-500 uppercase tracking-widest mb-2.5 ml-1">Strategic Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-5 py-4 bg-zinc-950 border border-zinc-800 text-zinc-50 rounded-2xl focus:outline-none focus:ring-2 focus:ring-brand-500/50 hover:border-zinc-700 transition-all font-medium h-40 resize-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black text-zinc-500 uppercase tracking-widest mb-2.5 ml-1">Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-5 py-4 bg-zinc-950 border border-zinc-800 text-zinc-50 rounded-2xl focus:outline-none focus:ring-2 focus:ring-brand-500/50 hover:border-zinc-700 transition-all font-medium appearance-none"
                  >
                    {TASK_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat} className="bg-zinc-900">
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-black text-zinc-500 uppercase tracking-widest mb-2.5 ml-1">Operational Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-5 py-4 bg-zinc-950 border border-zinc-800 text-zinc-50 rounded-2xl focus:outline-none focus:ring-2 focus:ring-brand-500/50 hover:border-zinc-700 transition-all font-medium appearance-none"
                  >
                    <option value="pending" className="bg-zinc-900">Pending</option>
                    <option value="assigned" className="bg-zinc-900">Assigned</option>
                    <option value="completed" className="bg-zinc-900">Completed</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-xs font-black text-zinc-500 uppercase tracking-widest mb-2.5 ml-1">Operation Zone</label>
                <div className="rounded-2xl overflow-hidden border border-zinc-800 bg-zinc-950 h-[220px]">
                  <LocationPicker 
                    initialLocation={location} 
                    onLocationSelect={(loc) => setLocation(loc)} 
                  />
                </div>
                {location.address && (
                  <div className="mt-3 p-3 bg-zinc-800/30 rounded-xl border border-zinc-800 flex items-center gap-3">
                    <MapPin className="w-4 h-4 text-brand-500" />
                    <p className="text-[11px] text-zinc-400 font-medium truncate">{location.address}</p>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-black text-zinc-500 uppercase tracking-widest mb-2.5 ml-1">Severity ({formData.severity})</label>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={formData.severity}
                    onChange={(e) => setFormData({ ...formData, severity: e.target.value })}
                    className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-brand-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-black text-zinc-500 uppercase tracking-widest mb-2.5 ml-1">Force Required</label>
                  <input
                    type="number"
                    value={formData.maxVolunteers}
                    onChange={(e) => setFormData({ ...formData, maxVolunteers: e.target.value })}
                    className="w-full px-5 py-4 bg-zinc-950 border border-zinc-800 text-zinc-50 rounded-2xl focus:outline-none focus:ring-2 focus:ring-brand-500/50 hover:border-zinc-700 transition-all font-medium"
                  />
                </div>
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-5 bg-brand-600 hover:bg-brand-500 text-white font-black uppercase tracking-widest rounded-2xl transition-all shadow-xl shadow-brand-500/20 active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-3"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-6 h-6 animate-spin" />
                      Synchronizing...
                    </>
                  ) : (
                    <>
                      Save Changes
                      <Save className="w-6 h-6" />
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default EditTaskModal

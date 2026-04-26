import { X, Building2, AlignLeft, LayoutGrid, Users, MapPin, Mail, AlertCircle, Clock, Calendar } from 'lucide-react'
import { useEffect, useState } from 'react'

const TaskDetailsModal = ({ task, onClose }) => {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    if (task) {
      setTimeout(() => setIsVisible(true), 10)
    }
    return () => setIsVisible(false)
  }, [task])

  if (!task) return null

  const getPriorityBadge = (priority) => {
    const p = priority?.toLowerCase()
    if (p === 'high' || task.severity >= 7) {
      return <span className="bg-red-500/10 text-red-400 ring-1 ring-red-500/20 px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider">High Priority</span>
    } else if (p === 'medium' || task.severity >= 4) {
      return <span className="bg-yellow-500/10 text-yellow-400 ring-1 ring-yellow-500/20 px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider">Medium Priority</span>
    } else {
      return <span className="bg-green-500/10 text-green-400 ring-1 ring-green-500/20 px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider">Low Priority</span>
    }
  }

  const acceptedVols = task.acceptedVolunteers || task.assignedVolunteers || []

  return (
    <div className={`fixed inset-0 z-50 overflow-y-auto transition-all duration-300 ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md" onClick={onClose} />
        
        <div className={`bg-zinc-900 w-full max-w-2xl rounded-3xl border border-zinc-800 shadow-2xl relative transition-all duration-300 transform z-10 my-8 ${isVisible ? 'scale-100 translate-y-0' : 'scale-95 translate-y-4'}`}>
        
        {/* Decorative Top Bar */}
        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-brand-600 to-brand-400" />

        {/* Header */}
        <div className="p-8 pb-6 flex justify-between items-start">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-brand-500/10 rounded-xl flex items-center justify-center">
                <AlignLeft className="w-6 h-6 text-brand-400" />
              </div>
              <h2 className="text-2xl font-black text-zinc-50 tracking-tight">
                Task Specification
              </h2>
            </div>
            <div className="flex items-center gap-3">
              {getPriorityBadge(task.priority)}
              <span className="bg-zinc-800 text-zinc-400 px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider ring-1 ring-zinc-700">
                {task.status || 'Pending'}
              </span>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 bg-zinc-800 hover:bg-zinc-700 rounded-full transition-all text-zinc-400 hover:text-zinc-50 border border-zinc-700 active:scale-90"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-8 pb-8 space-y-6">
          {/* Section 1: NGO Context */}
          <div className="bg-zinc-950/50 border border-zinc-800 rounded-2xl p-5 relative group">
             <div className="absolute top-0 right-0 w-24 h-24 bg-brand-500/5 blur-2xl rounded-full -mr-12 -mt-12 group-hover:bg-brand-500/10 transition-colors" />
             <div className="flex items-center gap-3 mb-4 relative z-10">
               <Building2 className="w-5 h-5 text-brand-400" />
               <h3 className="text-sm font-bold text-zinc-50 uppercase tracking-widest">Issuer Node</h3>
             </div>
             <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 relative z-10">
               <div className="space-y-1">
                 <p className="text-[10px] font-black text-zinc-500 uppercase tracking-tighter">Organization</p>
                 <p className="text-zinc-200 font-bold">{task.ngoName || task.ngo?.name || task.createdBy?.name || 'Unknown Organization'}</p>
               </div>
               <div className="space-y-1">
                 <p className="text-[10px] font-black text-zinc-500 uppercase tracking-tighter">Contact Uplink</p>
                 <p className="text-brand-400 font-bold truncate">{task.createdBy?.email || task.ngo?.email || 'N/A'}</p>
               </div>
             </div>
          </div>

          {/* Section 2: Core Task Data */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-[0.2em] flex items-center gap-2 px-1">
              <AlertCircle className="w-4 h-4" /> Operational Parameters
            </h3>
            <div className="bg-zinc-950/30 border border-zinc-800/50 rounded-2xl p-6">
              <div className="grid grid-cols-2 gap-x-8 gap-y-6">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 text-zinc-500">
                    <LayoutGrid className="w-3.5 h-3.5" />
                    <span className="text-[10px] font-bold uppercase tracking-widest">Category</span>
                  </div>
                  <p className="text-zinc-200 font-bold">{task.category || 'N/A'}</p>
                </div>
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 text-zinc-500">
                    <Users className="w-3.5 h-3.5" />
                    <span className="text-[10px] font-bold uppercase tracking-widest">Scale</span>
                  </div>
                  <p className="text-zinc-200 font-bold">{task.peopleAffected || 0} Affected</p>
                </div>
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 text-zinc-500">
                    <Clock className="w-3.5 h-3.5" />
                    <span className="text-[10px] font-bold uppercase tracking-widest">Urgency</span>
                  </div>
                  <p className="text-zinc-200 font-bold">{task.urgency || 5} / 10</p>
                </div>
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 text-zinc-500">
                    <Calendar className="w-3.5 h-3.5" />
                    <span className="text-[10px] font-bold uppercase tracking-widest">Created At</span>
                  </div>
                  <p className="text-zinc-200 font-bold">{task.createdAt ? new Date(task.createdAt).toLocaleDateString() : 'Active'}</p>
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-zinc-800/50 space-y-3">
                <div className="flex items-center gap-2 text-zinc-500">
                   <MapPin className="w-3.5 h-3.5" />
                   <span className="text-[10px] font-bold uppercase tracking-widest">Deployment Point</span>
                </div>
                <p className="text-zinc-300 text-sm leading-relaxed font-medium bg-zinc-900/50 p-3 rounded-xl border border-zinc-800/50">
                  {task.location?.address || task.location || 'N/A'}
                </p>
              </div>

              <div className="mt-6 pt-6 border-t border-zinc-800/50 space-y-3">
                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block">Objective Summary</span>
                <p className="text-zinc-300 text-sm leading-relaxed font-medium">
                  {task.description || 'No description provided for this mission.'}
                </p>
              </div>
            </div>
          </div>

          {/* Section 3: Personnel Assets */}
          <div className="bg-brand-500/5 border border-brand-500/10 p-6 rounded-2xl relative">
             <div className="absolute bottom-0 right-0 w-32 h-32 bg-brand-500/5 blur-3xl rounded-full -mr-16 -mb-16" />
             <div className="flex items-center justify-between mb-4 relative z-10">
               <div className="flex items-center gap-3">
                 <div className="w-8 h-8 bg-brand-500/20 rounded-lg flex items-center justify-center">
                    <Users className="w-4 h-4 text-brand-400" />
                 </div>
                 <h3 className="text-sm font-bold text-zinc-100 uppercase tracking-widest">Deployed Personnel</h3>
               </div>
               <span className="bg-brand-500/20 text-brand-400 px-3 py-1 rounded-lg text-xs font-black ring-1 ring-brand-500/30">
                 Active: {acceptedVols.length}
               </span>
             </div>
             
             {acceptedVols.length > 0 ? (
               <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 relative z-10">
                 {acceptedVols.map((v, i) => (
                   <div key={i} className="flex items-center gap-3 bg-zinc-900/80 border border-zinc-800/50 p-3 rounded-xl">
                      <div className="w-8 h-8 bg-brand-500/10 rounded-full flex items-center justify-center text-[10px] font-black text-brand-400 ring-1 ring-brand-500/20">
                        {v?.name?.charAt(0) || 'V'}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-zinc-200 truncate">{v?.name || 'Volunteer Asset'}</p>
                        <p className="text-[10px] text-zinc-500 truncate font-medium">{v?.email || 'Encrypted Channel'}</p>
                      </div>
                   </div>
                 ))}
               </div>
             ) : (
               <div className="text-center py-6 relative z-10">
                 <p className="text-xs text-zinc-500 font-bold uppercase tracking-widest flex items-center justify-center gap-2">
                   <Clock className="w-4 h-4 opacity-50" /> Pending Personnel Assignment
                 </p>
               </div>
             )}
          </div>
        </div>

        {/* Footer Action */}
        <div className="px-8 pb-8 pt-2">
          <button 
            onClick={onClose}
            className="w-full bg-zinc-50 hover:bg-white text-zinc-950 font-black px-6 py-4 rounded-2xl transition-all shadow-xl shadow-zinc-50/5 active:scale-95 flex items-center justify-center gap-3 uppercase tracking-widest text-sm"
          >
            Acknowledge & Close
          </button>
        </div>

      </div>
    </div>
    </div>
  )
}

export default TaskDetailsModal

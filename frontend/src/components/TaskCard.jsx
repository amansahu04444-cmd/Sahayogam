import { AlertCircle, Clock, Users, ArrowRight, CheckCircle } from 'lucide-react'
import AcceptedByPreview from './AcceptedByPreview'
import { auth } from '../config/firebase'
import { useState } from 'react'
// Helper: convert numeric severity (1-10) to label
const getSeverityLabel = (severity) => {
  if (typeof severity === 'string') return severity
  if (severity >= 7) return 'High'
  if (severity >= 4) return 'Medium'
  return 'Low'
}

const priorityColors = {
  High: 'bg-red-500/10 text-red-400 ring-1 ring-red-500/20',
  Medium: 'bg-yellow-500/10 text-yellow-400 ring-1 ring-yellow-500/20',
  Low: 'bg-green-500/10 text-green-400 ring-1 ring-green-500/20',
}

const statusColors = {
  pending: 'bg-zinc-800 text-zinc-300 ring-1 ring-zinc-700',
  Pending: 'bg-zinc-800 text-zinc-300 ring-1 ring-zinc-700',
  assigned: 'bg-blue-500/10 text-blue-400 ring-1 ring-blue-500/20',
  Assigned: 'bg-blue-500/10 text-blue-400 ring-1 ring-blue-500/20',
  completed: 'bg-green-500/10 text-green-400 ring-1 ring-green-500/20',
  Completed: 'bg-green-500/10 text-green-400 ring-1 ring-green-500/20',
}

import { TASK_CATEGORIES } from '../constants/categories'

const categoryIcons = {
  'First Aid': '🩹',
  'Medical Help': '🏥',
  'Food Distribution': '🍲',
  'Rescue Support': '🚑',
  'Logistics': '📦',
  'Counseling': '🤝',
  'Transportation': '🚗',
  'Search & Rescue': '🔍',
  'Teaching': '📚',
  'Wildlife Rescue': '🐾',
  'Other': '📦',
}

const TaskCard = ({ task, onAssign, onViewVolunteers }) => {
  const severityLabel = getSeverityLabel(task.severity)
  const priorityColor = priorityColors[severityLabel] || priorityColors.Low
  const status = task.status || 'pending'
  const statusColor = statusColors[status] || statusColors.pending
  const displayCategory = task.category || 'Other'

  const acceptedCount = task.acceptedVolunteers?.length || 0
  const maxVolunteers = task.maxVolunteers || 10
  const isFull = acceptedCount >= maxVolunteers
  const fillPercent = Math.min((acceptedCount / maxVolunteers) * 100, 100)

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 hover:border-brand-500/30 hover:bg-zinc-800/40 shadow-lg transition-all group relative overflow-hidden">
      {/* Decorative Gradient Background */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-brand-500/5 blur-3xl rounded-full -mr-16 -mt-16 group-hover:bg-brand-500/10 transition-colors" />

      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-zinc-950 border border-zinc-800 rounded-xl flex items-center justify-center text-2xl shadow-inner group-hover:border-zinc-700 transition-colors">
            {categoryIcons[task.category] || '📦'}
          </div>
          <div>
            <h3 className="font-bold text-zinc-50 group-hover:text-brand-400 transition-colors leading-tight">{task.title}</h3>
            <p className="text-sm text-zinc-500 mt-0.5">{displayCategory}</p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-2">
          <span className={`px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider ${priorityColor}`}>
            {severityLabel}
          </span>
          <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-tighter ${
            isFull
              ? 'bg-red-500/10 text-red-400'
              : 'bg-zinc-800 text-zinc-500'
          }`}>
            {isFull ? 'At Capacity' : `${maxVolunteers - acceptedCount} slots left`}
          </span>
        </div>
      </div>

      {/* Description Preview (Optional/Subtle) */}
      {task.description && (
        <p className="text-sm text-zinc-400 line-clamp-2 mb-6 group-hover:text-zinc-300 transition-colors">
          {task.description}
        </p>
      )}

      {/* Details Grid */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-zinc-950/40 border border-zinc-800/50 rounded-xl p-3 flex flex-col gap-1 group-hover:border-zinc-800 transition-colors">
          <div className="flex items-center gap-2 text-zinc-500">
            <Users className="w-3.5 h-3.5" />
            <span className="text-[10px] font-bold uppercase tracking-widest">Affected</span>
          </div>
          <span className="text-sm font-semibold text-zinc-200">{task.peopleAffected} People</span>
        </div>
        <div className="bg-zinc-950/40 border border-zinc-800/50 rounded-xl p-3 flex flex-col gap-1 group-hover:border-zinc-800 transition-colors">
          <div className="flex items-center gap-2 text-zinc-500">
            <Clock className="w-3.5 h-3.5" />
            <span className="text-[10px] font-bold uppercase tracking-widest">Urgency</span>
          </div>
          <span className="text-sm font-semibold text-zinc-200">{task.urgency} / 10</span>
        </div>
      </div>

      {/* Capacity Progress Section */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Volunteer Capacity</span>
          <span className="text-xs font-bold text-zinc-300">{acceptedCount} / {maxVolunteers}</span>
        </div>
        <div className="w-full bg-zinc-950 rounded-full h-2 border border-zinc-800 p-0.5">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              isFull ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]' : fillPercent > 70 ? 'bg-yellow-500' : 'bg-brand-500 shadow-[0_0_8px_rgba(20,184,166,0.3)]'
            }`}
            style={{ width: `${fillPercent}%` }}
          />
        </div>
      </div>

      {/* Accepted Volunteers Preview */}
      <div className="mb-6">
        <AcceptedByPreview 
          task={task} 
          onViewAll={() => onViewVolunteers && onViewVolunteers(task)} 
        />
      </div>

      {/* Footer Actions */}
      <div className="flex items-center justify-between pt-5 border-t border-zinc-800/50">
        <div className="flex items-center gap-3">
          <span className={`px-3 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-wider ${statusColor}`}>
            {status}
          </span>
        </div>

        {(status === 'pending' || status === 'Pending') && (
          <button
            onClick={() => onAssign(task.id)}
            className="flex items-center gap-2 px-5 py-2 bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-brand-500/20 hover:shadow-brand-500/40 transition-all hover:-translate-y-0.5 active:translate-y-0"
          >
            Assign Volunteer
            <ArrowRight className="w-4 h-4" />
          </button>
        )}
        
        {(status === 'assigned' || status === 'Assigned') && (
          <div className="flex flex-col items-end gap-1">
            <div className="flex items-center gap-2 text-xs font-bold text-brand-400 bg-brand-400/5 px-3 py-1.5 rounded-lg border border-brand-400/20">
              <div className="w-1.5 h-1.5 bg-brand-400 rounded-full animate-pulse" />
              In Progress
            </div>
            {task.assignedVolunteerName && (
              <div className="text-right">
                <p className="text-[10px] font-bold text-zinc-300 uppercase tracking-wider">{task.assignedVolunteerName}</p>
                <p className="text-[9px] text-zinc-500">{task.assignedVolunteerEmail}</p>
              </div>
            )}
          </div>
        )}
        
        {(status === 'completed' || status === 'Completed') && (
          <div className="flex items-center gap-2 text-xs font-bold text-green-400 bg-green-400/5 px-3 py-1.5 rounded-lg border border-green-400/20">
            <CheckCircle className="w-3.5 h-3.5 text-green-400" />
            Task Completed
          </div>
        )}
      </div>

    </div>
  )
}

export default TaskCard

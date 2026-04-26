import { Eye, Edit, Trash2, MapPin, AlertCircle, Clock } from 'lucide-react'

const priorityColors = {
  High: 'bg-red-500/10 text-red-400 ring-1 ring-red-500/20',
  Medium: 'bg-yellow-500/10 text-yellow-400 ring-1 ring-yellow-500/20',
  Low: 'bg-green-500/10 text-green-400 ring-1 ring-green-500/20',
}

const statusColors = {
  Pending: 'bg-zinc-800 text-zinc-400 ring-1 ring-zinc-700',
  Assigned: 'bg-blue-500/10 text-blue-400 ring-1 ring-blue-500/20',
  Completed: 'bg-green-500/10 text-green-400 ring-1 ring-green-500/20',
}

const categoryIcons = {
  Healthcare: '🏥',
  Food: '🍲',
  'Disaster Relief': '🚨',
  Education: '📚',
  Shelter: '🏠',
  Environment: '🌿',
  Other: '📦',
}

const TaskTable = ({ tasks, onDelete, onView, onEdit }) => {
  if (tasks.length === 0) {
    return (
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-16 text-center shadow-lg">
        <div className="w-20 h-20 bg-zinc-950 border border-zinc-800 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
          <AlertCircle className="w-10 h-10 text-zinc-600" />
        </div>
        <h3 className="text-xl font-bold text-zinc-50 mb-2">
          No tasks found
        </h3>
        <p className="text-zinc-400 max-w-sm mx-auto">
          We couldn't find any tasks matching your current filters. Try broadening your search.
        </p>
      </div>
    )
  }

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden shadow-xl backdrop-blur-sm">
      {/* Desktop Table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-zinc-950/50 border-b border-zinc-800">
              <th className="text-left px-6 py-5 text-xs font-bold text-zinc-500 uppercase tracking-widest">
                Task Info
              </th>
              <th className="text-left px-6 py-5 text-xs font-bold text-zinc-500 uppercase tracking-widest">
                Category
              </th>
              <th className="text-left px-6 py-5 text-xs font-bold text-zinc-500 uppercase tracking-widest">
                Priority
              </th>
              <th className="text-left px-6 py-5 text-xs font-bold text-zinc-500 uppercase tracking-widest">
                Status
              </th>
              <th className="text-left px-6 py-5 text-xs font-bold text-zinc-500 uppercase tracking-widest">
                Location
              </th>
              <th className="text-right px-6 py-5 text-xs font-bold text-zinc-500 uppercase tracking-widest">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/50">
            {tasks.map((task) => (
              <tr
                key={task.id}
                className="hover:bg-zinc-800/30 transition-all group"
              >
                <td className="px-6 py-5">
                  <div className="font-semibold text-zinc-50 group-hover:text-brand-400 transition-colors">{task.title}</div>
                </td>
                <td className="px-6 py-5">
                  <div className="flex items-center gap-3">
                    <span className="text-xl drop-shadow-sm">
                      {categoryIcons[task.category] || '📦'}
                    </span>
                    <span className="text-sm text-zinc-300">{task.category}</span>
                  </div>
                </td>
                <td className="px-6 py-5">
                  <span
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold ${
                      priorityColors[task.priority] || priorityColors.Low
                    }`}
                  >
                    {task.priority}
                  </span>
                </td>
                <td className="px-6 py-5">
                  <span
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold ${
                      statusColors[task.status] || statusColors.Pending
                    }`}
                  >
                    {task.status}
                  </span>
                </td>
                <td className="px-6 py-5">
                  <div className="flex items-center gap-2 text-sm text-zinc-400 group-hover:text-zinc-300 transition-colors">
                    <MapPin className="w-4 h-4 text-zinc-600 group-hover:text-brand-500/60" />
                    <span className="truncate max-w-[150px]">{task.location}</span>
                  </div>
                </td>
                <td className="px-6 py-5">
                  <div className="flex items-center justify-end gap-2.5">
                    <button
                      onClick={() => onView(task)}
                      className="p-2.5 text-zinc-500 hover:text-brand-400 hover:bg-brand-500/10 rounded-xl transition-all border border-transparent hover:border-brand-500/20"
                      title="View Details"
                    >
                      <Eye className="w-4.5 h-4.5" />
                    </button>
                    <button
                      onClick={() => onEdit(task)}
                      className="p-2.5 text-zinc-500 hover:text-yellow-400 hover:bg-yellow-500/10 rounded-xl transition-all border border-transparent hover:border-yellow-500/20"
                      title="Edit Task"
                    >
                      <Edit className="w-4.5 h-4.5" />
                    </button>
                    <button
                      onClick={() => onDelete(task.id)}
                      className="p-2.5 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all border border-transparent hover:border-red-500/20"
                      title="Delete Task"
                    >
                      <Trash2 className="w-4.5 h-4.5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden divide-y divide-zinc-800">
        {tasks.map((task) => (
          <div key={task.id} className="p-5 bg-zinc-900 group">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="font-bold text-zinc-50 group-hover:text-brand-400 transition-colors">{task.title}</h3>
                <div className="flex items-center gap-2 mt-2 text-sm text-zinc-400">
                  <MapPin className="w-4 h-4 text-zinc-600" />
                  {task.location}
                </div>
              </div>
              <span
                className={`px-3 py-1 rounded-lg text-xs font-bold ${
                  priorityColors[task.priority] || priorityColors.Low
                }`}
              >
                {task.priority}
              </span>
            </div>
            
            <div className="flex items-center gap-4 mb-5">
              <span
                className={`px-3 py-1 rounded-lg text-xs font-bold ${
                  statusColors[task.status] || statusColors.Pending
                }`}
              >
                {task.status}
              </span>
              <div className="flex items-center gap-2 text-sm text-zinc-400 font-medium">
                <span>{categoryIcons[task.category] || '📦'}</span>
                <span>{task.category}</span>
              </div>
            </div>

            <div className="flex items-center gap-2.5 pt-4 border-t border-zinc-800/50">
              <button
                onClick={() => onView(task)}
                className="flex-1 py-3 text-sm text-zinc-300 font-bold bg-zinc-800 hover:bg-zinc-700 hover:text-zinc-50 rounded-xl transition-all border border-zinc-700 shadow-sm"
              >
                View
              </button>
              <button 
                onClick={() => onEdit(task)}
                className="flex-1 py-3 text-sm text-zinc-300 font-bold bg-zinc-800 hover:bg-zinc-700 hover:text-zinc-50 rounded-xl transition-all border border-zinc-700 shadow-sm"
              >
                Edit
              </button>
              <button
                onClick={() => onDelete(task.id)}
                className="flex-1 py-3 text-sm text-red-400 font-bold bg-red-500/5 hover:bg-red-500/10 rounded-xl transition-all border border-red-500/20"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default TaskTable

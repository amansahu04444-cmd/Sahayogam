import { useState, useEffect, useMemo } from 'react'
import { MapContainer, TileLayer, CircleMarker, Popup, useMap, Marker } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import 'leaflet.heat'
import { Flame, AlertTriangle, Layers, Activity } from 'lucide-react'

// Heatmap native layer binding component
const HeatmapLayer = ({ heatData }) => {
  const map = useMap()
  
  useEffect(() => {
    if (!heatData || heatData.length === 0) return
    
    const heatLayer = L.heatLayer(heatData, {
      radius: 35,
      blur: 25,
      maxZoom: 14,
      max: 1.0,
      gradient: {
        0.3: '#22c55e', // Low - Green
        0.6: '#f97316', // Medium - Orange
        1.0: '#ef4444'  // High - Red / Intensive
      }
    }).addTo(map)

    return () => {
      map.removeLayer(heatLayer)
    }
  }, [heatData, map])

  return null
}

const getPriorityColor = (priority) => {
  switch (priority) {
    case "High": return "red";
    case "Medium": return "orange";
    default: return "green";
  }
};

const getCustomIcon = (color) => {
  const colorMap = {
    red: '#ef4444',
    orange: '#f97316',
    green: '#22c55e'
  };
  const hex = colorMap[color] || colorMap.green;
  
  return L.divIcon({
    className: 'custom-pin',
    html: `<svg width="24" height="36" viewBox="0 0 24 36" fill="none" xmlns="http://www.w3.org/2000/svg" style="filter: drop-shadow(0px 4px 6px rgba(0,0,0,0.3)); transition: transform 0.2s;" onmouseover="this.style.transform='scale(1.1)'" onmouseout="this.style.transform='scale(1)'">
            <path d="M12 0C5.37258 0 0 5.37258 0 12C0 21 12 36 12 36C12 36 24 21 24 12C24 5.37258 18.6274 0 12 0Z" fill="${hex}"/>
            <circle cx="12" cy="12" r="5" fill="white"/>
          </svg>`,
    iconSize: [24, 36],
    iconAnchor: [12, 36],
    popupAnchor: [0, -36]
  });
};

const Heatmap = ({ tasks = [], filters = {} }) => {
  const [isMounted, setIsMounted] = useState(false)
  const [selectedHotspot, setSelectedHotspot] = useState(null)

  useEffect(() => {
    const raf = requestAnimationFrame(() => setIsMounted(true))
    return () => cancelAnimationFrame(raf)
  }, [])

  const safeTasks = Array.isArray(tasks) ? tasks : []
  const safeFilters = { priority: 'All', category: 'All', ...filters }

  // Filter tasks based on dashboard filters
  const filteredTasks = safeTasks.filter((task) => {
    if (!task) return false
    const lat = parseFloat(task.latitude)
    const lng = parseFloat(task.longitude)
    if (isNaN(lat) || isNaN(lng)) return false

    const matchesPriority = safeFilters.priority === 'All' || task.priority === safeFilters.priority
    const matchesCategory = safeFilters.category === 'All' || task.category === safeFilters.category
    return matchesPriority && matchesCategory
  })

  // ── Predictive AI Logic (Heuristics) ──────────────────────────────────
  // Calculate raw heat data where intensity is based on urgency, priority and age.
  const heatData = useMemo(() => {
    const now = new Date()
    return filteredTasks.map(task => {
      let intensity = 0.3 // Default Low
      if (task.priority === 'High') intensity = 1.0
      else if (task.priority === 'Medium') intensity = 0.6
      
      // If task is older than 24 hours and unresolved, artificially increase intensity (Prediction)
      const createdAt = task.createdAt ? new Date(task.createdAt) : null
      if (createdAt) {
        const hoursOld = (now - createdAt) / (1000 * 60 * 60)
        if (hoursOld > 24) intensity = Math.min(1.0, intensity + 0.3)
      }

      return [parseFloat(task.latitude), parseFloat(task.longitude), intensity]
    })
  }, [filteredTasks])

  // Cluster algorithm to identify Emerging Hotspots (Predictive Logic)
  const predictiveHotspots = useMemo(() => {
    const groups = {}
    
    // Group roughly by 0.05 degrees of latitude/longitude (~5.5km)
    filteredTasks.forEach(task => {
      const lat = parseFloat(task.latitude)
      const lng = parseFloat(task.longitude)
      // Round to 1 decimal for grouping (~11km bounding box) to find regional hotspots
      const gridKey = `${lat.toFixed(1)}_${lng.toFixed(1)}` 
      
      if (!groups[gridKey]) {
        groups[gridKey] = {
          tasks: [],
          latSum: 0,
          lngSum: 0,
          categories: {},
          highPriorityCount: 0
        }
      }
      
      groups[gridKey].tasks.push(task)
      groups[gridKey].latSum += lat
      groups[gridKey].lngSum += lng
      groups[gridKey].categories[task.category] = (groups[gridKey].categories[task.category] || 0) + 1
      if (task.priority === 'High') groups[gridKey].highPriorityCount += 1
    })

    return Object.values(groups).map(group => {
      const total = group.tasks.length
      let isHotspot = false
      let dominantCategory = null
      let maxCatCount = 0

      // Identify dominant category to catch "Critical Trends" (e.g., repeated food shortages)
      Object.entries(group.categories).forEach(([cat, count]) => {
        if (count > maxCatCount) {
          maxCatCount = count
          dominantCategory = cat
        }
      })

      // Prediction trigger: High volume or multiple high priorities or strong category anomaly
      if (total >= 3 || group.highPriorityCount >= 2 || maxCatCount >= 3) {
        isHotspot = true
      }

      return {
        lat: group.latSum / total, // Center of mass
        lng: group.lngSum / total,
        total,
        dominantCategory,
        isHotspot,
        highPriorityCount: group.highPriorityCount,
        tasks: group.tasks
      }
    }).filter(group => group.isHotspot) // Only return the critical zones
  }, [filteredTasks])

  const mapCenter = filteredTasks.length > 0 
    ? [parseFloat(filteredTasks[0].latitude), parseFloat(filteredTasks[0].longitude)]
    : [20.5937, 78.9629]

  if (!isMounted) return <div className="bg-zinc-950 w-full h-full animate-pulse" />

  return (
    <div className="relative w-full h-full bg-zinc-950 text-white">
      {/* Floating Status Panel */}
      <div className="absolute top-4 left-4 z-[1000] bg-zinc-900/80 backdrop-blur-xl border border-zinc-700/50 p-5 rounded-2xl shadow-2xl min-w-[280px]">
        <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <Activity className="text-brand-500 w-5 h-5" />
          AI Heatmap Analysis
        </h3>
        <div className="space-y-4">
          <div className="flex justify-between items-center border-b border-zinc-800 pb-3">
            <div className="flex items-center gap-2 text-zinc-400">
              <Layers className="w-4 h-4" />
              <span>Visible Issues</span>
            </div>
            <span className="font-semibold text-lg">{filteredTasks.length}</span>
          </div>
          <div className="flex justify-between items-center border-b border-zinc-800 pb-3">
            <div className="flex items-center gap-2 text-zinc-400">
              <AlertTriangle className="w-4 h-4 text-orange-400" />
              <span>High Priority</span>
            </div>
            <span className="font-semibold text-orange-400 text-lg">
              {filteredTasks.filter(t => t.priority === 'High').length}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2 text-zinc-400">
              <Flame className="w-4 h-4 text-red-500" />
              <span>Predicted Hotspots</span>
            </div>
            <span className="font-semibold text-red-500 text-lg animate-pulse">
              {predictiveHotspots.length}
            </span>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="absolute bottom-6 right-6 z-[1000] bg-zinc-900/90 backdrop-blur-md border border-zinc-700/50 p-4 rounded-xl shadow-xl text-sm font-medium flex items-center gap-4">
        <div className="flex items-center gap-1.5"><span className="text-lg leading-none">🔴</span> <span className="text-zinc-300">High</span></div>
        <div className="w-px h-4 bg-zinc-700"></div>
        <div className="flex items-center gap-1.5"><span className="text-lg leading-none">🟠</span> <span className="text-zinc-300">Medium</span></div>
        <div className="w-px h-4 bg-zinc-700"></div>
        <div className="flex items-center gap-1.5"><span className="text-lg leading-none">🟢</span> <span className="text-zinc-300">Low</span></div>
      </div>

      {/* Map Engine */}
      <MapContainer
        center={mapCenter}
        zoom={5}
        className="w-full h-full z-0 font-sans"
        style={{ backgroundColor: '#09090b' }} // zinc-950 base
        zoomControl={false} // Customizing look
      >
        {/* Dark Futuristic Base Map */}
        <TileLayer
          attribution='&copy; <a href="https://carto.com/">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />

        {/* Heatmap intensity layer */}
        <HeatmapLayer heatData={heatData} />

        {/* Task Markers */}
        {filteredTasks.map(task => (
          task.latitude != null && task.longitude != null && (
            <Marker
              key={task.id}
              position={[parseFloat(task.latitude), parseFloat(task.longitude)]}
              icon={getCustomIcon(getPriorityColor(task.priority))}
            >
              <Popup className="dark-popup" maxWidth={300}>
                <div className="p-1">
                  <h3 className="font-bold text-lg text-zinc-900 mb-1 leading-tight">{task.title}</h3>
                  <p className="text-sm text-zinc-600 mb-2 truncate max-w-[250px]">{task.location}</p>
                  <div className="flex items-center gap-2 mt-2 pt-2 border-t border-zinc-200">
                    <span className="text-xs font-bold uppercase tracking-wider text-zinc-500">Priority:</span>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                      task.priority === 'High' ? 'bg-red-100 text-red-700' :
                      task.priority === 'Medium' ? 'bg-orange-100 text-orange-700' :
                      'bg-green-100 text-green-700'
                    }`}>
                      {task.priority}
                    </span>
                  </div>
                </div>
              </Popup>
            </Marker>
          )
        ))}

        {/* Predictive AI Overlay - Circle Markers for Hotspots */}
        {predictiveHotspots.map((hotspot, idx) => (
          <CircleMarker
            key={`hotspot-${idx}`}
            center={[hotspot.lat, hotspot.lng]}
            radius={24} // large hit area
            pathOptions={{
              color: '#ef4444',
              fillColor: '#ef4444',
              fillOpacity: 0.1,
              weight: 0,
              className: 'pulse-circle hover:cursor-pointer'
            }}
            eventHandlers={{
              click: () => {
                setSelectedHotspot(hotspot)
              }
            }}
          >
            <Popup className="dark-popup" maxWidth={300}>
              <div className="p-2 min-w-[220px]">
                <div className="flex items-center gap-2 mb-3">
                  <Flame className="w-5 h-5 text-red-500" />
                  <span className="text-red-500 font-bold uppercase text-xs tracking-wider">
                    High Risk Hotspot
                  </span>
                </div>
                <h3 className="font-semibold text-lg mb-1">
                  {hotspot.total} Active Tasks
                </h3>
                <p className="text-sm text-zinc-400 mb-3">
                  Critical Trend: <span className="font-medium text-brand-400 capitalize">{hotspot.dominantCategory}</span>
                </p>
                
                {/* Micro task list */}
                <div className="max-h-32 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                  {hotspot.tasks.map(t => (
                    <div key={t.id} className="text-xs bg-zinc-800/50 p-2 rounded border border-zinc-700/50">
                      <div className="font-medium truncate">{t.title}</div>
                      <div className="text-zinc-500 mt-0.5 flex justify-between">
                        <span>{t.priority}</span>
                        <span className="capitalize">{t.category}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Popup>
          </CircleMarker>
        ))}
      </MapContainer>
    </div>
  )
}

export default Heatmap

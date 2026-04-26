import { useState, useEffect, Component } from 'react'
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet'
import { MapPin, Loader2, Check } from 'lucide-react'
import { Icon } from 'leaflet'
import 'leaflet/dist/leaflet.css'

// ErrorBoundary to catch Leaflet internal crashes safely
class MapErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false }
  }
  static getDerivedStateFromError() {
    return { hasError: true }
  }
  componentDidCatch(error, info) {
    console.error('MapErrorBoundary caught:', error, info)
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="h-[400px] w-full rounded-xl border border-zinc-700 flex items-center justify-center bg-zinc-900">
          <p className="text-sm text-zinc-500">Map failed to load. Please try again.</p>
        </div>
      )
    }
    return this.props.children
  }
}

// Fix Leaflet default icon paths dynamically for Vite
import iconUrl from 'leaflet/dist/images/marker-icon.png'
import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png'
import shadowUrl from 'leaflet/dist/images/marker-shadow.png'

delete Icon.prototype._getIconUrl
Icon.mergeOptions({ iconRetinaUrl, iconUrl, shadowUrl })

const DEFAULT_CENTER = [23.2599, 77.4126] // Default central India map

// Interactive Marker component binding the `useMapEvents` logic
const LocationMarker = ({ setLocation, onLocationSelect }) => {
  const [position, setPosition] = useState(null)

  useMapEvents({
    click(e) {
      const { lat, lng } = e.latlng
      setPosition({ lat, lng })
      setLocation((prev) => ({ ...prev, lat, lng, isFetching: true }))

      // Reverse geocode to find real string address
      fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`)
        .then((res) => res.json())
        .then((data) => {
          const address = data.display_name || "Unknown Address"
          
          setLocation({
            lat,
            lng,
            address: address,
            isFetching: false
          })
          
          onLocationSelect({
            lat,
            lng,
            address: address
          })
        })
        .catch(err => {
          console.error("Reverse geocoding error:", err)
          setLocation(prev => ({ ...prev, isFetching: false }))
        })
    }
  })

  return position === null ? null : (
    <Marker position={position} />
  )
}

const LocationPicker = ({ onLocationSelect, selectedLocation, error }) => {
  const [location, setLocation] = useState({
    lat: selectedLocation?.lat || null,
    lng: selectedLocation?.lng || null,
    address: selectedLocation?.address || "",
    isFetching: false
  })

  const [mapReady, setMapReady] = useState(false)

  // Delay map rendering slightly until it calculates DOM boundaries. Fixes crashes on strict-mode
  useEffect(() => {
    const raf = requestAnimationFrame(() => setMapReady(true))
    return () => cancelAnimationFrame(raf)
  }, [])

  return (
    <div className="space-y-4">
      {/* Selected location banner */}
      {location.lat && location.lng && !location.isFetching && (
        <div className="flex items-start gap-2 px-4 py-3 bg-brand-500/10 border border-brand-500/20 rounded-xl">
          <Check className="w-4 h-4 text-brand-400 mt-0.5 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm text-brand-400 font-medium">Location Selected ✅</p>
            <p className="text-sm text-zinc-300 mt-0.5 break-words">{location.address}</p>
            <p className="text-xs text-zinc-500 mt-1">
              {location.lat.toFixed(5)}, {location.lng.toFixed(5)}
            </p>
          </div>
        </div>
      )}

      {location.isFetching && (
        <div className="flex items-center gap-2 px-4 py-3 bg-zinc-800/50 border border-zinc-700/50 rounded-xl font-medium text-zinc-400 text-sm">
          <Loader2 className="w-4 h-4 animate-spin text-brand-500" />
          Translating map coordinates to physical address...
        </div>
      )}

      {/* Helper text */}
      {(!location.lat || !location.lng) && (
        <p className="text-xs text-brand-400 font-medium animate-pulse">
          Click anywhere on the map to pin the exact problem location!
        </p>
      )}

      {/* Error Output */}
      {error && <p className="text-sm text-red-400">{error}</p>}

      {/* Map Interactive Zone */}
      {mapReady ? (
        <MapErrorBoundary>
          <div className="h-[400px] w-full rounded-xl overflow-hidden border border-zinc-800 shadow-sm relative z-0">
            <MapContainer
              center={DEFAULT_CENTER}
              zoom={5}
              className="w-full h-full"
              style={{ backgroundColor: '#09090b', zIndex: 0 }}
              zoomControl={true}
              dragging={true}
            >
              {/* Using a high contrast clean CartoDB Dark tile to match UI theme */}
              <TileLayer
                attribution='&copy; <a href="https://carto.com/">CARTO</a>'
                url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
              />
              <LocationMarker 
                setLocation={setLocation} 
                onLocationSelect={onLocationSelect} 
              />
            </MapContainer>
          </div>
        </MapErrorBoundary>
      ) : (
        <div className="h-[400px] w-full rounded-xl flex items-center justify-center border border-zinc-800 bg-zinc-950">
           <Loader2 className="w-8 h-8 animate-spin text-zinc-500" />
        </div>
      )}
    </div>
  )
}

export default LocationPicker

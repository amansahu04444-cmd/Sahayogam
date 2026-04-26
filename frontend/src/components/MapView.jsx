import { MapContainer, TileLayer, Marker } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'
import { useEffect, useRef } from 'react'

// Fix marker icon issue - CRITICAL for leaflet
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
})

const MapView = ({ lat, lng, title, address }) => {
  const mapRef = useRef(null)

  // Safety check
  const safeLat = Number(lat)
  const safeLng = Number(lng)

  if (!safeLat || !safeLng || isNaN(safeLat) || isNaN(safeLng)) {
    return (
      <div className="h-64 w-full flex items-center justify-center bg-zinc-800/50 rounded-xl">
        <p className="text-zinc-400 text-sm">Location coordinates not available</p>
      </div>
    )
  }

  return (
    <div className="w-full h-64 rounded-xl overflow-hidden bg-zinc-900 border border-zinc-800">
      <MapContainer
        center={[safeLat, safeLng]}
        zoom={13}
        scrollWheelZoom={true}
        style={{ height: '100%', width: '100%' }}
        whenCreated={(map) => {
          mapRef.current = map
        }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker position={[safeLat, safeLng]} />
      </MapContainer>
    </div>
  )
}

export default MapView

import { useEffect } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap, Polyline } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

// Fix lỗi icon
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

const busIcon = new L.Icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/3448/3448339.png',
  iconSize: [40, 40],
  iconAnchor: [20, 40],
})

const stopIcon = new L.Icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/1828/1828859.png', // Icon điểm dừng
  iconSize: [20, 20],
})

const MapUpdater = ({ center }) => {
  const map = useMap();
  useEffect(() => {
    if (center) map.setView(center, map.getZoom());
  }, [center, map]);
  return null;
};

// Thêm props: routePath (mảng tọa độ vẽ đường), stops (các trạm dừng)
const MapComponent = ({ center, buses = [], routePath = [], stops = [] }) => {
  return (
    <MapContainer center={center} zoom={14} style={{ height: '100%', width: '100%', borderRadius: '8px' }}>
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      <MapUpdater center={center} />

      {/* VẼ ĐƯỜNG ĐI */}
      {routePath.length > 0 && <Polyline positions={routePath} color="blue" weight={5} />}

      {/* VẼ CÁC TRẠM DỪNG */}
      {stops.map((stop, idx) => (
        <Marker key={idx} position={[stop.lat, stop.lng]} icon={stopIcon}>
          <Popup>{stop.name}</Popup>
        </Marker>
      ))}

      {/* VẼ XE BUS */}
      {buses.map((bus) => (
        <Marker key={bus.idXeBus} position={bus.position} icon={busIcon}>
          <Popup>{bus.bienSo}</Popup>
        </Marker>
      ))}
    </MapContainer>
  )
}

export default MapComponent
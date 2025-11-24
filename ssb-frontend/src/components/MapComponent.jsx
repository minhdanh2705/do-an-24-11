import { useEffect } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap, Polyline } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

// Fix lỗi icon mặc định
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

// Icon Xe Bus (To hơn)
const busIcon = new L.Icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/3448/3448339.png',
  iconSize: [45, 45],
  iconAnchor: [22, 45],
})

// Icon Trạm Dừng (Dùng icon Location màu đỏ cơ bản cho dễ nhìn)
const stopIcon = new L.Icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/684/684908.png', 
  iconSize: [30, 30],
  iconAnchor: [15, 30],
})

const MapUpdater = ({ center }) => {
  const map = useMap();
  useEffect(() => {
    if (center && center[0] !== 0) {
        map.setView(center, 14, { animate: true });
    }
  }, [center, map]);
  return null;
};

const MapComponent = ({ center, buses = [], stops = [] }) => {
  // Tạo đường nối (Dù thẳng nhưng cho mờ đi để đỡ thô)
  const routeLine = stops
    .filter(s => s.viDo && s.kinhDo)
    .map(s => [s.viDo, s.kinhDo]);

  return (
    <MapContainer center={center} zoom={13} style={{ height: '100%', width: '100%', borderRadius: '8px' }}>
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      <MapUpdater center={center} />

      {/* Vẽ đường nối mờ mờ */}
      {routeLine.length > 1 && <Polyline positions={routeLine} color="#3388ff" weight={4} opacity={0.6} dashArray="10, 10" />}

      {/* Vẽ các điểm dừng */}
      {stops.map((stop, idx) => (
         stop.viDo && stop.kinhDo && (
            <Marker key={stop.idDiemDung || idx} position={[stop.viDo, stop.kinhDo]} icon={stopIcon}>
              <Popup>
                <b>Trạm {stop.thuTu}: {stop.tenDiemDung}</b>
              </Popup>
            </Marker>
         )
      ))}

      {/* Vẽ xe bus */}
      {buses.map((bus, idx) => (
          bus.latitude && bus.longitude && (
            <Marker key={idx} position={[bus.latitude, bus.longitude]} icon={busIcon} zIndexOffset={1000}>
              <Popup>Xe đang ở đây</Popup>
            </Marker>
          )
      ))}
    </MapContainer>
  )
}

export default MapComponent
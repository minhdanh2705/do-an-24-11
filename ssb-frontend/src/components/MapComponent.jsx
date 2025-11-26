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

const busIcon = new L.Icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/3448/3448339.png',
  iconSize: [45, 45],
  iconAnchor: [22, 45],
})

// Icon Trạm Thường (Màu xám nhỏ)
const stopIconDefault = new L.Icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/684/684908.png', 
  iconSize: [25, 25],
  iconAnchor: [12, 25],
  className: 'opacity-75' // Làm mờ trạm thường
})

// Icon Trạm Của Bé - ĐANG CHỜ (Vàng/Cam)
const stopIconWaiting = new L.Icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/1483/1483336.png', // Icon khác nổi bật hơn
  iconSize: [40, 40],
  iconAnchor: [20, 40],
})

// Icon Trạm Của Bé - ĐÃ LÊN XE (Xanh lá)
const stopIconOnboard = new L.Icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/190/190411.png', // Check mark xanh
  iconSize: [40, 40],
  iconAnchor: [20, 40],
})

// Icon Trạm Của Bé - VẮNG/TRỄ (Đỏ)
const stopIconMissed = new L.Icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/1828/1828843.png', // X mark đỏ
  iconSize: [40, 40],
  iconAnchor: [20, 40],
})

const MapUpdater = ({ center }) => {
  const map = useMap();
  useEffect(() => {
    if (center && center[0] !== 0) {
        map.setView(center, 13, { animate: true });
    }
  }, [center, map]);
  return null;
};

const MapComponent = ({ center, buses = [], stops = [], userStopId = null, userStatus = 0 }) => {
  // Tạo đường nối
  const routeLine = stops
    .filter(s => s.viDo && s.kinhDo)
    .map(s => [s.viDo, s.kinhDo]);

  // Hàm chọn icon cho từng trạm
  const getStopIcon = (stop) => {
      // Nếu là trạm đón của bé
      if (stop.idDiemDung === userStopId) {
          if (userStatus === 1) return stopIconOnboard; // Đã đón
          if (userStatus === 3) return stopIconMissed;  // Vắng
          if (userStatus === 2) return stopIconOnboard; // Đã trả (Cũng hiện xanh)
          return stopIconWaiting; // Đang chờ
      }
      // Các trạm khác
      return stopIconDefault;
  }

  return (
    <MapContainer center={center} zoom={13} style={{ height: '100%', width: '100%', borderRadius: '8px' }}>
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      <MapUpdater center={center} />

      {/* Vẽ đường nối nét đứt */}
      {routeLine.length > 1 && <Polyline positions={routeLine} color="#3388ff" weight={4} opacity={0.6} dashArray="10, 10" />}

      {/* Vẽ các điểm dừng */}
      {stops.map((stop, idx) => (
         stop.viDo && stop.kinhDo && (
            <Marker 
                key={stop.idDiemDung || idx} 
                position={[stop.viDo, stop.kinhDo]} 
                icon={getStopIcon(stop)}
                zIndexOffset={stop.idDiemDung === userStopId ? 1000 : 0} // Đẩy trạm của bé lên trên cùng
            >
              <Popup>
                <b>Trạm {stop.thuTu}: {stop.tenDiemDung}</b>
                {stop.idDiemDung === userStopId && (
                    <div style={{color: userStatus === 3 ? 'red' : 'green', fontWeight:'bold'}}>
                        {userStatus === 3 ? '(Đã bỏ lỡ)' : '(Điểm đón của bé)'}
                    </div>
                )}
              </Popup>
            </Marker>
         )
      ))}

      {/* Vẽ xe bus */}
      {buses.map((bus, idx) => (
          bus.latitude && bus.longitude && (
            <Marker key={idx} position={[bus.latitude, bus.longitude]} icon={busIcon} zIndexOffset={2000}>
              <Popup>Xe đang ở đây</Popup>
            </Marker>
          )
      ))}
    </MapContainer>
  )
}

export default MapComponent
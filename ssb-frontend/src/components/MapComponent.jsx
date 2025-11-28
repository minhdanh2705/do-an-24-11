import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import RoutingMachine from "./RoutingMachine"; 
import AnimatedBusMarker from "./AnimatedBusMarker"; // <--- IMPORT COMPONENT MỚI

// Fix lỗi icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

const busIcon = new L.Icon({
  iconUrl: "https://cdn-icons-png.flaticon.com/512/3448/3448339.png",
  iconSize: [45, 45], // To hơn chút cho đẹp
  iconAnchor: [22, 40], // Căn chỉnh để đáy icon nằm đúng đường
});

// Thêm prop busRoute vào
const MapComponent = ({ center, stops = [], busRoute = null, onBusArrived }) => {
  const validCenter = (center && center[0]) ? center : [10.762, 106.66];

  return (
    <MapContainer center={validCenter} zoom={13} style={{ height: "100%", width: "100%" }}>
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

      {/* Vẽ đường đi tĩnh */}
      {stops && stops.length > 0 && <RoutingMachine stops={stops} />}

      {/* Vẽ các trạm dừng */}
      {stops.map((stop, index) => (
        <Marker key={index} position={[stop.viDo, stop.kinhDo]}>
          <Popup>{stop.tenDiemDung}</Popup>
        </Marker>
      ))}

      {/* --- XE BUS CHẠY MƯỢT --- */}
      {/* Chỉ hiển thị khi có lộ trình (busRoute khác null) */}
      {busRoute && (
        <AnimatedBusMarker 
            routeCoords={busRoute} 
            icon={busIcon}
            onAnimationComplete={onBusArrived} // Gọi hàm khi chạy xong
        >
            <Popup>Xe đang di chuyển...</Popup>
        </AnimatedBusMarker>
      )}
      
      {/* Nếu không chạy (đứng yên) thì vẽ Marker thường ở điểm đầu */}
      {!busRoute && stops.length > 0 && (
         <Marker position={validCenter} icon={busIcon} opacity={0.5} />
      )}

    </MapContainer>
  );
};

export default MapComponent;
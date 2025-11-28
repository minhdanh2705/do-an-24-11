import { useEffect } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet-routing-machine";
import "leaflet-routing-machine/dist/leaflet-routing-machine.css";

const RoutingMachine = ({ stops }) => {
  const map = useMap();

  useEffect(() => {
    if (!map || !stops || stops.length < 2) return;

    // Tạo các điểm dừng (Waypoints) từ dữ liệu stops của bạn
    const waypoints = stops.map((stop) => L.latLng(stop.viDo, stop.kinhDo));

    const routingControl = L.Routing.control({
      waypoints: waypoints,
      routeWhileDragging: false, // Không cho kéo sửa đường
      addWaypoints: false,       // Không cho thêm điểm
      draggableWaypoints: false, // Không cho di chuyển điểm
      fitSelectedRoutes: true,   // Tự động zoom để thấy toàn bộ lộ trình
      show: false,               // ẨN BẢNG CHỈ DẪN (Turn-by-turn text)
      
      // Tùy chỉnh đường vẽ (Màu xanh, đậm hơn)
      lineOptions: {
        styles: [{ color: "#3b82f6", opacity: 0.8, weight: 6 }]
      },

      // Tắt marker mặc định của Routing Machine (để dùng marker đẹp của bạn)
      createMarker: function() { return null; } 
    }).addTo(map);

    // Ẩn bảng hướng dẫn bằng CSS (cho chắc chắn)
    const container = routingControl.getContainer();
    if(container) container.style.display = 'none';

    return () => map.removeControl(routingControl);
  }, [map, stops]);

  return null;
};

export default RoutingMachine;
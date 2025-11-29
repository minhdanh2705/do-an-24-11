import { useEffect } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet-routing-machine";
import "leaflet-routing-machine/dist/leaflet-routing-machine.css";

const RoutingMachine = ({ stops }) => {
  const map = useMap();

  useEffect(() => {
    // 1. Kiểm tra đầu vào kỹ càng
    if (!map || !stops || stops.length < 2) return;

    // Tạo danh sách điểm đi qua
    const waypoints = stops.map((stop) => L.latLng(stop.viDo, stop.kinhDo));

    // 2. Khởi tạo Control
    const routingControl = L.Routing.control({
      waypoints: waypoints,
      routeWhileDragging: false,
      addWaypoints: false,
      draggableWaypoints: false,
      fitSelectedRoutes: true,
      show: false, // Ẩn bảng chỉ dẫn text
      lineOptions: {
        styles: [{ color: "#3b82f6", opacity: 0.6, weight: 6 }]
      },
      // Tắt marker mặc định để dùng marker đẹp của chúng ta
      createMarker: function() { return null; },
      // Tắt thông báo lỗi mặc định lên giao diện
      router: new L.Routing.OSRMv1({
        serviceUrl: 'https://router.project-osrm.org/route/v1'
      })
    });

    // 3. Thêm vào map (Bọc trong try-catch để an toàn)
    try {
        routingControl.addTo(map);
        
        // Ẩn container bảng chỉ dẫn bằng CSS
        const container = routingControl.getContainer();
        if (container) container.style.display = 'none';
    } catch (e) {
        console.warn("Lỗi thêm Routing Control:", e);
    }

    // 4. CLEANUP (QUAN TRỌNG NHẤT)
    // Hàm này chạy khi component bị hủy (đóng dialog/chuyển trang)
    return () => {
      try {
          // Kiểm tra xem map và control còn tồn tại không
          if (map && routingControl) {
              // Gỡ control khỏi map
              map.removeControl(routingControl);
              
              // Hack: Đặt waypoints về rỗng để ngắt các request đang treo
              routingControl.setWaypoints([]); 
          }
      } catch (e) {
          // Bỏ qua lỗi 'removeLayer of null' của thư viện
          // Đây là lỗi nội bộ của leaflet-routing-machine khi unmount nhanh
          // console.warn("Lỗi dọn dẹp Routing (Không ảnh hưởng):", e);
      }
    };
  }, [map, stops]);

  return null;
};

export default RoutingMachine;
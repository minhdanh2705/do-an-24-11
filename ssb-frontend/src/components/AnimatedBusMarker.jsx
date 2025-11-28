import { useEffect, useRef } from "react";
import { Marker, Popup } from "react-leaflet";
import L from "leaflet";

const AnimatedBusMarker = ({ routeCoords, icon, onAnimationComplete, children }) => {
  const markerRef = useRef(null);
  const animationRef = useRef(null);

  // Nếu không có lộ trình thì hiển thị ở vị trí mặc định hoặc điểm cuối cùng
  const position = routeCoords && routeCoords.length > 0 ? routeCoords[0] : [10.762, 106.66];

  useEffect(() => {
    if (!routeCoords || routeCoords.length < 2) return;

    const marker = markerRef.current;
    if (!marker) return;

    // --- CẤU HÌNH TỐC ĐỘ ---
    const speedFactor = 1; // Tăng số này để chạy nhanh hơn, giảm để chậm lại
    
    let startIndex = 0;
    let startTime = performance.now();

    const animate = (time) => {
      const timeElapsed = time - startTime;
      // Tính toán xem đang ở đâu trong mảng tọa độ
      // Giả sử mỗi đoạn nhỏ giữa 2 điểm OSRM đi mất 20ms / speedFactor
      const durationPerSegment = 30 / speedFactor; 
      
      // Index hiện tại (số nguyên)
      const currentIndex = Math.floor(timeElapsed / durationPerSegment);
      
      // Nếu đã đi hết danh sách
      if (currentIndex >= routeCoords.length - 1) {
        marker.setLatLng(routeCoords[routeCoords.length - 1]); // Về đích
        if (onAnimationComplete) onAnimationComplete();
        return; 
      }

      // Tính toán nội suy (Interpolation) giữa điểm A và điểm B để mượt mà
      const startPoint = routeCoords[currentIndex];
      const endPoint = routeCoords[currentIndex + 1];
      
      // Tỉ lệ % đã đi được trong đoạn nhỏ này
      const ratio = (timeElapsed % durationPerSegment) / durationPerSegment;

      const lat = startPoint[0] + (endPoint[0] - startPoint[0]) * ratio;
      const lng = startPoint[1] + (endPoint[1] - startPoint[1]) * ratio;

      // Cập nhật trực tiếp vào Leaflet (Bỏ qua React State -> Siêu mượt)
      marker.setLatLng([lat, lng]);

      // Xoay đầu xe theo hướng di chuyển (Optional - nếu muốn xe quay đầu)
      // const angle = Math.atan2(endPoint[1] - startPoint[1], endPoint[0] - startPoint[0]) * 180 / Math.PI;
      // marker.setRotationAngle(angle); 

      animationRef.current = requestAnimationFrame(animate);
    };

    // Bắt đầu chạy
    animationRef.current = requestAnimationFrame(animate);

    // Dọn dẹp khi component unmount
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };

  }, [routeCoords]); // Chỉ chạy lại khi có lộ trình mới

  return (
    <Marker ref={markerRef} position={position} icon={icon}>
      {children}
    </Marker>
  );
};

export default AnimatedBusMarker;
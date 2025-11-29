import { useEffect, useRef } from "react";
import { Marker } from "react-leaflet";

const AnimatedBusMarker = ({ routeCoords, icon, onAnimationComplete, children }) => {
  const markerRef = useRef(null);
  const animationRef = useRef(null);

  // Vị trí an toàn
  const position = (routeCoords && routeCoords.length > 0) ? routeCoords[0] : [10.762, 106.66];

  useEffect(() => {
    // 1. AN TOÀN: Nếu dữ liệu rỗng hoặc quá ít điểm -> Kết thúc ngay lập tức
    if (!routeCoords || routeCoords.length < 2) {
        if (onAnimationComplete) onAnimationComplete();
        return;
    }

    const marker = markerRef.current;
    if (!marker) return;

    const speedFactor = 2; // Tốc độ vừa phải
    let startTime = performance.now();

    const animate = (time) => {
      const timeElapsed = time - startTime;
      const durationPerSegment = 30 / speedFactor; 
      
      const currentIndex = Math.floor(timeElapsed / durationPerSegment);
      
      // 2. KẾT THÚC: Đi hết đường
      if (currentIndex >= routeCoords.length - 1) {
        if (routeCoords[routeCoords.length - 1]) {
            marker.setLatLng(routeCoords[routeCoords.length - 1]); 
        }
        if (onAnimationComplete) onAnimationComplete();
        return; 
      }

      // 3. TÍNH TOÁN
      const startPoint = routeCoords[currentIndex];
      const endPoint = routeCoords[currentIndex + 1];

      // Nếu dữ liệu lỗi đoạn giữa -> Bỏ qua frame này
      if (!startPoint || !endPoint) {
          animationRef.current = requestAnimationFrame(animate);
          return;
      }
      
      const ratio = (timeElapsed % durationPerSegment) / durationPerSegment;
      const lat = startPoint[0] + (endPoint[0] - startPoint[0]) * ratio;
      const lng = startPoint[1] + (endPoint[1] - startPoint[1]) * ratio;

      if (!isNaN(lat) && !isNaN(lng)) {
          marker.setLatLng([lat, lng]);
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };

  }, [routeCoords]);

  return (
    <Marker ref={markerRef} position={position} icon={icon}>
      {children}
    </Marker>
  );
};

export default AnimatedBusMarker;
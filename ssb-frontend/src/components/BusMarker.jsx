import { useEffect, useRef } from "react";
import { Marker } from "react-leaflet";

// Thêm prop 'duration' (mặc định 1000ms)
const BusMarker = ({ position, icon, duration = 1000, children }) => {
  const markerRef = useRef(null);
  const prevPosRef = useRef(position); 

  useEffect(() => {
    const marker = markerRef.current;
    if (!marker) return;

    const start = prevPosRef.current; 
    const end = position;             

    if (start[0] === end[0] && start[1] === end[1]) return;

    const startTime = performance.now();

    const animate = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1); // Sử dụng duration từ props

      const currentLat = start[0] + (end[0] - start[0]) * progress;
      const currentLng = start[1] + (end[1] - start[1]) * progress;

      marker.setLatLng([currentLat, currentLng]);

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        prevPosRef.current = position; 
      }
    };

    requestAnimationFrame(animate);

  }, [position[0], position[1], duration]); // Thêm duration vào dependency

  return (
    <Marker ref={markerRef} position={position} icon={icon}>
      {children}
    </Marker>
  );
};

export default BusMarker;
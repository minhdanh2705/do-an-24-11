import { useState, useEffect, useCallback } from 'react';
import io from 'socket.io-client';

const SOCKET_URL = 'http://localhost:5000';

const useRealTimeTracking = () => {
  const [socket, setSocket] = useState(null);
  const [busLocations, setBusLocations] = useState({});
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const newSocket = io(SOCKET_URL, {
      transports: ['websocket', 'polling']
    });

    newSocket.on('connect', () => {
      console.log('[v0] Socket.IO connected');
      setConnected(true);
    });

    newSocket.on('disconnect', () => {
      console.log('[v0] Socket.IO disconnected');
      setConnected(false);
    });

    newSocket.on('bus:locationUpdate', (data) => {
      console.log('[v0] Bus location update:', data);
      setBusLocations(prev => ({
        ...prev,
        [data.idXeBus]: {
          latitude: data.latitude,
          longitude: data.longitude,
          speed: data.speed,
          heading: data.heading,
          timestamp: data.timestamp
        }
      }));
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, []);

  const updateLocation = useCallback((idXeBus, latitude, longitude, speed, heading) => {
    if (socket && connected) {
      socket.emit('driver:updateLocation', {
        idXeBus,
        latitude,
        longitude,
        speed,
        heading,
        timestamp: new Date().toISOString()
      });
    }
  }, [socket, connected]);

  return {
    connected,
    busLocations,
    updateLocation
  };
};

export default useRealTimeTracking;

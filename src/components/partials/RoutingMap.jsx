import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-routing-machine/dist/leaflet-routing-machine.css';
import 'leaflet-routing-machine';

const RoutingMap = ({
  startLocation = null, // { latitude, longitude }
  endLocation = null,   // { latitude, longitude }
  endLocationLabel = '', // Label for popup on end location marker
  className = '',
  defaultCenter = [14.796978, 121.041039],
  zoom = 13,
}) => {
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const routingControl = useRef(null);

  useEffect(() => {
    if (!mapRef.current) return;

    // Initialize map if it doesn't exist
    if (!mapInstance.current) {
      mapInstance.current = L.map(mapRef.current).setView(defaultCenter, zoom);

      // Add OpenStreetMap tiles
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19,
      }).addTo(mapInstance.current);
    }

    // Remove existing routing control if any
    if (routingControl.current) {
      mapInstance.current.removeControl(routingControl.current);
      routingControl.current = null;
    }

    if (startLocation && endLocation) {
      const formatCoord = (coord) => parseFloat(coord).toString();

      const formattedStart = {
        latitude: startLocation.latitude,
        longitude: startLocation.longitude,
      };
      const formattedEnd = {
        latitude: endLocation.latitude,
        longitude: endLocation.longitude,
      };

      const waypoints = [
        L.latLng(formattedStart.latitude, formattedStart.longitude),
        L.latLng(formattedEnd.latitude, formattedEnd.longitude),
      ];

      routingControl.current = L.Routing.control({
        waypoints: waypoints,
        lineOptions: {
          styles: [{ color: '#2563eb', weight: 5 }],
        },
        createMarker: function(i, wp) {
          const iconHtml = i === 0
            ? '<div style="background-color: #2563eb; width: 25px; height: 25px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 5px rgba(0,0,0,0.3); color: white; font-size: 12px; text-align: center; line-height: 25px;">📍</div>'
            : '<div style="background-color: white; width: 30px; height: 30px; border-radius: 50%; border: 1px solid grey; display: flex; align-items: center; justify-content: center;">🚨</div>';

          const iconSize = i === 0 ? [25, 25] : [30, 30];
          const iconAnchor = i === 0 ? [12.5, 12.5] : [15, 30];

          const icon = L.divIcon({
            html: iconHtml,
            iconSize: iconSize,
            iconAnchor: iconAnchor,
            className: '',
          });

          // For endLocation marker, use rounded coordinates for exact pin position
          const markerLatLng = i === 1
            ? L.latLng(formattedEnd.latitude, formattedEnd.longitude)
            : wp.latLng;

          const marker = L.marker(markerLatLng, { icon: icon });
          if (i === 1 && endLocationLabel) {
            const popupContent = `<div><strong>Emergency Location</strong> <br>Coordinates: ${formatCoord(formattedEnd.latitude)}, ${formatCoord(formattedEnd.longitude)}</div>`;
            marker.bindPopup(popupContent);
          }
          return marker;
        },
        addWaypoints: false,
        routeWhileDragging: false,
        draggableWaypoints: false,
        fitSelectedRoutes: true,
        showAlternatives: false,
      }).addTo(mapInstance.current);
    } else {
      
      // If no valid start/end, just center map on defaultCenter
      mapInstance.current.setView(defaultCenter, zoom);
    }

  }, [startLocation, endLocation, defaultCenter, zoom]);

  useEffect(() => {
    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };
  }, []);

  return (
    <div
      ref={mapRef}
      className={`w-full h-full ${className}`}
      style={{ minHeight: '300px' }}
    />
  );
};

export default RoutingMap;

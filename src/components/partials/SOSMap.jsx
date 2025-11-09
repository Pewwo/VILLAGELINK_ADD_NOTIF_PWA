import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const SOSMap = ({ address, locationUrl, className = '', defaultCenter = [14.796978, 121.041039], currentLocation = null }) => {
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const markerRef = useRef(null);
  const currentLocationMarkerRef = useRef(null);
  const polylineRef = useRef(null);

  useEffect(() => {
    if (!mapRef.current) return;

    // Initialize map if it doesn't exist
    if (!mapInstance.current) {
      mapInstance.current = L.map(mapRef.current).setView(defaultCenter, 13);
      
      // Add OpenStreetMap tiles
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19,
      }).addTo(mapInstance.current);
    }

    // Extract coordinates from Google Maps URL
    const extractCoordinates = (url) => {
      try {
        const urlObj = new URL(url);
        const query = urlObj.searchParams.get('q');
        if (query) {
          const [lat, lng] = query.split(',').map(coord => parseFloat(coord.trim()));
          if (!isNaN(lat) && !isNaN(lng)) {
            return [lat, lng];
          }
        }
        
        // Fallback: Try to extract from other URL formats
        const match = url.match(/@(-?\d+\.?\d*),(-?\d+\.?\d*)/);
        if (match) {
          return [parseFloat(match[1]), parseFloat(match[2])];
        }
      } catch (error) {
        console.error('Error parsing URL:', error);
      }
      
      // Default fallback coordinates (configurable)
      return defaultCenter;
    };

    const emergencyCoordinates = extractCoordinates(locationUrl);

    // Calculate bounds to fit both markers
    let bounds = L.latLngBounds([emergencyCoordinates]);
    
    // Remove existing markers and polyline
    if (markerRef.current) {
      mapInstance.current.removeLayer(markerRef.current);
    }
    if (currentLocationMarkerRef.current) {
      mapInstance.current.removeLayer(currentLocationMarkerRef.current);
    }
    if (polylineRef.current) {
      mapInstance.current.removeLayer(polylineRef.current);
    }

    // Add emergency marker
    const emergencyIcon = L.divIcon({
      html: `<div style="
        background-color: #FFFFFF;
        width: 30px;
        height: 30px;
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        border: 1px solid grey;
        box-shadow: 0 2px 5px rgba(0,0,0,0.3);
      ">
        <div style="
          transform: rotate(45deg);
          color: white;
          font-size: 16px;
          text-align: center;
          line-height: 30px;
        ">🚨</div>
      </div>`,
      iconSize: [30, 30],
      iconAnchor: [15, 30],
      popupAnchor: [0, -30],
      className: 'sos-marker'
    });

    markerRef.current = L.marker(emergencyCoordinates, { icon: emergencyIcon })
      .addTo(mapInstance.current)
      .bindPopup(`
        <div style="min-width: 200px;">
          <h3 style="font-weight: bold; margin-bottom: 5px;">Emergency Location</h3>
          <p style="margin-bottom: 5px;">${address}</p>
          <p style="font-size: 12px; color: #666;">Coordinates: ${emergencyCoordinates[0].toFixed(6)}, ${emergencyCoordinates[1].toFixed(6)}</p>
        </div>
      `);

    // Add current location marker if available
    if (currentLocation && currentLocation.latitude && currentLocation.longitude) {
      const currentCoords = [currentLocation.latitude, currentLocation.longitude];
      bounds.extend(currentCoords);
      
      const currentLocationIcon = L.divIcon({
        html: `<div style="
          background-color: #2563eb;
          width: 25px;
          height: 25px;
          border-radius: 50%;
          border: 2px solid white;
          box-shadow: 0 2px 5px rgba(0,0,0,0.3);
        ">
          <div style="
            color: white;
            font-size: 12px;
            text-align: center;
            line-height: 25px;
          ">📍</div>
        </div>`,
        iconSize: [25, 25],
        iconAnchor: [12.5, 12.5],
        popupAnchor: [0, -12.5],
        className: 'current-location-marker'
      });

      currentLocationMarkerRef.current = L.marker(currentCoords, { icon: currentLocationIcon })
        .addTo(mapInstance.current)
        .bindPopup(`
          <div style="min-width: 200px;">
            <h3 style="font-weight: bold; margin-bottom: 5px;">Your Location</h3>
            <p style="font-size: 12px; color: #666;">Coordinates: ${currentCoords[0].toFixed(6)}, ${currentCoords[1].toFixed(6)}</p>
          </div>
        `);

      // Add polyline between current location and emergency location
      polylineRef.current = L.polyline([currentCoords, emergencyCoordinates], {
        color: '#2563eb',
        weight: 4,
        opacity: 0.7,
        dashArray: '10, 10',
        lineJoin: 'round'
      }).addTo(mapInstance.current);

      // Fit map to show both markers
      mapInstance.current.fitBounds(bounds, { padding: [50, 50] });
    } else {
      // If no current location, just center on emergency location
      mapInstance.current.setView(emergencyCoordinates, 17);
    }

  }, [address, locationUrl, defaultCenter, currentLocation]);

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

export default SOSMap;

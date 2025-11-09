import React, { useState, useEffect, useRef } from "react";

const AccountMap = ({
  address,
  locationUrl,
  className = '',
  defaultCenter = [14.796981, 121.040977],
  currentLocation = null,
  onCoordinatesChange = () => {}
}) => {
  const [coordinates, setCoordinates] = useState(null);
  const mapRef = useRef(null);       // div container
  const mapInstance = useRef(null);  // map itself
  const markerRef = useRef(null);    // marker instance
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initMap = async () => {
      try {
        const L = await import("leaflet");

        // Fix Leaflet default icons
        delete L.Icon.Default.prototype._getIconUrl;
        L.Icon.Default.mergeOptions({
          iconRetinaUrl:
            "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
          iconUrl:
            "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
          shadowUrl:
            "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
        });

        // Custom pin icon
        const customIcon = L.icon({
          iconUrl: "https://cdn-icons-png.flaticon.com/512/684/684908.png",
          iconSize: [32, 32],
          iconAnchor: [16, 32],
          popupAnchor: [0, -32],
        });

        // ✅ Only init once
        if (!mapInstance.current) {
          const map = L.map(mapRef.current, {
            center: defaultCenter,
            zoom: 17,
          });
          mapInstance.current = map;

          L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
            attribution: "© OpenStreetMap contributors",
            maxZoom: 20,
          }).addTo(map);

          // Click handler
          map.on("click", (e) => {
            const { lat, lng } = e.latlng;
            const coords = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
            setCoordinates(coords);

            if (onCoordinatesChange) onCoordinatesChange([lat, lng]);

            // Remove old marker
            if (markerRef.current) {
              map.removeLayer(markerRef.current);
            }

            // Add new draggable marker
            markerRef.current = L.marker([lat, lng], {
              icon: customIcon,
              draggable: true
            })
              .addTo(map)
              .bindPopup(`
                <b>Account Location</b><br/>
                ${address || "No address provided"}<br/>
                <small>Coordinates: ${lat.toFixed(6)}, ${lng.toFixed(6)}</small>
              `)
              .openPopup();

            // Handle drag events
            markerRef.current.on('dragend', (event) => {
              const marker = event.target;
              const position = marker.getLatLng();
              const newCoords = [position.lat, position.lng];

              // Update popup content with new coordinates
              marker.setPopupContent(`
                <b>Account Location</b><br/>
                ${address || "No address provided"}<br/>
                <small>Coordinates: ${position.lat.toFixed(6)}, ${position.lng.toFixed(6)}</small>
              `);

              // Update coordinates
              if (onCoordinatesChange) onCoordinatesChange(newCoords);
            });
          });

          setIsLoading(false);
        }
      } catch (err) {
        console.error("Map init failed:", err);
        setIsLoading(false);
      }
    };

    initMap();

    // cleanup on unmount
    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };
  }, []);

  // Update marker when locationUrl or currentLocation changes
  useEffect(() => {
    if (!mapInstance.current) return;

    const extractCoordinates = (url) => {
      if (!url || typeof url !== 'string' || !url.startsWith('http')) {
        return defaultCenter;
      }
      try {
        const urlObj = new URL(url);
        const query = urlObj.searchParams.get('q');
        if (query) {
          const [lat, lng] = query.split(',').map(coord => parseFloat(coord.trim()));
          if (!isNaN(lat) && !isNaN(lng)) return [lat, lng];
        }
        const match = url.match(/@(-?\d+\.?\d*),(-?\d+\.?\d*)/);
        if (match) return [parseFloat(match[1]), parseFloat(match[2])];
      } catch (e) {
        console.error('Error parsing URL:', e);
      }
      return defaultCenter;
    };

    const coordinates = currentLocation || extractCoordinates(locationUrl);

    // Remove old marker
    if (markerRef.current) {
      mapInstance.current.removeLayer(markerRef.current);
    }

    // Custom pin icon
    const L = window.L;
    const customIcon = L.icon({
      iconUrl: "https://cdn-icons-png.flaticon.com/512/684/684908.png",
      iconSize: [32, 32],
      iconAnchor: [16, 32],
      popupAnchor: [0, -32],
    });

    // Add new draggable marker
    markerRef.current = L.marker(coordinates, {
      icon: customIcon,
      draggable: true
    })
      .addTo(mapInstance.current)
      .bindPopup(`
        <b>Account Location</b><br/>
        ${address || "No address provided"}<br/>
        <small>Coordinates: ${coordinates[0].toFixed(6)}, ${coordinates[1].toFixed(6)}</small>
      `);

    // Handle drag events
    markerRef.current.on('dragend', (event) => {
      const marker = event.target;
      const position = marker.getLatLng();
      const newCoords = [position.lat, position.lng];

      // Update popup content with new coordinates
      marker.setPopupContent(`
        <b>Account Location</b><br/>
        ${address || "No address provided"}<br/>
        <small>Coordinates: ${position.lat.toFixed(6)}, ${position.lng.toFixed(6)}</small>
      `);

      // Update coordinates
      if (onCoordinatesChange) onCoordinatesChange(newCoords);
    });

    // Center map on the location
    mapInstance.current.setView(coordinates, 17);

  }, [locationUrl, currentLocation, address, defaultCenter]);

  return (
    <div className={`relative ${className}`}>
      <div
        ref={mapRef}
        className="w-full h-full border border-gray-300 rounded-lg shadow-inner overflow-hidden"
        style={{ minHeight: '300px' }}
      />
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 bg-opacity-75 rounded-lg">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
            <p className="text-gray-600 text-sm">Loading map...</p>
          </div>
        </div>
      )}
      <div className="absolute bottom-2 left-2 bg-white bg-opacity-90 px-2 py-1 rounded text-xs text-gray-600">
        Click on the map to add location or drag the marker to move it
      </div>
    </div>
  );
};

export default AccountMap;

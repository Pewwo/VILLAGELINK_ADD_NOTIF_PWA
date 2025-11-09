import React, { useState, useEffect, useRef } from "react";

const SimpleMap = ({ onLocationSelect, defaultCenter = [14.796981, 121.040977] }) => {
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

            if (onLocationSelect) onLocationSelect(coords);

            // Remove old marker
            if (markerRef.current) {
              map.removeLayer(markerRef.current);
            }

            // Add new marker
            markerRef.current = L.marker([lat, lng], { icon: customIcon })
              .addTo(map)
              .bindPopup("📍 Your location")
              .openPopup();
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

  return (
    <div>
      <div
        ref={mapRef}
        className="w-full h-80 border-2 border-amber-300 rounded-lg shadow-inner overflow-hidden"
      />
      {isLoading && (
        <div className="mt-2 text-sm text-amber-600">Loading map...</div>
      )}
      <p className="mt-2 text-xs text-amber-600">
        Click anywhere on the map to mark your location
      </p>
    </div>
  );
};

export default SimpleMap;
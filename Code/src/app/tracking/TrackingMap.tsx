"use client";

import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Dynamic Recenter Helper component
function MapController({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.setView(center, map.getZoom(), { animate: true });
    }
  }, [center, map]);
  return null;
}

// Custom markers using high-res CDN assets to bypass Next.js packaging bugs
const residentIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const technicianIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

interface TrackingMapProps {
  userLat: number;
  userLng: number;
  techLat?: number;
  techLng?: number;
  techName?: string;
}

export default function TrackingMap({
  userLat,
  userLng,
  techLat,
  techLng,
  techName
}: TrackingMapProps) {
  const mapCenter: [number, number] = techLat && techLng ? [techLat, techLng] : [userLat, userLng];

  return (
    <div className="w-full h-full relative" style={{ minHeight: "350px" }}>
      <MapContainer
        center={mapCenter}
        zoom={14}
        scrollWheelZoom={true}
        className="w-full h-full"
        style={{ background: "#080808" }}
      >
        {/* CartoDB Dark Matter tiles (Perfect sleek dark style for AetherFlow) */}
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
        />

        {/* Resident/User Marker */}
        <Marker position={[userLat, userLng]} icon={residentIcon}>
          <Popup>
            <div className="text-black font-sans font-bold text-xs">
              Your Location
            </div>
          </Popup>
        </Marker>

        {/* Dynamic Route Line (Module 4) */}
        {techLat && techLng && (
          <Polyline
            positions={[[techLat, techLng], [userLat, userLng]]}
            color="#00dbe9"
            dashArray="6, 12"
            weight={3}
            opacity={0.8}
          />
        )}

        {/* Technician Marker */}
        {techLat && techLng && (
          <Marker position={[techLat, techLng]} icon={technicianIcon}>
            <Popup>
              <div className="text-black font-sans font-bold text-xs">
                {techName || "Technician"} (En Route)
              </div>
            </Popup>
          </Marker>
        )}

        <MapController center={mapCenter} />
      </MapContainer>
    </div>
  );
}

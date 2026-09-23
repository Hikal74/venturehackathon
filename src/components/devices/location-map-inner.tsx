"use client";

import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Polyline } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { initialSimulatedPoint, nextSimulatedPoint, type GpsPoint } from "@/lib/simulated-gps";

const MAX_TRAIL_POINTS = 40;

const deviceIcon = L.divIcon({
  className: "",
  html: `
    <span style="position:relative;display:inline-flex;height:16px;width:16px;">
      <span class="signal-pulse-ring" style="position:absolute;inset:0;border-radius:9999px;background:var(--gradient-brand);opacity:0.5;"></span>
      <span style="position:relative;height:100%;width:100%;border-radius:9999px;background:var(--brand-cobalt);border:2px solid white;box-shadow:0 1px 4px rgba(0,0,0,0.3);"></span>
    </span>
  `,
  iconSize: [16, 16],
  iconAnchor: [8, 8],
});

export default function LocationMapInner() {
  const [trail, setTrail] = useState<GpsPoint[]>(() => [initialSimulatedPoint()]);

  useEffect(() => {
    const timer = setInterval(() => {
      setTrail((prev) => {
        const next = nextSimulatedPoint(prev[prev.length - 1]);
        const updated = [...prev, next];
        return updated.length > MAX_TRAIL_POINTS ? updated.slice(updated.length - MAX_TRAIL_POINTS) : updated;
      });
    }, 3000);
    return () => clearInterval(timer);
  }, []);

  const current = trail[trail.length - 1];
  const positions: [number, number][] = trail.map((p) => [p.lat, p.lng]);

  return (
    <MapContainer
      center={[current.lat, current.lng]}
      zoom={15}
      scrollWheelZoom={false}
      style={{ height: "100%", width: "100%" }}
      attributionControl={true}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />
      {positions.length > 1 && <Polyline positions={positions} pathOptions={{ color: "#1d4ed8", weight: 3, opacity: 0.6 }} />}
      <Marker position={[current.lat, current.lng]} icon={deviceIcon} />
    </MapContainer>
  );
}

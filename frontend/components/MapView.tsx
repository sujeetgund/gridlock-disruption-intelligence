"use client";

import { useEffect, useState } from "react";
import { MapContainer, TileLayer, CircleMarker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";

// Define the color mapping for the severity buckets
const severityColors: Record<string, string> = {
  Low: "#22c55e", // green-500
  Medium: "#eab308", // yellow-500
  High: "#f97316", // orange-500
  Critical: "#ef4444", // red-500
  Unknown: "#6b7280" // gray-500
};

interface MapEvent {
  latitude: number;
  longitude: number;
  severity_score: number;
  cause: string;
  corridor: string;
  severity_bucket: string;
}

export default function MapView({ events }: { events: MapEvent[] }) {
  // Center roughly on Bengaluru
  const center: [number, number] = [12.9716, 77.5946];

  return (
    <div className="w-full h-[500px] rounded-lg overflow-hidden border">
      <MapContainer center={center} zoom={11} className="w-full h-full" scrollWheelZoom={false}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        />
        {events.map((event, i) => (
          <CircleMarker
            key={i}
            center={[event.latitude, event.longitude]}
            pathOptions={{ 
              color: severityColors[event.severity_bucket] || severityColors.Unknown,
              fillColor: severityColors[event.severity_bucket] || severityColors.Unknown,
              fillOpacity: 0.6,
              weight: 1
            }}
            radius={5}
          >
            <Popup>
              <div className="flex flex-col gap-1">
                <strong className="capitalize">{event.cause.replace("_", " ")}</strong>
                <span className="text-xs text-muted-foreground">{event.corridor}</span>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs font-semibold px-2 py-0.5 rounded" style={{ backgroundColor: severityColors[event.severity_bucket] || severityColors.Unknown, color: "white" }}>
                    {event.severity_bucket}
                  </span>
                </div>
              </div>
            </Popup>
          </CircleMarker>
        ))}
      </MapContainer>
    </div>
  );
}

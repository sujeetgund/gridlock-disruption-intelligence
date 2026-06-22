"use client";

import { useEffect, useState } from "react";
import { MapContainer, TileLayer, CircleMarker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";

// Define the color mapping for the severity buckets using BI palette
const severityColors: Record<string, string> = {
  Low: "#1f7f51", // primary-green
  Medium: "#002aff", // primary
  High: "#ea0201", // primary-red-hover
  Critical: "#e51716", // primary-red
  Unknown: "#71717a" // text-muted
};

interface MapEvent {
  id?: string;
  latitude: number;
  longitude: number;
  severity_score: number;
  cause: string;
  corridor: string;
  severity_bucket: string;
}

interface MapViewProps {
  events: MapEvent[];
  onMarkerClick?: (corridor: string) => void;
}

export default function MapView({ events, onMarkerClick }: MapViewProps) {
  // Center roughly on Bengaluru
  const center: [number, number] = [12.9716, 77.5946];

  return (
    <div className="relative w-full h-full min-h-[500px]">
      <MapContainer center={center} zoom={11} className="w-full h-full min-h-[500px] z-0" scrollWheelZoom={true}>
        <TileLayer
          attribution='&copy; <a href="https://carto.com/">CartoDB</a>'
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
        />
        {events.map((event, i) => (
          <CircleMarker
            key={`${event.id || i}-${event.severity_bucket}`}
            center={[event.latitude, event.longitude]}
            color={severityColors[event.severity_bucket] || severityColors.Unknown}
            fillColor={severityColors[event.severity_bucket] || severityColors.Unknown}
            fillOpacity={0.8}
            weight={1}
            radius={7}
            eventHandlers={{
              click: () => {
                if (onMarkerClick) onMarkerClick(event.corridor);
              }
            }}
          >
            <Popup>
              <div className="flex flex-col gap-1 font-serif">
                <strong className="capitalize text-[14px]">{event.cause.replace("_", " ")}</strong>
                <span className="text-[12px] text-muted-foreground">{event.corridor}</span>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-[2px]" style={{ backgroundColor: severityColors[event.severity_bucket] || severityColors.Unknown, color: "white" }}>
                    {event.severity_bucket}
                  </span>
                </div>
              </div>
            </Popup>
          </CircleMarker>
        ))}
      </MapContainer>
      
      {/* Map Legend */}
      <div className="absolute bottom-6 right-6 z-10 bg-background border border-border p-4 shadow-[rgba(0,0,0,0.1)_0px_4px_12px] font-serif flex flex-col gap-3 rounded-[2px]">
        <div className="font-bold text-[12px] uppercase tracking-wider text-foreground mb-1">Severity</div>
        {Object.entries(severityColors).map(([bucket, color]) => (
          <div key={bucket} className="flex items-center gap-3">
            <span className="w-3 h-3 rounded-full" style={{ backgroundColor: color }}></span>
            <span className="text-[14px] text-foreground font-normal">{bucket}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

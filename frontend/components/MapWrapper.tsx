"use client";

import dynamic from "next/dynamic";

// Dynamically import MapView to prevent SSR issues with leaflet window object
const MapView = dynamic(() => import("./MapView"), {
  ssr: false,
  loading: () => <div className="w-full h-[500px] bg-muted animate-pulse rounded-lg flex items-center justify-center">Loading Map...</div>
});

export default function MapWrapper({ events }: { events: any[] }) {
  return <MapView events={events} />;
}

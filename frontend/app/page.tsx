import { Suspense } from "react";
import MapWrapper from "@/components/MapWrapper";
import { getBackendUrl } from "@/lib/api";
import Leaderboard from "@/components/Leaderboard";
import SimulateDisruptionForm from "@/components/SimulateDisruptionForm";
import LimitationsSheet from "@/components/LimitationsSheet";

async function getMapEvents() {
  const res = await fetch(`${getBackendUrl()}/api/events/map`, { cache: 'no-store' });
  if (!res.ok) return [];
  return res.json();
}

async function getLeaderboardData() {
  const res = await fetch(`${getBackendUrl()}/api/corridors/leaderboard`, { cache: 'no-store' });
  if (!res.ok) return [];
  return res.json();
}

async function getLimitationsData() {
  'use cache';
  const res = await fetch(`${getBackendUrl()}/api/meta/limitations`);
  if (!res.ok) return null;
  return res.json();
}

async function MapSection() {
  const mapEvents = await getMapEvents();
  return <MapWrapper events={mapEvents} />;
}

async function LeaderboardSection() {
  const leaderboardData = await getLeaderboardData();
  return <Leaderboard data={leaderboardData} />;
}

export default async function DashboardPage() {
  // Limitations are static/cached, safe to fetch at top level
  const limitationsData = await getLimitationsData();

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur">
        <div className="container mx-auto px-4 h-16 flex items-center">
          <h1 className="text-xl font-bold tracking-tight">Gridlock Disruption Intelligence</h1>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-10">
        
        {/* Top Section: Map & Leaderboard */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <section className="lg:col-span-2 space-y-4">
            <div>
              <h2 className="text-2xl font-bold tracking-tight">Live Disruption Map</h2>
              <p className="text-muted-foreground">Stratified sample of critical events across Bengaluru.</p>
            </div>
            <Suspense fallback={<div className="w-full h-[500px] bg-muted animate-pulse rounded-lg"></div>}>
              <MapSection />
            </Suspense>
          </section>

          <section className="space-y-4">
            <div>
              <h2 className="text-2xl font-bold tracking-tight">Corridor Risk Index</h2>
              <p className="text-muted-foreground">Ranked by severity & high priority events.</p>
            </div>
            <Suspense fallback={<div className="w-full h-[400px] bg-muted animate-pulse rounded-lg"></div>}>
              <LeaderboardSection />
            </Suspense>
          </section>
        </div>

        {/* Bottom Section: Simulation Engine */}
        <section className="space-y-4 pt-6 border-t">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Response Recommendation Engine</h2>
            <p className="text-muted-foreground">Simulate an event to calculate required resources based on historical corridor precedence.</p>
          </div>
          <SimulateDisruptionForm />
        </section>

      </main>

      {/* Floating Limitations Panel */}
      <LimitationsSheet data={limitationsData} />
    </div>
  );
}

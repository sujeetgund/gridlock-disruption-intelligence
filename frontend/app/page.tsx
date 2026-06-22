import { Suspense } from "react";
import MapWrapper from "@/components/MapWrapper";
import { getBackendUrl } from "@/lib/api";
import Leaderboard from "@/components/Leaderboard";
import SimulateDisruptionForm from "@/components/SimulateDisruptionForm";
import LimitationsSheet from "@/components/LimitationsSheet";
import TimelineReplay from "@/components/TimelineReplay";

export const dynamic = 'force-dynamic';

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

async function getTimelineData() {
  const res = await fetch(`${getBackendUrl()}/api/calibration/timeline/global`, { cache: 'no-store' });
  if (!res.ok) return [];
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

async function TimelineSection() {
  const timelineData = await getTimelineData();
  return <TimelineReplay timeline={timelineData} />;
}

export default async function DashboardPage() {
  // Limitations are static/cached, safe to fetch at top level
  const limitationsData = await getLimitationsData();

  return (
    <div className="min-h-screen bg-background font-serif text-foreground">
      {/* Masthead */}
      <header className="w-full bg-background pt-8 pb-4 border-b-4 border-foreground">
        <div className="max-w-[1308px] mx-auto px-6 flex flex-col items-center justify-center">
          <h1 className="text-[36px] md:text-[48px] lg:text-[56px] font-black tracking-tighter text-foreground uppercase text-center leading-none mb-4 mt-2">
            GRIDLOCK DISRUPTION INTELLIGENCE
          </h1>
        </div>
      </header>

      <main className="max-w-[1308px] mx-auto px-6 py-8 space-y-12">
        
        {/* Top Section: Map & Leaderboard */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <section className="lg:col-span-8 flex flex-col">
            <div className="mb-4 border-b border-border pb-2">
              <h2 className="text-[28px] font-normal leading-[1.2] text-foreground">
                Live Disruption Map
              </h2>
              <p className="text-[14px] text-muted-foreground mt-1">
                Stratified sample of critical events across Bengaluru.
              </p>
            </div>
            <Suspense fallback={<div className="w-full h-[500px] bg-muted animate-pulse rounded-[2px]"></div>}>
              <div className="flex-1 min-h-[500px] bi-card p-0 overflow-hidden">
                <MapSection />
              </div>
            </Suspense>
          </section>

          <section className="lg:col-span-4 flex flex-col">
            <div className="mb-4 border-b border-border pb-2">
              <h2 className="text-[28px] font-normal leading-[1.2] text-foreground">
                Corridor Risk Index
              </h2>
              <p className="text-[14px] text-muted-foreground mt-1">
                Ranked by severity & high priority concentration.
              </p>
            </div>
            <Suspense fallback={<div className="w-full h-[400px] bg-muted animate-pulse rounded-[2px]"></div>}>
              <LeaderboardSection />
            </Suspense>
          </section>
        </div>

        {/* Middle Section: Simulation Engine */}
        <section className="pt-8 border-t-[4px] border-foreground">
          <div className="mb-6">
            <h2 className="text-[36px] font-bold leading-[1.2] tracking-tight">
              Response Recommendation Engine
            </h2>
            <p className="text-[16px] text-muted-foreground mt-2 max-w-3xl">
              Simulate an event to calculate required resources based on historical corridor precedence and current traffic patterns.
            </p>
          </div>
          <SimulateDisruptionForm />
        </section>

        {/* Bottom Section: Timeline Map Replay */}
        <section className="pt-8 border-t-[4px] border-foreground">
          <div className="mb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <h2 className="text-[36px] font-bold leading-[1.2] tracking-tight text-[#002aff]">
                Post-Event Learning Replay
              </h2>
              <p className="text-[16px] text-muted-foreground mt-2 max-w-3xl">
                Chronological replay of historical events to measure the system's predictive calibration over time.
              </p>
            </div>
          </div>
          <Suspense fallback={<div className="w-full h-[600px] bg-muted animate-pulse rounded-[2px]"></div>}>
            <TimelineSection />
          </Suspense>
        </section>

      </main>

      {/* Floating Limitations Panel */}
      <LimitationsSheet data={limitationsData} />
    </div>
  );
}

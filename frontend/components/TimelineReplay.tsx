"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import dynamic from "next/dynamic";
import CalibrationSparkline from "./CalibrationSparkline";
import { Play, Pause, FastForward } from "lucide-react";

// Dynamically import MapView to prevent SSR issues with leaflet window object
const MapView = dynamic(() => import("./MapView"), {
  ssr: false,
  loading: () => <div className="w-full h-full min-h-[500px] bg-muted animate-pulse flex items-center justify-center">Loading Map...</div>
});

interface TimelineEvent {
  id: string;
  incident_seq_num: number;
  timestamp: string;
  closed_datetime: string | null;
  predicted_bucket: string;
  severity_bucket: string;
  raw_abs_error: number;
  raw_bias: number;
  rolling_error: number;
  rolling_bias: number;
  latitude: number | null;
  longitude: number | null;
  cause: string | null;
  corridor: string;
}

interface TimelineReplayProps {
  timeline: TimelineEvent[];
}

export default function TimelineReplay({ timeline }: TimelineReplayProps) {
  const [viewMode, setViewMode] = useState<"Predicted" | "Resolved">("Predicted");
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [focusedCorridor, setFocusedCorridor] = useState<string | null>(null);
  
  // We use timestamps (Unix ms) for the scrubber
  const [currentTimestamp, setCurrentTimestamp] = useState<number>(0);
  const [minTimestamp, setMinTimestamp] = useState<number>(0);
  const [maxTimestamp, setMaxTimestamp] = useState<number>(0);

  const requestRef = useRef<number | null>(null);
  const lastUpdateRef = useRef<number>(0);

  useEffect(() => {
    if (timeline && timeline.length > 0) {
      const minT = new Date(timeline[0].timestamp).getTime();
      const maxT = new Date(timeline[timeline.length - 1].timestamp).getTime();
      setMinTimestamp(minT);
      setMaxTimestamp(maxT);
      setCurrentTimestamp(minT);
    }
  }, [timeline]);

  // Auto-play loop
  const animate = (time: number) => {
    if (!lastUpdateRef.current) lastUpdateRef.current = time;
    const deltaTime = time - lastUpdateRef.current;
    
    if (isPlaying) {
      // Advance by (speed * ms) in the real-world timeline
      // E.g. speed=1 means 1 day of real time per second of animation
      // 1 day = 86,400,000 ms. So 1 ms of animation = 86,400 ms of timeline
      const speedFactor = 86400 * playbackSpeed; 
      
      setCurrentTimestamp((prev) => {
        const next = prev + (deltaTime * speedFactor);
        if (next >= maxTimestamp) {
          setIsPlaying(false);
          return maxTimestamp;
        }
        return next;
      });
    }
    
    lastUpdateRef.current = time;
    requestRef.current = requestAnimationFrame(animate);
  };

  useEffect(() => {
    if (isPlaying) {
      requestRef.current = requestAnimationFrame(animate);
    }
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [isPlaying, playbackSpeed, maxTimestamp]);

  // Handle manual scrubber drag (with implicit debounce by just setting state)
  const handleScrub = (e: React.ChangeEvent<HTMLInputElement>) => {
    setIsPlaying(false);
    setCurrentTimestamp(Number(e.target.value));
  };

  const handleToggleSpeed = () => {
    setPlaybackSpeed(prev => prev >= 4 ? 1 : prev * 2);
  };

  // Derive visible map markers (Live-State Replay)
  const visibleMapEvents = useMemo(() => {
    return timeline
      .filter(event => {
        if (!event.latitude || !event.longitude || !event.closed_datetime) return false;
        const startT = new Date(event.timestamp).getTime();
        const clearT = new Date(event.closed_datetime).getTime();
        return currentTimestamp >= startT && currentTimestamp <= clearT;
      })
      .map(event => ({
        id: event.id,
        latitude: event.latitude!,
        longitude: event.longitude!,
        severity_score: 0, // Fallback
        cause: event.cause || "Unknown",
        corridor: event.corridor,
        severity_bucket: viewMode === "Predicted" ? event.predicted_bucket : event.severity_bucket
      }));
  }, [timeline, currentTimestamp, viewMode]);

  // Derive sparkline data for focused corridor
  const sparklineData = useMemo(() => {
    if (!focusedCorridor) return [];
    return timeline.filter(event => 
      event.corridor === focusedCorridor && 
      new Date(event.timestamp).getTime() <= currentTimestamp
    );
  }, [timeline, currentTimestamp, focusedCorridor]);

  const displayDate = new Date(currentTimestamp).toLocaleDateString(undefined, { 
    year: 'numeric', month: 'short', day: 'numeric' 
  });

  return (
    <div className="flex flex-col gap-6">
      
      {/* Top Controls Bar */}
      <div className="bi-card p-4 flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="flex items-center gap-4 w-full md:w-1/2">
          <button 
            onClick={() => setIsPlaying(!isPlaying)}
            className="w-10 h-10 flex items-center justify-center bg-foreground text-background rounded-full hover:bg-foreground/90 transition-colors"
          >
            {isPlaying ? <Pause size={18} /> : <Play size={18} className="ml-1" />}
          </button>
          
          <div className="flex-1 flex flex-col gap-1">
            <div className="flex justify-between text-[12px] font-bold tracking-wider uppercase text-muted-foreground">
              <span>{new Date(minTimestamp).toLocaleDateString()}</span>
              <span className="text-foreground">{displayDate}</span>
              <span>{new Date(maxTimestamp).toLocaleDateString()}</span>
            </div>
            <input 
              type="range" 
              min={minTimestamp} 
              max={maxTimestamp} 
              value={currentTimestamp} 
              onChange={handleScrub}
              className="w-full h-2 bg-muted rounded-full appearance-none cursor-pointer accent-foreground"
            />
          </div>

          <button 
            onClick={handleToggleSpeed}
            className="w-8 h-8 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
            title="Playback Speed"
          >
            <span className="text-[12px] font-bold">{playbackSpeed}x</span>
          </button>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex bg-muted rounded-full p-1">
            <button 
              className={`px-4 py-1.5 text-[13px] font-bold rounded-full transition-colors ${viewMode === "Predicted" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
              onClick={() => setViewMode("Predicted")}
            >
              Predicted
            </button>
            <button 
              className={`px-4 py-1.5 text-[13px] font-bold rounded-full transition-colors ${viewMode === "Resolved" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
              onClick={() => setViewMode("Resolved")}
            >
              Resolved (Retrospective)
            </button>
          </div>
        </div>
      </div>

      {/* Main Split View */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        <div className="lg:col-span-8 flex flex-col">
          <div className="bi-card p-0 overflow-hidden flex-1 min-h-[500px]">
            <MapView events={visibleMapEvents} onMarkerClick={setFocusedCorridor} />
          </div>
          <div className="mt-2 text-[12px] text-muted-foreground italic flex flex-col md:flex-row md:items-center justify-between gap-2">
            <span>Showing live state ({visibleMapEvents.length} active events). Click any marker to view its corridor's calibration.</span>
            <span className="text-right">Dataset restricted to {timeline.length} incidents with confirmed resolution outcomes<br/>(~39% of all logged incidents — the remainder lack duration data due to a chronic officer logging gap, not a recency issue).</span>
          </div>
        </div>
        
        <div className="lg:col-span-4 flex flex-col">
          <div className="bi-card p-4 flex flex-col h-[200px] mb-6">
            <h3 className="text-[16px] font-bold uppercase tracking-wider mb-4 border-b border-border pb-2">
              Calibration Trend
            </h3>
            <div className="flex-1 min-h-0">
              <CalibrationSparkline data={sparklineData} corridor={focusedCorridor} />
            </div>
          </div>
          
          <div className="bi-card p-4 flex flex-col flex-1 bg-muted/20 border-dashed">
            <h3 className="text-[14px] font-bold uppercase tracking-wider mb-2 text-muted-foreground">
              Post-Event Learning Loop
            </h3>
            <p className="text-[13px] leading-relaxed mb-3">
              This replay engine demonstrates system calibration. By replaying historical events chronologically, we measure the gap between the <strong className="text-foreground font-bold">Report-Time Predicted Severity</strong> (what we knew at dispatch) and the <strong className="text-foreground font-bold">Resolved Severity</strong> (how bad it actually was).
            </p>
            <p className="text-[13px] leading-relaxed">
              If the rolling error narrows as the sequence increases, the corridor is exhibiting count-based learning. If it remains flat, corridor-level structural factors are dominating the prediction gap.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}

"use client";

import { Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

export default function LimitationsSheet({ data }: { data: any }) {
  if (!data) return null;

  return (
    <Sheet>
      <SheetTrigger className="button-secondary fixed bottom-6 right-6 z-50 shadow-lg bg-background flex items-center gap-2">
        <Info className="h-4 w-4 text-primary" />
        Data Limitations
      </SheetTrigger>
      <SheetContent side="right" className="!w-screen !max-w-none p-0 overflow-y-auto bg-background border-none font-serif flex flex-col">
        <div className="flex-1 bg-muted/20">
          <div className="w-full max-w-7xl mx-auto pt-20 pb-16 px-6 sm:px-12 lg:px-16">
            <SheetHeader className="mb-12 border-b border-border/50 pb-8">
              <div className="flex items-center gap-3 mb-2">
                <Info className="h-6 w-6 text-primary" />
                <SheetTitle className="text-[36px] font-normal leading-[1.2] text-foreground font-serif tracking-tight">Data Limitations & Explainability</SheetTitle>
              </div>
              <SheetDescription className="text-[18px] text-muted-foreground font-serif mt-4 max-w-3xl leading-relaxed">
                We believe in transparent reporting. This dashboard explicitly discloses all known biases, constraints, and statistical limitations in the predictive model rather than abstracting them away.
              </SheetDescription>
            </SheetHeader>
            <div className="grid gap-8 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
              
              <div className="flex flex-col gap-4 bg-background p-8 rounded-lg shadow-sm border border-border/60 hover:border-border transition-colors">
                <h3 className="font-bold text-foreground flex items-center gap-3 text-[18px]">
                  <span className="w-3 h-3 rounded-full bg-[#e51716]"></span>
                  Planned Events Gap
                </h3>
                <p className="text-[15px] text-muted-foreground leading-relaxed">
                  {data.planned_events_gap}
                </p>
              </div>

              <div className="flex flex-col gap-4 bg-background p-8 rounded-lg shadow-sm border border-border/60 hover:border-border transition-colors">
                <h3 className="font-bold text-foreground flex items-center gap-3 text-[18px]">
                  <span className="w-3 h-3 rounded-full bg-[#31313b]"></span>
                  ML Model Status
                </h3>
                <p className="text-[15px] text-muted-foreground leading-relaxed">
                  {data.ml_model_status?.reason}
                </p>
                <div className="mt-auto pt-6 text-[15px] border-t border-border/50 grid grid-cols-2 gap-4">
                  <div>
                    <span className="block text-muted-foreground mb-1 text-[11px] uppercase tracking-wider font-bold">Reliable</span>
                    <span className="font-bold flex items-center gap-2">
                      {data.ml_model_status?.reliable ? (
                        <span className="text-[#1f7f51]">Yes</span>
                      ) : (
                        <span className="text-[#ea0201]">No</span>
                      )}
                    </span>
                  </div>
                  <div>
                    <span className="block text-muted-foreground mb-1 text-[11px] uppercase tracking-wider font-bold">Macro-F1</span>
                    <span className="font-bold">{(data.ml_model_status?.macro_f1 || 0).toFixed(2)}</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-4 bg-background p-8 rounded-lg shadow-sm border border-border/60 hover:border-border transition-colors">
                <h3 className="font-bold text-foreground flex items-center gap-3 text-[18px]">
                  <span className="w-3 h-3 rounded-full bg-primary"></span>
                  UI Precedence Rule
                </h3>
                <p className="text-[15px] text-muted-foreground leading-relaxed">
                  {data.ui_precedence_rule}
                </p>
              </div>

              <div className="flex flex-col gap-4 bg-background p-8 rounded-lg shadow-sm border border-border/60 hover:border-border transition-colors">
                <h3 className="font-bold text-foreground flex items-center gap-3 text-[18px]">
                  <span className="w-3 h-3 rounded-full bg-[#71717a]"></span>
                  Priority Logging Skew
                </h3>
                <p className="text-[15px] text-muted-foreground leading-relaxed">
                  Named corridors show a near 100% concentration of High priority events because BTP's standard practice treats named-corridor incidents as inherently priority-worthy. Ad-hoc and unnamed locations default to Low priority ("Non-corridor"). This is a real pattern in police logging data, not a pipeline aggregation bug.
                </p>
              </div>

              <div className="flex flex-col gap-4 bg-background p-8 rounded-lg shadow-sm border border-border/60 hover:border-border transition-colors">
                <h3 className="font-bold text-foreground flex items-center gap-3 text-[18px]">
                  <span className="w-3 h-3 rounded-full bg-[#002aff]"></span>
                  Predicted vs. Resolved Severity
                </h3>
                <p className="text-[15px] text-muted-foreground leading-relaxed">
                  Predicted severity uses only report-time-available signals (Priority, Corridor Frequency); resolved severity (Leaderboard) incorporates final outcome data such as duration and is not known at dispatch time. We strictly forbid using duration in predictive scoring to avoid label leakage.
                </p>
              </div>

              <div className="flex flex-col gap-4 bg-background p-8 rounded-lg shadow-sm border border-border/60 hover:border-border transition-colors">
                <h3 className="font-bold text-foreground flex items-center gap-3 text-[18px]">
                  <span className="w-3 h-3 rounded-full bg-[#1f7f51]"></span>
                  Historical Replay (Learning Loop)
                </h3>
                <p className="text-[15px] text-muted-foreground leading-relaxed">
                  The post-event learning loop is <strong>demonstrated via historical replay</strong>, not live learning. The system is not retraining on a live feed; it replays historical incidents chronologically to demonstrate how the calibration gap between predicted and resolved severity behaves over time.
                </p>
              </div>

              <div className="flex flex-col gap-4 bg-background p-8 rounded-lg shadow-sm border border-border/60 hover:border-border transition-colors">
                <h3 className="font-bold text-foreground flex items-center gap-3 text-[18px]">
                  <span className="w-3 h-3 rounded-full bg-[#e51716]"></span>
                  Corridor Lookup Fallback
                </h3>
                <p className="text-[15px] text-muted-foreground leading-relaxed">
                  If an ad-hoc or unrecognized corridor string is simulated, the predictive algorithm cannot look up its historical frequency. In these cases, the system safely defaults its frequency component to 0.0 and explicitly flags the fallback in the explainability panel, preventing silent failure.
                </p>
              </div>

              <div className="flex flex-col gap-4 bg-background p-8 rounded-lg shadow-sm border border-border/60 bg-muted/40 hover:border-border transition-colors">
                <h3 className="font-bold text-foreground flex items-center gap-3 text-[18px]">
                  <span className="w-3 h-3 rounded-full bg-muted-foreground"></span>
                  Roadmap: Citizen Portal
                </h3>
                <p className="text-[15px] text-muted-foreground leading-relaxed italic">
                  Citizen-facing incident request portal (descoped for this round — existing call-based BTP channels already serve this function; a dedicated portal would need trust/abuse-prevention design beyond hackathon scope).
                </p>
              </div>

            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

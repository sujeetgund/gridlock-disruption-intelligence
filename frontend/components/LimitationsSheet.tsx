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
      <SheetContent side="bottom" className="h-[100dvh] max-h-none overflow-y-auto bg-background border-none font-serif">
        <div className="max-w-[1308px] mx-auto w-full pt-16 pb-12 px-6">
          <SheetHeader className="mb-12 border-b border-border pb-6">
            <SheetTitle className="text-[28px] font-normal leading-[1.2] text-foreground font-serif">Data Limitations & Explainability</SheetTitle>
            <SheetDescription className="text-[16px] text-muted-foreground font-serif mt-2">
              Transparent reporting on known biases and constraints in the predictive model.
            </SheetDescription>
          </SheetHeader>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            
            <div className="flex flex-col gap-3 bg-background p-6 rounded-[2px] border border-border">
              <h3 className="font-bold text-foreground flex items-center gap-2 text-[16px]">
                <span className="w-2 h-2 bg-[#e51716]"></span>
                Planned Events Gap
              </h3>
              <p className="text-[14px] text-muted-foreground leading-relaxed">
                {data.planned_events_gap}
              </p>
            </div>

            <div className="flex flex-col gap-3 bg-background p-6 rounded-[2px] border border-border">
              <h3 className="font-bold text-foreground flex items-center gap-2 text-[16px]">
                <span className="w-2 h-2 bg-[#31313b]"></span>
                ML Model Status
              </h3>
              <p className="text-[14px] text-muted-foreground leading-relaxed">
                {data.ml_model_status?.reason}
              </p>
              <div className="mt-auto pt-4 text-[14px] border-t border-border grid grid-cols-2 gap-4">
                <div>
                  <span className="block text-muted-foreground mb-1 text-[10px] uppercase tracking-wider font-bold">Reliable</span>
                  <span className="font-bold flex items-center gap-1">
                    {data.ml_model_status?.reliable ? (
                      <span className="text-[#1f7f51]">Yes</span>
                    ) : (
                      <span className="text-[#ea0201]">No</span>
                    )}
                  </span>
                </div>
                <div>
                  <span className="block text-muted-foreground mb-1 text-[10px] uppercase tracking-wider font-bold">Macro-F1</span>
                  <span className="font-bold">{(data.ml_model_status?.macro_f1 || 0).toFixed(2)}</span>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-3 bg-background p-6 rounded-[2px] border border-border">
              <h3 className="font-bold text-foreground flex items-center gap-2 text-[16px]">
                <span className="w-2 h-2 bg-primary"></span>
                UI Precedence Rule
              </h3>
              <p className="text-[14px] text-muted-foreground leading-relaxed">
                {data.ui_precedence_rule}
              </p>
            </div>

            <div className="flex flex-col gap-3 bg-background p-6 rounded-[2px] border border-border">
              <h3 className="font-bold text-foreground flex items-center gap-2 text-[16px]">
                <span className="w-2 h-2 bg-[#71717a]"></span>
                Priority Logging Skew
              </h3>
              <p className="text-[14px] text-muted-foreground leading-relaxed">
                Named corridors show a near 100% concentration of High priority events because BTP's standard practice treats named-corridor incidents as inherently priority-worthy. Ad-hoc and unnamed locations default to Low priority ("Non-corridor"). This is a real pattern in police logging data, not a pipeline aggregation bug.
              </p>
            </div>

          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

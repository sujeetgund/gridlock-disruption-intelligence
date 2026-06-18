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
      <SheetTrigger className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground h-9 px-4 py-2 fixed bottom-6 right-6 z-50 shadow-lg border-primary/20 hover:border-primary/50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <Info className="mr-2 h-4 w-4 text-primary" />
        Data Limitations
      </SheetTrigger>
      <SheetContent side="bottom" className="max-h-[90vh] overflow-y-auto">
        <div className="max-w-5xl mx-auto w-full pt-4 pb-8">
          <SheetHeader className="mb-8">
            <SheetTitle className="text-2xl">Data Limitations & Explainability</SheetTitle>
            <SheetDescription className="text-base">
              Transparent reporting on known biases and constraints in the predictive model.
            </SheetDescription>
          </SheetHeader>
          <div className="grid gap-8 md:grid-cols-3">
            
            <div className="flex flex-col gap-3 bg-muted/30 p-5 rounded-lg border">
              <h3 className="font-semibold text-foreground flex items-center gap-2 text-lg">
                <span className="w-3 h-3 rounded-full bg-red-500 shadow-sm"></span>
                Planned Events Gap
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {data.planned_events_gap}
              </p>
            </div>

            <div className="flex flex-col gap-3 bg-muted/30 p-5 rounded-lg border">
              <h3 className="font-semibold text-foreground flex items-center gap-2 text-lg">
                <span className="w-3 h-3 rounded-full bg-amber-500 shadow-sm"></span>
                ML Model Status
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {data.ml_model_status?.reason}
              </p>
              <div className="mt-auto pt-4 text-sm bg-background border rounded-md p-3 grid grid-cols-2 gap-4 shadow-sm">
                <div>
                  <span className="block text-muted-foreground mb-1 text-xs uppercase tracking-wider">Reliable</span>
                  <span className="font-medium flex items-center gap-1">
                    {data.ml_model_status?.reliable ? (
                      <span className="text-green-600">Yes</span>
                    ) : (
                      <span className="text-amber-600">No</span>
                    )}
                  </span>
                </div>
                <div>
                  <span className="block text-muted-foreground mb-1 text-xs uppercase tracking-wider">Macro-F1</span>
                  <span className="font-medium">{(data.ml_model_status?.macro_f1 || 0).toFixed(2)}</span>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-3 bg-muted/30 p-5 rounded-lg border">
              <h3 className="font-semibold text-foreground flex items-center gap-2 text-lg">
                <span className="w-3 h-3 rounded-full bg-blue-500 shadow-sm"></span>
                UI Precedence Rule
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {data.ui_precedence_rule}
              </p>
            </div>

          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

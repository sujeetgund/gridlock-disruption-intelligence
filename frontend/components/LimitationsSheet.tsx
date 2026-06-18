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
      <SheetContent side="bottom" className="sm:max-w-none h-[400px]">
        <SheetHeader>
          <SheetTitle>Data Limitations & Explainability</SheetTitle>
          <SheetDescription>
            Transparent reporting on known biases and constraints in the predictive model.
          </SheetDescription>
        </SheetHeader>
        <div className="grid gap-6 py-6 md:grid-cols-3">
          
          <div className="flex flex-col gap-2">
            <h3 className="font-semibold text-foreground flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-red-500"></span>
              Planned Events Gap
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {data.planned_events_gap}
            </p>
          </div>

          <div className="flex flex-col gap-2">
            <h3 className="font-semibold text-foreground flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-500"></span>
              ML Model Status
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {data.ml_model_status?.reason}
            </p>
            <div className="mt-2 text-xs bg-muted/50 rounded p-2 grid grid-cols-2 gap-2">
              <div>
                <span className="block text-muted-foreground">Reliable</span>
                <span className="font-medium">{data.ml_model_status?.reliable ? 'Yes' : 'No'}</span>
              </div>
              <div>
                <span className="block text-muted-foreground">Macro-F1</span>
                <span className="font-medium">{(data.ml_model_status?.macro_f1 || 0).toFixed(2)}</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <h3 className="font-semibold text-foreground flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-500"></span>
              UI Precedence Rule
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {data.ui_precedence_rule}
            </p>
          </div>

        </div>
      </SheetContent>
    </Sheet>
  );
}

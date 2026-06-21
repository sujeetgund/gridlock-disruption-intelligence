// @ts-nocheck
"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import ResultCard from "./ResultCard";
import { getApiUrl } from "@/lib/api";

const formSchema = z.object({
  event_cause: z.string().min(1, "Event cause is required"),
  corridor: z.string().min(1, "Corridor is required"),
  priority: z.string().min(1, "Priority is required"),
  requires_road_closure: z.boolean(),
  hour_of_day: z.coerce.number().min(0).max(23),
  day_of_week: z.coerce.number().min(0).max(6),
});

export default function SimulateDisruptionForm() {
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    // @ts-ignore
    resolver: zodResolver(formSchema),
    defaultValues: {
      event_cause: "vehicle_breakdown",
      corridor: "ORR North 1",
      priority: "Medium",
      requires_road_closure: false,
      hour_of_day: 14,
      day_of_week: 2,
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch(getApiUrl("/api/predict"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      if (!res.ok) throw new Error("Failed to fetch prediction");
      const data = await res.json();
      setResult(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-12 items-start font-serif">
      <div className="lg:col-span-5 bi-card flex flex-col h-full">
        <h3 className="text-[20px] font-bold text-foreground mb-6 border-b border-border pb-2">Simulate Event</h3>
        <Form {...form}>
          {/* @ts-ignore */}
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 flex-1 flex flex-col">
            
            {/* Group 1: Incident Profile */}
            <div className="space-y-4">
              <h4 className="text-[12px] uppercase tracking-wider font-bold text-muted-foreground border-b border-border pb-1">Incident Profile</h4>
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="event_cause"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[14px] font-bold text-foreground">Event Cause</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="input-text w-full">
                            <SelectValue placeholder="Select cause" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="vehicle_breakdown">Vehicle Breakdown</SelectItem>
                          <SelectItem value="pot_holes">Potholes</SelectItem>
                          <SelectItem value="accident">Accident</SelectItem>
                          <SelectItem value="water_logging">Water Logging</SelectItem>
                          <SelectItem value="congestion">Congestion</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="corridor"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[14px] font-bold text-foreground">Corridor</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="input-text w-full">
                            <SelectValue placeholder="Select corridor" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="ORR North 1">ORR North 1</SelectItem>
                          <SelectItem value="ORR East 1">ORR East 1</SelectItem>
                          <SelectItem value="Mysore Road">Mysore Road</SelectItem>
                          <SelectItem value="Hosur Road">Hosur Road</SelectItem>
                          <SelectItem value="Tumkur Road">Tumkur Road</SelectItem>
                          <SelectItem value="Bellary Road 1">Bellary Road 1</SelectItem>
                          <SelectItem value="CBD 1">CBD 1</SelectItem>
                          <SelectItem value="Hennur Main Road">Hennur Main Road</SelectItem>
                          <SelectItem value="Non-corridor">Non-corridor</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Group 2: Severity & Impact */}
            <div className="space-y-4">
              <h4 className="text-[12px] uppercase tracking-wider font-bold text-muted-foreground border-b border-border pb-1">Severity & Impact</h4>
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="priority"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[14px] font-bold text-foreground">Priority</FormLabel>
                      <FormControl>
                        <div className="flex border border-border rounded-[2px] overflow-hidden h-10">
                          <button type="button" onClick={() => field.onChange("Low")} className={`flex-1 text-[12px] font-bold transition-colors ${field.value === 'Low' ? 'bg-[#1f7f51] text-white' : 'bg-background text-foreground hover:bg-muted'}`}>Low</button>
                          <button type="button" onClick={() => field.onChange("Medium")} className={`flex-1 text-[12px] font-bold border-l border-border transition-colors ${field.value === 'Medium' ? 'bg-[#002aff] text-white' : 'bg-background text-foreground hover:bg-muted'}`}>Medium</button>
                          <button type="button" onClick={() => field.onChange("High")} className={`flex-1 text-[12px] font-bold border-l border-border transition-colors ${field.value === 'High' ? 'bg-[#e51716] text-white' : 'bg-background text-foreground hover:bg-muted'}`}>High</button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="requires_road_closure"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[14px] font-bold text-foreground">Road Closure</FormLabel>
                      <FormControl>
                        <div className="flex border border-border rounded-[2px] overflow-hidden h-10">
                          <button type="button" onClick={() => field.onChange(false)} className={`flex-1 text-[12px] font-bold transition-colors ${field.value === false ? 'bg-[#002aff] text-white' : 'bg-background text-foreground hover:bg-muted'}`}>No</button>
                          <button type="button" onClick={() => field.onChange(true)} className={`flex-1 text-[12px] font-bold border-l border-border transition-colors ${field.value === true ? 'bg-[#e51716] text-white' : 'bg-background text-foreground hover:bg-muted'}`}>Yes</button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Group 3: Temporal Context */}
            <div className="space-y-4">
              <h4 className="text-[12px] uppercase tracking-wider font-bold text-muted-foreground border-b border-border pb-1">Temporal Context</h4>
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="hour_of_day"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[14px] font-bold text-foreground">Time of Day</FormLabel>
                      <Select onValueChange={(val) => field.onChange(Number(val))} defaultValue={String(field.value)} value={String(field.value)}>
                        <FormControl>
                          <SelectTrigger className="input-text w-full">
                            <SelectValue placeholder="Select hour" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="max-h-[200px]">
                          {Array.from({ length: 24 }).map((_, i) => (
                            <SelectItem key={i} value={String(i)}>
                              {i === 0 ? "12:00 AM" : i < 12 ? `${i}:00 AM` : i === 12 ? "12:00 PM" : `${i - 12}:00 PM`}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="day_of_week"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[14px] font-bold text-foreground">Day of Week</FormLabel>
                      <Select onValueChange={(val) => field.onChange(Number(val))} defaultValue={String(field.value)} value={String(field.value)}>
                        <FormControl>
                          <SelectTrigger className="input-text w-full">
                            <SelectValue placeholder="Select day" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="0">Monday</SelectItem>
                          <SelectItem value="1">Tuesday</SelectItem>
                          <SelectItem value="2">Wednesday</SelectItem>
                          <SelectItem value="3">Thursday</SelectItem>
                          <SelectItem value="4">Friday</SelectItem>
                          <SelectItem value="5">Saturday</SelectItem>
                          <SelectItem value="6">Sunday</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <div className="mt-auto pt-6">
              <button 
                type="submit" 
                className="w-full flex justify-center items-center font-bold bg-[#002aff] hover:bg-[#0022cc] disabled:bg-muted disabled:text-muted-foreground text-white rounded-[2px] px-6 py-3 transition-colors duration-300" 
                disabled={loading}
              >
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Generate Recommendation
              </button>
            </div>
          </form>
        </Form>
      </div>

      <div className="lg:col-span-7 h-full">
        {result ? (
          <ResultCard result={result} />
        ) : (
          <div className="h-full min-h-[300px] flex items-center justify-center border border-border bg-background/50 rounded-[2px] text-muted-foreground p-6 text-center text-[16px] italic">
            Run a simulation to generate resource deployment recommendations and severity forecasts.
          </div>
        )}
      </div>
    </div>
  );
}

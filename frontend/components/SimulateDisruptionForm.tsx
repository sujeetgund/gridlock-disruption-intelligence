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
      corridor: "ORR",
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
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-12 items-start">
      <Card className="lg:col-span-5">
        <CardHeader>
          <CardTitle>Simulate Event</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            {/* @ts-ignore */}
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              
              <FormField
                control={form.control}
                name="event_cause"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Event Cause</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
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

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="corridor"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Corridor</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select corridor" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="ORR">ORR</SelectItem>
                          <SelectItem value="Mysuru Road">Mysuru Road</SelectItem>
                          <SelectItem value="Hosur Road">Hosur Road</SelectItem>
                          <SelectItem value="Tumakuru Road">Tumakuru Road</SelectItem>
                          <SelectItem value="Bellary Road">Bellary Road</SelectItem>
                          <SelectItem value="Non-corridor">Non-corridor</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="priority"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Priority</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select priority" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Low">Low</SelectItem>
                          <SelectItem value="Medium">Medium</SelectItem>
                          <SelectItem value="High">High</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="hour_of_day"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Hour (0-23)</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="day_of_week"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Day (0=Mon, 6=Sun)</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="requires_road_closure"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 shadow-sm">
                    <FormControl>
                      <input
                        type="checkbox"
                        checked={field.value}
                        onChange={field.onChange}
                        className="mt-1 h-4 w-4"
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Requires Road Closure</FormLabel>
                    </div>
                  </FormItem>
                )}
              />

              <Button type="submit" className="w-full" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Get Recommendation
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      <div className="lg:col-span-7">
        {result ? (
          <ResultCard result={result} />
        ) : (
          <div className="h-full min-h-[300px] flex items-center justify-center border-2 border-dashed rounded-lg text-muted-foreground p-6 text-center">
            Run a simulation to generate resource deployment recommendations and severity forecasts.
          </div>
        )}
      </div>
    </div>
  );
}

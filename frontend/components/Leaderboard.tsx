"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

interface CorridorStat {
  corridor: string;
  total_events: number;
  avg_duration: number;
  median_duration: number;
  mean_severity: number;
  high_priority_count: number;
}

export default function Leaderboard({ data }: { data: CorridorStat[] }) {
  // Top 10 corridors
  const topData = data.slice(0, 10);

  return (
    <div className="rounded-md border bg-card text-card-foreground shadow-sm overflow-hidden">
      <Table>
        <TableHeader className="bg-muted/50">
          <TableRow>
            <TableHead>Corridor</TableHead>
            <TableHead className="text-right">Risk Score</TableHead>
            <TableHead className="text-right">High Priority</TableHead>
            <TableHead className="text-right">Total Events</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {topData.map((item) => (
            <TableRow key={item.corridor}>
              <TableCell className="font-medium">{item.corridor}</TableCell>
              <TableCell className="text-right">
                <Badge variant={item.mean_severity > 50 ? "destructive" : "default"}>
                  {item.mean_severity.toFixed(1)}
                </Badge>
              </TableCell>
              <TableCell className="text-right font-mono">{item.high_priority_count}</TableCell>
              <TableCell className="text-right text-muted-foreground">{item.total_events}</TableCell>
            </TableRow>
          ))}
          {topData.length === 0 && (
            <TableRow>
              <TableCell colSpan={4} className="text-center py-4 text-muted-foreground">
                No corridor data available
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}

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
    <div className="bi-card p-0 overflow-hidden">
      <Table>
        <TableHeader className="bg-muted border-b border-border">
          <TableRow className="hover:bg-transparent">
            <TableHead className="font-serif text-[12px] uppercase text-foreground font-bold tracking-wide py-3">Corridor</TableHead>
            <TableHead className="font-serif text-[12px] uppercase text-foreground font-bold tracking-wide py-3 text-right">Risk Score</TableHead>
            <TableHead className="font-serif text-[12px] uppercase text-foreground font-bold tracking-wide py-3 text-right">High Priority</TableHead>
            <TableHead className="font-serif text-[12px] uppercase text-foreground font-bold tracking-wide py-3 text-right">Total Events</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {topData.map((item) => (
            <TableRow key={item.corridor} className="border-b border-border hover:bg-muted/50 transition-colors">
              <TableCell className="font-serif font-normal text-[16px] text-foreground py-4">
                {item.corridor}
              </TableCell>
              <TableCell className="text-right py-4">
                <span className={`inline-flex items-center px-3 py-1 rounded-[24px] font-serif text-[12px] font-bold ${
                  item.mean_severity > 50 
                    ? "bg-[#e51716] text-white" 
                    : "bg-[#d8deff] text-[#002aff]"
                }`}>
                  {item.mean_severity.toFixed(1)}
                </span>
              </TableCell>
              <TableCell className="text-right font-serif text-[16px] text-foreground font-bold py-4">
                {item.high_priority_count}
              </TableCell>
              <TableCell className="text-right font-serif text-[14px] text-muted-foreground py-4">
                {item.total_events}
              </TableCell>
            </TableRow>
          ))}
          {topData.length === 0 && (
            <TableRow>
              <TableCell colSpan={4} className="text-center py-8 font-serif text-[14px] text-muted-foreground">
                No corridor data available
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}

"use client";

import { useMemo } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

interface SparklineData {
  incident_seq_num: number;
  raw_abs_error: number;
  [key: string]: any;
}

interface CalibrationSparklineProps {
  data: SparklineData[];
  corridor: string | null;
}

export default function CalibrationSparkline({ data, corridor }: CalibrationSparklineProps) {
  const chartData = useMemo(() => {
    // We plot raw, unsmoothed error to maintain statistical honesty 
    // and avoid the double-smoothing/overlap artifact.
    return [...data].sort((a, b) => a.incident_seq_num - b.incident_seq_num).map(d => ({
      seq: d.incident_seq_num,
      error: d.raw_abs_error
    }));
  }, [data]);

  if (!corridor) {
    return (
      <div className="w-full h-full min-h-[120px] flex items-center justify-center bg-muted/30 border border-dashed border-border rounded-[2px]">
        <p className="text-[14px] text-muted-foreground font-serif">
          Click a corridor marker to view its calibration trend.
        </p>
      </div>
    );
  }

  if (chartData.length === 0) {
    return (
      <div className="w-full h-full min-h-[120px] flex items-center justify-center bg-muted/30 border border-dashed border-border rounded-[2px]">
        <p className="text-[14px] text-muted-foreground font-serif text-center px-4">
          No history for {corridor} up to this point.
        </p>
      </div>
    );
  }

  if (chartData.length < 5) {
    return (
      <div className="w-full h-full min-h-[120px] flex flex-col items-center justify-center bg-muted/30 border border-dashed border-border rounded-[2px]">
        <h4 className="text-[14px] font-bold mb-1">{corridor}</h4>
        <p className="text-[12px] text-muted-foreground font-serif text-center px-4">
          Insufficient history for trend (N = {chartData.length}/5)
        </p>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col font-serif">
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-[14px] font-bold truncate pr-4">{corridor}</h4>
        <span className="text-[12px] text-muted-foreground whitespace-nowrap">
          N = {chartData.length}
        </span>
      </div>
      <div className="flex-1 min-h-[100px] w-full relative">
        <div className="absolute inset-0">
          <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
          <LineChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
            <XAxis 
              dataKey="seq" 
              type="category" 
              tick={{ fontSize: 10, fill: '#71717a' }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis 
              domain={[0, 3]} 
              tickCount={4} 
              tick={{ fontSize: 10, fill: '#71717a' }}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip 
              contentStyle={{ 
                fontFamily: 'serif', 
                fontSize: '12px', 
                borderRadius: '2px',
                border: '1px solid #e4e4e7',
                padding: '8px'
              }}
              formatter={(value: any) => [typeof value === 'number' ? value.toFixed(0) : value, "Raw Absolute Error"]}
              labelFormatter={(label) => `Incident #${label}`}
            />
            <Line 
              type="monotone" 
              dataKey="error" 
              stroke="#002aff" // primary blue
              strokeWidth={2}
              dot={{ r: 2 }}
              activeDot={{ r: 4 }}
              animationDuration={300}
              connectNulls={true}
            />
          </LineChart>
        </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

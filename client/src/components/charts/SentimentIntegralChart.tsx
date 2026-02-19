import { useMemo } from "react";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { format } from "date-fns";
import { motion } from "framer-motion";

interface SentimentIntegralChartProps {
  data: { timestamp: number; score: number }[];
  onPointClick?: (timestamp: number) => void;
}

export function SentimentIntegralChart({ data, onPointClick }: SentimentIntegralChartProps) {
  const chartData = useMemo(() => {
    const sorted = [...data].sort((a, b) => a.timestamp - b.timestamp);
    if (!sorted.length) return [];

    let acc = 0;
    const out: Array<{ timestamp: number; displayTime: string; cumulative: number }> = [];
    for (let i = 0; i < sorted.length; i++) {
      const prev = sorted[i - 1];
      const curr = sorted[i];
      const dtMs = prev ? curr.timestamp - prev.timestamp : 0;
      const dtS = dtMs > 0 ? dtMs / 1000 : 1;
      acc += curr.score * dtS;
      out.push({
        timestamp: curr.timestamp,
        displayTime: format(new Date(curr.timestamp), "mm:ss"),
        cumulative: acc,
      });
    }
    return out;
  }, [data]);

  const summary = useMemo(() => {
    if (!chartData.length) return { end: 0, min: 0, max: 0 };
    const vals = chartData.map((p) => p.cumulative);
    return { end: vals[vals.length - 1] ?? 0, min: Math.min(...vals), max: Math.max(...vals) };
  }, [chartData]);

  const domain = useMemo(() => {
    if (!chartData.length) return [-1, 1] as [number, number];
    const vals = chartData.map((p) => p.cumulative);
    const min = Math.min(...vals);
    const max = Math.max(...vals);
    const pad = Math.max(0.1, (max - min) * 0.1);
    return [min - pad, max + pad] as [number, number];
  }, [chartData]);

  const gradientOffset = () => {
    const dataMax = Math.max(...chartData.map((i) => i.cumulative));
    const dataMin = Math.min(...chartData.map((i) => i.cumulative));
    if (dataMax <= 0) return 0;
    if (dataMin >= 0) return 1;
    return dataMax / (dataMax - dataMin);
  };

  const off = chartData.length ? gradientOffset() : 0.5;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full h-[250px] bg-background rounded-xl p-4 border border-border/50 shadow-sm"
    >
      <div className="flex justify-between items-start mb-3">
        <div className="space-y-0.5">
          <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">Sentiment Accumulation</h3>
          <div className="text-xs text-muted-foreground">
            End: {summary.end.toFixed(1)} • Range: {summary.min.toFixed(1)} to {summary.max.toFixed(1)}
          </div>
        </div>
      </div>

      <ResponsiveContainer width="100%" height="85%">
        <AreaChart
          data={chartData}
          margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
          onClick={(e) => {
            if (e && e.activePayload && e.activePayload[0]) {
              onPointClick?.(e.activePayload[0].payload.timestamp);
            }
          }}
        >
          <defs>
            <linearGradient id="integralFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset={off} stopColor="#10b981" stopOpacity={0.2} />
              <stop offset={off} stopColor="#f43f5e" stopOpacity={0.2} />
            </linearGradient>
            <linearGradient id="integralStroke" x1="0" y1="0" x2="0" y2="1">
              <stop offset={off} stopColor="#10b981" stopOpacity={1} />
              <stop offset={off} stopColor="#f43f5e" stopOpacity={1} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
          <XAxis
            dataKey="displayTime"
            tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
            tickLine={false}
            axisLine={false}
            interval="preserveStartEnd"
          />
          <YAxis
            domain={domain}
            tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
            tickLine={false}
            axisLine={false}
            width={30}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "hsl(var(--card))",
              borderColor: "hsl(var(--border))",
              borderRadius: "8px",
              fontSize: "12px",
              boxShadow: "var(--shadow-lg)",
            }}
            cursor={{ stroke: "hsl(var(--foreground))", strokeWidth: 1, strokeDasharray: "4 4" }}
            formatter={(value: number, name: string) => [Number.isFinite(value) ? value.toFixed(2) : value, name]}
          />
          <Area
            type="monotone"
            dataKey="cumulative"
            stroke="url(#integralStroke)"
            fill="url(#integralFill)"
            strokeWidth={2}
            activeDot={{ r: 5, strokeWidth: 0, fill: "hsl(var(--foreground))" }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </motion.div>
  );
}


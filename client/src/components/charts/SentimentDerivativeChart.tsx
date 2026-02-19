import { useMemo } from "react";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { format } from "date-fns";
import { motion } from "framer-motion";

interface SentimentDerivativeChartProps {
  data: { timestamp: number; score: number }[];
  onPointClick?: (timestamp: number) => void;
}

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

export function SentimentDerivativeChart({ data, onPointClick }: SentimentDerivativeChartProps) {
  const chartData = useMemo(() => {
    const sorted = [...data].sort((a, b) => a.timestamp - b.timestamp);
    if (sorted.length === 0) return [];

    const out: Array<{ timestamp: number; displayTime: string; rate: number }> = [];
    for (let i = 0; i < sorted.length; i++) {
      const prev = sorted[i - 1];
      const curr = sorted[i];
      const dtMs = prev ? curr.timestamp - prev.timestamp : 0;
      const dtS = dtMs > 0 ? dtMs / 1000 : 1;
      const dv = prev ? curr.score - prev.score : 0;
      const rate = clamp(dv / dtS, -1, 1);
      out.push({
        timestamp: curr.timestamp,
        displayTime: format(new Date(curr.timestamp), "mm:ss"),
        rate,
      });
    }
    return out;
  }, [data]);

  const summary = useMemo(() => {
    if (!chartData.length) return { maxUp: 0, maxDown: 0, avgAbs: 0 };
    let maxUp = 0;
    let maxDown = 0;
    let sumAbs = 0;
    for (const p of chartData) {
      maxUp = Math.max(maxUp, p.rate);
      maxDown = Math.min(maxDown, p.rate);
      sumAbs += Math.abs(p.rate);
    }
    return { maxUp, maxDown, avgAbs: sumAbs / chartData.length };
  }, [chartData]);

  const gradientOffset = () => {
    const dataMax = Math.max(...chartData.map((i) => i.rate));
    const dataMin = Math.min(...chartData.map((i) => i.rate));
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
      className="w-full h-[220px] bg-background rounded-xl p-4 border border-border/50 shadow-sm"
    >
      <div className="flex justify-between items-start mb-3">
        <div className="space-y-0.5">
          <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">Sentiment Momentum</h3>
          <div className="text-xs text-muted-foreground">
            Avg |rate|: {summary.avgAbs.toFixed(2)} • Max up: {summary.maxUp.toFixed(2)} • Max down: {summary.maxDown.toFixed(2)}
          </div>
        </div>
        <div className="flex gap-2 text-xs">
          <span className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-emerald-500" />
            Improving
          </span>
          <span className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-rose-500" />
            Worsening
          </span>
        </div>
      </div>

      <ResponsiveContainer width="100%" height="82%">
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
            <linearGradient id="derivativeFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset={off} stopColor="#10b981" stopOpacity={0.25} />
              <stop offset={off} stopColor="#f43f5e" stopOpacity={0.25} />
            </linearGradient>
            <linearGradient id="derivativeStroke" x1="0" y1="0" x2="0" y2="1">
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
            domain={[-1, 1]}
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
            formatter={(value: number, name: string) => [Number.isFinite(value) ? value.toFixed(3) : value, name]}
          />
          <Area
            type="monotone"
            dataKey="rate"
            stroke="url(#derivativeStroke)"
            fill="url(#derivativeFill)"
            strokeWidth={2}
            activeDot={{ r: 5, strokeWidth: 0, fill: "hsl(var(--foreground))" }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </motion.div>
  );
}


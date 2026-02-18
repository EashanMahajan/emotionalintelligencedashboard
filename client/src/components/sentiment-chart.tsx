import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { Card } from "@/components/ui/card";

interface SentimentDataPoint {
  timestamp: number;
  score: number;
}

interface SentimentChartProps {
  data: SentimentDataPoint[];
  onPointClick?: (timestamp: number) => void;
  currentTime?: number;
}

export function SentimentChart({ data, onPointClick, currentTime }: SentimentChartProps) {
  const formatXAxis = (ms: number) => {
    const mins = Math.floor(ms / 60000);
    const secs = Math.floor((ms % 60000) / 1000);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formattedData = data.map(d => ({
    ...d,
    formattedTime: formatXAxis(d.timestamp),
    // Normalize score for display if needed, but -1 to 1 is fine for charts
    color: d.score > 0 ? "#22c55e" : d.score < 0 ? "#ef4444" : "#94a3b8"
  }));

  return (
    <Card className="p-6 shadow-sm border-border/60">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-bold">Emotional Arc</h3>
        <div className="flex items-center gap-4 text-xs font-medium text-muted-foreground">
          <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-green-500"/>Positive</div>
          <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-slate-400"/>Neutral</div>
          <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-red-500"/>Negative</div>
        </div>
      </div>
      
      <div className="h-[200px] w-full relative">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={formattedData}
            onClick={(e) => {
              if (e && e.activePayload && e.activePayload[0]) {
                onPointClick?.(e.activePayload[0].payload.timestamp);
              }
            }}
            margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
          >
            <defs>
              <linearGradient id="sentimentGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0.0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
            <XAxis 
              dataKey="timestamp" 
              tickFormatter={formatXAxis} 
              stroke="hsl(var(--muted-foreground))"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              minTickGap={30}
            />
            <YAxis 
              domain={[-1, 1]} 
              stroke="hsl(var(--muted-foreground))"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              tickCount={5}
            />
            <Tooltip 
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload;
                  return (
                    <div className="bg-popover border border-border shadow-lg rounded-lg p-2 text-xs">
                      <p className="font-semibold mb-1">{data.formattedTime}</p>
                      <p className={data.score > 0 ? "text-green-600" : "text-red-600"}>
                        Sentiment: {data.score.toFixed(2)}
                      </p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Area 
              type="monotone" 
              dataKey="score" 
              stroke="hsl(var(--primary))" 
              strokeWidth={2}
              fill="url(#sentimentGradient)" 
              activeDot={{ r: 6, strokeWidth: 0 }}
            />
          </AreaChart>
        </ResponsiveContainer>
        
        {/* Current Time Indicator Line */}
        {currentTime !== undefined && (
          <div 
            className="absolute top-0 bottom-6 w-0.5 bg-accent shadow-[0_0_10px_rgba(124,58,237,0.5)] z-10 transition-all duration-300 pointer-events-none"
            style={{
              // This is an approximation. In a real app we'd need exact pixel mapping from the chart scale
              // For simplicity, assuming linear distribution across the container width
              left: `${(currentTime / (data[data.length - 1]?.timestamp || 1)) * 100}%` 
            }}
          />
        )}
      </div>
    </Card>
  );
}

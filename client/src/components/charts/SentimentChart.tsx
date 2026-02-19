import { useMemo } from 'react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { format } from 'date-fns';
import { motion } from 'framer-motion';

interface SentimentChartProps {
  data: { timestamp: number; score: number }[];
  onPointClick?: (timestamp: number) => void;
}

export function SentimentChart({ data, onPointClick }: SentimentChartProps) {
  const chartData = useMemo(() => {
    return data.map(point => ({
      ...point,
      displayTime: format(new Date(point.timestamp), 'mm:ss'),
      sentimentLabel: point.score > 0 ? 'Positive' : point.score < 0 ? 'Negative' : 'Neutral'
    }));
  }, [data]);

  const gradientOffset = () => {
    const dataMax = Math.max(...chartData.map((i) => i.score));
    const dataMin = Math.min(...chartData.map((i) => i.score));
  
    if (dataMax <= 0) return 0;
    if (dataMin >= 0) return 1;
  
    return dataMax / (dataMax - dataMin);
  };
  
  const off = gradientOffset();

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full h-[250px] bg-background rounded-xl p-4 border border-border/50 shadow-sm"
    >
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">Sentiment Trend</h3>
        <div className="flex gap-2 text-xs">
          <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-emerald-500"></div> Positive</span>
          <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-rose-500"></div> Negative</span>
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
            <linearGradient id="splitColor" x1="0" y1="0" x2="0" y2="1">
              <stop offset={off} stopColor="#10b981" stopOpacity={0.3} />
              <stop offset={off} stopColor="#f43f5e" stopOpacity={0.3} />
            </linearGradient>
            <linearGradient id="strokeColor" x1="0" y1="0" x2="0" y2="1">
              <stop offset={off} stopColor="#10b981" stopOpacity={1} />
              <stop offset={off} stopColor="#f43f5e" stopOpacity={1} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
          <XAxis 
            dataKey="displayTime" 
            tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} 
            tickLine={false}
            axisLine={false}
            interval="preserveStartEnd"
          />
          <YAxis 
            domain={[-1, 1]} 
            tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} 
            tickLine={false}
            axisLine={false}
            hide={false}
          />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: 'hsl(var(--card))', 
              borderColor: 'hsl(var(--border))',
              borderRadius: '8px',
              fontSize: '12px',
              boxShadow: 'var(--shadow-lg)'
            }}
            cursor={{ stroke: 'hsl(var(--foreground))', strokeWidth: 1, strokeDasharray: '4 4' }}
            formatter={(value: number, name: string) => [Number.isFinite(value) ? value.toFixed(2) : value, name]}
          />
          <Area 
            type="monotone" 
            dataKey="score" 
            stroke="url(#strokeColor)" 
            fill="url(#splitColor)" 
            strokeWidth={2}
            activeDot={{ r: 6, strokeWidth: 0, fill: 'hsl(var(--foreground))' }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </motion.div>
  );
}

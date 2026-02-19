import { AnalysisResult } from "@shared/schema";
import { User, Mic, MessageSquare } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface SpeakerStatsProps {
  stats: AnalysisResult['speakerStats'];
}

export function SpeakerStats({ stats }: SpeakerStatsProps) {
  const data = stats.map((s, i) => ({
    name: s.speaker_id,
    talkTime: Math.round(s.total_talk_time_ms / 1000),
    turns: s.turn_count,
    sentiment: s.avg_sentiment,
    color: i === 0 ? 'hsl(var(--speaker-a))' : 'hsl(var(--speaker-b))'
  }));

  const totalTime = data.reduce((acc, curr) => acc + curr.talkTime, 0);
  const totalTurns = data.reduce((acc, curr) => acc + curr.turns, 0);

  return (
    <div className="grid grid-cols-1 gap-4">
      <Card className="border-border/50 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-2">
            <Mic className="w-4 h-4" /> Speaking Time
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {data.map((d) => (
              <div key={d.name} className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="font-semibold flex items-center gap-1.5">
                    <User className="w-3 h-3 text-muted-foreground" />
                    {d.name}
                  </span>
                  <span className="text-muted-foreground tabular-nums">
                    {Math.round((d.talkTime / totalTime) * 100)}% ({Math.floor(d.talkTime / 60)}m {d.talkTime % 60}s)
                  </span>
                </div>
                <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                  <div 
                    className="h-full rounded-full transition-all duration-500" 
                    style={{ width: `${(d.talkTime / totalTime) * 100}%`, backgroundColor: d.color }}
                  />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/50 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-2">
            <MessageSquare className="w-4 h-4" /> Participation Balance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {data.map((d) => (
              <div key={d.name} className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="font-semibold flex items-center gap-1.5">
                    <User className="w-3 h-3 text-muted-foreground" />
                    {d.name}
                  </span>
                  <span className="text-muted-foreground tabular-nums">
                    {totalTurns > 0 ? `${Math.round((d.turns / totalTurns) * 100)}%` : "0%"} ({d.turns})
                  </span>
                </div>
                <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${totalTurns > 0 ? (d.turns / totalTurns) * 100 : 0}%`,
                      backgroundColor: d.color,
                      opacity: 0.85,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

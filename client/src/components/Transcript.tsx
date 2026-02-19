import { useEffect, useRef } from 'react';
import { format } from 'date-fns';
import { cn } from "@/lib/utils";
import { Utterance } from '@shared/schema';
import { User, MessageSquare } from 'lucide-react';
import { ScrollArea } from "@/components/ui/scroll-area";
import { motion } from 'framer-motion';

interface TranscriptProps {
  utterances: Utterance[];
  activeTimestamp?: number;
  onUtteranceClick?: (timestamp: number) => void;
}

export function Transcript({ utterances, activeTimestamp, onUtteranceClick }: TranscriptProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const activeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (activeTimestamp !== undefined && activeRef.current) {
      activeRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [activeTimestamp]);

  // Helper to determine active state loosely (within a range)
  const isActive = (u: Utterance) => {
    if (!activeTimestamp) return false;
    // Highlight if the active timestamp falls within this utterance
    // OR if active timestamp is close to the start (for clicking charts)
    return (activeTimestamp >= u.start_ms && activeTimestamp <= u.end_ms) ||
           (Math.abs(activeTimestamp - u.start_ms) < 1000);
  };

  return (
    <div className="bg-card rounded-xl border border-border shadow-sm h-full flex flex-col overflow-hidden">
      <div className="p-4 border-b border-border/50 bg-muted/20 flex items-center justify-between">
        <h3 className="font-semibold flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-primary" />
          Transcript
        </h3>
        <span className="text-xs text-muted-foreground">{utterances.length} turns</span>
      </div>
      
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-6 pr-4">
          {utterances.map((u, i) => {
            const active = isActive(u);
            const sentimentColor = u.sentiment_score > 0.2 
              ? 'bg-emerald-500' 
              : u.sentiment_score < -0.2 
                ? 'bg-rose-500' 
                : 'bg-slate-300';
            
            return (
              <motion.div 
                key={`${u.speaker_id}-${u.start_ms}-${i}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05, duration: 0.3 }}
                ref={active ? activeRef : null}
                data-utterance-start={u.start_ms}
                onClick={() => onUtteranceClick?.(u.start_ms)}
                className={cn(
                  "relative pl-6 py-3 pr-4 rounded-lg cursor-pointer transition-all duration-200 border border-transparent group",
                  active 
                    ? "bg-accent/5 border-accent/20 shadow-sm" 
                    : "hover:bg-muted/30"
                )}
              >
                {/* Sentiment Indicator Line */}
                <div className={cn(
                  "absolute left-0 top-3 bottom-3 w-1 rounded-r-full transition-all duration-300",
                  active ? "w-1.5 opacity-100" : "opacity-40 group-hover:opacity-100",
                  sentimentColor
                )} />

                <div className="flex items-center justify-between mb-1">
                  <span className={cn(
                    "text-xs font-bold uppercase tracking-wider flex items-center gap-1.5",
                    u.speaker_id === "Speaker A" ? "text-[hsl(var(--speaker-a))]" : "text-[hsl(var(--speaker-b))]"
                  )}>
                    <User className="w-3 h-3" />
                    {u.speaker_id}
                  </span>
                  <span className="text-[10px] font-mono text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                    {format(new Date(u.start_ms), 'mm:ss')}
                  </span>
                </div>
                
                <p className={cn(
                  "text-sm leading-relaxed",
                  active ? "text-foreground font-medium" : "text-muted-foreground"
                )}>
                  {u.text}
                </p>
              </motion.div>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}

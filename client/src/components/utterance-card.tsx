import { Utterance } from "@shared/schema";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface UtteranceCardProps {
  utterance: Utterance;
  onClick?: () => void;
  isActive?: boolean;
}

export function UtteranceCard({ utterance, onClick, isActive }: UtteranceCardProps) {
  // Determine alignment and styles based on speaker
  const isSpeakerA = utterance.speaker_id === "A" || utterance.speaker_id === "SPEAKER_00";
  
  // Format timestamp (ms -> mm:ss)
  const formatTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  // Determine sentiment color indicator
  const getSentimentColor = (score: number) => {
    if (score > 0.3) return "bg-green-500";
    if (score < -0.3) return "bg-red-500";
    return "bg-slate-400";
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      onClick={onClick}
      className={cn(
        "flex flex-col gap-1 p-3 rounded-2xl transition-colors cursor-pointer border border-transparent",
        isActive ? "bg-primary/5 border-primary/20 shadow-sm" : "hover:bg-slate-50 dark:hover:bg-slate-900",
        isSpeakerA ? "items-start" : "items-end"
      )}
    >
      <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
        <span className={cn(
          "px-2 py-0.5 rounded-full text-[10px] uppercase tracking-wider",
          isSpeakerA 
            ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300" 
            : "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300"
        )}>
          {utterance.speaker_id}
        </span>
        <span>{formatTime(utterance.start_ms)}</span>
        <div 
          className={cn("w-2 h-2 rounded-full", getSentimentColor(utterance.sentiment_score))} 
          title={`Sentiment: ${utterance.sentiment_score.toFixed(2)}`}
        />
      </div>
      
      <p className={cn(
        "text-sm leading-relaxed max-w-[90%] p-3 rounded-2xl",
        isSpeakerA 
          ? "bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-tl-sm shadow-sm" 
          : "bg-primary text-primary-foreground rounded-tr-sm shadow-md"
      )}>
        {utterance.text}
      </p>
    </motion.div>
  );
}

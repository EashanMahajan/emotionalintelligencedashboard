import { Insight } from "@shared/schema";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { AlertCircle, Repeat, GitFork, Activity, Play } from "lucide-react";
import { motion } from "framer-motion";

interface InsightCardProps {
  insight: Insight;
  onClick: () => void;
}

const INSIGHT_CONFIG = {
  conflict: {
    icon: AlertCircle,
    color: "text-rose-600 dark:text-rose-400",
    bg: "bg-rose-50 dark:bg-rose-950/20",
    border: "border-rose-100 dark:border-rose-900/20",
    label: "Conflict"
  },
  loop: {
    icon: Repeat,
    color: "text-amber-600 dark:text-amber-400",
    bg: "bg-amber-50 dark:bg-amber-950/20",
    border: "border-amber-100 dark:border-amber-900/20",
    label: "Repetition"
  },
  divergence: {
    icon: GitFork,
    color: "text-indigo-600 dark:text-indigo-400",
    bg: "bg-indigo-50 dark:bg-indigo-950/20",
    border: "border-indigo-100 dark:border-indigo-900/20",
    label: "Divergence"
  },
  speaker_dynamics: {
    icon: Activity,
    color: "text-blue-600 dark:text-blue-400",
    bg: "bg-blue-50 dark:bg-blue-950/20",
    border: "border-blue-100 dark:border-blue-900/20",
    label: "Dynamics"
  }
};

export function InsightCard({ insight, onClick }: InsightCardProps) {
  const config = INSIGHT_CONFIG[insight.type as keyof typeof INSIGHT_CONFIG] || INSIGHT_CONFIG.speaker_dynamics;
  const Icon = config.icon;

  return (
    <motion.div 
      whileHover={{ y: -2, scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      onClick={onClick}
      className={cn(
        "group relative p-4 rounded-xl border cursor-pointer transition-all duration-200 shadow-sm hover:shadow-md",
        config.bg,
        config.border
      )}
    >
      <div className="flex items-start gap-3">
        <div className={cn("mt-0.5 p-2 rounded-lg bg-white dark:bg-black/20 shadow-sm", config.color)}>
          <Icon className="w-5 h-5" />
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <h4 className={cn("text-sm font-bold uppercase tracking-tight", config.color)}>
              {config.label}
            </h4>
            <span className="text-[10px] font-mono text-muted-foreground bg-white/50 dark:bg-black/20 px-1.5 py-0.5 rounded backdrop-blur-sm">
              {format(new Date(insight.timestamp), 'mm:ss')}
            </span>
          </div>
          <p className="text-sm text-foreground/80 leading-snug">
            {insight.description}
          </p>
        </div>

        <div 
          className="opacity-0 group-hover:opacity-100 absolute right-4 bottom-4 transition-opacity cursor-pointer"
          onClick={(e) => {
            e.stopPropagation();
            onClick();
          }}
        >
          <div className="bg-primary text-primary-foreground p-1.5 rounded-full shadow-lg hover:scale-110 transition-transform">
            <Play className="w-3 h-3 fill-current" />
          </div>
        </div>
      </div>
    </motion.div>
  );
}

import { useLocation } from "wouter";
import { useJobs } from "@/hooks/use-jobs";
import { format, formatDistanceToNow } from "date-fns";
import {
  ChevronRight, FileAudio, BarChart2, Loader2, UploadCloud,
  CheckCircle2, XCircle, Users, History, Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { AnalysisJob } from "@shared/schema";

function statusConfig(status: AnalysisJob["status"]) {
  switch (status) {
    case "completed":
      return {
        icon: CheckCircle2,
        iconColor: "text-emerald-500",
        bg: "bg-emerald-500/10",
        badge: "bg-emerald-500/15 text-emerald-400 border border-emerald-500/20",
        label: "Completed",
      };
    case "failed":
      return {
        icon: XCircle,
        iconColor: "text-rose-500",
        bg: "bg-rose-500/10",
        badge: "bg-rose-500/15 text-rose-400 border border-rose-500/20",
        label: "Failed",
      };
    default:
      return {
        icon: Loader2,
        iconColor: "text-amber-500",
        bg: "bg-amber-500/10",
        badge: "bg-amber-500/15 text-amber-400 border border-amber-500/20",
        label: "Processing",
      };
  }
}

function sentimentBar(job: AnalysisJob) {
  if (!job.results?.utterances?.length) return null;
  const avg =
    job.results.utterances.reduce((s, u) => s + u.sentiment_score, 0) /
    job.results.utterances.length;
  const color =
    avg > 0.2 ? "bg-emerald-500" : avg < -0.2 ? "bg-rose-500" : "bg-slate-400";
  const pct = Math.round(((avg + 1) / 2) * 100);
  return { avg, color, pct };
}

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } },
};
const item = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.28 } },
};

export default function HistoryPage() {
  const [, setLocation] = useLocation();
  const { data: jobs, isLoading } = useJobs();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border/60 bg-gradient-to-br from-background via-background to-primary/5">
        <div className="container mx-auto px-6 py-10 max-w-5xl flex items-end justify-between gap-4">
          <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
            <div className="flex items-center gap-2 mb-2">
              <div className="bg-primary/10 border border-primary/20 rounded-lg p-1.5">
                <History className="w-4 h-4 text-primary" />
              </div>
              <span className="text-xs font-semibold text-primary/80 uppercase tracking-widest">History</span>
            </div>
            <h1 className="text-3xl font-bold tracking-tight">Analysis History</h1>
            <p className="text-muted-foreground mt-1 text-sm">
              {jobs?.length
                ? `${jobs.length} upload${jobs.length !== 1 ? "s" : ""} · ${jobs.filter(j => j.status === "completed").length} completed`
                : "No analyses yet"}
            </p>
          </motion.div>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }}>
            <Button onClick={() => setLocation("/upload")} className="gap-2 shrink-0">
              <UploadCloud className="w-4 h-4" />
              New Analysis
            </Button>
          </motion.div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8 max-w-5xl">
        {!jobs?.length ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className="text-center py-24 bg-muted/10 rounded-2xl border border-dashed border-border"
          >
            <div className="bg-muted rounded-full w-14 h-14 flex items-center justify-center mx-auto mb-4">
              <FileAudio className="w-7 h-7 text-muted-foreground" />
            </div>
            <h3 className="text-base font-medium mb-1">No analyses yet</h3>
            <p className="text-sm text-muted-foreground mb-6 max-w-xs mx-auto">
              Upload an audio file to start uncovering emotional patterns in conversations.
            </p>
            <Button onClick={() => setLocation("/upload")}>
              <UploadCloud className="w-4 h-4 mr-2" /> Upload File
            </Button>
          </motion.div>
        ) : (
          <motion.div variants={container} initial="hidden" animate="show" className="space-y-3">
            {jobs.map((job) => {
              const sc = statusConfig(job.status);
              const StatusIcon = sc.icon;
              const sb = sentimentBar(job);
              const speakers = [...new Set(job.results?.utterances?.map(u => u.speaker_id) ?? [])];
              const turns = job.results?.utterances?.length ?? 0;
              const hasAiReport = (() => { try { return !!sessionStorage.getItem(`ai-report-${job.id}`); } catch { return false; } })();

              return (
                <motion.div
                  key={job.id}
                  variants={item}
                  onClick={() => job.status === "completed" ? setLocation(`/results/${job.id}`) : undefined}
                  className={cn(
                    "group bg-card border border-border rounded-xl p-4 transition-all duration-200",
                    job.status === "completed"
                      ? "cursor-pointer hover:border-primary/40 hover:shadow-md hover:shadow-primary/5"
                      : "opacity-80"
                  )}
                >
                  <div className="flex items-start gap-4">
                    <div className={cn("p-2.5 rounded-lg shrink-0 mt-0.5", sc.bg)}>
                      <StatusIcon className={cn("w-5 h-5", sc.iconColor, job.status !== "completed" && job.status !== "failed" && "animate-spin")} />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="font-medium text-sm truncate group-hover:text-primary transition-colors">
                            {job.filename}
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {job.createdAt
                              ? formatDistanceToNow(new Date(job.createdAt), { addSuffix: true })
                              : "Unknown date"}
                            <span className="mx-1.5 opacity-40">·</span>
                            {format(new Date(job.createdAt ?? Date.now()), "MMM d, yyyy · h:mm a")}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          {hasAiReport && (
                            <span className="flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-violet-500/15 text-violet-400 border border-violet-500/20">
                              <Sparkles className="w-2.5 h-2.5" />
                              AI Report
                            </span>
                          )}
                          <span className={cn("text-[11px] font-medium px-2 py-0.5 rounded-full", sc.badge)}>
                            {sc.label}
                          </span>
                          {job.status === "completed" && (
                            <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                          )}
                        </div>
                      </div>

                      {job.status === "completed" && (
                        <div className="mt-3 flex items-center gap-4">
                          {speakers.length > 0 && (
                            <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                              <Users className="w-3 h-3" />
                              {speakers.length} speaker{speakers.length !== 1 ? "s" : ""}
                            </span>
                          )}
                          {turns > 0 && (
                            <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                              <BarChart2 className="w-3 h-3" />
                              {turns} turns
                            </span>
                          )}
                          {sb && (
                            <div className="flex items-center gap-1.5 ml-auto">
                              <span className="text-[11px] text-muted-foreground">Avg tone</span>
                              <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
                                <div
                                  className={cn("h-full rounded-full", sb.color)}
                                  style={{ width: `${sb.pct}%` }}
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </div>
    </div>
  );
}

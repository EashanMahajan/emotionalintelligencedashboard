import { useLocation } from "wouter";
import { useJobs } from "@/hooks/use-jobs";
import { format, formatDistanceToNow } from "date-fns";
import {
  BarChart2,
  UploadCloud,
  FileAudio,
  Loader2,
  ChevronRight,
  CheckCircle2,
  XCircle,
  Brain,
  Sparkles,
  TrendingUp,
  Users,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
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
  show: { transition: { staggerChildren: 0.07 } },
};
const item = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3 } },
};

export default function DashboardOverview() {
  const [, setLocation] = useLocation();
  const { data: jobs, isLoading } = useJobs();

  const total = jobs?.length ?? 0;
  const completed = jobs?.filter((j) => j.status === "completed").length ?? 0;
  const recentJobs = jobs?.slice(0, 5) ?? [];

  const completedJobs = jobs?.filter(j => j.status === "completed" && j.results?.utterances?.length) ?? [];
  const allUtterances = completedJobs.flatMap(j => j.results!.utterances);
  const avgSentimentScore = allUtterances.length
    ? allUtterances.reduce((s, u) => s + u.sentiment_score, 0) / allUtterances.length
    : null;
  const avgSentimentLabel = avgSentimentScore === null ? "—"
    : avgSentimentScore > 0.2 ? "Positive"
    : avgSentimentScore < -0.2 ? "Negative"
    : "Neutral";
  const avgSentimentColor = avgSentimentScore === null ? "text-muted-foreground"
    : avgSentimentScore > 0.2 ? "text-emerald-400"
    : avgSentimentScore < -0.2 ? "text-rose-400"
    : "text-slate-400";

  const totalTurns = allUtterances.length;
  const totalInsights = completedJobs.reduce((s, j) => s + (j.results?.insights?.length ?? 0), 0);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <div className="relative overflow-hidden border-b border-border/60 bg-gradient-to-br from-background via-background to-primary/5">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,hsl(var(--primary)/0.12),transparent)]" />
        <div className="relative container mx-auto px-6 py-12 max-w-5xl">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
            <div className="flex items-center gap-2 mb-3">
              <div className="bg-primary/10 border border-primary/20 rounded-lg p-2">
                <Brain className="w-5 h-5 text-primary" />
              </div>
              <span className="text-xs font-medium text-primary/80 uppercase tracking-widest">Resonance</span>
            </div>
            <h1 className="text-4xl font-bold tracking-tight">Welcome back</h1>
            <p className="text-muted-foreground mt-2 text-base max-w-lg">
              Your emotional intelligence hub. Analyse tone, sentiment, and conversational dynamics from any audio.
            </p>
            <div className="mt-6 flex gap-3">
              <Button onClick={() => setLocation("/upload")} className="gap-2">
                <UploadCloud className="w-4 h-4" />
                New Analysis
              </Button>
              {total > 0 && (
                <Button variant="outline" onClick={() => setLocation("/history")} className="gap-2">
                  View History
                  <ChevronRight className="w-4 h-4" />
                </Button>
              )}
            </div>
          </motion.div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-10 max-w-5xl space-y-10">
        {/* Stats row */}
        <motion.div variants={container} initial="hidden" animate="show" className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {/* Uploads */}
          <motion.div variants={item} className="col-span-1 bg-card border border-border rounded-xl p-4 flex flex-col gap-3">
            <div className="bg-primary/10 rounded-lg p-2 w-fit">
              <FileAudio className="w-4 h-4 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{total || "—"}</p>
              <p className="text-xs text-muted-foreground mt-0.5">Total Uploads</p>
            </div>
          </motion.div>

          {/* Completed */}
          <motion.div variants={item} className="col-span-1 bg-card border border-border rounded-xl p-4 flex flex-col gap-3">
            <div className="bg-emerald-500/10 rounded-lg p-2 w-fit">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{completed || "—"}</p>
              <p className="text-xs text-muted-foreground mt-0.5">Completed</p>
            </div>
          </motion.div>

          {/* Insights Found */}
          <motion.div variants={item} className="col-span-1 bg-card border border-border rounded-xl p-4 flex flex-col gap-3">
            <div className="bg-amber-500/10 rounded-lg p-2 w-fit">
              <Zap className="w-4 h-4 text-amber-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{totalInsights || "—"}</p>
              <p className="text-xs text-muted-foreground mt-0.5">Insights Found</p>
            </div>
          </motion.div>

          {/* Total Turns */}
          <motion.div variants={item} className="col-span-1 bg-card border border-border rounded-xl p-4 flex flex-col gap-3">
            <div className="bg-blue-500/10 rounded-lg p-2 w-fit">
              <BarChart2 className="w-4 h-4 text-blue-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{totalTurns || "—"}</p>
              <p className="text-xs text-muted-foreground mt-0.5">Turns Analysed</p>
            </div>
          </motion.div>

          {/* Avg Sentiment */}
          <motion.div variants={item} className="col-span-1 bg-card border border-border rounded-xl p-4 flex flex-col gap-3">
            <div className="bg-teal-500/10 rounded-lg p-2 w-fit">
              <TrendingUp className="w-4 h-4 text-teal-400" />
            </div>
            <div>
              <p className={cn("text-2xl font-bold", avgSentimentColor)}>{avgSentimentLabel}</p>
              <p className="text-xs text-muted-foreground mt-0.5">Avg Sentiment</p>
            </div>
          </motion.div>
        </motion.div>

        {/* Recent analyses */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary/70" />
              Recent Analyses
            </h2>
            {total > 5 && (
              <button
                onClick={() => setLocation("/history")}
                className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
              >
                View all <ChevronRight className="w-3 h-3" />
              </button>
            )}
          </div>

          {recentJobs.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              className="text-center py-20 bg-muted/10 rounded-2xl border border-dashed border-border"
            >
              <div className="bg-muted rounded-full w-14 h-14 flex items-center justify-center mx-auto mb-4">
                <FileAudio className="w-7 h-7 text-muted-foreground" />
              </div>
              <h3 className="text-base font-medium mb-1">No analyses yet</h3>
              <p className="text-sm text-muted-foreground mb-6 max-w-xs mx-auto">
                Upload an audio file to start uncovering emotional patterns in conversations.
              </p>
              <Button onClick={() => setLocation("/upload")}>
                <UploadCloud className="w-4 h-4 mr-2" />
                Upload File
              </Button>
            </motion.div>
          ) : (
            <motion.div variants={container} initial="hidden" animate="show" className="space-y-3">
              {recentJobs.map((job) => {
                const sc = statusConfig(job.status);
                const StatusIcon = sc.icon;
                const sb = sentimentBar(job);
                const speakers = [...new Set(job.results?.utterances?.map(u => u.speaker_id) ?? [])];
                const turns = job.results?.utterances?.length ?? 0;

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
                      {/* Icon */}
                      <div className={cn("p-2.5 rounded-lg shrink-0 mt-0.5", sc.bg)}>
                        <StatusIcon className={cn("w-5 h-5", sc.iconColor, job.status !== "completed" && job.status !== "failed" && "animate-spin")} />
                      </div>

                      {/* Main content */}
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
                              {format(new Date(job.createdAt ?? Date.now()), "MMM d, yyyy")}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className={cn("text-[11px] font-medium px-2 py-0.5 rounded-full", sc.badge)}>
                              {sc.label}
                            </span>
                            {job.status === "completed" && (
                              <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                            )}
                          </div>
                        </div>

                        {/* Meta row */}
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
                                    className={cn("h-full rounded-full transition-all", sb.color)}
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
    </div>
  );
}

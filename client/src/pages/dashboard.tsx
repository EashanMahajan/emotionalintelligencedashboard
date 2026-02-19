import { useState, useRef } from "react";
import { useRoute, useLocation } from "wouter";
import { useJob } from "@/hooks/use-jobs";
import { AnalysisResult } from "@shared/schema";
import {
  Loader2, AlertCircle, UploadCloud, ChevronLeft, Download,
  Clock, Users, MessageSquare, TrendingUp, Zap, Brain, Headphones, FileText
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SentimentViewer } from "@/components/charts/SentimentViewer";
import { ConflictHeatmap } from "@/components/charts/ConflictHeatmap";
import { Transcript } from "@/components/Transcript";
import { InsightCard } from "@/components/InsightCard";
import { SpeakerStats } from "@/components/SpeakerStats";
import { SummaryCard } from "@/components/SummaryCard";
import { TopicsCard } from "@/components/TopicsCard";
import { IntentsCard } from "@/components/IntentsCard";
import { PlaybackTab, type PlaybackTabHandle } from "@/components/PlaybackTab";
import { SpeakerAnalysisTab } from "@/components/SpeakerAnalysisTab";
import { ChatPanel } from "@/components/ChatPanel";
import { motion } from "framer-motion";
import { exportAnalysisToCSV } from "@/lib/csv-export";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

function formatDuration(ms: number) {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`;
}

function getSentimentLabel(score: number) {
  if (score > 0.2) return { label: "Positive", color: "text-emerald-500", bg: "bg-emerald-500/10" };
  if (score < -0.2) return { label: "Negative", color: "text-rose-500", bg: "bg-rose-500/10" };
  return { label: "Neutral", color: "text-slate-400", bg: "bg-slate-500/10" };
}

export default function Dashboard() {
  const [match, params] = useRoute("/results/:id");
  const [, setLocation] = useLocation();
  const id = params ? parseInt(params.id) : 0;
  const { toast } = useToast();
  
  const { data: job, isLoading, error } = useJob(id);
  const [activeTimestamp, setActiveTimestamp] = useState<number>(0);
  const [activeTab, setActiveTab] = useState<string>("text");
  const playbackRef = useRef<PlaybackTabHandle>(null);

  const results = job?.results as unknown as AnalysisResult | undefined;

  const handleJumpToTimestamp = (timestampMs: number) => {
    // When on the playback tab, seek the audio player instead
    if (activeTab === "playback") {
      playbackRef.current?.seekTo(timestampMs);
      return;
    }
    setActiveTimestamp(timestampMs);
    if (typeof document !== "undefined" && results?.utterances?.length) {
      const nearest = results.utterances.reduce((best, current) => {
        const bestDiff = Math.abs(best.start_ms - timestampMs);
        const currentDiff = Math.abs(current.start_ms - timestampMs);
        return currentDiff < bestDiff ? current : best;
      }, results.utterances[0]);

      const el = document.querySelector<HTMLElement>(
        `[data-utterance-start="${nearest.start_ms}"]`
      );
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }
  };

  const handleDownloadCSV = () => {
    if (results && job) {
      try {
        exportAnalysisToCSV(results, job.filename);
        toast({
          title: "Download Started",
          description: "Your analysis data is being downloaded as CSV.",
        });
      } catch (error) {
        toast({
          variant: "destructive",
          title: "Download Failed",
          description: "Unable to export analysis data.",
        });
      }
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background space-y-4">
        <div className="relative">
          <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full animate-pulse" />
          <Loader2 className="w-12 h-12 text-primary animate-spin relative z-10" />
        </div>
        <div className="text-center space-y-2">
          <h2 className="text-xl font-semibold">Analyzing Conversation...</h2>
          <p className="text-muted-foreground text-sm max-w-xs">
            Our AI is processing speaker dynamics, sentiment, and conflict patterns.
          </p>
        </div>
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
        <div className="bg-destructive/10 p-4 rounded-full mb-4">
          <AlertCircle className="w-10 h-10 text-destructive" />
        </div>
        <h2 className="text-2xl font-bold mb-2">Analysis Failed</h2>
        <p className="text-muted-foreground mb-6 text-center max-w-md">
          We couldn't load the analysis results. The backend might be unreachable or the job ID is invalid.
        </p>
        <div className="flex gap-4">
          <Button variant="outline" onClick={() => setLocation("/upload")}>
            Back to Upload
          </Button>
          <Button onClick={() => window.location.reload()}>
            Retry Connection
          </Button>
        </div>
      </div>
    );
  }

  if (job.status !== "completed" || !results) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background space-y-6">
        <div className="w-64 h-2 bg-muted rounded-full overflow-hidden">
          <motion.div 
            className="h-full bg-primary"
            initial={{ width: "0%" }}
            animate={{ width: "100%" }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          />
        </div>
        <div className="text-center space-y-1">
          <h2 className="text-lg font-medium">Processing Audio...</h2>
          <p className="text-muted-foreground text-sm">Status: {job.status}</p>
        </div>
      </div>
    );
  }

  // Compute summary stats
  const durationMs = results
    ? Math.max(...results.utterances.map((u) => u.end_ms), 0)
    : 0;
  const speakerCount = results
    ? new Set(results.utterances.map((u) => u.speaker_id)).size
    : 0;
  const avgSentiment = results && results.overallSentiment.length
    ? results.overallSentiment.reduce((sum, s) => sum + s.score, 0) / results.overallSentiment.length
    : 0;
  const sentimentInfo = getSentimentLabel(avgSentiment);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b border-border/40 bg-background/80 backdrop-blur-md sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="shrink-0" onClick={() => setLocation("/upload")}>
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <Brain className="w-4 h-4 text-primary" />
              </div>
              <div>
                <h1 className="text-sm font-bold tracking-tight leading-none">{job.filename}</h1>
                <p className="text-xs text-muted-foreground mt-0.5">Analysis Complete</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="hidden sm:flex gap-1.5 text-xs font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Ready
            </Badge>
            <Button variant="outline" size="sm" onClick={handleDownloadCSV}>
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </Button>
            <Button size="sm" onClick={() => setLocation("/upload")}>
              <UploadCloud className="w-4 h-4 mr-2" />
              New Analysis
            </Button>
          </div>
        </div>
      </header>

      {/* Stats bar */}
      <div className="border-b border-border/30 bg-muted/20">
        <div className="container mx-auto px-4 py-3">
          <div className="flex flex-wrap items-center gap-6">
            <motion.div
              initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
              className="flex items-center gap-2 text-sm"
            >
              <div className="w-7 h-7 rounded-md bg-sky-500/10 flex items-center justify-center">
                <Clock className="w-3.5 h-3.5 text-sky-500" />
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide leading-none mb-0.5">Duration</p>
                <p className="font-semibold tabular-nums">{formatDuration(durationMs)}</p>
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
              className="flex items-center gap-2 text-sm"
            >
              <div className="w-7 h-7 rounded-md bg-violet-500/10 flex items-center justify-center">
                <Users className="w-3.5 h-3.5 text-violet-500" />
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide leading-none mb-0.5">Speakers</p>
                <p className="font-semibold">{speakerCount}</p>
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
              className="flex items-center gap-2 text-sm"
            >
              <div className="w-7 h-7 rounded-md bg-amber-500/10 flex items-center justify-center">
                <MessageSquare className="w-3.5 h-3.5 text-amber-500" />
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide leading-none mb-0.5">Turns</p>
                <p className="font-semibold">{results.utterances.length}</p>
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
              className="flex items-center gap-2 text-sm"
            >
              <div className={cn("w-7 h-7 rounded-md flex items-center justify-center", sentimentInfo.bg)}>
                <TrendingUp className={cn("w-3.5 h-3.5", sentimentInfo.color)} />
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide leading-none mb-0.5">Avg Tone</p>
                <p className={cn("font-semibold", sentimentInfo.color)}>{sentimentInfo.label}</p>
              </div>
            </motion.div>
            {results.insights.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
                className="flex items-center gap-2 text-sm"
              >
                <div className="w-7 h-7 rounded-md bg-rose-500/10 flex items-center justify-center">
                  <Zap className="w-3.5 h-3.5 text-rose-500" />
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wide leading-none mb-0.5">Insights</p>
                  <p className="font-semibold">{results.insights.length}</p>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </div>

      <main className="flex-1 container mx-auto px-4 py-6 overflow-hidden h-[calc(100vh-120px)]">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full">
          {/* Left column */}
          <div className={cn(activeTab === "speakers" ? "lg:col-span-12" : "lg:col-span-8", "flex flex-col gap-5 h-full overflow-hidden")}>
            <motion.div
              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            >
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-4 max-w-xl">
                  <TabsTrigger value="text" className="gap-1.5">
                    <FileText className="w-3.5 h-3.5" />
                    Overview
                  </TabsTrigger>
                  <TabsTrigger value="sentiment" className="gap-1.5">
                    <TrendingUp className="w-3.5 h-3.5" />
                    Sentiment
                  </TabsTrigger>
                  <TabsTrigger value="playback" className="gap-1.5">
                    <Headphones className="w-3.5 h-3.5" />
                    Playback
                  </TabsTrigger>
                  <TabsTrigger value="speakers" className="gap-1.5">
                    <Users className="w-3.5 h-3.5" />
                    Speakers
                  </TabsTrigger>
                </TabsList>
              
                <TabsContent value="text" className="space-y-4 mt-4">
                  {results?.summary && <SummaryCard summary={results.summary} />}
                  {results?.topics && results.topics.length > 0 && <TopicsCard topics={results.topics} />}
                  {results?.intents && results.intents.length > 0 && <IntentsCard intents={results.intents} />}
                  {!results?.summary && !results?.topics && !results?.intents && (
                    <div className="text-center py-8 text-muted-foreground text-sm">
                      No text breakdown data available
                    </div>
                  )}
                </TabsContent>
              
                <TabsContent value="sentiment" className="space-y-4 mt-4">
                  <SentimentViewer data={results.overallSentiment} utterances={results.utterances} onPointClick={handleJumpToTimestamp} />
                  <ConflictHeatmap utterances={results.utterances} onBinClick={handleJumpToTimestamp} />
                </TabsContent>

                <TabsContent value="playback" className="mt-4 overflow-y-auto max-h-[calc(100vh-260px)] pr-1">
                  <PlaybackTab ref={playbackRef} jobId={job.id} filename={job.filename} utterances={results.utterances} insights={results.insights} />
                </TabsContent>

                <TabsContent value="speakers" className="overflow-y-auto max-h-[calc(100vh-220px)] pr-1">
                  <SpeakerAnalysisTab
                    utterances={results.utterances}
                    speakerStats={results.speakerStats}
                    insights={results.insights}
                    onUtteranceClick={(ms) => {
                      setActiveTab("playback");
                      setTimeout(() => playbackRef.current?.seekTo(ms), 80);
                    }}
                  />
                </TabsContent>
              </Tabs>
            </motion.div>

            {activeTab !== "playback" && activeTab !== "speakers" && (
              <motion.div
                initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                className="h-[380px] min-h-0 flex-shrink-0"
              >
                <Transcript 
                  utterances={results.utterances}
                  mode={activeTab === 'text' ? 'text-breakdown' : 'analysis'}
                  topicSegments={activeTab === 'text' ? results.topicSegments : undefined}
                  intentSegments={activeTab === 'text' ? results.intentSegments : undefined}
                  activeTimestamp={activeTimestamp} 
                  onUtteranceClick={handleJumpToTimestamp}
                />
              </motion.div>
            )}
          </div>

          {/* Right column */}
          <div className={cn(activeTab === "speakers" ? "hidden" : "lg:col-span-4", "flex flex-col gap-5 h-full overflow-y-auto pr-1 pb-6")}>
            <motion.div
              initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 }}
              className="space-y-3"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-primary" />
                  <h3 className="font-bold text-base">Key Insights</h3>
                </div>
                <Badge className="text-xs">{results.insights.length} found</Badge>
              </div>
              <div className="space-y-2.5">
                {results.insights.map((insight, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, x: 12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 + idx * 0.06 }}
                  >
                    <InsightCard 
                      insight={insight} 
                      onClick={() => handleJumpToTimestamp(insight.timestamp)} 
                    />
                  </motion.div>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.35 }}
              className="space-y-3 pt-4 border-t border-border/50"
            >
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-primary" />
                <h3 className="font-bold text-base">Speaker Dynamics</h3>
              </div>
              <SpeakerStats stats={results.speakerStats} />
            </motion.div>
          </div>
        </div>
      </main>

      <ChatPanel context={results} filename={job.filename} />
    </div>
  );
}

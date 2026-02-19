import { useState, useEffect } from "react";
import { useRoute, useLocation } from "wouter";
import { useJob } from "@/hooks/use-jobs";
import { AnalysisResult } from "@shared/schema";
import { Loader2, AlertCircle, UploadCloud, ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SentimentViewer } from "@/components/charts/SentimentViewer";
import { ConflictHeatmap } from "@/components/charts/ConflictHeatmap";
import { Transcript } from "@/components/Transcript";
import { InsightCard } from "@/components/InsightCard";
import { SpeakerStats } from "@/components/SpeakerStats";
import { motion } from "framer-motion";

export default function Dashboard() {
  const [match, params] = useRoute("/results/:id");
  const [, setLocation] = useLocation();
  const id = params ? parseInt(params.id) : 0;
  
  const { data: job, isLoading, error } = useJob(id);
  const [activeTimestamp, setActiveTimestamp] = useState<number>(0);

  const results = job?.results as unknown as AnalysisResult | undefined;

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

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b border-border/40 bg-background/80 backdrop-blur-md sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => setLocation("/upload")}>
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-lg font-bold tracking-tight">{job.filename}</h1>
              <p className="text-xs text-muted-foreground">Analysis Completed • {results.utterances.length} turns processed</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setLocation("/upload")}>
              <UploadCloud className="w-4 h-4 mr-2" />
              New Analysis
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-4 py-6 overflow-hidden h-[calc(100vh-64px)]">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full">
          <div className="lg:col-span-8 flex flex-col gap-6 h-full overflow-hidden">
            <div className="flex-none">
              <SentimentViewer data={results.overallSentiment} onPointClick={setActiveTimestamp} />
            </div>

            <div className="flex-none">
              <ConflictHeatmap
                utterances={results.utterances}
                onBinClick={setActiveTimestamp}
              />
            </div>

            <div className="flex-1 min-h-0">
              <Transcript 
                utterances={results.utterances} 
                activeTimestamp={activeTimestamp} 
                onUtteranceClick={setActiveTimestamp}
              />
            </div>
          </div>

          <div className="lg:col-span-4 flex flex-col gap-6 h-full overflow-y-auto pr-2 pb-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-lg">Key Insights</h3>
                <span className="bg-primary/10 text-primary text-xs font-bold px-2 py-1 rounded-full">
                  {results.insights.length} Found
                </span>
              </div>
              <div className="space-y-3">
                {results.insights.map((insight, idx) => (
                  <InsightCard 
                    key={idx} 
                    insight={insight} 
                    onClick={() => setActiveTimestamp(insight.timestamp)} 
                  />
                ))}
              </div>
            </div>

            <div className="space-y-4 pt-4 border-t border-border">
              <h3 className="font-bold text-lg">Speaker Dynamics</h3>
              <SpeakerStats stats={results.speakerStats} />
            </div>

          </div>
        </div>
      </main>
    </div>
  );
}

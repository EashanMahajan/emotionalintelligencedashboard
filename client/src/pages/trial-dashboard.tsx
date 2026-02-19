import { useState } from "react";
import { useRoute, useLocation } from "wouter";
import { useJob } from "@/hooks/use-jobs";
import { AnalysisResult } from "@shared/schema";
import { Loader2, AlertCircle, UploadCloud, ChevronLeft, Lock, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Transcript } from "@/components/Transcript";
import { SpeakerStats } from "@/components/SpeakerStats";
import { motion } from "framer-motion";
import { isTrialJob } from "@/lib/trial-tracker";

export default function TrialDashboard() {
  const [match, params] = useRoute("/try/results/:id");
  const [, setLocation] = useLocation();
  const id = params ? parseInt(params.id) : 0;
  
  const { data: job, isLoading, error } = useJob(id);
  const [activeTimestamp, setActiveTimestamp] = useState<number>(0);
  
  const isTrial = isTrialJob(id);
  const results = job?.results as unknown as AnalysisResult | undefined;

  const handleJumpToTimestamp = (timestampMs: number) => {
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

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <nav className="border-b bg-background/80 backdrop-blur-sm">
          <div className="mx-auto max-w-7xl px-4 py-4 flex items-center justify-between">
            <div 
              className="text-xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent cursor-pointer"
              onClick={() => setLocation("/")}
            >
              Resonance
            </div>
            <Button onClick={() => setLocation("/signup")}>Sign Up</Button>
          </div>
        </nav>
        <div className="flex-1 flex flex-col items-center justify-center bg-background space-y-4">
          <div className="relative">
            <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full animate-pulse" />
            <Loader2 className="w-12 h-12 text-primary animate-spin relative z-10" />
          </div>
          <div className="text-center space-y-2">
            <h2 className="text-xl font-semibold">Analyzing Conversation...</h2>
            <p className="text-muted-foreground text-sm max-w-xs">
              Our AI is processing the conversation.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !job || !isTrial) {
    return (
      <div className="min-h-screen flex flex-col">
        <nav className="border-b bg-background/80 backdrop-blur-sm">
          <div className="mx-auto max-w-7xl px-4 py-4 flex items-center justify-between">
            <div 
              className="text-xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent cursor-pointer"
              onClick={() => setLocation("/")}
            >
              Resonance
            </div>
            <Button onClick={() => setLocation("/signup")}>Sign Up</Button>
          </div>
        </nav>
        <div className="flex-1 flex flex-col items-center justify-center bg-background p-4">
          <div className="bg-destructive/10 p-4 rounded-full mb-4">
            <AlertCircle className="w-10 h-10 text-destructive" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Analysis Not Found</h2>
          <p className="text-muted-foreground mb-6 text-center max-w-md">
            This analysis is not available or doesn't exist.
          </p>
          <Button onClick={() => setLocation("/try")}>
            Back to Try
          </Button>
        </div>
      </div>
    );
  }

  if (job.status !== "completed" || !results) {
    return (
      <div className="min-h-screen flex flex-col">
        <nav className="border-b bg-background/80 backdrop-blur-sm">
          <div className="mx-auto max-w-7xl px-4 py-4 flex items-center justify-between">
            <div 
              className="text-xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent cursor-pointer"
              onClick={() => setLocation("/")}
            >
              Resonance
            </div>
            <Button onClick={() => setLocation("/signup")}>Sign Up</Button>
          </div>
        </nav>
        <div className="flex-1 flex flex-col items-center justify-center bg-background space-y-6">
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
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b border-border/40 bg-background/80 backdrop-blur-md sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => setLocation("/try")}>
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-lg font-bold tracking-tight">{job.filename}</h1>
              <p className="text-xs text-muted-foreground">Trial Analysis • {results.utterances.length} turns processed</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <motion.div
              animate={{ 
                scale: [1, 1.05, 1],
              }}
              transition={{ 
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut" 
              }}
            >
              <Button 
                onClick={() => setLocation("/signup")} 
                size="lg"
                className="shadow-2xl shadow-primary/40 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 font-semibold px-6"
              >
                <Sparkles className="w-5 h-5 mr-2" />
                Sign Up for Full Access
              </Button>
            </motion.div>
          </div>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-4 py-6 overflow-hidden h-[calc(100vh-64px)]">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full">
          <div className="lg:col-span-8 flex flex-col gap-6 h-full overflow-hidden">
            {/* Blurred Summary */}
            <div className="flex-none relative">
              <div className="absolute inset-0 z-10 backdrop-blur-md bg-background/40 rounded-2xl flex flex-col items-center justify-center p-8">
                <Lock className="w-10 h-10 text-muted-foreground mb-3" />
                <h3 className="text-lg font-semibold mb-2">AI Summary</h3>
                <p className="text-muted-foreground text-center text-sm max-w-md">
                  Get AI-generated conversation summaries
                </p>
              </div>
              <div className="opacity-20 pointer-events-none h-32 bg-card rounded-2xl border" />
            </div>

            {/* Blurred Topics */}
            <div className="flex-none relative">
              <div className="absolute inset-0 z-10 backdrop-blur-md bg-background/40 rounded-2xl flex flex-col items-center justify-center p-8">
                <Lock className="w-10 h-10 text-muted-foreground mb-3" />
                <h3 className="text-lg font-semibold mb-2">Key Topics</h3>
                <p className="text-muted-foreground text-center text-sm max-w-md">
                  Discover automatically extracted conversation topics
                </p>
              </div>
              <div className="opacity-20 pointer-events-none h-28 bg-card rounded-2xl border" />
            </div>

            {/* Blurred Intents */}
            <div className="flex-none relative">
              <div className="absolute inset-0 z-10 backdrop-blur-md bg-background/40 rounded-2xl flex flex-col items-center justify-center p-8">
                <Lock className="w-10 h-10 text-muted-foreground mb-3" />
                <h3 className="text-lg font-semibold mb-2">Detected Intents</h3>
                <p className="text-muted-foreground text-center text-sm max-w-md">
                  Understand the goals and objectives behind the conversation
                </p>
              </div>
              <div className="opacity-20 pointer-events-none h-28 bg-card rounded-2xl border" />
            </div>

            {/* Blurred Sentiment Chart */}
            <div className="flex-none relative">
              <div className="absolute inset-0 z-10 backdrop-blur-md bg-background/40 rounded-2xl flex flex-col items-center justify-center p-8">
                <Lock className="w-10 h-10 text-muted-foreground mb-3" />
                <h3 className="text-lg font-semibold mb-2">Sentiment Analysis</h3>
                <p className="text-muted-foreground text-center text-sm max-w-md">
                  Unlock sentiment charts and emotional trajectory analysis
                </p>
              </div>
              <div className="opacity-20 pointer-events-none h-64 bg-card rounded-2xl border" />
            </div>

            {/* Blurred Conflict Heatmap */}
            <div className="flex-none relative">
              <div className="absolute inset-0 z-10 backdrop-blur-md bg-background/40 rounded-2xl flex flex-col items-center justify-center p-8">
                <Lock className="w-10 h-10 text-muted-foreground mb-3" />
                <h3 className="text-lg font-semibold mb-2">Conflict Detection</h3>
                <p className="text-muted-foreground text-center text-sm max-w-md">
                  Unlock conflict heatmaps and tension analysis
                </p>
              </div>
              <div className="opacity-20 pointer-events-none h-48 bg-card rounded-2xl border" />
            </div>

            {/* Transcript - Visible */}
            <div className="flex-1 min-h-0">
              <Transcript 
                utterances={results.utterances} 
                activeTimestamp={activeTimestamp} 
                onUtteranceClick={handleJumpToTimestamp}
              />
            </div>
          </div>

          <div className="lg:col-span-4 flex flex-col gap-6 h-full overflow-y-auto pr-2 pb-6">
            {/* Blurred Insights */}
            <div className="space-y-4 relative">
              <div className="absolute inset-0 z-10 backdrop-blur-md bg-background/60 rounded-2xl flex flex-col items-center justify-center p-6">
                <Lock className="w-10 h-10 text-muted-foreground mb-3" />
                <h3 className="text-lg font-semibold mb-2 text-center">Key Insights</h3>
                <p className="text-muted-foreground text-sm text-center max-w-xs">
                  AI-powered insights including conflict detection and tone analysis
                </p>
              </div>
              <div className="opacity-20 pointer-events-none">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-lg">Key Insights</h3>
                  <span className="bg-primary/10 text-primary text-xs font-bold px-2 py-1 rounded-full">
                    {results.insights.length}
                  </span>
                </div>
                <div className="space-y-3">
                  {[1, 2, 3].map((idx) => (
                    <div key={idx} className="bg-card border rounded-xl p-4 h-20" />
                  ))}
                </div>
              </div>
            </div>

            {/* Speaker Stats - Visible */}
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

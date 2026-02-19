import { useState } from "react";
import { useRoute, useLocation } from "wouter";
import { useJob } from "@/hooks/use-jobs";
import { AnalysisResult } from "@shared/schema";
import { Loader2, AlertCircle, ChevronLeft, Lock, Sparkles, TrendingUp, Zap, BarChart2, FileText, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Transcript } from "@/components/Transcript";
import { SpeakerStats } from "@/components/SpeakerStats";
import { ResonanceLogo } from "@/components/ResonanceLogo";
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
        <nav className="border-b border-border/40 bg-background/80 backdrop-blur-md">
          <div className="mx-auto max-w-6xl px-6 h-14 flex items-center">
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => setLocation("/")}>
              <div className="bg-primary/10 border border-primary/20 rounded-lg p-1.5">
                <ResonanceLogo className="w-4 h-4 text-primary" />
              </div>
              <span className="text-base font-semibold uppercase tracking-widest bg-gradient-to-r from-foreground to-foreground/60 bg-clip-text text-transparent">Resonance</span>
            </div>
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
        <nav className="border-b border-border/40 bg-background/80 backdrop-blur-md">
          <div className="mx-auto max-w-6xl px-6 h-14 flex items-center">
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => setLocation("/")}>
              <div className="bg-primary/10 border border-primary/20 rounded-lg p-1.5">
                <ResonanceLogo className="w-4 h-4 text-primary" />
              </div>
              <span className="text-base font-semibold uppercase tracking-widest bg-gradient-to-r from-foreground to-foreground/60 bg-clip-text text-transparent">Resonance</span>
            </div>
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
        <nav className="border-b border-border/40 bg-background/80 backdrop-blur-md">
          <div className="mx-auto max-w-6xl px-6 h-14 flex items-center">
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => setLocation("/")}>
              <div className="bg-primary/10 border border-primary/20 rounded-lg p-1.5">
                <ResonanceLogo className="w-4 h-4 text-primary" />
              </div>
              <span className="text-base font-semibold uppercase tracking-widest bg-gradient-to-r from-foreground to-foreground/60 bg-clip-text text-transparent">Resonance</span>
            </div>
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
        <div className="container mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="shrink-0" onClick={() => setLocation("/try")}>
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <div className="flex items-center gap-2">
              <div className="bg-primary/10 border border-primary/20 rounded-lg p-1.5">
                <ResonanceLogo className="w-4 h-4 text-primary" />
              </div>
              <span className="text-base font-semibold uppercase tracking-widest bg-gradient-to-r from-foreground to-foreground/60 bg-clip-text text-transparent">Resonance</span>
              <span className="text-xs text-muted-foreground ml-1">· Trial</span>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-4 py-6 max-w-6xl">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

          {/* Left — Transcript */}
          <div className="lg:col-span-8 flex flex-col gap-4">
            <div>
              <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground mb-3">Transcript</h2>
              <Transcript
                utterances={results.utterances}
                activeTimestamp={activeTimestamp}
                onUtteranceClick={handleJumpToTimestamp}
              />
            </div>
          </div>

          {/* Right — Speaker Dynamics + Upgrade */}
          <div className="lg:col-span-4 flex flex-col gap-6">
            <div>
              <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground mb-3">Speaker Dynamics</h2>
              <SpeakerStats stats={results.speakerStats} />
            </div>

            {/* Upgrade gate */}
            <div className="rounded-2xl border border-border bg-card p-6 flex flex-col items-center text-center gap-4">
              <div className="bg-muted rounded-full p-3">
                <Lock className="w-6 h-6 text-muted-foreground" />
              </div>
              <div>
                <h3 className="font-semibold text-base mb-1">Unlock the full picture</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Sign up for free to access everything Resonance has to offer.
                </p>
              </div>
              <div className="w-full space-y-2 text-left">
                {[
                  { icon: TrendingUp, label: "Sentiment timeline & conflict heatmap" },
                  { icon: Zap, label: "AI-powered key insights & conflict detection" },
                  { icon: BarChart2, label: "Full speaker sentiment breakdown" },
                  { icon: FileText, label: "AI-generated conversation report" },
                  { icon: MessageSquare, label: "Resonance Chat — ask anything about the call" },
                ].map(({ icon: Icon, label }) => (
                  <div key={label} className="flex items-center gap-2.5 text-sm text-muted-foreground">
                    <Icon className="w-3.5 h-3.5 text-primary shrink-0" />
                    {label}
                  </div>
                ))}
              </div>
              <Button onClick={() => setLocation("/signup")} className="w-full gap-2">
                <Sparkles className="w-4 h-4" />
                Create Free Account
              </Button>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}

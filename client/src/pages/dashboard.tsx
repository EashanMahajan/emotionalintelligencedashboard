import { useState, useRef, useEffect } from "react";
import { useRoute } from "wouter";
import { useAnalysisJob } from "@/hooks/use-analysis";
import { LayoutShell } from "@/components/layout-shell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { UtteranceCard } from "@/components/utterance-card";
import { SentimentChart } from "@/components/sentiment-chart";
import { Loader2, AlertCircle, Play, Pause, AlertTriangle, Users } from "lucide-react";
import { AnalysisResult } from "@shared/schema";

export default function Dashboard() {
  const [match, params] = useRoute("/results/:id");
  const id = params ? parseInt(params.id) : 0;
  const { data: job, isLoading, error } = useAnalysisJob(id);

  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  
  // Only for mockup: Simple timer to simulate playback
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlaying) {
      interval = setInterval(() => {
        setCurrentTime(prev => prev + 1000);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isPlaying]);

  if (isLoading) {
    return (
      <LayoutShell>
        <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
          <Loader2 className="w-12 h-12 animate-spin text-primary" />
          <h2 className="text-xl font-medium text-muted-foreground">Loading analysis...</h2>
        </div>
      </LayoutShell>
    );
  }

  if (error || !job) {
    return (
      <LayoutShell>
        <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
          <AlertCircle className="w-12 h-12 text-destructive" />
          <h2 className="text-xl font-medium text-destructive">Failed to load analysis</h2>
          <p className="text-muted-foreground">The requested job could not be found or processed.</p>
          <Button variant="outline" onClick={() => window.location.href = "/"}>Return Home</Button>
        </div>
      </LayoutShell>
    );
  }

  if (job.status === "pending" || job.status === "processing") {
    return (
      <LayoutShell>
        <div className="max-w-2xl mx-auto mt-20 text-center space-y-8">
          <div className="relative w-32 h-32 mx-auto">
            <div className="absolute inset-0 border-4 border-slate-100 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            <ActivityIcon className="absolute inset-0 m-auto w-10 h-10 text-primary animate-pulse" />
          </div>
          <div>
            <h2 className="text-3xl font-bold mb-2">Analyzing Conversation...</h2>
            <p className="text-muted-foreground text-lg">
              Our AI is processing "{job.filename}". This typically takes 30-60 seconds.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left">
            <ProcessingStep title="Transcribing" status="completed" />
            <ProcessingStep title="Speaker Diarization" status="processing" />
            <ProcessingStep title="Sentiment Analysis" status="pending" />
          </div>
        </div>
      </LayoutShell>
    );
  }

  // Safe cast because we only render this if status is completed, which implies results exist
  const results = job.results as unknown as AnalysisResult;
  
  const handleUtteranceClick = (ms: number) => {
    setCurrentTime(ms);
    // In a real app with an audio player, we'd seek the audio here
  };

  return (
    <LayoutShell>
      <div className="flex items-center justify-between mb-2">
        <div>
          <h1 className="text-2xl font-bold tracking-tight mb-1">{job.filename}</h1>
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Analysis Complete</Badge>
            <span className="text-sm text-muted-foreground">Processed today at {new Date(job.createdAt!).toLocaleTimeString()}</span>
          </div>
        </div>
        
        <Button 
          size="lg" 
          className="gap-2 shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all"
          onClick={() => setIsPlaying(!isPlaying)}
        >
          {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          {isPlaying ? "Pause Playback" : "Play Recording"}
        </Button>
      </div>

      {/* Top Visualizations */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <SentimentChart 
            data={results.overallSentiment} 
            currentTime={currentTime}
            onPointClick={handleUtteranceClick}
          />
        </div>
        
        <Card className="p-6 flex flex-col gap-4">
          <h3 className="font-bold text-lg flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" />
            Speaker Dynamics
          </h3>
          <div className="space-y-4">
            {results.speakerStats.map(speaker => (
              <div key={speaker.speaker_id} className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="font-medium">Speaker {speaker.speaker_id}</span>
                  <span className="text-muted-foreground">{Math.round(speaker.total_talk_time_ms / 1000)}s</span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div 
                    className={speaker.speaker_id === "A" ? "bg-blue-500 h-full" : "bg-orange-500 h-full"}
                    style={{ width: `${Math.min(100, (speaker.total_talk_time_ms / (results.utterances[results.utterances.length-1].end_ms)) * 100)}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Sentiment: {speaker.avg_sentiment > 0 ? "Positive" : "Negative"}</span>
                  <span>{speaker.turn_count} turns</span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[600px]">
        {/* Transcript Area */}
        <Card className="lg:col-span-2 overflow-hidden flex flex-col shadow-sm border-border/60">
          <div className="p-4 border-b bg-slate-50/50 dark:bg-slate-900/50 backdrop-blur-sm flex justify-between items-center sticky top-0 z-10">
            <h3 className="font-bold text-lg">Transcript</h3>
            <div className="text-xs font-mono text-muted-foreground bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">
              {Math.floor(currentTime / 60000)}:{Math.floor((currentTime % 60000) / 1000).toString().padStart(2, '0')}
            </div>
          </div>
          <ScrollArea className="flex-1 p-4" ref={scrollRef}>
            <div className="space-y-4 pb-20">
              {results.utterances.map((utt, idx) => (
                <UtteranceCard 
                  key={idx} 
                  utterance={utt} 
                  onClick={() => handleUtteranceClick(utt.start_ms)}
                  isActive={currentTime >= utt.start_ms && currentTime <= utt.end_ms}
                />
              ))}
            </div>
          </ScrollArea>
        </Card>

        {/* Insights Panel */}
        <Card className="bg-slate-50/50 dark:bg-slate-900/50 overflow-hidden flex flex-col border-border/60">
          <div className="p-4 border-b bg-white/50 dark:bg-slate-900/50">
            <h3 className="font-bold text-lg flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-accent" />
              Key Insights
            </h3>
          </div>
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-3">
              {results.insights.map((insight, idx) => (
                <div 
                  key={idx}
                  onClick={() => handleUtteranceClick(insight.timestamp)}
                  className="group bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-100 dark:border-slate-700 hover:border-accent hover:shadow-md transition-all cursor-pointer"
                >
                  <div className="flex justify-between items-start mb-2">
                    <Badge variant="secondary" className="bg-slate-100 dark:bg-slate-700 font-mono text-xs">
                      {Math.floor(insight.timestamp / 60000)}:{Math.floor((insight.timestamp % 60000) / 1000).toString().padStart(2, '0')}
                    </Badge>
                    <div className={`w-2 h-2 rounded-full ${insight.severity > 0.7 ? 'bg-red-500' : 'bg-yellow-500'}`} />
                  </div>
                  <h4 className="font-semibold text-sm capitalize mb-1 group-hover:text-accent transition-colors">
                    {insight.type.replace('_', ' ')} Detected
                  </h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {insight.description}
                  </p>
                </div>
              ))}
            </div>
          </ScrollArea>
        </Card>
      </div>
    </LayoutShell>
  );
}

function ProcessingStep({ title, status }: { title: string, status: 'pending' | 'processing' | 'completed' }) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-lg border border-border bg-card">
      <div className={`w-3 h-3 rounded-full ${
        status === 'completed' ? 'bg-green-500' : 
        status === 'processing' ? 'bg-blue-500 animate-pulse' : 'bg-slate-200'
      }`} />
      <span className={`text-sm font-medium ${status === 'pending' ? 'text-muted-foreground' : 'text-foreground'}`}>
        {title}
      </span>
    </div>
  );
}

function ActivityIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
    </svg>
  );
}

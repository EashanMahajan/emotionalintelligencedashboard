import { useState, useCallback } from "react";
import { useLocation } from "wouter";
import { useUploadJob } from "@/hooks/use-jobs";
import { useDropzone } from "react-dropzone";
import { UploadCloud, FileAudio, AlertCircle, Loader2, BarChart2, Mic, ShieldCheck, Zap } from "lucide-react";
import { ResonanceLogo } from "@/components/ResonanceLogo";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { AudioRecorder } from "@/components/AudioRecorder";

const FEATURES = [
  {
    icon: ResonanceLogo,
    color: "text-primary",
    bg: "bg-primary/10",
    title: "Emotion Analysis",
    desc: "Sentiment scored per utterance across the full conversation",
  },
  {
    icon: BarChart2,
    color: "text-emerald-400",
    bg: "bg-emerald-500/10",
    title: "Speaker Dynamics",
    desc: "Talk-time balance, turn cadence, and per-speaker tone",
  },
  {
    icon: Zap,
    color: "text-amber-400",
    bg: "bg-amber-500/10",
    title: "Conflict Detection",
    desc: "Automatic flagging of tension peaks and divergence points",
  },
  {
    icon: ShieldCheck,
    color: "text-violet-400",
    bg: "bg-violet-500/10",
    title: "Topic & Intent",
    desc: "AI-extracted topics and intents mapped to transcript segments",
  },
];

export default function UploadPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const uploadMutation = useUploadJob();
  const [isDragActive, setIsDragActive] = useState(false);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;
    
    const file = acceptedFiles[0];
    try {
      toast({
        title: "Analysis Started",
        description: "Uploading and processing your audio…",
      });
      const result = await uploadMutation.mutateAsync(file);
      toast({
        title: "Analysis Complete",
        description: "Your audio has been fully analysed.",
      });
      // Redirect to results page
      setLocation(`/results/${result.id}`);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Analysis Failed",
        description: error instanceof Error ? error.message : "Something went wrong",
      });
    }
  }, [uploadMutation, setLocation, toast]);

  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    onDragEnter: () => setIsDragActive(true),
    onDragLeave: () => setIsDragActive(false),
    accept: {
      "audio/mpeg": [".mp3"],
      "audio/wav": [".wav"],
      "audio/m4a": [".m4a"],
      "audio/mp4": [".mp4"],
      "video/mp4": [".mp4"],
    },
    maxFiles: 1,
    maxSize: 50 * 1024 * 1024, // 50MB
    multiple: false,
  });

  const handleRecordingComplete = useCallback(async (audioBlob: Blob, filename: string) => {
    const file = new File([audioBlob], filename, { type: audioBlob.type });
    try {
      toast({
        title: "Analysis Started",
        description: "Uploading and processing your recording…",
      });
      const result = await uploadMutation.mutateAsync(file);
      toast({
        title: "Analysis Complete",
        description: "Your recording has been fully analysed.",
      });
      setLocation(`/results/${result.id}`);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Analysis Failed",
        description: error instanceof Error ? error.message : "Something went wrong",
      });
    }
  }, [uploadMutation, setLocation, toast]);

  return (
    <div className="h-screen overflow-hidden bg-background flex flex-col">
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-[30%] left-1/2 -translate-x-1/2 w-[70%] h-[50%] bg-primary/6 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 py-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-5 max-w-2xl"
        >
          <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 text-primary px-3.5 py-1 rounded-full text-xs font-semibold tracking-wide mb-3">
            <ResonanceLogo className="w-3.5 h-3.5" />
            Powered by Deepgram AI
          </div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
            Unlock Conversation
            <span className="bg-gradient-to-r from-primary to-primary/50 bg-clip-text text-transparent"> Insights</span>
          </h1>
          <p className="text-muted-foreground text-lg leading-relaxed">
            Upload a recording or capture live audio. Get sentiment analysis, speaker dynamics, and conflict detection in seconds.
          </p>
        </motion.div>

        {/* Upload card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.15, duration: 0.4 }}
          className="w-full max-w-2xl"
        >
          <Tabs defaultValue="upload" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="upload" className="flex items-center gap-2">
                <UploadCloud className="w-4 h-4" /> Upload File
              </TabsTrigger>
              <TabsTrigger value="record" className="flex items-center gap-2">
                <Mic className="w-4 h-4" /> Record Audio
              </TabsTrigger>
            </TabsList>

            <TabsContent value="upload">
              <div
                {...getRootProps()}
                className={cn(
                  "relative group cursor-pointer bg-card border-2 border-dashed rounded-2xl p-8",
                  "flex flex-col items-center justify-center text-center transition-all duration-300",
                  "hover:border-primary/50 hover:shadow-xl hover:shadow-primary/5",
                  isDragActive ? "border-primary bg-primary/5 scale-[1.01]" : "border-border/60",
                  uploadMutation.isPending && "pointer-events-none opacity-80"
                )}
              >
                <input {...getInputProps()} />
                <AnimatePresence mode="wait">
                  {uploadMutation.isPending ? (
                    <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center">
                      <div className="relative mb-6">
                        <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full" />
                        <Loader2 className="w-14 h-14 text-primary animate-spin relative" />
                      </div>
                      <h3 className="text-xl font-semibold mb-1">Analysing Audio…</h3>
                      <p className="text-sm text-muted-foreground">Deepgram is processing your file</p>
                    </motion.div>
                  ) : (
                    <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center">
                      <div className="bg-primary/10 border border-primary/20 rounded-2xl p-5 mb-5 group-hover:scale-110 group-hover:bg-primary/15 transition-all duration-300">
                        <UploadCloud className="w-10 h-10 text-primary" />
                      </div>
                      <h3 className="text-xl font-semibold mb-1.5">
                        {isDragActive ? "Drop it here" : "Drag & drop your audio"}
                      </h3>
                      <p className="text-sm text-muted-foreground mb-6">MP3 · WAV · M4A · MP4 &nbsp;&middot;&nbsp; up to 50 MB</p>
                      <Button size="lg" className="rounded-full px-8 shadow-lg shadow-primary/20">
                        Browse Files
                      </Button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {uploadMutation.isError && (
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                  className="mt-4 p-4 bg-destructive/10 border border-destructive/20 rounded-xl flex items-center gap-3 text-destructive"
                >
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <p className="text-sm">{uploadMutation.error instanceof Error ? uploadMutation.error.message : "Analysis failed."}</p>
                </motion.div>
              )}
            </TabsContent>

            <TabsContent value="record">
              <div className="bg-card border-2 border-border/60 rounded-2xl p-10 min-h-[360px] flex items-center justify-center">
                <AudioRecorder onRecordingComplete={handleRecordingComplete} isProcessing={uploadMutation.isPending} />
              </div>
            </TabsContent>
          </Tabs>
        </motion.div>

        {/* Feature grid */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="mt-5 grid grid-cols-2 md:grid-cols-4 gap-3 w-full max-w-2xl"
        >
          {FEATURES.map(({ icon: Icon, color, bg, title, desc }) => (
            <div key={title} className="bg-card border border-border/60 rounded-xl p-4 flex flex-col gap-2.5">
              <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", bg)}>
                <Icon className={cn("w-4 h-4", color)} />
              </div>
              <div>
                <p className="text-xs font-semibold leading-tight">{title}</p>
                <p className="text-[11px] text-muted-foreground leading-snug mt-0.5">{desc}</p>
              </div>
            </div>
          ))}
        </motion.div>
      </div>
    </div>
  );
}

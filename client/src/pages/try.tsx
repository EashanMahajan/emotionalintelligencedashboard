import { useState, useCallback } from "react";
import { useLocation } from "wouter";
import { useUploadJob } from "@/hooks/use-jobs";
import { useDropzone } from "react-dropzone";
import { UploadCloud, FileAudio, AlertCircle, Loader2, BarChart2, Sparkles, Lock } from "lucide-react";
import { ResonanceLogo } from "@/components/ResonanceLogo";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { canUseTrial, getRemainingTrials, incrementTrialUsage } from "@/lib/trial-tracker";

export default function TryPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const uploadMutation = useUploadJob();
  const [isDragActive, setIsDragActive] = useState(false);
  
  const remaining = getRemainingTrials();
  const canUpload = canUseTrial();

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;
    
    if (!canUpload) {
      toast({
        variant: "destructive",
        title: "Trial Limit Reached",
        description: "Sign up for unlimited analyses!",
      });
      return;
    }
    
    const file = acceptedFiles[0];
    try {
      toast({
        title: "Analysis Started",
        description: "Uploading and processing your audio…",
      });
      const result = await uploadMutation.mutateAsync(file);
      incrementTrialUsage(result.id);
      toast({
        title: "Analysis Complete",
        description: "Your audio has been fully analysed.",
      });
      setLocation(`/try/results/${result.id}`);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Analysis Failed",
        description: error instanceof Error ? error.message : "Something went wrong",
      });
    }
  }, [uploadMutation, setLocation, toast, canUpload]);

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
    maxSize: 50 * 1024 * 1024,
    multiple: false,
    disabled: !canUpload || uploadMutation.isPending,
  });

  return (
    <div className="h-screen overflow-hidden bg-background relative flex flex-col">
      {/* Decorative Background */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-[20%] -right-[10%] w-[50%] h-[50%] bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute top-[40%] -left-[10%] w-[40%] h-[40%] bg-accent/5 rounded-full blur-3xl" />
      </div>

      {/* Navigation */}
      <nav className="relative z-10 border-b border-border/40 bg-background/80 backdrop-blur-md shrink-0">
        <div className="mx-auto max-w-6xl px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => setLocation("/")}>
            <div className="bg-primary/10 border border-primary/20 rounded-lg p-1.5">
              <ResonanceLogo className="w-4 h-4 text-primary" />
            </div>
            <span className="text-base font-semibold uppercase tracking-widest bg-gradient-to-r from-foreground to-foreground/60 bg-clip-text text-transparent">Resonance</span>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => setLocation("/signin")}>Sign In</Button>
            <Button size="sm" onClick={() => setLocation("/signup")}>Sign Up</Button>
          </div>
        </div>
      </nav>

      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 py-4 overflow-hidden">
        {/* Header with Trial Info */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-5 max-w-2xl"
        >
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-3.5 py-1 rounded-full text-xs font-semibold tracking-wide mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Try Resonance Free</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-2">
            Try Before You Sign Up
          </h1>
          <p className="text-muted-foreground leading-relaxed mb-3">
            Upload up to 3 audio files to experience conversation intelligence.
          </p>
          <div className="inline-flex items-center gap-2 bg-muted px-5 py-2 rounded-full">
            <span className="text-sm font-medium">
              {remaining} {remaining === 1 ? 'upload' : 'uploads'} remaining
            </span>
          </div>
        </motion.div>

        {/* Upload Card */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.15, duration: 0.4 }}
          className="w-full max-w-xl"
        >
          {canUpload ? (
            <div
              {...getRootProps()}
              className={cn(
                "relative group cursor-pointer",
                "bg-card border-2 border-dashed rounded-2xl p-10 md:p-16",
                "flex flex-col items-center justify-center text-center",
                "transition-all duration-300 ease-in-out",
                "hover:border-primary/50 hover:shadow-xl hover:shadow-primary/5",
                isDragActive ? "border-primary bg-primary/5 scale-[1.02]" : "border-border/60",
                uploadMutation.isPending && "pointer-events-none opacity-80"
              )}
            >
              <input {...getInputProps()} />
              
              <AnimatePresence mode="wait">
                {uploadMutation.isPending ? (
                  <motion.div
                    key="loading"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex flex-col items-center"
                  >
                    <div className="relative mb-6">
                      <div className="absolute inset-0 bg-primary/30 blur-xl rounded-full animate-pulse" />
                      <Loader2 className="w-16 h-16 text-primary animate-spin relative" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2">Processing Audio...</h3>
                    <p className="text-muted-foreground">This may take a moment</p>
                  </motion.div>
                ) : (
                  <motion.div
                    key="idle"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex flex-col items-center"
                  >
                    <div className="bg-muted rounded-full p-6 mb-6 group-hover:bg-primary/10 group-hover:scale-110 transition-all duration-300">
                      <UploadCloud className="w-10 h-10 text-muted-foreground group-hover:text-primary transition-colors" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2">
                      {isDragActive ? "Drop audio file here" : "Drag & drop audio file"}
                    </h3>
                    <p className="text-muted-foreground mb-8 max-w-xs">
                      Supports MP3, WAV, M4A, MP4 up to 50MB.
                    </p>
                    <Button size="lg" className="rounded-full px-8 shadow-lg shadow-primary/20">
                      Browse Files
                    </Button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <div className="bg-card border-2 border-border rounded-2xl p-10 md:p-16 text-center">
              <div className="bg-muted rounded-full p-6 mb-6 inline-flex">
                <Lock className="w-10 h-10 text-muted-foreground" />
              </div>
              <h3 className="text-2xl font-semibold mb-4">Trial Limit Reached</h3>
              <p className="text-muted-foreground mb-8 max-w-md mx-auto">
                You've used all 3 trial uploads. Create a free account to unlock unlimited analyses and access all features.
              </p>
              <Button 
                size="lg" 
                onClick={() => setLocation("/signup")}
                className="rounded-full px-8 shadow-lg shadow-primary/20"
              >
                Create Free Account
              </Button>
            </div>
          )}

          {uploadMutation.isError && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6 p-4 bg-destructive/10 border border-destructive/20 rounded-xl flex items-center gap-3 text-destructive"
            >
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <p className="text-sm font-medium">
                {uploadMutation.error instanceof Error ? uploadMutation.error.message : "Analysis failed. Please try again."}
              </p>
            </motion.div>
          )}
        </motion.div>

        {/* Feature Preview */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-4 text-center text-sm text-muted-foreground"
        >
          <div className="flex flex-wrap justify-center gap-5">
            <div className="flex items-center gap-1.5">
              <FileAudio className="w-3.5 h-3.5" />
              <span>Full Transcripts</span>
            </div>
            <div className="flex items-center gap-1.5">
              <BarChart2 className="w-3.5 h-3.5" />
              <span>Speaker Stats</span>
            </div>
            <div className="flex items-center gap-1.5 opacity-50">
              <Lock className="w-3.5 h-3.5" />
              <span>Advanced Insights (Account Required)</span>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

import { useState, useRef } from "react";
import { useLocation } from "wouter";
import { useUploadAnalysis } from "@/hooks/use-analysis";
import { LayoutShell } from "@/components/layout-shell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Upload, FileAudio, Music, X } from "lucide-react";
import { clsx } from "clsx";

export default function UploadPage() {
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [, setLocation] = useLocation();
  
  const uploadMutation = useUploadAnalysis();

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const validateAndSetFile = (file: File) => {
    // Basic validation
    const validTypes = ['audio/mpeg', 'audio/wav', 'audio/x-m4a', 'audio/mp4'];
    // For demo purposes, accepting more types or just checking extension might be easier
    setFile(file);
  };

  const handleSubmit = async () => {
    if (!file) return;
    try {
      const result = await uploadMutation.mutateAsync(file);
      setLocation(`/results/${result.jobId}`);
    } catch (err) {
      // Error handled by mutation hook
    }
  };

  return (
    <LayoutShell>
      <div className="max-w-2xl mx-auto py-12">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold tracking-tight mb-4 bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent">
            New Analysis
          </h1>
          <p className="text-muted-foreground text-lg">
            Upload a conversation recording to get emotional intelligence insights.
          </p>
        </div>

        <Card className="p-8 bg-white dark:bg-slate-900 shadow-xl shadow-slate-200/50 dark:shadow-none border-border">
          <div 
            className={clsx(
              "relative border-2 border-dashed rounded-2xl p-12 text-center transition-all duration-200 ease-in-out cursor-pointer",
              dragActive 
                ? "border-primary bg-primary/5 scale-[1.02]" 
                : "border-slate-200 dark:border-slate-800 hover:border-primary/50 hover:bg-slate-50 dark:hover:bg-slate-800/50",
              file ? "border-green-500/50 bg-green-50/50" : ""
            )}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => !file && inputRef.current?.click()}
          >
            <input
              ref={inputRef}
              type="file"
              className="hidden"
              accept="audio/*"
              onChange={handleChange}
            />

            {!file ? (
              <div className="space-y-4">
                <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto text-primary mb-6">
                  <Upload className="w-10 h-10" />
                </div>
                <h3 className="text-xl font-semibold">Drag & drop or click to upload</h3>
                <p className="text-sm text-muted-foreground">
                  Supports MP3, WAV, M4A (Max 50MB)
                </p>
              </div>
            ) : (
              <div className="flex flex-col items-center animate-in fade-in zoom-in duration-300">
                <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-2xl flex items-center justify-center text-green-600 dark:text-green-400 mb-4 shadow-sm">
                  <FileAudio className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-semibold mb-1">{file.name}</h3>
                <p className="text-xs text-muted-foreground mb-6">
                  {(file.size / (1024 * 1024)).toFixed(2)} MB
                </p>
                
                <div className="flex gap-3">
                  <Button 
                    variant="ghost" 
                    size="sm"
                    className="text-muted-foreground hover:text-foreground"
                    onClick={(e) => {
                      e.stopPropagation();
                      setFile(null);
                    }}
                  >
                    <X className="w-4 h-4 mr-2" />
                    Remove
                  </Button>
                </div>
              </div>
            )}
          </div>

          <div className="mt-8 flex justify-end">
            <Button 
              size="lg" 
              className="px-8 font-semibold shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 transition-all"
              disabled={!file || uploadMutation.isPending}
              onClick={handleSubmit}
            >
              {uploadMutation.isPending ? "Uploading..." : "Start Analysis"}
            </Button>
          </div>
        </Card>

        {/* Example Files Section */}
        <div className="mt-12">
          <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">Or try a sample</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl border border-border bg-slate-50 dark:bg-slate-900 hover:border-primary/50 transition-colors cursor-pointer group">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-orange-100 dark:bg-orange-900/20 flex items-center justify-center text-orange-600">
                  <Music className="w-5 h-5" />
                </div>
                <div>
                  <h5 className="font-medium group-hover:text-primary transition-colors">Customer Support Call</h5>
                  <p className="text-xs text-muted-foreground">Conflict resolution scenario</p>
                </div>
              </div>
            </div>
            <div className="p-4 rounded-xl border border-border bg-slate-50 dark:bg-slate-900 hover:border-primary/50 transition-colors cursor-pointer group">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center text-blue-600">
                  <Music className="w-5 h-5" />
                </div>
                <div>
                  <h5 className="font-medium group-hover:text-primary transition-colors">Sales Discovery</h5>
                  <p className="text-xs text-muted-foreground">High engagement example</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </LayoutShell>
  );
}

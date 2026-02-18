import { useLocation } from "wouter";
import { useJobs } from "@/hooks/use-jobs";
import { format } from "date-fns";
import { ChevronRight, FileAudio, Clock, BarChart2, Loader2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

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
    <div className="min-h-screen bg-background container mx-auto px-4 py-8 max-w-4xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Analysis History</h1>
          <p className="text-muted-foreground mt-1">Review past conversation insights</p>
        </div>
        <Button onClick={() => setLocation("/upload")}>
          <Plus className="w-4 h-4 mr-2" />
          New Analysis
        </Button>
      </div>

      <div className="space-y-4">
        {jobs?.length === 0 && (
          <div className="text-center py-20 bg-muted/20 rounded-2xl border border-dashed border-border">
            <div className="bg-muted rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-4">
              <FileAudio className="w-6 h-6 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium">No analyses yet</h3>
            <p className="text-muted-foreground mb-6">Upload your first audio file to get started.</p>
            <Button onClick={() => setLocation("/upload")}>Upload Audio</Button>
          </div>
        )}

        {jobs?.map((job, index) => (
          <motion.div
            key={job.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            onClick={() => setLocation(`/results/${job.id}`)}
            className="group relative bg-card border border-border rounded-xl p-5 hover:border-primary/50 hover:shadow-lg transition-all duration-300 cursor-pointer overflow-hidden"
          >
            {/* Hover Gradient Effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

            <div className="flex items-center justify-between relative z-10">
              <div className="flex items-start gap-4">
                <div className={cn(
                  "p-3 rounded-lg",
                  job.status === "completed" ? "bg-emerald-500/10 text-emerald-600" :
                  job.status === "failed" ? "bg-rose-500/10 text-rose-600" :
                  "bg-amber-500/10 text-amber-600"
                )}>
                  {job.status === "completed" ? <BarChart2 className="w-6 h-6" /> :
                   job.status === "failed" ? <FileAudio className="w-6 h-6" /> :
                   <Loader2 className="w-6 h-6 animate-spin" />}
                </div>
                <div>
                  <h3 className="font-semibold text-lg group-hover:text-primary transition-colors">
                    {job.filename}
                  </h3>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                    <span className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5" />
                      {job.createdAt ? format(new Date(job.createdAt), "MMM d, yyyy • h:mm a") : "Unknown date"}
                    </span>
                    <span className={cn(
                      "capitalize px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wider",
                      job.status === "completed" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" :
                      job.status === "failed" ? "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400" :
                      "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                    )}>
                      {job.status}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="bg-muted p-2 rounded-full group-hover:bg-primary group-hover:text-primary-foreground transition-all">
                <ChevronRight className="w-5 h-5" />
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

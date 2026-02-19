import { useLocation } from "wouter";
import { useJobs } from "@/hooks/use-jobs";
import { format } from "date-fns";
import {
  BarChart2,
  UploadCloud,
  FileAudio,
  Loader2,
  ChevronRight,
  FolderOpen,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

export default function DashboardOverview() {
  const [, setLocation] = useLocation();
  const { data: jobs, isLoading } = useJobs();

  const uploadCount = jobs?.length ?? 0;
  const latestJob = jobs?.[0];

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Overview of your conversation analyses
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="bg-card border border-border rounded-xl p-6"
        >
          <div className="flex items-center gap-4">
            <div className="bg-primary/10 rounded-full p-4">
              <FolderOpen className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{uploadCount}</p>
              <p className="text-sm text-muted-foreground">Total uploads</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.05 }}
          className="bg-card border border-border rounded-xl p-6"
        >
          <div className="flex items-center gap-4">
            <div className="bg-emerald-500/10 rounded-full p-4">
              <BarChart2 className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">
                {jobs?.filter((j) => j.status === "completed").length ?? 0}
              </p>
              <p className="text-sm text-muted-foreground">Completed analyses</p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Most Recent Upload */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Most recent upload</h2>
        {latestJob ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            onClick={() => setLocation(`/results/${latestJob.id}`)}
            className="group bg-card border border-border rounded-xl p-5 hover:border-primary/50 hover:shadow-lg transition-all duration-300 cursor-pointer"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-start gap-4">
                <div
                  className={`p-3 rounded-lg ${
                    latestJob.status === "completed"
                      ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                      : latestJob.status === "failed"
                        ? "bg-rose-500/10 text-rose-600 dark:text-rose-400"
                        : "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                  }`}
                >
                  {latestJob.status === "completed" ? (
                    <BarChart2 className="w-6 h-6" />
                  ) : latestJob.status === "failed" ? (
                    <FileAudio className="w-6 h-6" />
                  ) : (
                    <Loader2 className="w-6 h-6 animate-spin" />
                  )}
                </div>
                <div>
                  <h3 className="font-semibold text-lg group-hover:text-primary transition-colors">
                    {latestJob.filename}
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {latestJob.createdAt
                      ? format(new Date(latestJob.createdAt), "MMM d, yyyy • h:mm a")
                      : "Unknown date"}
                  </p>
                  <span
                    className={`inline-block mt-2 capitalize px-2 py-0.5 rounded-full text-xs font-medium ${
                      latestJob.status === "completed"
                        ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                        : latestJob.status === "failed"
                          ? "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400"
                          : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                    }`}
                  >
                    {latestJob.status}
                  </span>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
            </div>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            className="text-center py-16 bg-muted/20 rounded-2xl border border-dashed border-border"
          >
            <div className="bg-muted rounded-full w-14 h-14 flex items-center justify-center mx-auto mb-4">
              <FileAudio className="w-7 h-7 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium mb-2">No uploads yet</h3>
            <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
              Upload your first audio or video file to start analyzing conversations for emotional intelligence insights.
            </p>
            <Button onClick={() => setLocation("/upload")} size="lg">
              <UploadCloud className="w-4 h-4 mr-2" />
              Upload File
            </Button>
          </motion.div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="mt-8 flex flex-wrap gap-3">
        <Button variant="outline" onClick={() => setLocation("/upload")}>
          <UploadCloud className="w-4 h-4 mr-2" />
          New Analysis
        </Button>
        {uploadCount > 0 && (
          <Button variant="outline" onClick={() => setLocation("/history")}>
            View All ({uploadCount})
          </Button>
        )}
      </div>
    </div>
  );
}

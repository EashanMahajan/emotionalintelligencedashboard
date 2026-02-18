import { useAnalysisJobs } from "@/hooks/use-analysis";
import { LayoutShell } from "@/components/layout-shell";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Loader2, Calendar, ArrowRight, FileText } from "lucide-react";

export default function HistoryPage() {
  const { data: jobs, isLoading } = useAnalysisJobs();

  return (
    <LayoutShell>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Analysis History</h1>
          <p className="text-muted-foreground">Review your past conversation insights.</p>
        </div>
        <Link href="/upload">
          <Button>New Analysis</Button>
        </Link>
      </div>

      {isLoading ? (
        <div className="flex justify-center p-12">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="grid gap-4">
          {jobs?.length === 0 ? (
            <div className="text-center py-20 border-2 border-dashed rounded-2xl">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FileText className="w-8 h-8 text-slate-400" />
              </div>
              <h3 className="text-lg font-medium">No analyses yet</h3>
              <p className="text-muted-foreground mb-4">Upload your first audio file to get started.</p>
              <Link href="/upload">
                <Button>Start Analysis</Button>
              </Link>
            </div>
          ) : (
            jobs?.map((job) => (
              <Link key={job.id} href={`/results/${job.id}`}>
                <Card className="p-4 hover:shadow-md transition-all cursor-pointer group border-transparent hover:border-primary/20 bg-white dark:bg-slate-900">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary group-hover:scale-105 transition-transform">
                        <FileText className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg group-hover:text-primary transition-colors">
                          {job.filename}
                        </h3>
                        <div className="flex items-center gap-3 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {new Date(job.createdAt!).toLocaleDateString()}
                          </span>
                          <span>•</span>
                          <span className="uppercase text-xs font-bold tracking-wider">
                            ID: #{job.id.toString().padStart(4, '0')}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      <Badge variant={job.status === 'completed' ? 'default' : 'secondary'} className="capitalize">
                        {job.status}
                      </Badge>
                      <ArrowRight className="w-5 h-5 text-slate-300 group-hover:text-primary transition-colors" />
                    </div>
                  </div>
                </Card>
              </Link>
            ))
          )}
        </div>
      )}
    </LayoutShell>
  );
}

import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, RefreshCw, AlertCircle, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { AnalysisResult } from "@shared/schema";

export type AISummaryState = "idle" | "loading" | "done" | "error";

interface Props {
  context: AnalysisResult;
  state: AISummaryState;
  report: string;
  errorMsg: string;
  onGenerate: () => void;
}

export function AISummaryTab({ state, report, errorMsg, onGenerate }: Props) {

  return (
    <div className="space-y-4">
      {/* Idle / Error prompt */}
      {(state === "idle" || state === "error") && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center justify-center py-16 text-center gap-5"
        >
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
            <Sparkles className="w-7 h-7 text-primary" />
          </div>
          <div className="space-y-1.5 max-w-sm">
            <h3 className="font-bold text-lg">AI Report</h3>
            <p className="text-sm text-muted-foreground">
              Gemini will read the full transcript, detect the content type, and generate
              the most useful structured document — meeting notes, interview summary,
              study notes, and more.
            </p>
          </div>
          {state === "error" && (
            <div className="flex items-start gap-2 rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive max-w-sm w-full text-left">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}
          <Button onClick={onGenerate} size="lg" className="gap-2">
            <Sparkles className="w-4 h-4" />
            {state === "error" ? "Try Again" : "Generate Report"}
          </Button>
        </motion.div>
      )}

      {/* Loading skeleton */}
      {state === "loading" && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-6 py-6"
        >
          {/* Animated header */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-primary/15 flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-4 h-4 text-primary animate-pulse" />
            </div>
            <div className="space-y-1.5 flex-1">
              <div className="h-2 w-32 bg-muted rounded-full animate-pulse" />
              <div className="h-1.5 w-48 bg-muted/60 rounded-full animate-pulse" />
            </div>
          </div>
          {/* Skeleton lines */}
          {[100, 90, 75, 95, 60, 85, 70, 80, 55, 88].map((w, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.06 }}
              className="h-2 rounded-full bg-muted animate-pulse"
              style={{ width: `${w}%` }}
            />
          ))}
          <p className="text-xs text-muted-foreground text-center pt-2">
            Gemini is analysing your transcript…
          </p>
        </motion.div>
      )}

      {/* Result */}
      <AnimatePresence>
        {state === "done" && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-4"
          >
            {/* Toolbar */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
                  <FileText className="w-3.5 h-3.5 text-primary" />
                </div>
                <span className="font-semibold text-sm">Generated Report</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 text-xs h-7"
                onClick={onGenerate}
              >
                <RefreshCw className="w-3 h-3" />
                Regenerate
              </Button>
            </div>

            {/* Report content */}
            <div className="rounded-xl border border-border/60 bg-muted/20 px-6 py-5">
              <div className="prose prose-sm max-w-none dark:prose-invert
                prose-headings:font-bold prose-headings:tracking-tight
                prose-h1:text-base prose-h2:text-sm prose-h3:text-sm
                prose-p:text-sm prose-p:leading-relaxed prose-p:text-foreground
                prose-li:text-sm prose-li:text-foreground
                prose-strong:text-foreground prose-strong:font-semibold
                prose-em:text-muted-foreground
                prose-ul:list-disc prose-ol:list-decimal
                prose-code:bg-muted prose-code:rounded prose-code:px-1 prose-code:py-0.5 prose-code:text-xs
                prose-blockquote:border-l-primary/40 prose-blockquote:text-muted-foreground
                prose-hr:border-border/50
              ">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    // Tables get horizontal scroll on small screens
                    table: ({ children }) => (
                      <div className="overflow-x-auto">
                        <table className="w-full text-xs border-collapse">{children}</table>
                      </div>
                    ),
                    th: ({ children }) => (
                      <th className="border border-border/50 px-2 py-1 bg-muted/50 font-semibold text-left">{children}</th>
                    ),
                    td: ({ children }) => (
                      <td className="border border-border/50 px-2 py-1">{children}</td>
                    ),
                  }}
                >
                  {report}
                </ReactMarkdown>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

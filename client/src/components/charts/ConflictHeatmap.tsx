import { useMemo } from "react";
import { motion } from "framer-motion";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

type UtteranceLike = {
  start_ms: number;
  end_ms: number;
  text: string;
  sentiment_score: number;
};

export interface ConflictHeatmapProps {
  utterances: UtteranceLike[];
  binSizeMs?: number;
  onBinClick?: (timestampMs: number) => void;
}

const POSITIVE_CUE_WORDS = [
  "great",
  "good",
  "awesome",
  "love",
  "happy",
  "excited",
  "thanks",
  "thank you",
  "appreciate",
  "perfect",
  "amazing",
  "fantastic",
  "glad",
  "nice",
  "ok",
  "okay",
  "sure",
  "sounds good",
  "no problem",
  "all good",
];

const NEGATIVE_CUE_WORDS = [
  "frustrated",
  "angry",
  "upset",
  "annoyed",
  "hate",
  "terrible",
  "awful",
  "bad",
  "worst",
  "problem",
  "issue",
  "unacceptable",
  "ridiculous",
  "stupid",
  "can't",
  "cannot",
  "won't",
  "never",
  "not possible",
];

function includesAny(text: string, phrases: string[]) {
  const t = text.toLowerCase();
  return phrases.some((p) => t.includes(p));
}

function toDisplayTime(timestampMs: number) {
  // We treat timestamps as offsets, but date-fns format expects a Date.
  return format(new Date(timestampMs), "mm:ss");
}

export function ConflictHeatmap({
  utterances,
  binSizeMs = 5000,
  onBinClick,
}: ConflictHeatmapProps) {
  const bins = useMemo(() => {
    if (!utterances?.length) return [];

    const maxEnd = Math.max(...utterances.map((u) => u.end_ms ?? u.start_ms ?? 0));
    const binCount = Math.max(1, Math.ceil(maxEnd / binSizeMs));

    // Each bin tracks maximum divergence intensity and a representative timestamp to jump to.
    const acc = Array.from({ length: binCount }, (_, i) => ({
      idx: i,
      startMs: i * binSizeMs,
      endMs: (i + 1) * binSizeMs,
      intensity: 0,
      timestampMs: i * binSizeMs,
      examples: [] as string[],
    }));

    for (const u of utterances) {
      const start = Math.max(0, u.start_ms ?? 0);
      const score = typeof u.sentiment_score === "number" ? u.sentiment_score : 0;
      const text = u.text ?? "";

      // Divergence: words suggest positive but tone is negative, OR words suggest negative but tone is positive.
      const positiveWords = includesAny(text, POSITIVE_CUE_WORDS);
      const negativeWords = includesAny(text, NEGATIVE_CUE_WORDS);
      const positiveTone = score >= 0.2;
      const negativeTone = score <= -0.2;

      const diverges =
        (positiveWords && negativeTone) ||
        (negativeWords && positiveTone);

      if (!diverges) continue;

      const binIdx = Math.min(binCount - 1, Math.floor(start / binSizeMs));
      const intensity = Math.min(1, Math.abs(score)); // 0..1

      if (intensity > acc[binIdx].intensity) {
        acc[binIdx].intensity = intensity;
        acc[binIdx].timestampMs = start;
      }

      if (acc[binIdx].examples.length < 2 && text.trim()) {
        acc[binIdx].examples.push(text.trim());
      }
    }

    return acc;
  }, [utterances, binSizeMs]);

  const hasAny = bins.some((b) => b.intensity > 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.05 }}
      className="w-full bg-background rounded-xl p-4 border border-border/50 shadow-sm"
    >
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">
            Conflict Heatmap (Tone–Words Divergence)
          </h3>
          <p className="text-xs text-muted-foreground mt-1">
            Flags moments where the words sound positive but tone is negative (or vice‑versa).
          </p>
        </div>
        <div className="text-xs text-muted-foreground">
          Bin: {Math.round(binSizeMs / 1000)}s
        </div>
      </div>

      {!hasAny ? (
        <div className="text-sm text-muted-foreground bg-muted/30 border border-dashed border-border rounded-lg p-4">
          No strong tone–words divergence detected.
        </div>
      ) : (
        <TooltipProvider>
          <div className="flex w-full gap-0.5 h-10">
            {bins.map((b) => {
              const alpha = b.intensity; // 0..1
              const clickable = b.intensity > 0;
              return (
                <Tooltip key={b.idx}>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      onClick={() => clickable && onBinClick?.(b.timestampMs)}
                      className={cn(
                        "flex-1 rounded-sm transition-transform",
                        clickable ? "cursor-pointer hover:scale-y-[1.05]" : "cursor-default",
                        "focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      )}
                      style={{
                        backgroundColor: `rgba(244, 63, 94, ${0.12 + alpha * 0.55})`, // rose-ish
                      }}
                      aria-label={`Heatmap bin ${toDisplayTime(b.startMs)} intensity ${Math.round(
                        b.intensity * 100
                      )}%`}
                    />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <div className="text-xs">
                      <div className="font-medium">
                        {toDisplayTime(b.startMs)} – {toDisplayTime(b.endMs)}
                      </div>
                      <div className="text-muted-foreground mt-1">
                        Divergence intensity: {Math.round(b.intensity * 100)}%
                      </div>
                      {b.examples.length > 0 && (
                        <div className="mt-2 space-y-1">
                          {b.examples.map((ex, i) => (
                            <div key={i} className="line-clamp-2">
                              “{ex}”
                            </div>
                          ))}
                        </div>
                      )}
                      {b.intensity > 0 && (
                        <div className="mt-2 text-muted-foreground">
                          Click to jump to this moment.
                        </div>
                      )}
                    </div>
                  </TooltipContent>
                </Tooltip>
              );
            })}
          </div>
        </TooltipProvider>
      )}
    </motion.div>
  );
}


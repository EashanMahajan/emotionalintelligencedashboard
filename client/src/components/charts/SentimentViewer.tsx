import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { SentimentChart } from "@/components/charts/SentimentChart";
import { SentimentDerivativeChart } from "@/components/charts/SentimentDerivativeChart";
import { SentimentIntegralChart } from "@/components/charts/SentimentIntegralChart";
import { ChevronLeft, ChevronRight, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Utterance } from "@shared/schema";

const SPEAKER_PALETTE = [
  "bg-blue-500/15 text-blue-400 border-blue-500/30 data-[active=true]:bg-blue-500 data-[active=true]:text-white data-[active=true]:border-blue-500",
  "bg-violet-500/15 text-violet-400 border-violet-500/30 data-[active=true]:bg-violet-500 data-[active=true]:text-white data-[active=true]:border-violet-500",
  "bg-emerald-500/15 text-emerald-400 border-emerald-500/30 data-[active=true]:bg-emerald-500 data-[active=true]:text-white data-[active=true]:border-emerald-500",
  "bg-amber-500/15 text-amber-400 border-amber-500/30 data-[active=true]:bg-amber-500 data-[active=true]:text-white data-[active=true]:border-amber-500",
  "bg-rose-500/15 text-rose-400 border-rose-500/30 data-[active=true]:bg-rose-500 data-[active=true]:text-white data-[active=true]:border-rose-500",
];

type View = "trend" | "momentum" | "accumulation";

const VIEWS: Array<{ id: View; label: string; description: string }> = [
  {
    id: "trend",
    label: "Trend",
    description:
      "Shows the sentiment score over time. Upward movement indicates a more positive tone; downward movement indicates a more negative tone. Click points to jump the transcript.",
  },
  {
    id: "momentum",
    label: "Momentum",
    description:
      "Shows how fast sentiment is changing. Sharp drops often mark escalation; sharp rises often mark repair or resolution. Click points to jump the transcript.",
  },
  {
    id: "accumulation",
    label: "Accumulation",
    description:
      "Shows the running total of sentiment over time. If it trends down, negative moments dominate overall; if it trends up, positive moments dominate overall. Click points to jump the transcript.",
  },
];

interface SentimentViewerProps {
  data: { timestamp: number; score: number }[];
  onPointClick?: (timestamp: number) => void;
  utterances?: Utterance[];
}

export function SentimentViewer({ data, onPointClick, utterances = [] }: SentimentViewerProps) {
  const [view, setView] = useState<View>("trend");
  const [activeSpeaker, setActiveSpeaker] = useState<string>("combined");

  // Derive unique speakers and per-speaker sentiment series
  const speakers = useMemo(
    () => [...new Set(utterances.map((u) => u.speaker_id))].sort(),
    [utterances]
  );

  const speakerSeriesMap = useMemo(() => {
    const map = new Map<string, { timestamp: number; score: number }[]>();
    for (const id of speakers) {
      map.set(
        id,
        utterances
          .filter((u) => u.speaker_id === id)
          .map((u) => ({ timestamp: u.start_ms, score: u.sentiment_score }))
          .sort((a, b) => a.timestamp - b.timestamp)
      );
    }
    return map;
  }, [utterances, speakers]);

  const activeData = useMemo(
    () =>
      activeSpeaker === "combined"
        ? data
        : (speakerSeriesMap.get(activeSpeaker) ?? data),
    [activeSpeaker, data, speakerSeriesMap]
  );

  const showSpeakerTabs = speakers.length >= 2;

  const viewIndex = useMemo(() => VIEWS.findIndex((v) => v.id === view), [view]);
  const activeMeta = useMemo(() => VIEWS[Math.max(0, viewIndex)] ?? VIEWS[0], [viewIndex]);

  const summaries = useMemo(() => {
    if (!activeData.length) {
      const text =
        "No sentiment data is available for this conversation. Once data is present, this view will summarize where the tone changes and where it stays stable.";
      return {
        trend: text,
        momentum: text,
        accumulation: text,
      } as Record<View, string>;
    }

    const sorted = [...activeData].sort((a, b) => a.timestamp - b.timestamp);
    const first = sorted[0]!;
    const last = sorted[sorted.length - 1]!;

    let trendDeltaSum = 0;
    let trendDeltaCount = 0;
    for (let i = 1; i < sorted.length; i++) {
      trendDeltaSum += Math.abs(sorted[i]!.score - sorted[i - 1]!.score);
      trendDeltaCount += 1;
    }
    const avgTrendStep = trendDeltaCount ? trendDeltaSum / trendDeltaCount : 0;

    const describeLevel = (value: number) => {
      if (value >= 0.35) return "clearly positive";
      if (value >= 0.1) return "slightly positive";
      if (value <= -0.35) return "clearly negative";
      if (value <= -0.1) return "slightly negative";
      return "near neutral";
    };

    const trendSentenceA =
      "This trend line shows how the emotional tone moves over time, where rising sections are more positive and falling sections are more negative.";

    const direction = last.score - first.score;
    const directionText =
      Math.abs(direction) < 0.1
        ? `Overall sentiment stays fairly steady, starting ${describeLevel(first.score)} and ending ${describeLevel(
            last.score
          )}.`
        : `Sentiment shifts from ${describeLevel(first.score)} at the beginning to ${describeLevel(
            last.score
          )} by the end.`;

    const volatilityText =
      avgTrendStep < 0.06
        ? "Most of the line is flat or gently sloping, indicating long stretches with little emotional change and only small adjustments."
        : "There are several noticeable rises and drops, marking moments where the tone changes sharply between calmer and more intense segments.";

    const trendSummary = `${trendSentenceA} ${directionText} ${volatilityText}`;

    let momentumMaxUp = 0;
    let momentumMaxDown = 0;
    let momentumAbsSum = 0;
    let momentumCount = 0;

    for (let i = 1; i < sorted.length; i++) {
      const prev = sorted[i - 1]!;
      const curr = sorted[i]!;
      const dtMs = curr.timestamp - prev.timestamp;
      const dtS = dtMs > 0 ? dtMs / 1000 : 1;
      const dv = curr.score - prev.score;
      const rate = dv / dtS;
      momentumMaxUp = Math.max(momentumMaxUp, rate);
      momentumMaxDown = Math.min(momentumMaxDown, rate);
      momentumAbsSum += Math.abs(rate);
      momentumCount += 1;
    }

    const avgRate = momentumCount ? momentumAbsSum / momentumCount : 0;

    const momentumSentenceA =
      "This momentum view captures how quickly the emotion is changing, where spikes below zero show sudden drops and spikes above zero show quick recoveries.";

    const momentumChangeText =
      avgRate < 0.02
        ? "Here the line mostly hugs the center, meaning the conversation moves gradually with few abrupt emotional turns."
        : "You can see distinct peaks and valleys, indicating specific moments where the tone ramps up or down quickly compared with the surrounding calm sections.";

    const momentumSummary = `${momentumSentenceA} ${momentumChangeText}`;

    let acc = 0;
    let accMin = 0;
    let accMax = 0;

    for (let i = 1; i < sorted.length; i++) {
      const prev = sorted[i - 1]!;
      const curr = sorted[i]!;
      const dtMs = curr.timestamp - prev.timestamp;
      const dtS = dtMs > 0 ? dtMs / 1000 : 1;
      acc += curr.score * dtS;
      accMin = Math.min(accMin, acc);
      accMax = Math.max(accMax, acc);
    }

    const accumulationSentenceA =
      "This accumulation line shows the running balance of positive and negative moments across the whole conversation.";

    const netText =
      Math.abs(acc) < 5
        ? "The curve stays relatively flat overall, suggesting positives and negatives largely cancel out with long neutral stretches."
        : acc > 0
        ? "The curve trends upward, meaning positive moments build up over time and outweigh the negative ones."
        : "The curve trends downward, meaning negative moments accumulate and outweigh the positive ones.";

    const range = accMax - accMin;
    const stabilityText =
      range < 4
        ? "Most of the line moves gently, with only small bumps showing brief shifts before returning to a steady baseline."
        : "There are clear sections where the curve bends sharply, separated by flatter plateaus where the emotional tone holds steady.";

    const accumulationSummary = `${accumulationSentenceA} ${netText} ${stabilityText}`;

    return {
      trend: trendSummary,
      momentum: momentumSummary,
      accumulation: accumulationSummary,
    } as Record<View, string>;
  }, [activeData]);

  const goPrev = () => setView(VIEWS[(viewIndex - 1 + VIEWS.length) % VIEWS.length]!.id);
  const goNext = () => setView(VIEWS[(viewIndex + 1) % VIEWS.length]!.id);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" onClick={goPrev} aria-label="Previous sentiment view">
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <div className="flex items-center gap-1 rounded-lg border border-border/50 bg-background p-1">
            {VIEWS.map((v) => (
              <Button
                key={v.id}
                variant={v.id === view ? "default" : "ghost"}
                size="sm"
                className="h-8 px-3"
                onClick={() => setView(v.id)}
              >
                {v.label}
              </Button>
            ))}
          </div>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" onClick={goNext} aria-label="Next sentiment view">
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Speaker selector — only when 2+ speakers */}
      {showSpeakerTabs && (
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            data-active={activeSpeaker === "combined"}
            onClick={() => setActiveSpeaker("combined")}
            className={cn(
              "text-xs font-semibold px-2.5 py-1 rounded-full border transition-colors",
              activeSpeaker === "combined"
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-muted/50 text-muted-foreground border-border hover:text-foreground"
            )}
          >
            Combined
          </button>
          {speakers.map((id, i) => (
            <button
              key={id}
              data-active={activeSpeaker === id}
              onClick={() => setActiveSpeaker(id)}
              className={cn(
                "text-xs font-semibold px-2.5 py-1 rounded-full border transition-colors",
                activeSpeaker === id
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-muted/50 text-muted-foreground border-border hover:text-foreground"
              )}
            >
              {id}
            </button>
          ))}
        </div>
      )}

      <div>
        {view === "trend" ? (
          <SentimentChart data={activeData} onPointClick={onPointClick} />
        ) : view === "momentum" ? (
          <SentimentDerivativeChart data={activeData} onPointClick={onPointClick} />
        ) : (
          <SentimentIntegralChart data={activeData} onPointClick={onPointClick} />
        )}
      </div>

      <div className="flex items-start gap-2 rounded-lg border border-border/60 bg-muted/60 px-3 py-2">
        <div className="mt-0.5">
          <Info className="w-4 h-4 text-muted-foreground" />
        </div>
        <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
          {summaries[activeMeta.id as View]}
        </p>
      </div>
    </div>
  );
}


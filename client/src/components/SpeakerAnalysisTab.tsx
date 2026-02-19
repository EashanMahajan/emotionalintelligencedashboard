import { useMemo } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  AreaChart, Area, ResponsiveContainer, Tooltip as ReTooltip,
  XAxis, YAxis, CartesianGrid, RadarChart, PolarGrid,
  PolarAngleAxis, Radar,
} from "recharts";
import type { Utterance, Insight, AnalysisResult } from "@shared/schema";

type SpeakerStats = AnalysisResult["speakerStats"][number];

interface Props {
  utterances: Utterance[];
  speakerStats: SpeakerStats[];
  insights: Insight[];
  onUtteranceClick?: (ms: number) => void;
}

const SPEAKER_COLORS = [
  { bg: "bg-blue-500/15", border: "border-blue-500/40", text: "text-blue-400", hex: "#60a5fa", area: "#3b82f6" },
  { bg: "bg-violet-500/15", border: "border-violet-500/40", text: "text-violet-400", hex: "#a78bfa", area: "#8b5cf6" },
  { bg: "bg-emerald-500/15", border: "border-emerald-500/40", text: "text-emerald-400", hex: "#34d399", area: "#10b981" },
  { bg: "bg-amber-500/15", border: "border-amber-500/40", text: "text-amber-400", hex: "#fbbf24", area: "#f59e0b" },
  { bg: "bg-rose-500/15", border: "border-rose-500/40", text: "text-rose-400", hex: "#fb7185", area: "#f43f5e" },
];

function fmt(ms: number): string {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return m > 0 ? `${m}m ${sec}s` : `${sec}s`;
}

function fmtTimestamp(ms: number): string {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
}

function stdDev(values: number[]): number {
  if (values.length < 2) return 0;
  const avg = values.reduce((a, b) => a + b, 0) / values.length;
  const sq = values.map((v) => Math.pow(v - avg, 2));
  return Math.sqrt(sq.reduce((a, b) => a + b, 0) / values.length);
}

function volatilityLabel(sd: number): { label: string; color: string; reason: string } {
  if (sd < 0.12) return { label: "Stable", color: "text-emerald-400", reason: `Sentiment std. deviation σ = ${sd.toFixed(3)} — very consistent emotional tone (threshold: σ < 0.12)` };
  if (sd < 0.22) return { label: "Moderate", color: "text-amber-400", reason: `Sentiment std. deviation σ = ${sd.toFixed(3)} — some emotional variation present (threshold: 0.12 ≤ σ < 0.22)` };
  return { label: "Volatile", color: "text-rose-400", reason: `Sentiment std. deviation σ = ${sd.toFixed(3)} — wide swings in emotional tone throughout the conversation (threshold: σ ≥ 0.22)` };
}

function sentimentLabel(score: number): { label: string; color: string; reason: string } {
  if (score >= 0.6) return { label: "Very Positive", color: "text-emerald-400", reason: `Average sentiment score: +${score.toFixed(3)} — consistently upbeat and positive tone (threshold: ≥ 0.60)` };
  if (score >= 0.35) return { label: "Positive", color: "text-green-400", reason: `Average sentiment score: +${score.toFixed(3)} — generally positive tone (threshold: 0.35 – 0.60)` };
  if (score >= -0.1) return { label: "Neutral", color: "text-slate-400", reason: `Average sentiment score: ${score.toFixed(3)} — largely neutral or balanced tone (threshold: −0.10 – 0.35)` };
  if (score >= -0.4) return { label: "Negative", color: "text-amber-400", reason: `Average sentiment score: ${score.toFixed(3)} — tends toward negative or critical language (threshold: −0.40 – −0.10)` };
  return { label: "Very Negative", color: "text-rose-400", reason: `Average sentiment score: ${score.toFixed(3)} — strongly negative tone throughout (threshold: < −0.40)` };
}

function deriveRole(data: {
  talkPct: number;
  turnPct: number;
  avgSentiment: number;
  volatility: number;
  questionPct: number;
  questionCount: number;
  uttCount: number;
}): { role: string; description: string; reason: string } {
  const { talkPct, avgSentiment, volatility, questionPct, questionCount, uttCount } = data;
  if (talkPct > 55) return {
    role: "Dominant Speaker",
    description: "Drives the majority of the conversation",
    reason: `Spoke ${talkPct.toFixed(1)}% of total talk time — more than half the conversation (threshold: > 55%)`,
  };
  if (questionPct > 0.35) return {
    role: "Active Questioner",
    description: "Frequently poses questions and seeks clarification",
    reason: `${questionCount} of ${uttCount} utterances were questions (${(questionPct * 100).toFixed(0)}% — threshold: > 35%)`,
  };
  if (avgSentiment >= 0.45 && volatility < 0.15) return {
    role: "Positive Anchor",
    description: "Consistently maintains a positive, stabilising tone",
    reason: `Average sentiment +${avgSentiment.toFixed(3)} with low volatility σ = ${volatility.toFixed(3)} — high positivity and stable tone (thresholds: sentiment ≥ 0.45, σ < 0.15)`,
  };
  if (avgSentiment <= -0.2 && volatility > 0.2) return {
    role: "Tension Source",
    description: "Associated with emotional friction in the conversation",
    reason: `Average sentiment ${avgSentiment.toFixed(3)} combined with high volatility σ = ${volatility.toFixed(3)} — negative and unpredictable (thresholds: sentiment ≤ −0.20, σ > 0.20)`,
  };
  if (volatility > 0.25) return {
    role: "Emotionally Variable",
    description: "Experiences wide swings in sentiment throughout the call",
    reason: `Sentiment std. deviation σ = ${volatility.toFixed(3)} — significant emotional swings detected (threshold: σ > 0.25)`,
  };
  if (talkPct < 25) return {
    role: "Active Listener",
    description: "Contributes concisely, letting others lead",
    reason: `Spoke only ${talkPct.toFixed(1)}% of total talk time — mostly listening and responding briefly (threshold: < 25%)`,
  };
  return {
    role: "Balanced Participant",
    description: "Engages consistently with a measured emotional tone",
    reason: `No single dominant trait: ${talkPct.toFixed(1)}% talk share, avg sentiment ${avgSentiment >= 0 ? "+" : ""}${avgSentiment.toFixed(3)}, volatility σ = ${volatility.toFixed(3)}`,
  };
}

function HintBadge({ children, reason, className }: { children: React.ReactNode; reason: string; className?: string }) {
  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className={`cursor-help ${className ?? ""}`}>{children}</span>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-[260px] text-xs leading-snug">
          {reason}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export function SpeakerAnalysisTab({ utterances, speakerStats, onUtteranceClick }: Props) {
  const totalTalkMs = useMemo(
    () => speakerStats.reduce((a, s) => a + s.total_talk_time_ms, 0),
    [speakerStats]
  );
  const totalTurns = useMemo(
    () => speakerStats.reduce((a, s) => a + s.turn_count, 0),
    [speakerStats]
  );

  const perSpeaker = useMemo(() => {
    return speakerStats.map((stat) => {
      const utts = utterances.filter((u) => u.speaker_id === stat.speaker_id);
      const scores = utts.map((u) => u.sentiment_score ?? 0);
      const confidences = utts.map((u) => u.confidence ?? 1);
      const words = utts.flatMap((u) => (u.text ?? "").split(" ").filter(Boolean));
      const questionCount = utts.filter((u) => (u.text ?? "").trimEnd().endsWith("?")).length;

      const positive = utts.filter((u) => (u.sentiment_score ?? 0) > 0.2).length;
      const negative = utts.filter((u) => (u.sentiment_score ?? 0) < -0.1).length;
      const neutral = utts.length - positive - negative;

      const sd = stdDev(scores);
      const avgConf = confidences.length > 0 ? confidences.reduce((a, b) => a + b, 0) / confidences.length : 0;
      const talkPct = totalTalkMs > 0 ? (stat.total_talk_time_ms / totalTalkMs) * 100 : 0;
      const turnPct = totalTurns > 0 ? (stat.turn_count / totalTurns) * 100 : 0;

      const sorted = [...utts].sort((a, b) => (b.sentiment_score ?? 0) - (a.sentiment_score ?? 0));
      const topPositive = sorted.slice(0, 3);
      const topNegative = sorted.slice(-3).reverse();

      const arc = utts
        .slice()
        .sort((a, b) => (a.start_ms ?? 0) - (b.start_ms ?? 0))
        .map((u, i) => ({ i, score: u.sentiment_score ?? 0, ms: u.start_ms ?? 0 }));

      const avgTurnDuration =
        stat.turn_count > 0 ? stat.total_talk_time_ms / stat.turn_count : 0;

      const role = deriveRole({
        talkPct,
        turnPct,
        avgSentiment: stat.avg_sentiment ?? 0,
        volatility: sd,
        questionPct: utts.length > 0 ? questionCount / utts.length : 0,
        questionCount,
        uttCount: utts.length,
      });

      return {
        stat,
        utts,
        scores,
        words,
        sd,
        avgConf,
        talkPct,
        turnPct,
        positive,
        negative,
        neutral,
        topPositive,
        topNegative,
        arc,
        avgTurnDuration,
        role,
      };
    });
  }, [speakerStats, utterances, totalTalkMs, totalTurns]);

  // Comparison radar data
  const radarData = useMemo(() => {
    const metrics = ["Talk Share", "Positivity", "Stability", "Engagement", "Confidence"];
    return metrics.map((m) => {
      const entry: Record<string, number | string> = { metric: m };
      perSpeaker.forEach((sp, idx) => {
        const key = `Speaker ${idx + 1}`;
        if (m === "Talk Share") entry[key] = Math.round(sp.talkPct);
        else if (m === "Positivity") {
          entry[key] = Math.round(((sp.stat.avg_sentiment ?? 0) + 1) * 50);
        } else if (m === "Stability") {
          entry[key] = Math.round(Math.max(0, 100 - sp.sd * 300));
        } else if (m === "Engagement") {
          entry[key] = Math.round(sp.turnPct);
        } else if (m === "Confidence") {
          entry[key] = Math.round(sp.avgConf * 100);
        }
      });
      return entry;
    });
  }, [perSpeaker]);

  const METRIC_DEFS: Record<string, { desc: string; raw: (sp: typeof perSpeaker[number]) => string }> = {
    "Talk Share": {
      desc: "Percentage of total talk time. 100 = spoke the entire conversation.",
      raw: (sp) => `${sp.talkPct.toFixed(1)}% of talk time`,
    },
    "Positivity": {
      desc: "Average sentiment mapped to 0–100. 50 = neutral, 100 = maximally positive, 0 = maximally negative.",
      raw: (sp) => `avg sentiment ${(sp.stat.avg_sentiment ?? 0) >= 0 ? "+" : ""}${(sp.stat.avg_sentiment ?? 0).toFixed(3)}`,
    },
    "Stability": {
      desc: "Emotional consistency. 100 = perfectly stable. Decreases as sentiment std. deviation rises. Score = max(0, 100 − σ × 300).",
      raw: (sp) => `σ = ${sp.sd.toFixed(3)}`,
    },
    "Engagement": {
      desc: "Percentage of total conversation turns taken. 100 = took every turn.",
      raw: (sp) => `${sp.turnPct.toFixed(1)}% of turns (${sp.stat.turn_count} turns)`,
    },
    "Confidence": {
      desc: "Average Deepgram transcription confidence for this speaker's utterances.",
      raw: (sp) => `${(sp.avgConf * 100).toFixed(0)}% avg confidence`,
    },
  };

  if (speakerStats.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground text-sm">
        No speaker data available
      </div>
    );
  }

  return (
    <div className="space-y-6 mt-4 pb-4">
      {/* Overview row */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="grid grid-cols-2 gap-3"
      >
        {perSpeaker.map((sp, idx) => {
          const c = SPEAKER_COLORS[idx % SPEAKER_COLORS.length];
          const sl = sentimentLabel(sp.stat.avg_sentiment ?? 0);
          return (
            <Card key={sp.stat.speaker_id} className={`border ${c.border} ${c.bg}`}>
              <CardContent className="pt-4 pb-3 px-4">
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-xs font-semibold uppercase tracking-wider ${c.text}`}>
                    Speaker {idx + 1}
                  </span>
                  <HintBadge reason={sp.role.reason}>
                    <Badge variant="outline" className={`text-[10px] ${c.text} border-current`}>
                      {sp.role.role}
                    </Badge>
                  </HintBadge>
                </div>
                <div className="flex items-end gap-3">
                  <span className="text-2xl font-bold text-foreground">{sp.talkPct.toFixed(0)}%</span>
                  <span className="text-xs text-muted-foreground mb-0.5">of conversation</span>
                </div>
                <HintBadge reason={sl.reason}>
                  <div className={`text-xs mt-0.5 ${sl.color}`}>{sl.label}</div>
                </HintBadge>
              </CardContent>
            </Card>
          );
        })}
      </motion.div>

      {/* Per-speaker deep-dive cards */}
      {perSpeaker.map((sp, idx) => {
        const c = SPEAKER_COLORS[idx % SPEAKER_COLORS.length];
        const vl = volatilityLabel(sp.sd);
        const sl = sentimentLabel(sp.stat.avg_sentiment ?? 0);
        const totalUtts = sp.utts.length;
        const posPct = totalUtts > 0 ? (sp.positive / totalUtts) * 100 : 0;
        const negPct = totalUtts > 0 ? (sp.negative / totalUtts) * 100 : 0;
        const neuPct = 100 - posPct - negPct;

        return (
          <motion.div
            key={sp.stat.speaker_id}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 + idx * 0.08 }}
          >
            <Card className={`border ${c.border}`}>
              {/* Header */}
              <CardHeader className={`pb-3 ${c.bg} rounded-t-xl border-b ${c.border}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className={`w-2.5 h-2.5 rounded-full`} style={{ background: c.hex }} />
                    <CardTitle className="text-base font-semibold">Speaker {idx + 1}</CardTitle>
                    <HintBadge reason={sp.role.reason}>
                      <Badge variant="outline" className={`text-[10px] ${c.text} border-current`}>
                        {sp.role.role}
                      </Badge>
                    </HintBadge>
                  </div>
                  <div className="flex gap-1.5">
                    <HintBadge reason={sl.reason}>
                      <Badge variant="outline" className={`text-[10px] ${sl.color} border-current`}>
                        {sl.label}
                      </Badge>
                    </HintBadge>
                    <HintBadge reason={vl.reason}>
                      <Badge variant="outline" className={`text-[10px] ${vl.color} border-current`}>
                        {vl.label}
                      </Badge>
                    </HintBadge>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-1">{sp.role.description}</p>
              </CardHeader>

              <CardContent className="pt-4 space-y-5">
                {/* Stats grid */}
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: "Talk Time", value: fmt(sp.stat.total_talk_time_ms), sub: `${sp.talkPct.toFixed(1)}% of total` },
                    { label: "Turns", value: String(sp.stat.turn_count), sub: `${sp.turnPct.toFixed(1)}% of total` },
                    { label: "Avg Turn", value: fmt(sp.avgTurnDuration), sub: "per utterance" },
                    { label: "Word Count", value: String(sp.words.length), sub: `~${sp.utts.length > 0 ? (sp.words.length / sp.utts.length).toFixed(0) : 0} per turn` },
                    { label: "Avg Sentiment", value: ((sp.stat.avg_sentiment ?? 0) >= 0 ? "+" : "") + (sp.stat.avg_sentiment ?? 0).toFixed(3), sub: sl.label },
                    { label: "Confidence", value: `${(sp.avgConf * 100).toFixed(0)}%`, sub: "transcription" },
                  ].map((item) => (
                    <div key={item.label} className="bg-muted/30 rounded-lg px-3 py-2.5">
                      <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">{item.label}</div>
                      <div className="text-sm font-semibold text-foreground">{item.value}</div>
                      <div className="text-[10px] text-muted-foreground">{item.sub}</div>
                    </div>
                  ))}
                </div>

                {/* Sentiment Distribution */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Sentiment Distribution</span>
                    <span className={`text-xs font-medium ${vl.color}`}>Volatility σ={sp.sd.toFixed(3)}</span>
                  </div>
                  <div className="flex h-3 rounded-full overflow-hidden gap-px">
                    <div
                      className="bg-emerald-500 transition-all"
                      style={{ width: `${posPct}%` }}
                      title={`Positive: ${posPct.toFixed(1)}%`}
                    />
                    <div
                      className="bg-slate-500 transition-all"
                      style={{ width: `${neuPct}%` }}
                      title={`Neutral: ${neuPct.toFixed(1)}%`}
                    />
                    <div
                      className="bg-rose-500 transition-all"
                      style={{ width: `${negPct}%` }}
                      title={`Negative: ${negPct.toFixed(1)}%`}
                    />
                  </div>
                  <div className="flex gap-3 mt-1.5">
                    <span className="text-[10px] text-emerald-400">● Positive {posPct.toFixed(0)}%</span>
                    <span className="text-[10px] text-slate-400">● Neutral {neuPct.toFixed(0)}%</span>
                    <span className="text-[10px] text-rose-400">● Negative {negPct.toFixed(0)}%</span>
                  </div>
                </div>

                {/* Emotional arc */}
                {sp.arc.length > 2 && (
                  <div>
                    <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Emotional Arc</div>
                    <div className="h-[72px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={sp.arc} margin={{ top: 4, right: 4, bottom: 0, left: -24 }}>
                          <defs>
                            <linearGradient id={`arc-${idx}`} x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor={c.area} stopOpacity={0.35} />
                              <stop offset="95%" stopColor={c.area} stopOpacity={0.03} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.5} />
                          <XAxis dataKey="i" hide />
                          <YAxis domain={[-1, 1]} tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }} />
                          <ReTooltip
                            contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 6, fontSize: 11 }}
                            formatter={(val: number) => [val.toFixed(3), "Sentiment"]}
                            labelFormatter={(i: number) => sp.arc[i] ? fmtTimestamp(sp.arc[i].ms) : ""}
                          />
                          <Area
                            type="monotone"
                            dataKey="score"
                            stroke={c.area}
                            strokeWidth={1.5}
                            fill={`url(#arc-${idx})`}
                            dot={false}
                            isAnimationActive={false}
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )}

                {/* Notable moments */}
                {(sp.topPositive.length > 0 || sp.topNegative.length > 0) && (
                  <div>
                    <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Notable Moments</div>
                    <div className="grid grid-cols-2 gap-2">
                      {/* Most positive */}
                      <div className="space-y-1.5">
                        <div className="text-[10px] text-emerald-400 font-medium uppercase tracking-wider">Most Positive</div>
                        {sp.topPositive.slice(0, 2).map((u) => (
                          <button
                            key={u.start_ms}
                            onClick={() => onUtteranceClick?.(u.start_ms ?? 0)}
                            className="w-full text-left bg-emerald-500/8 border border-emerald-500/20 rounded-lg px-2.5 py-2 hover:bg-emerald-500/15 transition-colors group"
                          >
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-[10px] text-emerald-400 font-mono">{fmtTimestamp(u.start_ms ?? 0)}</span>
                              <Badge variant="outline" className="text-[9px] text-emerald-400 border-emerald-500/40 px-1 py-0">
                                +{(u.sentiment_score ?? 0).toFixed(2)}
                              </Badge>
                            </div>
                            <p className="text-[10px] text-muted-foreground leading-snug line-clamp-2 group-hover:text-foreground transition-colors">
                              {u.text}
                            </p>
                          </button>
                        ))}
                      </div>
                      {/* Most negative */}
                      <div className="space-y-1.5">
                        <div className="text-[10px] text-rose-400 font-medium uppercase tracking-wider">Most Negative</div>
                        {sp.topNegative.slice(0, 2).map((u) => (
                          <button
                            key={u.start_ms}
                            onClick={() => onUtteranceClick?.(u.start_ms ?? 0)}
                            className="w-full text-left bg-rose-500/8 border border-rose-500/20 rounded-lg px-2.5 py-2 hover:bg-rose-500/15 transition-colors group"
                          >
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-[10px] text-rose-400 font-mono">{fmtTimestamp(u.start_ms ?? 0)}</span>
                              <Badge variant="outline" className="text-[9px] text-rose-400 border-rose-500/40 px-1 py-0">
                                {(u.sentiment_score ?? 0).toFixed(2)}
                              </Badge>
                            </div>
                            <p className="text-[10px] text-muted-foreground leading-snug line-clamp-2 group-hover:text-foreground transition-colors">
                              {u.text}
                            </p>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Talk time progress bar */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Talk Share vs Others</span>
                    <span className={`text-xs font-semibold ${c.text}`}>{sp.talkPct.toFixed(1)}%</span>
                  </div>
                  <Progress value={sp.talkPct} className="h-1.5" style={{ "--progress-color": c.hex } as React.CSSProperties} />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        );
      })}

      {/* Comparison radar — only when 2+ speakers */}
      {perSpeaker.length >= 2 && (
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 + perSpeaker.length * 0.08 }}
        >
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                Speaker Comparison
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[220px]">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={radarData} margin={{ top: 10, right: 20, bottom: 10, left: 20 }}>
                    <PolarGrid stroke="hsl(var(--border))" />
                    <PolarAngleAxis dataKey="metric" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                    {perSpeaker.map((sp, idx) => (
                      <Radar
                        key={sp.stat.speaker_id}
                        name={`Speaker ${idx + 1}`}
                        dataKey={`Speaker ${idx + 1}`}
                        stroke={SPEAKER_COLORS[idx % SPEAKER_COLORS.length].area}
                        fill={SPEAKER_COLORS[idx % SPEAKER_COLORS.length].area}
                        fillOpacity={0.12}
                        strokeWidth={1.5}
                      />
                    ))}
                    <ReTooltip
                      contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 6, fontSize: 11 }}
                      formatter={(value: number, name: string, props) => {
                        const metric = props?.payload?.metric as string;
                        const spIdx = perSpeaker.findIndex((_, i) => `Speaker ${i + 1}` === name);
                        const raw = spIdx >= 0 && metric ? METRIC_DEFS[metric]?.raw(perSpeaker[spIdx]) : null;
                        return [raw ? `${value} / 100  (${raw})` : `${value} / 100`, name];
                      }}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
              {/* Legend */}
              <div className="flex justify-center gap-5 mt-1">
                {perSpeaker.map((sp, idx) => {
                  const c = SPEAKER_COLORS[idx % SPEAKER_COLORS.length];
                  return (
                    <div key={sp.stat.speaker_id} className="flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full" style={{ background: c.area }} />
                      <span className={`text-[10px] font-medium ${c.text}`}>Speaker {idx + 1}</span>
                      <span className="text-[10px] text-muted-foreground">({sp.role.role})</span>
                    </div>
                  );
                })}
              </div>
              {/* Metric legend */}
              <div className="flex flex-wrap justify-center gap-2 mt-3 pt-3 border-t border-border/40">
                {Object.entries(METRIC_DEFS).map(([name, def]) => (
                  <HintBadge key={name} reason={def.desc}>
                    <Badge variant="outline" className="text-[10px] text-muted-foreground border-border/60 cursor-help">
                      {name}
                    </Badge>
                  </HintBadge>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Turn-by-turn breakdown */}
      {perSpeaker.length >= 2 && (
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 + (perSpeaker.length + 1) * 0.08 }}
        >
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                Turn Distribution
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Per-speaker bars */}
              {perSpeaker.map((sp, idx) => {
                const c = SPEAKER_COLORS[idx % SPEAKER_COLORS.length];
                return (
                  <div key={sp.stat.speaker_id}>
                    <div className="flex justify-between items-baseline mb-1.5">
                      <span className={`text-xs font-semibold ${c.text}`}>Speaker {idx + 1}</span>
                      <span className="text-[11px] text-muted-foreground tabular-nums">
                        {sp.stat.turn_count} turns · {sp.turnPct.toFixed(1)}% · avg {fmt(sp.avgTurnDuration)}
                      </span>
                    </div>
                    <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${sp.turnPct}%`, backgroundColor: c.area }}
                      />
                    </div>
                  </div>
                );
              })}
              {/* Stacked proportion strip */}
              <div className="flex h-3 rounded overflow-hidden gap-px pt-1">
                {perSpeaker.map((sp, idx) => {
                  const c = SPEAKER_COLORS[idx % SPEAKER_COLORS.length];
                  return (
                    <div
                      key={idx}
                      style={{ width: `${sp.turnPct}%`, backgroundColor: c.area }}
                      className="opacity-70"
                      title={`Speaker ${idx + 1}: ${sp.turnPct.toFixed(1)}% of turns`}
                    />
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
}

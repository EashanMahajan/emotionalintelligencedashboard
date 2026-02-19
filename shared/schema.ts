import { z } from "zod";
export const utteranceSchema = z.object({
  start_ms: z.number(),
  end_ms: z.number(),
  speaker_id: z.string(),
  text: z.string(),
  sentiment_score: z.number(),
  confidence: z.number(),
});
export const insightSchema = z.object({
  type: z.enum(["conflict", "loop", "divergence", "speaker_dynamics"]),
  timestamp: z.number(),
  severity: z.number(),
  description: z.string(),
});
export const speakerStatsSchema = z.object({
  speaker_id: z.string(),
  total_talk_time_ms: z.number(),
  turn_count: z.number(),
  avg_sentiment: z.number(),
});
export const analysisResultSchema = z.object({
  jobId: z.number(),
  utterances: z.array(utteranceSchema),
  insights: z.array(insightSchema),
  speakerStats: z.array(speakerStatsSchema),
  overallSentiment: z.array(
    z.object({
      timestamp: z.number(),
      score: z.number(),
    })
  ),
  conflictHeatmap: z.array(
    z.object({
      timestamp: z.number(),
      intensity: z.number(),
    })
  ),
});
export const analysisJobSchema = z.object({
  id: z.number(),
  filename: z.string(),
  status: z.enum(["pending", "processing", "completed", "failed"]),
  createdAt: z.string(),
  results: analysisResultSchema.optional().nullable(),
});

export type AnalysisJob = z.infer<typeof analysisJobSchema>;
export type Utterance = z.infer<typeof utteranceSchema>;
export type Insight = z.infer<typeof insightSchema>;
export type AnalysisResult = z.infer<typeof analysisResultSchema>;

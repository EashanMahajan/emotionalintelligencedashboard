import { z } from "zod";

// === DOMAIN TYPES (Matching TDD) ===

// Utterance structure from TDD 5. Data Model
export const utteranceSchema = z.object({
  start_ms: z.number(),
  end_ms: z.number(),
  speaker_id: z.string(),
  text: z.string(),
  sentiment_score: z.number(), // -1.0 to 1.0
  confidence: z.number(),
});

// Insight structure from TDD 5. Data Model
export const insightSchema = z.object({
  type: z.enum(["conflict", "loop", "divergence", "speaker_dynamics"]),
  timestamp: z.number(),
  severity: z.number(), // 0.0 to 1.0
  description: z.string(),
});

// Speaker stats
export const speakerStatsSchema = z.object({
  speaker_id: z.string(),
  total_talk_time_ms: z.number(),
  turn_count: z.number(),
  avg_sentiment: z.number(),
});

// The full results object
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
  ), // For the line chart
  conflictHeatmap: z.array(
    z.object({
      timestamp: z.number(),
      intensity: z.number(),
    })
  ), // For the heatmap
});

// Local job shape (no DB)
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

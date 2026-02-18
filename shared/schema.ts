import { pgTable, text, serial, integer, boolean, timestamp, jsonb, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// === TABLE DEFINITIONS ===

// We'll store the uploaded files and their processing status
export const analysisJobs = pgTable("analysis_jobs", {
  id: serial("id").primaryKey(),
  filename: text("filename").notNull(),
  status: text("status").notNull().default("pending"), // pending, processing, completed, failed
  createdAt: timestamp("created_at").defaultNow(),
  // Storing the full result JSON here for the MVP since it's a document-heavy structure
  // In a real production DB we might normalize this, but for this dashboard MVP jsonb is perfect
  results: jsonb("results"), 
});

// === SCHEMAS ===

export const insertAnalysisJobSchema = createInsertSchema(analysisJobs).omit({ 
  id: true, 
  createdAt: true, 
  results: true 
});

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
  overallSentiment: z.array(z.object({
    timestamp: z.number(),
    score: z.number()
  })), // For the line chart
  conflictHeatmap: z.array(z.object({
    timestamp: z.number(),
    intensity: z.number()
  })), // For the heatmap
});

export type AnalysisJob = typeof analysisJobs.$inferSelect;
export type InsertAnalysisJob = z.infer<typeof insertAnalysisJobSchema>;
export type Utterance = z.infer<typeof utteranceSchema>;
export type Insight = z.infer<typeof insightSchema>;
export type AnalysisResult = z.infer<typeof analysisResultSchema>;

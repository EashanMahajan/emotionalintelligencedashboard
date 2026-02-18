import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  // Upload endpoint - Mocking the file upload for now
  app.post(api.jobs.upload.path, async (req, res) => {
    // In a real app, we'd handle multer/multipart here
    // For this MVP, we just create a job entry
    const job = await storage.createJob("conversation_recording.mp3");
    
    // Simulate background processing
    mockProcessJob(job.id);
    
    res.status(201).json({
      jobId: job.id,
      status: job.status
    });
  });

  app.get(api.jobs.get.path, async (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ message: "Invalid ID" });
    
    const job = await storage.getJob(id);
    if (!job) {
      return res.status(404).json({ message: "Job not found" });
    }
    res.json(job);
  });

  app.get(api.jobs.list.path, async (req, res) => {
    const jobs = await storage.listJobs();
    res.json(jobs);
  });

  return httpServer;
}

// Mock Processing Logic to generate realistic data
async function mockProcessJob(jobId: number) {
  // Wait 2 seconds to simulate "processing"
  setTimeout(async () => {
    const results = generateMockResults(jobId);
    await storage.updateJobStatus(jobId, "completed", results);
  }, 2000);
}

function generateMockResults(jobId: number) {
  const speakers = ["Speaker A", "Speaker B"];
  const durationMs = 15 * 60 * 1000; // 15 minutes
  
  // Generate some utterances
  const utterances = [];
  let currentTime = 0;
  
  const sampleDialogues = [
    { text: "I'm really frustrated with how this project is going.", sentiment: -0.8 },
    { text: "I understand, but we have deadlines to meet.", sentiment: -0.2 },
    { text: "The deadlines are unrealistic!", sentiment: -0.9 },
    { text: "Let's try to find a solution together.", sentiment: 0.5 },
    { text: "I don't see how that's possible given the resources.", sentiment: -0.5 },
    { text: "We can reallocate some budget from marketing.", sentiment: 0.3 },
    { text: "That might actually work.", sentiment: 0.6 },
    { text: "Great, let's draft a new plan.", sentiment: 0.8 },
  ];

  for (let i = 0; i < 50; i++) {
    const speaker = speakers[i % 2];
    const template = sampleDialogues[i % sampleDialogues.length];
    const duration = 2000 + Math.random() * 5000;
    
    utterances.push({
      start_ms: currentTime,
      end_ms: currentTime + duration,
      speaker_id: speaker,
      text: template.text,
      sentiment_score: template.sentiment + (Math.random() * 0.2 - 0.1),
      confidence: 0.95
    });
    
    currentTime += duration + 500; // 500ms pause
  }

  // Generate Sentiment Trend
  const overallSentiment = utterances.map(u => ({
    timestamp: u.start_ms,
    score: u.sentiment_score
  }));

  // Generate Insights
  const insights = [
    {
      type: "conflict",
      timestamp: utterances[2].start_ms,
      severity: 0.85,
      description: "Escalating tension detected regarding deadlines."
    },
    {
      type: "loop",
      timestamp: utterances[4].start_ms,
      severity: 0.7,
      description: "Repeated argument about resource allocation."
    },
    {
      type: "divergence",
      timestamp: utterances[6].start_ms,
      severity: 0.6,
      description: "Positive tone shift detected."
    }
  ];

  const speakerStats = [
    {
      speaker_id: "Speaker A",
      total_talk_time_ms: 120000,
      turn_count: 25,
      avg_sentiment: -0.2
    },
    {
      speaker_id: "Speaker B",
      total_talk_time_ms: 110000,
      turn_count: 25,
      avg_sentiment: 0.3
    }
  ];

  const conflictHeatmap = utterances.map(u => ({
    timestamp: u.start_ms,
    intensity: Math.max(0, -u.sentiment_score)
  }));

  return {
    jobId,
    utterances,
    insights,
    speakerStats,
    overallSentiment,
    conflictHeatmap
  };
}

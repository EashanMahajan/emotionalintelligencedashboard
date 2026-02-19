import type { Express } from "express";
import type { Server } from "http";
import multer from "multer";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";

// Accept audio/video formats for transcription analysis
const ALLOWED_MIMES = [
  "audio/mpeg", "audio/mp3", "audio/mp4", "audio/x-m4a", "audio/wav",
  "audio/wave", "audio/x-wav", "audio/m4a", "audio/aac", "audio/ogg",
  "video/mp4", "video/quicktime",
];

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
  fileFilter: (_req, file, cb) => {
    const mime = file.mimetype.toLowerCase();
    const isAudio = mime.startsWith("audio/");
    const isVideo = mime.startsWith("video/");
    if (isAudio || isVideo || ALLOWED_MIMES.includes(mime)) {
      cb(null, true);
    } else {
      cb(new Error(`File type ${file.mimetype} not supported. Use MP3, WAV, M4A, MP4, or MOV.`));
    }
  },
});

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  // Upload endpoint - parses multipart file, creates job
  app.post(api.jobs.upload.path, upload.single("file"), async (req, res, next) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file provided. Please upload an audio or video file (MP3, WAV, M4A, MP4, MOV)." });
      }
      const filename = req.file.originalname;
      const job = await storage.createJob(filename);
      
      // Simulate background processing (file in memory but not persisted for mock)
      mockProcessJob(job.id);
      
      res.status(201).json({
        jobId: job.id,
        status: job.status
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Upload failed";
      res.status(400).json({ message });
    }
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

  app.get("/api/jobs/latest", async (_req, res) => {
  const jobs = await storage.listJobs();
  const latest = jobs?.[0]; // assuming listJobs returns newest-first
  if (!latest) return res.status(404).json({ message: "No jobs yet" });
  res.json(latest);
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

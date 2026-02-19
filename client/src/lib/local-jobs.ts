import type { AnalysisJob, AnalysisResult } from "@shared/schema";

const STORAGE_KEY = "ei_jobs";

function loadJobs(): AnalysisJob[] {
  if (typeof window === "undefined") {
    return [];
  }
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return [];
  }
  try {
    const parsed = JSON.parse(raw) as AnalysisJob[];
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed;
  } catch {
    return [];
  }
}

function saveJobs(jobs: AnalysisJob[]) {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(jobs));
}

function generateId() {
  return Date.now() + Math.floor(Math.random() * 1000);
}

export async function listLocalJobs(): Promise<AnalysisJob[]> {
  const jobs = loadJobs();
  return jobs.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
}

export async function getLocalJob(id: number): Promise<AnalysisJob | undefined> {
  const jobs = loadJobs();
  return jobs.find((job) => job.id === id);
}

export async function createLocalJob(filename: string): Promise<AnalysisJob> {
  const jobs = loadJobs();
  const job: AnalysisJob = {
    id: generateId(),
    filename,
    status: "pending",
    createdAt: new Date().toISOString(),
    results: null,
  };
  jobs.unshift(job);
  saveJobs(jobs);
  return job;
}

export async function updateLocalJobStatus(
  id: number,
  status: AnalysisJob["status"],
  results?: AnalysisResult
): Promise<AnalysisJob> {
  const jobs = loadJobs();
  const job = jobs.find((entry) => entry.id === id);
  if (!job) {
    throw new Error("Job not found");
  }
  job.status = status;
  if (results) {
    job.results = results;
  }
  saveJobs(jobs);
  return job;
}

export async function clearLocalJobs(): Promise<void> {
  saveJobs([]);
}


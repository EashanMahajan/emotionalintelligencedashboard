import { type AnalysisJob, type AnalysisResult } from "@shared/schema";

export interface IStorage {
  createJob(filename: string): Promise<AnalysisJob>;
  getJob(id: number): Promise<AnalysisJob | undefined>;
  listJobs(): Promise<AnalysisJob[]>;
  updateJobStatus(id: number, status: AnalysisJob["status"], results?: AnalysisResult): Promise<AnalysisJob>;
}

class LocalStorage implements IStorage {
  private jobs: AnalysisJob[] = [];
  private nextId = 1;

  async createJob(filename: string): Promise<AnalysisJob> {
    const job: AnalysisJob = {
      id: this.nextId++,
      filename,
      status: "pending",
      createdAt: new Date().toISOString(),
      results: null,
    };
    this.jobs.unshift(job);
    return job;
  }

  async getJob(id: number): Promise<AnalysisJob | undefined> {
    return this.jobs.find((job) => job.id === id);
  }

  async listJobs(): Promise<AnalysisJob[]> {
    return [...this.jobs];
  }

  async updateJobStatus(
    id: number,
    status: AnalysisJob["status"],
    results?: AnalysisResult
  ): Promise<AnalysisJob> {
    const job = await this.getJob(id);
    if (!job) {
      throw new Error(`Job ${id} not found`);
    }
    job.status = status;
    if (results) {
      job.results = results;
    }
    return job;
  }
}

export const storage = new LocalStorage();

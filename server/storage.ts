import { db } from "./db";
import { analysisJobs, type AnalysisJob, type InsertAnalysisJob } from "@shared/schema";
import { eq } from "drizzle-orm";

export interface IStorage {
  createJob(filename: string): Promise<AnalysisJob>;
  getJob(id: number): Promise<AnalysisJob | undefined>;
  listJobs(): Promise<AnalysisJob[]>;
  updateJobStatus(id: number, status: string, results?: any): Promise<AnalysisJob>;
}

export class DatabaseStorage implements IStorage {
  async createJob(filename: string): Promise<AnalysisJob> {
    const [job] = await db.insert(analysisJobs)
      .values({ filename, status: "pending" })
      .returning();
    return job;
  }

  async getJob(id: number): Promise<AnalysisJob | undefined> {
    const [job] = await db.select().from(analysisJobs).where(eq(analysisJobs.id, id));
    return job;
  }

  async listJobs(): Promise<AnalysisJob[]> {
    return await db.select().from(analysisJobs).orderBy(analysisJobs.createdAt);
  }

  async updateJobStatus(id: number, status: string, results?: any): Promise<AnalysisJob> {
    const [job] = await db.update(analysisJobs)
      .set({ status, results })
      .where(eq(analysisJobs.id, id))
      .returning();
    return job;
  }
}

export const storage = new DatabaseStorage();

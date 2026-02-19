import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { AnalysisJob, AnalysisResult } from "@shared/schema";
import { createLocalJob, getLocalJob, listLocalJobs, updateLocalJobStatus } from "@/lib/local-jobs";
import { analyzeAudioFile } from "@/lib/deepgram";
import { saveAudioFile } from "@/lib/audio-storage";

// Helper to fetch jobs
async function fetchJobs() {
  return listLocalJobs();
}

// Helper to fetch a single job details
async function fetchJob(id: number) {
  const job = await getLocalJob(id);
  return job ?? null;
}

// Hook to list all jobs
export function useJobs() {
  return useQuery({
    queryKey: [api.jobs.list.path],
    queryFn: fetchJobs,
  });
}

// Hook to get a single job with polling if it's processing
export function useJob(id: number) {
  return useQuery({
    queryKey: [api.jobs.get.path, id],
    queryFn: () => fetchJob(id),
    enabled: id > 0,
    refetchInterval: (query) => {
      const data = query.state.data;
      // Poll every 2 seconds if status is pending or processing
      if (data && (data.status === "pending" || data.status === "processing")) {
        return 2000;
      }
      return false;
    },
  });
}

// Hook to upload a new file
export function useUploadJob() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (file: File) => {
      const job = await createLocalJob(file.name);
      // Persist audio for playback (best-effort — don't block analysis if it fails)
      saveAudioFile(job.id, file).catch(() => {});
      await updateLocalJobStatus(job.id, "processing");
      try {
        const results = await analyzeAudioFile(file, job.id);
        return await updateLocalJobStatus(job.id, "completed", results);
      } catch (error) {
        await updateLocalJobStatus(job.id, "failed");
        throw error;
      }
    },
    onSuccess: (job) => {
      queryClient.setQueryData([api.jobs.get.path, job.id], job);
      queryClient.invalidateQueries({ queryKey: [api.jobs.list.path] });
    },
  });
}

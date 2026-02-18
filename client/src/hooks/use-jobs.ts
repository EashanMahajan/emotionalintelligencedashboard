import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { AnalysisJob, AnalysisResult } from "@shared/schema";

// Helper to fetch jobs
async function fetchJobs() {
  const res = await fetch(api.jobs.list.path);
  if (!res.ok) throw new Error("Failed to fetch jobs");
  const data = await res.json();
  return api.jobs.list.responses[200].parse(data);
}

// Helper to fetch a single job details
async function fetchJob(id: number) {
  const url = buildUrl(api.jobs.get.path, { id });
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to fetch job");
  const data = await res.json();
  // We need to parse the JSONB results field manually if it's a string, or rely on the schema
  // The schema expects AnalysisJob where results is jsonb (any)
  return api.jobs.get.responses[200].parse(data);
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
      const formData = new FormData();
      formData.append("file", file);
      
      const res = await fetch(api.jobs.upload.path, {
        method: api.jobs.upload.method,
        body: formData,
        // Don't set Content-Type header manually, let browser set it with boundary for FormData
      });
      
      if (!res.ok) {
        if (res.status === 400) {
          const error = await res.json();
          throw new Error(error.message || "Validation failed");
        }
        throw new Error("Failed to upload file");
      }
      
      return api.jobs.upload.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.jobs.list.path] });
    },
  });
}

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { AnalysisJob } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { createLocalJob, getLocalJob, listLocalJobs, updateLocalJobStatus } from "@/lib/local-jobs";
import { analyzeAudioFile } from "@/lib/deepgram";

export function useAnalysisJobs() {
  return useQuery({
    queryKey: [api.jobs.list.path],
    queryFn: async () => listLocalJobs(),
  });
}

export function useAnalysisJob(id: number) {
  return useQuery({
    queryKey: [api.jobs.get.path, id],
    queryFn: async () => getLocalJob(id),
    // Poll every 2 seconds if status is pending or processing
    refetchInterval: (query) => {
      const data = query.state.data as AnalysisJob | undefined;
      if (data?.status === "pending" || data?.status === "processing") {
        return 2000;
      }
      return false;
    },
  });
}

export function useUploadAnalysis() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (file: File) => {
      const job = await createLocalJob(file.name);
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
      toast({
        title: "Upload Successful",
        description: "Your file is being analyzed.",
      });
    },
    onError: (error) => {
      toast({
        title: "Upload Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

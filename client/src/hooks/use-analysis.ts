import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { AnalysisJob } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

export function useAnalysisJobs() {
  return useQuery({
    queryKey: [api.jobs.list.path],
    queryFn: async () => {
      const res = await fetch(api.jobs.list.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch jobs");
      return api.jobs.list.responses[200].parse(await res.json());
    },
  });
}

export function useAnalysisJob(id: number) {
  return useQuery({
    queryKey: [api.jobs.get.path, id],
    queryFn: async () => {
      const url = buildUrl(api.jobs.get.path, { id });
      const res = await fetch(url, { credentials: "include" });
      if (res.status === 404) return null;
      if (!res.ok) throw new Error("Failed to fetch job details");
      return api.jobs.get.responses[200].parse(await res.json());
    },
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
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch(api.jobs.upload.path, {
        method: "POST",
        body: formData,
        credentials: "include",
        // Note: Do not set Content-Type header manually for FormData, let browser set it with boundary
      });

      if (!res.ok) {
        if (res.status === 400) {
          const error = await res.json();
          throw new Error(error.message || "Invalid upload");
        }
        throw new Error("Upload failed");
      }

      return api.jobs.upload.responses[201].parse(await res.json());
    },
    onSuccess: () => {
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

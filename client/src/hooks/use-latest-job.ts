import { useQuery } from "@tanstack/react-query";
import { listLocalJobs } from "@/lib/local-jobs";

export function useLatestJob() {
  return useQuery({
    queryKey: ["jobs", "latest"],
    queryFn: async () => {
      const jobs = await listLocalJobs();
      const latest = jobs?.[0];
      if (!latest) {
        throw new Error("No latest job");
      }
      return latest;
    },
    retry: false,
  });
}

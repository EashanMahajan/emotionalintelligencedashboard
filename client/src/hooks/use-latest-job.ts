import { useQuery } from "@tanstack/react-query";

export function useLatestJob() {
  return useQuery({
    queryKey: ["jobs", "latest"],
    queryFn: async () => {
      const res = await fetch("/api/jobs/latest");
      if (!res.ok) throw new Error("No latest job");
      return res.json();
    },
    retry: false,
  });
}

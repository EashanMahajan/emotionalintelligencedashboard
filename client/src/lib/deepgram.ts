import type { AnalysisResult } from "@shared/schema";

export async function analyzeAudioFile(file: File, jobId: number): Promise<AnalysisResult> {
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch(`/api/analyze?jobId=${jobId}`, {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Analysis failed: ${res.status} ${errorText}`);
  }

  return res.json();
}

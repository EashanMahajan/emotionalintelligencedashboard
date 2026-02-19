// Trial mode tracking for unsigned users
const TRIAL_STORAGE_KEY = "resonance_trial_usage";
const MAX_TRIAL_UPLOADS = 3;

export interface TrialUsage {
  uploads: number;
  jobIds: number[];
  lastUpload: string;
}

export function getTrialUsage(): TrialUsage {
  const stored = localStorage.getItem(TRIAL_STORAGE_KEY);
  if (!stored) {
    return { uploads: 0, jobIds: [], lastUpload: "" };
  }
  try {
    return JSON.parse(stored);
  } catch {
    return { uploads: 0, jobIds: [], lastUpload: "" };
  }
}

export function incrementTrialUsage(jobId: number): TrialUsage {
  const current = getTrialUsage();
  const updated: TrialUsage = {
    uploads: current.uploads + 1,
    jobIds: [...current.jobIds, jobId],
    lastUpload: new Date().toISOString(),
  };
  localStorage.setItem(TRIAL_STORAGE_KEY, JSON.stringify(updated));
  return updated;
}

export function canUseTrial(): boolean {
  const usage = getTrialUsage();
  return usage.uploads < MAX_TRIAL_UPLOADS;
}

export function getRemainingTrials(): number {
  const usage = getTrialUsage();
  return Math.max(0, MAX_TRIAL_UPLOADS - usage.uploads);
}

export function isTrialJob(jobId: number): boolean {
  const usage = getTrialUsage();
  return usage.jobIds.includes(jobId);
}

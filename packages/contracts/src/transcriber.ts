export type TranscriptionStatus = "completed" | "failed";

export type TranscriptionRequest = {
  mediaId: string;
  mediaUrl: string;
  maxSeconds?: number;
};

export type TranscriptionResponse = {
  mediaId: string;
  status: TranscriptionStatus;
  transcriptText?: string;
  language?: string | null;
  model: string;
  clipSeconds: number;
  truncated: boolean;
  error?: string;
};

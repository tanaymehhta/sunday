export interface Recording {
  id: string;
  url: string;
  timestamp: Date;
  duration: number;
  transcription?: string;
  isTranscribing?: boolean;
  audioBlob?: Blob; // Stored for persistence, not used by UI components
}

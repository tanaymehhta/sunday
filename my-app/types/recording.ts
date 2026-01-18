export interface Recording {
  id: string;
  url: string;
  timestamp: Date;
  duration: number;
  transcription?: string;
  isTranscribing?: boolean;
}

import { Recording } from '@/types/recording';

export interface TranscriptEntry {
  timestamp: string;
  transcript: string;
}

/**
 * Formats recordings with transcriptions into the geminiInput format
 * Expected output: array of { timestamp: ISO string, transcript: string }
 */
export function formatRecordingsForGemini(recordings: Recording[]): string {
  // Filter recordings that have transcriptions
  const recordingsWithTranscriptions = recordings.filter(
    r => r.transcription &&
    !r.transcription.startsWith('Transcription failed') &&
    r.transcription !== 'No speech detected'
  );

  // Sort by timestamp (oldest first)
  const sorted = [...recordingsWithTranscriptions].sort(
    (a, b) => a.timestamp.getTime() - b.timestamp.getTime()
  );

  // Map to the expected format
  const formatted: TranscriptEntry[] = sorted.map(recording => ({
    timestamp: recording.timestamp.toISOString(),
    transcript: recording.transcription || ''
  }));

  // Return as JSON string
  return JSON.stringify(formatted, null, 2);
}

/**
 * Check if there are any valid transcriptions available
 */
export function hasValidTranscriptions(recordings: Recording[]): boolean {
  return recordings.some(
    r => r.transcription &&
    !r.transcription.startsWith('Transcription failed') &&
    r.transcription !== 'No speech detected'
  );
}

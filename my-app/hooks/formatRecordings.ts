import { Recording } from '@/types/recording';

export interface TranscriptEntry {
  timestamp: string;
  transcript: string;
}

/**
 * Formats recordings with transcriptions into the geminiInput format
 * Expected output: array of { timestamp: ISO string, transcript: string }
 */
export function formatRecordingsForGemini(recordings: Recording[], includeTimestamps: boolean = true): string {
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
  const formatted = sorted.map(recording => {
    const entry: any = {
      transcript: recording.transcription || ''
    };
    
    if (includeTimestamps) {
      // Format as local time string instead of ISO to preserve the actual recording time
      const ts = recording.timestamp;
      const year = ts.getFullYear();
      const month = String(ts.getMonth() + 1).padStart(2, '0');
      const day = String(ts.getDate()).padStart(2, '0');
      const hours = String(ts.getHours()).padStart(2, '0');
      const minutes = String(ts.getMinutes()).padStart(2, '0');
      const seconds = String(ts.getSeconds()).padStart(2, '0');
      entry.timestamp = `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
    }
    
    return entry;
  });

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

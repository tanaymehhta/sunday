/**
 * Storage Abstraction Layer for Sunday App
 *
 * Currently uses IndexedDB (via Dexie.js) for local storage.
 * Designed to be easily swappable with Supabase or other backends.
 *
 * To migrate to Supabase later:
 * 1. Create a new SupabaseStorage class implementing the same interface
 * 2. Replace `new LocalStorage()` with `new SupabaseStorage()`
 */

import Dexie, { type EntityTable } from 'dexie';

// Database record type (what's stored in IndexedDB)
interface RecordingRecord {
  id: string;
  audioBlob: Blob;
  duration: number;
  created_at: string;
  transcription: string | null;
}

// Return type (what the storage methods return)
export interface StoredRecording {
  id: string;
  url: string;
  audioBlob: Blob;
  timestamp: Date;
  duration: number;
  transcription?: string;
}

// Initialize Dexie database
const db = new Dexie('SundayDB') as Dexie & {
  recordings: EntityTable<RecordingRecord, 'id'>;
};

// Define schema (version 1)
// This mirrors the Supabase schema for easy migration
db.version(1).stores({
  recordings: 'id, created_at, duration, transcription',
  // Future tables:
  // tasks: 'id, recording_id, content, status, created_at'
});

/**
 * Storage interface for recordings
 * All methods return Promises for async compatibility (required for Supabase migration)
 */
class LocalStorage {
  /**
   * Save a new recording
   */
  async saveRecording(recording: {
    id: string;
    audioBlob: Blob;
    duration: number;
    created_at?: string;
    transcription?: string | null;
  }): Promise<RecordingRecord> {
    const record: RecordingRecord = {
      id: recording.id,
      audioBlob: recording.audioBlob,
      duration: recording.duration,
      created_at: recording.created_at || new Date().toISOString(),
      transcription: recording.transcription || null,
    };

    await db.recordings.put(record);
    return record;
  }

  /**
   * Get all recordings, ordered by created_at descending (newest first)
   */
  async getRecordings(): Promise<StoredRecording[]> {
    const recordings = await db.recordings.orderBy('created_at').reverse().toArray();

    // Convert stored blobs back to playable URLs
    return recordings.map((r) => ({
      id: r.id,
      audioBlob: r.audioBlob,
      url: URL.createObjectURL(r.audioBlob),
      timestamp: new Date(r.created_at),
      duration: r.duration,
      transcription: r.transcription || undefined,
    }));
  }

  /**
   * Get a single recording by ID
   */
  async getRecordingById(id: string): Promise<StoredRecording | null> {
    const recording = await db.recordings.get(id);
    if (!recording) return null;

    return {
      id: recording.id,
      audioBlob: recording.audioBlob,
      url: URL.createObjectURL(recording.audioBlob),
      timestamp: new Date(recording.created_at),
      duration: recording.duration,
      transcription: recording.transcription || undefined,
    };
  }

  /**
   * Delete a recording by ID
   */
  async deleteRecording(id: string): Promise<void> {
    await db.recordings.delete(id);
  }

  /**
   * Update a recording (e.g., add transcription)
   */
  async updateRecording(
    id: string,
    updates: Partial<Pick<RecordingRecord, 'transcription'>>
  ): Promise<StoredRecording | null> {
    await db.recordings.update(id, updates);
    return this.getRecordingById(id);
  }

  /**
   * Get recordings for a specific date
   */
  async getRecordingsByDate(date: Date): Promise<StoredRecording[]> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const recordings = await db.recordings
      .where('created_at')
      .between(startOfDay.toISOString(), endOfDay.toISOString())
      .reverse()
      .toArray();

    return recordings.map((r) => ({
      id: r.id,
      audioBlob: r.audioBlob,
      url: URL.createObjectURL(r.audioBlob),
      timestamp: new Date(r.created_at),
      duration: r.duration,
      transcription: r.transcription || undefined,
    }));
  }

  /**
   * Clear all recordings (use with caution)
   */
  async clearAll(): Promise<void> {
    await db.recordings.clear();
  }
}

// Export a singleton instance
export const storage = new LocalStorage();

/**
 * Example Supabase implementation (for future migration):
 *
 * class SupabaseStorage {
 *   constructor(supabaseClient) {
 *     this.supabase = supabaseClient;
 *   }
 *
 *   async saveRecording(recording) {
 *     // Upload audio to Supabase Storage
 *     const { data: fileData, error: uploadError } = await this.supabase.storage
 *       .from('recordings')
 *       .upload(`${recording.id}.webm`, recording.audioBlob);
 *
 *     // Save metadata to database
 *     const { data, error } = await this.supabase
 *       .from('recordings')
 *       .insert({
 *         id: recording.id,
 *         audio_url: fileData.path,
 *         duration: recording.duration,
 *         created_at: recording.created_at,
 *         transcription: recording.transcription
 *       })
 *       .select()
 *       .single();
 *
 *     return data;
 *   }
 *
 *   // ... implement other methods similarly
 * }
 */

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
    console.log('=== SAVING RECORDING ===');
    console.log('Recording ID:', recording.id);
    console.log('Provided created_at:', recording.created_at);
    
    // If no created_at provided, create local time string
    let createdAt = recording.created_at;
    if (!createdAt) {
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      const seconds = String(now.getSeconds()).padStart(2, '0');
      createdAt = `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
      console.log('Generated local time string:', createdAt);
    }
    
    console.log('Final created_at to store:', createdAt);
    
    const record: RecordingRecord = {
      id: recording.id,
      audioBlob: recording.audioBlob,
      duration: recording.duration,
      created_at: createdAt,
      transcription: recording.transcription || null,
    };

    await db.recordings.put(record);
    console.log('Recording saved successfully');
    return record;
  }

  /**
   * Get all recordings, ordered by created_at descending (newest first)
   */
  async getRecordings(): Promise<StoredRecording[]> {
    const recordings = await db.recordings.orderBy('created_at').reverse().toArray();
    
    console.log('=== ALL RECORDINGS IN DB ===');
    console.log('Total recordings:', recordings.length);
    recordings.forEach((r, i) => {
      console.log(`Recording ${i + 1}:`, {
        id: r.id,
        created_at: r.created_at,
        transcription: r.transcription?.substring(0, 30)
      });
    });

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
    console.log('=== FILTERING RECORDINGS BY DATE ===');
    console.log('Input date:', date);
    console.log('Input date toString:', date.toString());
    
    // Create local date range strings without timezone conversion
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    
    console.log('Date components - Year:', year, 'Month:', month, 'Day:', day);
    
    const startOfDay = `${year}-${month}-${day}T00:00:00`;
    const endOfDay = `${year}-${month}-${day}T23:59:59`;
    
    console.log('Filtering range:', startOfDay, 'to', endOfDay);

    const recordings = await db.recordings
      .where('created_at')
      .between(startOfDay, endOfDay)
      .reverse()
      .toArray();
    
    console.log('Found recordings:', recordings.length);
    recordings.forEach((r, i) => {
      console.log(`Recording ${i + 1}:`, {
        id: r.id,
        created_at: r.created_at,
        transcription: r.transcription?.substring(0, 50)
      });
    });

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

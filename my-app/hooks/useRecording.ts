import { useState, useRef, useCallback, useEffect } from 'react';
import { Recording } from '@/types/recording';
import { storage } from '@/lib/storage';

interface UseRecordingReturn {
  isRecording: boolean;
  recordings: Recording[];
  recordHint: string;
  currentlyPlaying: string | null;
  isLoading: boolean;
  startRecording: () => Promise<void>;
  stopRecording: () => void;
  toggleRecording: () => void;
  playRecording: (id: string) => void;
  deleteRecording: (id: string) => void;
  transcribeRecording: (id: string) => Promise<void>;
  uploadRecording: (file: File) => Promise<void>;
}

export const useRecording = (): UseRecordingReturn => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordings, setRecordings] = useState<Recording[]>([]);
  const [recordHint, setRecordHint] = useState('Tap to start recording your activity');
  const [currentlyPlaying, setCurrentlyPlaying] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingStartTimeRef = useRef<number | null>(null);
  const durationIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);

  const formatDuration = (ms: number): string => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  // Helper function to auto-transcribe a recording
  const autoTranscribe = useCallback(async (recordingId: string, audioBlob: Blob) => {
    // Set transcribing state
    setRecordings(prev => prev.map(r =>
      r.id === recordingId ? { ...r, isTranscribing: true } : r
    ));

    try {
      // Create FormData with audio file
      const formData = new FormData();
      formData.append('file', audioBlob, 'recording.webm');

      // Call our API route which proxies to ElevenLabs
      const response = await fetch('/api/transcribe', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || `Transcription failed: ${response.status}`);
      }

      const data = await response.json();
      const transcription = data.text || 'No speech detected';

      // Update state with transcription
      setRecordings(prev => prev.map(r =>
        r.id === recordingId
          ? {
              ...r,
              isTranscribing: false,
              transcription,
            }
          : r
      ));

      // Save transcription to storage
      await storage.updateRecording(recordingId, { transcription });

    } catch (error) {
      console.error('Auto-transcription error:', error);
      const transcription = `Transcription failed: ${error instanceof Error ? error.message : 'Unknown error'}`;

      // Update state with error
      setRecordings(prev => prev.map(r =>
        r.id === recordingId
          ? {
              ...r,
              isTranscribing: false,
              transcription,
            }
          : r
      ));

      // Save error to storage
      storage.updateRecording(recordingId, { transcription }).catch(console.error);
    }
  }, []);

  // Load recordings from storage on mount
  useEffect(() => {
    const loadRecordings = async () => {
      try {
        const stored = await storage.getRecordings();
        setRecordings(stored.map(r => ({
          id: r.id,
          url: r.url,
          timestamp: r.timestamp,
          duration: r.duration,
          transcription: r.transcription,
          audioBlob: r.audioBlob,
        })));
      } catch (error) {
        console.error('Failed to load recordings:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadRecordings();
  }, []);

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Use a format that's widely supported across browsers
      let mimeType = 'audio/webm';
      if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
        mimeType = 'audio/webm;codecs=opus';
      } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
        mimeType = 'audio/mp4';
      } else if (MediaRecorder.isTypeSupported('audio/ogg;codecs=opus')) {
        mimeType = 'audio/ogg;codecs=opus';
      } else if (MediaRecorder.isTypeSupported('audio/wav')) {
        mimeType = 'audio/wav';
      }

      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        audioChunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const audioUrl = URL.createObjectURL(audioBlob);
        const duration = Date.now() - (recordingStartTimeRef.current || Date.now());
        const id = Date.now().toString();
        const timestamp = new Date();

        const newRecording: Recording = {
          id,
          url: audioUrl,
          timestamp,
          duration,
          audioBlob,
        };

        // Save to IndexedDB
        try {
          await storage.saveRecording({
            id,
            audioBlob,
            duration,
            created_at: timestamp.toISOString(),
          });
        } catch (error) {
          console.error('Failed to save recording to storage:', error);
        }

        setRecordings(prev => [newRecording, ...prev]);
        stream.getTracks().forEach(track => track.stop());

        // Auto-transcribe the new recording
        setTimeout(() => {
          autoTranscribe(id, audioBlob);
        }, 100);
      };

      mediaRecorder.start();
      recordingStartTimeRef.current = Date.now();
      setIsRecording(true);

      durationIntervalRef.current = setInterval(() => {
        const elapsed = Date.now() - (recordingStartTimeRef.current || Date.now());
        setRecordHint(`Recording... ${formatDuration(elapsed)}`);
      }, 100);

    } catch (err) {
      console.error('Failed to start recording:', err);
      alert('Could not access microphone. Please allow microphone access.');
    }
  }, [autoTranscribe]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    if (durationIntervalRef.current) {
      clearInterval(durationIntervalRef.current);
      durationIntervalRef.current = null;
    }
    setIsRecording(false);
    setRecordHint('Tap to start recording your activity');
  }, []);

  const toggleRecording = useCallback(() => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  }, [isRecording, startRecording, stopRecording]);

  const playRecording = useCallback((id: string) => {
    const recording = recordings.find(r => r.id === id);
    if (!recording) return;

    // Stop current audio if playing
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current = null;
    }

    if (currentlyPlaying === id) {
      setCurrentlyPlaying(null);
      return;
    }

    const audio = new Audio(recording.url);
    currentAudioRef.current = audio;
    setCurrentlyPlaying(id);

    audio.onerror = (e) => {
      console.error('Audio playback error:', e);
      alert('Unable to play recording. The audio format may not be supported by your browser.');
      setCurrentlyPlaying(null);
      currentAudioRef.current = null;
    };

    audio.ontimeupdate = () => {
      const progress = (audio.currentTime / audio.duration) * 100;
      const progressBar = document.querySelector(`[data-id="${id}"] .progress-fill`) as HTMLElement;
      if (progressBar) {
        progressBar.style.width = `${progress}%`;
      }
    };

    audio.onended = () => {
      setCurrentlyPlaying(null);
      currentAudioRef.current = null;
    };

    audio.play().catch((err) => {
      console.error('Failed to play audio:', err);
      alert('Failed to play recording. Please try again.');
      setCurrentlyPlaying(null);
      currentAudioRef.current = null;
    });
  }, [recordings, currentlyPlaying]);

  const deleteRecording = useCallback(async (id: string) => {
    // Delete from IndexedDB
    try {
      await storage.deleteRecording(id);
    } catch (error) {
      console.error('Failed to delete recording from storage:', error);
    }

    setRecordings(prev => prev.filter(r => r.id !== id));
    if (currentlyPlaying === id && currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current = null;
      setCurrentlyPlaying(null);
    }
  }, [currentlyPlaying]);

  const transcribeRecording = useCallback(async (id: string) => {
    const recording = recordings.find(r => r.id === id);
    if (!recording || recording.transcription || recording.isTranscribing) return;

    // Set transcribing state
    setRecordings(prev => prev.map(r =>
      r.id === id ? { ...r, isTranscribing: true } : r
    ));

    try {
      // Get the audio blob from the recording
      let audioBlob = recording.audioBlob;

      // If audioBlob is not available, fetch it from the URL
      if (!audioBlob) {
        const response = await fetch(recording.url);
        audioBlob = await response.blob();
      }

      // Create FormData with audio file and required parameters
      const formData = new FormData();
      formData.append('file', audioBlob, 'recording.webm');

      // Call our API route which proxies to ElevenLabs
      const response = await fetch('/api/transcribe', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || `Transcription failed: ${response.status}`);
      }

      const data = await response.json();
      const transcription = data.text || 'No speech detected';

      // Update state with transcription
      setRecordings(prev => prev.map(r =>
        r.id === id
          ? {
              ...r,
              isTranscribing: false,
              transcription,
            }
          : r
      ));

      // Save transcription to storage
      await storage.updateRecording(id, { transcription });

    } catch (error) {
      console.error('Transcription error:', error);
      const transcription = `Transcription failed: ${error instanceof Error ? error.message : 'Unknown error'}`;

      // Update state with error
      setRecordings(prev => prev.map(r =>
        r.id === id
          ? {
              ...r,
              isTranscribing: false,
              transcription,
            }
          : r
      ));

      // Save error to storage
      storage.updateRecording(id, { transcription }).catch(console.error);
    }
  }, [recordings]);

  const uploadRecording = useCallback(async (file: File) => {
    try {
      // Validate file type
      if (!file.type.startsWith('audio/')) {
        alert('Please upload an audio file');
        return;
      }

      // Create audio element to get duration
      const audio = new Audio();
      const audioUrl = URL.createObjectURL(file);

      await new Promise<void>((resolve, reject) => {
        audio.onloadedmetadata = () => resolve();
        audio.onerror = () => reject(new Error('Failed to load audio file'));
        audio.src = audioUrl;
      });

      const duration = audio.duration * 1000; // Convert to milliseconds
      const id = Date.now().toString();
      const timestamp = new Date();

      const newRecording: Recording = {
        id,
        url: audioUrl,
        timestamp,
        duration,
        audioBlob: file,
      };

      // Save to IndexedDB
      try {
        await storage.saveRecording({
          id,
          audioBlob: file,
          duration,
          created_at: timestamp.toISOString(),
        });
      } catch (error) {
        console.error('Failed to save uploaded recording to storage:', error);
      }

      setRecordings(prev => [newRecording, ...prev]);

      // Auto-transcribe the uploaded recording
      setTimeout(() => {
        autoTranscribe(id, file);
      }, 100);
    } catch (error) {
      console.error('Failed to upload recording:', error);
      alert('Failed to upload audio file. Please try again.');
    }
  }, [autoTranscribe]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
      }
      if (currentAudioRef.current) {
        currentAudioRef.current.pause();
      }
    };
  }, []);

  return {
    isRecording,
    recordings,
    recordHint,
    currentlyPlaying,
    isLoading,
    startRecording,
    stopRecording,
    toggleRecording,
    playRecording,
    deleteRecording,
    transcribeRecording,
    uploadRecording
  };
};

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
  transcribeRecording: (id: string) => void;
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
      const mediaRecorder = new MediaRecorder(stream);
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
  }, []);

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

    audio.play();
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

  const transcribeRecording = useCallback((id: string) => {
    const recording = recordings.find(r => r.id === id);
    if (!recording || recording.transcription || recording.isTranscribing) return;

    // Set transcribing state
    setRecordings(prev => prev.map(r =>
      r.id === id ? { ...r, isTranscribing: true } : r
    ));

    // Check for Speech Recognition API
    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      const transcription = 'Speech recognition not supported in this browser';
      setRecordings(prev => prev.map(r =>
        r.id === id
          ? { ...r, isTranscribing: false, transcription }
          : r
      ));
      // Save to storage
      storage.updateRecording(id, { transcription }).catch(console.error);
      return;
    }

    // Create audio element to play the recording
    const audio = new Audio(recording.url);
    const recognition = new SpeechRecognition();

    recognition.lang = 'en-US';
    recognition.continuous = true;
    recognition.interimResults = false;

    let transcribedText = '';

    recognition.onresult = (event: any) => {
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          transcribedText += event.results[i][0].transcript + ' ';
        }
      }
    };

    recognition.onend = () => {
      const transcription = transcribedText.trim() || 'No speech detected';
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
      storage.updateRecording(id, { transcription }).catch(console.error);
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      const transcription = `Transcription failed: ${event.error}`;
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
    };

    // Start recognition when audio plays
    audio.onplay = () => {
      try {
        recognition.start();
      } catch (err) {
        console.error('Failed to start recognition:', err);
      }
    };

    audio.onended = () => {
      try {
        recognition.stop();
      } catch (err) {
        console.error('Failed to stop recognition:', err);
      }
    };

    // Play the audio to trigger transcription
    audio.play().catch(err => {
      console.error('Failed to play audio:', err);
      const transcription = 'Failed to play audio for transcription';
      setRecordings(prev => prev.map(r =>
        r.id === id
          ? { ...r, isTranscribing: false, transcription }
          : r
      ));
      storage.updateRecording(id, { transcription }).catch(console.error);
    });
  }, [recordings]);

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
    transcribeRecording
  };
};

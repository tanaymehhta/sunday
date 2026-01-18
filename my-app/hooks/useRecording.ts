import { useState, useRef, useCallback, useEffect } from 'react';
import { Recording } from '@/types/recording';

interface UseRecordingReturn {
  isRecording: boolean;
  recordings: Recording[];
  recordHint: string;
  currentlyPlaying: string | null;
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

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingStartTimeRef = useRef<number | null>(null);
  const durationIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);

  const formatDuration = (ms: number): string => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

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

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
        const audioUrl = URL.createObjectURL(audioBlob);
        const duration = Date.now() - (recordingStartTimeRef.current || Date.now());

        const newRecording: Recording = {
          id: Date.now().toString(),
          url: audioUrl,
          timestamp: new Date(),
          duration: duration
        };

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

  const deleteRecording = useCallback((id: string) => {
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
      setRecordings(prev => prev.map(r =>
        r.id === id
          ? { ...r, isTranscribing: false, transcription: 'Speech recognition not supported in this browser' }
          : r
      ));
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
      setRecordings(prev => prev.map(r =>
        r.id === id
          ? {
              ...r,
              isTranscribing: false,
              transcription: transcribedText.trim() || 'No speech detected'
            }
          : r
      ));
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      setRecordings(prev => prev.map(r =>
        r.id === id
          ? {
              ...r,
              isTranscribing: false,
              transcription: `Transcription failed: ${event.error}`
            }
          : r
      ));
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
      setRecordings(prev => prev.map(r =>
        r.id === id
          ? { ...r, isTranscribing: false, transcription: 'Failed to play audio for transcription' }
          : r
      ));
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
    startRecording,
    stopRecording,
    toggleRecording,
    playRecording,
    deleteRecording,
    transcribeRecording
  };
};

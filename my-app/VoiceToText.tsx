import React, { useEffect, useRef, useState } from "react";

const VoiceToText: React.FC = () => {
  const [text, setText] = useState<string>("");
  const [status, setStatus] = useState<string>(
    "Click Start and begin speaking",
  );
  const [isRecording, setIsRecording] = useState<boolean>(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    // Detect browser speech recognition (Chrome / Edge)
    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.lang = "en-US";
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setText((prev) => prev + transcript + " ");
      };

      recognition.onend = () => {
        setIsRecording(false);
        setStatus("Done. Click Start to record again.");
      };

      recognition.onerror = (event: any) => {
        setIsRecording(false);
        setStatus(`Error: ${event.error}`);
      };

      recognitionRef.current = recognition;
    }
  }, []);

  const startRecording = async () => {
    // Chrome / Edge path
    if (recognitionRef.current) {
      recognitionRef.current.start();
      setStatus("🎧 Listening (speech recognition)...");
      setIsRecording(true);
      return;
    }

    // Firefox fallback (audio recording)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);

      audioChunksRef.current = [];
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event: BlobEvent) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, {
          type: "audio/webm",
        });

        setStatus("Audio recorded. Send to server for transcription.");

        /*
          🔴 SEND TO BACKEND HERE
          const formData = new FormData();
          formData.append("audio", audioBlob);

          const res = await fetch("/api/transcribe", {
            method: "POST",
            body: formData,
          });

          const data = await res.json();
          setText(data.text);
        */
      };

      mediaRecorder.start();
      setIsRecording(true);
      setStatus("🎙️ Recording audio (Firefox fallback)...");
    } catch (err) {
      setStatus("Microphone access denied.");
    }
  };

  const stopRecording = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }

    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
    }

    setIsRecording(false);
  };

  return (
    <div style={{ maxWidth: 600, margin: "40px auto", fontFamily: "Arial" }}>
      <h1>🎤 Voice Memo to Text</h1>

      <button onClick={startRecording} disabled={isRecording}>
        Start
      </button>

      <button onClick={stopRecording} disabled={!isRecording}>
        Stop
      </button>

      <p style={{ fontStyle: "italic", marginTop: 10 }}>{status}</p>

      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Your transcribed text will appear here..."
        style={{
          width: "100%",
          height: 150,
          marginTop: 20,
          fontSize: 16,
        }}
      />
    </div>
  );
};

export default VoiceToText;

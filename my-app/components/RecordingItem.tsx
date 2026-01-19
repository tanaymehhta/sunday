import React from "react";
import { Recording } from "@/types/recording";

interface RecordingItemProps {
  recording: Recording;
  isPlaying: boolean;
  onPlay: (id: string) => void;
  onDelete: (id: string) => void;
}

const RecordingItem: React.FC<RecordingItemProps> = ({
  recording,
  isPlaying,
  onPlay,
  onDelete,
}) => {
  const formatTime = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    return `${year}-${month}-${day} ${hours}:${minutes}`;
  };

  const formatDuration = (ms: number): string => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  return (
    <div className="recording-item" data-id={recording.id}>
      <button className="play-button" onClick={() => onPlay(recording.id)}>
        {isPlaying ? (
          <div className="pause-icon">
            <div className="pause-bar"></div>
            <div className="pause-bar"></div>
          </div>
        ) : (
          <div className="play-icon"></div>
        )}
      </button>
      <div className="recording-info">
        <div className="recording-meta">
          <span className="recording-time">
            ⏱ {formatTime(recording.timestamp)}
          </span>
          <span className="recording-duration">
            {formatDuration(recording.duration)}
          </span>
        </div>
        <div className="progress-bar">
          <div className="progress-fill"></div>
        </div>
        {recording.isTranscribing && (
          <div className="transcription-text transcribing">Transcribing...</div>
        )}
        {recording.transcription && (
          <div className="transcription-text">{recording.transcription}</div>
        )}
      </div>
      <button className="delete-btn" onClick={() => onDelete(recording.id)}>
        ×
      </button>
    </div>
  );
};

export default RecordingItem;

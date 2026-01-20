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
    // Format date in local timezone
    const dateStr = date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).split('/').reverse().join('-'); // Convert MM/DD/YYYY to YYYY-MM-DD
    
    const timeStr = date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
    
    return `${dateStr} ${timeStr}`;
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

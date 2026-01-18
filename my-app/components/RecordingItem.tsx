import React from 'react';
import { Recording } from '@/types/recording';

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
  onDelete
}) => {
  const formatTime = (date: Date): string => {
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const formatDuration = (ms: number): string => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="recording-item" data-id={recording.id}>
      <button
        className="play-button"
        onClick={() => onPlay(recording.id)}
      >
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
          <span className="recording-time">⏱ {formatTime(recording.timestamp)}</span>
          <span className="recording-duration">{formatDuration(recording.duration)}</span>
        </div>
        <div className="progress-bar">
          <div className="progress-fill"></div>
        </div>
      </div>
      <button
        className="delete-btn"
        onClick={() => onDelete(recording.id)}
      >
        ×
      </button>
    </div>
  );
};

export default RecordingItem;

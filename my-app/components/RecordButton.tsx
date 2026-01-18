import React from 'react';

interface RecordButtonProps {
  isRecording: boolean;
  recordHint: string;
  onToggleRecording: () => void;
}

const RecordButton: React.FC<RecordButtonProps> = ({
  isRecording,
  recordHint,
  onToggleRecording
}) => {
  return (
    <section className="record-section">
      <button
        className={`record-button ${isRecording ? 'recording' : ''}`}
        onClick={onToggleRecording}
      >
        <svg
          className="mic-icon"
          style={{ display: isRecording ? 'none' : 'block' }}
          viewBox="0 0 24 24"
        >
          <path d="M12 1a4 4 0 0 0-4 4v6a4 4 0 0 0 8 0V5a4 4 0 0 0-4-4z"/>
          <path d="M19 10v1a7 7 0 0 1-14 0v-1"/>
          <line x1="12" y1="19" x2="12" y2="23"/>
          <line x1="8" y1="23" x2="16" y2="23"/>
        </svg>
        <div
          className="stop-icon"
          style={{ display: isRecording ? 'block' : 'none' }}
        />
      </button>
      <p className="record-hint">{recordHint}</p>
    </section>
  );
};

export default RecordButton;

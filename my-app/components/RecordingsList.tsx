import React from 'react';
import { Recording } from '@/types/recording';
import RecordingItem from './RecordingItem';

interface RecordingsListProps {
  recordings: Recording[];
  currentlyPlaying: string | null;
  onPlay: (id: string) => void;
  onDelete: (id: string) => void;
  onExtract: () => void;
  onTranscribe: (id: string) => void;
}

const RecordingsList: React.FC<RecordingsListProps> = ({
  recordings,
  currentlyPlaying,
  onPlay,
  onDelete,
  onExtract,
  onTranscribe
}) => {
  const today = new Date().toDateString();
  const todayRecordings = recordings.filter(
    r => r.timestamp.toDateString() === today
  );
  const allRecordings = recordings; // Show all recordings

  return (
    <section className="recordings-section">
      <div className="recordings-header">
        <h2 className="recordings-title">
          Recordings ({allRecordings.length})
        </h2>
        {allRecordings.length > 0 && (
          <button className="extract-button" onClick={onExtract}>
            ✨ Create Schedule ›
          </button>
        )}
      </div>
      <div id="recordingsList">
        {allRecordings.length === 0 ? (
          <div className="empty-state">
            No recordings yet.<br />Tap the microphone to start.
          </div>
        ) : (
          allRecordings.map(recording => (
            <RecordingItem
              key={recording.id}
              recording={recording}
              isPlaying={currentlyPlaying === recording.id}
              onPlay={onPlay}
              onDelete={onDelete}
              onTranscribe={onTranscribe}
            />
          ))
        )}
      </div>
    </section>
  );
};

export default RecordingsList;

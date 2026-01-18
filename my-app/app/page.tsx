'use client';

import React, { useState } from 'react';
import Header from '@/components/Header';
import RecordButton from '@/components/RecordButton';
import RecordingsList from '@/components/RecordingsList';
import TabBar from '@/components/TabBar';
import VoiceToText from '@/components/VoiceToText';
import { useRecording } from '@/hooks/useRecording';

export default function Home() {
  const [activeTab, setActiveTab] = useState('record');

  const {
    isRecording,
    recordings,
    recordHint,
    currentlyPlaying,
    toggleRecording,
    playRecording,
    deleteRecording
  } = useRecording();

  const handleExtractTasks = () => {
    // TODO: Implement task extraction logic
    alert('Task extraction will be implemented with backend API');
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'record':
        return (
          <>
            <Header />
            <RecordButton
              isRecording={isRecording}
              recordHint={recordHint}
              onToggleRecording={toggleRecording}
            />
            <RecordingsList
              recordings={recordings}
              currentlyPlaying={currentlyPlaying}
              onPlay={playRecording}
              onDelete={deleteRecording}
              onExtract={handleExtractTasks}
            />
          </>
        );
      case 'tasks':
        return (
          <div style={{ padding: '40px 24px', textAlign: 'center' }}>
            <h1 className="title">Tasks</h1>
            <p className="subtitle" style={{ marginTop: '20px' }}>
              Task management will be implemented here
            </p>
            <VoiceToText />
          </div>
        );
      case 'insights':
        return (
          <div style={{ padding: '40px 24px', textAlign: 'center' }}>
            <h1 className="title">Insights</h1>
            <p className="subtitle" style={{ marginTop: '20px' }}>
              Analytics and insights will be displayed here
            </p>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <>
      {renderTabContent()}
      <TabBar activeTab={activeTab} onTabChange={setActiveTab} />
    </>
  );
}

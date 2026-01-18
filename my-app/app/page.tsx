"use client";

import React, { useState } from "react";
import Header from "@/components/Header";
import RecordButton from "@/components/RecordButton";
import RecordingsList from "@/components/RecordingsList";
import TabBar from "@/components/TabBar";
import VoiceToText from "@/components/VoiceToText";
import { useRecording } from "@/hooks/useRecording";
import {
  callGeminiGenerateContent,
  extractTextFromGeminiResponse,
  ConversationMessage,
  saveConfirmedSchedule,
} from "@/components/TableChat";
import { GEMINI_INPUT_JSON_TEXT } from "@/hooks/geminiInput";
import ScheduleTable, { ScheduleEntry } from "@/components/ScheduleTable";

export default function Home() {
  const [activeTab, setActiveTab] = useState("record");
  const [isRunning, setIsRunning] = useState(false);
  const [conversationHistory, setConversationHistory] = useState<ConversationMessage[]>([]);
  const [scheduleData, setScheduleData] = useState<ScheduleEntry[]>([]);
  const [userInput, setUserInput] = useState("");
  const [hasInitialResponse, setHasInitialResponse] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const {
    isRecording,
    recordings,
    recordHint,
    currentlyPlaying,
    toggleRecording,
    playRecording,
    deleteRecording,
    transcribeRecording,
  } = useRecording();

  const handleExtractTasks = () => {
    alert("Task extraction will be implemented with backend API");
  };

  const parseScheduleFromResponse = (text: string): ScheduleEntry[] => {
    try {
      let cleanText = text.trim();
      cleanText = cleanText.replace(/```json\n?/g, "");
      cleanText = cleanText.replace(/```\n?/g, "");
      cleanText = cleanText.trim();

      const parsed = JSON.parse(cleanText);
      if (Array.isArray(parsed)) {
        return parsed;
      }
      return [];
    } catch (error) {
      console.error("Failed to parse schedule:", error);
      return [];
    }
  };

  const handleRunGemini = async () => {
    if (!hasInitialResponse) {
      setIsRunning(true);
      try {
        const response = await callGeminiGenerateContent({
          userText: GEMINI_INPUT_JSON_TEXT,
        });
        const text = extractTextFromGeminiResponse(response);
        console.log("Gemini API Response:", text);

        const schedule = parseScheduleFromResponse(text);
        setScheduleData(schedule);

        const newHistory: ConversationMessage[] = [
          {
            role: "user",
            parts: [{ text: GEMINI_INPUT_JSON_TEXT }],
          },
          {
            role: "model",
            parts: [{ text }],
          },
        ];
        setConversationHistory(newHistory);
        setHasInitialResponse(true);
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 2000);
      } catch (error) {
        console.error("Error calling Gemini API:", error);
        alert(`Error: ${error instanceof Error ? error.message : "Unknown error"}`);
      } finally {
        setIsRunning(false);
      }
    } else {
      if (!userInput.trim()) {
        alert("Please enter your feedback");
        return;
      }

      setIsRunning(true);
      try {
        const response = await callGeminiGenerateContent({
          userText: userInput,
          conversationHistory,
        });
        const text = extractTextFromGeminiResponse(response);
        console.log("Gemini API Response:", text);

        const schedule = parseScheduleFromResponse(text);
        setScheduleData(schedule);

        const newHistory: ConversationMessage[] = [
          ...conversationHistory,
          {
            role: "user",
            parts: [{ text: userInput }],
          },
          {
            role: "model",
            parts: [{ text }],
          },
        ];
        setConversationHistory(newHistory);
        setUserInput("");
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 2000);
      } catch (error) {
        console.error("Error calling Gemini API:", error);
        alert(`Error: ${error instanceof Error ? error.message : "Unknown error"}`);
      } finally {
        setIsRunning(false);
      }
    }
  };

  const handleReset = () => {
    setConversationHistory([]);
    setScheduleData([]);
    setHasInitialResponse(false);
    setUserInput("");
  };

  const handleConfirmSchedule = () => {
    try {
      saveConfirmedSchedule(scheduleData, conversationHistory);
      alert("✓ Schedule confirmed and saved successfully!");
    } catch (error) {
      console.error("Error saving schedule:", error);
      alert(`Error saving schedule: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case "record":
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
              onTranscribe={transcribeRecording}
            />
          </>
        );

      case "tasks":
        return (
          <div style={{ padding: "40px 24px", textAlign: "center" }}>
            <h1 className="title">Tasks</h1>
            <p className="subtitle" style={{ marginTop: "20px" }}>
              Task management will be implemented here
            </p>
          </div>
        );

      case "insights":
        return (
          <div style={{ padding: "40px 24px", textAlign: "center" }}>
            <h1 className="title">Insights</h1>
            <p className="subtitle" style={{ marginTop: "20px" }}>
              Analytics and insights will be displayed here
            </p>
          </div>
        );

      case "confirm":
        return (
          <div style={{ padding: "20px 24px 100px", minHeight: "calc(100vh - 80px)" }}>
            <h1 className="title" style={{ textAlign: "center", marginBottom: "20px" }}>
              Schedule Confirmation
            </h1>

            {showSuccess && (
              <div
                style={{
                  position: "fixed",
                  top: "20px",
                  right: "20px",
                  backgroundColor: "#34C759",
                  color: "#fff",
                  padding: "12px 20px",
                  borderRadius: "8px",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
                  zIndex: 1000,
                  animation: "slideIn 0.3s ease-out",
                }}
              >
                <span style={{ fontSize: "18px" }}>✓</span>
                <span style={{ fontWeight: "600", fontSize: "14px" }}>Schedule Updated</span>
              </div>
            )}

            {!hasInitialResponse ? (
              <div style={{ textAlign: "center", marginTop: "40px" }}>
                <p className="subtitle" style={{ marginBottom: "30px" }}>
                  Generate your daily schedule from voice transcripts
                </p>
                <button
                  onClick={handleRunGemini}
                  disabled={isRunning}
                  style={{
                    padding: "14px 36px",
                    fontSize: "16px",
                    fontWeight: "600",
                    color: "#fff",
                    backgroundColor: isRunning ? "#999" : "#007AFF",
                    border: "none",
                    borderRadius: "12px",
                    cursor: isRunning ? "not-allowed" : "pointer",
                    transition: "all 0.2s ease",
                  }}
                >
                  {isRunning ? "Generating..." : "Generate Schedule"}
                </button>
              </div>
            ) : (
              <>
                <ScheduleTable entries={scheduleData} />

                <div
                  style={{
                    maxWidth: "800px",
                    margin: "30px auto",
                    padding: "20px",
                    backgroundColor: "#f8f9fa",
                    borderRadius: "12px",
                  }}
                >
                  <p
                    style={{
                      fontSize: "14px",
                      color: "#666",
                      marginBottom: "12px",
                      fontWeight: "500",
                    }}
                  >
                    Request changes or refinements:
                  </p>
                  <textarea
                    value={userInput}
                    onChange={(e) => setUserInput(e.target.value)}
                    placeholder="E.g., 'Make the lunch break longer' or 'Combine similar activities'"
                    disabled={isRunning}
                    style={{
                      width: "100%",
                      minHeight: "80px",
                      padding: "12px",
                      fontSize: "14px",
                      border: "1px solid #ddd",
                      borderRadius: "8px",
                      resize: "vertical",
                      fontFamily: "inherit",
                      marginBottom: "12px",
                    }}
                  />
                  <div style={{ display: "flex", gap: "10px" }}>
                    <button
                      onClick={handleRunGemini}
                      disabled={isRunning || !userInput.trim()}
                      style={{
                        flex: 1,
                        padding: "12px 24px",
                        fontSize: "14px",
                        fontWeight: "600",
                        color: "#fff",
                        backgroundColor: isRunning || !userInput.trim() ? "#999" : "#007AFF",
                        border: "none",
                        borderRadius: "8px",
                        cursor: isRunning || !userInput.trim() ? "not-allowed" : "pointer",
                        transition: "all 0.2s ease",
                      }}
                    >
                      {isRunning ? "Processing..." : "Update Schedule"}
                    </button>
                    <button
                      onClick={handleReset}
                      disabled={isRunning}
                      style={{
                        padding: "12px 24px",
                        fontSize: "14px",
                        fontWeight: "600",
                        color: "#666",
                        backgroundColor: "#fff",
                        border: "1px solid #ddd",
                        borderRadius: "8px",
                        cursor: isRunning ? "not-allowed" : "pointer",
                        transition: "all 0.2s ease",
                      }}
                    >
                      Reset
                    </button>
                  </div>
                </div>

                <div style={{ textAlign: "center", marginTop: "30px" }}>
                  <button
                    onClick={handleConfirmSchedule}
                    disabled={isRunning || scheduleData.length === 0}
                    style={{
                      padding: "16px 48px",
                      fontSize: "16px",
                      fontWeight: "700",
                      color: "#fff",
                      backgroundColor: isRunning || scheduleData.length === 0 ? "#999" : "#34C759",
                      border: "none",
                      borderRadius: "12px",
                      cursor: isRunning || scheduleData.length === 0 ? "not-allowed" : "pointer",
                      transition: "all 0.2s ease",
                      boxShadow: "0 4px 12px rgba(52, 199, 89, 0.3)",
                    }}
                  >
                    ✓ Confirm & Save Schedule
                  </button>
                </div>
              </>
            )}
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

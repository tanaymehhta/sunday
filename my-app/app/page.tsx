"use client";

import React, { useState, useEffect } from "react";
import Header from "@/components/Header";
import RecordButton from "@/components/RecordButton";
import UploadButton from "@/components/UploadButton";
import RecordingsList from "@/components/RecordingsList";
import TabBar from "@/components/TabBar";
import { useRecording } from "@/hooks/useRecording";
import {
  callGeminiGenerateContent,
  extractTextFromGeminiResponse,
  ConversationMessage,
  saveConfirmedSchedule,
  savePendingSchedule,
  getPendingSchedule,
  updatePendingEntry,
  removePendingEntry,
  saveApprovedEntry,
  getApprovedSchedules,
  correctScheduleEntry,
} from "@/components/TableChat";
import { GEMINI_INPUT_JSON_TEXT } from "@/hooks/geminiInput";
import { ScheduleEntry } from "@/types/schedule";
import {
  formatRecordingsForGemini,
  hasValidTranscriptions,
} from "@/hooks/formatRecordings";
import ScheduleTable from "@/components/ScheduleTable";
import Insights from "@/components/Insights";

export default function Home() {
  const [activeTab, setActiveTab] = useState("record");
  const [isRunning, setIsRunning] = useState(false);
  const [conversationHistory, setConversationHistory] = useState<
    ConversationMessage[]
  >([]);
  const [scheduleData, setScheduleData] = useState<ScheduleEntry[]>([]);
  const [userInput, setUserInput] = useState("");
  const [hasInitialResponse, setHasInitialResponse] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isCorrecting, setIsCorrecting] = useState(false);

  const {
    isRecording,
    recordings,
    recordHint,
    currentlyPlaying,
    toggleRecording,
    playRecording,
    deleteRecording,
    transcribeRecording,
    uploadRecording,
  } = useRecording();

  // Load pending schedule on mount and when switching to confirm tab
  useEffect(() => {
    if (activeTab === "confirm") {
      const pending = getPendingSchedule();
      if (pending) {
        setScheduleData(pending.entries);
        setConversationHistory(pending.conversationHistory);
        setHasInitialResponse(true);
      }
    }
  }, [activeTab]);

  const handleExtractTasks = () => {
    // Check if there are valid transcriptions
    if (!hasValidTranscriptions(recordings)) {
      alert(
        "Please transcribe your recordings first before creating a schedule.",
      );
      return;
    }

    // Navigate to confirm tab
    setActiveTab("confirm");
  };

  const parseScheduleFromResponse = (text: string): ScheduleEntry[] => {
    try {
      let cleanText = text.trim();
      cleanText = cleanText.replace(/```json\n?/g, "");
      cleanText = cleanText.replace(/```\n?/g, "");
      cleanText = cleanText.trim();

      // Remove any non-JSON text before the array
      const jsonStart = cleanText.indexOf("[");
      const jsonEnd = cleanText.lastIndexOf("]");
      if (jsonStart !== -1 && jsonEnd !== -1) {
        cleanText = cleanText.substring(jsonStart, jsonEnd + 1);
      }

      console.log("Cleaned text for parsing:", cleanText);

      const parsed = JSON.parse(cleanText);
      if (Array.isArray(parsed)) {
        // Add unique IDs and pending status to each entry
        return parsed.map((entry, index) => ({
          id: `entry_${Date.now()}_${index}`,
          start_time: entry.start_time,
          end_time: entry.end_time,
          description: entry.description,
          note: entry.note,
          status: "pending" as const,
        }));
      }
      return [];
    } catch (error) {
      console.error("Failed to parse schedule:", error);
      console.error("Raw text:", text);
      alert("Failed to parse Gemini response. Check console for details.");
      return [];
    }
  };

  const handleRunGemini = async () => {
    if (!hasInitialResponse) {
      setIsRunning(true);
      try {
        // Use recordings data if available, otherwise fall back to static data
        const inputText = hasValidTranscriptions(recordings)
          ? formatRecordingsForGemini(recordings)
          : GEMINI_INPUT_JSON_TEXT;

        const response = await callGeminiGenerateContent({
          userText: inputText,
        });
        const text = extractTextFromGeminiResponse(response);
        console.log("Gemini API Response:", text);

        const schedule = parseScheduleFromResponse(text);
        setScheduleData(schedule);

        const newHistory: ConversationMessage[] = [
          {
            role: "user",
            parts: [{ text: inputText }],
          },
          {
            role: "model",
            parts: [{ text }],
          },
        ];
        setConversationHistory(newHistory);

        // Save to pending schedule storage
        savePendingSchedule(schedule, newHistory);

        setHasInitialResponse(true);
      } catch (error) {
        console.error("Error calling Gemini API:", error);
        alert(
          `Error: ${error instanceof Error ? error.message : "Unknown error"}`,
        );
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

        // Save to pending schedule storage
        savePendingSchedule(schedule, newHistory);

        setUserInput("");
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 2000);
      } catch (error) {
        console.error("Error calling Gemini API:", error);
        alert(
          `Error: ${error instanceof Error ? error.message : "Unknown error"}`,
        );
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
      // Navigate to insights tab
      setActiveTab("insights");
    } catch (error) {
      console.error("Error saving schedule:", error);
      alert(
        `Error saving schedule: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  };

  // Handle approving an entry (move to insights)
  const handleApproveEntry = (entryId: string) => {
    try {
      const entry = scheduleData.find((e) => e.id === entryId);
      if (!entry) return;

      // Save to approved schedules
      saveApprovedEntry(entry);

      // Remove from pending
      removePendingEntry(entryId);

      // Update local state
      setScheduleData((prev) => prev.filter((e) => e.id !== entryId));

      // Show success
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 2000);

      // If no more entries, clear the state
      if (scheduleData.length === 1) {
        setHasInitialResponse(false);
        setConversationHistory([]);
      }
    } catch (error) {
      console.error("Error approving entry:", error);
      alert(
        `Error: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  };

  // Handle rejecting an entry (stays in confirm tab for correction)
  const handleRejectEntry = (entryId: string) => {
    try {
      // Update entry status to rejected
      updatePendingEntry(entryId, { status: "rejected" });

      // Update local state
      setScheduleData((prev) =>
        prev.map((e) =>
          e.id === entryId ? { ...e, status: "rejected" as const } : e,
        ),
      );
    } catch (error) {
      console.error("Error rejecting entry:", error);
      alert(
        `Error: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  };

  // Handle correcting an entry
  const handleCorrectEntry = async (
    entryId: string,
    correctionText: string,
  ) => {
    try {
      setIsCorrecting(true);
      const entry = scheduleData.find((e) => e.id === entryId);
      if (!entry) return;

      // Call Gemini to correct the entry
      const correctedEntry = await correctScheduleEntry(
        entry,
        correctionText,
        conversationHistory,
      );

      // Update pending storage
      updatePendingEntry(entryId, correctedEntry);

      // Update local state
      setScheduleData((prev) =>
        prev.map((e) => (e.id === entryId ? correctedEntry : e)),
      );

      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 2000);
    } catch (error) {
      console.error("Error correcting entry:", error);
      alert(
        `Error: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    } finally {
      setIsCorrecting(false);
    }
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case "record":
        return (
          <>
            <Header />
            <div className="record-controls">
              <RecordButton
                isRecording={isRecording}
                recordHint={recordHint}
                onToggleRecording={toggleRecording}
              />
              <UploadButton onUpload={uploadRecording} />
            </div>
            <RecordingsList
              recordings={recordings}
              currentlyPlaying={currentlyPlaying}
              onPlay={playRecording}
              onDelete={deleteRecording}
              onExtract={handleExtractTasks}
            />
          </>
        );
      case "insights":
        return <Insights />;

      case "confirm":
        return (
          <div
            style={{
              padding: "20px 24px 100px",
              minHeight: "calc(100vh - 80px)",
            }}
          >
            <h1
              className="title"
              style={{ textAlign: "center", marginBottom: "20px" }}
            >
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
                <span style={{ fontWeight: "600", fontSize: "14px" }}>
                  Schedule Updated
                </span>
              </div>
            )}

            {isCorrecting && (
              <div
                style={{
                  position: "fixed",
                  top: "20px",
                  right: "20px",
                  backgroundColor: "#007AFF",
                  color: "#fff",
                  padding: "12px 20px",
                  borderRadius: "8px",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
                  zIndex: 1000,
                }}
              >
                <span style={{ fontSize: "14px" }}>
                  Processing correction...
                </span>
              </div>
            )}

            {!hasInitialResponse ? (
              <div style={{ textAlign: "center", marginTop: "40px" }}>
                <p className="subtitle" style={{ marginBottom: "20px" }}>
                  Generate your daily schedule from voice transcripts
                </p>
                {hasValidTranscriptions(recordings) ? (
                  <div
                    style={{
                      backgroundColor: "#e8f5e9",
                      padding: "16px",
                      borderRadius: "8px",
                      marginBottom: "20px",
                      maxWidth: "500px",
                      margin: "0 auto 20px",
                    }}
                  >
                    <p
                      style={{ fontSize: "14px", color: "#2e7d32", margin: 0 }}
                    >
                      ✓{" "}
                      {
                        recordings.filter(
                          (r) =>
                            r.transcription &&
                            !r.transcription.startsWith(
                              "Transcription failed",
                            ) &&
                            r.transcription !== "No speech detected",
                        ).length
                      }{" "}
                      recording(s) with transcriptions ready
                    </p>
                  </div>
                ) : (
                  <div
                    style={{
                      backgroundColor: "#fff3e0",
                      padding: "16px",
                      borderRadius: "8px",
                      marginBottom: "20px",
                      maxWidth: "500px",
                      margin: "0 auto 20px",
                    }}
                  >
                    <p
                      style={{ fontSize: "14px", color: "#e65100", margin: 0 }}
                    >
                      No recordings with transcriptions found. Using sample
                      data.
                    </p>
                  </div>
                )}
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
                        backgroundColor:
                          isRunning || !userInput.trim() ? "#999" : "#007AFF",
                        border: "none",
                        borderRadius: "8px",
                        cursor:
                          isRunning || !userInput.trim()
                            ? "not-allowed"
                            : "pointer",
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
                      backgroundColor:
                        isRunning || scheduleData.length === 0
                          ? "#999"
                          : "#34C759",
                      border: "none",
                      borderRadius: "12px",
                      cursor:
                        isRunning || scheduleData.length === 0
                          ? "not-allowed"
                          : "pointer",
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

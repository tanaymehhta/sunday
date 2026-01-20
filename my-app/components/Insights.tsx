"use client";

import React, { useEffect, useState } from "react";
import { getSavedSchedules, SavedSchedule } from "./TableChat";
import { ScheduleEntry } from "@/types/schedule";

type CategoryData = {
  category: string;
  duration: number;
  percentage: number;
  color: string;
  activities: string[];
};

export default function Insights() {
  const [savedSchedules, setSavedSchedules] = useState<SavedSchedule[]>([]);
  const [selectedSchedule, setSelectedSchedule] = useState<SavedSchedule | null>(null);
  const [categoryData, setCategoryData] = useState<CategoryData[]>([]);

  useEffect(() => {
    loadSchedules();
  }, []);

  const loadSchedules = () => {
    const schedules = getSavedSchedules();
    setSavedSchedules(schedules);
    if (schedules.length > 0) {
      setSelectedSchedule(schedules[schedules.length - 1]); // Select most recent
    }
  };

  useEffect(() => {
    if (selectedSchedule) {
      calculateCategories(selectedSchedule.scheduleData);
    }
  }, [selectedSchedule]);

  const calculateCategories = (schedule: Array<{ start_time: string; end_time: string; description: string }>) => {
    const categories: { [key: string]: { duration: number; activities: string[] } } = {};
    let totalMinutes = 0;

    schedule.forEach((entry) => {
      const duration = calculateDuration(entry.start_time, entry.end_time);
      const category = categorizeActivity(entry.description);
      
      if (!categories[category]) {
        categories[category] = { duration: 0, activities: [] };
      }
      categories[category].duration += duration;
      categories[category].activities.push(entry.description);
      totalMinutes += duration;
    });

    const colors = [
      "#007AFF", "#34C759", "#FF9500", "#FF3B30", "#5856D6",
      "#FF2D55", "#5AC8FA", "#FFCC00", "#AF52DE", "#32ADE6"
    ];

    const data: CategoryData[] = Object.entries(categories).map(([category, { duration, activities }], index) => ({
      category,
      duration,
      percentage: (duration / totalMinutes) * 100,
      color: colors[index % colors.length],
      activities,
    }));

    setCategoryData(data.sort((a, b) => b.duration - a.duration));
  };

  const calculateDuration = (start: string, end: string): number => {
    const parseTime = (timeStr: string): number => {
      const [time, period] = timeStr.split(" ");
      let [hours, minutes] = time.split(":").map(Number);
      
      if (period === "PM" && hours !== 12) hours += 12;
      if (period === "AM" && hours === 12) hours = 0;
      
      return hours * 60 + minutes;
    };

    return parseTime(end) - parseTime(start);
  };

  const categorizeActivity = (description: string): string => {
    const lower = description.toLowerCase();
    
    // Work-related (check first as it's most specific)
    if (lower.includes("work") || lower.includes("meeting") || lower.includes("task") || 
        lower.includes("project") || lower.includes("sprint") || lower.includes("brainstorm")) return "Work";
    
    // Meals
    if (lower.includes("breakfast") || lower.includes("lunch") || lower.includes("dinner") || 
        lower.includes("eat") || lower.includes("meal")) return "Meals";
    
    // Exercise & Health
    if (lower.includes("gym") || lower.includes("exercise") || lower.includes("workout") || 
        lower.includes("run") || lower.includes("fitness")) return "Exercise";
    
    // Travel & Commute
    if (lower.includes("travel") || lower.includes("commute") || lower.includes("driving") || 
        lower.includes("drive") || lower.includes("transit")) return "Travel";
    
    // Social & Events
    if (lower.includes("social") || lower.includes("friend") || lower.includes("family") || 
        lower.includes("call") || lower.includes("event") || lower.includes("team")) return "Social";
    
    // Shopping & Errands
    if (lower.includes("shop") || lower.includes("grocery") || lower.includes("errand") || 
        lower.includes("store")) return "Shopping";
    
    // Household & Personal Care
    if (lower.includes("clean") || lower.includes("chores") || lower.includes("laundry") || 
        lower.includes("morning routine") || lower.includes("getting ready") || 
        lower.includes("shower") || lower.includes("routine")) return "Personal Care";
    
    // Entertainment
    if (lower.includes("youtube") || lower.includes("tv") || lower.includes("video") || 
        lower.includes("watch") || lower.includes("game") || lower.includes("movie")) return "Entertainment";
    
    // Learning (keep specific to actual learning activities)
    if (lower.includes("read") || lower.includes("study") || lower.includes("course") || 
        lower.includes("class") || lower.includes("training")) return "Learning";
    
    return "Other";
  };

  const formatDuration = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours === 0) return `${mins}m`;
    if (mins === 0) return `${hours}h`;
    return `${hours}h ${mins}m`;
  };

  const downloadICS = () => {
    if (!selectedSchedule) return;

    const schedule = selectedSchedule.scheduleData;
    // Parse date string properly to avoid timezone issues
    const [year, month, day] = selectedSchedule.date.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    
    let icsContent = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//Sunday App//Schedule//EN",
      "CALSCALE:GREGORIAN",
      "METHOD:PUBLISH",
    ];

    schedule.forEach((entry, index) => {
      const startDateTime = parseDateTime(date, entry.start_time);
      const endDateTime = parseDateTime(date, entry.end_time);
      
      icsContent.push(
        "BEGIN:VEVENT",
        `DTSTART:${formatICSDateTime(startDateTime)}`,
        `DTEND:${formatICSDateTime(endDateTime)}`,
        `SUMMARY:${entry.description}`,
        `UID:${selectedSchedule.id}-${index}@sunday-app`,
        `DTSTAMP:${formatICSDateTime(new Date())}`,
        "END:VEVENT"
      );
    });

    icsContent.push("END:VCALENDAR");

    const blob = new Blob([icsContent.join("\r\n")], { type: "text/calendar;charset=utf-8" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    // Format the date for the filename (e.g., "2026-01-19")
    const formattedDate = date.toISOString().split('T')[0];
    link.download = `schedule-${formattedDate}.ics`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const parseDateTime = (date: Date, timeStr: string): Date => {
    const [time, period] = timeStr.split(" ");
    let [hours, minutes] = time.split(":").map(Number);
    
    if (period === "PM" && hours !== 12) hours += 12;
    if (period === "AM" && hours === 12) hours = 0;
    
    const dateTime = new Date(date);
    dateTime.setHours(hours, minutes, 0, 0);
    return dateTime;
  };

  const formatICSDateTime = (date: Date): string => {
    const pad = (n: number) => n.toString().padStart(2, "0");
    return (
      date.getFullYear() +
      pad(date.getMonth() + 1) +
      pad(date.getDate()) +
      "T" +
      pad(date.getHours()) +
      pad(date.getMinutes()) +
      pad(date.getSeconds())
    );
  };

  if (savedSchedules.length === 0) {
    return (
      <div style={{ padding: "40px 24px 100px", textAlign: "center", minHeight: "calc(100vh - 80px)" }}>
      </div>
    );
  }

  return (
    <div style={{ padding: "20px 24px 100px", minHeight: "calc(100vh - 80px)" }}>
      <h1 className="title" style={{ textAlign: "center", marginBottom: "20px" }}>
        Schedule Insights
      </h1>

      {selectedSchedule && (
        <>
          {/* 1. Time Table */}
          <div style={{ maxWidth: "800px", margin: "0 auto 30px" }}>
            <h2 style={{ fontSize: "18px", fontWeight: "600", marginBottom: "15px", color: "#333" }}>
              Full Schedule
            </h2>
            {/* Date Display */}
            <div style={{
              textAlign: "center",
              marginBottom: "16px",
              fontSize: "16px",
              fontWeight: "600",
              color: "#007AFF",
            }}>
              {(() => {
                const [year, month, day] = selectedSchedule.date.split('-').map(Number);
                const date = new Date(year, month - 1, day);
                return date.toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                });
              })()}
            </div>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                backgroundColor: "#fff",
                borderRadius: "12px",
                overflow: "hidden",
                boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
              }}
            >
              <thead>
                <tr style={{ backgroundColor: "#007AFF", color: "#fff" }}>
                  <th style={{ padding: "16px", textAlign: "left", fontWeight: "600", fontSize: "14px", width: "180px" }}>
                    Time
                  </th>
                  <th style={{ padding: "16px", textAlign: "left", fontWeight: "600", fontSize: "14px" }}>
                    Activity
                  </th>
                </tr>
              </thead>
              <tbody>
                {selectedSchedule.scheduleData.map((entry, index) => (
                  <tr
                    key={index}
                    style={{
                      borderBottom: index < selectedSchedule.scheduleData.length - 1 ? "1px solid #eee" : "none",
                    }}
                  >
                    <td style={{ padding: "14px 16px", fontSize: "14px", color: "#333", fontWeight: "500" }}>
                      {entry.start_time} - {entry.end_time}
                    </td>
                    <td style={{ padding: "14px 16px", fontSize: "14px", color: "#666" }}>
                      {entry.description}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* 2. ICS Download */}
          <div style={{ textAlign: "center", marginTop: "30px", marginBottom: "40px" }}>
            <button
              onClick={downloadICS}
              style={{
                padding: "14px 32px",
                fontSize: "16px",
                fontWeight: "600",
                color: "#fff",
                backgroundColor: "#007AFF",
                border: "none",
                borderRadius: "12px",
                cursor: "pointer",
                transition: "all 0.2s ease",
                boxShadow: "0 4px 12px rgba(0, 122, 255, 0.3)",
              }}
            >
              📅 Download Calendar File (.ics)
            </button>
          </div>

          {/* 3. Insights */}
          <div style={{ maxWidth: "800px", margin: "0 auto 30px" }}>
            <h2 style={{ fontSize: "18px", fontWeight: "600", marginBottom: "15px", color: "#333" }}>
              Time Distribution
            </h2>
            
            <div style={{ position: "relative", width: "300px", height: "300px", margin: "0 auto 30px" }}>
              <svg width="300" height="300" viewBox="0 0 300 300">
                {(() => {
                  let currentAngle = 0;
                  return categoryData.map((cat, index) => {
                    const angle = (cat.percentage / 100) * 360;
                    const startAngle = currentAngle;
                    currentAngle += angle;
                    
                    const x1 = 150 + 130 * Math.cos((Math.PI * startAngle) / 180 - Math.PI / 2);
                    const y1 = 150 + 130 * Math.sin((Math.PI * startAngle) / 180 - Math.PI / 2);
                    const x2 = 150 + 130 * Math.cos((Math.PI * currentAngle) / 180 - Math.PI / 2);
                    const y2 = 150 + 130 * Math.sin((Math.PI * currentAngle) / 180 - Math.PI / 2);
                    
                    const largeArc = angle > 180 ? 1 : 0;
                    const pathData = `M 150 150 L ${x1} ${y1} A 130 130 0 ${largeArc} 1 ${x2} ${y2} Z`;
                    
                    return (
                      <path
                        key={index}
                        d={pathData}
                        fill={cat.color}
                        stroke="#fff"
                        strokeWidth="2"
                      />
                    );
                  });
                })()}
              </svg>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {categoryData.map((cat, index) => (
                <div
                  key={index}
                  style={{
                    padding: "12px",
                    backgroundColor: "#f8f9fa",
                    borderRadius: "8px",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <div
                        style={{
                          width: "20px",
                          height: "20px",
                          borderRadius: "4px",
                          backgroundColor: cat.color,
                        }}
                      ></div>
                      <span style={{ fontWeight: "600", fontSize: "14px", color: "#333" }}>
                        {cat.category}
                      </span>
                    </div>
                    <div style={{ display: "flex", gap: "15px", alignItems: "center" }}>
                      <span style={{ fontSize: "14px", color: "#666" }}>
                        {formatDuration(cat.duration)}
                      </span>
                      <span style={{ fontSize: "16px", fontWeight: "700", color: "#333", minWidth: "50px", textAlign: "right" }}>
                        {cat.percentage.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                  <div style={{ marginLeft: "30px", marginTop: "8px" }}>
                    {(cat.activities || []).map((activity, actIdx) => (
                      <div
                        key={actIdx}
                        style={{
                          fontSize: "13px",
                          color: "#666",
                          marginBottom: "4px",
                          paddingLeft: "8px",
                          borderLeft: `2px solid ${cat.color}`,
                        }}
                      >
                        • {activity}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

# Sunday - Voice-Powered Activity Tracker

A productivity application that allows users to capture their daily activities through voice notes, review and confirm tasks, and visualize how they spend their time.

## Overview

Sunday transforms spoken activity logs into structured, actionable insights. Instead of manually typing what you did throughout the day, simply speak it - the app handles the rest.

## Core Features

### 1. Voice Recording
- Tap-to-record interface for capturing activities
- Multiple voice notes stored chronologically throughout the day
- Audio files preserved for reference

### 2. Speech-to-Text Processing
- Backend transcription of voice notes to text
- AI-powered extraction of discrete activities/tasks from natural speech
- Automatic timestamp association based on recording time or mentioned times

### 3. Task Review & Confirmation
- Extracted tasks displayed in a reviewable list
- Each task shows:
  - Timestamp (when the activity occurred)
  - Activity description
  - Confirmation status (pending/confirmed/rejected)
- Interactive confirmation workflow:
  - Checkmark to confirm "Yes, I did this"
  - Cross to reject "No, I didn't do this" or "Remove this"
- Ability to edit task descriptions before confirming
- Iterative refinement until user is satisfied with the day's log

### 4. Insights Dashboard
Visual representation of daily activities with the following metrics and views:

#### Summary Cards
- **Total Activities**: Count of logged activities for the day
- **Confirmed Tasks**: Number of verified activities
- **Total Time Tracked**: Cumulative time spent on activities
- **Current Streak**: Consecutive days of logging

#### Visualizations
- **Time Distribution Pie Chart**: Breakdown of time by activity category
  - Categories: Work, Meetings, Deep Focus, Breaks, Personal, Exercise, Learning
- **Daily Timeline**: Hour-by-hour view of activities
- **Weekly Calendar Heatmap**: Activity intensity across the week
- **Category Trends**: Line chart showing category distribution over time

#### Productivity Metrics
- **Confirmation Accuracy**: Percentage of auto-extracted tasks that were correct
- **Peak Productivity Hours**: When you're most active
- **Average Tasks Per Day**: Rolling average of daily activity count
- **Most Common Activities**: Frequently logged task types

## Technical Architecture

### Frontend
- Mobile-first responsive design
- Three-tab navigation: Record | Tasks | Insights
- Dark theme UI

### Backend
- Audio file storage and management
- Speech-to-text API integration (e.g., Whisper, Google Speech-to-Text)
- NLP processing for task extraction
- Database for storing:
  - Voice recordings (metadata + file references)
  - Transcriptions
  - Extracted tasks
  - User confirmations
  - Aggregated metrics

### Data Flow
```
Voice Recording → Audio Storage → Speech-to-Text → Task Extraction → User Review → Confirmed Tasks → Analytics
```

## Database Schema (Conceptual)

### VoiceNotes
- id
- user_id
- audio_url
- recorded_at
- duration_seconds
- transcription

### Tasks
- id
- voice_note_id
- description
- timestamp
- status (pending | confirmed | rejected)
- category
- duration_minutes (optional)

### DailyMetrics
- id
- user_id
- date
- total_tasks
- confirmed_tasks
- total_time_logged
- category_breakdown (JSON)

## Future Enhancements
- Voice command support ("Hey Sunday, log that I just finished a meeting")
- Smart suggestions based on patterns
- Integration with calendar apps
- Export reports (PDF/CSV)
- Goal setting and tracking
- Team/shared activity logs

## Getting Started

(Setup instructions to be added as the project develops)

## Tech Stack

(To be determined based on implementation choices)

---

*Sunday - Know how you spent your day.*

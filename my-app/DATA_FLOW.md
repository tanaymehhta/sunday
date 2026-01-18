# Sunday App - Complete Data Flow Documentation

This document explains how data travels from the user's voice recordings through transcription, storage, and finally to the Gemini API for schedule generation.

## Overview

The data flow consists of 5 main stages:

1. **Recording** - Capture audio from the user's microphone
2. **Storage** - Save audio to local IndexedDB
3. **Transcription** - Convert audio to text via ElevenLabs API
4. **Schedule Generation** - Process transcripts with Gemini API
5. **Final Storage** - Save confirmed schedules to localStorage

---

## Stage 1: Recording Audio 🎙️

**Location:** [`hooks/useRecording.ts`](hooks/useRecording.ts)

### Process Flow:

1. **User clicks record button** → calls `toggleRecording()`
2. **Request microphone access** → `navigator.mediaDevices.getUserMedia({ audio: true })`
3. **Start MediaRecorder** with optimal format:
   - Tries: `audio/webm;codecs=opus` (preferred)
   - Falls back to: `audio/mp4`, `audio/ogg`, or `audio/wav`
4. **Track recording time** → stores in `recordingStartTimeRef`
5. **Collect audio chunks** → stored in `audioChunksRef` array

### When Recording Stops:

```typescript
// On mediaRecorder.onstop event:
const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
const audioUrl = URL.createObjectURL(audioBlob);
const duration = Date.now() - recordingStartTimeRef.current;
const timestamp = new Date(); // Recording START time

const newRecording: Recording = {
  id: Date.now().toString(),
  url: audioUrl,              // For immediate playback
  timestamp: timestamp,        // When recording started
  duration: duration,          // How long the recording lasted
  audioBlob: audioBlob,       // Raw audio data
};
```

**Key Data Points:**
- `timestamp`: When the recording **started** (Date object)
- `duration`: Length of recording in milliseconds
- End time can be calculated: `timestamp + duration`

---

## Stage 2: Storage in IndexedDB 💾

**Location:** [`lib/storage.ts`](lib/storage.ts)

### Storage Architecture:

Uses **Dexie.js** (IndexedDB wrapper) with database name `SundayDB`.

#### Schema:

```typescript
interface RecordingRecord {
  id: string;              // Unique identifier (timestamp-based)
  audioBlob: Blob;         // Raw audio binary data
  duration: number;        // Recording length (ms)
  created_at: string;      // ISO timestamp string
  transcription: string | null;  // Initially null, filled later
}
```

#### Storage Operations:

**Save Recording:**
```typescript
await storage.saveRecording({
  id: id,
  audioBlob: audioBlob,
  duration: duration,
  created_at: timestamp.toISOString(),
});
```

**Load All Recordings:**
```typescript
const stored = await storage.getRecordings();
// Returns recordings ordered by created_at (newest first)
// Converts audioBlob to URL.createObjectURL() for playback
```

**Update Transcription:**
```typescript
await storage.updateRecording(id, { transcription: "text here" });
```

### Why IndexedDB?

- **Offline-first**: Works without internet
- **Large storage**: Can hold hours of audio (unlike localStorage's 5-10MB limit)
- **Migration-ready**: Designed to easily swap to Supabase later

---

## Stage 3: Transcription via ElevenLabs API 🎯

**Location:** [`app/api/transcribe/route.ts`](app/api/transcribe/route.ts) & [`hooks/useRecording.ts:160-229`](hooks/useRecording.ts)

### Client-Side (Frontend):

**Triggered by:** User clicks the 📝 button on a recording

```typescript
// In useRecording.ts
const transcribeRecording = async (id: string) => {
  // 1. Get audio blob
  let audioBlob = recording.audioBlob;
  if (!audioBlob) {
    const response = await fetch(recording.url);
    audioBlob = await response.blob();
  }

  // 2. Create form data
  const formData = new FormData();
  formData.append('file', audioBlob, 'recording.webm');

  // 3. Call Next.js API route
  const response = await fetch('/api/transcribe', {
    method: 'POST',
    body: formData,
  });

  // 4. Get transcription text
  const data = await response.json();
  const transcription = data.text;

  // 5. Update state and storage
  setRecordings(prev => prev.map(r =>
    r.id === id ? { ...r, transcription } : r
  ));
  await storage.updateRecording(id, { transcription });
};
```

### Server-Side (Next.js API Route):

**File:** `app/api/transcribe/route.ts`

```typescript
export async function POST(request: NextRequest) {
  // 1. Receive audio file from client
  const formData = await request.formData();
  const audioFile = formData.get('file') as File;

  // 2. Get ElevenLabs API key from environment
  const apiKey = process.env.ELEVENLABS_API_KEY;

  // 3. Forward to ElevenLabs API
  const elevenlabsFormData = new FormData();
  elevenlabsFormData.append('file', audioFile);
  elevenlabsFormData.append('model_id', 'scribe_v2');

  const response = await fetch('https://api.elevenlabs.io/v1/speech-to-text', {
    method: 'POST',
    headers: { 'xi-api-key': apiKey },
    body: elevenlabsFormData,
  });

  // 4. Return transcription to client
  const data = await response.json();
  return NextResponse.json({ text: data.text });
}
```

### Data Flow:

```
User clicks 📝
    ↓
Frontend: Get audioBlob from recording
    ↓
Frontend: Create FormData with audio file
    ↓
Frontend: POST to /api/transcribe
    ↓
Backend: Extract file from FormData
    ↓
Backend: Forward to ElevenLabs API
    ↓
ElevenLabs: Process audio → return text
    ↓
Backend: Return { text: "transcribed text" }
    ↓
Frontend: Update recording.transcription
    ↓
Frontend: Save to IndexedDB via storage.updateRecording()
    ↓
UI: Display transcription under progress bar
```

**Required Environment Variable:**
- `ELEVENLABS_API_KEY` in `.env.local`

---

## Stage 4: Schedule Generation with Gemini API 🤖

**Location:** [`components/TableChat.tsx`](components/TableChat.tsx) & [`app/page.tsx`](app/page.tsx)

### Input Data Format:

Currently using **static sample data** from [`hooks/geminiInput.ts`](hooks/geminiInput.ts):

```typescript
export const GEMINI_INPUT_JSON_TEXT = `[
  {
    "timestamp": "2026-01-17T07:34:00",
    "transcript": "Just woke up today. Um, doing some work..."
  },
  {
    "timestamp": "2026-01-17T07:41:00",
    "transcript": "Just did some work, now going to eat breakfast."
  },
  // ... more entries
]`;
```

**Future Enhancement:** This should pull from actual `recordings` with transcriptions:

```typescript
// Pseudocode for future implementation
const recordingsWithTranscripts = recordings
  .filter(r => r.transcription)
  .map(r => ({
    timestamp: r.timestamp.toISOString(),
    transcript: r.transcription
  }));

const inputText = JSON.stringify(recordingsWithTranscripts);
```

### Gemini API Call Flow:

**User clicks "Generate Schedule" button** → triggers `handleRunGemini()`

```typescript
// In app/page.tsx
const handleRunGemini = async () => {
  // 1. Call Gemini API with system prompt + user data
  const response = await callGeminiGenerateContent({
    userText: GEMINI_INPUT_JSON_TEXT,  // Currently static data
  });

  // 2. Extract text from response
  const text = extractTextFromGeminiResponse(response);

  // 3. Parse JSON schedule
  const schedule = parseScheduleFromResponse(text);

  // 4. Update UI with schedule
  setScheduleData(schedule);

  // 5. Store conversation history for follow-ups
  setConversationHistory([
    { role: "user", parts: [{ text: GEMINI_INPUT_JSON_TEXT }] },
    { role: "model", parts: [{ text }] }
  ]);
};
```

### Gemini API Communication:

**File:** `components/TableChat.tsx:34-106`

```typescript
export async function callGeminiGenerateContent(options?: {
  userText?: string;
  conversationHistory?: ConversationMessage[];
}) {
  // 1. Get API key
  const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;

  // 2. Construct URL
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

  // 3. Build system prompt
  const systemPrompt = `You are a time tracking assistant...
  Rules:
  1. Return ONLY valid JSON - no markdown
  2. Each entry must have: start_time, end_time, description
  3. Use 12-hour format (HH:mm AM/PM)
  4. Infer end times from next activity's start time
  ...`;

  // 4. Construct request body
  const body = {
    contents: [
      {
        role: "user",
        parts: [
          { text: systemPrompt },
          { text: userText }
        ]
      },
      // ... conversation history if exists
    ]
  };

  // 5. Make request
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  // 6. Return parsed JSON
  return await res.json();
}
```

### Response Format:

Gemini returns:
```json
{
  "candidates": [
    {
      "content": {
        "parts": [
          {
            "text": "[{\"start_time\":\"07:34 AM\",\"end_time\":\"07:41 AM\",\"description\":\"Morning work session\"}...]"
          }
        ]
      }
    }
  ]
}
```

Extracted and parsed into:
```typescript
type ScheduleEntry = {
  start_time: string;    // "07:34 AM"
  end_time: string;      // "07:41 AM"
  description: string;   // "Morning work session"
  note?: string;         // Optional notes
};
```

**Required Environment Variable:**
- `NEXT_PUBLIC_GEMINI_API_KEY` in `.env.local`

### Conversation History & Refinements:

Users can request changes like "Make lunch longer":

```typescript
// Sends new message with full conversation history
const newHistory = [
  ...conversationHistory,
  { role: "user", parts: [{ text: "Make lunch longer" }] },
];

const response = await callGeminiGenerateContent({
  userText: "Make lunch longer",
  conversationHistory: conversationHistory,
});
```

Gemini maintains context and updates the schedule accordingly.

---

## Stage 5: Final Storage (Confirmed Schedules) 📋

**Location:** [`components/TableChat.tsx:130-179`](components/TableChat.tsx)

When user clicks **"✓ Confirm & Save Schedule"**:

```typescript
// In app/page.tsx
const handleConfirmSchedule = () => {
  saveConfirmedSchedule(scheduleData, conversationHistory);
  alert("✓ Schedule confirmed and saved successfully!");
};

// In TableChat.tsx
export function saveConfirmedSchedule(
  scheduleData: ScheduleEntry[],
  conversationHistory: ConversationMessage[]
): SavedSchedule {
  const savedSchedule = {
    id: `schedule_${Date.now()}`,
    date: new Date().toISOString().split('T')[0],  // "2026-01-17"
    scheduleData: scheduleData,
    conversationHistory: conversationHistory,
    savedAt: new Date().toISOString(),
  };

  // Get existing schedules from localStorage
  const existingSchedules = getSavedSchedules();

  // Add new schedule
  existingSchedules.push(savedSchedule);

  // Save to localStorage
  localStorage.setItem('confirmedSchedules', JSON.stringify(existingSchedules));

  return savedSchedule;
}
```

### Saved Data Structure:

```typescript
type SavedSchedule = {
  id: string;                          // "schedule_1234567890"
  date: string;                        // "2026-01-17"
  scheduleData: ScheduleEntry[];       // The finalized schedule
  conversationHistory: ConversationMessage[];  // Full Gemini conversation
  savedAt: string;                     // ISO timestamp
};
```

**Storage:** Browser's `localStorage` under key `confirmedSchedules`

---

## Complete End-to-End Flow 🔄

### The Full Journey:

```
1. USER RECORDS AUDIO
   ↓
   [useRecording.ts] MediaRecorder captures audio
   ↓
   Creates: { id, url, timestamp, duration, audioBlob }
   ↓

2. SAVE TO DATABASE
   ↓
   [storage.ts] Save to IndexedDB (SundayDB.recordings)
   ↓
   Stored: { id, audioBlob, duration, created_at, transcription: null }
   ↓

3. USER REQUESTS TRANSCRIPTION
   ↓
   [useRecording.ts] User clicks 📝 button
   ↓
   Frontend: POST audioBlob to /api/transcribe
   ↓
   [route.ts] Next.js API receives audio
   ↓
   Backend: Forward to ElevenLabs API
   ↓
   ElevenLabs: Returns { text: "transcribed text" }
   ↓
   Backend: Returns to frontend
   ↓
   Frontend: Update recording.transcription
   ↓
   [storage.ts] Update IndexedDB record
   ↓
   UI: Display transcription text
   ↓

4. GENERATE SCHEDULE
   ↓
   [page.tsx] User clicks "Generate Schedule"
   ↓
   [TableChat.tsx] Collect recordings with transcriptions
   ↓
   Format: [{ timestamp, transcript }, ...]
   ↓
   [TableChat.tsx] Call Gemini API
   ↓
   Send: System prompt + formatted transcripts
   ↓
   Gemini: Processes data, returns JSON schedule
   ↓
   Frontend: Parse and display schedule table
   ↓

5. USER REFINES (Optional)
   ↓
   User types: "Make lunch break longer"
   ↓
   [TableChat.tsx] Send with conversation history
   ↓
   Gemini: Updates schedule based on context
   ↓
   Frontend: Display updated schedule
   ↓

6. CONFIRM & SAVE
   ↓
   User clicks "✓ Confirm & Save Schedule"
   ↓
   [TableChat.tsx] saveConfirmedSchedule()
   ↓
   Save to localStorage: 'confirmedSchedules'
   ↓
   Stores: { id, date, scheduleData, conversationHistory, savedAt }
   ↓
   UI: Show success message
```

---

## Storage Summary 📦

### Three Storage Locations:

1. **IndexedDB (`SundayDB.recordings`)**
   - Stores: Audio blobs, durations, timestamps, transcriptions
   - Purpose: Offline-first audio recording storage
   - Access: Via `storage.ts` abstraction layer

2. **localStorage (`confirmedSchedules`)**
   - Stores: Finalized schedules, Gemini conversation history
   - Purpose: Persist user's confirmed daily schedules
   - Access: Via `TableChat.tsx` functions

3. **In-Memory State (React)**
   - `recordings[]` - Current recordings list
   - `scheduleData[]` - Current schedule being edited
   - `conversationHistory[]` - Gemini chat context
   - Purpose: UI reactivity and real-time updates

---

## Key Files Reference 📁

| File | Purpose |
|------|---------|
| `hooks/useRecording.ts` | Recording logic, transcription trigger |
| `lib/storage.ts` | IndexedDB abstraction (recordings) |
| `app/api/transcribe/route.ts` | ElevenLabs API proxy |
| `components/TableChat.tsx` | Gemini API calls, schedule storage |
| `app/page.tsx` | Main UI orchestration |
| `hooks/geminiInput.ts` | Sample data (to be replaced) |
| `types/recording.ts` | TypeScript interfaces |

---

## Environment Variables Required 🔑

Add to `.env.local`:

```bash
# For transcription (backend only)
ELEVENLABS_API_KEY=sk_xxxxx

# For Gemini schedule generation (exposed to frontend)
NEXT_PUBLIC_GEMINI_API_KEY=AIzaSyxxxxx
```

---

## Future Enhancements 🚀

### Planned Improvements:

1. **Replace Static Sample Data**
   ```typescript
   // Instead of GEMINI_INPUT_JSON_TEXT, use:
   const todayRecordings = recordings
     .filter(r => r.transcription && isSameDay(r.timestamp, new Date()))
     .map(r => ({
       timestamp: r.timestamp.toISOString(),
       transcript: r.transcription
     }));
   ```

2. **Track Recording End Time**
   - Add `endTimestamp` field to Recording interface
   - Capture exact moment recording stops (not just start + duration)

3. **Export to .ics Calendar**
   - Convert `scheduleData` to iCalendar format
   - Allow download/sync to Google Calendar

4. **Migrate to Supabase**
   - Replace IndexedDB with cloud storage
   - Enable multi-device sync
   - Add user authentication

---

## Troubleshooting 🔧

### Common Issues:

**Transcription Fails:**
- Check `ELEVENLABS_API_KEY` is set in `.env.local`
- Verify audio format is supported (webm, mp4, ogg, wav)
- Check browser console for API errors

**Gemini Returns Invalid JSON:**
- Ensure `NEXT_PUBLIC_GEMINI_API_KEY` is correct
- Check system prompt in `TableChat.tsx:47-61`
- Verify input data format matches expected structure

**Recordings Don't Persist:**
- Check IndexedDB in browser DevTools (Application tab)
- Verify `storage.ts` is being called
- Check for quota exceeded errors

---

## Data Privacy & Security 🔒

- **Audio recordings**: Stored locally in browser (IndexedDB)
- **Transcriptions**: Sent to ElevenLabs, stored locally after
- **Schedules**: Sent to Gemini API, stored in localStorage
- **API keys**: Server-side only (ELEVENLABS), client-side for Gemini
- **No cloud sync**: All data stays on device (until Supabase migration)

---

*Last Updated: 2026-01-18*
*Generated for Sunday App v1.0.0*
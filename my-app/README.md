# Sunday - Voice Activity Tracker

A Next.js application for recording voice memos, transcribing them using AI, converting them into structured daily schedules, and providing an approval workflow (waiting room) before finalizing schedule entries.

## Current System Overview

Sunday is a **three-tab application** that allows users to:
1. **Record Tab**: Record voice notes about daily activities
2. **Confirm Tab**: Review, approve, or correct AI-generated schedule entries (waiting room)
3. **Insights Tab**: View all approved schedule entries (**⚠️ IN PROGRESS - Basic display implemented**)

### Key Workflow
```
Voice Recording → Transcription (ElevenLabs) → Schedule Generation (Gemini AI)
→ Confirm Tab (Waiting Room) → Individual Approval → Insights Tab
```

---

## Recent Changes & Implementation Details

### 1. Individual Entry Approval System (Waiting Room)

**What Changed:**
- Replaced bulk "Confirm & Save Schedule" with **individual entry approval**
- Added green tick (✓) and red cross (✗) buttons for each schedule entry
- Implemented per-entry correction flow using Gemini AI

**How It Works:**
- Each schedule entry in the Confirm tab has two action buttons:
  - **Green Tick (✓)**: Approves the entry and moves it to Insights tab
  - **Red Cross (✗)**: Opens inline correction UI for that entry
- When red cross is clicked:
  1. User enters correction text (e.g., "Breakfast was 8:00-8:30 AM, not 8:40 PM")
  2. System calls Gemini API with just that entry and the correction
  3. Gemini regenerates only that specific entry
  4. Entry is updated in the Confirm tab with status reset to 'pending'
  5. User can then approve or reject again

**Storage Model:**
- **Pending Schedules**: Stored in `localStorage` under key `pendingSchedule`
  - Contains entries awaiting approval in Confirm tab
  - Includes conversation history for context
- **Approved Schedules**: Stored in `localStorage` under key `approvedSchedules`
  - Contains entries that passed approval
  - Displayed in Insights tab

### 2. New Type System

**File: `types/schedule.ts` (NEW)**

```typescript
export type ScheduleEntryStatus = 'pending' | 'approved' | 'rejected';

export type ScheduleEntry = {
  id: string;                    // Unique identifier: entry_{timestamp}_{index}
  start_time: string;            // Format: "HH:mm AM/PM"
  end_time: string;              // Format: "HH:mm AM/PM"
  description: string;           // Activity description
  note?: string;                 // Optional additional context
  status: ScheduleEntryStatus;   // Current approval status
  rejectionReason?: string;      // Why it was rejected (if applicable)
};

export type PendingSchedule = {
  id: string;
  date: string;
  entries: ScheduleEntry[];
  conversationHistory: ConversationMessage[];
  createdAt: string;
};

export type ApprovedSchedule = {
  id: string;
  entryId: string;              // Reference to original entry
  date: string;
  start_time: string;
  end_time: string;
  description: string;
  note?: string;
  approvedAt: string;
};
```

### 3. Enhanced Components

#### **ScheduleTable Component** (`components/ScheduleTable.tsx`)

**Changes:**
- Added `onApprove`, `onReject`, `onCorrect` callback props
- Added `showActions` prop to toggle action buttons
- Integrated inline correction UI
- Visual feedback for rejected entries (red background tint)
- Displays notes and rejection reasons

**Props:**
```typescript
type ScheduleTableProps = {
  entries: ScheduleEntry[];
  onApprove?: (entryId: string) => void;
  onReject?: (entryId: string) => void;
  onCorrect?: (entryId: string, correctionText: string) => void;
  showActions?: boolean;
};
```

**UI Elements:**
- Green tick button (✓) - Background: `#34C759`
- Red cross button (✗) - Background: `#FF3B30`
- Correction textarea with submit/cancel buttons
- Disabled state for already-approved entries

#### **Main Page Component** (`app/page.tsx`)

**New Functions Added:**

1. **`handleApproveEntry(entryId: string)`**
   - Saves entry to `approvedSchedules` localStorage
   - Removes entry from `pendingSchedule`
   - Updates local state to remove entry from Confirm tab
   - Shows success notification
   - If last entry, clears the pending schedule state

2. **`handleRejectEntry(entryId: string)`**
   - Updates entry status to 'rejected'
   - Persists to `pendingSchedule` localStorage
   - Updates local state to show red background

3. **`handleCorrectEntry(entryId: string, correctionText: string)`**
   - Calls `correctScheduleEntry()` from TableChat
   - Uses Gemini API to regenerate single entry
   - Updates entry in both storage and local state
   - Resets status to 'pending'
   - Shows loading state with `isCorrecting` flag

**New State Variables:**
- `isCorrecting: boolean` - Shows "Processing correction..." notification

**useEffect Hook:**
- Loads pending schedule from localStorage when switching to Confirm tab
- Restores conversation history and entries

#### **TableChat Storage Functions** (`components/TableChat.tsx`)

**New Functions:**

1. **`savePendingSchedule(entries, conversationHistory): PendingSchedule`**
   - Saves schedule to `pendingSchedule` key in localStorage
   - Returns saved schedule object

2. **`getPendingSchedule(): PendingSchedule | null`**
   - Retrieves current pending schedule from localStorage
   - Returns null if none exists

3. **`updatePendingEntry(entryId, updates): void`**
   - Updates specific entry in pending schedule
   - Used for status changes and corrections

4. **`removePendingEntry(entryId): void`**
   - Removes entry from pending schedule
   - Clears storage if no entries remain

5. **`saveApprovedEntry(entry): ApprovedSchedule`**
   - Adds entry to `approvedSchedules` array in localStorage
   - Returns approved entry object with metadata

6. **`getApprovedSchedules(): ApprovedSchedule[]`**
   - Retrieves all approved schedules from localStorage
   - Returns empty array if none exist

7. **`correctScheduleEntry(entry, correctionText, conversationHistory): Promise<ScheduleEntry>`**
   - Calls Gemini API with specific entry and correction prompt
   - Uses last 4 conversation messages for context
   - Parses JSON response and returns updated entry
   - Resets status to 'pending' and clears rejection reason

**System Prompt for Corrections:**
```
You are correcting a single schedule entry based on user feedback.

Original entry:
- Time: {start_time} - {end_time}
- Description: {description}
- Note: {note}

User correction: {correctionText}

Return ONLY a valid JSON object with corrected entry:
{"start_time": "HH:mm AM/PM", "end_time": "HH:mm AM/PM", "description": "...", "note": "..."}
```

### 4. Insights Tab Implementation

**Status: ⚠️ IN PROGRESS**

**Currently Implemented:**
- Reads approved schedules from `getApprovedSchedules()`
- Displays entries in a table with Date, Time, Activity columns
- Shows count of approved entries
- Empty state message when no approvals exist
- Green header color (`#34C759`) to distinguish from Confirm tab

**What's Working:**
- Display of all approved schedule entries
- Date formatting (e.g., "Jan 18")
- Time and description display
- Notes display (if present)

**What's NOT Done (Future Work):**
- Analytics/insights visualization
- Charts or graphs
- Time tracking statistics
- Activity patterns analysis
- Search/filter functionality
- Delete or edit approved entries

---

## Complete Tech Stack

- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript
- **Styling**: Inline styles + CSS (global styles)
- **Storage**: Browser localStorage + IndexedDB (Dexie.js)
- **APIs**:
  - Web Audio API (recording)
  - MediaRecorder API (audio capture)
  - ElevenLabs API (speech-to-text transcription)
  - Gemini AI API (schedule generation and correction)

---

## Project Structure

```
my-app/
├── app/
│   ├── api/
│   │   └── transcribe/
│   │       └── route.ts           # ElevenLabs transcription API proxy
│   ├── layout.tsx                 # Root layout
│   ├── page.tsx                   # Main page with 3-tab system
│   └── globals.css                # Global styles
├── components/
│   ├── Header.tsx                 # Page header with date
│   ├── RecordButton.tsx           # Recording button component
│   ├── RecordingItem.tsx          # Individual recording item with transcribe button
│   ├── RecordingsList.tsx         # List of recordings
│   ├── ScheduleTable.tsx          # Table with approve/reject/correct actions
│   ├── TabBar.tsx                 # Bottom navigation (Record/Confirm/Insights)
│   └── TableChat.tsx              # Gemini API calls + storage functions
├── hooks/
│   ├── useRecording.ts            # Recording logic + IndexedDB storage
│   ├── formatRecordings.ts        # Format recordings for Gemini input
│   └── geminiInput.ts             # Sample/fallback Gemini input data
├── lib/
│   └── storage.ts                 # IndexedDB abstraction (Dexie)
├── types/
│   ├── recording.ts               # Recording type definitions
│   └── schedule.ts                # Schedule type definitions (NEW)
├── package.json
├── tsconfig.json
└── next.config.ts
```

---

## Three-Tab System Detailed

### Tab 1: Record Tab (✅ COMPLETE)

**Purpose:** Capture voice recordings about daily activities

**Features:**
- Microphone button for recording
- Real-time duration display during recording
- List of today's recordings
- Play/pause functionality with progress bar
- Delete recordings
- **Transcribe button** for each recording (uses ElevenLabs API)
- "Create Schedule" button (navigates to Confirm tab)

**File Storage:**
- Audio blobs stored in IndexedDB via `lib/storage.ts`
- Transcriptions saved to same database record
- State managed by `hooks/useRecording.ts`

**API Integration:**
- `POST /api/transcribe` - Proxies to ElevenLabs Speech-to-Text API
- Sends audio blob as FormData with file
- Returns `{ text: "..." }` with transcription

### Tab 2: Confirm Tab (✅ COMPLETE - Waiting Room)

**Purpose:** Review and approve/correct AI-generated schedule entries

**Workflow:**
1. User clicks "Generate Schedule" button
2. System calls Gemini API with all transcriptions
3. Gemini returns JSON array of schedule entries
4. Each entry gets unique ID and 'pending' status
5. Saved to `pendingSchedule` localStorage
6. Table displays with action buttons

**User Actions:**
- **Green Tick (✓)**: Approve entry
  - Moves to Insights tab
  - Saved to `approvedSchedules`
  - Removed from `pendingSchedule`
- **Red Cross (✗)**: Request correction
  - Opens inline textarea
  - User enters correction
  - Calls Gemini to fix just that entry
  - Entry updated and status reset to 'pending'

**Storage Keys:**
- `pendingSchedule` - Current waiting room entries
- `conversationHistory` - Stored within pendingSchedule for context

**UI Elements:**
- Success notification (green toast)
- Correction loading indicator (blue toast)
- Inline correction form per entry
- Visual feedback for rejected entries

**Gemini Integration:**
- Model: `gemini-2.5-flash`
- System prompt emphasizes JSON-only output
- Conversation history maintained for context
- Single-entry correction uses targeted prompt

### Tab 3: Insights Tab (⚠️ IN PROGRESS)

**Purpose:** Display approved schedule entries and analytics

**Currently Working:**
- Reads from `approvedSchedules` localStorage
- Table display with Date, Time, Activity columns
- Entry count display
- Empty state message

**NOT Yet Implemented:**
- Analytics dashboard
- Time tracking visualizations
- Activity patterns
- Search/filter
- Edit/delete functionality
- Multi-day view
- Export functionality

---

## Data Flow Architecture

### 1. Recording Flow
```
User clicks record → MediaRecorder starts → Audio chunks collected
→ Stop recording → Blob created → Saved to IndexedDB
→ Displayed in RecordingsList
```

### 2. Transcription Flow
```
User clicks transcribe → Audio blob read → POST to /api/transcribe
→ ElevenLabs API call → Transcription returned → Saved to IndexedDB
→ Displayed under recording
```

### 3. Schedule Generation Flow
```
User clicks "Generate Schedule" → All transcriptions collected
→ Formatted for Gemini → POST to Gemini API → JSON schedule returned
→ Parsed with IDs and status → Saved to pendingSchedule localStorage
→ Displayed in Confirm tab table
```

### 4. Approval Flow
```
User clicks green tick on entry → Entry data extracted
→ Saved to approvedSchedules localStorage → Removed from pendingSchedule
→ UI updated to remove entry → Appears in Insights tab
```

### 5. Correction Flow
```
User clicks red cross → Correction UI shown → User enters text
→ Gemini API called with entry + correction + history
→ Corrected JSON returned → Entry updated in pendingSchedule
→ Status reset to pending → UI refreshed with corrected data
```

---

## API Endpoints

### 1. ElevenLabs Transcription API

**Endpoint:** `/api/transcribe` (Next.js API route)

**Method:** `POST`

**Request:**
- Content-Type: `multipart/form-data`
- Body: FormData with audio file

**Response:**
```json
{
  "text": "I had breakfast today from 8:00 AM to 8:40 AM"
}
```

**Implementation:** `app/api/transcribe/route.ts`
- Proxies to ElevenLabs API
- Requires `ELEVENLABS_API_KEY` environment variable
- Model: `eleven_turbo_v2_5`

### 2. Gemini API (Schedule Generation)

**Endpoint:** `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent`

**Method:** `POST`

**Request:**
```json
{
  "contents": [
    {
      "role": "user",
      "parts": [
        { "text": "System prompt..." },
        { "text": "Transcriptions..." }
      ]
    }
  ]
}
```

**Response:**
```json
{
  "candidates": [
    {
      "content": {
        "parts": [
          {
            "text": "[{\"start_time\":\"8:00 AM\",\"end_time\":\"8:40 AM\",\"description\":\"Breakfast\"}]"
          }
        ]
      }
    }
  ]
}
```

**Implementation:** `components/TableChat.tsx`
- Function: `callGeminiGenerateContent()`
- Requires `NEXT_PUBLIC_GEMINI_API_KEY` environment variable
- Maintains conversation history for context

### 3. Gemini API (Single Entry Correction)

**Same endpoint** but with different system prompt:

**Correction Prompt:**
```
You are correcting a single schedule entry based on user feedback.

Original entry:
- Time: 8:00 AM - 8:40 AM
- Description: Breakfast

User correction: The breakfast was from 8:00 AM to 8:30 AM, not 8:40 PM

Return ONLY valid JSON object (not array):
{"start_time": "...", "end_time": "...", "description": "...", "note": "..."}
```

**Implementation:** `correctScheduleEntry()` in `components/TableChat.tsx`

---

## Environment Variables

Create `.env.local` in project root:

```bash
# ElevenLabs API Key (for transcription)
ELEVENLABS_API_KEY=your_elevenlabs_api_key_here

# Gemini API Key (for schedule generation)
NEXT_PUBLIC_GEMINI_API_KEY=your_gemini_api_key_here
```

**Important:**
- `NEXT_PUBLIC_*` variables are exposed to browser
- Restart dev server after changing `.env.local`
- Never commit `.env.local` to git

---

## Storage System

### IndexedDB (via Dexie.js)

**Database:** `SundayDB`

**Tables:**
- `recordings`:
  - `id` (primary key)
  - `audioBlob` (Blob)
  - `duration` (number)
  - `created_at` (ISO string)
  - `transcription` (string | null)

**File:** `lib/storage.ts`

**Functions:**
- `saveRecording()` - Store new recording
- `getRecordings()` - Get all recordings
- `getRecordingById()` - Get single recording
- `deleteRecording()` - Delete recording
- `updateRecording()` - Update (e.g., add transcription)
- `getRecordingsByDate()` - Filter by date
- `clearAll()` - Delete all (use with caution)

### localStorage

**Keys:**

1. **`pendingSchedule`** (PendingSchedule object)
```json
{
  "id": "pending_1234567890",
  "date": "2026-01-18",
  "entries": [
    {
      "id": "entry_1234567890_0",
      "start_time": "8:00 AM",
      "end_time": "8:40 AM",
      "description": "Breakfast",
      "note": null,
      "status": "pending",
      "rejectionReason": null
    }
  ],
  "conversationHistory": [...],
  "createdAt": "2026-01-18T10:00:00.000Z"
}
```

2. **`approvedSchedules`** (Array of ApprovedSchedule)
```json
[
  {
    "id": "approved_1234567890",
    "entryId": "entry_1234567890_0",
    "date": "2026-01-18",
    "start_time": "8:00 AM",
    "end_time": "8:40 AM",
    "description": "Breakfast",
    "note": null,
    "approvedAt": "2026-01-18T10:05:00.000Z"
  }
]
```

3. **`confirmedSchedules`** (Legacy - Array of SavedSchedule)
- Used by old "Confirm & Save Schedule" button
- Still present for backwards compatibility
- Not actively used by new approval system

---

## Key Functions Reference

### `app/page.tsx`

| Function | Purpose | Parameters | Returns |
|----------|---------|------------|---------|
| `handleApproveEntry()` | Approve entry, move to Insights | `entryId: string` | `void` |
| `handleRejectEntry()` | Mark entry as rejected | `entryId: string` | `void` |
| `handleCorrectEntry()` | Correct entry via Gemini | `entryId: string, correctionText: string` | `Promise<void>` |
| `parseScheduleFromResponse()` | Parse Gemini JSON response | `text: string` | `ScheduleEntry[]` |
| `handleRunGemini()` | Generate or update schedule | None | `Promise<void>` |

### `components/TableChat.tsx`

| Function | Purpose | Parameters | Returns |
|----------|---------|------------|---------|
| `savePendingSchedule()` | Save to waiting room | `entries, conversationHistory` | `PendingSchedule` |
| `getPendingSchedule()` | Load from waiting room | None | `PendingSchedule \| null` |
| `updatePendingEntry()` | Update single entry | `entryId, updates` | `void` |
| `removePendingEntry()` | Remove from waiting room | `entryId` | `void` |
| `saveApprovedEntry()` | Move to Insights | `entry` | `ApprovedSchedule` |
| `getApprovedSchedules()` | Get all approved | None | `ApprovedSchedule[]` |
| `correctScheduleEntry()` | Fix via Gemini | `entry, correctionText, history` | `Promise<ScheduleEntry>` |
| `callGeminiGenerateContent()` | Call Gemini API | `options` | `Promise<Response>` |

### `hooks/useRecording.ts`

| Function | Purpose | Parameters | Returns |
|----------|---------|------------|---------|
| `startRecording()` | Begin audio capture | None | `Promise<void>` |
| `stopRecording()` | End audio capture | None | `void` |
| `toggleRecording()` | Start/stop toggle | None | `void` |
| `playRecording()` | Play audio | `id: string` | `void` |
| `deleteRecording()` | Delete audio | `id: string` | `void` |
| `transcribeRecording()` | Transcribe via ElevenLabs | `id: string` | `Promise<void>` |

---

## Installation & Setup

### Prerequisites
- Node.js 18+
- npm or yarn
- ElevenLabs API key
- Gemini API key

### Installation Steps

1. Navigate to project directory:
```bash
cd my-app
```

2. Install dependencies:
```bash
npm install
```

3. Create environment file:
```bash
touch .env.local
```

4. Add API keys to `.env.local`:
```bash
ELEVENLABS_API_KEY=your_elevenlabs_key
NEXT_PUBLIC_GEMINI_API_KEY=your_gemini_key
```

5. Run development server:
```bash
npm run dev
```

6. Open browser:
```
http://localhost:3000
```

### Available Scripts
- `npm run dev` - Development server with Turbopack
- `npm run build` - Production build
- `npm start` - Start production server
- `npm run lint` - Run ESLint

---

## Browser Compatibility

| Browser | Recording | Playback | Transcription | AI Features |
|---------|-----------|----------|---------------|-------------|
| Chrome | ✅ | ✅ | ✅ | ✅ |
| Edge | ✅ | ✅ | ✅ | ✅ |
| Firefox | ✅ | ✅ | ✅ | ✅ |
| Safari | ✅ | ✅ | ✅ | ✅ |

**Note:** All browsers support MediaRecorder API. Transcription works via backend API.

---

## Testing the System

### End-to-End Test Flow

1. **Record Tab:**
   - Click microphone to record
   - Say: "I had breakfast from 8:00 AM to 8:30 AM"
   - Stop recording
   - Click "Transcribe" button
   - Wait for transcription to appear

2. **Generate Schedule:**
   - Click "Create Schedule" button
   - Navigate to Confirm tab automatically
   - Click "Generate Schedule" button
   - Wait for AI to process (shows "Generating...")
   - Schedule table appears with entries

3. **Review Entry:**
   - See entry: "8:00 AM - 8:30 AM | Breakfast"
   - Note the green tick (✓) and red cross (✗) buttons

4. **Test Correction:**
   - Click red cross (✗)
   - Enter: "Actually it was 7:30 AM to 8:00 AM"
   - Click "Submit Correction"
   - Wait for "Processing correction..." notification
   - Entry updates with new times

5. **Approve Entry:**
   - Click green tick (✓)
   - Entry disappears from Confirm tab
   - Success notification appears

6. **View in Insights:**
   - Click Insights tab
   - See approved entry in table
   - Note date, time, and activity displayed

---

## Known Issues & Limitations

1. **Insights Tab:**
   - Only displays basic table view
   - No analytics or visualizations yet
   - No search/filter functionality
   - Cannot edit or delete approved entries

2. **Storage:**
   - localStorage has 5-10MB limit per domain
   - Large audio files stored in IndexedDB (better for large data)
   - No cloud sync or backup

3. **Gemini API:**
   - Sometimes returns markdown code blocks instead of pure JSON
   - Parser handles this but may fail on unexpected formats
   - Rate limits may apply (check Gemini API quotas)

4. **ElevenLabs API:**
   - Transcription accuracy depends on audio quality
   - May fail on very short recordings
   - API costs money (check pricing)

5. **Browser:**
   - Requires microphone permissions
   - Some browsers limit audio recording duration
   - IndexedDB may be cleared if browser storage is full

---

## Future Enhancements

### Short-term (Next Steps for Insights Tab):
- [ ] Charts and visualizations (time spent per activity)
- [ ] Calendar view of approved entries
- [ ] Search and filter functionality
- [ ] Export to CSV/JSON
- [ ] Edit approved entries
- [ ] Delete approved entries
- [ ] Multi-day view

### Medium-term:
- [ ] User authentication
- [ ] Cloud database (Supabase migration path exists in `lib/storage.ts`)
- [ ] Multi-device sync
- [ ] Backup and restore functionality
- [ ] Share schedules with others

### Long-term:
- [ ] Mobile app (React Native)
- [ ] Collaborative schedules
- [ ] Integration with Google Calendar, Outlook
- [ ] AI-powered suggestions and insights
- [ ] Habit tracking
- [ ] Goals and productivity metrics

---

## For AI Agents Reading This

### Current State Summary:
1. **Recording system**: ✅ Fully functional
2. **Transcription**: ✅ Working with ElevenLabs
3. **Schedule generation**: ✅ Working with Gemini
4. **Waiting room (Confirm tab)**: ✅ Complete with approve/reject/correct
5. **Insights tab**: ⚠️ Basic display only, analytics NOT implemented

### Critical Files to Understand:
- `app/page.tsx` - Main application logic
- `components/ScheduleTable.tsx` - Approval UI
- `components/TableChat.tsx` - API calls and storage
- `types/schedule.ts` - Type definitions
- `lib/storage.ts` - IndexedDB layer

### localStorage Keys:
- `pendingSchedule` - Entries in waiting room
- `approvedSchedules` - Entries in Insights
- `confirmedSchedules` - Legacy (ignore)

### Status Enum:
- `'pending'` - Awaiting user review
- `'approved'` - Moved to Insights
- `'rejected'` - Marked for correction (UI state only)

### Next Work (if continuing Insights):
- Implement analytics visualizations
- Add time-based charts
- Create activity pattern recognition
- Build search/filter UI
- Add edit/delete for approved entries

---

## License

Private project

---

**Last Updated:** 2026-01-18
**Version:** 2.0 (Waiting Room Implementation Complete)

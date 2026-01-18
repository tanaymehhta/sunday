# Sunday - Voice Activity Tracker

A Next.js application for recording voice memos, extracting activities, and building calendar events from your daily voice notes.

## Features

- **Voice Recording**: Record audio memos with a sleek, modern interface
- **Audio Playback**: Play back recordings with progress tracking
- **Activity Tracking**: Track daily activities through voice notes
- **Multi-Tab Interface**:
  - Record: Capture voice memos
  - Tasks: Review and confirm extracted tasks (with VoiceToText component)
  - Insights: View analytics (coming soon)

## Tech Stack

- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript
- **Styling**: CSS (global styles)
- **APIs**: Web Audio API, MediaRecorder API, Speech Recognition API

## Project Structure

```
my-app/
├── app/
│   ├── layout.tsx          # Root layout
│   ├── page.tsx            # Main page component
│   └── globals.css         # Global styles
├── components/
│   ├── Header.tsx          # Page header with date
│   ├── RecordButton.tsx    # Recording button component
│   ├── RecordingItem.tsx   # Individual recording item
│   ├── RecordingsList.tsx  # List of recordings
│   ├── TabBar.tsx          # Bottom navigation tabs
│   └── VoiceToText.tsx     # Voice-to-text conversion component
├── hooks/
│   └── useRecording.ts     # Custom hook for recording logic
├── types/
│   └── recording.ts        # TypeScript interfaces
├── package.json
├── tsconfig.json
└── next.config.ts
```

## Getting Started

### Prerequisites

- Node.js 18+ installed
- npm or yarn package manager

### Installation

1. Navigate to the project directory:
```bash
cd my-app
```

2. Install dependencies:
```bash
npm install
```

3. Run the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

### Available Scripts

- `npm run dev` - Start development server with Turbopack
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint

## Environment Setup (Gemini API)

To enable Gemini-powered features, add your API key to an environment file:

1. Create or edit `.env.local` in the project root:
```bash
echo "NEXT_PUBLIC_GEMINI_API_KEY=your-api-key-here" > .env.local
```

2. Replace `your-api-key-here` with your actual Gemini API key.

Notes:
- Only variables prefixed with `NEXT_PUBLIC_` are exposed to the browser in Next.js.
- The app reads the key via `process.env.NEXT_PUBLIC_GEMINI_API_KEY` (see [components/TableChat.tsx](components/TableChat.tsx)).
- Restart the dev server after editing `.env.local`.

## Usage

### Recording Voice Memos

1. Click the microphone button to start recording
2. Speak your activities or notes
3. Click the stop button to finish recording
4. Your recording will appear in the list below

### Playing Recordings

- Click the play button on any recording to listen
- Track progress with the progress bar
- Click again to pause

### Deleting Recordings

- Click the × button on any recording to remove it

### Extracting Tasks

- Click "Extract Tasks" to process recordings (backend integration needed)

## Browser Compatibility

- **Chrome/Edge**: Full support with Speech Recognition API
- **Firefox**: Fallback to audio recording (requires backend transcription)
- **Safari**: Audio recording supported

## Future Enhancements

- Backend API integration for:
  - Audio storage
  - Speech-to-text transcription
  - NLP-based task extraction
  - Calendar (.ics) generation
- Database persistence
- Task management interface
- Analytics and insights dashboard
- User authentication

## Migration Notes

This project was converted from a vanilla HTML/CSS/JavaScript application to Next.js with TypeScript:

- ✅ All UI components converted to React with TypeScript
- ✅ CSS extracted to global styles
- ✅ State management using React hooks
- ✅ VoiceToText component integrated
- ✅ Tab-based navigation implemented
- ⏳ Backend API endpoints (to be implemented)
- ⏳ Database integration (to be implemented)

## License

Private project

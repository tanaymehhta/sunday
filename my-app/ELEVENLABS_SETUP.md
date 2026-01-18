# ElevenLabs Speech-to-Text Setup Guide

## Overview
The application now uses **ElevenLabs API** for high-quality speech-to-text transcription instead of the browser's built-in Speech Recognition API.

## Benefits
- ✅ **Better accuracy** - ElevenLabs provides superior transcription quality
- ✅ **Browser compatibility** - Works in all browsers (Chrome, Firefox, Safari, Edge)
- ✅ **Language support** - 32+ languages with auto-detection
- ✅ **Professional features** - Speaker diarization, timestamps, audio event detection

---

## Setup Instructions

### 1. Get Your ElevenLabs API Key

1. Go to [ElevenLabs Settings](https://elevenlabs.io/app/settings/api-keys)
2. Sign in or create an account
3. Navigate to **API Keys** section
4. Copy your API key (it starts with `sk_`)

### 2. Add API Key to Environment Variables

Open the file `/my-app/.env.local` and replace the placeholder with your actual API key:

```bash
# ElevenLabs API key for speech-to-text transcription (server-side only)
ELEVENLABS_API_KEY=sk_your_actual_key_here
```

**Important Notes:**
- This key is used **server-side only** for security (not exposed to browser)
- Keep `.env.local` private - never commit it to Git
- The key is already in `.gitignore` by default in Next.js

### 3. Restart the Development Server

After adding your API key, restart your Next.js server:

```bash
# Stop the current server (Ctrl+C)
# Then restart:
cd my-app
npm run dev
```

---

## How It Works

### Recording Flow (Unchanged)
```
User clicks Record → MediaRecorder API → Audio Blob (WebM) → IndexedDB
```

### Transcription Flow (New - ElevenLabs)
```
User clicks Transcribe → Send to /api/transcribe → ElevenLabs API → Transcription → IndexedDB
```

### Architecture

1. **Frontend** (`hooks/useRecording.ts`):
   - User clicks "Transcribe" button
   - Audio blob sent to Next.js API route at `/api/transcribe`

2. **Backend** (`app/api/transcribe/route.ts`):
   - Receives audio from frontend
   - Forwards to ElevenLabs API with your API key
   - Returns transcription text to frontend

3. **Storage**:
   - Transcription saved to IndexedDB
   - Available for schedule generation via Gemini

---

## Testing

1. **Record a sample audio**:
   - Click the Record button
   - Speak clearly: "I need to buy groceries and go to the bank today"
   - Stop recording

2. **Transcribe the recording**:
   - Click "Transcribe" button on the recording
   - Wait for processing (should take 2-5 seconds)
   - Transcription appears below the recording

3. **Generate schedule** (existing feature):
   - Transcriptions automatically flow to Gemini for schedule generation
   - No changes needed to existing workflow

---

## Troubleshooting

### Error: "Transcription service not configured"
**Cause**: API key not set in `.env.local`

**Solution**:
1. Check that `.env.local` exists in `/my-app/` directory
2. Verify `ELEVENLABS_API_KEY=sk_...` is present
3. Restart the dev server

### Error: "Transcription failed: 401"
**Cause**: Invalid or expired API key

**Solution**:
1. Verify API key is correct (copy again from ElevenLabs dashboard)
2. Check for extra spaces or quotes in `.env.local`
3. Ensure key starts with `sk_`

### Error: "Transcription failed: 422"
**Cause**: Invalid audio format or missing parameters (already handled in code)

**Solution**: This should not happen as the code includes all required parameters (`file` and `model_id`). If it does, check browser console for details.

### No audio/transcription issues
**Cause**: Browser microphone permissions

**Solution**:
1. Check browser settings for microphone access
2. Allow microphone when prompted
3. Try recording again

---

## API Usage & Costs

- **Free Tier**: ElevenLabs offers free credits monthly
- **Pricing**: Check [ElevenLabs Pricing](https://elevenlabs.io/pricing) for current rates
- **Usage**: Each transcription consumes credits based on audio duration
- **Monitoring**: View usage in your ElevenLabs dashboard

---

## Advanced Configuration (Optional)

The API route (`app/api/transcribe/route.ts`) can be enhanced with additional ElevenLabs features:

### 1. Language Detection
Currently uses auto-detection. To force a specific language:

```typescript
elevenlabsFormData.append('language_code', 'eng'); // English
elevenlabsFormData.append('language_code', 'spa'); // Spanish
// See ElevenLabs docs for full language list
```

### 2. Speaker Diarization
Identify different speakers in the recording:

```typescript
elevenlabsFormData.append('diarize', 'true');
elevenlabsFormData.append('num_speakers', '2'); // Expected number of speakers
```

### 3. Timestamps
Get word or sentence-level timestamps:

```typescript
elevenlabsFormData.append('timestamps_granularity', 'word');
// or 'sentence'
```

### 4. Audio Event Detection
Detect laughter, applause, etc.:

```typescript
elevenlabsFormData.append('tag_audio_events', 'true');
```

---

## Files Modified

| File | Change |
|------|--------|
| `app/api/transcribe/route.ts` | ✅ **New** - API route for ElevenLabs proxy |
| `hooks/useRecording.ts` | ✅ Modified - `transcribeRecording()` function uses ElevenLabs |
| `.env.local` | ✅ Modified - Added `ELEVENLABS_API_KEY` |

**No changes to**:
- Recording functionality (MediaRecorder)
- Storage (IndexedDB)
- Playback
- UI components
- Gemini integration

---

## Rollback (If Needed)

If you need to revert to the old Speech Recognition API:

1. Open `hooks/useRecording.ts`
2. Replace the `transcribeRecording` function with the old implementation (check Git history)
3. Remove the `/api/transcribe/route.ts` file
4. Remove `ELEVENLABS_API_KEY` from `.env.local`

---

## Support

- **ElevenLabs Documentation**: https://elevenlabs.io/docs/api-reference/speech-to-text
- **API Reference**: https://elevenlabs.io/docs/api-reference/speech-to-text/convert
- **Your Notes**: See `ELEVENLABS_NOTES.md` for lessons learned during implementation

---

**Last Updated**: 2026-01-18
**Implementation**: ElevenLabs Speech-to-Text integration complete ✅

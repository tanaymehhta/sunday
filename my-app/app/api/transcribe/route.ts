import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    // 1. Get form data from client
    const formData = await request.formData();
    // @ts-expect-error - FormData.get() is available in Next.js runtime
    const audioFile = formData.get('file') as File | null;

    if (!audioFile || !(audioFile instanceof File)) {
      return NextResponse.json(
        { error: 'No audio file provided' },
        { status: 400 }
      );
    }

    // 2. Check for API key
    const apiKey = process.env.ELEVENLABS_API_KEY;
    if (!apiKey) {
      console.error('ELEVENLABS_API_KEY not configured');
      return NextResponse.json(
        { error: 'Transcription service not configured' },
        { status: 500 }
      );
    }

    // 3. Create new FormData for ElevenLabs with required parameters
    const elevenlabsFormData = new FormData();
    elevenlabsFormData.append('file', audioFile);
    elevenlabsFormData.append('model_id', 'scribe_v2'); // Required parameter

    // 4. Call ElevenLabs API
    const response = await fetch('https://api.elevenlabs.io/v1/speech-to-text', {
      method: 'POST',
      headers: {
        'xi-api-key': apiKey,
      },
      body: elevenlabsFormData,
    });

    // 5. Handle response
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('ElevenLabs API error:', errorData);
      return NextResponse.json(
        {
          error: errorData.detail?.message || 'Transcription failed',
          status: response.status
        },
        { status: response.status }
      );
    }

    const data = await response.json();

    // 6. Return transcription
    return NextResponse.json({ text: data.text });

  } catch (error) {
    console.error('API Route Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

async function retryOperation(operation: () => Promise<any>, retries: number = MAX_RETRIES): Promise<any> {
  try {
    return await operation();
  } catch (error) {
    if (retries > 0 && error instanceof Error && (error.message.includes('ECONNRESET') || error.message.includes('Connection error'))) {
      console.log(`Retrying operation. Attempts left: ${retries - 1}`);
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
      return retryOperation(operation, retries - 1);
    }
    throw error;
  }
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const audioFile = formData.get('audio') as File | null;

    if (!audioFile) {
      return NextResponse.json({ error: 'No audio file provided' }, { status: 400 });
    }

    const buffer = Buffer.from(await audioFile.arrayBuffer());

    const response = await retryOperation(async () => {
      return await openai.audio.transcriptions.create({
        file: new File([buffer], audioFile.name, { type: audioFile.type }),
        model: 'whisper-1',
      });
    });

    return NextResponse.json({ transcript: response.text });
  } catch (error: unknown) {
    console.error('Error in transcribe API:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('ECONNRESET') || error.message.includes('Connection error')) {
        return NextResponse.json({ error: 'Connection error. Please try again later.' }, { status: 503 });
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
  }
}
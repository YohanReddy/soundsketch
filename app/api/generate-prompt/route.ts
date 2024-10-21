import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: Request) {
  try {
    const { transcript } = await request.json();

    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: 'You are a helpful assistant that generates image prompts based on voice transcripts.' },
        { role: 'user', content: `Generate a detailed image prompt based on this transcript: "${transcript}"` }
      ],
    });

    const generatedPrompt = response.choices[0].message.content;
    return NextResponse.json({ prompt: generatedPrompt });
  } catch (error) {
    console.error('Error in generate-prompt API:', error);
    return NextResponse.json({ error: 'Error generating prompt' }, { status: 500 });
  }
}
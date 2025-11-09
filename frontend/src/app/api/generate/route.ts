import OpenAI from 'openai';
import { NextRequest, NextResponse } from 'next/server';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

function verifyToken(token: string | undefined): boolean {
  if (!token) return false;

  try {
    // Decode JWT token to check expiration
    const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
    const exp = payload.exp * 1000; // Convert to milliseconds
    return Date.now() < exp;
  } catch {
    return false;
  }
}

export async function POST(request: NextRequest) {
  // Check authentication
  const accessToken =
    request.cookies.get('access_token')?.value ||
    request.headers.get('authorization')?.replace('Bearer ', '');

  if (!accessToken || !verifyToken(accessToken)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { prompt, systemPrompt, currentPostText } = await request.json();

    if (!prompt) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
    }

    const messages: Array<{ role: 'system' | 'user'; content: string }> = [];

    if (systemPrompt) {
      messages.push({
        role: 'system',
        content: systemPrompt,
      });
    }

    // If currentPostText is provided, include it in the user prompt
    const userContent = currentPostText
      ? `Current post content:\n${currentPostText}\n\nUser request: ${prompt}\n\nPlease provide only the edited post content as your response, without any additional explanation or commentary.`
      : prompt;

    messages.push({
      role: 'user',
      content: userContent,
    });

    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages,
      max_tokens: 500,
    });

    const generatedText = completion.choices[0]?.message?.content || '';

    return NextResponse.json({ generatedText });
  } catch (error) {
    console.error('OpenAI API error:', error);
    return NextResponse.json({ error: 'Failed to generate content' }, { status: 500 });
  }
}

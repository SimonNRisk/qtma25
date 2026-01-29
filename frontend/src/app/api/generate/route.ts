import Anthropic from '@anthropic-ai/sdk';
import { NextRequest, NextResponse } from 'next/server';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
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

    // Input validation - prevent abuse
    if (typeof prompt !== 'string' || prompt.length > 5000) {
      return NextResponse.json(
        { error: 'Prompt must be a string and less than 5000 characters' },
        { status: 400 }
      );
    }

    if (
      currentPostText &&
      (typeof currentPostText !== 'string' || currentPostText.length > 10000)
    ) {
      return NextResponse.json(
        { error: 'Post text must be a string and less than 10000 characters' },
        { status: 400 }
      );
    }

    if (systemPrompt && (typeof systemPrompt !== 'string' || systemPrompt.length > 2000)) {
      return NextResponse.json(
        { error: 'System prompt must be a string and less than 2000 characters' },
        { status: 400 }
      );
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

    const systemMessage = messages.find(m => m.role === 'system')?.content;
    const userMessages = messages.filter(m => m.role === 'user').map(m => ({
      role: 'user' as const,
      content: m.content,
    }));

    const completion = await anthropic.messages.create({
      model: 'claude-3-haiku-20240307',
      max_tokens: 500,
      ...(systemMessage && { system: systemMessage }),
      messages: userMessages,
    });

    const generatedText = completion.content[0]?.type === 'text' ? completion.content[0].text : '';

    return NextResponse.json({ generatedText });
  } catch (error) {
    console.error('Anthropic API error:', error);
    return NextResponse.json({ error: 'Failed to generate content' }, { status: 500 });
  }
}

import Anthropic from '@anthropic-ai/sdk';
import { NextRequest, NextResponse } from 'next/server';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Channel info for context
const CHANNEL_CATEGORIES = [
  'Local', 'News', 'Sports', 'Entertainment', 'Movies',
  'Music', 'Kids', 'Documentary', 'Horror', 'Comedy'
];

const SYSTEM_PROMPT = `You are a friendly TV guide assistant for StreamVault, a streaming app with live TV channels. You help users find something to watch based on their mood, preferences, and time of day.

Available channel categories: ${CHANNEL_CATEGORIES.join(', ')}

When recommending content:
- Be conversational and fun
- Consider the time of day and mood
- Suggest specific categories or types of content
- Keep responses concise (2-3 sentences max)
- Use a casual, friendly tone
- If they mention a mood, suggest matching content types

Examples:
- "Feeling scared" → Suggest Horror category
- "Want to relax" → Suggest Documentary or Music
- "Something exciting" → Suggest Sports or Entertainment
- "Need to catch up on news" → Suggest News category

Respond with a JSON object in this format:
{
  "message": "Your conversational response",
  "suggestedCategories": ["Category1", "Category2"],
  "mood": "detected mood or null"
}`;

export async function POST(request: NextRequest) {
  try {
    const { message, context } = await request.json();

    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json(
        { error: 'AI features not configured. Add ANTHROPIC_API_KEY to environment.' },
        { status: 500 }
      );
    }

    const userContext = context ? `
Current time: ${new Date().toLocaleTimeString()}
User's recent categories: ${context.recentCategories?.join(', ') || 'None'}
Current mood: ${context.mood || 'Unknown'}
` : '';

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 256,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: `${userContext}\nUser says: "${message}"`,
        },
      ],
    });

    // Extract text from response
    const textContent = response.content.find(block => block.type === 'text');
    if (!textContent || textContent.type !== 'text') {
      throw new Error('No text response from AI');
    }

    // Try to parse as JSON, fallback to plain text
    let parsedResponse;
    try {
      parsedResponse = JSON.parse(textContent.text);
    } catch {
      parsedResponse = {
        message: textContent.text,
        suggestedCategories: [],
        mood: null,
      };
    }

    return NextResponse.json(parsedResponse);
  } catch (error) {
    console.error('AI API error:', error);
    return NextResponse.json(
      { error: 'Failed to get AI response' },
      { status: 500 }
    );
  }
}

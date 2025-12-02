import Anthropic from '@anthropic-ai/sdk';
import { NextRequest, NextResponse } from 'next/server';
import { lookupContent, formatMetadataForAI, ContentMetadata } from '@/lib/tmdb';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const SYSTEM_PROMPT = `You are a knowledgeable entertainment expert and TV guide assistant for StreamVault. You help users learn about the movies and TV shows they're watching.

You have been provided with detailed metadata about the content the user is currently watching. Use this information to answer their questions accurately and engagingly.

Guidelines:
- Be conversational, friendly, and enthusiastic about entertainment
- Give concise but informative answers (2-4 sentences usually)
- Share interesting trivia and behind-the-scenes facts when relevant
- If asked about filming locations, mention both where it was filmed AND where it's set if different
- For cast questions, mention the character names alongside actor names
- If you don't have specific information, say so honestly
- Keep responses focused on what was asked

When you don't have metadata (content is unknown):
- Acknowledge you can't identify the current content
- Offer to help if the user can provide the title
- Suggest they might be watching live/news content which doesn't have movie/show data`;

interface StreamInfoRequest {
  question: string;
  channelName: string;
  channelCategory: string;
  programTitle?: string;
  programDescription?: string;
  isPlutoChannel?: boolean;
}

export async function POST(request: NextRequest) {
  try {
    const body: StreamInfoRequest = await request.json();
    const { question, channelName, channelCategory, programTitle, programDescription, isPlutoChannel } = body;

    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json(
        { error: 'AI features not configured. Add ANTHROPIC_API_KEY to environment.' },
        { status: 500 }
      );
    }

    let contentMetadata: ContentMetadata | null = null;
    let metadataContext = '';

    // Try to look up content metadata if we have TMDB API key and a program title
    if (process.env.TMDB_API_KEY && programTitle) {
      contentMetadata = await lookupContent(programTitle, process.env.TMDB_API_KEY);

      if (contentMetadata) {
        metadataContext = formatMetadataForAI(contentMetadata);
      }
    }

    // Build the context for the AI
    const contextParts: string[] = [];

    contextParts.push(`Channel: ${channelName}`);
    contextParts.push(`Category: ${channelCategory}`);

    if (isPlutoChannel) {
      contextParts.push('Source: Pluto TV (free streaming service)');
    }

    if (programTitle) {
      contextParts.push(`Current Program: ${programTitle}`);
    }

    if (programDescription) {
      contextParts.push(`Program Description: ${programDescription}`);
    }

    if (metadataContext) {
      contextParts.push('\n--- Detailed Content Metadata ---');
      contextParts.push(metadataContext);
      contextParts.push('--- End Metadata ---');
    } else if (programTitle) {
      contextParts.push('\nNote: Could not find detailed metadata for this content in the database.');
    } else {
      contextParts.push('\nNote: No specific program information available for this channel. This may be live content or a channel without program guide data.');
    }

    const userMessage = `${contextParts.join('\n')}\n\nUser's question: "${question}"`;

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 512,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: userMessage,
        },
      ],
    });

    // Extract text from response
    const textContent = response.content.find(block => block.type === 'text');
    if (!textContent || textContent.type !== 'text') {
      throw new Error('No text response from AI');
    }

    return NextResponse.json({
      answer: textContent.text,
      hasMetadata: !!contentMetadata,
      contentTitle: contentMetadata?.title || programTitle || null,
      contentType: contentMetadata?.type || null,
      posterUrl: contentMetadata?.posterUrl || null,
      rating: contentMetadata?.rating || null,
      genres: contentMetadata?.genres || [],
    });
  } catch (error) {
    console.error('Stream info API error:', error);
    return NextResponse.json(
      { error: 'Failed to get AI response' },
      { status: 500 }
    );
  }
}

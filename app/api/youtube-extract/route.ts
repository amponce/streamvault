import { NextRequest, NextResponse } from 'next/server';

interface YouTubeChannelInfo {
  id: string;
  name: string;
  thumbnail: string;
  hlsUrl: string | null;
  isLive: boolean;
  error?: string;
}

// Extract video/channel ID from various YouTube URL formats
function parseYouTubeUrl(url: string): { type: 'video' | 'channel' | 'live'; id: string } | null {
  const patterns = [
    // Standard video URL
    { regex: /youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})/, type: 'video' as const },
    // Short URL
    { regex: /youtu\.be\/([a-zA-Z0-9_-]{11})/, type: 'video' as const },
    // Live URL
    { regex: /youtube\.com\/live\/([a-zA-Z0-9_-]{11})/, type: 'live' as const },
    // Channel live
    { regex: /youtube\.com\/@([^\/\?]+)\/live/, type: 'channel' as const },
    { regex: /youtube\.com\/channel\/([^\/\?]+)\/live/, type: 'channel' as const },
    // Channel URL
    { regex: /youtube\.com\/@([^\/\?]+)/, type: 'channel' as const },
    { regex: /youtube\.com\/channel\/([^\/\?]+)/, type: 'channel' as const },
    { regex: /youtube\.com\/c\/([^\/\?]+)/, type: 'channel' as const },
  ];

  for (const { regex, type } of patterns) {
    const match = url.match(regex);
    if (match) {
      return { type, id: match[1] };
    }
  }

  return null;
}

// Extract HLS manifest URL from YouTube page
async function extractHlsUrl(videoId: string): Promise<YouTubeChannelInfo> {
  try {
    const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;

    const response = await fetch(videoUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
      },
    });

    if (!response.ok) {
      return {
        id: videoId,
        name: 'Unknown',
        thumbnail: '',
        hlsUrl: null,
        isLive: false,
        error: `Failed to fetch: ${response.status}`,
      };
    }

    const html = await response.text();

    // Extract title
    const titleMatch = html.match(/<title>([^<]+)<\/title>/);
    let name = titleMatch ? titleMatch[1].replace(' - YouTube', '').trim() : 'Unknown';

    // Extract thumbnail
    const thumbMatch = html.match(/"thumbnail":\{"thumbnails":\[\{"url":"([^"]+)"/);
    const thumbnail = thumbMatch ? thumbMatch[1] : `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`;

    // Check if it's a live stream
    const isLive = html.includes('"isLive":true') || html.includes('"isLiveContent":true');

    // Extract HLS manifest URL
    const hlsMatch = html.match(/"hlsManifestUrl":"([^"]+)"/);
    let hlsUrl = hlsMatch ? hlsMatch[1].replace(/\\u0026/g, '&') : null;

    // If no HLS URL found but it's live, try alternate extraction
    if (!hlsUrl && isLive) {
      const altMatch = html.match(/hlsManifestUrl['":\s]+['"]([^'"]+)['"]/);
      if (altMatch) {
        hlsUrl = altMatch[1].replace(/\\u0026/g, '&');
      }
    }

    return {
      id: videoId,
      name,
      thumbnail,
      hlsUrl,
      isLive,
    };
  } catch (error) {
    return {
      id: videoId,
      name: 'Error',
      thumbnail: '',
      hlsUrl: null,
      isLive: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// Get live stream for a channel
async function getChannelLiveStream(channelId: string): Promise<YouTubeChannelInfo> {
  try {
    // Try to get the channel's live stream page
    const isHandle = !channelId.startsWith('UC');
    const channelUrl = isHandle
      ? `https://www.youtube.com/@${channelId}/live`
      : `https://www.youtube.com/channel/${channelId}/live`;

    const response = await fetch(channelUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
      redirect: 'follow',
    });

    if (!response.ok) {
      return {
        id: channelId,
        name: channelId,
        thumbnail: '',
        hlsUrl: null,
        isLive: false,
        error: 'Channel not found or not live',
      };
    }

    const html = await response.text();

    // Extract the video ID from the canonical URL
    const videoIdMatch = html.match(/\/watch\?v=([a-zA-Z0-9_-]{11})/);

    if (videoIdMatch) {
      // Get the live stream details
      return await extractHlsUrl(videoIdMatch[1]);
    }

    // Extract channel name
    const nameMatch = html.match(/"ownerChannelName":"([^"]+)"/);
    const name = nameMatch ? nameMatch[1] : channelId;

    return {
      id: channelId,
      name,
      thumbnail: '',
      hlsUrl: null,
      isLive: false,
      error: 'No live stream currently active',
    };
  } catch (error) {
    return {
      id: channelId,
      name: channelId,
      thumbnail: '',
      hlsUrl: null,
      isLive: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const url = searchParams.get('url');

  if (!url) {
    return NextResponse.json(
      { error: 'URL parameter is required' },
      { status: 400 }
    );
  }

  const parsed = parseYouTubeUrl(url);

  if (!parsed) {
    return NextResponse.json(
      { error: 'Invalid YouTube URL format' },
      { status: 400 }
    );
  }

  let result: YouTubeChannelInfo;

  if (parsed.type === 'channel') {
    result = await getChannelLiveStream(parsed.id);
  } else {
    result = await extractHlsUrl(parsed.id);
  }

  return NextResponse.json(result);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { urls } = body;

    if (!Array.isArray(urls) || urls.length === 0) {
      return NextResponse.json(
        { error: 'urls array is required' },
        { status: 400 }
      );
    }

    const results: YouTubeChannelInfo[] = [];

    for (const url of urls.slice(0, 10)) { // Limit to 10 URLs
      const parsed = parseYouTubeUrl(url);
      if (!parsed) continue;

      let result: YouTubeChannelInfo;
      if (parsed.type === 'channel') {
        result = await getChannelLiveStream(parsed.id);
      } else {
        result = await extractHlsUrl(parsed.id);
      }
      results.push(result);
    }

    return NextResponse.json({ results });
  } catch (error) {
    return NextResponse.json(
      { error: 'Invalid request body' },
      { status: 400 }
    );
  }
}

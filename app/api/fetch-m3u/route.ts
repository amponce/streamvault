import { NextRequest, NextResponse } from 'next/server';

/**
 * M3U Playlist Fetch Proxy
 * Fetches M3U playlists server-side to bypass CORS restrictions
 *
 * Usage: /api/fetch-m3u?url=<encoded-m3u-url>
 */

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get('url');

  if (!url) {
    return NextResponse.json({ error: 'Missing url parameter' }, { status: 400 });
  }

  try {
    const decodedUrl = decodeURIComponent(url);

    // Validate URL
    if (!decodedUrl.startsWith('http://') && !decodedUrl.startsWith('https://')) {
      return NextResponse.json({ error: 'Invalid URL' }, { status: 400 });
    }

    // Fetch the M3U content server-side (bypasses CORS)
    const response = await fetch(decodedUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': '*/*',
      },
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `Upstream error: ${response.status} ${response.statusText}` },
        { status: response.status }
      );
    }

    const content = await response.text();

    // Check if it's an M3U playlist or a direct HLS stream
    const isM3UPlaylist = content.includes('#EXTM3U') || content.includes('#EXTINF');
    const isHLSStream = content.includes('#EXT-X-VERSION') || content.includes('#EXT-X-TARGETDURATION') || content.includes('#EXT-X-STREAM-INF');

    // If it's a direct HLS stream (not a playlist), wrap it as a single-channel M3U
    if (isHLSStream && !isM3UPlaylist) {
      // Extract a name from the URL
      const urlObj = new URL(decodedUrl);
      const pathParts = urlObj.pathname.split('/').filter(Boolean);
      const channelId = pathParts.find(p => p.length === 24) || pathParts[pathParts.length - 2] || 'stream';
      const name = channelId.replace(/[-_]/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

      // Create a wrapper M3U playlist
      const wrappedContent = `#EXTM3U
#EXTINF:-1 tvg-id="${channelId}" tvg-name="${name}" group-title="Imported",${name}
${decodedUrl}
`;
      return new NextResponse(wrappedContent, {
        headers: {
          'Content-Type': 'audio/x-mpegurl',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, OPTIONS',
          'Cache-Control': 'max-age=300',
        },
      });
    }

    // Validate it looks like an M3U file
    if (!isM3UPlaylist) {
      return NextResponse.json(
        { error: 'Response does not appear to be a valid M3U playlist' },
        { status: 400 }
      );
    }

    return new NextResponse(content, {
      headers: {
        'Content-Type': 'audio/x-mpegurl',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Cache-Control': 'max-age=300', // Cache for 5 minutes
      },
    });
  } catch (error) {
    console.error('M3U fetch proxy error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch M3U playlist' },
      { status: 500 }
    );
  }
}

// Handle CORS preflight
export async function OPTIONS() {
  return new NextResponse(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': '*',
    },
  });
}

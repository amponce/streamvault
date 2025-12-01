import { NextRequest, NextResponse } from 'next/server';

/**
 * HLS Stream Proxy
 * Proxies HLS streams to bypass CORS restrictions
 *
 * Usage: /api/stream?url=<encoded-stream-url>
 */

// Cache for rewritten playlists (5 seconds TTL for live streams)
const playlistCache = new Map<string, { content: string; timestamp: number }>();
const PLAYLIST_CACHE_TTL = 5000;

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

    // Fetch the stream content
    const response = await fetch(decodedUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': '*/*',
        'Origin': 'https://pluto.tv',
        'Referer': 'https://pluto.tv/',
      },
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `Upstream error: ${response.status}` },
        { status: response.status }
      );
    }

    const contentType = response.headers.get('content-type') || '';

    // Check if this is an HLS playlist
    if (contentType.includes('mpegurl') ||
        contentType.includes('x-mpegurl') ||
        decodedUrl.includes('.m3u8')) {

      // Check cache first
      const cached = playlistCache.get(decodedUrl);
      if (cached && Date.now() - cached.timestamp < PLAYLIST_CACHE_TTL) {
        return new NextResponse(cached.content, {
          headers: {
            'Content-Type': 'application/vnd.apple.mpegurl',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, OPTIONS',
            'Cache-Control': 'no-cache',
          },
        });
      }

      const text = await response.text();

      // Rewrite URLs in the playlist to go through our proxy
      const baseUrl = new URL(decodedUrl);
      const proxyBaseUrl = `/api/stream?url=`;

      const rewrittenContent = rewritePlaylist(text, baseUrl, proxyBaseUrl);

      // Cache the rewritten playlist
      playlistCache.set(decodedUrl, {
        content: rewrittenContent,
        timestamp: Date.now(),
      });

      // Clean old cache entries
      cleanCache();

      return new NextResponse(rewrittenContent, {
        headers: {
          'Content-Type': 'application/vnd.apple.mpegurl',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, OPTIONS',
          'Cache-Control': 'no-cache',
        },
      });
    }

    // For video segments (.ts files) or other binary content, stream directly
    const buffer = await response.arrayBuffer();

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': contentType || 'video/mp2t',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Cache-Control': 'max-age=3600',
      },
    });
  } catch (error) {
    console.error('Stream proxy error:', error);
    return NextResponse.json(
      { error: 'Failed to proxy stream' },
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

/**
 * Rewrite URLs in HLS playlist to go through our proxy
 */
function rewritePlaylist(content: string, baseUrl: URL, proxyBaseUrl: string): string {
  const lines = content.split('\n');
  const rewrittenLines: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();

    // Skip empty lines and comments (except URI attributes)
    if (!trimmed || (trimmed.startsWith('#') && !trimmed.includes('URI='))) {
      rewrittenLines.push(line);
      continue;
    }

    // Handle lines with URI= attributes (like #EXT-X-KEY or #EXT-X-MAP)
    if (trimmed.includes('URI="')) {
      const rewritten = trimmed.replace(/URI="([^"]+)"/g, (match, uri) => {
        const absoluteUrl = resolveUrl(uri, baseUrl);
        return `URI="${proxyBaseUrl}${encodeURIComponent(absoluteUrl)}"`;
      });
      rewrittenLines.push(rewritten);
      continue;
    }

    // Handle URL lines (not starting with #)
    if (!trimmed.startsWith('#')) {
      const absoluteUrl = resolveUrl(trimmed, baseUrl);
      rewrittenLines.push(`${proxyBaseUrl}${encodeURIComponent(absoluteUrl)}`);
      continue;
    }

    rewrittenLines.push(line);
  }

  return rewrittenLines.join('\n');
}

/**
 * Resolve a potentially relative URL against a base URL
 */
function resolveUrl(url: string, baseUrl: URL): string {
  // Already absolute
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }

  // Protocol-relative
  if (url.startsWith('//')) {
    return `${baseUrl.protocol}${url}`;
  }

  // Absolute path
  if (url.startsWith('/')) {
    return `${baseUrl.protocol}//${baseUrl.host}${url}`;
  }

  // Relative path - resolve against base URL's directory
  const basePath = baseUrl.pathname.substring(0, baseUrl.pathname.lastIndexOf('/') + 1);
  return `${baseUrl.protocol}//${baseUrl.host}${basePath}${url}`;
}

/**
 * Clean old cache entries
 */
function cleanCache() {
  const now = Date.now();
  for (const [key, value] of playlistCache.entries()) {
    if (now - value.timestamp > PLAYLIST_CACHE_TTL * 10) {
      playlistCache.delete(key);
    }
  }
}

import { NextRequest, NextResponse } from 'next/server';

// Cache duration: 1 hour
const CACHE_DURATION = 60 * 60 * 1000;

interface ParsedChannel {
  id: string;
  name: string;
  group: string;
  logo: string;
  url: string;
  country: string;
}

interface CachedData {
  channels: ParsedChannel[];
  groups: string[];
  timestamp: number;
}

let cachedData: CachedData | null = null;

// Parse M3U content into channel objects
function parseM3U(content: string): ParsedChannel[] {
  const channels: ParsedChannel[] = [];
  const lines = content.split('\n');

  let currentChannel: Partial<ParsedChannel> | null = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    if (line.startsWith('#EXTINF:')) {
      // Parse channel info
      const tvgIdMatch = line.match(/tvg-id="([^"]*)"/);
      const tvgNameMatch = line.match(/tvg-name="([^"]*)"/);
      const tvgLogoMatch = line.match(/tvg-logo="([^"]*)"/);
      const groupMatch = line.match(/group-title="([^"]*)"/);
      const nameMatch = line.match(/,(.+)$/);

      // Try to extract country from tvg-id (e.g., "CNN.us" -> "US")
      const tvgId = tvgIdMatch?.[1] || '';
      const countryMatch = tvgId.match(/\.([a-z]{2})$/i);

      currentChannel = {
        id: tvgId || `ch-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        name: tvgNameMatch?.[1] || nameMatch?.[1] || 'Unknown',
        group: groupMatch?.[1] || 'Uncategorized',
        logo: tvgLogoMatch?.[1] || '',
        country: countryMatch?.[1]?.toUpperCase() || '',
      };
    } else if (line && !line.startsWith('#') && currentChannel) {
      // This is the URL line
      currentChannel.url = line;
      channels.push(currentChannel as ParsedChannel);
      currentChannel = null;
    }
  }

  return channels;
}

async function fetchIPTVData(baseUrl: string): Promise<CachedData> {
  // Return cached data if still valid
  if (cachedData && Date.now() - cachedData.timestamp < CACHE_DURATION) {
    return cachedData;
  }

  // Fetch the main iptv-org index through our proxy
  const m3uUrl = 'https://iptv-org.github.io/iptv/index.m3u';
  const proxyUrl = `${baseUrl}/api/fetch-m3u?url=${encodeURIComponent(m3uUrl)}`;

  const response = await fetch(proxyUrl);

  if (!response.ok) {
    throw new Error(`Failed to fetch M3U: ${response.status}`);
  }

  const content = await response.text();
  const channels = parseM3U(content);

  // Extract unique groups
  const groupSet = new Set<string>();
  channels.forEach(ch => {
    if (ch.group) groupSet.add(ch.group);
  });
  const groups = Array.from(groupSet).sort();

  cachedData = {
    channels,
    groups,
    timestamp: Date.now(),
  };

  return cachedData;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const query = searchParams.get('q')?.toLowerCase() || '';
    const category = searchParams.get('category')?.toLowerCase() || '';
    const country = searchParams.get('country')?.toLowerCase() || '';
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);
    const listOnly = searchParams.get('list');

    // Get base URL for internal API calls
    const protocol = request.headers.get('x-forwarded-proto') || 'http';
    const host = request.headers.get('host') || 'localhost:3000';
    const baseUrl = `${protocol}://${host}`;

    const data = await fetchIPTVData(baseUrl);

    // Return just the list of categories
    if (listOnly === 'categories') {
      return NextResponse.json({
        categories: data.groups.map(g => ({ id: g.toLowerCase(), name: g })),
      });
    }

    // Return countries (extracted from channel data)
    if (listOnly === 'countries') {
      const countrySet = new Set<string>();
      data.channels.forEach(ch => {
        if (ch.country) countrySet.add(ch.country);
      });
      const countries = Array.from(countrySet).sort().map(code => ({
        code,
        name: code,
        flag: '',
      }));
      return NextResponse.json({ countries });
    }

    // Filter channels
    let filteredChannels = data.channels.filter(channel => {
      // Search query
      if (query) {
        const searchTerms = [
          channel.name.toLowerCase(),
          channel.group.toLowerCase(),
          channel.country.toLowerCase(),
        ].join(' ');

        if (!searchTerms.includes(query)) return false;
      }

      // Category/group filter
      if (category) {
        if (!channel.group.toLowerCase().includes(category)) return false;
      }

      // Country filter
      if (country) {
        if (channel.country.toLowerCase() !== country) return false;
      }

      return true;
    });

    // Sort by name
    filteredChannels.sort((a, b) => a.name.localeCompare(b.name));

    // Get total before pagination
    const total = filteredChannels.length;

    // Apply pagination
    filteredChannels = filteredChannels.slice(offset, offset + limit);

    // Build response
    const results = filteredChannels.map(channel => ({
      id: channel.id,
      name: channel.name,
      altNames: [],
      country: channel.country,
      categories: [channel.group],
      logo: channel.logo,
      website: null,
      streams: [{
        url: channel.url,
        quality: null,
        title: null,
      }],
    }));

    return NextResponse.json({
      results,
      total,
      limit,
      offset,
      query,
      filters: { category, country },
    });
  } catch (error) {
    console.error('IPTV search error:', error);
    return NextResponse.json(
      { error: 'Failed to search IPTV channels. Try again later.' },
      { status: 500 }
    );
  }
}

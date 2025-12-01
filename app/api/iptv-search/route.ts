import { NextRequest, NextResponse } from 'next/server';

// Cache duration: 1 hour
const CACHE_DURATION = 60 * 60 * 1000;

interface IPTVChannel {
  id: string;
  name: string;
  alt_names: string[];
  network: string | null;
  owners: string[];
  country: string;
  subdivision: string | null;
  city: string | null;
  broadcast_area: string[];
  languages: string[];
  categories: string[];
  is_nsfw: boolean;
  launched: string | null;
  closed: string | null;
  replaced_by: string | null;
  website: string | null;
  logo: string;
}

interface IPTVStream {
  channel: string;
  feed: string | null;
  title: string | null;
  url: string;
  referrer: string | null;
  user_agent: string | null;
  quality: string | null;
}

interface IPTVCategory {
  id: string;
  name: string;
}

interface IPTVCountry {
  code: string;
  name: string;
  languages: string[];
  flag: string;
}

interface CachedData {
  channels: IPTVChannel[];
  streams: IPTVStream[];
  categories: IPTVCategory[];
  countries: IPTVCountry[];
  timestamp: number;
}

let cachedData: CachedData | null = null;

async function fetchIPTVData(): Promise<CachedData> {
  // Return cached data if still valid
  if (cachedData && Date.now() - cachedData.timestamp < CACHE_DURATION) {
    return cachedData;
  }

  const baseUrl = 'https://iptv-org.github.io/api';

  const [channelsRes, streamsRes, categoriesRes, countriesRes] = await Promise.all([
    fetch(`${baseUrl}/channels.json`, { next: { revalidate: 3600 } }),
    fetch(`${baseUrl}/streams.json`, { next: { revalidate: 3600 } }),
    fetch(`${baseUrl}/categories.json`, { next: { revalidate: 3600 } }),
    fetch(`${baseUrl}/countries.json`, { next: { revalidate: 3600 } }),
  ]);

  if (!channelsRes.ok || !streamsRes.ok) {
    throw new Error('Failed to fetch IPTV data');
  }

  const channels: IPTVChannel[] = await channelsRes.json();
  const streams: IPTVStream[] = await streamsRes.json();
  const categories: IPTVCategory[] = categoriesRes.ok ? await categoriesRes.json() : [];
  const countries: IPTVCountry[] = countriesRes.ok ? await countriesRes.json() : [];

  cachedData = {
    channels,
    streams,
    categories,
    countries,
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
    const listOnly = searchParams.get('list'); // 'categories' or 'countries'

    const data = await fetchIPTVData();

    // Return just the list of categories or countries
    if (listOnly === 'categories') {
      return NextResponse.json({
        categories: data.categories,
      });
    }

    if (listOnly === 'countries') {
      return NextResponse.json({
        countries: data.countries.map(c => ({
          code: c.code,
          name: c.name,
          flag: c.flag,
        })),
      });
    }

    // Create a map of channel IDs to streams
    const streamMap = new Map<string, IPTVStream[]>();
    for (const stream of data.streams) {
      const existing = streamMap.get(stream.channel) || [];
      existing.push(stream);
      streamMap.set(stream.channel, existing);
    }

    // Filter channels
    let filteredChannels = data.channels.filter(channel => {
      // Must have at least one stream
      if (!streamMap.has(channel.id)) return false;

      // Filter out NSFW unless explicitly searching for it
      if (channel.is_nsfw && !query.includes('nsfw')) return false;

      // Search query
      if (query) {
        const searchTerms = [
          channel.name.toLowerCase(),
          ...channel.alt_names.map(n => n.toLowerCase()),
          channel.network?.toLowerCase() || '',
          ...channel.categories.map(c => c.toLowerCase()),
          channel.country.toLowerCase(),
        ].join(' ');

        if (!searchTerms.includes(query)) return false;
      }

      // Category filter
      if (category) {
        const hasCategory = channel.categories.some(c =>
          c.toLowerCase() === category || c.toLowerCase().includes(category)
        );
        if (!hasCategory) return false;
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

    // Build response with stream URLs
    const results = filteredChannels.map(channel => {
      const channelStreams = streamMap.get(channel.id) || [];
      return {
        id: channel.id,
        name: channel.name,
        altNames: channel.alt_names,
        country: channel.country,
        categories: channel.categories,
        logo: channel.logo,
        website: channel.website,
        streams: channelStreams.map(s => ({
          url: s.url,
          quality: s.quality,
          title: s.title,
        })),
      };
    });

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
      { error: 'Failed to search IPTV channels' },
      { status: 500 }
    );
  }
}

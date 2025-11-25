/**
 * Pluto TV Dynamic URL Generator
 * Fetches fresh stream URLs from Pluto TV's API
 */

export interface PlutoChannel {
  id: string;
  slug: string;
  name: string;
  number: number;
  category: string;
  streamUrl: string;
  logo?: string;
}

interface PlutoAPIChannel {
  _id: string;
  slug: string;
  name: string;
  number: number;
  category: string;
  stitched?: {
    urls?: Array<{
      type: string;
      url: string;
    }>;
  };
  colorLogoPNG?: {
    path: string;
  };
  thumbnail?: {
    path: string;
  };
}

interface PlutoBootResponse {
  channels?: PlutoAPIChannel[];
  EPG?: PlutoAPIChannel[];
}

// Cache for Pluto channels with TTL
let plutoCache: {
  channels: PlutoChannel[];
  fetchedAt: number;
} | null = null;

const CACHE_TTL = 30 * 60 * 1000; // 30 minutes
// Use our API proxy to avoid CORS issues
const PLUTO_API_PROXY = '/api/pluto';

// Category mapping for Pluto channels
const categoryMapping: Record<string, string> = {
  'Movies': 'Movies',
  'Crime': 'Horror',
  'Horror': 'Horror',
  'Thrillers': 'Horror',
  'Paranormal': 'Horror',
  'Cult': 'Horror',
  'Suspense': 'Horror',
  'Action': 'Movies',
  'Drama': 'Movies',
  'Comedy': 'Comedy',
  'Romance': 'Movies',
  'Kids': 'Kids',
  'News': 'News',
  'Sports': 'Sports',
  'Music': 'Music',
  'Entertainment': 'Entertainment',
  'Latino': 'Entertainment',
  'Reality': 'Entertainment',
  'Game Shows': 'Entertainment',
  'Lifestyle': 'Entertainment',
  'Documentary': 'Documentary',
  'Science': 'Documentary',
  'Tech': 'Documentary',
};

function mapCategory(plutoCategory: string): string {
  // Check for keyword matches
  for (const [keyword, mapped] of Object.entries(categoryMapping)) {
    if (plutoCategory.toLowerCase().includes(keyword.toLowerCase())) {
      return mapped;
    }
  }
  return 'Entertainment';
}

/**
 * Generate a random device ID for Pluto API
 */
function generateDeviceId(): string {
  const chars = 'abcdef0123456789';
  let result = '';
  for (let i = 0; i < 32; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Generate a random session ID
 */
function generateSessionId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
}

/**
 * Fetch fresh Pluto TV channels via our API proxy (avoids CORS)
 */
export async function fetchPlutoChannels(): Promise<PlutoChannel[]> {
  // Return cached if still valid
  if (plutoCache && Date.now() - plutoCache.fetchedAt < CACHE_TTL) {
    console.log('Using cached Pluto channels');
    return plutoCache.channels;
  }

  try {
    console.log('Fetching Pluto channels via API proxy...');
    const response = await fetch(PLUTO_API_PROXY, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      console.error('Pluto API proxy error:', response.status);
      return [];
    }

    const data: PlutoBootResponse = await response.json();
    const channels: PlutoChannel[] = [];

    // Parse channels from response
    const apiChannels = data.channels || data.EPG || [];
    console.log(`Pluto API returned ${apiChannels.length} raw channels`);

    for (const ch of apiChannels) {
      // Find HLS stream URL
      const hlsUrl = ch.stitched?.urls?.find(u => u.type === 'hls')?.url;

      if (hlsUrl && ch.name) {
        channels.push({
          id: `pluto-${ch._id}`,
          slug: ch.slug,
          name: ch.name,
          number: ch.number || channels.length + 500,
          category: mapCategory(ch.category || 'Entertainment'),
          streamUrl: hlsUrl,
          logo: ch.colorLogoPNG?.path || ch.thumbnail?.path,
        });
      }
    }

    // Cache the results
    plutoCache = {
      channels,
      fetchedAt: Date.now(),
    };

    console.log(`Parsed ${channels.length} Pluto TV channels with stream URLs`);
    return channels;
  } catch (error) {
    console.error('Failed to fetch Pluto channels:', error);
    return [];
  }
}

/**
 * Get Pluto channels filtered by category keyword
 */
export async function getPlutoChannelsByKeyword(keyword: string): Promise<PlutoChannel[]> {
  const channels = await fetchPlutoChannels();
  const kw = keyword.toLowerCase();

  return channels.filter(ch =>
    ch.name.toLowerCase().includes(kw) ||
    ch.category.toLowerCase().includes(kw)
  );
}

/**
 * Get horror/thriller Pluto channels
 */
export async function getPlutoHorrorChannels(): Promise<PlutoChannel[]> {
  const channels = await fetchPlutoChannels();

  const horrorKeywords = [
    'horror', 'terror', 'thriller', 'paranormal', 'crime',
    'suspense', 'cult', 'scary', 'fear', 'fright', 'creepy'
  ];

  return channels.filter(ch => {
    const name = ch.name.toLowerCase();
    const cat = ch.category.toLowerCase();
    return horrorKeywords.some(kw => name.includes(kw) || cat.includes(kw));
  });
}

/**
 * Get all Pluto movie channels
 */
export async function getPlutoMovieChannels(): Promise<PlutoChannel[]> {
  const channels = await fetchPlutoChannels();

  const movieKeywords = [
    'movie', 'film', 'cinema', 'action', 'drama', 'comedy',
    'thriller', 'horror', 'romance', 'classic'
  ];

  return channels.filter(ch => {
    const name = ch.name.toLowerCase();
    const cat = ch.category.toLowerCase();
    return movieKeywords.some(kw => name.includes(kw) || cat.includes(kw)) ||
           ch.category === 'Movies';
  });
}

/**
 * Clear the Pluto cache to force refresh
 */
export function clearPlutoCache(): void {
  plutoCache = null;
}

/**
 * Check if Pluto cache is valid
 */
export function isPlutoCacheValid(): boolean {
  return plutoCache !== null && Date.now() - plutoCache.fetchedAt < CACHE_TTL;
}

/**
 * Convert PlutoChannel to the app's Channel format
 */
export function plutoToAppChannel(pluto: PlutoChannel, startNumber: number = 500): {
  id: string;
  number: number;
  name: string;
  url: string;
  category: string;
} {
  return {
    id: pluto.id,
    number: pluto.number || startNumber,
    name: pluto.name,
    url: pluto.streamUrl,
    category: pluto.category,
  };
}

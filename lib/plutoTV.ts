/**
 * Pluto TV Dynamic URL Generator
 * Fetches fresh stream URLs from Pluto TV's API
 */

export interface PlutoCurrentProgram {
  title: string;
  description?: string;
  series?: string;
  genre?: string;
  startTime: string;
  endTime: string;
}

export interface PlutoChannel {
  id: string;
  slug: string;
  name: string;
  number: number;
  category: string;
  streamUrl: string;
  logo?: string;
  currentProgram?: PlutoCurrentProgram | null;
}

interface PlutoAPIChannel {
  _id: string;
  id?: string;
  slug: string;
  name: string;
  number: number;
  category: string;
  streamUrl?: string;  // Added by our API proxy
  currentProgram?: PlutoCurrentProgram | null;  // Added by our API proxy
  stitched?: {
    urls?: Array<{
      type: string;
      url: string;
    }>;
  };
  colorLogoPNG?: { path: string };
  thumbnail?: { path: string };
  logo?: { path: string };
  featuredImage?: { path: string };
}

interface PlutoAPIResponse {
  channels?: PlutoAPIChannel[];
  sessionInfo?: {
    deviceId: string;
    sid: string;
    generatedAt: string;
  };
  source?: string;
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
 * Generate a Pluto stream URL from channel data
 */
function generateStreamUrl(ch: PlutoAPIChannel): string | null {
  // Check for pre-built stitched URL (v4/start format) - these are the working URLs
  const stitchedUrl = ch.stitched?.urls?.find(u => u.type === 'hls')?.url;
  if (stitchedUrl) {
    console.log(`Channel ${ch.name} has stitched URL`);
    return stitchedUrl;
  }

  // Build URL from channel slug (current working format)
  const channelSlug = ch.slug;
  if (channelSlug) {
    const deviceId = generateDeviceId();
    const sid = generateSessionId();
    // Use the newer stitcher-journeys endpoint
    return `https://service-stitcher-ipv4.clusters.pluto.tv/v2/stitch/hls/channel/${channelSlug}/master.m3u8?appName=web&appVersion=7.0.0&clientTime=0&deviceDNT=0&deviceId=${deviceId}&deviceType=web&deviceMake=Chrome&deviceModel=Chrome&deviceVersion=120.0.0&sid=${sid}&serverSideAds=false`;
  }

  // Fallback to channel ID if no slug
  const channelId = ch._id || ch.id;
  if (channelId) {
    const deviceId = generateDeviceId();
    const sid = generateSessionId();
    return `https://service-stitcher-ipv4.clusters.pluto.tv/v2/stitch/hls/channel/${channelId}/master.m3u8?appName=web&appVersion=7.0.0&deviceDNT=0&deviceId=${deviceId}&deviceType=web&sid=${sid}&serverSideAds=false`;
  }

  return null;
}

/**
 * Fetch fresh Pluto TV channels via our API proxy (avoids CORS)
 * The API proxy now handles URL generation with proper UUIDs
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

    const data: PlutoAPIResponse = await response.json();

    if (data.sessionInfo) {
      console.log(`Pluto session: deviceId=${data.sessionInfo.deviceId.substring(0, 8)}...`);
    }

    const apiChannels = data.channels || [];
    console.log(`Pluto API returned ${apiChannels.length} channels`);

    const channels: PlutoChannel[] = [];

    for (const ch of apiChannels) {
      if (!ch.name) continue;

      // The API proxy now provides streamUrl directly
      const streamUrl = ch.streamUrl;
      if (!streamUrl) {
        console.log(`Channel ${ch.name} has no streamUrl, skipping`);
        continue;
      }

      const channelId = ch._id || ch.id || ch.slug;
      channels.push({
        id: `pluto-${channelId}`,
        slug: ch.slug || channelId,
        name: ch.name,
        number: ch.number || channels.length + 500,
        category: mapCategory(ch.category || 'Entertainment'),
        streamUrl: streamUrl,
        logo: ch.colorLogoPNG?.path || ch.thumbnail?.path || ch.logo?.path || ch.featuredImage?.path,
        currentProgram: ch.currentProgram,
      });
    }

    // Cache the results
    plutoCache = {
      channels,
      fetchedAt: Date.now(),
    };

    console.log(`Parsed ${channels.length} Pluto TV channels with fresh URLs`);
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

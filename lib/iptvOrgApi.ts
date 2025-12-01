/**
 * IPTV-org API Integration
 * Fetches channels and streams from the iptv-org public API
 * https://github.com/iptv-org/api
 */

import { Channel } from './channels';

// API endpoints
const API_BASE = 'https://iptv-org.github.io/api';
const STREAMS_URL = `${API_BASE}/streams.json`;
const CHANNELS_URL = `${API_BASE}/channels.json`;

// Stream entry from iptv-org API
export interface IptvOrgStream {
  channel: string | null;
  feed: string | null;
  title: string;
  url: string;
  quality: string | null;
  user_agent: string | null;
  referrer: string | null;
}

// Channel entry from iptv-org API
export interface IptvOrgChannel {
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
  logo: string | null;
}

// Combined stream with channel metadata
export interface EnrichedStream {
  id: string;
  name: string;
  url: string;
  quality: string | null;
  country: string;
  languages: string[];
  categories: string[];
  logo: string | null;
  userAgent: string | null;
  referrer: string | null;
}

// Import options
export interface IptvOrgImportOptions {
  countries?: string[];      // Filter by country codes (US, GB, etc.)
  categories?: string[];     // Filter by categories (news, sports, etc.)
  languages?: string[];      // Filter by language codes
  minQuality?: string;       // Minimum quality (480p, 720p, 1080p)
  maxChannels?: number;      // Limit number of channels
  excludePluto?: boolean;    // Skip Pluto TV (we have better integration)
}

// Import result
export interface IptvOrgImportResult {
  channels: Channel[];
  stats: {
    totalStreams: number;
    matchedChannels: number;
    afterFilters: number;
    imported: number;
  };
}

// Progress callback
export type IptvOrgProgressCallback = (progress: {
  phase: 'fetching-streams' | 'fetching-channels' | 'matching' | 'filtering' | 'complete';
  current: number;
  total: number;
  message: string;
}) => void;

// Cache for API data
let streamsCache: IptvOrgStream[] | null = null;
let channelsCache: Map<string, IptvOrgChannel> | null = null;
let cacheTime: number = 0;
const CACHE_TTL = 30 * 60 * 1000; // 30 minutes

/**
 * Check if a URL is a Pluto TV stream
 */
function isPlutoStream(url: string): boolean {
  return url.includes('pluto.tv') ||
         url.includes('plutotv') ||
         url.includes('service-stitcher') ||
         url.includes('stitcher-ipv4');
}

/**
 * Parse quality string to numeric value for comparison
 */
function qualityToNumber(quality: string | null): number {
  if (!quality) return 0;
  const match = quality.match(/(\d+)/);
  return match ? parseInt(match[1], 10) : 0;
}

/**
 * Map iptv-org categories to app categories
 */
function mapCategory(categories: string[]): string {
  const catLower = categories.map(c => c.toLowerCase());

  if (catLower.some(c => c.includes('news'))) return 'News';
  if (catLower.some(c => c.includes('sport'))) return 'Sports';
  if (catLower.some(c => c.includes('movie') || c.includes('film'))) return 'Movies';
  if (catLower.some(c => c.includes('music'))) return 'Music';
  if (catLower.some(c => c.includes('kids') || c.includes('children'))) return 'Kids';
  if (catLower.some(c => c.includes('documentary'))) return 'Documentary';
  if (catLower.some(c => c.includes('comedy'))) return 'Comedy';
  if (catLower.some(c => c.includes('entertainment'))) return 'Entertainment';

  return 'Entertainment';
}

/**
 * Fetch streams from iptv-org API
 */
async function fetchStreams(signal?: AbortSignal): Promise<IptvOrgStream[]> {
  if (streamsCache && Date.now() - cacheTime < CACHE_TTL) {
    return streamsCache;
  }

  const response = await fetch(STREAMS_URL, { signal });
  if (!response.ok) {
    throw new Error(`Failed to fetch streams: ${response.status}`);
  }

  const data = await response.json();
  streamsCache = data;
  cacheTime = Date.now();
  return data;
}

/**
 * Fetch channels from iptv-org API
 */
async function fetchChannels(signal?: AbortSignal): Promise<Map<string, IptvOrgChannel>> {
  if (channelsCache && Date.now() - cacheTime < CACHE_TTL) {
    return channelsCache;
  }

  const response = await fetch(CHANNELS_URL, { signal });
  if (!response.ok) {
    throw new Error(`Failed to fetch channels: ${response.status}`);
  }

  const data: IptvOrgChannel[] = await response.json();
  const map = new Map<string, IptvOrgChannel>();

  for (const channel of data) {
    map.set(channel.id, channel);
  }

  channelsCache = map;
  return map;
}

/**
 * Get available countries from cached channel data
 */
export async function getAvailableCountries(): Promise<{ code: string; count: number }[]> {
  const channels = await fetchChannels();
  const countryCounts = new Map<string, number>();

  for (const channel of channels.values()) {
    if (channel.country) {
      const count = countryCounts.get(channel.country) || 0;
      countryCounts.set(channel.country, count + 1);
    }
  }

  return Array.from(countryCounts.entries())
    .map(([code, count]) => ({ code, count }))
    .sort((a, b) => b.count - a.count);
}

/**
 * Get available categories from cached channel data
 */
export async function getAvailableCategories(): Promise<{ name: string; count: number }[]> {
  const channels = await fetchChannels();
  const categoryCounts = new Map<string, number>();

  for (const channel of channels.values()) {
    for (const category of channel.categories) {
      const count = categoryCounts.get(category) || 0;
      categoryCounts.set(category, count + 1);
    }
  }

  return Array.from(categoryCounts.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);
}

/**
 * Import channels from iptv-org API
 */
export async function importFromIptvOrg(
  existingUrls: Set<string>,
  options: IptvOrgImportOptions = {},
  onProgress?: IptvOrgProgressCallback,
  signal?: AbortSignal
): Promise<IptvOrgImportResult> {
  const stats = {
    totalStreams: 0,
    matchedChannels: 0,
    afterFilters: 0,
    imported: 0,
  };

  // Phase 1: Fetch streams
  onProgress?.({
    phase: 'fetching-streams',
    current: 0,
    total: 1,
    message: 'Fetching streams from iptv-org...',
  });

  const streams = await fetchStreams(signal);
  stats.totalStreams = streams.length;

  // Phase 2: Fetch channels
  onProgress?.({
    phase: 'fetching-channels',
    current: 0,
    total: 1,
    message: 'Fetching channel metadata...',
  });

  const channelsMap = await fetchChannels(signal);

  // Phase 3: Match streams with channel metadata
  onProgress?.({
    phase: 'matching',
    current: 0,
    total: streams.length,
    message: 'Matching streams with channels...',
  });

  const enrichedStreams: EnrichedStream[] = [];
  let matched = 0;

  for (const stream of streams) {
    // Skip Pluto TV if requested (we have better integration)
    if (options.excludePluto !== false && isPlutoStream(stream.url)) {
      continue;
    }

    // Skip duplicates
    if (existingUrls.has(stream.url)) {
      continue;
    }

    // Try to find channel metadata
    const channel = stream.channel ? channelsMap.get(stream.channel) : null;

    enrichedStreams.push({
      id: stream.channel || `stream-${matched}`,
      name: channel?.name || stream.title,
      url: stream.url,
      quality: stream.quality,
      country: channel?.country || 'INT',
      languages: channel?.languages || [],
      categories: channel?.categories || [],
      logo: channel?.logo || null,
      userAgent: stream.user_agent,
      referrer: stream.referrer,
    });

    matched++;

    if (matched % 100 === 0) {
      onProgress?.({
        phase: 'matching',
        current: matched,
        total: streams.length,
        message: `Processing streams (${matched}/${streams.length})...`,
      });
    }
  }

  stats.matchedChannels = enrichedStreams.length;

  // Phase 4: Apply filters
  onProgress?.({
    phase: 'filtering',
    current: 0,
    total: enrichedStreams.length,
    message: 'Applying filters...',
  });

  let filtered = enrichedStreams;

  // Filter by country
  if (options.countries && options.countries.length > 0) {
    const countriesSet = new Set(options.countries.map(c => c.toUpperCase()));
    filtered = filtered.filter(s => countriesSet.has(s.country.toUpperCase()));
  }

  // Filter by category
  if (options.categories && options.categories.length > 0) {
    const catsLower = options.categories.map(c => c.toLowerCase());
    filtered = filtered.filter(s =>
      s.categories.some(cat => catsLower.includes(cat.toLowerCase()))
    );
  }

  // Filter by language
  if (options.languages && options.languages.length > 0) {
    const langsLower = options.languages.map(l => l.toLowerCase());
    filtered = filtered.filter(s =>
      s.languages.some(lang => langsLower.includes(lang.toLowerCase()))
    );
  }

  // Filter by quality
  if (options.minQuality) {
    const minQualityNum = qualityToNumber(options.minQuality);
    filtered = filtered.filter(s => qualityToNumber(s.quality) >= minQualityNum);
  }

  // Limit channels
  if (options.maxChannels && filtered.length > options.maxChannels) {
    filtered = filtered.slice(0, options.maxChannels);
  }

  stats.afterFilters = filtered.length;

  // Phase 5: Convert to app channels
  onProgress?.({
    phase: 'complete',
    current: filtered.length,
    total: filtered.length,
    message: `Import complete! ${filtered.length} channels ready.`,
  });

  const startingNumber = 600; // Start iptv-org imports at 600
  const channels: Channel[] = filtered.map((stream, index) => ({
    id: `iptv-org-${Date.now()}-${index}-${stream.id.substring(0, 20)}`,
    number: startingNumber + index,
    name: stream.name,
    url: stream.url,
    category: mapCategory(stream.categories),
  }));

  stats.imported = channels.length;

  return { channels, stats };
}

/**
 * Clear the cache
 */
export function clearIptvOrgCache(): void {
  streamsCache = null;
  channelsCache = null;
  cacheTime = 0;
}

// Quick presets for common imports
export const IMPORT_PRESETS = {
  usNews: {
    countries: ['US'],
    categories: ['news'],
    minQuality: '720p',
  } as IptvOrgImportOptions,

  usSports: {
    countries: ['US'],
    categories: ['sports'],
  } as IptvOrgImportOptions,

  usEntertainment: {
    countries: ['US'],
    categories: ['entertainment', 'general'],
    maxChannels: 50,
  } as IptvOrgImportOptions,

  ukChannels: {
    countries: ['GB'],
    maxChannels: 100,
  } as IptvOrgImportOptions,

  hdOnly: {
    minQuality: '1080p',
    maxChannels: 100,
  } as IptvOrgImportOptions,
};

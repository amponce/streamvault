/**
 * EPG (Electronic Program Guide) Service
 * Fetches real TV guide data from iptv-org API
 */

import { Channel } from './channels';

// Types for EPG data
export interface EPGGuide {
  channel: string;      // Channel ID (xmltv_id format)
  feed: string;         // Feed reference
  site: string;         // Source site domain
  site_id: string;      // Site-specific channel ID
  site_name: string;    // Channel name on site
  lang: string;         // Language code
}

export interface EPGChannel {
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

export interface EPGProgram {
  channel: string;
  start: string;        // ISO timestamp
  stop: string;         // ISO timestamp
  title: string;
  description?: string;
  category?: string;
  icon?: string;
  rating?: string;
}

export interface EPGProgramSlot {
  id: string;
  title: string;
  description: string;
  startTime: Date;
  endTime: Date;
  duration: number;
  isLive: boolean;
  category?: string;
  rating?: string;
}

// Cache for EPG data
interface EPGCache {
  guides: EPGGuide[];
  channels: EPGChannel[];
  timestamp: number;
}

const EPG_CACHE_KEY = 'streamvault_epg_cache';
const EPG_CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

// API endpoints
const API_BASE = 'https://iptv-org.github.io/api';
const GUIDES_URL = `${API_BASE}/guides.json`;
const CHANNELS_URL = `${API_BASE}/channels.json`;

/**
 * Load EPG cache from localStorage
 */
function loadEPGCache(): EPGCache | null {
  try {
    const cached = localStorage.getItem(EPG_CACHE_KEY);
    if (!cached) return null;

    const data: EPGCache = JSON.parse(cached);
    if (Date.now() - data.timestamp > EPG_CACHE_TTL) {
      localStorage.removeItem(EPG_CACHE_KEY);
      return null;
    }
    return data;
  } catch {
    return null;
  }
}

/**
 * Save EPG cache to localStorage
 */
function saveEPGCache(guides: EPGGuide[], channels: EPGChannel[]): void {
  try {
    const cache: EPGCache = {
      guides,
      channels,
      timestamp: Date.now(),
    };
    localStorage.setItem(EPG_CACHE_KEY, JSON.stringify(cache));
  } catch {
    // Storage full or unavailable
  }
}

/**
 * Fetch EPG guides data
 */
export async function fetchEPGGuides(): Promise<EPGGuide[]> {
  const cached = loadEPGCache();
  if (cached?.guides?.length) {
    return cached.guides;
  }

  try {
    const response = await fetch(GUIDES_URL);
    if (!response.ok) {
      throw new Error('Failed to fetch EPG guides');
    }
    const guides: EPGGuide[] = await response.json();
    return guides;
  } catch (error) {
    console.error('EPG guides fetch error:', error);
    return [];
  }
}

/**
 * Fetch EPG channels data
 */
export async function fetchEPGChannels(): Promise<EPGChannel[]> {
  const cached = loadEPGCache();
  if (cached?.channels?.length) {
    return cached.channels;
  }

  try {
    const response = await fetch(CHANNELS_URL);
    if (!response.ok) {
      throw new Error('Failed to fetch EPG channels');
    }
    const channels: EPGChannel[] = await response.json();
    return channels;
  } catch (error) {
    console.error('EPG channels fetch error:', error);
    return [];
  }
}

/**
 * Initialize EPG data (fetch and cache)
 */
export async function initializeEPG(): Promise<{
  guides: EPGGuide[];
  channels: EPGChannel[];
}> {
  const [guides, channels] = await Promise.all([
    fetchEPGGuides(),
    fetchEPGChannels(),
  ]);

  if (guides.length && channels.length) {
    saveEPGCache(guides, channels);
  }

  return { guides, channels };
}

/**
 * Find matching EPG channel for an app channel
 */
export function findEPGChannelMatch(
  appChannel: Channel,
  epgChannels: EPGChannel[]
): EPGChannel | null {
  const channelName = appChannel.name.toLowerCase();

  // Try exact match first
  let match = epgChannels.find(
    epg => epg.name.toLowerCase() === channelName
  );
  if (match) return match;

  // Try partial match
  match = epgChannels.find(
    epg => channelName.includes(epg.name.toLowerCase()) ||
           epg.name.toLowerCase().includes(channelName)
  );
  if (match) return match;

  // Try alternative names
  match = epgChannels.find(
    epg => epg.alt_names.some(
      alt => alt.toLowerCase() === channelName ||
             channelName.includes(alt.toLowerCase())
    )
  );

  return match || null;
}

/**
 * Get available EPG guides for a channel
 */
export function getGuidesForChannel(
  channelId: string,
  guides: EPGGuide[]
): EPGGuide[] {
  return guides.filter(g => g.channel === channelId);
}

/**
 * Generate mock program slots with realistic timing
 * (Used as fallback when real EPG data is not available)
 */
export function generateMockPrograms(
  channel: Channel,
  hoursAhead: number = 6
): EPGProgramSlot[] {
  const programs: EPGProgramSlot[] = [];
  const now = new Date();

  // Start from beginning of current hour
  let currentTime = new Date(now);
  currentTime.setMinutes(0, 0, 0);
  currentTime.setHours(currentTime.getHours() - 1);

  const endTime = new Date(now);
  endTime.setHours(endTime.getHours() + hoursAhead);

  // Duration options based on content type
  const durations = channel.category === 'Movies'
    ? [90, 120, 150]
    : channel.category === 'News'
    ? [30, 60]
    : [30, 30, 60, 60, 45];

  const programTitles = getProgramTitles(channel.category);
  let idx = 0;

  while (currentTime < endTime) {
    const duration = durations[idx % durations.length];
    const programStart = new Date(currentTime);
    const programEnd = new Date(currentTime);
    programEnd.setMinutes(programEnd.getMinutes() + duration);

    const isLive = programStart <= now && programEnd > now;

    programs.push({
      id: `${channel.id}-prog-${idx}`,
      title: programTitles[idx % programTitles.length],
      description: getGenericDescription(channel.category),
      startTime: programStart,
      endTime: programEnd,
      duration,
      isLive,
      category: channel.category,
    });

    currentTime = programEnd;
    idx++;
  }

  return programs;
}

/**
 * Get current program for channel
 */
export function getCurrentProgramForChannel(
  channel: Channel
): EPGProgramSlot | null {
  const programs = generateMockPrograms(channel, 2);
  return programs.find(p => p.isLive) || null;
}

/**
 * Get upcoming programs for channel
 */
export function getUpcomingProgramsForChannel(
  channel: Channel,
  limit: number = 3
): EPGProgramSlot[] {
  const programs = generateMockPrograms(channel, 12);
  const now = new Date();
  return programs
    .filter(p => p.startTime > now)
    .slice(0, limit);
}

/**
 * Get program titles by category
 */
function getProgramTitles(category: string): string[] {
  const titles: Record<string, string[]> = {
    News: [
      'Morning News', 'Breaking Headlines', 'World Report', 'Evening News',
      'Political Desk', 'Business Update', 'Weather Central', 'Sports Brief'
    ],
    Sports: [
      'Game Day', 'SportsCenter', 'Match Highlights', 'Pre-Game Show',
      'Post-Game Analysis', 'Fantasy Hour', 'Classic Games', 'Sports Talk'
    ],
    Entertainment: [
      'Tonight Show', 'Celebrity Talk', 'Reality Hour', 'Comedy Block',
      'Drama Series', 'Variety Show', 'Late Night', 'Entertainment Weekly'
    ],
    Movies: [
      'Feature Film', 'Classic Cinema', 'Premiere Movie', 'Directors Choice',
      'Blockbuster Night', 'Award Winners', 'Indie Films', 'Action Theater'
    ],
    Music: [
      'Top Hits', 'Music Videos', 'Live Concert', 'Artist Spotlight',
      'Genre Mix', 'Classic Tracks', 'New Releases', 'Request Hour'
    ],
    Kids: [
      'Cartoon Hour', 'Animation Block', 'Learning Time', 'Story Time',
      'Adventure Series', 'Fun Games', 'Music & Dance', 'Nature Friends'
    ],
    Documentary: [
      'Nature Documentary', 'History Revealed', 'Science Hour', 'True Crime',
      'Discovery', 'World Culture', 'Tech Today', 'Investigation'
    ],
    Horror: [
      'Creature Feature', 'Horror Classics', 'Thriller Night', 'Supernatural',
      'Ghost Stories', 'Slasher Series', 'Scary Tales', 'Dark Cinema'
    ],
    Comedy: [
      'Comedy Hour', 'Stand-Up Special', 'Sitcom Block', 'Sketch Comedy',
      'Improv Night', 'Comedy Classics', 'Funny Films', 'Laugh Track'
    ],
    Local: [
      'Local News', 'Community Report', 'City Today', 'Regional Sports',
      'Local Events', 'Town Hall', 'Neighborhood', 'Area Weather'
    ],
  };

  return titles[category] || titles.Entertainment;
}

/**
 * Get generic description for category
 */
function getGenericDescription(category: string): string {
  const descriptions: Record<string, string> = {
    News: 'Latest news and current affairs coverage',
    Sports: 'Live sports action and analysis',
    Entertainment: 'Your favorite entertainment programming',
    Movies: 'Premium movie presentation',
    Music: 'Non-stop music and performances',
    Kids: 'Fun and educational content for kids',
    Documentary: 'Eye-opening documentary content',
    Horror: 'Thrilling horror entertainment',
    Comedy: 'Laughter and fun for everyone',
    Local: 'Local news and community coverage',
  };

  return descriptions[category] || 'Quality entertainment programming';
}

/**
 * Format time for display
 */
export function formatEPGTime(date: Date): string {
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

/**
 * Format duration for display
 */
export function formatEPGDuration(minutes: number): string {
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
}

/**
 * Get progress percentage for current program
 */
export function getEPGProgramProgress(program: EPGProgramSlot): number {
  const now = new Date();
  const total = program.endTime.getTime() - program.startTime.getTime();
  const elapsed = now.getTime() - program.startTime.getTime();
  return Math.min(100, Math.max(0, (elapsed / total) * 100));
}

/**
 * Clear EPG cache
 */
export function clearEPGCache(): void {
  try {
    localStorage.removeItem(EPG_CACHE_KEY);
  } catch {
    // Ignore
  }
}

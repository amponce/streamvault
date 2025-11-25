/**
 * M3U Playlist Importer
 * Parse M3U/M3U8 playlists from URLs and convert to StreamVault channels
 */

import { Channel } from './channels';

interface M3UEntry {
  name: string;
  url: string;
  tvgId?: string;
  tvgName?: string;
  tvgLogo?: string;
  groupTitle?: string;
}

/**
 * Parse M3U playlist content into entries
 */
export function parseM3U(content: string): M3UEntry[] {
  const entries: M3UEntry[] = [];
  const lines = content.split('\n').map(line => line.trim()).filter(Boolean);

  let currentEntry: Partial<M3UEntry> = {};

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Skip header
    if (line.startsWith('#EXTM3U')) continue;

    // Parse EXTINF line
    if (line.startsWith('#EXTINF:')) {
      // Extract attributes
      const tvgIdMatch = line.match(/tvg-id="([^"]*)"/);
      const tvgNameMatch = line.match(/tvg-name="([^"]*)"/);
      const tvgLogoMatch = line.match(/tvg-logo="([^"]*)"/);
      const groupTitleMatch = line.match(/group-title="([^"]*)"/);

      // Extract channel name (after the comma)
      const nameMatch = line.match(/,(.+)$/);

      currentEntry = {
        tvgId: tvgIdMatch?.[1],
        tvgName: tvgNameMatch?.[1],
        tvgLogo: tvgLogoMatch?.[1],
        groupTitle: groupTitleMatch?.[1],
        name: nameMatch?.[1]?.trim() || 'Unknown Channel',
      };
    }
    // URL line (not a comment)
    else if (!line.startsWith('#') && (line.startsWith('http') || line.startsWith('//'))) {
      if (currentEntry.name) {
        entries.push({
          name: currentEntry.name,
          url: line.startsWith('//') ? 'https:' + line : line,
          tvgId: currentEntry.tvgId,
          tvgName: currentEntry.tvgName,
          tvgLogo: currentEntry.tvgLogo,
          groupTitle: currentEntry.groupTitle,
        });
      }
      currentEntry = {};
    }
  }

  return entries;
}

/**
 * Convert M3U entries to StreamVault Channel format
 */
export function m3uToChannels(entries: M3UEntry[], startingNumber = 300): Channel[] {
  return entries.map((entry, index) => ({
    id: `imported-${index}-${entry.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
    number: startingNumber + index,
    name: entry.tvgName || entry.name,
    url: entry.url,
    category: mapGroupToCategory(entry.groupTitle || ''),
  }));
}

/**
 * Map M3U group titles to StreamVault categories
 */
function mapGroupToCategory(groupTitle: string): string {
  const lower = groupTitle.toLowerCase();

  if (lower.includes('news')) return 'News';
  if (lower.includes('sport')) return 'Sports';
  if (lower.includes('movie') || lower.includes('film') || lower.includes('cinema')) return 'Movies';
  if (lower.includes('music') || lower.includes('mtv')) return 'Music';
  if (lower.includes('kid') || lower.includes('child') || lower.includes('cartoon') || lower.includes('disney') || lower.includes('nick')) return 'Kids';
  if (lower.includes('documentary') || lower.includes('doc') || lower.includes('history') || lower.includes('discovery') || lower.includes('nat geo')) return 'Documentary';
  if (lower.includes('horror') || lower.includes('terror') || lower.includes('thriller') || lower.includes('crime')) return 'Horror';
  if (lower.includes('comedy') || lower.includes('funny')) return 'Comedy';
  if (lower.includes('local') || lower.includes('usa') || lower.includes('us ')) return 'Local';

  return 'Entertainment';
}

/**
 * Fetch and parse M3U playlist from URL
 */
export async function fetchAndParseM3U(url: string): Promise<Channel[]> {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch: ${response.status}`);
    }

    const content = await response.text();
    const entries = parseM3U(content);
    return m3uToChannels(entries);
  } catch (error) {
    console.error('Failed to fetch M3U:', error);
    throw error;
  }
}

// Storage key for imported channels
const IMPORTED_CHANNELS_KEY = 'streamvault_imported_channels';
const IMPORTED_URLS_KEY = 'streamvault_imported_urls';

/**
 * Save imported channels to localStorage
 */
export function saveImportedChannels(channels: Channel[]): void {
  if (typeof window === 'undefined') return;

  try {
    const existing = loadImportedChannels();
    const combined = [...existing, ...channels];

    // Dedupe by URL
    const unique = combined.filter((ch, idx, arr) =>
      arr.findIndex(c => c.url === ch.url) === idx
    );

    localStorage.setItem(IMPORTED_CHANNELS_KEY, JSON.stringify(unique));
  } catch {
    // Ignore errors
  }
}

/**
 * Load imported channels from localStorage
 */
export function loadImportedChannels(): Channel[] {
  if (typeof window === 'undefined') return [];

  try {
    const saved = localStorage.getItem(IMPORTED_CHANNELS_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch {
    // Ignore errors
  }

  return [];
}

/**
 * Clear all imported channels
 */
export function clearImportedChannels(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(IMPORTED_CHANNELS_KEY);
  localStorage.removeItem(IMPORTED_URLS_KEY);
}

/**
 * Save imported URL for reference
 */
export function saveImportedUrl(url: string): void {
  if (typeof window === 'undefined') return;

  try {
    const existing = loadImportedUrls();
    if (!existing.includes(url)) {
      existing.push(url);
      localStorage.setItem(IMPORTED_URLS_KEY, JSON.stringify(existing));
    }
  } catch {
    // Ignore errors
  }
}

/**
 * Load imported URLs
 */
export function loadImportedUrls(): string[] {
  if (typeof window === 'undefined') return [];

  try {
    const saved = localStorage.getItem(IMPORTED_URLS_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch {
    // Ignore errors
  }

  return [];
}

/**
 * Popular M3U sources (community-maintained, free/legal)
 * Add your own sources to this list
 */
export const popularM3USources = [
  {
    name: 'Free-TV (All)',
    url: 'https://raw.githubusercontent.com/Free-TV/IPTV/master/playlist.m3u8',
    description: 'Community-maintained free channels',
  },
  {
    name: 'iptv-org (US)',
    url: 'https://iptv-org.github.io/iptv/countries/us.m3u',
    description: 'USA channels from iptv-org',
  },
  {
    name: 'iptv-org (Movies)',
    url: 'https://iptv-org.github.io/iptv/categories/movies.m3u',
    description: 'Movie channels worldwide',
  },
  {
    name: 'iptv-org (News)',
    url: 'https://iptv-org.github.io/iptv/categories/news.m3u',
    description: 'News channels worldwide',
  },
  {
    name: 'iptv-org (Sports)',
    url: 'https://iptv-org.github.io/iptv/categories/sports.m3u',
    description: 'Sports channels worldwide',
  },
];

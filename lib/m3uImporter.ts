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
 * Uses server-side proxy to bypass CORS for external URLs
 */
export async function fetchAndParseM3U(url: string): Promise<Channel[]> {
  try {
    // Use the server-side proxy to bypass CORS
    // This handles external M3U files that don't send CORS headers
    const proxyUrl = `/api/fetch-m3u?url=${encodeURIComponent(url)}`;

    const response = await fetch(proxyUrl);
    if (!response.ok) {
      // Try to get error message from response
      let errorMsg = `Failed to fetch: ${response.status}`;
      try {
        const errorData = await response.json();
        if (errorData.error) {
          errorMsg = errorData.error;
        }
      } catch {
        // Ignore JSON parse errors
      }
      throw new Error(errorMsg);
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
 * Sources from iptv-org and Free-TV GitHub repositories
 */
export const popularM3USources = [
  // === PLUTO TV (RECOMMENDED) ===
  {
    name: 'Pluto TV (US)',
    url: 'https://raw.githubusercontent.com/iptv-org/iptv/refs/heads/master/streams/us_pluto.m3u',
    description: 'Free streaming TV - Movies, News, Sports & more',
    category: 'all',
  },

  // === PLEX TV ===
  {
    name: 'Plex TV (US)',
    url: 'https://raw.githubusercontent.com/iptv-org/iptv/refs/heads/master/streams/us_plex.m3u',
    description: 'Free Plex streaming channels - Movies, Lifestyle & more',
    category: 'all',
  },

  // === COMMUNITY CURATED ===
  {
    name: 'USA Channels (Curated)',
    url: 'https://raw.githubusercontent.com/tdog3344/USA2/5dfa4737b1219c95be8e65c01ffa670a67a331ce/m3u',
    description: 'Curated US channels collection',
    category: 'all',
  },

  // === FREE-TV ===
  {
    name: 'Free-TV (All)',
    url: 'https://raw.githubusercontent.com/Free-TV/IPTV/master/playlist.m3u8',
    description: 'Community-maintained free channels worldwide',
    category: 'all',
  },

  // === IPTV-ORG BY CATEGORY ===
  {
    name: 'iptv-org: All Channels',
    url: 'https://iptv-org.github.io/iptv/index.m3u',
    description: 'All publicly available IPTV channels',
    category: 'all',
  },
  {
    name: 'iptv-org: Movies',
    url: 'https://iptv-org.github.io/iptv/categories/movies.m3u',
    description: 'Movie channels worldwide',
    category: 'movies',
  },
  {
    name: 'iptv-org: News',
    url: 'https://iptv-org.github.io/iptv/categories/news.m3u',
    description: 'News channels worldwide',
    category: 'news',
  },
  {
    name: 'iptv-org: Sports',
    url: 'https://iptv-org.github.io/iptv/categories/sports.m3u',
    description: 'Sports channels worldwide',
    category: 'sports',
  },
  {
    name: 'iptv-org: Entertainment',
    url: 'https://iptv-org.github.io/iptv/categories/entertainment.m3u',
    description: 'Entertainment channels worldwide',
    category: 'entertainment',
  },
  {
    name: 'iptv-org: Music',
    url: 'https://iptv-org.github.io/iptv/categories/music.m3u',
    description: 'Music channels worldwide',
    category: 'music',
  },
  {
    name: 'iptv-org: Kids',
    url: 'https://iptv-org.github.io/iptv/categories/kids.m3u',
    description: 'Kids channels worldwide',
    category: 'kids',
  },
  {
    name: 'iptv-org: Documentary',
    url: 'https://iptv-org.github.io/iptv/categories/documentary.m3u',
    description: 'Documentary channels worldwide',
    category: 'documentary',
  },
  {
    name: 'iptv-org: Comedy',
    url: 'https://iptv-org.github.io/iptv/categories/comedy.m3u',
    description: 'Comedy channels worldwide',
    category: 'comedy',
  },
  {
    name: 'iptv-org: Classic',
    url: 'https://iptv-org.github.io/iptv/categories/classic.m3u',
    description: 'Classic TV channels',
    category: 'entertainment',
  },
  {
    name: 'iptv-org: Cooking',
    url: 'https://iptv-org.github.io/iptv/categories/cooking.m3u',
    description: 'Cooking & food channels',
    category: 'entertainment',
  },
  {
    name: 'iptv-org: Lifestyle',
    url: 'https://iptv-org.github.io/iptv/categories/lifestyle.m3u',
    description: 'Lifestyle channels',
    category: 'entertainment',
  },
  {
    name: 'iptv-org: Travel',
    url: 'https://iptv-org.github.io/iptv/categories/travel.m3u',
    description: 'Travel channels',
    category: 'documentary',
  },
  {
    name: 'iptv-org: Science',
    url: 'https://iptv-org.github.io/iptv/categories/science.m3u',
    description: 'Science channels',
    category: 'documentary',
  },
  {
    name: 'iptv-org: Animation',
    url: 'https://iptv-org.github.io/iptv/categories/animation.m3u',
    description: 'Animation channels',
    category: 'kids',
  },
  {
    name: 'iptv-org: Series',
    url: 'https://iptv-org.github.io/iptv/categories/series.m3u',
    description: 'TV Series channels',
    category: 'entertainment',
  },

  // === IPTV-ORG BY COUNTRY ===
  {
    name: 'iptv-org: USA',
    url: 'https://iptv-org.github.io/iptv/countries/us.m3u',
    description: 'United States channels',
    category: 'local',
  },
  {
    name: 'iptv-org: UK',
    url: 'https://iptv-org.github.io/iptv/countries/uk.m3u',
    description: 'United Kingdom channels',
    category: 'local',
  },
  {
    name: 'iptv-org: Canada',
    url: 'https://iptv-org.github.io/iptv/countries/ca.m3u',
    description: 'Canadian channels',
    category: 'local',
  },
  {
    name: 'iptv-org: Australia',
    url: 'https://iptv-org.github.io/iptv/countries/au.m3u',
    description: 'Australian channels',
    category: 'local',
  },
  {
    name: 'iptv-org: Germany',
    url: 'https://iptv-org.github.io/iptv/countries/de.m3u',
    description: 'German channels',
    category: 'local',
  },
  {
    name: 'iptv-org: France',
    url: 'https://iptv-org.github.io/iptv/countries/fr.m3u',
    description: 'French channels',
    category: 'local',
  },
  {
    name: 'iptv-org: Spain',
    url: 'https://iptv-org.github.io/iptv/countries/es.m3u',
    description: 'Spanish channels',
    category: 'local',
  },
  {
    name: 'iptv-org: Italy',
    url: 'https://iptv-org.github.io/iptv/countries/it.m3u',
    description: 'Italian channels',
    category: 'local',
  },
  {
    name: 'iptv-org: Brazil',
    url: 'https://iptv-org.github.io/iptv/countries/br.m3u',
    description: 'Brazilian channels',
    category: 'local',
  },
  {
    name: 'iptv-org: Mexico',
    url: 'https://iptv-org.github.io/iptv/countries/mx.m3u',
    description: 'Mexican channels',
    category: 'local',
  },
  {
    name: 'iptv-org: India',
    url: 'https://iptv-org.github.io/iptv/countries/in.m3u',
    description: 'Indian channels',
    category: 'local',
  },
  {
    name: 'iptv-org: Japan',
    url: 'https://iptv-org.github.io/iptv/countries/jp.m3u',
    description: 'Japanese channels',
    category: 'local',
  },
  {
    name: 'iptv-org: South Korea',
    url: 'https://iptv-org.github.io/iptv/countries/kr.m3u',
    description: 'South Korean channels',
    category: 'local',
  },
  {
    name: 'iptv-org: China',
    url: 'https://iptv-org.github.io/iptv/countries/cn.m3u',
    description: 'Chinese channels',
    category: 'local',
  },
  {
    name: 'iptv-org: Russia',
    url: 'https://iptv-org.github.io/iptv/countries/ru.m3u',
    description: 'Russian channels',
    category: 'local',
  },
  {
    name: 'iptv-org: Albania',
    url: 'https://iptv-org.github.io/iptv/countries/al.m3u',
    description: 'Albanian channels',
    category: 'local',
  },
  {
    name: 'iptv-org: Netherlands',
    url: 'https://iptv-org.github.io/iptv/countries/nl.m3u',
    description: 'Dutch channels',
    category: 'local',
  },
  {
    name: 'iptv-org: Poland',
    url: 'https://iptv-org.github.io/iptv/countries/pl.m3u',
    description: 'Polish channels',
    category: 'local',
  },
  {
    name: 'iptv-org: Turkey',
    url: 'https://iptv-org.github.io/iptv/countries/tr.m3u',
    description: 'Turkish channels',
    category: 'local',
  },
  {
    name: 'iptv-org: Argentina',
    url: 'https://iptv-org.github.io/iptv/countries/ar.m3u',
    description: 'Argentine channels',
    category: 'local',
  },

  // === IPTV-ORG BY LANGUAGE ===
  {
    name: 'iptv-org: English',
    url: 'https://iptv-org.github.io/iptv/languages/eng.m3u',
    description: 'English language channels',
    category: 'all',
  },
  {
    name: 'iptv-org: Spanish',
    url: 'https://iptv-org.github.io/iptv/languages/spa.m3u',
    description: 'Spanish language channels',
    category: 'all',
  },
  {
    name: 'iptv-org: Portuguese',
    url: 'https://iptv-org.github.io/iptv/languages/por.m3u',
    description: 'Portuguese language channels',
    category: 'all',
  },
  {
    name: 'iptv-org: Arabic',
    url: 'https://iptv-org.github.io/iptv/languages/ara.m3u',
    description: 'Arabic language channels',
    category: 'all',
  },
  {
    name: 'iptv-org: Hindi',
    url: 'https://iptv-org.github.io/iptv/languages/hin.m3u',
    description: 'Hindi language channels',
    category: 'all',
  },
  {
    name: 'iptv-org: Chinese',
    url: 'https://iptv-org.github.io/iptv/languages/zho.m3u',
    description: 'Chinese language channels',
    category: 'all',
  },
];

/**
 * Shared channel utilities
 * Common functions used across m3uImporter and smartImport
 */

import { Channel } from './channels';

/**
 * Map M3U group titles to StreamVault categories
 */
export function mapGroupToCategory(groupTitle: string): string {
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
 * Deduplicate channels by URL
 * Keeps the first occurrence of each unique URL
 */
export function deduplicateChannels(channels: Channel[]): Channel[] {
  return channels.filter((ch, idx, arr) =>
    arr.findIndex(c => c.url === ch.url) === idx
  );
}

/**
 * Deduplicate channels by ID
 */
export function deduplicateChannelsById(channels: Channel[]): Channel[] {
  return channels.filter((ch, idx, arr) =>
    arr.findIndex(c => c.id === ch.id) === idx
  );
}

/**
 * Common M3U entry interface
 */
export interface M3UEntry {
  name: string;
  url: string;
  tvgId?: string;
  tvgName?: string;
  tvgLogo?: string;
  groupTitle?: string;
}

/**
 * Extended M3U entry with additional metadata
 */
export interface ExtendedM3UEntry extends M3UEntry {
  tvgCountry?: string;
  tvgLanguage?: string;
}

/**
 * Parse M3U playlist content into entries
 * Core parsing logic shared between basic and extended parsers
 */
export function parseM3UCore<T extends M3UEntry>(
  content: string,
  extractMetadata: (line: string, entry: Partial<T>) => Partial<T>
): T[] {
  const entries: T[] = [];
  const lines = content.split('\n').map(line => line.trim()).filter(Boolean);

  let currentEntry: Partial<T> = {};

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Skip header
    if (line.startsWith('#EXTM3U')) continue;

    // Parse EXTINF line
    if (line.startsWith('#EXTINF:')) {
      // Extract common attributes
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
      } as Partial<T>;

      // Allow extension for additional metadata
      currentEntry = extractMetadata(line, currentEntry);
    }
    // URL line (not a comment)
    else if (!line.startsWith('#') && (line.startsWith('http') || line.startsWith('//'))) {
      if (currentEntry.name) {
        entries.push({
          ...currentEntry,
          url: line.startsWith('//') ? 'https:' + line : line,
        } as T);
      }
      currentEntry = {};
    }
  }

  return entries;
}

/**
 * Parse basic M3U content
 */
export function parseM3U(content: string): M3UEntry[] {
  return parseM3UCore<M3UEntry>(content, (_, entry) => entry);
}

/**
 * Parse extended M3U content with country/language metadata
 */
export function parseM3UExtended(content: string): ExtendedM3UEntry[] {
  return parseM3UCore<ExtendedM3UEntry>(content, (line, entry) => {
    const tvgCountryMatch = line.match(/tvg-country="([^"]*)"/);
    const tvgLanguageMatch = line.match(/tvg-language="([^"]*)"/);

    return {
      ...entry,
      tvgCountry: tvgCountryMatch?.[1],
      tvgLanguage: tvgLanguageMatch?.[1],
    };
  });
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

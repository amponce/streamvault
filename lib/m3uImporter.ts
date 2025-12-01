/**
 * M3U Playlist Importer
 * Parse M3U/M3U8 playlists from URLs and convert to StreamVault channels
 */

import { Channel } from './channels';
import { parseM3U, m3uToChannels, deduplicateChannels } from './channelUtils';

// Re-export shared utilities for backwards compatibility
export { parseM3U, m3uToChannels } from './channelUtils';
export { popularM3USources } from './m3uSources';

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
    const unique = deduplicateChannels(combined);

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

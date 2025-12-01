/**
 * Smart M3U Import System
 * - Validates streams before adding
 * - Filters by country/language
 * - Refreshes Pluto TV URLs with fresh session tokens
 * - Deduplicates against existing channels
 * - Supports GitHub URLs
 */

import { Channel } from './channels';
import { fetchPlutoChannels, PlutoChannel } from './plutoTV';

// Extended M3U entry with full metadata
export interface ExtendedM3UEntry {
  name: string;
  url: string;
  tvgId?: string;
  tvgName?: string;
  tvgLogo?: string;
  tvgCountry?: string;
  tvgLanguage?: string;
  groupTitle?: string;
}

// Import options for filtering
export interface ImportOptions {
  validateStreams: boolean;
  filterCountry?: string[];  // ISO country codes to include
  filterLanguage?: string[]; // Language codes to include
  skipDuplicates: boolean;
  maxChannels?: number;
}

// Import result with stats
export interface ImportResult {
  channels: Channel[];
  stats: {
    total: number;
    validated: number;
    valid: number;
    invalid: number;
    duplicates: number;
    countryFiltered: number;
    languageFiltered: number;
  };
  errors: string[];
}

// Validation result for a single channel
export interface ValidationStatus {
  url: string;
  isValid: boolean;
  responseTime?: number;
  error?: string;
}

// Progress callback
export type ImportProgressCallback = (progress: {
  phase: 'fetching' | 'parsing' | 'refreshing' | 'validating' | 'filtering' | 'complete';
  current: number;
  total: number;
  message: string;
}) => void;

// Country name to ISO code mapping
const COUNTRY_CODES: Record<string, string> = {
  'united states': 'US', 'usa': 'US', 'america': 'US', 'us': 'US',
  'united kingdom': 'GB', 'uk': 'GB', 'britain': 'GB', 'england': 'GB',
  'canada': 'CA', 'australia': 'AU', 'germany': 'DE', 'deutschland': 'DE',
  'france': 'FR', 'spain': 'ES', 'españa': 'ES', 'italy': 'IT', 'italia': 'IT',
  'brazil': 'BR', 'brasil': 'BR', 'mexico': 'MX', 'méxico': 'MX',
  'india': 'IN', 'japan': 'JP', 'south korea': 'KR', 'korea': 'KR',
  'china': 'CN', 'russia': 'RU', 'netherlands': 'NL', 'poland': 'PL',
  'turkey': 'TR', 'argentina': 'AR', 'albania': 'AL', 'portugal': 'PT',
  'ireland': 'IE', 'sweden': 'SE', 'norway': 'NO', 'denmark': 'DK',
  'finland': 'FI', 'belgium': 'BE', 'austria': 'AT', 'switzerland': 'CH',
  'greece': 'GR', 'romania': 'RO', 'czech': 'CZ', 'hungary': 'HU',
  'ukraine': 'UA', 'israel': 'IL', 'egypt': 'EG', 'south africa': 'ZA',
  'indonesia': 'ID', 'malaysia': 'MY', 'philippines': 'PH', 'thailand': 'TH',
  'vietnam': 'VN', 'pakistan': 'PK', 'bangladesh': 'BD', 'nigeria': 'NG',
  'kenya': 'KE', 'saudi arabia': 'SA', 'uae': 'AE', 'qatar': 'QA',
};

// Cache for Pluto channels during import
let plutoChannelsCache: PlutoChannel[] | null = null;

/**
 * Check if a URL is a Pluto TV stream URL
 */
function isPlutoTVUrl(url: string): boolean {
  return url.includes('pluto.tv') ||
         url.includes('plutotv') ||
         url.includes('service-stitcher') ||
         url.includes('stitcher-ipv4');
}

/**
 * Extract channel ID from a Pluto TV URL
 */
function extractPlutoChannelId(url: string): string | null {
  // Match patterns like /channel/5d14fc31252d35decbc4080b/ or /channel/slug-name/
  const match = url.match(/\/channel\/([^\/]+)\//);
  return match ? match[1] : null;
}

/**
 * Refresh a Pluto TV URL with a fresh session token
 * Returns null if unable to find a fresh URL
 */
async function refreshPlutoUrl(url: string, channelName: string): Promise<string | null> {
  try {
    // Fetch fresh Pluto channels if not cached
    if (!plutoChannelsCache) {
      plutoChannelsCache = await fetchPlutoChannels();
    }

    if (plutoChannelsCache.length === 0) {
      console.log('Could not fetch Pluto channels for refresh');
      return null;
    }

    // Try to match by channel ID first
    const channelId = extractPlutoChannelId(url);
    if (channelId) {
      const byId = plutoChannelsCache.find(ch =>
        ch.id.includes(channelId) || ch.slug === channelId
      );
      if (byId) {
        console.log(`Refreshed Pluto URL for ${channelName} by ID match`);
        return byId.streamUrl;
      }
    }

    // Try to match by name (fuzzy)
    const normalizedName = channelName.toLowerCase().replace(/[^a-z0-9]/g, '');
    const byName = plutoChannelsCache.find(ch => {
      const plutoName = ch.name.toLowerCase().replace(/[^a-z0-9]/g, '');
      return plutoName === normalizedName ||
             plutoName.includes(normalizedName) ||
             normalizedName.includes(plutoName);
    });

    if (byName) {
      console.log(`Refreshed Pluto URL for ${channelName} by name match -> ${byName.name}`);
      return byName.streamUrl;
    }

    console.log(`Could not match Pluto channel: ${channelName}`);
    return null;
  } catch (error) {
    console.error('Error refreshing Pluto URL:', error);
    return null;
  }
}

/**
 * Refresh all Pluto TV URLs in a list of entries
 */
async function refreshPlutoUrls(
  entries: ExtendedM3UEntry[],
  onProgress?: (refreshed: number, total: number) => void
): Promise<ExtendedM3UEntry[]> {
  const plutoEntries = entries.filter(e => isPlutoTVUrl(e.url));

  if (plutoEntries.length === 0) {
    return entries;
  }

  console.log(`Found ${plutoEntries.length} Pluto TV entries to refresh`);

  // Pre-fetch Pluto channels
  plutoChannelsCache = await fetchPlutoChannels();

  let refreshed = 0;
  const refreshedUrls = new Map<string, string>();

  for (const entry of plutoEntries) {
    const freshUrl = await refreshPlutoUrl(entry.url, entry.name);
    if (freshUrl) {
      refreshedUrls.set(entry.url, freshUrl);
      refreshed++;
    }
    onProgress?.(refreshed, plutoEntries.length);
  }

  console.log(`Successfully refreshed ${refreshed}/${plutoEntries.length} Pluto URLs`);

  // Update entries with fresh URLs
  return entries.map(entry => {
    const freshUrl = refreshedUrls.get(entry.url);
    if (freshUrl) {
      return { ...entry, url: freshUrl };
    }
    return entry;
  });
}

/**
 * Convert GitHub URL to raw content URL
 */
export function convertGitHubUrl(url: string): string {
  // Already a raw URL
  if (url.includes('raw.githubusercontent.com')) {
    return url;
  }

  // GitHub blob URL: github.com/user/repo/blob/branch/path
  const blobMatch = url.match(/github\.com\/([^\/]+)\/([^\/]+)\/blob\/([^\/]+)\/(.+)/);
  if (blobMatch) {
    const [, user, repo, branch, path] = blobMatch;
    return `https://raw.githubusercontent.com/${user}/${repo}/${branch}/${path}`;
  }

  // GitHub tree URL: github.com/user/repo/tree/branch/path (directory - need index file)
  const treeMatch = url.match(/github\.com\/([^\/]+)\/([^\/]+)\/tree\/([^\/]+)\/(.+)/);
  if (treeMatch) {
    const [, user, repo, branch, path] = treeMatch;
    // Try common M3U filenames
    return `https://raw.githubusercontent.com/${user}/${repo}/${branch}/${path}/playlist.m3u8`;
  }

  // Plain GitHub repo URL
  const repoMatch = url.match(/github\.com\/([^\/]+)\/([^\/]+)\/?$/);
  if (repoMatch) {
    const [, user, repo] = repoMatch;
    // Try common M3U locations
    return `https://raw.githubusercontent.com/${user}/${repo}/master/playlist.m3u8`;
  }

  return url;
}


/**
 * Normalize country code from various formats
 */
export function normalizeCountryCode(country: string): string {
  if (!country) return '';

  const trimmed = country.trim().toLowerCase();

  // Already an ISO code (2 letters)
  if (trimmed.length === 2) {
    return trimmed.toUpperCase();
  }

  // Look up in mapping
  return COUNTRY_CODES[trimmed] || country.toUpperCase().substring(0, 2);
}

/**
 * Parse M3U content with extended metadata extraction
 */
export function parseM3UExtended(content: string): ExtendedM3UEntry[] {
  const entries: ExtendedM3UEntry[] = [];
  const lines = content.split('\n').map(line => line.trim()).filter(Boolean);

  let currentEntry: Partial<ExtendedM3UEntry> = {};

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Skip header
    if (line.startsWith('#EXTM3U')) continue;

    // Parse EXTINF line
    if (line.startsWith('#EXTINF:')) {
      // Extract all attributes
      const tvgIdMatch = line.match(/tvg-id="([^"]*)"/i);
      const tvgNameMatch = line.match(/tvg-name="([^"]*)"/i);
      const tvgLogoMatch = line.match(/tvg-logo="([^"]*)"/i);
      const tvgCountryMatch = line.match(/tvg-country="([^"]*)"/i);
      const tvgLanguageMatch = line.match(/tvg-language="([^"]*)"/i);
      const groupTitleMatch = line.match(/group-title="([^"]*)"/i);

      // Extract channel name (after the comma)
      const nameMatch = line.match(/,(.+)$/);

      currentEntry = {
        tvgId: tvgIdMatch?.[1],
        tvgName: tvgNameMatch?.[1],
        tvgLogo: tvgLogoMatch?.[1],
        tvgCountry: tvgCountryMatch?.[1],
        tvgLanguage: tvgLanguageMatch?.[1],
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
          tvgCountry: currentEntry.tvgCountry,
          tvgLanguage: currentEntry.tvgLanguage,
          groupTitle: currentEntry.groupTitle,
        });
      }
      currentEntry = {};
    }
  }

  return entries;
}

/**
 * Validate a single stream URL with timeout
 * Note: Due to CORS restrictions in browsers, many valid streams will fail validation
 * but still work in HLS.js. We use a lenient approach that assumes streams are valid
 * if we get any response at all (even CORS errors).
 */
async function validateStreamUrl(
  url: string,
  timeoutMs: number = 8000,
  signal?: AbortSignal
): Promise<ValidationStatus> {
  const startTime = performance.now();

  // Known working CDN patterns that we trust without validation
  const trustedPatterns = [
    'pluto.tv',
    'plutotv',
    'service-stitcher',
    'stitcher-ipv4',
    'samsung.wurl.com',
    'plex.wurl.com',
    'amagi.tv',
    'akamaized.net',
    'akamaihd.net',
    'tubi.io',
    'vustreams.com',
  ];

  // If URL matches trusted pattern, assume valid
  const isTrusted = trustedPatterns.some(pattern => url.includes(pattern));
  if (isTrusted) {
    return {
      url,
      isValid: true,
      responseTime: 0,
    };
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    // Combine with external signal if provided
    if (signal) {
      signal.addEventListener('abort', () => controller.abort());
    }

    const response = await fetch(url, {
      method: 'GET',
      signal: controller.signal,
      headers: { 'Accept': '*/*' },
      mode: 'cors',
    });

    clearTimeout(timeoutId);
    const responseTime = performance.now() - startTime;

    if (!response.ok) {
      // Some servers return non-200 but still work with HLS.js
      // Only mark as truly invalid for 404/410 (not found/gone)
      if (response.status === 404 || response.status === 410) {
        return { url, isValid: false, responseTime, error: `HTTP ${response.status}` };
      }
      // For other errors, give benefit of doubt
      return { url, isValid: true, responseTime };
    }

    // Check if it's actually M3U8 content
    const text = await response.text();
    const isM3U8 = text.includes('#EXTM3U') || text.includes('#EXT-X-');

    return {
      url,
      isValid: isM3U8,
      responseTime,
      error: isM3U8 ? undefined : 'Not valid M3U8',
    };
  } catch (error) {
    // CORS errors are extremely common for valid streams
    // When validation fails, assume valid and let HLS.js be the final judge
    const responseTime = performance.now() - startTime;
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';

    // Only mark as truly invalid for clear connection refused / timeout errors
    const isDefinitelyDead =
      errorMsg.includes('net::ERR_CONNECTION_REFUSED') ||
      errorMsg.includes('net::ERR_NAME_NOT_RESOLVED') ||
      errorMsg.includes('ENOTFOUND') ||
      errorMsg.includes('ECONNREFUSED');

    if (isDefinitelyDead) {
      return {
        url,
        isValid: false,
        responseTime,
        error: errorMsg,
      };
    }

    // For CORS and other errors, assume valid (HLS.js will confirm)
    return {
      url,
      isValid: true,
      responseTime,
    };
  }
}

/**
 * Validate streams in batches with concurrency control
 */
async function validateStreamsBatch(
  urls: string[],
  concurrency: number = 10,
  onProgress?: (checked: number, total: number, valid: number) => void,
  signal?: AbortSignal
): Promise<Map<string, ValidationStatus>> {
  const results = new Map<string, ValidationStatus>();
  let checked = 0;
  let valid = 0;

  for (let i = 0; i < urls.length; i += concurrency) {
    if (signal?.aborted) break;

    const batch = urls.slice(i, i + concurrency);
    const batchResults = await Promise.allSettled(
      batch.map(url => validateStreamUrl(url, 8000, signal))
    );

    for (const result of batchResults) {
      if (result.status === 'fulfilled') {
        results.set(result.value.url, result.value);
        if (result.value.isValid) valid++;
      }
      checked++;
    }

    onProgress?.(checked, urls.length, valid);

    // Small delay between batches
    if (i + concurrency < urls.length) {
      await new Promise(resolve => setTimeout(resolve, 50));
    }
  }

  return results;
}

/**
 * Map group title to app category
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
 * Smart import with validation, filtering, and deduplication
 */
export async function smartImport(
  url: string,
  existingUrls: Set<string>,
  options: ImportOptions,
  onProgress?: ImportProgressCallback,
  signal?: AbortSignal
): Promise<ImportResult> {
  const stats = {
    total: 0,
    validated: 0,
    valid: 0,
    invalid: 0,
    duplicates: 0,
    countryFiltered: 0,
    languageFiltered: 0,
  };
  const errors: string[] = [];

  // Phase 1: Fetch
  onProgress?.({ phase: 'fetching', current: 0, total: 1, message: 'Fetching playlist...' });

  // Convert GitHub URL if needed
  const fetchUrl = convertGitHubUrl(url);

  let content: string;
  try {
    const response = await fetch(fetchUrl, { signal });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    content = await response.text();
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Failed to fetch playlist';
    errors.push(msg);
    return { channels: [], stats, errors };
  }

  // Phase 2: Parse
  onProgress?.({ phase: 'parsing', current: 0, total: 1, message: 'Parsing playlist...' });

  let entries = parseM3UExtended(content);
  stats.total = entries.length;

  if (entries.length === 0) {
    errors.push('No channels found in playlist');
    return { channels: [], stats, errors };
  }

  // Phase 2.5: Refresh Pluto TV URLs with fresh session tokens
  const plutoCount = entries.filter(e => isPlutoTVUrl(e.url)).length;
  if (plutoCount > 0) {
    onProgress?.({ phase: 'refreshing', current: 0, total: plutoCount, message: `Refreshing ${plutoCount} Pluto TV URLs...` });

    entries = await refreshPlutoUrls(entries, (refreshed, total) => {
      onProgress?.({
        phase: 'refreshing',
        current: refreshed,
        total,
        message: `Refreshing Pluto URLs (${refreshed}/${total})...`
      });
    });
  }

  // Phase 3: Filter
  onProgress?.({ phase: 'filtering', current: 0, total: entries.length, message: 'Applying filters...' });

  let filteredEntries = entries;

  // Filter by country
  if (options.filterCountry && options.filterCountry.length > 0) {
    const countryCodes = new Set(options.filterCountry.map(c => c.toUpperCase()));
    const beforeCountry = filteredEntries.length;
    filteredEntries = filteredEntries.filter(e => {
      if (!e.tvgCountry) return true; // Include if no country specified
      const normalized = normalizeCountryCode(e.tvgCountry);
      return countryCodes.has(normalized);
    });
    stats.countryFiltered = beforeCountry - filteredEntries.length;
  }

  // Filter by language
  if (options.filterLanguage && options.filterLanguage.length > 0) {
    const langCodes = new Set(options.filterLanguage.map(l => l.toLowerCase()));
    const beforeLang = filteredEntries.length;
    filteredEntries = filteredEntries.filter(e => {
      if (!e.tvgLanguage) return true; // Include if no language specified
      return langCodes.has(e.tvgLanguage.toLowerCase());
    });
    stats.languageFiltered = beforeLang - filteredEntries.length;
  }

  // Filter duplicates
  if (options.skipDuplicates) {
    const beforeDupes = filteredEntries.length;
    filteredEntries = filteredEntries.filter(e => !existingUrls.has(e.url));
    stats.duplicates = beforeDupes - filteredEntries.length;
  }

  // Limit channels
  if (options.maxChannels && filteredEntries.length > options.maxChannels) {
    filteredEntries = filteredEntries.slice(0, options.maxChannels);
  }

  // Phase 4: Validate streams
  if (options.validateStreams && filteredEntries.length > 0) {
    onProgress?.({ phase: 'validating', current: 0, total: filteredEntries.length, message: 'Validating streams...' });

    const urlsToValidate = filteredEntries.map(e => e.url);
    const validationResults = await validateStreamsBatch(
      urlsToValidate,
      10,
      (checked, total, valid) => {
        stats.validated = checked;
        stats.valid = valid;
        stats.invalid = checked - valid;
        onProgress?.({
          phase: 'validating',
          current: checked,
          total,
          message: `Validated ${checked}/${total} (${valid} working)`,
        });
      },
      signal
    );

    // Filter to only valid streams
    filteredEntries = filteredEntries.filter(e => {
      const result = validationResults.get(e.url);
      return result?.isValid !== false;
    });

    stats.valid = filteredEntries.length;
    stats.invalid = urlsToValidate.length - filteredEntries.length;
  }

  // Phase 5: Convert to channels
  onProgress?.({ phase: 'complete', current: filteredEntries.length, total: filteredEntries.length, message: 'Import complete!' });

  const startingNumber = 400; // Start imported channels at 400
  const channels: Channel[] = filteredEntries.map((entry, index) => ({
    id: `imported-${Date.now()}-${index}-${entry.name.toLowerCase().replace(/[^a-z0-9]/g, '-').substring(0, 30)}`,
    number: startingNumber + index,
    name: entry.tvgName || entry.name,
    url: entry.url,
    category: mapGroupToCategory(entry.groupTitle || ''),
  }));

  return { channels, stats, errors };
}

/**
 * Get unique countries from M3U entries
 */
export function extractCountries(content: string): string[] {
  const entries = parseM3UExtended(content);
  const countries = new Set<string>();

  for (const entry of entries) {
    if (entry.tvgCountry) {
      const normalized = normalizeCountryCode(entry.tvgCountry);
      if (normalized) countries.add(normalized);
    }
  }

  return Array.from(countries).sort();
}

/**
 * Get unique languages from M3U entries
 */
export function extractLanguages(content: string): string[] {
  const entries = parseM3UExtended(content);
  const languages = new Set<string>();

  for (const entry of entries) {
    if (entry.tvgLanguage) {
      languages.add(entry.tvgLanguage.toLowerCase());
    }
  }

  return Array.from(languages).sort();
}

// Available countries for filtering (common ones)
export const AVAILABLE_COUNTRIES = [
  { code: 'US', name: 'United States' },
  { code: 'GB', name: 'United Kingdom' },
  { code: 'CA', name: 'Canada' },
  { code: 'AU', name: 'Australia' },
  { code: 'DE', name: 'Germany' },
  { code: 'FR', name: 'France' },
  { code: 'ES', name: 'Spain' },
  { code: 'IT', name: 'Italy' },
  { code: 'BR', name: 'Brazil' },
  { code: 'MX', name: 'Mexico' },
  { code: 'IN', name: 'India' },
  { code: 'JP', name: 'Japan' },
  { code: 'KR', name: 'South Korea' },
  { code: 'CN', name: 'China' },
  { code: 'RU', name: 'Russia' },
  { code: 'NL', name: 'Netherlands' },
  { code: 'PL', name: 'Poland' },
  { code: 'TR', name: 'Turkey' },
  { code: 'AR', name: 'Argentina' },
  { code: 'AL', name: 'Albania' },
];

// Available languages for filtering
export const AVAILABLE_LANGUAGES = [
  { code: 'eng', name: 'English' },
  { code: 'spa', name: 'Spanish' },
  { code: 'por', name: 'Portuguese' },
  { code: 'fra', name: 'French' },
  { code: 'deu', name: 'German' },
  { code: 'ita', name: 'Italian' },
  { code: 'ara', name: 'Arabic' },
  { code: 'hin', name: 'Hindi' },
  { code: 'zho', name: 'Chinese' },
  { code: 'jpn', name: 'Japanese' },
  { code: 'kor', name: 'Korean' },
  { code: 'rus', name: 'Russian' },
];

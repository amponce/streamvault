/**
 * Async Stream Validator
 * Validates m3u8 streams in the background and filters out dead links
 */

import { Channel } from './channels';

export interface ValidationResult {
  channelId: string;
  isValid: boolean;
  error?: string;
  responseTime?: number;
  checkedAt: number;
}

export interface ValidationProgress {
  total: number;
  checked: number;
  valid: number;
  invalid: number;
  inProgress: boolean;
}

// Validation cache with persistence
const VALIDATION_CACHE_KEY = 'streamvault_validation_cache';
const VALIDATION_TTL = 60 * 60 * 1000; // 1 hour
const CHECK_TIMEOUT = 10000; // 10 seconds per stream
const MAX_CONCURRENT = 5; // Limit concurrent checks to avoid overwhelming

// In-memory cache
let validationCache: Map<string, ValidationResult> = new Map();
let validationInProgress = false;
let abortController: AbortController | null = null;

/**
 * Load validation cache from localStorage
 */
export function loadValidationCache(): Map<string, ValidationResult> {
  if (typeof window === 'undefined') return new Map();

  try {
    const saved = localStorage.getItem(VALIDATION_CACHE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved) as ValidationResult[];
      const now = Date.now();

      // Filter out expired entries
      const valid = parsed.filter(r => (now - r.checkedAt) < VALIDATION_TTL);
      validationCache = new Map(valid.map(r => [r.channelId, r]));
      return validationCache;
    }
  } catch {
    // Ignore errors
  }

  return new Map();
}

/**
 * Save validation cache to localStorage
 */
function saveValidationCache(): void {
  if (typeof window === 'undefined') return;

  try {
    const entries = Array.from(validationCache.values());
    localStorage.setItem(VALIDATION_CACHE_KEY, JSON.stringify(entries));
  } catch {
    // Ignore errors
  }
}

/**
 * Validate a single stream URL by attempting to fetch the m3u8 manifest
 */
async function validateStream(
  channel: Channel,
  signal?: AbortSignal
): Promise<ValidationResult> {
  const startTime = performance.now();
  const now = Date.now();

  try {
    // Create timeout for this specific request
    const timeoutId = setTimeout(() => {
      // We can't abort individual fetches with shared signal, so we'll rely on fetch timeout
    }, CHECK_TIMEOUT);

    // Try to fetch the manifest
    const response = await fetch(channel.url, {
      method: 'GET',
      signal,
      headers: {
        // Try common headers that might help
        'Accept': '*/*',
      },
      // Use cors mode to actually see the response
      mode: 'cors',
    });

    clearTimeout(timeoutId);
    const responseTime = performance.now() - startTime;

    if (!response.ok) {
      return {
        channelId: channel.id,
        isValid: false,
        error: `HTTP ${response.status}`,
        responseTime,
        checkedAt: now,
      };
    }

    // Try to read the content to verify it's actually an m3u8
    const text = await response.text();
    const isM3U8 = text.includes('#EXTM3U') || text.includes('#EXT-X-');

    return {
      channelId: channel.id,
      isValid: isM3U8,
      error: isM3U8 ? undefined : 'Not a valid m3u8',
      responseTime,
      checkedAt: now,
    };
  } catch (error) {
    // CORS errors are common - try no-cors as fallback
    try {
      const noCorsResponse = await fetch(channel.url, {
        method: 'HEAD',
        signal,
        mode: 'no-cors',
      });

      // With no-cors, we can't read the response, but if it doesn't throw,
      // the server at least responded. Mark as "unknown" but assume valid
      // since many streams block CORS but work in video players
      return {
        channelId: channel.id,
        isValid: true, // Assume valid - let HLS.js be the final judge
        error: undefined,
        responseTime: performance.now() - startTime,
        checkedAt: now,
      };
    } catch {
      // Complete failure
      return {
        channelId: channel.id,
        isValid: false,
        error: error instanceof Error ? error.message : 'Network error',
        responseTime: performance.now() - startTime,
        checkedAt: now,
      };
    }
  }
}

/**
 * Validate channels in batches with progress callback
 */
export async function validateChannels(
  channels: Channel[],
  onProgress?: (progress: ValidationProgress) => void,
  options?: { force?: boolean; skipCached?: boolean }
): Promise<Map<string, ValidationResult>> {
  if (validationInProgress) {
    console.warn('Validation already in progress');
    return validationCache;
  }

  validationInProgress = true;
  abortController = new AbortController();

  // Load existing cache
  loadValidationCache();

  const now = Date.now();
  const results = new Map<string, ValidationResult>();
  let checked = 0;
  let valid = 0;
  let invalid = 0;

  // Filter channels that need checking
  const channelsToCheck = channels.filter(channel => {
    if (options?.force) return true;

    const cached = validationCache.get(channel.id);
    if (cached && (now - cached.checkedAt) < VALIDATION_TTL) {
      // Use cached result
      results.set(channel.id, cached);
      if (cached.isValid) valid++;
      else invalid++;
      checked++;
      return false;
    }
    return true;
  });

  // Report initial progress with cached results
  onProgress?.({
    total: channels.length,
    checked,
    valid,
    invalid,
    inProgress: true,
  });

  // Process in batches
  for (let i = 0; i < channelsToCheck.length; i += MAX_CONCURRENT) {
    if (abortController.signal.aborted) break;

    const batch = channelsToCheck.slice(i, i + MAX_CONCURRENT);

    // Add timeout for the entire batch
    const batchPromises = batch.map(async channel => {
      const timeoutPromise = new Promise<ValidationResult>((_, reject) => {
        setTimeout(() => reject(new Error('Timeout')), CHECK_TIMEOUT);
      });

      try {
        return await Promise.race([
          validateStream(channel, abortController!.signal),
          timeoutPromise,
        ]);
      } catch {
        return {
          channelId: channel.id,
          isValid: false,
          error: 'Timeout',
          checkedAt: Date.now(),
        };
      }
    });

    const batchResults = await Promise.allSettled(batchPromises);

    for (const result of batchResults) {
      if (result.status === 'fulfilled') {
        const validationResult = result.value;
        results.set(validationResult.channelId, validationResult);
        validationCache.set(validationResult.channelId, validationResult);

        if (validationResult.isValid) valid++;
        else invalid++;
      }
      checked++;
    }

    // Report progress
    onProgress?.({
      total: channels.length,
      checked,
      valid,
      invalid,
      inProgress: true,
    });

    // Small delay between batches to be nice to servers
    if (i + MAX_CONCURRENT < channelsToCheck.length) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  // Save cache
  saveValidationCache();

  validationInProgress = false;
  abortController = null;

  // Final progress update
  onProgress?.({
    total: channels.length,
    checked,
    valid,
    invalid,
    inProgress: false,
  });

  return results;
}

/**
 * Stop any in-progress validation
 */
export function stopValidation(): void {
  if (abortController) {
    abortController.abort();
    abortController = null;
  }
  validationInProgress = false;
}

/**
 * Get cached validation result for a channel
 */
export function getCachedValidation(channelId: string): ValidationResult | undefined {
  return validationCache.get(channelId);
}

/**
 * Check if validation is currently in progress
 */
export function isValidationInProgress(): boolean {
  return validationInProgress;
}

/**
 * Clear all validation cache
 */
export function clearValidationCache(): void {
  validationCache.clear();
  if (typeof window !== 'undefined') {
    localStorage.removeItem(VALIDATION_CACHE_KEY);
  }
}

/**
 * Filter channels to only include valid ones
 */
export function filterValidChannels(
  channels: Channel[],
  results: Map<string, ValidationResult>
): Channel[] {
  return channels.filter(channel => {
    const result = results.get(channel.id);
    // Include if not checked or if valid
    return !result || result.isValid;
  });
}

/**
 * Get invalid channels from results
 */
export function getInvalidChannels(
  channels: Channel[],
  results: Map<string, ValidationResult>
): Channel[] {
  return channels.filter(channel => {
    const result = results.get(channel.id);
    return result && !result.isValid;
  });
}

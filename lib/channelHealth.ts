/**
 * Smart Channel Health Checker
 * Validates streams in the background and filters out dead channels
 */

import { Channel } from './channels';

export interface ChannelStatus {
  id: string;
  isLive: boolean;
  lastChecked: number;
  responseTime?: number;
  errorCount: number;
}

// Cache for channel status with TTL
const statusCache = new Map<string, ChannelStatus>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
const MAX_CONCURRENT_CHECKS = 10;
const CHECK_TIMEOUT = 8000; // 8 seconds

/**
 * Check if a single channel stream is available
 */
export async function checkChannelHealth(channel: Channel): Promise<ChannelStatus> {
  const cached = statusCache.get(channel.id);
  const now = Date.now();

  // Return cached result if still valid
  if (cached && (now - cached.lastChecked) < CACHE_TTL) {
    return cached;
  }

  const startTime = performance.now();

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), CHECK_TIMEOUT);

    // Try to fetch just the manifest headers
    const response = await fetch(channel.url, {
      method: 'HEAD',
      signal: controller.signal,
      mode: 'no-cors', // Many streams don't support CORS
    });

    clearTimeout(timeoutId);
    const responseTime = performance.now() - startTime;

    // For no-cors, we can't read status, but if it doesn't throw, it's likely working
    const status: ChannelStatus = {
      id: channel.id,
      isLive: true,
      lastChecked: now,
      responseTime,
      errorCount: 0,
    };

    statusCache.set(channel.id, status);
    return status;
  } catch {
    // Mark as potentially dead
    const prevStatus = statusCache.get(channel.id);
    const errorCount = (prevStatus?.errorCount || 0) + 1;

    const status: ChannelStatus = {
      id: channel.id,
      isLive: errorCount < 3, // Give it 3 chances
      lastChecked: now,
      errorCount,
    };

    statusCache.set(channel.id, status);
    return status;
  }
}

/**
 * Batch check multiple channels with concurrency limit
 */
export async function checkChannelsBatch(
  channels: Channel[],
  onProgress?: (checked: number, total: number) => void
): Promise<Map<string, ChannelStatus>> {
  const results = new Map<string, ChannelStatus>();
  let checked = 0;

  // Process in batches
  for (let i = 0; i < channels.length; i += MAX_CONCURRENT_CHECKS) {
    const batch = channels.slice(i, i + MAX_CONCURRENT_CHECKS);
    const batchResults = await Promise.all(
      batch.map(channel => checkChannelHealth(channel))
    );

    batchResults.forEach(status => {
      results.set(status.id, status);
    });

    checked += batch.length;
    onProgress?.(checked, channels.length);
  }

  return results;
}

/**
 * Get cached status for a channel
 */
export function getCachedStatus(channelId: string): ChannelStatus | undefined {
  return statusCache.get(channelId);
}

/**
 * Clear all cached status
 */
export function clearStatusCache(): void {
  statusCache.clear();
}

/**
 * Get all live channels from a list
 */
export function filterLiveChannels(
  channels: Channel[],
  statusMap: Map<string, ChannelStatus>
): Channel[] {
  return channels.filter(channel => {
    const status = statusMap.get(channel.id);
    return !status || status.isLive;
  });
}

/**
 * Sort channels by response time (fastest first)
 */
export function sortByResponseTime(
  channels: Channel[],
  statusMap: Map<string, ChannelStatus>
): Channel[] {
  return [...channels].sort((a, b) => {
    const statusA = statusMap.get(a.id);
    const statusB = statusMap.get(b.id);
    const timeA = statusA?.responseTime ?? Infinity;
    const timeB = statusB?.responseTime ?? Infinity;
    return timeA - timeB;
  });
}

// LocalStorage helpers for persistent broken channel tracking
const BROKEN_CHANNELS_KEY = 'streamvault_broken_channels';
const BROKEN_TIMESTAMP_KEY = 'streamvault_broken_timestamp';
const BROKEN_TTL = 30 * 60 * 1000; // 30 minutes

export function loadBrokenChannels(): Set<string> {
  if (typeof window === 'undefined') return new Set();

  try {
    const timestamp = localStorage.getItem(BROKEN_TIMESTAMP_KEY);
    if (timestamp && Date.now() - parseInt(timestamp) > BROKEN_TTL) {
      // Clear old data
      localStorage.removeItem(BROKEN_CHANNELS_KEY);
      localStorage.removeItem(BROKEN_TIMESTAMP_KEY);
      return new Set();
    }

    const saved = localStorage.getItem(BROKEN_CHANNELS_KEY);
    if (saved) {
      return new Set(JSON.parse(saved));
    }
  } catch {
    // Ignore errors
  }

  return new Set();
}

export function saveBrokenChannel(channelId: string): void {
  if (typeof window === 'undefined') return;

  try {
    const existing = loadBrokenChannels();
    existing.add(channelId);
    localStorage.setItem(BROKEN_CHANNELS_KEY, JSON.stringify([...existing]));
    localStorage.setItem(BROKEN_TIMESTAMP_KEY, Date.now().toString());
  } catch {
    // Ignore errors
  }
}

export function clearBrokenChannels(): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.removeItem(BROKEN_CHANNELS_KEY);
    localStorage.removeItem(BROKEN_TIMESTAMP_KEY);
  } catch {
    // Ignore errors
  }
}

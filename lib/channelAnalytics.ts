/**
 * Channel Analytics & Tracking Service
 * Tracks viewing patterns for trending and related channel features
 */

import { Channel } from './channels';

// Types
export interface ViewSession {
  channelId: string;
  startTime: number;
  duration: number;  // seconds
  date: string;      // YYYY-MM-DD
}

export interface ChannelStats {
  channelId: string;
  totalViews: number;
  totalDuration: number;  // seconds
  lastWatched: number;
  viewsByDay: Record<string, number>;
}

export interface RelatedChannel {
  channelId: string;
  score: number;  // Co-viewing score
}

// Storage keys
const ANALYTICS_KEY = 'streamvault_analytics';
const SESSIONS_KEY = 'streamvault_view_sessions';
const RELATED_KEY = 'streamvault_related_channels';

// Session tracking
let currentSession: { channelId: string; startTime: number } | null = null;

/**
 * Start a viewing session
 */
export function startViewSession(channelId: string): void {
  // End any existing session first
  if (currentSession) {
    endViewSession();
  }

  currentSession = {
    channelId,
    startTime: Date.now(),
  };
}

/**
 * End the current viewing session
 */
export function endViewSession(): void {
  if (!currentSession) return;

  const duration = Math.floor((Date.now() - currentSession.startTime) / 1000);

  // Only record if watched for more than 10 seconds
  if (duration >= 10) {
    const session: ViewSession = {
      channelId: currentSession.channelId,
      startTime: currentSession.startTime,
      duration,
      date: new Date().toISOString().split('T')[0],
    };

    saveSession(session);
    updateChannelStats(session);
    updateRelatedChannels(session.channelId);
  }

  currentSession = null;
}

/**
 * Save a viewing session
 */
function saveSession(session: ViewSession): void {
  try {
    const sessions = getSessions();
    sessions.push(session);

    // Keep last 500 sessions only
    const trimmed = sessions.slice(-500);
    localStorage.setItem(SESSIONS_KEY, JSON.stringify(trimmed));
  } catch {
    // Storage full
  }
}

/**
 * Get all sessions
 */
function getSessions(): ViewSession[] {
  try {
    const data = localStorage.getItem(SESSIONS_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

/**
 * Update channel statistics
 */
function updateChannelStats(session: ViewSession): void {
  try {
    const stats = getChannelStats();
    const existing = stats[session.channelId] || {
      channelId: session.channelId,
      totalViews: 0,
      totalDuration: 0,
      lastWatched: 0,
      viewsByDay: {},
    };

    existing.totalViews += 1;
    existing.totalDuration += session.duration;
    existing.lastWatched = session.startTime;
    existing.viewsByDay[session.date] = (existing.viewsByDay[session.date] || 0) + 1;

    stats[session.channelId] = existing;
    localStorage.setItem(ANALYTICS_KEY, JSON.stringify(stats));
  } catch {
    // Storage full
  }
}

/**
 * Get channel statistics
 */
function getChannelStats(): Record<string, ChannelStats> {
  try {
    const data = localStorage.getItem(ANALYTICS_KEY);
    return data ? JSON.parse(data) : {};
  } catch {
    return {};
  }
}

/**
 * Update related channels based on co-viewing patterns
 */
function updateRelatedChannels(currentChannelId: string): void {
  try {
    const sessions = getSessions();
    const related = getRelatedChannelsData();

    // Get recent sessions (last 2 hours of the session timeline)
    const recentSessions = sessions.slice(-20);

    // Find channels watched in the same session window
    const nearbyChannels = recentSessions
      .filter(s => s.channelId !== currentChannelId)
      .map(s => s.channelId);

    // Update scores
    if (!related[currentChannelId]) {
      related[currentChannelId] = {};
    }

    nearbyChannels.forEach(relatedId => {
      related[currentChannelId][relatedId] = (related[currentChannelId][relatedId] || 0) + 1;

      // Bidirectional relationship
      if (!related[relatedId]) {
        related[relatedId] = {};
      }
      related[relatedId][currentChannelId] = (related[relatedId][currentChannelId] || 0) + 1;
    });

    localStorage.setItem(RELATED_KEY, JSON.stringify(related));
  } catch {
    // Storage full
  }
}

/**
 * Get related channels data
 */
function getRelatedChannelsData(): Record<string, Record<string, number>> {
  try {
    const data = localStorage.getItem(RELATED_KEY);
    return data ? JSON.parse(data) : {};
  } catch {
    return {};
  }
}

/**
 * Get related channels for a channel
 */
export function getRelatedChannels(
  channelId: string,
  allChannels: Channel[],
  limit: number = 6
): Channel[] {
  const related = getRelatedChannelsData();
  const channelRelations = related[channelId] || {};

  // Sort by score
  const sortedIds = Object.entries(channelRelations)
    .sort(([, a], [, b]) => b - a)
    .slice(0, limit)
    .map(([id]) => id);

  // Map to actual channels
  const relatedChannels = sortedIds
    .map(id => allChannels.find(ch => ch.id === id))
    .filter((ch): ch is Channel => ch !== undefined);

  // If not enough related channels, fill with same category
  if (relatedChannels.length < limit) {
    const currentChannel = allChannels.find(ch => ch.id === channelId);
    if (currentChannel) {
      const sameCategory = allChannels
        .filter(ch =>
          ch.category === currentChannel.category &&
          ch.id !== channelId &&
          !relatedChannels.some(r => r.id === ch.id)
        )
        .slice(0, limit - relatedChannels.length);

      relatedChannels.push(...sameCategory);
    }
  }

  return relatedChannels;
}

/**
 * Get trending channels (most watched recently)
 */
export function getTrendingChannels(
  allChannels: Channel[],
  limit: number = 10
): Channel[] {
  const stats = getChannelStats();
  const now = Date.now();
  const weekAgo = now - 7 * 24 * 60 * 60 * 1000;

  // Calculate trending score (views weighted by recency)
  const scores: { channelId: string; score: number }[] = Object.values(stats)
    .filter(s => s.lastWatched > weekAgo)
    .map(s => {
      // Recency factor (1.0 for today, decreasing over time)
      const recencyFactor = Math.max(0, 1 - (now - s.lastWatched) / (7 * 24 * 60 * 60 * 1000));

      // Score = views * duration_factor * recency
      const durationFactor = Math.min(2, s.totalDuration / 3600); // Cap at 2 hours
      const score = s.totalViews * (1 + durationFactor) * (0.5 + recencyFactor);

      return { channelId: s.channelId, score };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  // Map to channels
  const trending = scores
    .map(s => allChannels.find(ch => ch.id === s.channelId))
    .filter((ch): ch is Channel => ch !== undefined);

  // If not enough trending, fill with popular categories
  if (trending.length < limit) {
    const popularCategories = ['News', 'Sports', 'Entertainment', 'Movies'];
    const filler = allChannels
      .filter(ch =>
        popularCategories.includes(ch.category) &&
        !trending.some(t => t.id === ch.id)
      )
      .slice(0, limit - trending.length);

    trending.push(...filler);
  }

  return trending;
}

/**
 * Get most watched channels overall
 */
export function getMostWatched(
  allChannels: Channel[],
  limit: number = 10
): Channel[] {
  const stats = getChannelStats();

  const sorted = Object.values(stats)
    .sort((a, b) => b.totalDuration - a.totalDuration)
    .slice(0, limit);

  return sorted
    .map(s => allChannels.find(ch => ch.id === s.channelId))
    .filter((ch): ch is Channel => ch !== undefined);
}

/**
 * Get viewing stats for display
 */
export function getViewingStats(): {
  totalChannels: number;
  totalTime: number;  // seconds
  favoriteCategory: string | null;
} {
  const stats = getChannelStats();
  const entries = Object.values(stats);

  if (entries.length === 0) {
    return { totalChannels: 0, totalTime: 0, favoriteCategory: null };
  }

  const totalTime = entries.reduce((sum, s) => sum + s.totalDuration, 0);

  // This would need channel data to determine category
  return {
    totalChannels: entries.length,
    totalTime,
    favoriteCategory: null,
  };
}

/**
 * Clear all analytics data
 */
export function clearAnalytics(): void {
  try {
    localStorage.removeItem(ANALYTICS_KEY);
    localStorage.removeItem(SESSIONS_KEY);
    localStorage.removeItem(RELATED_KEY);
  } catch {
    // Ignore
  }
}

/**
 * Format duration for display
 */
export function formatWatchTime(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
  const hours = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
}

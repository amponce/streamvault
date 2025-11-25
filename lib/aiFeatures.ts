/**
 * AI-Powered Features for StreamVault
 * Smart recommendations, mood detection, and personalized experiences
 */

import { Channel, Category, allChannels } from './channels';

// Watch history entry
interface WatchHistoryEntry {
  channelId: string;
  category: string;
  watchedAt: number;
  duration: number; // seconds
}

// User preferences learned from behavior
interface UserPreferences {
  favoriteCategories: Map<string, number>;
  watchHistory: WatchHistoryEntry[];
  peakHours: Map<number, string[]>; // hour -> categories watched
  lastUpdated: number;
}

const STORAGE_KEY = 'streamvault_user_prefs';
const HISTORY_LIMIT = 100;

/**
 * Load user preferences from localStorage
 */
export function loadUserPreferences(): UserPreferences {
  if (typeof window === 'undefined') {
    return createEmptyPreferences();
  }

  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const data = JSON.parse(saved);
      // Convert string keys back to numbers for peakHours
      const peakHoursEntries = Object.entries(data.peakHours || {}).map(
        ([key, value]) => [parseInt(key, 10), value] as [number, string[]]
      );
      return {
        favoriteCategories: new Map(Object.entries(data.favoriteCategories || {})),
        watchHistory: data.watchHistory || [],
        peakHours: new Map(peakHoursEntries),
        lastUpdated: data.lastUpdated || Date.now(),
      };
    }
  } catch {
    // Ignore errors
  }

  return createEmptyPreferences();
}

function createEmptyPreferences(): UserPreferences {
  return {
    favoriteCategories: new Map(),
    watchHistory: [],
    peakHours: new Map(),
    lastUpdated: Date.now(),
  };
}

/**
 * Save user preferences to localStorage
 */
export function saveUserPreferences(prefs: UserPreferences): void {
  if (typeof window === 'undefined') return;

  try {
    const data = {
      favoriteCategories: Object.fromEntries(prefs.favoriteCategories),
      watchHistory: prefs.watchHistory.slice(-HISTORY_LIMIT),
      peakHours: Object.fromEntries(prefs.peakHours),
      lastUpdated: Date.now(),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // Ignore errors
  }
}

/**
 * Record that user watched a channel
 */
export function recordWatch(channel: Channel, durationSeconds: number): void {
  const prefs = loadUserPreferences();
  const hour = new Date().getHours();

  // Update watch history
  prefs.watchHistory.push({
    channelId: channel.id,
    category: channel.category,
    watchedAt: Date.now(),
    duration: durationSeconds,
  });

  // Update category scores (longer watch = higher score)
  const currentScore = prefs.favoriteCategories.get(channel.category) || 0;
  const bonus = Math.min(durationSeconds / 60, 10); // Max 10 points per session
  prefs.favoriteCategories.set(channel.category, currentScore + bonus);

  // Update peak hours
  const hourCategories = prefs.peakHours.get(hour) || [];
  if (!hourCategories.includes(channel.category)) {
    hourCategories.push(channel.category);
    prefs.peakHours.set(hour, hourCategories);
  }

  saveUserPreferences(prefs);
}

/**
 * Get time-of-day based recommendations
 */
export function getTimeBasedRecommendations(): {
  greeting: string;
  suggestedCategories: Category[];
  mood: string;
} {
  const hour = new Date().getHours();
  const prefs = loadUserPreferences();

  // Check if user has watched at this hour before
  const hourCategories = prefs.peakHours.get(hour) || [];

  if (hour >= 5 && hour < 12) {
    return {
      greeting: 'Good morning',
      suggestedCategories: hourCategories.length > 0
        ? hourCategories as Category[]
        : ['News', 'Documentary'],
      mood: 'Start your day informed',
    };
  } else if (hour >= 12 && hour < 17) {
    return {
      greeting: 'Good afternoon',
      suggestedCategories: hourCategories.length > 0
        ? hourCategories as Category[]
        : ['Entertainment', 'Sports'],
      mood: 'Take a break',
    };
  } else if (hour >= 17 && hour < 21) {
    return {
      greeting: 'Good evening',
      suggestedCategories: hourCategories.length > 0
        ? hourCategories as Category[]
        : ['Movies', 'Entertainment', 'Sports'],
      mood: 'Prime time entertainment',
    };
  } else {
    return {
      greeting: 'Late night',
      suggestedCategories: hourCategories.length > 0
        ? hourCategories as Category[]
        : ['Movies', 'Horror', 'Comedy'],
      mood: 'Night owl mode',
    };
  }
}

/**
 * AI-powered "What should I watch?" feature
 */
export function getAIRecommendation(): {
  channel: Channel;
  reason: string;
  confidence: number;
} {
  const prefs = loadUserPreferences();
  const timeRecs = getTimeBasedRecommendations();

  // Sort categories by user preference
  const sortedCategories = [...prefs.favoriteCategories.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([cat]) => cat);

  // Combine user prefs with time-based suggestions
  const targetCategories = sortedCategories.length > 0
    ? sortedCategories.slice(0, 3)
    : timeRecs.suggestedCategories;

  // Filter channels by target categories
  let candidates = allChannels.filter(ch =>
    targetCategories.includes(ch.category)
  );

  // If no candidates, fall back to all channels
  if (candidates.length === 0) {
    candidates = allChannels;
  }

  // Get recently watched IDs to avoid
  const recentlyWatched = new Set(
    prefs.watchHistory
      .slice(-10)
      .map(h => h.channelId)
  );

  // Prefer channels not recently watched
  const freshCandidates = candidates.filter(ch => !recentlyWatched.has(ch.id));
  const finalCandidates = freshCandidates.length > 0 ? freshCandidates : candidates;

  // Pick a random channel from candidates (fallback to first channel if empty)
  const selected = finalCandidates.length > 0
    ? finalCandidates[Math.floor(Math.random() * finalCandidates.length)]
    : allChannels[0];

  // Generate reason
  let reason = '';
  let confidence = 0.5;

  if (sortedCategories.includes(selected.category)) {
    reason = `Based on your love for ${selected.category}`;
    confidence = 0.85;
  } else if (timeRecs.suggestedCategories.includes(selected.category as Category)) {
    reason = `Perfect for ${timeRecs.mood.toLowerCase()}`;
    confidence = 0.7;
  } else {
    reason = 'Try something new';
    confidence = 0.5;
  }

  return { channel: selected, reason, confidence };
}

/**
 * Get smart channel suggestions based on current selection
 */
export function getSimilarChannels(current: Channel, limit = 5): Channel[] {
  // Find channels in same category
  const sameCategory = allChannels.filter(
    ch => ch.id !== current.id && ch.category === current.category
  );

  // Shuffle and limit
  return shuffleArray(sameCategory).slice(0, limit);
}

/**
 * Get trending channels (most watched recently)
 */
export function getTrendingChannels(limit = 10): Channel[] {
  const prefs = loadUserPreferences();
  const last24h = Date.now() - 24 * 60 * 60 * 1000;

  // Count watches per channel in last 24h
  const watchCounts = new Map<string, number>();
  prefs.watchHistory
    .filter(h => h.watchedAt > last24h)
    .forEach(h => {
      watchCounts.set(h.channelId, (watchCounts.get(h.channelId) || 0) + 1);
    });

  // Sort channels by watch count
  return allChannels
    .filter(ch => watchCounts.has(ch.id))
    .sort((a, b) => (watchCounts.get(b.id) || 0) - (watchCounts.get(a.id) || 0))
    .slice(0, limit);
}

/**
 * Content mood analysis - suggest channels based on desired mood
 */
export type Mood = 'excited' | 'relaxed' | 'informed' | 'entertained' | 'scared';

const moodCategories: Record<Mood, Category[]> = {
  excited: ['Sports', 'Entertainment'],
  relaxed: ['Documentary', 'Music'],
  informed: ['News', 'Documentary'],
  entertained: ['Entertainment', 'Comedy', 'Movies'],
  scared: ['Horror'],
};

export function getChannelsByMood(mood: Mood, limit = 10): Channel[] {
  const categories = moodCategories[mood];
  const candidates = allChannels.filter(ch =>
    categories.includes(ch.category as Category)
  );
  return shuffleArray(candidates).slice(0, limit);
}

/**
 * Quick picks - channels you watch most often
 */
export function getQuickPicks(limit = 6): Channel[] {
  const prefs = loadUserPreferences();

  // Count total watch time per channel
  const watchTime = new Map<string, number>();
  prefs.watchHistory.forEach(h => {
    watchTime.set(h.channelId, (watchTime.get(h.channelId) || 0) + h.duration);
  });

  // Sort by total watch time
  const sorted = allChannels
    .filter(ch => watchTime.has(ch.id))
    .sort((a, b) => (watchTime.get(b.id) || 0) - (watchTime.get(a.id) || 0));

  return sorted.slice(0, limit);
}

/**
 * Continue watching - last watched channel
 */
export function getLastWatched(): Channel | null {
  const prefs = loadUserPreferences();
  if (prefs.watchHistory.length === 0) return null;

  const lastEntry = prefs.watchHistory[prefs.watchHistory.length - 1];
  return allChannels.find(ch => ch.id === lastEntry.channelId) || null;
}

// Utility function
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * Category icons mapping
 */
export const categoryIcons: Record<string, string> = {
  All: '📺',
  Local: '🏠',
  News: '📰',
  Sports: '⚽',
  Entertainment: '🎬',
  Movies: '🎥',
  Music: '🎵',
  Kids: '👶',
  Documentary: '🎓',
  Horror: '👻',
  Comedy: '😂',
};

/**
 * Category colors for visual distinction
 */
export const categoryColors: Record<string, string> = {
  All: 'from-violet-500 to-purple-500',
  Local: 'from-blue-500 to-cyan-500',
  News: 'from-red-500 to-orange-500',
  Sports: 'from-green-500 to-emerald-500',
  Entertainment: 'from-pink-500 to-rose-500',
  Movies: 'from-amber-500 to-yellow-500',
  Music: 'from-indigo-500 to-blue-500',
  Kids: 'from-fuchsia-500 to-pink-500',
  Documentary: 'from-teal-500 to-cyan-500',
  Horror: 'from-gray-700 to-red-900',
  Comedy: 'from-yellow-500 to-orange-500',
};

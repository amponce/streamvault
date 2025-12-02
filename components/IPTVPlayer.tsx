'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { allChannels, originalChannels, categories, Category, Channel } from '@/lib/channels';
import { loadBrokenChannels, saveBrokenChannel, clearBrokenChannels } from '@/lib/channelHealth';
import {
  getTimeBasedRecommendations,
  getAIRecommendation,
  getQuickPicks,
  getLastWatched,
  recordWatch,
  categoryColors,
  Mood,
  getChannelsByMood,
  loadUserPreferences,
} from '@/lib/aiFeatures';
import { Send, Loader2, Sparkles, Heart, Settings, ChevronDown, Film, Tv, LayoutGrid } from 'lucide-react';
import {
  CATEGORY_ICONS,
  MOOD_ICONS,
  CONTENT_FILTER_ICONS,
} from '@/constants/icons';
import { ChannelCard } from './ChannelCard';
import { ChannelSearch } from './ChannelSearch';
import { YouTubeManager } from './YouTubeManager';
import {
  getCurrentProgram,
  getUpcomingPrograms,
  formatTime,
  formatDuration,
  getProgramProgress,
  ProgramSlot,
} from '@/lib/schedule';
import {
  fetchAndParseM3U,
  loadImportedChannels,
  saveImportedChannels,
  clearImportedChannels,
  popularM3USources,
} from '@/lib/m3uImporter';
import {
  smartImport,
  ImportOptions,
  ImportResult,
  ImportProgressCallback,
  AVAILABLE_COUNTRIES,
  AVAILABLE_LANGUAGES,
  convertGitHubUrl,
} from '@/lib/smartImport';
import {
  validateChannels,
  ValidationProgress,
  ValidationResult,
  loadValidationCache,
  clearValidationCache,
  filterValidChannels,
  stopValidation,
} from '@/lib/streamValidator';
import { fetchPlutoChannels, plutoToAppChannel, clearPlutoCache } from '@/lib/plutoTV';
import {
  importFromIptvOrg,
  IptvOrgImportOptions,
  IMPORT_PRESETS,
} from '@/lib/iptvOrgApi';
import { useFavorites } from '@/hooks/useFavorites';
import { FavoritesManager } from './FavoritesManager';

const VideoPlayer = dynamic(() => import('./VideoPlayer'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-black/50 flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
        <span className="text-white/60 text-sm">Loading player...</span>
      </div>
    </div>
  ),
});

type ViewMode = 'browse' | 'schedule' | 'discover';
type ContentFilter = 'all' | 'movies' | 'tv';

// Map categories to content types for filtering
const movieCategories = new Set(['Movies', 'Horror', 'Comedy']);
const tvCategories = new Set(['Local', 'News', 'Sports', 'Entertainment', 'Music', 'Kids', 'Documentary']);

export default function IPTVPlayer() {
  const [selectedChannel, setSelectedChannel] = useState<Channel | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<Category>('All');
  const [contentFilter, setContentFilter] = useState<ContentFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false); // Default closed on mobile
  const [displayedChannels, setDisplayedChannels] = useState<Channel[]>([]);
  const [brokenChannels, setBrokenChannels] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('browse');
  const [showAIPanel, setShowAIPanel] = useState(false);
  const [currentProgram, setCurrentProgram] = useState<ProgramSlot | null>(null);
  const [programProgress, setProgramProgress] = useState(0);
  const [showOverlay, setShowOverlay] = useState(true);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importUrl, setImportUrl] = useState('');
  const [importLoading, setImportLoading] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [importedChannels, setImportedChannels] = useState<Channel[]>([]);
  // Smart import state
  const [importPhase, setImportPhase] = useState<string>('');
  const [importProgress, setImportProgress] = useState({ current: 0, total: 0 });
  const [importStats, setImportStats] = useState<ImportResult['stats'] | null>(null);
  const [importOptions, setImportOptions] = useState<ImportOptions>({
    validateStreams: true,
    skipDuplicates: true,
    filterCountry: [],
    filterLanguage: [],
  });
  const [showAdvancedImport, setShowAdvancedImport] = useState(false);
  const [importSource, setImportSource] = useState<'url' | 'iptv-org' | 'search' | 'youtube'>('url');
  const [iptvOrgOptions, setIptvOrgOptions] = useState<IptvOrgImportOptions>({
    countries: ['US'],
    excludePluto: true,
    maxChannels: 100,
  });
  const importAbortController = useRef<AbortController | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [validationProgress, setValidationProgress] = useState<ValidationProgress | null>(null);
  const [validationResults, setValidationResults] = useState<Map<string, ValidationResult>>(new Map());
  const [showDeadChannels, setShowDeadChannels] = useState(false);
  const [hideInvalidChannels, setHideInvalidChannels] = useState(true);
  const [plutoChannels, setPlutoChannels] = useState<Channel[]>([]);
  const [plutoLoading, setPlutoLoading] = useState(false);
  const [aiChatInput, setAiChatInput] = useState('');
  const [aiChatLoading, setAiChatLoading] = useState(false);
  const [aiChatResponse, setAiChatResponse] = useState<{
    message: string;
    suggestedCategories: string[];
  } | null>(null);
  const watchStartTime = useRef<number>(0);
  const overlayTimer = useRef<NodeJS.Timeout | null>(null);
  const [showFavoritesManager, setShowFavoritesManager] = useState(false);
  const [showContentFilterDropdown, setShowContentFilterDropdown] = useState(false);

  // Favorites hook
  const {
    favorites,
    favoriteIds,
    isFavorite,
    toggle: toggleFavorite,
    exportToFile: exportFavorites,
    importFromFile: importFavoritesFromFile,
    clear: clearAllFavorites,
  } = useFavorites();

  // Detect mobile on mount and resize
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
      // On desktop, default to sidebar open
      if (window.innerWidth >= 768) {
        setSidebarOpen(true);
      }
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Auto-hide overlay after 4 seconds
  const resetOverlayTimer = useCallback(() => {
    setShowOverlay(true);
    if (overlayTimer.current) {
      clearTimeout(overlayTimer.current);
    }
    overlayTimer.current = setTimeout(() => {
      setShowOverlay(false);
    }, 4000);
  }, []);

  // Time-based greeting (memoized to avoid recalculation on every render)
  const timeRecs = useMemo(() => getTimeBasedRecommendations(), []);

  // Load broken channels, imported channels, and Pluto channels
  useEffect(() => {
    const loadData = async () => {
      const broken = loadBrokenChannels();
      setBrokenChannels(broken);
      const imported = loadImportedChannels();
      setImportedChannels(imported);

      // Load cached validation results
      const cachedValidation = loadValidationCache();
      if (cachedValidation.size > 0) {
        setValidationResults(cachedValidation);
      }

      // Fetch Pluto TV channels with fresh URLs
      setPlutoLoading(true);
      try {
        const pluto = await fetchPlutoChannels();
        const converted = pluto.map((ch, idx) => plutoToAppChannel(ch, 500 + idx));
        setPlutoChannels(converted);
        console.log(`Loaded ${converted.length} Pluto TV channels with fresh URLs`);
      } catch (err) {
        console.error('Failed to load Pluto channels:', err);
      }
      setPlutoLoading(false);

      setIsLoading(false);
    };

    loadData();
  }, []);

  // Stream validation disabled to reduce network requests (was making 100+ requests per page load)
  // Users can trigger validation manually if needed

  // Filter channels (including imported and Pluto)
  useEffect(() => {
    const allAvailable = [...allChannels, ...importedChannels, ...plutoChannels];
    let filtered = allAvailable.filter(ch => !brokenChannels.has(ch.id));

    // Filter out invalid channels if enabled
    if (hideInvalidChannels && validationResults.size > 0) {
      filtered = filterValidChannels(filtered, validationResults);
    }

    // Apply content type filter (Movies/TV/All)
    if (contentFilter === 'movies') {
      filtered = filtered.filter(ch => movieCategories.has(ch.category));
    } else if (contentFilter === 'tv') {
      filtered = filtered.filter(ch => tvCategories.has(ch.category));
    }

    // Handle special categories
    if (selectedCategory === 'Favorites') {
      filtered = filtered.filter(ch => favoriteIds.has(ch.id));
    } else if (selectedCategory === 'Imported') {
      // Show only imported channels (not original/built-in)
      const importedIds = new Set(importedChannels.map(c => c.id));
      filtered = filtered.filter(ch => importedIds.has(ch.id));
    } else if (selectedCategory !== 'All') {
      filtered = filtered.filter(ch => ch.category === selectedCategory);
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(ch =>
        ch.name.toLowerCase().includes(query) ||
        ch.category.toLowerCase().includes(query)
      );
    }

    setDisplayedChannels(filtered);
  }, [selectedCategory, searchQuery, brokenChannels, importedChannels, plutoChannels, validationResults, hideInvalidChannels, contentFilter, favoriteIds]);

  // Update current program and progress
  useEffect(() => {
    if (!selectedChannel) return;

    const updateProgram = () => {
      const program = getCurrentProgram(selectedChannel);
      setCurrentProgram(program);
      if (program) {
        setProgramProgress(getProgramProgress(program));
      }
    };

    updateProgram();
    const interval = setInterval(updateProgram, 10000); // Update every 10 seconds

    return () => clearInterval(interval);
  }, [selectedChannel]);

  // Track watch time
  useEffect(() => {
    if (selectedChannel) {
      watchStartTime.current = Date.now();
    }

    return () => {
      if (selectedChannel && watchStartTime.current > 0) {
        const duration = Math.floor((Date.now() - watchStartTime.current) / 1000);
        if (duration > 10) {
          recordWatch(selectedChannel, duration);
        }
      }
    };
  }, [selectedChannel]);

  const handleStreamError = useCallback((channelId: string) => {
    setBrokenChannels(prev => {
      const newSet = new Set(prev);
      newSet.add(channelId);
      saveBrokenChannel(channelId);
      return newSet;
    });
  }, []);

  const playChannel = useCallback((channel: Channel) => {
    // Record previous watch
    if (selectedChannel && watchStartTime.current > 0) {
      const duration = Math.floor((Date.now() - watchStartTime.current) / 1000);
      if (duration > 10) {
        recordWatch(selectedChannel, duration);
      }
    }
    setSelectedChannel(channel);
    watchStartTime.current = Date.now();
    // Close sidebar on mobile after selecting channel
    if (isMobile) {
      setSidebarOpen(false);
    }
  }, [selectedChannel, isMobile]);

  // Get all available channels sorted by number for sequential navigation
  const allAvailableChannels = useMemo(() => {
    return [...allChannels, ...importedChannels, ...plutoChannels]
      .filter(ch => !brokenChannels.has(ch.id))
      .sort((a, b) => a.number - b.number);
  }, [importedChannels, plutoChannels, brokenChannels]);

  const nextChannel = useCallback(() => {
    if (!selectedChannel || allAvailableChannels.length === 0) return;
    const currentIndex = allAvailableChannels.findIndex(ch => ch.id === selectedChannel.id);
    if (currentIndex === -1) {
      // Current channel not in list, go to first channel
      playChannel(allAvailableChannels[0]);
    } else {
      const nextIndex = (currentIndex + 1) % allAvailableChannels.length;
      playChannel(allAvailableChannels[nextIndex]);
    }
  }, [selectedChannel, allAvailableChannels, playChannel]);

  const prevChannel = useCallback(() => {
    if (!selectedChannel || allAvailableChannels.length === 0) return;
    const currentIndex = allAvailableChannels.findIndex(ch => ch.id === selectedChannel.id);
    if (currentIndex === -1) {
      // Current channel not in list, go to last channel
      playChannel(allAvailableChannels[allAvailableChannels.length - 1]);
    } else {
      const prevIndex = currentIndex === 0 ? allAvailableChannels.length - 1 : currentIndex - 1;
      playChannel(allAvailableChannels[prevIndex]);
    }
  }, [selectedChannel, allAvailableChannels, playChannel]);

  // Handle user-reported dead links
  const handleReportDead = useCallback((channel: Channel, error: string) => {
    console.log('🚩 User reported dead channel:', {
      id: channel.id,
      name: channel.name,
      url: channel.url,
      error,
      reportedAt: new Date().toISOString(),
    });

    // Store user reports separately from validation results
    try {
      const REPORTS_KEY = 'streamvault_user_reports';
      const existing = JSON.parse(localStorage.getItem(REPORTS_KEY) || '[]');
      existing.push({
        channelId: channel.id,
        channelName: channel.name,
        url: channel.url,
        error,
        reportedAt: Date.now(),
      });
      localStorage.setItem(REPORTS_KEY, JSON.stringify(existing));
    } catch {
      // Ignore storage errors
    }
  }, []);

  const handleAIRecommendation = useCallback(() => {
    // Only pick from core 123 channels (1-123), excluding dead links
    const coreChannels = originalChannels.filter(ch => {
      if (ch.number > 123) return false; // Only channels 1-123
      const result = validationResults.get(ch.id);
      return !result || result.isValid;
    });

    if (coreChannels.length > 0) {
      const randomIndex = Math.floor(Math.random() * coreChannels.length);
      playChannel(coreChannels[randomIndex]);
      setShowAIPanel(false);
    }
  }, [playChannel, validationResults]);

  const handleMoodSelection = useCallback((mood: Mood) => {
    // Filter mood channels to only include displayed (valid) ones
    const moodChannels = getChannelsByMood(mood, 10);
    const validMoodChannels = moodChannels.filter(ch =>
      displayedChannels.some(dc => dc.id === ch.id)
    );
    if (validMoodChannels.length > 0) {
      const randomIndex = Math.floor(Math.random() * validMoodChannels.length);
      playChannel(validMoodChannels[randomIndex]);
    } else if (displayedChannels.length > 0) {
      // Fallback to any displayed channel if no mood matches
      const randomIndex = Math.floor(Math.random() * displayedChannels.length);
      playChannel(displayedChannels[randomIndex]);
    }
    setShowAIPanel(false);
  }, [playChannel, displayedChannels]);

  const handleSmartImport = useCallback(async (url: string) => {
    setImportLoading(true);
    setImportError(null);
    setImportStats(null);
    setImportPhase('');
    setImportProgress({ current: 0, total: 0 });

    // Create abort controller for cancellation
    importAbortController.current = new AbortController();

    // Get existing URLs for deduplication
    const existingUrls = new Set([
      ...allChannels.map(c => c.url),
      ...importedChannels.map(c => c.url),
      ...plutoChannels.map(c => c.url),
    ]);

    const onProgress: ImportProgressCallback = (progress) => {
      setImportPhase(progress.phase);
      setImportProgress({ current: progress.current, total: progress.total });
    };

    try {
      const result = await smartImport(
        url,
        existingUrls,
        importOptions,
        onProgress,
        importAbortController.current.signal
      );

      setImportStats(result.stats);

      if (result.errors.length > 0) {
        setImportError(result.errors.join(', '));
      }

      if (result.channels.length === 0) {
        if (!result.errors.length) {
          setImportError('No valid channels found after filtering');
        }
        return;
      }

      // Save and update state
      saveImportedChannels(result.channels);
      setImportedChannels(prev => {
        const combined = [...prev, ...result.channels];
        // Dedupe by URL
        return combined.filter((ch, idx, arr) =>
          arr.findIndex(c => c.url === ch.url) === idx
        );
      });

      // Keep modal open to show stats, user can close it
      setImportUrl('');
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        setImportError('Import cancelled');
      } else {
        setImportError(err instanceof Error ? err.message : 'Failed to import playlist');
      }
    } finally {
      setImportLoading(false);
      importAbortController.current = null;
    }
  }, [importOptions, importedChannels, plutoChannels]);

  const handleCancelImport = useCallback(() => {
    if (importAbortController.current) {
      importAbortController.current.abort();
    }
  }, []);

  // Legacy import for quick imports without validation
  const handleQuickImport = useCallback(async (url: string) => {
    setImportLoading(true);
    setImportError(null);

    try {
      const channels = await fetchAndParseM3U(url);
      if (channels.length === 0) {
        setImportError('No channels found in playlist');
        return;
      }

      saveImportedChannels(channels);
      setImportedChannels(prev => {
        const combined = [...prev, ...channels];
        return combined.filter((ch, idx, arr) =>
          arr.findIndex(c => c.url === ch.url) === idx
        );
      });

      setImportUrl('');
      setShowImportModal(false);
    } catch (err) {
      setImportError(err instanceof Error ? err.message : 'Failed to import playlist');
    } finally {
      setImportLoading(false);
    }
  }, []);

  // Import from IPTV-org API
  const handleIptvOrgImport = useCallback(async () => {
    setImportLoading(true);
    setImportError(null);
    setImportStats(null);
    setImportPhase('');
    setImportProgress({ current: 0, total: 0 });

    importAbortController.current = new AbortController();

    const existingUrls = new Set([
      ...allChannels.map(c => c.url),
      ...importedChannels.map(c => c.url),
      ...plutoChannels.map(c => c.url),
    ]);

    try {
      const result = await importFromIptvOrg(
        existingUrls,
        iptvOrgOptions,
        (progress) => {
          setImportPhase(progress.phase);
          setImportProgress({ current: progress.current, total: progress.total });
        },
        importAbortController.current.signal
      );

      setImportStats({
        total: result.stats.totalStreams,
        validated: result.stats.matchedChannels,
        valid: result.stats.imported,
        invalid: result.stats.matchedChannels - result.stats.afterFilters,
        duplicates: 0,
        countryFiltered: result.stats.matchedChannels - result.stats.afterFilters,
        languageFiltered: 0,
      });

      if (result.channels.length === 0) {
        setImportError('No channels found matching filters');
        return;
      }

      saveImportedChannels(result.channels);
      setImportedChannels(prev => {
        const combined = [...prev, ...result.channels];
        return combined.filter((ch, idx, arr) =>
          arr.findIndex(c => c.url === ch.url) === idx
        );
      });
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        setImportError('Import cancelled');
      } else {
        setImportError(err instanceof Error ? err.message : 'Failed to import from IPTV-org');
      }
    } finally {
      setImportLoading(false);
      importAbortController.current = null;
    }
  }, [iptvOrgOptions, importedChannels, plutoChannels]);

  const handleClearImported = useCallback(() => {
    clearImportedChannels();
    setImportedChannels([]);
  }, []);

  const handleClearBroken = useCallback(() => {
    clearBrokenChannels();
    setBrokenChannels(new Set());
  }, []);

  const handleAiChat = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiChatInput.trim() || aiChatLoading) return;

    setAiChatLoading(true);
    setAiChatResponse(null);

    try {
      const prefs = loadUserPreferences();
      const recentCategories = [...new Set(
        prefs.watchHistory.slice(-10).map(h => h.category)
      )];

      const response = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: aiChatInput,
          context: {
            recentCategories,
            mood: null,
          },
        }),
      });

      const data = await response.json();

      if (data.error) {
        setAiChatResponse({
          message: data.error,
          suggestedCategories: [],
        });
      } else {
        setAiChatResponse({
          message: data.message,
          suggestedCategories: data.suggestedCategories || [],
        });
      }
    } catch {
      setAiChatResponse({
        message: 'Sorry, I couldn\'t connect to the AI. Try again later!',
        suggestedCategories: [],
      });
    } finally {
      setAiChatLoading(false);
      setAiChatInput('');
    }
  }, [aiChatInput, aiChatLoading]);

  // Memoize quick picks and last watched to avoid recalculation
  const quickPicks = useMemo(() => getQuickPicks(6), []);
  const lastWatched = useMemo(() => getLastWatched(), []);

  return (
    <div className="flex h-screen animated-bg text-white overflow-hidden relative">
      {/* Mobile Overlay Backdrop */}
      {isMobile && sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar - Full screen on mobile, fixed width on desktop */}
      <aside
        className={`
          ${isMobile
            ? `fixed inset-y-0 left-0 w-full max-w-sm z-50 transform transition-transform duration-300 ease-out ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`
            : `${sidebarOpen ? 'w-96' : 'w-0'} transition-all duration-500 ease-out relative z-10`
          }
          glass-dark flex flex-col overflow-hidden
        `}
      >
        {/* Header */}
        <div className="p-4 md:p-6 border-b border-white/5">
          {/* Logo and Close Button */}
          <div className="flex items-center justify-between mb-4 md:mb-6">
            <div className="flex items-center">
              <img
                src="/skull.png"
                alt="ShowStreams"
                className="w-20 h-20 object-contain"
              />
              <div>
                <span className="text-xl font-bold text-red-500">SHOWSTREAMS</span>
                <p className="text-xs text-white/40">{timeRecs.greeting}</p>
              </div>
            </div>
            {/* Close button - only on mobile */}
            {isMobile && (
              <button
                onClick={() => setSidebarOpen(false)}
                className="p-2 glass rounded-lg hover:bg-white/10 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>

          {/* Search */}
          <div className="relative mb-4">
            <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search channels..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-3 glass-input rounded-xl text-sm text-white placeholder:text-white/30"
            />
          </div>

          {/* Content Type Filter Dropdown */}
          <div className="mb-3 relative">
            <button
              onClick={() => setShowContentFilterDropdown(!showContentFilterDropdown)}
              className="w-full px-4 py-2.5 rounded-xl glass-card border border-white/10 text-white text-sm font-medium cursor-pointer flex items-center justify-between hover:border-red-500/30 transition-all"
            >
              <div className="flex items-center gap-2">
                {contentFilter === 'all' && <LayoutGrid size={16} className="text-red-500" />}
                {contentFilter === 'movies' && <Film size={16} className="text-red-500" />}
                {contentFilter === 'tv' && <Tv size={16} className="text-red-500" />}
                <span>
                  {contentFilter === 'all' ? 'All Content' : contentFilter === 'movies' ? 'Movies' : 'TV Shows'}
                </span>
              </div>
              <ChevronDown size={16} className={`text-white/50 transition-transform ${showContentFilterDropdown ? 'rotate-180' : ''}`} />
            </button>
            {showContentFilterDropdown && (
              <div className="absolute top-full left-0 right-0 mt-1 py-1 rounded-xl glass-card border border-white/10 z-50 overflow-hidden">
                {[
                  { value: 'all', label: 'All Content', icon: <LayoutGrid size={16} /> },
                  { value: 'movies', label: 'Movies', icon: <Film size={16} /> },
                  { value: 'tv', label: 'TV Shows', icon: <Tv size={16} /> },
                ].map((option) => (
                  <button
                    key={option.value}
                    onClick={() => {
                      setContentFilter(option.value as ContentFilter);
                      setSelectedCategory('All');
                      setShowContentFilterDropdown(false);
                    }}
                    className={`w-full px-4 py-2.5 flex items-center gap-2 text-sm transition-all ${
                      contentFilter === option.value
                        ? 'bg-red-500/20 text-red-400'
                        : 'text-white/70 hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    <span className={contentFilter === option.value ? 'text-red-500' : 'text-white/50'}>{option.icon}</span>
                    {option.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* View Mode Tabs */}
          <div className="flex gap-2 p-1 glass rounded-xl">
            {(['browse', 'schedule', 'discover'] as ViewMode[]).map((mode) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`flex-1 py-2 px-3 rounded-lg text-xs font-medium transition-all capitalize ${
                  viewMode === mode
                    ? 'glass-button-active text-white'
                    : 'text-white/50 hover:text-white hover:bg-white/5'
                }`}
              >
                {mode}
              </button>
            ))}
          </div>
        </div>

        {/* Category Pills */}
        {viewMode === 'browse' && (
          <div className="px-4 py-3 border-b border-white/5">
            <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar">
              {categories
                .filter(cat => {
                  if (cat === 'Favorites' || cat === 'All' || cat === 'Imported') return true;
                  if (contentFilter === 'movies') return movieCategories.has(cat);
                  if (contentFilter === 'tv') return tvCategories.has(cat);
                  return true;
                })
                .map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                    selectedCategory === cat
                      ? 'category-pill-active text-white'
                      : 'category-pill text-white/60 hover:text-white'
                  }`}
                >
                  <span>{CATEGORY_ICONS[cat]}</span>
                  <span>{cat}</span>
                  {cat === 'Favorites' && favoriteIds.size > 0 && (
                    <span className="ml-0.5 px-1.5 py-0.5 text-[10px] bg-red-500/80 rounded-full">
                      {favoriteIds.size}
                    </span>
                  )}
                  {cat === 'Imported' && importedChannels.length > 0 && (
                    <span className="ml-0.5 px-1.5 py-0.5 text-[10px] bg-cyan-500/80 rounded-full">
                      {importedChannels.length}
                    </span>
                  )}
                </button>
              ))}
              {/* Favorites Manager Button */}
              <button
                onClick={() => setShowFavoritesManager(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all category-pill text-white/60 hover:text-white"
                title="Manage Favorites"
              >
                <Settings size={14} />
              </button>
            </div>
          </div>
        )}

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-4">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-full">
              <div className="w-10 h-10 border-2 border-violet-500 border-t-transparent rounded-full animate-spin mb-4" />
              <p className="text-sm text-white/40">Loading channels...</p>
            </div>
          ) : viewMode === 'browse' ? (
            /* Channel List - Limited on mobile for performance */
            <div className="space-y-2">
              {displayedChannels.length === 0 ? (
                <div className="text-center py-12 text-white/40">
                  <p className="text-sm">No channels found</p>
                </div>
              ) : (
                (isMobile ? displayedChannels.slice(0, 50) : displayedChannels).map((channel, index) => (
                  <ChannelCard
                    key={channel.id}
                    channel={channel}
                    isSelected={selectedChannel?.id === channel.id}
                    isFavorite={isFavorite(channel.id)}
                    animationDelay={isMobile ? 0 : index * 30}
                    onPlay={() => playChannel(channel)}
                    onToggleFavorite={() => toggleFavorite(channel)}
                  />
                ))
              )}
              {isMobile && displayedChannels.length > 50 && (
                <div className="text-center py-4">
                  <p className="text-xs text-white/40">
                    Showing 50 of {displayedChannels.length} channels. Use search to find more.
                  </p>
                </div>
              )}
            </div>
          ) : viewMode === 'schedule' ? (
            /* Schedule View */
            <div className="space-y-4">
              <div className="text-xs text-white/40 uppercase tracking-wider mb-2">What&apos;s On Now</div>
              {displayedChannels.slice(0, 10).map((channel) => {
                const program = getCurrentProgram(channel);
                const upcoming = getUpcomingPrograms(channel, 2);
                return (
                  <button
                    key={channel.id}
                    onClick={() => playChannel(channel)}
                    className="w-full glass-card rounded-xl p-4 text-left channel-card"
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <span className="text-lg">{CATEGORY_ICONS[channel.category]}</span>
                      <span className="font-medium text-sm">{channel.name}</span>
                      {selectedChannel?.id === channel.id && (
                        <span className="ml-auto px-2 py-0.5 rounded-full bg-violet-500/30 text-violet-300 text-xs">
                          Watching
                        </span>
                      )}
                    </div>
                    {program && (
                      <div className="mb-2">
                        <div className="flex items-center justify-between text-sm mb-1">
                          <span className="text-white/90 font-medium">{program.title}</span>
                          <span className="text-white/40 text-xs">{formatTime(program.startTime)}</span>
                        </div>
                        <div className="h-1 rounded-full bg-white/10 overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-violet-500 to-cyan-500 transition-all duration-1000"
                            style={{ width: `${getProgramProgress(program)}%` }}
                          />
                        </div>
                      </div>
                    )}
                    {upcoming.length > 0 && (
                      <div className="text-xs text-white/40 mt-2">
                        Up next: {upcoming[0].title} at {formatTime(upcoming[0].startTime)}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          ) : (
            /* Discover View */
            <div className="space-y-6">
              {/* AI Chat */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <span className="ai-badge flex items-center gap-1">
                    <Sparkles size={12} />
                    AI
                  </span>
                  <span className="text-xs text-white/40 uppercase tracking-wider">Ask Claude</span>
                </div>

                {/* Chat Input */}
                <form onSubmit={handleAiChat} className="mb-3">
                  <div className="relative">
                    <input
                      type="text"
                      value={aiChatInput}
                      onChange={(e) => setAiChatInput(e.target.value)}
                      placeholder="What should I watch tonight?"
                      className="w-full px-4 py-3 pr-12 glass-input rounded-xl text-sm text-white placeholder:text-white/40"
                      disabled={aiChatLoading}
                    />
                    <button
                      type="submit"
                      disabled={aiChatLoading || !aiChatInput.trim()}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-lg bg-violet-500 hover:bg-violet-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                      {aiChatLoading ? (
                        <Loader2 size={16} className="animate-spin" />
                      ) : (
                        <Send size={16} />
                      )}
                    </button>
                  </div>
                </form>

                {/* AI Response */}
                {aiChatResponse && (
                  <div className="glass-card rounded-xl p-4 border-gradient">
                    <p className="text-sm text-white/90 mb-3">{aiChatResponse.message}</p>
                    {aiChatResponse.suggestedCategories.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {aiChatResponse.suggestedCategories.map((cat) => (
                          <button
                            key={cat}
                            onClick={() => {
                              setSelectedCategory(cat as Category);
                              setViewMode('browse');
                            }}
                            className="px-3 py-1.5 rounded-full bg-violet-500/20 text-violet-300 text-xs hover:bg-violet-500/30 transition-all flex items-center gap-1"
                          >
                            {CATEGORY_ICONS[cat]}
                            {cat}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Quick suggestion button */}
                {!aiChatResponse && (
                  <button
                    onClick={handleAIRecommendation}
                    className="w-full glass-card rounded-xl p-4 text-left channel-card"
                  >
                    <div className="text-sm font-medium mb-1">{timeRecs.greeting}! {timeRecs.mood}</div>
                    <div className="text-xs text-white/50">Tap for a quick AI suggestion</div>
                  </button>
                )}
              </div>

              {/* Quick Picks */}
              {quickPicks.length > 0 && (
                <div>
                  <div className="text-xs text-white/40 uppercase tracking-wider mb-3">Quick Picks</div>
                  <div className="grid grid-cols-2 gap-2">
                    {quickPicks.map(channel => (
                      <button
                        key={channel.id}
                        onClick={() => playChannel(channel)}
                        className="glass-card rounded-xl p-3 text-left channel-card"
                      >
                        <div className="text-2xl mb-2">{CATEGORY_ICONS[channel.category]}</div>
                        <div className="text-sm font-medium truncate">{channel.name}</div>
                        <div className="text-xs text-white/40">{channel.category}</div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Mood Selector */}
              <div>
                <div className="text-xs text-white/40 uppercase tracking-wider mb-3">How are you feeling?</div>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { mood: 'excited' as Mood, label: 'Pumped' },
                    { mood: 'relaxed' as Mood, label: 'Chill' },
                    { mood: 'informed' as Mood, label: 'Curious' },
                    { mood: 'entertained' as Mood, label: 'Fun' },
                    { mood: 'scared' as Mood, label: 'Thrills' },
                  ].map(({ mood, label }) => (
                    <button
                      key={mood}
                      onClick={() => handleMoodSelection(mood)}
                      className="glass-card rounded-xl p-3 text-center channel-card"
                    >
                      <div className="flex justify-center mb-1">{MOOD_ICONS[mood]}</div>
                      <div className="text-xs text-white/60">{label}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Continue Watching */}
              {lastWatched && (
                <div>
                  <div className="text-xs text-white/40 uppercase tracking-wider mb-3">Continue Watching</div>
                  <button
                    onClick={() => playChannel(lastWatched)}
                    className="w-full glass-card rounded-xl p-4 text-left channel-card"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${categoryColors[lastWatched.category]} flex items-center justify-center text-xl`}>
                        {CATEGORY_ICONS[lastWatched.category]}
                      </div>
                      <div>
                        <div className="font-medium">{lastWatched.name}</div>
                        <div className="text-xs text-white/40">{lastWatched.category}</div>
                      </div>
                      <svg className="w-8 h-8 ml-auto text-violet-400" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    </div>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer - Single Row */}
        <div className="px-3 py-2 border-t border-white/5">
          <div className="flex items-center gap-2 text-xs">
            {/* Import Button */}
            <button
              onClick={() => setShowImportModal(true)}
              className="glass-button py-1 px-2 rounded text-[11px] font-medium flex items-center gap-1"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Import
            </button>

            {/* Channel Count */}
            <span className="text-white/40">{displayedChannels.length}</span>

            {/* Pluto Status - tiny */}
            {plutoLoading ? (
              <div className="w-2.5 h-2.5 border border-cyan-500 border-t-transparent rounded-full animate-spin" />
            ) : plutoChannels.length > 0 && (
              <span className="text-cyan-400">+{plutoChannels.length}P</span>
            )}

            {/* Validation - tiny spinner only */}
            {validationProgress && validationProgress.inProgress && (
              <div className="flex items-center gap-1 text-white/30">
                <div className="w-2 h-2 border border-violet-400 border-t-transparent rounded-full animate-spin" />
                <span className="text-[10px]">{validationProgress.checked}/{validationProgress.total}</span>
              </div>
            )}

            {/* Spacer */}
            <div className="flex-1" />

            {/* Hide dead toggle - only after validation */}
            {validationResults.size > 0 && !validationProgress?.inProgress && (
              <label className="flex items-center gap-1 cursor-pointer text-white/50">
                <input
                  type="checkbox"
                  checked={hideInvalidChannels}
                  onChange={(e) => setHideInvalidChannels(e.target.checked)}
                  className="w-2.5 h-2.5 rounded bg-white/10 border-white/20 text-violet-500"
                />
                <span className="text-[10px]">Hide dead</span>
              </label>
            )}

            {/* Clear/Reset buttons */}
            {importedChannels.length > 0 && (
              <button onClick={handleClearImported} className="text-[10px] text-red-400 hover:text-red-300">
                Clear imported
              </button>
            )}
            {brokenChannels.size > 0 && (
              <button onClick={handleClearBroken} className="text-[10px] text-orange-400 hover:text-orange-300">
                Reset broken ({brokenChannels.size})
              </button>
            )}
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col relative">
        {/* Video Player */}
        <div
          className="flex-1 relative bg-black"
          onMouseMove={resetOverlayTimer}
          onMouseEnter={resetOverlayTimer}
        >
          {selectedChannel ? (
            <>
              <VideoPlayer
                channel={selectedChannel}
                onStreamError={handleStreamError}
                onSwipeLeft={nextChannel}
                onSwipeRight={prevChannel}
                onReportDead={handleReportDead}
              />
              {/* Now Playing Overlay - Auto-hides, Mobile Friendly */}
              <div
                className={`absolute top-0 left-0 right-0 p-3 md:p-6 video-overlay-gradient pointer-events-none transition-opacity duration-500 ${
                  showOverlay ? 'opacity-100' : 'opacity-0'
                }`}
                onTouchStart={resetOverlayTimer}
              >
                <div className="flex items-start justify-between">
                  <div className="min-w-0 max-w-[70%] md:max-w-[60%]">
                    <div className="flex items-center gap-2 md:gap-3 mb-1 md:mb-2">
                      <span className="px-1.5 md:px-2 py-0.5 md:py-1 rounded-md bg-red-500/80 text-xs font-bold flex items-center gap-1 flex-shrink-0">
                        <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                        LIVE
                      </span>
                      <span className="text-white/80 text-xs md:text-sm flex-shrink-0">CH {selectedChannel.number}</span>
                    </div>
                    <h2 className="text-lg md:text-2xl font-bold text-white mb-0.5 md:mb-1 truncate">{selectedChannel.name}</h2>
                    {currentProgram && (
                      <div className="text-white/60 text-xs md:text-sm">
                        {currentProgram.title} • {formatDuration(currentProgram.duration)}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </>
          ) : (
            /* Welcome Screen - Mobile Friendly */
            <div className="w-full h-full flex flex-col items-center justify-center px-4 md:px-8">
              <img
                src="/image.png"
                alt="ShowStreams"
                className="w-56 h-56 md:w-80 md:h-80 object-contain"
              />
              <p className="text-white/50 text-center text-sm md:text-base max-w-md mb-6 px-4 -mt-8">
                Select a channel from the guide or let AI find something perfect for you.
              </p>
              <div className="flex flex-col md:flex-row gap-3 md:gap-4 w-full max-w-xs md:max-w-none md:w-auto">
                <button
                  onClick={handleAIRecommendation}
                  onTouchEnd={(e) => {
                    e.preventDefault();
                    handleAIRecommendation();
                  }}
                  className="glass-button px-6 py-3 rounded-xl font-medium flex items-center justify-center gap-2 touch-manipulation"
                >
                  <span className="ai-badge">AI</span>
                  <span>Surprise Me</span>
                </button>
                <button
                  onClick={() => {
                    setSidebarOpen(true);
                  }}
                  onTouchEnd={(e) => {
                    e.preventDefault();
                    setSidebarOpen(true);
                  }}
                  className="glass px-6 py-3 rounded-xl font-medium text-white/60 hover:text-white active:bg-white/10 transition-colors touch-manipulation"
                >
                  Browse Channels
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Controls Bar - Responsive */}
        <div className="glass-dark border-t border-white/5 px-3 md:px-6 py-3 md:py-4 safe-area-bottom">
          <div className="flex items-center justify-between gap-2 md:gap-4">
            {/* Channel Info - Simplified on mobile */}
            <div className="flex items-center gap-2 md:gap-4 min-w-0 flex-1">
              {selectedChannel ? (
                <>
                  <div className={`w-10 h-10 md:w-12 md:h-12 rounded-lg md:rounded-xl bg-gradient-to-br ${categoryColors[selectedChannel.category]} flex items-center justify-center font-bold text-sm md:text-lg shadow-lg flex-shrink-0`}>
                    {selectedChannel.number}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-medium text-sm md:text-base truncate">{selectedChannel.name}</div>
                    <div className="flex items-center gap-2 text-xs md:text-sm text-white/40 truncate">
                      <span>{selectedChannel.category}</span>
                      {currentProgram && !isMobile && (
                        <>
                          <span>•</span>
                          <span className="truncate">{currentProgram.title}</span>
                        </>
                      )}
                    </div>
                  </div>
                </>
              ) : (
                <span className="text-white/40 text-sm md:text-base">Select a channel</span>
              )}
            </div>

            {/* Controls - Touch friendly */}
            <div className="flex items-center gap-1 md:gap-2 flex-shrink-0">
              <button
                onClick={prevChannel}
                disabled={!selectedChannel}
                className="p-2.5 md:p-3 glass rounded-lg md:rounded-xl hover:bg-white/10 active:bg-white/20 transition-all disabled:opacity-30 disabled:cursor-not-allowed touch-manipulation"
                title="Previous Channel"
              >
                <svg className="w-5 h-5 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>

              <button
                onClick={() => setShowAIPanel(!showAIPanel)}
                className={`p-2.5 md:p-3 rounded-lg md:rounded-xl transition-all touch-manipulation ${showAIPanel ? 'glass-button-active' : 'glass hover:bg-white/10 active:bg-white/20'}`}
                title="AI Recommendations"
              >
                <svg className="w-5 h-5 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </button>

              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className={`p-2.5 md:p-3 rounded-lg md:rounded-xl transition-all touch-manipulation ${sidebarOpen && !isMobile ? 'glass-button-active' : 'glass hover:bg-white/10 active:bg-white/20'}`}
                title="Toggle Guide"
              >
                <svg className="w-5 h-5 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>

              <button
                onClick={nextChannel}
                disabled={!selectedChannel}
                className="p-2.5 md:p-3 glass rounded-lg md:rounded-xl hover:bg-white/10 active:bg-white/20 transition-all disabled:opacity-30 disabled:cursor-not-allowed touch-manipulation"
                title="Next Channel"
              >
                <svg className="w-5 h-5 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>

            {/* Progress Bar - Hidden on mobile */}
            {currentProgram && (
              <div className="hidden lg:flex items-center gap-3 min-w-[200px]">
                <span className="text-xs text-white/40">{formatTime(currentProgram.startTime)}</span>
                <div className="flex-1 h-1 rounded-full bg-white/10 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-violet-500 to-cyan-500 transition-all duration-1000"
                    style={{ width: `${programProgress}%` }}
                  />
                </div>
                <span className="text-xs text-white/40">{formatTime(currentProgram.endTime)}</span>
              </div>
            )}
          </div>
        </div>

        {/* AI Quick Panel - Responsive */}
        {showAIPanel && (
          <div className="absolute bottom-20 md:bottom-24 left-3 right-3 md:left-auto md:right-6 md:w-80 glass-card rounded-2xl p-4 fade-in shadow-2xl shadow-violet-500/20 z-50">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="ai-badge">AI</span>
                <span className="font-medium text-sm">Quick Actions</span>
              </div>
              <button
                onClick={() => setShowAIPanel(false)}
                className="text-white/40 hover:text-white transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="space-y-2">
              <button
                onClick={handleAIRecommendation}
                className="w-full glass p-3 rounded-xl text-left hover:bg-white/5 transition-all"
              >
                <div className="font-medium text-sm">✨ Surprise Me</div>
                <div className="text-xs text-white/40">AI picks something you&apos;ll love</div>
              </button>
              {timeRecs.suggestedCategories.slice(0, 2).map(cat => (
                <button
                  key={cat}
                  onClick={() => {
                    setSelectedCategory(cat as Category);
                    setViewMode('browse');
                    setShowAIPanel(false);
                  }}
                  className="w-full glass p-3 rounded-xl text-left hover:bg-white/5 transition-all"
                >
                  <div className="font-medium text-sm">{CATEGORY_ICONS[cat]} {cat}</div>
                  <div className="text-xs text-white/40">{timeRecs.mood}</div>
                </button>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Smart Import M3U Modal - Mobile Friendly */}
      {showImportModal && (
        <div className="fixed inset-0 modal-backdrop flex items-end md:items-center justify-center z-50 p-0 md:p-4">
          <div className="glass-card rounded-t-2xl md:rounded-2xl p-4 md:p-6 w-full md:max-w-xl fade-in max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">Smart Import</h2>
              <button
                onClick={() => {
                  setShowImportModal(false);
                  setImportError(null);
                  setImportUrl('');
                  setImportStats(null);
                  setShowAdvancedImport(false);
                  handleCancelImport();
                }}
                className="text-white/40 hover:text-white transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Import Stats (shown after import) */}
            {importStats && (
              <div className="mb-4 p-4 rounded-xl bg-gradient-to-r from-green-500/10 to-blue-500/10 border border-green-500/20">
                <div className="text-sm font-medium text-green-400 mb-2">Import Complete!</div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-white/50">Total parsed:</span>
                    <span className="text-white">{importStats.total}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/50">Added:</span>
                    <span className="text-green-400">{importStats.valid}</span>
                  </div>
                  {importStats.invalid > 0 && (
                    <div className="flex justify-between">
                      <span className="text-white/50">Dead streams:</span>
                      <span className="text-red-400">{importStats.invalid}</span>
                    </div>
                  )}
                  {importStats.duplicates > 0 && (
                    <div className="flex justify-between">
                      <span className="text-white/50">Duplicates:</span>
                      <span className="text-yellow-400">{importStats.duplicates}</span>
                    </div>
                  )}
                  {importStats.countryFiltered > 0 && (
                    <div className="flex justify-between">
                      <span className="text-white/50">Country filtered:</span>
                      <span className="text-blue-400">{importStats.countryFiltered}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Source Selector */}
            <div className="flex gap-2 mb-4">
              <button
                onClick={() => setImportSource('url')}
                disabled={importLoading}
                className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-medium transition-all ${
                  importSource === 'url'
                    ? 'bg-violet-500/30 border border-violet-500/50 text-violet-300'
                    : 'glass hover:bg-white/10 text-white/60'
                }`}
              >
                Custom URL
              </button>
              <button
                onClick={() => setImportSource('iptv-org')}
                disabled={importLoading}
                className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-medium transition-all ${
                  importSource === 'iptv-org'
                    ? 'bg-green-500/30 border border-green-500/50 text-green-300'
                    : 'glass hover:bg-white/10 text-white/60'
                }`}
              >
                Bulk Import
              </button>
              <button
                onClick={() => setImportSource('search')}
                disabled={importLoading}
                className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-medium transition-all ${
                  importSource === 'search'
                    ? 'bg-cyan-500/30 border border-cyan-500/50 text-cyan-300'
                    : 'glass hover:bg-white/10 text-white/60'
                }`}
              >
                Search
              </button>
              <button
                onClick={() => setImportSource('youtube')}
                disabled={importLoading}
                className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-medium transition-all ${
                  importSource === 'youtube'
                    ? 'bg-red-500/30 border border-red-500/50 text-red-300'
                    : 'glass hover:bg-white/10 text-white/60'
                }`}
              >
                YouTube
              </button>
            </div>

            {/* Custom URL Input */}
            {importSource === 'url' && (
              <div className="mb-4">
                <label className="block text-sm text-white/60 mb-2">Playlist URL (supports GitHub links)</label>
                <input
                  type="url"
                  placeholder="https://example.com/playlist.m3u8 or GitHub URL"
                  value={importUrl}
                  onChange={(e) => setImportUrl(e.target.value)}
                  className="w-full glass-input px-4 py-3 rounded-xl text-white placeholder:text-white/30"
                  disabled={importLoading}
                />
                {importUrl && importUrl.includes('github.com') && !importUrl.includes('raw.') && (
                  <div className="mt-1 text-xs text-blue-400">
                    GitHub URL detected - will convert automatically
                  </div>
                )}
              </div>
            )}

            {/* IPTV-org Options */}
            {importSource === 'iptv-org' && (
              <div className="mb-4 p-4 glass rounded-xl space-y-4">
                <div className="text-xs text-green-400 mb-2">
                  Import from the community-maintained IPTV-org database with {'>'}9000 streams worldwide
                </div>

                {/* Quick Presets */}
                <div>
                  <div className="text-sm font-medium mb-2">Quick Presets</div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => setIptvOrgOptions({ ...IMPORT_PRESETS.usNews, excludePluto: true })}
                      disabled={importLoading}
                      className="px-3 py-1.5 text-xs glass rounded-lg hover:bg-white/10 text-white/70"
                    >
                      US News
                    </button>
                    <button
                      onClick={() => setIptvOrgOptions({ ...IMPORT_PRESETS.usSports, excludePluto: true })}
                      disabled={importLoading}
                      className="px-3 py-1.5 text-xs glass rounded-lg hover:bg-white/10 text-white/70"
                    >
                      US Sports
                    </button>
                    <button
                      onClick={() => setIptvOrgOptions({ ...IMPORT_PRESETS.ukChannels, excludePluto: true })}
                      disabled={importLoading}
                      className="px-3 py-1.5 text-xs glass rounded-lg hover:bg-white/10 text-white/70"
                    >
                      UK Channels
                    </button>
                    <button
                      onClick={() => setIptvOrgOptions({ ...IMPORT_PRESETS.hdOnly, excludePluto: true })}
                      disabled={importLoading}
                      className="px-3 py-1.5 text-xs glass rounded-lg hover:bg-white/10 text-white/70"
                    >
                      HD Only
                    </button>
                  </div>
                </div>

                {/* Country Filter */}
                <div>
                  <div className="text-sm font-medium mb-2">Countries</div>
                  <div className="flex flex-wrap gap-2">
                    {['US', 'GB', 'CA', 'AU', 'DE', 'FR', 'ES', 'IT', 'MX', 'BR'].map((code) => (
                      <button
                        key={code}
                        onClick={() => {
                          setIptvOrgOptions(prev => ({
                            ...prev,
                            countries: prev.countries?.includes(code)
                              ? prev.countries.filter(c => c !== code)
                              : [...(prev.countries || []), code]
                          }));
                        }}
                        disabled={importLoading}
                        className={`px-2 py-1 text-xs rounded-lg transition-all ${
                          iptvOrgOptions.countries?.includes(code)
                            ? 'bg-green-500/30 border border-green-500/50 text-green-300'
                            : 'glass hover:bg-white/10 text-white/60'
                        }`}
                      >
                        {code}
                      </button>
                    ))}
                  </div>
                  {(iptvOrgOptions.countries?.length || 0) > 0 && (
                    <div className="mt-2 text-xs text-green-400">
                      Selected: {iptvOrgOptions.countries?.join(', ')}
                      <button
                        onClick={() => setIptvOrgOptions(prev => ({ ...prev, countries: [] }))}
                        className="ml-2 text-white/40 hover:text-white"
                      >
                        Clear
                      </button>
                    </div>
                  )}
                </div>

                {/* Category Filter */}
                <div>
                  <div className="text-sm font-medium mb-2">Categories</div>
                  <div className="flex flex-wrap gap-2">
                    {['news', 'sports', 'entertainment', 'movies', 'music', 'kids', 'documentary'].map((cat) => (
                      <button
                        key={cat}
                        onClick={() => {
                          setIptvOrgOptions(prev => ({
                            ...prev,
                            categories: prev.categories?.includes(cat)
                              ? prev.categories.filter(c => c !== cat)
                              : [...(prev.categories || []), cat]
                          }));
                        }}
                        disabled={importLoading}
                        className={`px-2 py-1 text-xs rounded-lg transition-all capitalize ${
                          iptvOrgOptions.categories?.includes(cat)
                            ? 'bg-blue-500/30 border border-blue-500/50 text-blue-300'
                            : 'glass hover:bg-white/10 text-white/60'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Max Channels */}
                <div>
                  <div className="text-sm font-medium mb-2">Max Channels: {iptvOrgOptions.maxChannels || 'Unlimited'}</div>
                  <input
                    type="range"
                    min="10"
                    max="500"
                    step="10"
                    value={iptvOrgOptions.maxChannels || 100}
                    onChange={(e) => setIptvOrgOptions(prev => ({ ...prev, maxChannels: parseInt(e.target.value) }))}
                    disabled={importLoading}
                    className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-green-500"
                  />
                </div>
              </div>
            )}

            {/* Channel Search */}
            {importSource === 'search' && (
              <div className="mb-4">
                <ChannelSearch
                  onAddChannel={(channel) => {
                    setImportedChannels(prev => {
                      const updated = [...prev, channel];
                      saveImportedChannels(updated);
                      return updated;
                    });
                  }}
                  onPlayChannel={(channel) => {
                    setImportedChannels(prev => {
                      const exists = prev.some(c => c.url === channel.url);
                      if (!exists) {
                        const updated = [...prev, channel];
                        saveImportedChannels(updated);
                        return updated;
                      }
                      return prev;
                    });
                    setSelectedChannel(channel);
                    setShowImportModal(false);
                  }}
                />
              </div>
            )}

            {/* YouTube Manager */}
            {importSource === 'youtube' && (
              <div className="mb-4">
                <YouTubeManager
                  onAddChannel={(channel) => {
                    setImportedChannels(prev => {
                      const updated = [...prev, channel];
                      saveImportedChannels(updated);
                      return updated;
                    });
                  }}
                  onPlayChannel={(channel) => {
                    setImportedChannels(prev => {
                      const exists = prev.some(c => c.url === channel.url);
                      if (!exists) {
                        const updated = [...prev, channel];
                        saveImportedChannels(updated);
                        return updated;
                      }
                      return prev;
                    });
                    setSelectedChannel(channel);
                    setShowImportModal(false);
                  }}
                />
              </div>
            )}

            {/* Advanced Options Toggle (only for URL import) */}
            {importSource === 'url' && (
              <>
                <button
                  onClick={() => setShowAdvancedImport(!showAdvancedImport)}
                  className="w-full flex items-center justify-between p-3 mb-4 glass rounded-xl text-sm hover:bg-white/5 transition-all"
                  disabled={importLoading}
                >
                  <span className="text-white/70">Advanced Filters</span>
                  <svg
                    className={`w-5 h-5 text-white/50 transition-transform ${showAdvancedImport ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {/* Advanced Options */}
                {showAdvancedImport && (
              <div className="mb-4 p-4 glass rounded-xl space-y-4">
                {/* Validation Toggle */}
                <label className="flex items-center justify-between cursor-pointer">
                  <div>
                    <div className="text-sm font-medium">Validate Streams</div>
                    <div className="text-xs text-white/40">Test each stream before adding (slower but cleaner)</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={importOptions.validateStreams}
                    onChange={(e) => setImportOptions(prev => ({ ...prev, validateStreams: e.target.checked }))}
                    className="w-5 h-5 rounded accent-violet-500"
                    disabled={importLoading}
                  />
                </label>

                {/* Skip Duplicates */}
                <label className="flex items-center justify-between cursor-pointer">
                  <div>
                    <div className="text-sm font-medium">Skip Duplicates</div>
                    <div className="text-xs text-white/40">Don&apos;t import channels you already have</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={importOptions.skipDuplicates}
                    onChange={(e) => setImportOptions(prev => ({ ...prev, skipDuplicates: e.target.checked }))}
                    className="w-5 h-5 rounded accent-violet-500"
                    disabled={importLoading}
                  />
                </label>

                {/* Country Filter */}
                <div>
                  <div className="text-sm font-medium mb-2">Filter by Country</div>
                  <div className="flex flex-wrap gap-2">
                    {AVAILABLE_COUNTRIES.slice(0, 10).map((country) => (
                      <button
                        key={country.code}
                        onClick={() => {
                          setImportOptions(prev => ({
                            ...prev,
                            filterCountry: prev.filterCountry?.includes(country.code)
                              ? prev.filterCountry.filter(c => c !== country.code)
                              : [...(prev.filterCountry || []), country.code]
                          }));
                        }}
                        disabled={importLoading}
                        className={`px-2 py-1 text-xs rounded-lg transition-all ${
                          importOptions.filterCountry?.includes(country.code)
                            ? 'bg-violet-500/30 border border-violet-500/50 text-violet-300'
                            : 'glass hover:bg-white/10 text-white/60'
                        }`}
                      >
                        {country.code}
                      </button>
                    ))}
                  </div>
                  {(importOptions.filterCountry?.length || 0) > 0 && (
                    <div className="mt-2 text-xs text-violet-400">
                      Filtering: {importOptions.filterCountry?.join(', ')}
                      <button
                        onClick={() => setImportOptions(prev => ({ ...prev, filterCountry: [] }))}
                        className="ml-2 text-white/40 hover:text-white"
                      >
                        Clear
                      </button>
                    </div>
                  )}
                </div>

                {/* Language Filter */}
                <div>
                  <div className="text-sm font-medium mb-2">Filter by Language</div>
                  <div className="flex flex-wrap gap-2">
                    {AVAILABLE_LANGUAGES.slice(0, 8).map((lang) => (
                      <button
                        key={lang.code}
                        onClick={() => {
                          setImportOptions(prev => ({
                            ...prev,
                            filterLanguage: prev.filterLanguage?.includes(lang.code)
                              ? prev.filterLanguage.filter(l => l !== lang.code)
                              : [...(prev.filterLanguage || []), lang.code]
                          }));
                        }}
                        disabled={importLoading}
                        className={`px-2 py-1 text-xs rounded-lg transition-all ${
                          importOptions.filterLanguage?.includes(lang.code)
                            ? 'bg-blue-500/30 border border-blue-500/50 text-blue-300'
                            : 'glass hover:bg-white/10 text-white/60'
                        }`}
                      >
                        {lang.name}
                      </button>
                    ))}
                  </div>
                  {(importOptions.filterLanguage?.length || 0) > 0 && (
                    <div className="mt-2 text-xs text-blue-400">
                      Languages: {importOptions.filterLanguage?.map(l =>
                        AVAILABLE_LANGUAGES.find(lang => lang.code === l)?.name || l
                      ).join(', ')}
                      <button
                        onClick={() => setImportOptions(prev => ({ ...prev, filterLanguage: [] }))}
                        className="ml-2 text-white/40 hover:text-white"
                      >
                        Clear
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
              </>
            )}

            {/* Progress Indicator */}
            {importLoading && (
              <div className="mb-4 p-4 glass rounded-xl">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-white/70 capitalize">{importPhase || 'Starting'}...</span>
                  {importProgress.total > 0 && (
                    <span className="text-xs text-white/50">
                      {importProgress.current}/{importProgress.total}
                    </span>
                  )}
                </div>
                <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-violet-500 to-blue-500 transition-all duration-300"
                    style={{
                      width: importProgress.total > 0
                        ? `${(importProgress.current / importProgress.total) * 100}%`
                        : '0%'
                    }}
                  />
                </div>
              </div>
            )}

            {importError && (
              <div className="mb-4 p-3 rounded-lg bg-red-500/20 border border-red-500/30 text-red-400 text-sm">
                {importError}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-2 mb-4">
              {importLoading ? (
                <button
                  onClick={handleCancelImport}
                  className="flex-1 glass py-3 rounded-xl font-medium text-red-400 hover:bg-red-500/10 transition-all"
                >
                  Cancel
                </button>
              ) : importSource === 'url' ? (
                <>
                  <button
                    onClick={() => handleSmartImport(importUrl)}
                    disabled={!importUrl}
                    className="flex-1 glass-button py-3 rounded-xl font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Smart Import
                  </button>
                  <button
                    onClick={() => handleQuickImport(importUrl)}
                    disabled={!importUrl}
                    className="glass py-3 px-4 rounded-xl text-sm text-white/60 hover:bg-white/10 disabled:opacity-50"
                    title="Quick import without validation"
                  >
                    Quick
                  </button>
                </>
              ) : (
                <button
                  onClick={handleIptvOrgImport}
                  className="flex-1 py-3 rounded-xl font-medium bg-green-500/30 border border-green-500/50 text-green-300 hover:bg-green-500/40 transition-all"
                >
                  Import from IPTV-org
                </button>
              )}
            </div>

            {/* Popular Sources (only for URL import) */}
            {!importLoading && importSource === 'url' && (
              <div>
                <div className="text-xs text-white/40 uppercase tracking-wider mb-3">Popular Sources</div>
                <div className="space-y-2 max-h-40 overflow-y-auto custom-scrollbar">
                  {popularM3USources.slice(0, 15).map((source) => (
                    <button
                      key={source.url}
                      onClick={() => {
                        setImportUrl(source.url);
                        handleSmartImport(source.url);
                      }}
                      disabled={importLoading}
                      className="w-full glass p-3 rounded-xl text-left hover:bg-white/5 transition-all disabled:opacity-50"
                    >
                      <div className="font-medium text-sm">{source.name}</div>
                      <div className="text-xs text-white/40">{source.description}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Dead Channels Modal */}
      {showDeadChannels && (
        <div className="fixed inset-0 modal-backdrop flex items-end md:items-center justify-center z-50 p-0 md:p-4">
          <div className="glass-card rounded-t-2xl md:rounded-2xl p-4 md:p-6 w-full md:max-w-2xl fade-in max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-red-400">Dead Channels Report</h2>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    // Export dead channels to clipboard
                    const deadList = Array.from(validationResults.entries())
                      .filter(([, r]) => !r.isValid)
                      .map(([id, r]) => {
                        const ch = [...allChannels, ...importedChannels, ...plutoChannels].find(c => c.id === id);
                        return `${id}: ${ch?.name || 'Unknown'} - ${r.error || 'Unknown error'}`;
                      })
                      .join('\n');
                    navigator.clipboard.writeText(deadList);
                    alert('Dead channels list copied to clipboard!');
                  }}
                  className="text-xs glass px-3 py-1.5 rounded-lg hover:bg-white/10 transition-colors"
                >
                  Copy List
                </button>
                <button
                  onClick={() => {
                    clearValidationCache();
                    setValidationResults(new Map());
                    setShowDeadChannels(false);
                  }}
                  className="text-xs glass px-3 py-1.5 rounded-lg hover:bg-white/10 transition-colors text-yellow-400"
                >
                  Re-validate
                </button>
                <button
                  onClick={() => setShowDeadChannels(false)}
                  className="text-white/40 hover:text-white transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="text-xs text-white/40 mb-3">
              {Array.from(validationResults.values()).filter(r => !r.isValid).length} channels failed validation.
              Check console for detailed report.
            </div>

            <div className="overflow-y-auto custom-scrollbar flex-1 space-y-2">
              {Array.from(validationResults.entries())
                .filter(([, r]) => !r.isValid)
                .map(([id, result]) => {
                  const channel = [...allChannels, ...importedChannels, ...plutoChannels].find(ch => ch.id === id);
                  return (
                    <div key={id} className="glass rounded-lg p-3">
                      <div className="flex items-center justify-between">
                        <div className="min-w-0 flex-1">
                          <div className="font-medium text-sm truncate">{channel?.name || id}</div>
                          <div className="text-xs text-white/40 truncate">{channel?.url}</div>
                        </div>
                        <span className="text-xs text-red-400 ml-2 flex-shrink-0">{result.error || 'Failed'}</span>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        </div>
      )}

      {/* Favorites Manager Modal */}
      {showFavoritesManager && (
        <FavoritesManager
          favoritesCount={favorites.length}
          onExport={exportFavorites}
          onImport={importFavoritesFromFile}
          onClear={clearAllFavorites}
          onClose={() => setShowFavoritesManager(false)}
        />
      )}
    </div>
  );
}

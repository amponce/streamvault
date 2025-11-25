'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import dynamic from 'next/dynamic';
import { allChannels, categories, Category, Channel } from '@/lib/channels';
import { loadBrokenChannels, saveBrokenChannel, clearBrokenChannels } from '@/lib/channelHealth';
import {
  getTimeBasedRecommendations,
  getAIRecommendation,
  getQuickPicks,
  getLastWatched,
  recordWatch,
  categoryIcons,
  categoryColors,
  Mood,
  getChannelsByMood,
} from '@/lib/aiFeatures';
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

export default function IPTVPlayer() {
  const [selectedChannel, setSelectedChannel] = useState<Channel | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<Category>('All');
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
  const [isMobile, setIsMobile] = useState(false);
  const watchStartTime = useRef<number>(0);
  const overlayTimer = useRef<NodeJS.Timeout | null>(null);

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

  // Time-based greeting
  const timeRecs = getTimeBasedRecommendations();

  // Load broken channels and imported channels from storage
  useEffect(() => {
    const broken = loadBrokenChannels();
    setBrokenChannels(broken);
    const imported = loadImportedChannels();
    setImportedChannels(imported);
    setIsLoading(false);
  }, []);

  // Filter channels (including imported)
  useEffect(() => {
    const allAvailable = [...allChannels, ...importedChannels];
    let filtered = allAvailable.filter(ch => !brokenChannels.has(ch.id));

    if (selectedCategory !== 'All') {
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
  }, [selectedCategory, searchQuery, brokenChannels, importedChannels]);

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

  const nextChannel = useCallback(() => {
    if (!selectedChannel || displayedChannels.length === 0) return;
    const currentIndex = displayedChannels.findIndex(ch => ch.id === selectedChannel.id);
    const nextIndex = (currentIndex + 1) % displayedChannels.length;
    playChannel(displayedChannels[nextIndex]);
  }, [selectedChannel, displayedChannels, playChannel]);

  const prevChannel = useCallback(() => {
    if (!selectedChannel || displayedChannels.length === 0) return;
    const currentIndex = displayedChannels.findIndex(ch => ch.id === selectedChannel.id);
    const prevIndex = currentIndex === 0 ? displayedChannels.length - 1 : currentIndex - 1;
    playChannel(displayedChannels[prevIndex]);
  }, [selectedChannel, displayedChannels, playChannel]);

  const handleAIRecommendation = useCallback(() => {
    const rec = getAIRecommendation();
    if (rec.channel) {
      playChannel(rec.channel);
      setShowAIPanel(false);
    }
  }, [playChannel]);

  const handleMoodSelection = useCallback((mood: Mood) => {
    const channels = getChannelsByMood(mood, 1);
    if (channels.length > 0) {
      playChannel(channels[0]);
    }
    setShowAIPanel(false);
  }, [playChannel]);

  const handleImportM3U = useCallback(async (url: string) => {
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
        // Dedupe by URL
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

  const handleClearImported = useCallback(() => {
    clearImportedChannels();
    setImportedChannels([]);
  }, []);

  const quickPicks = getQuickPicks(6);
  const lastWatched = getLastWatched();

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
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-violet-500/30">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h1 className="text-xl font-bold gradient-text">StreamVault</h1>
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
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                    selectedCategory === cat
                      ? 'category-pill-active text-white'
                      : 'category-pill text-white/60 hover:text-white'
                  }`}
                >
                  <span>{categoryIcons[cat]}</span>
                  <span>{cat}</span>
                </button>
              ))}
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
            /* Channel List */
            <div className="space-y-2">
              {displayedChannels.length === 0 ? (
                <div className="text-center py-12 text-white/40">
                  <p className="text-sm">No channels found</p>
                </div>
              ) : (
                displayedChannels.map((channel, index) => (
                  <button
                    key={channel.id}
                    onClick={() => playChannel(channel)}
                    className={`w-full glass-card channel-card rounded-xl p-3 text-left fade-in ${
                      selectedChannel?.id === channel.id
                        ? 'glass-button-active glow-purple'
                        : ''
                    }`}
                    style={{ animationDelay: `${index * 30}ms` }}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-12 h-12 rounded-lg flex items-center justify-center text-lg font-bold ${
                        selectedChannel?.id === channel.id
                          ? 'bg-white/20'
                          : `bg-gradient-to-br ${categoryColors[channel.category] || 'from-violet-500 to-purple-500'} opacity-80`
                      }`}>
                        {channel.number}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm truncate">{channel.name}</div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-xs text-white/40">{channel.category}</span>
                          <span className="w-1.5 h-1.5 rounded-full status-live" />
                        </div>
                      </div>
                      {selectedChannel?.id === channel.id && (
                        <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-white/10 text-xs">
                          <span className="w-1.5 h-1.5 rounded-full bg-red-500 pulse-live" />
                          <span>LIVE</span>
                        </div>
                      )}
                    </div>
                  </button>
                ))
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
                      <span className="text-lg">{categoryIcons[channel.category]}</span>
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
              {/* AI Recommendation */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <span className="ai-badge">AI</span>
                  <span className="text-xs text-white/40 uppercase tracking-wider">For You</span>
                </div>
                <button
                  onClick={handleAIRecommendation}
                  className="w-full glass-card rounded-xl p-4 text-left channel-card border-gradient overflow-hidden relative"
                >
                  <div className="relative z-10">
                    <div className="text-lg font-bold mb-1">What should I watch?</div>
                    <div className="text-sm text-white/60">{timeRecs.mood}</div>
                    <div className="mt-3 flex items-center gap-2 text-violet-400 text-sm font-medium">
                      <span>Get AI suggestion</span>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
                    </div>
                  </div>
                </button>
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
                        <div className="text-2xl mb-2">{categoryIcons[channel.category]}</div>
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
                    { mood: 'excited' as Mood, emoji: '🔥', label: 'Pumped' },
                    { mood: 'relaxed' as Mood, emoji: '😌', label: 'Chill' },
                    { mood: 'informed' as Mood, emoji: '🧠', label: 'Curious' },
                    { mood: 'entertained' as Mood, emoji: '😄', label: 'Fun' },
                    { mood: 'scared' as Mood, emoji: '😱', label: 'Thrills' },
                  ].map(({ mood, emoji, label }) => (
                    <button
                      key={mood}
                      onClick={() => handleMoodSelection(mood)}
                      className="glass-card rounded-xl p-3 text-center channel-card"
                    >
                      <div className="text-2xl mb-1">{emoji}</div>
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
                        {categoryIcons[lastWatched.category]}
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

        {/* Footer */}
        <div className="p-4 border-t border-white/5 space-y-3">
          <button
            onClick={() => setShowImportModal(true)}
            className="w-full glass-button py-2 px-3 rounded-lg text-sm font-medium flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Import M3U Playlist
          </button>
          <div className="flex items-center justify-between text-xs text-white/40">
            <span>{displayedChannels.length} channels{importedChannels.length > 0 && ` (${importedChannels.length} imported)`}</span>
            <div className="flex gap-2">
              {importedChannels.length > 0 && (
                <button
                  onClick={handleClearImported}
                  className="text-red-400 hover:text-red-300 transition-colors"
                >
                  Clear imported
                </button>
              )}
              {brokenChannels.size > 0 && (
                <button
                  onClick={() => {
                    setBrokenChannels(new Set());
                    clearBrokenChannels();
                  }}
                  className="text-violet-400 hover:text-violet-300 transition-colors"
                >
                  Reset {brokenChannels.size} hidden
                </button>
              )}
            </div>
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
              />
              {/* Now Playing Overlay - Auto-hides, Mobile Friendly */}
              <div
                className={`absolute top-0 left-0 right-0 p-3 md:p-6 video-overlay-gradient pointer-events-none transition-opacity duration-500 ${
                  showOverlay ? 'opacity-100' : 'opacity-0'
                }`}
                onTouchStart={resetOverlayTimer}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 md:gap-3 mb-1 md:mb-2">
                      <span className="px-1.5 md:px-2 py-0.5 md:py-1 rounded-md bg-red-500/80 text-xs font-bold flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                        LIVE
                      </span>
                      <span className="text-white/80 text-xs md:text-sm">CH {selectedChannel.number}</span>
                    </div>
                    <h2 className="text-lg md:text-2xl font-bold text-white mb-0.5 md:mb-1">{selectedChannel.name}</h2>
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
              <div className="w-16 h-16 md:w-24 md:h-24 rounded-2xl md:rounded-3xl bg-gradient-to-br from-violet-500 to-cyan-500 flex items-center justify-center mb-4 md:mb-8 shadow-2xl shadow-violet-500/30">
                <svg className="w-8 h-8 md:w-12 md:h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h1 className="text-2xl md:text-4xl font-bold gradient-text mb-2 md:mb-4">StreamVault</h1>
              <p className="text-white/40 text-center text-sm md:text-base max-w-md mb-6 md:mb-8 px-4">
                {timeRecs.greeting}! Select a channel from the guide or let AI find something perfect for you.
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
                  <div className="font-medium text-sm">{categoryIcons[cat]} {cat}</div>
                  <div className="text-xs text-white/40">{timeRecs.mood}</div>
                </button>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Import M3U Modal - Mobile Friendly */}
      {showImportModal && (
        <div className="fixed inset-0 modal-backdrop flex items-end md:items-center justify-center z-50 p-0 md:p-4">
          <div className="glass-card rounded-t-2xl md:rounded-2xl p-4 md:p-6 w-full md:max-w-lg fade-in max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold">Import M3U Playlist</h2>
              <button
                onClick={() => {
                  setShowImportModal(false);
                  setImportError(null);
                  setImportUrl('');
                }}
                className="text-white/40 hover:text-white transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* URL Input */}
            <div className="mb-4">
              <label className="block text-sm text-white/60 mb-2">Playlist URL</label>
              <input
                type="url"
                placeholder="https://example.com/playlist.m3u8"
                value={importUrl}
                onChange={(e) => setImportUrl(e.target.value)}
                className="w-full glass-input px-4 py-3 rounded-xl text-white placeholder:text-white/30"
              />
            </div>

            {importError && (
              <div className="mb-4 p-3 rounded-lg bg-red-500/20 border border-red-500/30 text-red-400 text-sm">
                {importError}
              </div>
            )}

            <button
              onClick={() => handleImportM3U(importUrl)}
              disabled={!importUrl || importLoading}
              className="w-full glass-button py-3 rounded-xl font-medium disabled:opacity-50 disabled:cursor-not-allowed mb-6"
            >
              {importLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Importing...
                </span>
              ) : (
                'Import Playlist'
              )}
            </button>

            {/* Popular Sources */}
            <div>
              <div className="text-xs text-white/40 uppercase tracking-wider mb-3">Popular Sources</div>
              <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar">
                {popularM3USources.map((source) => (
                  <button
                    key={source.url}
                    onClick={() => handleImportM3U(source.url)}
                    disabled={importLoading}
                    className="w-full glass p-3 rounded-xl text-left hover:bg-white/5 transition-all disabled:opacity-50"
                  >
                    <div className="font-medium text-sm">{source.name}</div>
                    <div className="text-xs text-white/40">{source.description}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

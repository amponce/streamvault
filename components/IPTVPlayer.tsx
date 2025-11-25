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
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [displayedChannels, setDisplayedChannels] = useState<Channel[]>([]);
  const [brokenChannels, setBrokenChannels] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('browse');
  const [showAIPanel, setShowAIPanel] = useState(false);
  const [currentProgram, setCurrentProgram] = useState<ProgramSlot | null>(null);
  const [programProgress, setProgramProgress] = useState(0);
  const [showOverlay, setShowOverlay] = useState(true);
  const watchStartTime = useRef<number>(0);
  const overlayTimer = useRef<NodeJS.Timeout | null>(null);

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

  // Load broken channels from storage
  useEffect(() => {
    const broken = loadBrokenChannels();
    setBrokenChannels(broken);
    setIsLoading(false);
  }, []);

  // Filter channels
  useEffect(() => {
    let filtered = allChannels.filter(ch => !brokenChannels.has(ch.id));

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
  }, [selectedCategory, searchQuery, brokenChannels]);

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
  }, [selectedChannel]);

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
    playChannel(rec.channel);
    setShowAIPanel(false);
  }, [playChannel]);

  const handleMoodSelection = useCallback((mood: Mood) => {
    const channels = getChannelsByMood(mood, 1);
    if (channels.length > 0) {
      playChannel(channels[0]);
    }
    setShowAIPanel(false);
  }, [playChannel]);

  const quickPicks = getQuickPicks(6);
  const lastWatched = getLastWatched();

  return (
    <div className="flex h-screen animated-bg text-white overflow-hidden">
      {/* Sidebar */}
      <aside
        className={`${sidebarOpen ? 'w-96' : 'w-0'} transition-all duration-500 ease-out glass-dark flex flex-col overflow-hidden relative z-10`}
      >
        {/* Header */}
        <div className="p-6 border-b border-white/5">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-6">
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
        <div className="p-4 border-t border-white/5">
          <div className="flex items-center justify-between text-xs text-white/40">
            <span>{displayedChannels.length} channels</span>
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
              {/* Now Playing Overlay - Auto-hides */}
              <div
                className={`absolute top-0 left-0 right-0 p-6 video-overlay-gradient pointer-events-none transition-opacity duration-500 ${
                  showOverlay ? 'opacity-100' : 'opacity-0'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <span className="px-2 py-1 rounded-md bg-red-500/80 text-xs font-bold flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                        LIVE
                      </span>
                      <span className="text-white/80 text-sm">CH {selectedChannel.number}</span>
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-1">{selectedChannel.name}</h2>
                    {currentProgram && (
                      <div className="text-white/60 text-sm">
                        {currentProgram.title} • {formatDuration(currentProgram.duration)}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </>
          ) : (
            /* Welcome Screen */
            <div className="w-full h-full flex flex-col items-center justify-center px-8">
              <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-violet-500 to-cyan-500 flex items-center justify-center mb-8 shadow-2xl shadow-violet-500/30">
                <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h1 className="text-4xl font-bold gradient-text mb-4">StreamVault</h1>
              <p className="text-white/40 text-center max-w-md mb-8">
                {timeRecs.greeting}! Select a channel from the guide or let AI find something perfect for you.
              </p>
              <div className="flex gap-4">
                <button
                  onClick={handleAIRecommendation}
                  className="glass-button px-6 py-3 rounded-xl font-medium flex items-center gap-2"
                >
                  <span className="ai-badge">AI</span>
                  <span>Surprise Me</span>
                </button>
                <button
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                  className="glass px-6 py-3 rounded-xl font-medium text-white/60 hover:text-white transition-colors"
                >
                  Browse Channels
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Controls Bar */}
        <div className="glass-dark border-t border-white/5 px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Channel Info */}
            <div className="flex items-center gap-4">
              {selectedChannel ? (
                <>
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${categoryColors[selectedChannel.category]} flex items-center justify-center font-bold text-lg shadow-lg`}>
                    {selectedChannel.number}
                  </div>
                  <div>
                    <div className="font-medium">{selectedChannel.name}</div>
                    <div className="flex items-center gap-2 text-sm text-white/40">
                      <span>{selectedChannel.category}</span>
                      {currentProgram && (
                        <>
                          <span>•</span>
                          <span>{currentProgram.title}</span>
                        </>
                      )}
                    </div>
                  </div>
                </>
              ) : (
                <span className="text-white/40">Select a channel to start watching</span>
              )}
            </div>

            {/* Controls */}
            <div className="flex items-center gap-2">
              <button
                onClick={prevChannel}
                disabled={!selectedChannel}
                className="p-3 glass rounded-xl hover:bg-white/10 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                title="Previous Channel"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>

              <button
                onClick={() => setShowAIPanel(!showAIPanel)}
                className={`p-3 rounded-xl transition-all ${showAIPanel ? 'glass-button-active' : 'glass hover:bg-white/10'}`}
                title="AI Recommendations"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </button>

              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className={`p-3 rounded-xl transition-all ${sidebarOpen ? 'glass-button-active' : 'glass hover:bg-white/10'}`}
                title="Toggle Guide"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>

              <button
                onClick={nextChannel}
                disabled={!selectedChannel}
                className="p-3 glass rounded-xl hover:bg-white/10 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                title="Next Channel"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>

            {/* Progress Bar */}
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

        {/* AI Quick Panel */}
        {showAIPanel && (
          <div className="absolute bottom-24 right-6 w-80 glass-card rounded-2xl p-4 fade-in shadow-2xl shadow-violet-500/20">
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
    </div>
  );
}

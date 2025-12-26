'use client';

import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import Hls from 'hls.js';
import { Sparkles, Tv, Radio, RefreshCw, ChevronLeft, ChevronRight, Flag, CheckCircle, Play } from 'lucide-react';
import { Channel } from '@/lib/channels';
import { CATEGORY_ICONS } from '@/constants/icons';

interface VideoPlayerProps {
  channel: Channel;
  onStreamError?: (channelId: string) => void;
  onSwipeLeft?: () => void;  // Next channel
  onSwipeRight?: () => void; // Previous channel
  onReportDead?: (channel: Channel, error: string) => void;
  onAskAI?: () => void;      // Open Ask AI panel
  hasAIContext?: boolean;    // Whether we have program info for AI
  recommendedChannels?: Channel[];  // Channels to suggest when stream fails
  onPlayChannel?: (channel: Channel) => void;  // Play a specific channel
}

export default function VideoPlayer({
  channel,
  onStreamError,
  onSwipeLeft,
  onSwipeRight,
  onReportDead,
  onAskAI,
  hasAIContext,
  recommendedChannels = [],
  onPlayChannel,
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showControls, setShowControls] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [reported, setReported] = useState(false);
  const [isPiP, setIsPiP] = useState(false);
  const [supportsPiP, setSupportsPiP] = useState(false);
  const hideControlsTimer = useRef<NodeJS.Timeout | null>(null);

  // Swipe gesture tracking
  const touchStartX = useRef<number>(0);
  const touchStartY = useRef<number>(0);
  const touchEndX = useRef<number>(0);
  const touchEndY = useRef<number>(0);
  const SWIPE_THRESHOLD = 50; // Minimum distance for swipe
  const SWIPE_RESTRAINT = 100; // Maximum perpendicular distance

  // Auto-hide controls
  const resetControlsTimer = useCallback(() => {
    setShowControls(true);
    if (hideControlsTimer.current) {
      clearTimeout(hideControlsTimer.current);
    }
    hideControlsTimer.current = setTimeout(() => {
      if (isPlaying) {
        setShowControls(false);
      }
    }, 3000);
  }, [isPlaying]);

  // Check if URL needs to go through our CORS proxy
  const getStreamUrl = useCallback((url: string): string => {
    // URLs that work directly (have CORS headers or same-origin)
    const directPatterns = [
      'moveonjoy.com',      // Our core channels
      'rbmn-live.akamaized', // Red Bull
      'samsung.wurl.com',   // Samsung FAST
      'plex.wurl.com',      // Plex FAST
    ];

    // Check if URL can be loaded directly
    const canLoadDirectly = directPatterns.some(pattern => url.includes(pattern));
    if (canLoadDirectly) {
      return url;
    }

    // Route through our proxy for CORS-blocked streams
    return `/api/stream?url=${encodeURIComponent(url)}`;
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    setLoading(true);
    setError(null);
    setReported(false);

    // Clean up previous instance
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    // Get the appropriate stream URL (direct or proxied)
    const streamUrl = getStreamUrl(channel.url);

    if (Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
        backBufferLength: 90,
        maxBufferLength: 30,
        maxMaxBufferLength: 600,
        maxBufferSize: 60 * 1000 * 1000,
        fragLoadingTimeOut: 20000,
        manifestLoadingTimeOut: 15000,
        levelLoadingTimeOut: 15000,
      });

      hlsRef.current = hls;
      hls.loadSource(streamUrl);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        setLoading(false);
        video.play().catch(() => {
          // Autoplay blocked - that's okay
        });
      });

      hls.on(Hls.Events.ERROR, (event, data) => {
        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              setError('Stream unavailable - network error');
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              // Try to recover from media errors
              hls.recoverMediaError();
              return;
            default:
              setError('Stream failed to load');
          }
          setLoading(false);
          onStreamError?.(channel.id);
        }
      });

      return () => {
        hls.destroy();
      };
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      // Native HLS support (Safari)
      video.src = streamUrl;
      video.addEventListener('loadedmetadata', () => {
        setLoading(false);
        video.play().catch(() => {});
      });
      video.addEventListener('error', () => {
        setError('Failed to load stream');
        setLoading(false);
        onStreamError?.(channel.id);
      });
    } else {
      setError('HLS not supported in this browser');
      setLoading(false);
    }
  }, [channel, onStreamError, getStreamUrl]);

  // Track play state
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleVolumeChange = () => {
      setVolume(video.volume);
      setIsMuted(video.muted);
    };

    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    video.addEventListener('volumechange', handleVolumeChange);

    return () => {
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('volumechange', handleVolumeChange);
    };
  }, []);

  // Fullscreen change handler
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Check PiP support and listen for changes
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // Check if PiP is supported
    setSupportsPiP(
      'pictureInPictureEnabled' in document &&
      (document as Document & { pictureInPictureEnabled?: boolean }).pictureInPictureEnabled === true
    );

    const handlePiPChange = () => {
      setIsPiP(document.pictureInPictureElement === video);
    };

    video.addEventListener('enterpictureinpicture', handlePiPChange);
    video.addEventListener('leavepictureinpicture', handlePiPChange);

    return () => {
      video.removeEventListener('enterpictureinpicture', handlePiPChange);
      video.removeEventListener('leavepictureinpicture', handlePiPChange);
    };
  }, []);

  const togglePiP = useCallback(async () => {
    const video = videoRef.current;
    if (!video) return;

    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
      } else if ((video as HTMLVideoElement & { requestPictureInPicture?: () => Promise<void> }).requestPictureInPicture) {
        await (video as HTMLVideoElement & { requestPictureInPicture: () => Promise<void> }).requestPictureInPicture();
      }
    } catch (err) {
      console.error('PiP error:', err);
    }
  }, []);

  const togglePlay = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      video.play();
    } else {
      video.pause();
    }
  }, []);

  const toggleMute = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !video.muted;
  }, []);

  const handleVolumeChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const video = videoRef.current;
    if (!video) return;
    const newVolume = parseFloat(e.target.value);
    video.volume = newVolume;
    video.muted = newVolume === 0;
  }, []);

  const toggleFullscreen = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;

    if (!document.fullscreenElement) {
      container.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  }, []);

  const retryStream = useCallback(() => {
    setError(null);
    setLoading(true);
    if (hlsRef.current) {
      const streamUrl = getStreamUrl(channel.url);
      hlsRef.current.loadSource(streamUrl);
    }
  }, [channel.url, getStreamUrl]);

  // Swipe gesture handlers
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    resetControlsTimer();
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
    // Initialize end positions to start positions
    touchEndX.current = e.touches[0].clientX;
    touchEndY.current = e.touches[0].clientY;
  }, [resetControlsTimer]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    touchEndX.current = e.touches[0].clientX;
    touchEndY.current = e.touches[0].clientY;
  }, []);

  const handleTouchEnd = useCallback(() => {
    const deltaX = touchEndX.current - touchStartX.current;
    const deltaY = touchEndY.current - touchStartY.current;

    // Check if it's a horizontal swipe (not a tap or vertical scroll)
    if (Math.abs(deltaX) > SWIPE_THRESHOLD && Math.abs(deltaY) < SWIPE_RESTRAINT) {
      if (deltaX > 0) {
        // Swipe right = previous channel
        onSwipeRight?.();
      } else {
        // Swipe left = next channel
        onSwipeLeft?.();
      }
    } else if (Math.abs(deltaX) < 10 && Math.abs(deltaY) < 10 && !error) {
      // It's a tap, not a swipe - toggle play (only if not in error state)
      togglePlay();
    }

    // Reset touch positions
    touchStartX.current = 0;
    touchStartY.current = 0;
    touchEndX.current = 0;
    touchEndY.current = 0;
  }, [onSwipeLeft, onSwipeRight, togglePlay, error]);

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full bg-black group touch-manipulation"
      onMouseMove={resetControlsTimer}
      onMouseLeave={() => isPlaying && setShowControls(false)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <video
        ref={videoRef}
        className="w-full h-full object-contain"
        playsInline
        webkit-playsinline="true"
        onClick={togglePlay}
      />

      {/* Loading State */}
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80 backdrop-blur-sm">
          <div className="flex flex-col items-center text-center">
            <div className="relative w-16 h-16">
              <div className="w-16 h-16 border-2 border-violet-500/30 rounded-full" />
              <div className="absolute inset-0 w-16 h-16 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
            </div>
            <p className="text-white/60 mt-4 text-sm">Connecting to stream...</p>
            <p className="text-white/30 text-xs mt-1">{channel.name}</p>
          </div>
        </div>
      )}

      {/* Channel Off-Air State - Intentional Design */}
      {error && (
        <div
          className="absolute inset-0 flex flex-col bg-gradient-to-b from-gray-900 via-black to-gray-900 overflow-y-auto"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {/* Animated Background Pattern */}
          <div className="absolute inset-0 opacity-30">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(219,0,0,0.15),transparent_40%)]" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(131,16,16,0.1),transparent_40%)]" />
          </div>

          {/* Main Content */}
          <div className="relative flex-1 flex flex-col items-center justify-center px-4 py-6 md:py-8 min-h-0">
            {/* Off-Air Badge */}
            <div className="flex items-center gap-2 mb-4 md:mb-6">
              <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
              <span className="text-amber-500 text-xs font-medium uppercase tracking-wider">Off Air</span>
            </div>

            {/* TV Static Icon */}
            <div className="relative mb-4 md:mb-6">
              <div className="w-20 h-20 md:w-24 md:h-24 rounded-2xl md:rounded-3xl bg-gradient-to-br from-white/10 to-white/5 flex items-center justify-center border border-white/10 shadow-2xl">
                <Tv className="w-10 h-10 md:w-12 md:h-12 text-white/60" />
              </div>
              <div className="absolute -bottom-1 -right-1 w-6 h-6 md:w-7 md:h-7 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center">
                <Radio className="w-3.5 h-3.5 md:w-4 md:h-4 text-amber-500" />
              </div>
            </div>

            {/* Channel Info */}
            <h2 className="text-lg md:text-xl font-bold text-white mb-1 text-center">{channel.name}</h2>
            <p className="text-white/40 text-xs md:text-sm mb-4 md:mb-6 text-center max-w-xs">
              This channel is temporarily unavailable. Try again later or explore other channels.
            </p>

            {/* Action Buttons */}
            <div className="flex items-center gap-2 md:gap-3 mb-6 md:mb-8">
              <button
                onClick={onSwipeRight}
                className="w-10 h-10 md:w-11 md:h-11 glass rounded-xl flex items-center justify-center hover:bg-white/10 active:bg-white/20 transition-all touch-manipulation"
                title="Previous Channel"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>

              <button
                onClick={retryStream}
                className="glass-button px-4 md:px-5 py-2.5 rounded-xl text-sm font-medium flex items-center gap-2 touch-manipulation"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Retry</span>
              </button>

              <button
                onClick={onSwipeLeft}
                className="w-10 h-10 md:w-11 md:h-11 glass rounded-xl flex items-center justify-center hover:bg-white/10 active:bg-white/20 transition-all touch-manipulation"
                title="Next Channel"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>

            {/* Report Link - Subtle */}
            <button
              onClick={() => {
                if (!reported) {
                  setReported(true);
                  onReportDead?.(channel, error);
                }
              }}
              disabled={reported}
              className="flex items-center gap-1.5 text-xs text-white/40 hover:text-white/60 transition-colors touch-manipulation disabled:cursor-default"
            >
              {reported ? (
                <>
                  <CheckCircle className="w-3.5 h-3.5 text-green-500" />
                  <span className="text-green-500">Thanks for reporting</span>
                </>
              ) : (
                <>
                  <Flag className="w-3.5 h-3.5" />
                  <span>Report issue</span>
                </>
              )}
            </button>
          </div>

          {/* Recommended Channels Section */}
          {recommendedChannels.length > 0 && (
            <div className="relative border-t border-white/10 bg-black/40 backdrop-blur-sm px-4 py-4 md:py-5 safe-area-bottom">
              <div className="max-w-lg mx-auto">
                <p className="text-xs text-white/50 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <span className="w-4 h-px bg-white/20" />
                  Try These Instead
                  <span className="flex-1 h-px bg-white/20" />
                </p>

                <div className="flex gap-2 overflow-x-auto pb-1 custom-scrollbar">
                  {recommendedChannels.slice(0, 6).map((rec) => (
                    <button
                      key={rec.id}
                      onClick={() => onPlayChannel?.(rec)}
                      className="flex-shrink-0 group"
                    >
                      <div className="w-20 md:w-24 glass-card rounded-xl p-2.5 md:p-3 text-center hover:border-red-500/30 transition-all touch-manipulation">
                        <div className="text-xl md:text-2xl mb-1">
                          {CATEGORY_ICONS[rec.category] || '📺'}
                        </div>
                        <div className="text-[10px] md:text-xs font-medium text-white truncate">
                          {rec.name}
                        </div>
                        <div className="text-[9px] md:text-[10px] text-white/40 truncate">
                          CH {rec.number}
                        </div>
                        <div className="mt-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Play className="w-3 h-3 mx-auto text-red-500" />
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Swipe Hint for Mobile */}
          <div className="absolute bottom-20 left-0 right-0 text-center pointer-events-none md:hidden">
            <p className="text-white/20 text-[10px]">Swipe to change channels</p>
          </div>
        </div>
      )}

      {/* Custom Controls Overlay - Mobile Optimized */}
      {!loading && !error && (
        <div
          className={`absolute inset-0 transition-opacity duration-300 ${
            showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
        >
          {/* Top Gradient */}
          <div className="absolute top-0 left-0 right-0 h-20 md:h-32 bg-gradient-to-b from-black/60 to-transparent pointer-events-none" />

          {/* Bottom Controls - Responsive */}
          <div className="absolute bottom-0 left-0 right-0 p-3 md:p-6 bg-gradient-to-t from-black/80 to-transparent safe-area-bottom">
            <div className="flex items-center justify-between gap-2 md:gap-4">
              {/* Left Controls */}
              <div className="flex items-center gap-2 md:gap-3">
                {/* Play/Pause */}
                <button
                  onClick={togglePlay}
                  className="w-11 h-11 md:w-12 md:h-12 glass rounded-lg md:rounded-xl flex items-center justify-center hover:bg-white/10 active:bg-white/20 transition-all touch-manipulation"
                >
                  {isPlaying ? (
                    <svg className="w-5 h-5 md:w-6 md:h-6" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5 md:w-6 md:h-6" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  )}
                </button>

                {/* Volume - Hidden on mobile, visible on desktop */}
                <div className="hidden md:flex items-center gap-2 group/volume">
                  <button
                    onClick={toggleMute}
                    className="w-10 h-10 glass rounded-lg flex items-center justify-center hover:bg-white/10 transition-all touch-manipulation"
                  >
                    {isMuted || volume === 0 ? (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
                      </svg>
                    ) : volume < 0.5 ? (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                      </svg>
                    )}
                  </button>
                  <div className="w-0 overflow-hidden group-hover/volume:w-24 transition-all duration-300">
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.1"
                      value={isMuted ? 0 : volume}
                      onChange={handleVolumeChange}
                      className="w-full h-1 bg-white/20 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:shadow-lg"
                    />
                  </div>
                </div>
              </div>

              {/* Center - Live Badge */}
              <div className="flex items-center gap-2">
                <span className="px-2 md:px-3 py-1 md:py-1.5 rounded-lg bg-red-500/80 text-xs font-bold flex items-center gap-1 md:gap-1.5">
                  <span className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-white animate-pulse" />
                  LIVE
                </span>
              </div>

              {/* Right Controls */}
              <div className="flex items-center gap-2">
                {/* Ask AI button */}
                {onAskAI && (
                  <button
                    onClick={onAskAI}
                    className="w-11 h-11 md:w-10 md:h-10 glass rounded-lg flex items-center justify-center
                               hover:bg-white/10 active:bg-white/20 transition-all touch-manipulation
                               group relative"
                    title="Ask AI about this content"
                  >
                    <Sparkles className="w-5 h-5 text-violet-400 group-hover:text-violet-300" />
                    {hasAIContext && (
                      <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-violet-500 rounded-full" />
                    )}
                  </button>
                )}
                {/* Mute button on mobile */}
                <button
                  onClick={toggleMute}
                  className="w-11 h-11 md:hidden glass rounded-lg flex items-center justify-center hover:bg-white/10 active:bg-white/20 transition-all touch-manipulation"
                >
                  {isMuted || volume === 0 ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                    </svg>
                  )}
                </button>
                {/* Picture-in-Picture */}
                {supportsPiP && (
                  <button
                    onClick={togglePiP}
                    className="w-11 h-11 md:w-10 md:h-10 glass rounded-lg flex items-center justify-center hover:bg-white/10 active:bg-white/20 transition-all touch-manipulation"
                    title="Picture-in-Picture"
                  >
                    {isPiP ? (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 9V5a2 2 0 012-2h8a2 2 0 012 2v5a2 2 0 01-2 2h-2M3 13h8a2 2 0 012 2v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4a2 2 0 012-2z" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h2M4 8h4m12 0V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2h4" />
                      </svg>
                    )}
                  </button>
                )}
                {/* Fullscreen */}
                <button
                  onClick={toggleFullscreen}
                  className="w-11 h-11 md:w-10 md:h-10 glass rounded-lg flex items-center justify-center hover:bg-white/10 active:bg-white/20 transition-all touch-manipulation"
                >
                  {isFullscreen ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 9V4.5M9 9H4.5M9 9L3.75 3.75M9 15v4.5M9 15H4.5M9 15l-5.25 5.25M15 9h4.5M15 9V4.5M15 9l5.25-5.25M15 15h4.5M15 15v4.5m0-4.5l5.25 5.25" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5v-4m0 4h-4m4 0l-5-5" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Center Play Button (shown when paused) - Responsive */}
          {!isPlaying && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <button
                onClick={togglePlay}
                className="w-16 h-16 md:w-20 md:h-20 glass-button rounded-full flex items-center justify-center pointer-events-auto transform hover:scale-110 active:scale-95 transition-transform touch-manipulation"
              >
                <svg className="w-8 h-8 md:w-10 md:h-10 ml-1" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

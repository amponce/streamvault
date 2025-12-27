'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import Hls from 'hls.js';
import { Volume2, VolumeX, Play, X } from 'lucide-react';
import { Channel } from '@/lib/channels';

interface ChannelPreviewProps {
  channel: Channel;
  isVisible: boolean;
  position: { x: number; y: number };
  onClose: () => void;
  onPlay: () => void;
}

export function ChannelPreview({
  channel,
  isVisible,
  position,
  onClose,
  onPlay,
}: ChannelPreviewProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [isMuted, setIsMuted] = useState(true);

  // Get stream URL (simplified - no proxy for preview)
  const getStreamUrl = useCallback((url: string): string => {
    // For preview, try direct first
    if (url.includes('youtube.com') || url.includes('youtu.be')) {
      return ''; // Don't preview YouTube
    }
    return url;
  }, []);

  // Initialize stream
  useEffect(() => {
    if (!isVisible || !videoRef.current) return;

    const video = videoRef.current;
    const streamUrl = getStreamUrl(channel.url);

    if (!streamUrl) {
      setError(true);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(false);

    // Check if HLS is needed
    if (streamUrl.includes('.m3u8')) {
      if (Hls.isSupported()) {
        const hls = new Hls({
          enableWorker: true,
          lowLatencyMode: true,
          maxBufferLength: 10,
          maxMaxBufferLength: 15,
          startLevel: -1, // Auto quality
        });

        hls.loadSource(streamUrl);
        hls.attachMedia(video);

        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          setLoading(false);
          video.play().catch(() => {});
        });

        hls.on(Hls.Events.ERROR, (_, data) => {
          if (data.fatal) {
            setError(true);
            setLoading(false);
          }
        });

        hlsRef.current = hls;
      } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        // Native HLS (Safari)
        video.src = streamUrl;
        video.addEventListener('loadedmetadata', () => {
          setLoading(false);
          video.play().catch(() => {});
        });
        video.addEventListener('error', () => {
          setError(true);
          setLoading(false);
        });
      }
    } else {
      // Direct video
      video.src = streamUrl;
      video.addEventListener('loadedmetadata', () => {
        setLoading(false);
        video.play().catch(() => {});
      });
      video.addEventListener('error', () => {
        setError(true);
        setLoading(false);
      });
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
      video.src = '';
      video.load();
    };
  }, [isVisible, channel.url, getStreamUrl]);

  // Update muted state
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.muted = isMuted;
    }
  }, [isMuted]);

  if (!isVisible) return null;

  // Calculate position to stay within viewport
  const previewWidth = 280;
  const previewHeight = 180;
  const padding = 16;

  let left = position.x;
  let top = position.y;

  // Adjust if would go off right edge
  if (typeof window !== 'undefined') {
    if (left + previewWidth > window.innerWidth - padding) {
      left = window.innerWidth - previewWidth - padding;
    }
    if (top + previewHeight > window.innerHeight - padding) {
      top = position.y - previewHeight - padding;
    }
  }

  return (
    <div
      className="fixed z-[60] w-[280px] rounded-xl overflow-hidden shadow-2xl border border-white/10 bg-black"
      style={{ left: `${left}px`, top: `${top}px` }}
    >
      {/* Video Container */}
      <div className="relative aspect-video bg-black">
        <video
          ref={videoRef}
          className="w-full h-full object-contain"
          muted={isMuted}
          playsInline
          autoPlay
        />

        {/* Loading State */}
        {loading && !error && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/80">
            <div className="w-8 h-8 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/80">
            <p className="text-white/40 text-xs">Preview unavailable</p>
          </div>
        )}

        {/* Controls Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/40 opacity-0 hover:opacity-100 transition-opacity">
          {/* Top Controls */}
          <div className="absolute top-2 right-2 flex gap-1">
            <button
              onClick={() => setIsMuted(!isMuted)}
              className="p-1.5 rounded-lg bg-black/50 hover:bg-black/70 transition-colors"
            >
              {isMuted ? (
                <VolumeX className="w-4 h-4" />
              ) : (
                <Volume2 className="w-4 h-4" />
              )}
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-black/50 hover:bg-black/70 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Center Play Button */}
          <button
            onClick={onPlay}
            className="absolute inset-0 flex items-center justify-center"
          >
            <div className="w-12 h-12 rounded-full bg-red-500/80 hover:bg-red-500 flex items-center justify-center transition-colors">
              <Play className="w-6 h-6 text-white ml-0.5" />
            </div>
          </button>
        </div>
      </div>

      {/* Channel Info */}
      <div className="p-3 bg-gradient-to-r from-gray-900 to-black">
        <div className="flex items-center gap-2">
          <span className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-xs font-bold">
            {channel.number}
          </span>
          <div className="min-w-0 flex-1">
            <p className="font-medium text-sm truncate">{channel.name}</p>
            <p className="text-xs text-white/40">{channel.category}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// Hook to manage preview state
export function useChannelPreview() {
  const [previewChannel, setPreviewChannel] = useState<Channel | null>(null);
  const [previewPosition, setPreviewPosition] = useState({ x: 0, y: 0 });
  const [isPreviewVisible, setIsPreviewVisible] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const showPreview = useCallback((channel: Channel, x: number, y: number) => {
    // Don't preview YouTube channels
    if (channel.url.includes('youtube.com') || channel.url.includes('youtu.be')) {
      return;
    }

    // Delay before showing preview
    timeoutRef.current = setTimeout(() => {
      setPreviewChannel(channel);
      setPreviewPosition({ x: x + 20, y });
      setIsPreviewVisible(true);
    }, 500); // 500ms delay
  }, []);

  const hidePreview = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setIsPreviewVisible(false);
    // Delay clearing channel to allow fade animation
    setTimeout(() => setPreviewChannel(null), 200);
  }, []);

  const cancelPreview = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return {
    previewChannel,
    previewPosition,
    isPreviewVisible,
    showPreview,
    hidePreview,
    cancelPreview,
  };
}

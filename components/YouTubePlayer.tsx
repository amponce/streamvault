'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { Channel } from '@/lib/channels';
import Hls from 'hls.js';
import { Loader2, ExternalLink } from 'lucide-react';

interface YouTubePlayerProps {
  channel: Channel;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
}

export default function YouTubePlayer({ channel, onSwipeLeft, onSwipeRight }: YouTubePlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);

  const [hlsUrl, setHlsUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [useEmbed, setUseEmbed] = useState(false);

  // Swipe gesture tracking
  const touchStartX = useRef<number>(0);
  const touchStartY = useRef<number>(0);
  const touchEndX = useRef<number>(0);
  const touchEndY = useRef<number>(0);
  const SWIPE_THRESHOLD = 50;
  const SWIPE_RESTRAINT = 100;

  // Extract YouTube video ID from URL
  const getYouTubeId = (url: string): string | null => {
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
      /youtube\.com\/watch\?.*v=([^&\n?#]+)/,
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match && match[1]) {
        return match[1];
      }
    }
    return null;
  };

  const videoId = getYouTubeId(channel.url);

  // Try to extract HLS URL
  useEffect(() => {
    if (!videoId) {
      setError('Invalid YouTube URL');
      setLoading(false);
      return;
    }

    const extractHls = async () => {
      setLoading(true);
      setError(null);
      setHlsUrl(null);
      setUseEmbed(false);

      try {
        const response = await fetch(`/api/youtube-extract?url=${encodeURIComponent(channel.url)}`);
        const data = await response.json();

        if (data.hlsUrl) {
          setHlsUrl(data.hlsUrl);
        } else {
          // No HLS available, fall back to embed
          setUseEmbed(true);
        }
      } catch (err) {
        // On error, fall back to embed
        setUseEmbed(true);
      } finally {
        setLoading(false);
      }
    };

    extractHls();
  }, [channel.url, videoId]);

  // Initialize HLS player when we have an HLS URL
  useEffect(() => {
    if (!hlsUrl || !videoRef.current) return;

    const video = videoRef.current;

    // Cleanup previous instance
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    if (Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
        backBufferLength: 90,
      });

      hls.loadSource(hlsUrl);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        video.play().catch(() => {});
      });

      hls.on(Hls.Events.ERROR, (event, data) => {
        if (data.fatal) {
          console.error('HLS fatal error, falling back to embed:', data);
          setUseEmbed(true);
          setHlsUrl(null);
        }
      });

      hlsRef.current = hls;
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      // Native HLS support (Safari)
      video.src = hlsUrl;
      video.play().catch(() => {});
    } else {
      // No HLS support, fall back to embed
      setUseEmbed(true);
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [hlsUrl]);

  // Swipe gesture handlers
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
    touchEndX.current = e.touches[0].clientX;
    touchEndY.current = e.touches[0].clientY;
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    touchEndX.current = e.touches[0].clientX;
    touchEndY.current = e.touches[0].clientY;
  }, []);

  const handleTouchEnd = useCallback(() => {
    const deltaX = touchEndX.current - touchStartX.current;
    const deltaY = touchEndY.current - touchStartY.current;

    if (Math.abs(deltaX) > SWIPE_THRESHOLD && Math.abs(deltaY) < SWIPE_RESTRAINT) {
      if (deltaX > 0) {
        onSwipeRight?.();
      } else {
        onSwipeLeft?.();
      }
    }

    touchStartX.current = 0;
    touchStartY.current = 0;
    touchEndX.current = 0;
    touchEndY.current = 0;
  }, [onSwipeLeft, onSwipeRight]);

  const openOnYouTube = () => {
    window.open(channel.url, '_blank');
  };

  // Loading state
  if (loading) {
    return (
      <div className="relative w-full h-full bg-black flex items-center justify-center">
        <div className="text-center text-white/60">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />
          <p className="text-sm">Loading video...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error && !useEmbed) {
    return (
      <div className="relative w-full h-full bg-black flex items-center justify-center">
        <div className="text-center text-white/60">
          <p>{error}</p>
          <p className="text-sm text-white/40 mt-2">{channel.url}</p>
          <button
            onClick={openOnYouTube}
            className="mt-4 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg flex items-center gap-2 mx-auto"
          >
            <ExternalLink size={16} />
            Watch on YouTube
          </button>
        </div>
      </div>
    );
  }

  // HLS player
  if (hlsUrl && !useEmbed) {
    return (
      <div
        ref={containerRef}
        className="relative w-full h-full bg-black group touch-manipulation"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <video
          ref={videoRef}
          className="w-full h-full object-contain"
          controls
          playsInline
          autoPlay
        />
      </div>
    );
  }

  // YouTube embed fallback
  const embedUrl = videoId
    ? `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1`
    : null;

  if (!embedUrl) {
    return (
      <div className="relative w-full h-full bg-black flex items-center justify-center">
        <div className="text-center text-white/60">
          <p>Invalid YouTube URL</p>
          <p className="text-sm text-white/40 mt-2">{channel.url}</p>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full bg-black group touch-manipulation"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* YouTube iframe embed */}
      <iframe
        src={embedUrl}
        className="w-full h-full"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        title={channel.name}
      />

      {/* Watch on YouTube button - shown as fallback option */}
      <button
        onClick={openOnYouTube}
        className="absolute bottom-4 right-4 px-3 py-2 bg-black/70 hover:bg-black/90 text-white text-sm rounded-lg flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <ExternalLink size={14} />
        Open in YouTube
      </button>
    </div>
  );
}

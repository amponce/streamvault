'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { Sparkles } from 'lucide-react';
import { Channel } from '@/lib/channels';

interface YouTubePlayerProps {
  channel: Channel;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onAskAI?: () => void;
}

export default function YouTubePlayer({ channel, onSwipeLeft, onSwipeRight, onAskAI }: YouTubePlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);

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
  const embedUrl = videoId ? `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0` : null;

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
      {/* YouTube iframe */}
      <iframe
        src={embedUrl}
        className="w-full h-full"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        title={channel.name}
      />

      {/* Ask AI button - floating in corner */}
      {onAskAI && (
        <button
          onClick={onAskAI}
          className="absolute bottom-4 right-4 w-11 h-11 md:w-10 md:h-10 glass rounded-lg flex items-center justify-center
                     hover:bg-white/10 active:bg-white/20 transition-all touch-manipulation
                     group z-10"
          title="Ask AI about this content"
        >
          <Sparkles className="w-5 h-5 text-violet-400 group-hover:text-violet-300" />
          <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-violet-500 rounded-full" />
        </button>
      )}
    </div>
  );
}

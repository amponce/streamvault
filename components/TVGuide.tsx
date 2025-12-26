'use client';

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Channel } from '@/lib/channels';
import {
  getCurrentProgramForChannel,
  getUpcomingProgramsForChannel,
  formatEPGTime,
  formatEPGDuration,
  getEPGProgramProgress,
  EPGProgramSlot,
} from '@/lib/epgService';
import { Clock, Play, Calendar, Tv, Radio } from 'lucide-react';

interface TVGuideProps {
  channels: Channel[];
  selectedChannel?: Channel | null;
  onPlayChannel: (channel: Channel) => void;
  onClose?: () => void;
}

type TimeSlot = 'now' | '30min' | '1hr' | '2hr';

// Category emoji mapping (simpler than React components for this use case)
const CATEGORY_EMOJI: Record<string, string> = {
  Favorites: '❤️',
  All: '📺',
  Imported: '📥',
  Local: '🏠',
  News: '📰',
  Sports: '🏆',
  Entertainment: '🎬',
  Movies: '🎥',
  Music: '🎵',
  Kids: '👶',
  Documentary: '🎓',
  Horror: '💀',
  Comedy: '😂',
};

export function TVGuide({
  channels,
  selectedChannel,
  onPlayChannel,
  onClose,
}: TVGuideProps) {
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<TimeSlot>('now');
  const [currentTime, setCurrentTime] = useState<Date | null>(null);
  const [visibleChannels, setVisibleChannels] = useState(20);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Initialize time on client side only to avoid hydration mismatch
  useEffect(() => {
    setCurrentTime(new Date());
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  // Memoize program data - only recalculate when channels change
  const channelPrograms = useMemo(() => {
    const programs = new Map<string, { current: EPGProgramSlot | null; upcoming: EPGProgramSlot[] }>();

    if (!channels || channels.length === 0) return programs;

    channels.slice(0, visibleChannels).forEach(channel => {
      if (!channel || !channel.id) return;
      try {
        const current = getCurrentProgramForChannel(channel);
        const upcoming = getUpcomingProgramsForChannel(channel, 3);
        programs.set(channel.id, { current, upcoming });
      } catch (error) {
        console.error('Error getting program for channel:', channel.id, error);
        programs.set(channel.id, { current: null, upcoming: [] });
      }
    });

    return programs;
  }, [channels, visibleChannels]);

  // Get program to display based on time slot
  const getProgramForSlot = useCallback((
    channelId: string,
    slot: TimeSlot
  ): EPGProgramSlot | null => {
    const data = channelPrograms.get(channelId);
    if (!data) return null;

    switch (slot) {
      case 'now':
        return data.current;
      case '30min':
        return data.upcoming[0] || null;
      case '1hr':
        return data.upcoming[1] || null;
      case '2hr':
        return data.upcoming[2] || null;
      default:
        return data.current;
    }
  }, [channelPrograms]);

  // Load more channels on scroll
  const handleScroll = useCallback(() => {
    if (!scrollRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
    if (scrollHeight - scrollTop - clientHeight < 200) {
      setVisibleChannels(prev => Math.min(prev + 10, channels.length));
    }
  }, [channels.length]);

  // Handle channel click
  const handleChannelClick = useCallback((channel: Channel) => {
    if (!channel) return;
    try {
      onPlayChannel(channel);
    } catch (error) {
      console.error('Error playing channel:', error);
    }
  }, [onPlayChannel]);

  // Format current time (only render after hydration)
  const formattedTime = currentTime
    ? currentTime.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      })
    : '--:--';

  const formattedDate = currentTime
    ? currentTime.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
      })
    : '---';

  // Don't render channel list until we have channels
  if (!channels || channels.length === 0) {
    return (
      <div className="flex flex-col h-full bg-black/95 text-white items-center justify-center">
        <Radio className="w-12 h-12 text-white/20 mb-4" />
        <p className="text-white/40 text-sm">No channels available</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-black/95 text-white">
      {/* Header */}
      <div className="flex-shrink-0 flex items-center justify-between px-4 py-3 border-b border-white/10 bg-black/60 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500/20 to-red-600/20 border border-red-500/30 flex items-center justify-center">
            <Tv className="w-5 h-5 text-red-500" />
          </div>
          <div>
            <h2 className="font-bold text-base">TV Guide</h2>
            <div className="flex items-center gap-2 text-xs text-white/50">
              <Calendar className="w-3 h-3" />
              <span>{formattedDate}</span>
              <Clock className="w-3 h-3 ml-1" />
              <span>{formattedTime}</span>
            </div>
          </div>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="p-2 glass rounded-lg hover:bg-white/10 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Time Slot Selector */}
      <div className="flex-shrink-0 flex gap-1.5 px-4 py-3 border-b border-white/5 overflow-x-auto custom-scrollbar">
        {[
          { slot: 'now' as TimeSlot, label: 'Now' },
          { slot: '30min' as TimeSlot, label: 'Up Next' },
          { slot: '1hr' as TimeSlot, label: '+1 Hour' },
          { slot: '2hr' as TimeSlot, label: '+2 Hours' },
        ].map(({ slot, label }) => (
          <button
            key={slot}
            onClick={() => setSelectedTimeSlot(slot)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
              selectedTimeSlot === slot
                ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                : 'glass text-white/60 hover:text-white'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Channel Grid */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto custom-scrollbar min-h-0"
      >
        <div className="divide-y divide-white/5">
          {channels.slice(0, visibleChannels).map(channel => {
            if (!channel || !channel.id) return null;

            const program = getProgramForSlot(channel.id, selectedTimeSlot);
            const isSelected = selectedChannel?.id === channel.id;
            const progress = program && selectedTimeSlot === 'now'
              ? getEPGProgramProgress(program)
              : 0;

            return (
              <button
                key={channel.id}
                onClick={() => handleChannelClick(channel)}
                className={`w-full flex items-stretch text-left transition-all ${
                  isSelected
                    ? 'bg-red-500/10 border-l-2 border-l-red-500'
                    : 'hover:bg-white/5 border-l-2 border-l-transparent'
                }`}
              >
                {/* Channel Info */}
                <div className="flex-shrink-0 w-20 md:w-24 p-2.5 md:p-3 border-r border-white/5 flex flex-col items-center justify-center">
                  <span className="text-lg md:text-xl mb-0.5">
                    {CATEGORY_EMOJI[channel.category] || '📺'}
                  </span>
                  <span className="text-[10px] md:text-xs font-bold text-white/70">
                    CH {channel.number}
                  </span>
                  <span className="text-[9px] md:text-[10px] text-white/40 truncate max-w-full text-center">
                    {channel.name.length > 10
                      ? channel.name.substring(0, 10) + '...'
                      : channel.name}
                  </span>
                </div>

                {/* Program Info */}
                <div className="flex-1 p-2.5 md:p-3 min-w-0">
                  {program ? (
                    <>
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <h3 className="font-medium text-sm text-white truncate flex-1">
                          {program.title}
                        </h3>
                        <span className="text-[10px] text-white/40 flex-shrink-0">
                          {formatEPGTime(program.startTime)}
                        </span>
                      </div>
                      <p className="text-xs text-white/50 line-clamp-1 mb-1.5">
                        {program.description}
                      </p>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[10px] text-white/30">
                          {formatEPGDuration(program.duration)}
                        </span>
                        {program.rating && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-white/10 text-white/50">
                            {program.rating}
                          </span>
                        )}
                        {selectedTimeSlot === 'now' && program.isLive && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-red-500/20 text-red-400 flex items-center gap-1">
                            <span className="w-1 h-1 rounded-full bg-red-500 animate-pulse" />
                            LIVE
                          </span>
                        )}
                      </div>
                      {/* Progress bar for current programs */}
                      {selectedTimeSlot === 'now' && progress > 0 && (
                        <div className="mt-2 h-0.5 rounded-full bg-white/10 overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-red-500 to-red-400 transition-all"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="flex items-center h-full min-h-[40px]">
                      <span className="text-xs text-white/30">No program info available</span>
                    </div>
                  )}
                </div>

                {/* Play indicator */}
                <div className="flex-shrink-0 w-10 md:w-12 flex items-center justify-center border-l border-white/5">
                  <Play className={`w-4 h-4 ${isSelected ? 'text-red-500' : 'text-white/20'}`} />
                </div>
              </button>
            );
          })}
        </div>

        {/* Load more indicator */}
        {visibleChannels < channels.length && (
          <div className="py-4 text-center">
            <span className="text-xs text-white/40">
              Scroll to load more ({channels.length - visibleChannels} remaining)
            </span>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex-shrink-0 px-4 py-2 border-t border-white/10 flex items-center justify-between text-xs text-white/40">
        <span>{channels.length} channels</span>
        <span>
          Showing {selectedTimeSlot === 'now' ? 'current' : 'upcoming'} programs
        </span>
      </div>
    </div>
  );
}

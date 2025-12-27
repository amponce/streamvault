'use client';

import { memo } from 'react';
import { Heart } from 'lucide-react';
import { Channel } from '@/lib/channels';
import { categoryColors } from '@/lib/aiFeatures';

interface ChannelCardProps {
  channel: Channel;
  isSelected: boolean;
  isFavorite: boolean;
  animationDelay?: number;
  onPlay: () => void;
  onToggleFavorite: () => void;
  onMouseEnter?: (e: React.MouseEvent) => void;
  onMouseLeave?: () => void;
}

function ChannelCardComponent({
  channel,
  isSelected,
  isFavorite,
  animationDelay = 0,
  onPlay,
  onToggleFavorite,
  onMouseEnter,
  onMouseLeave,
}: ChannelCardProps) {
  return (
    <div
      onClick={onPlay}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onPlay();
        }
      }}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      role="button"
      tabIndex={0}
      className={`w-full glass-card channel-card rounded-xl p-3 text-left fade-in cursor-pointer ${
        isSelected ? 'glass-button-active glow-purple' : ''
      }`}
      style={{ animationDelay: `${animationDelay}ms` }}
      aria-label={`Play ${channel.name}, channel ${channel.number}`}
    >
      <div className="flex items-center gap-3">
        <div
          className={`w-12 h-12 rounded-lg flex items-center justify-center text-lg font-bold ${
            isSelected
              ? 'bg-white/20'
              : `bg-gradient-to-br ${categoryColors[channel.category] || 'from-violet-500 to-purple-500'} opacity-80`
          }`}
        >
          {channel.number}
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-medium text-sm truncate flex items-center gap-1.5">
            {channel.name}
            {channel.id.startsWith('pluto-') && (
              <span className="service-badge service-badge-pluto">
                PLUTO
              </span>
            )}
            {channel.id.startsWith('youtube-') && (
              <span className="service-badge service-badge-youtube">
                YT
              </span>
            )}
            {channel.id.startsWith('iptv-') && (
              <span className="service-badge service-badge-iptv">
                IPTV
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-xs text-white/40">{channel.category}</span>
            <span className="w-1.5 h-1.5 rounded-full status-live" />
          </div>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleFavorite();
          }}
          className={`p-2 rounded-lg transition-all ${
            isFavorite
              ? 'text-red-500 hover:text-red-400'
              : 'text-white/30 hover:text-white/60'
          }`}
          title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
          aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
        >
          <Heart size={18} fill={isFavorite ? 'currentColor' : 'none'} />
        </button>
        {isSelected && (
          <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-white/10 text-xs">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 pulse-live" />
            <span>LIVE</span>
          </div>
        )}
      </div>
    </div>
  );
}

// Memoize to prevent re-renders when parent state changes
export const ChannelCard = memo(ChannelCardComponent, (prevProps, nextProps) => {
  return (
    prevProps.channel.id === nextProps.channel.id &&
    prevProps.isSelected === nextProps.isSelected &&
    prevProps.isFavorite === nextProps.isFavorite &&
    prevProps.animationDelay === nextProps.animationDelay
  );
});

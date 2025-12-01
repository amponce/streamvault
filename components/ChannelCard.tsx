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
}

function ChannelCardComponent({
  channel,
  isSelected,
  isFavorite,
  animationDelay = 0,
  onPlay,
  onToggleFavorite,
}: ChannelCardProps) {
  return (
    <button
      onClick={onPlay}
      className={`w-full glass-card channel-card rounded-xl p-3 text-left fade-in ${
        isSelected ? 'glass-button-active glow-purple' : ''
      }`}
      style={{ animationDelay: `${animationDelay}ms` }}
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
              <span className="px-1.5 py-0.5 text-[10px] font-bold bg-gradient-to-r from-cyan-500 to-blue-500 rounded text-white">
                PLUTO
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
    </button>
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

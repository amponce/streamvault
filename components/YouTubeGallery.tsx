'use client';

import { Channel } from '@/lib/channels';
import { Heart } from 'lucide-react';

interface YouTubeGalleryProps {
  channels: Channel[];
  selectedChannelId?: string;
  favorites: Set<string>;
  onPlay: (channel: Channel) => void;
  onToggleFavorite: (channel: Channel) => void;
}

export function YouTubeGallery({
  channels,
  selectedChannelId,
  favorites,
  onPlay,
  onToggleFavorite,
}: YouTubeGalleryProps) {
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

  // Get thumbnail URL for YouTube video
  const getThumbnailUrl = (channel: Channel): string => {
    const videoId = getYouTubeId(channel.url);
    if (!videoId) return '/placeholder-video.jpg';

    // Use YouTube's high quality thumbnail
    return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-4">
      {channels.map((channel) => {
        const isFavorite = favorites.has(channel.id);
        const isSelected = selectedChannelId === channel.id;
        const thumbnailUrl = getThumbnailUrl(channel);

        return (
          <div
            key={channel.id}
            className={`group relative glass-card rounded-xl overflow-hidden transition-all duration-300 hover:scale-105 cursor-pointer ${
              isSelected ? 'ring-2 ring-red-500 shadow-lg shadow-red-500/20' : ''
            }`}
            onClick={() => onPlay(channel)}
          >
            {/* Thumbnail */}
            <div className="relative aspect-video w-full overflow-hidden bg-gray-900">
              <img
                src={thumbnailUrl}
                alt={channel.name}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                loading="lazy"
                onError={(e) => {
                  // Fallback to medium quality thumbnail
                  const target = e.target as HTMLImageElement;
                  const videoId = getYouTubeId(channel.url);
                  if (videoId && !target.src.includes('mqdefault')) {
                    target.src = `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`;
                  }
                }}
              />

              {/* Overlay gradient */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

              {/* Play icon overlay */}
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <div className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-red-500/90 backdrop-blur-sm flex items-center justify-center shadow-xl">
                  <svg className="w-6 h-6 md:w-8 md:h-8 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </div>
              </div>

              {/* Channel number badge */}
              <div className="absolute top-2 left-2 px-2 py-1 rounded-lg bg-black/80 backdrop-blur-sm text-xs font-bold text-white">
                #{channel.number}
              </div>

              {/* Favorite button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleFavorite(channel);
                }}
                className={`absolute top-2 right-2 p-2 rounded-lg backdrop-blur-sm transition-all ${
                  isFavorite
                    ? 'bg-red-500/80 text-white'
                    : 'bg-black/60 text-white/60 hover:bg-black/80 hover:text-white'
                }`}
                title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
              >
                <Heart size={14} fill={isFavorite ? 'currentColor' : 'none'} />
              </button>

              {/* Now playing indicator */}
              {isSelected && (
                <div className="absolute bottom-2 left-2 flex items-center gap-1.5 px-2 py-1 rounded-lg bg-red-500/90 backdrop-blur-sm text-xs font-bold">
                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                  <span>PLAYING</span>
                </div>
              )}
            </div>

            {/* Title */}
            <div className="p-2 md:p-3">
              <h3 className="text-xs md:text-sm font-medium text-white line-clamp-2 leading-tight group-hover:text-red-400 transition-colors">
                {channel.name}
              </h3>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-[10px] md:text-xs text-white/40">{channel.category}</span>
                <span className="px-1.5 py-0.5 rounded text-[9px] md:text-[10px] font-bold bg-red-500/20 text-red-400">
                  YT
                </span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

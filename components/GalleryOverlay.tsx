'use client';

import { useState, useMemo } from 'react';
import { Channel } from '@/lib/channels';
import { YouTubeGallery } from './YouTubeGallery';
import { ChevronDown, X, Film, Tag } from 'lucide-react';

// Genre display names and icons
const GENRE_INFO: Record<string, { label: string; icon: string }> = {
  horror: { label: 'Horror', icon: '👻' },
  slasher: { label: 'Slasher', icon: '🔪' },
  supernatural: { label: 'Supernatural', icon: '👁️' },
  paranormal: { label: 'Paranormal', icon: '🌀' },
  zombie: { label: 'Zombie', icon: '🧟' },
  vampire: { label: 'Vampire', icon: '🧛' },
  creature: { label: 'Creature', icon: '👾' },
  splatter: { label: 'Splatter', icon: '🩸' },
  psychological: { label: 'Psychological', icon: '🧠' },
  folk: { label: 'Folk Horror', icon: '🌾' },
  cosmic: { label: 'Cosmic', icon: '🌌' },
  'found-footage': { label: 'Found Footage', icon: '📹' },
  anthology: { label: 'Anthology', icon: '📚' },
  classic: { label: 'Classic', icon: '🎬' },
  'b-movie': { label: 'B-Movie', icon: '🎪' },
  thriller: { label: 'Thriller', icon: '😱' },
  'sci-fi-horror': { label: 'Sci-Fi Horror', icon: '🛸' },
  'comedy-horror': { label: 'Comedy Horror', icon: '😂' },
};

interface GalleryOverlayProps {
  channels: Channel[];
  selectedChannelId?: string;
  favoriteIds: Set<string>;
  onPlay: (channel: Channel) => void;
  onToggleFavorite: (channel: Channel) => void;
  onClose: () => void;
}

export function GalleryOverlay({
  channels,
  selectedChannelId,
  favoriteIds,
  onPlay,
  onToggleFavorite,
  onClose,
}: GalleryOverlayProps) {
  const [selectedSource, setSelectedSource] = useState<string>('all');
  const [selectedGenre, setSelectedGenre] = useState<string>('all');
  const [selectedContentType, setSelectedContentType] = useState<string>('movie'); // Default to movies only
  const [showSourceDropdown, setShowSourceDropdown] = useState(false);
  const [showGenreDropdown, setShowGenreDropdown] = useState(false);

  // Get unique sources from channels
  const sources = useMemo(() => {
    const sourceSet = new Set<string>();
    channels.forEach(ch => {
      if (ch.source) {
        sourceSet.add(ch.source);
      }
    });
    return Array.from(sourceSet).sort();
  }, [channels]);

  // Get unique genres from channels
  const genres = useMemo(() => {
    const genreSet = new Set<string>();
    channels.forEach(ch => {
      if (ch.genres) {
        ch.genres.forEach(g => genreSet.add(g));
      }
    });
    return Array.from(genreSet).sort();
  }, [channels]);

  // Filter channels by selected source, genre, and content type
  const filteredChannels = useMemo(() => {
    let result = channels;

    if (selectedSource !== 'all') {
      result = result.filter(ch => ch.source === selectedSource);
    }

    if (selectedGenre !== 'all') {
      result = result.filter(ch => ch.genres?.includes(selectedGenre));
    }

    if (selectedContentType !== 'all') {
      result = result.filter(ch => ch.contentType === selectedContentType);
    }

    return result;
  }, [channels, selectedSource, selectedGenre, selectedContentType]);

  // Count channels per source
  const sourceCounts = useMemo(() => {
    const counts: Record<string, number> = { all: channels.length };
    channels.forEach(ch => {
      if (ch.source) {
        counts[ch.source] = (counts[ch.source] || 0) + 1;
      }
    });
    return counts;
  }, [channels]);

  // Count channels per genre
  const genreCounts = useMemo(() => {
    const counts: Record<string, number> = { all: channels.length };
    channels.forEach(ch => {
      if (ch.genres) {
        ch.genres.forEach(g => {
          counts[g] = (counts[g] || 0) + 1;
        });
      }
    });
    return counts;
  }, [channels]);

  return (
    <div className="absolute inset-0 z-40 bg-black/90 backdrop-blur-sm overflow-hidden flex flex-col">
      {/* Gallery Header */}
      <div className="flex items-center justify-between p-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <span className="text-xl">🎬</span>
          <div>
            <h2 className="text-lg font-bold text-white">Horror Collection</h2>
            <p className="text-xs text-white/50">
              {filteredChannels.length} movies available
              {selectedSource !== 'all' && ` from ${selectedSource}`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Genre Filter Dropdown */}
          {genres.length > 0 && (
            <div className="relative">
              <button
                onClick={() => {
                  setShowGenreDropdown(!showGenreDropdown);
                  setShowSourceDropdown(false);
                }}
                className="flex items-center gap-2 px-3 py-2 glass rounded-lg hover:bg-white/10 transition-colors text-sm"
              >
                <Tag size={16} className="text-purple-400" />
                <span className="text-white/80">
                  {selectedGenre === 'all'
                    ? 'All Genres'
                    : GENRE_INFO[selectedGenre]?.label || selectedGenre}
                </span>
                <ChevronDown
                  size={16}
                  className={`text-white/50 transition-transform ${showGenreDropdown ? 'rotate-180' : ''}`}
                />
              </button>

              {showGenreDropdown && (
                <div className="absolute top-full right-0 mt-1 w-56 py-1 rounded-xl bg-gray-900/95 backdrop-blur-xl border border-white/20 z-50 overflow-hidden shadow-2xl max-h-80 overflow-y-auto">
                  <button
                    onClick={() => {
                      setSelectedGenre('all');
                      setShowGenreDropdown(false);
                    }}
                    className={`w-full px-4 py-2.5 flex items-center justify-between text-sm font-medium transition-all ${
                      selectedGenre === 'all'
                        ? 'bg-purple-500/20 text-purple-400'
                        : 'text-white hover:bg-white/10'
                    }`}
                  >
                    <span>All Genres</span>
                    <span className="text-xs text-white/40">{channels.length}</span>
                  </button>

                  <div className="border-t border-white/10 my-1" />

                  {genres.map(genre => (
                    <button
                      key={genre}
                      onClick={() => {
                        setSelectedGenre(genre);
                        setShowGenreDropdown(false);
                      }}
                      className={`w-full px-4 py-2.5 flex items-center justify-between text-sm font-medium transition-all ${
                        selectedGenre === genre
                          ? 'bg-purple-500/20 text-purple-400'
                          : 'text-white hover:bg-white/10'
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <span>{GENRE_INFO[genre]?.icon || '🎬'}</span>
                        <span>{GENRE_INFO[genre]?.label || genre}</span>
                      </span>
                      <span className="text-xs text-white/40">{genreCounts[genre] || 0}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Source Filter Dropdown */}
          {sources.length > 0 && (
            <div className="relative">
              <button
                onClick={() => {
                  setShowSourceDropdown(!showSourceDropdown);
                  setShowGenreDropdown(false);
                }}
                className="flex items-center gap-2 px-3 py-2 glass rounded-lg hover:bg-white/10 transition-colors text-sm"
              >
                <Film size={16} className="text-red-400" />
                <span className="text-white/80">
                  {selectedSource === 'all' ? 'All Channels' : selectedSource}
                </span>
                <ChevronDown
                  size={16}
                  className={`text-white/50 transition-transform ${showSourceDropdown ? 'rotate-180' : ''}`}
                />
              </button>

              {showSourceDropdown && (
                <div className="absolute top-full right-0 mt-1 w-56 py-1 rounded-xl bg-gray-900/95 backdrop-blur-xl border border-white/20 z-50 overflow-hidden shadow-2xl">
                  <button
                    onClick={() => {
                      setSelectedSource('all');
                      setShowSourceDropdown(false);
                    }}
                    className={`w-full px-4 py-2.5 flex items-center justify-between text-sm font-medium transition-all ${
                      selectedSource === 'all'
                        ? 'bg-red-500/20 text-red-400'
                        : 'text-white hover:bg-white/10'
                    }`}
                  >
                    <span>All Channels</span>
                    <span className="text-xs text-white/40">{sourceCounts.all}</span>
                  </button>

                  <div className="border-t border-white/10 my-1" />

                  {sources.map(source => (
                    <button
                      key={source}
                      onClick={() => {
                        setSelectedSource(source);
                        setShowSourceDropdown(false);
                      }}
                      className={`w-full px-4 py-2.5 flex items-center justify-between text-sm font-medium transition-all ${
                        selectedSource === source
                          ? 'bg-red-500/20 text-red-400'
                          : 'text-white hover:bg-white/10'
                      }`}
                    >
                      <span>{source}</span>
                      <span className="text-xs text-white/40">{sourceCounts[source] || 0}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Close Button */}
          <button
            onClick={onClose}
            className="p-2 glass rounded-lg hover:bg-white/10 transition-colors"
            title="Close gallery"
          >
            <X size={24} />
          </button>
        </div>
      </div>

      {/* Filter Pills Row */}
      {(sources.length > 1 || genres.length > 0) && (
        <div className="px-4 py-2 border-b border-white/5 space-y-2">
          {/* Source Pills */}
          {sources.length > 1 && (
            <div className="flex gap-2 overflow-x-auto custom-scrollbar pb-1">
              <span className="text-xs text-white/30 py-1.5 pr-2">Channel:</span>
              <button
                onClick={() => setSelectedSource('all')}
                className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                  selectedSource === 'all'
                    ? 'bg-red-500/30 text-red-300 border border-red-500/50'
                    : 'glass text-white/60 hover:text-white'
                }`}
              >
                All ({sourceCounts.all})
              </button>
              {sources.map(source => (
                <button
                  key={source}
                  onClick={() => setSelectedSource(source)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                    selectedSource === source
                      ? 'bg-red-500/30 text-red-300 border border-red-500/50'
                      : 'glass text-white/60 hover:text-white'
                  }`}
                >
                  {source} ({sourceCounts[source] || 0})
                </button>
              ))}
            </div>
          )}

          {/* Content Type Pills */}
          <div className="flex gap-2 overflow-x-auto custom-scrollbar pb-1">
            <span className="text-xs text-white/30 py-1.5 pr-2">Type:</span>
            {[
              { id: 'all', label: 'All', icon: '📺' },
              { id: 'movie', label: 'Full Movies', icon: '🎬' },
              { id: 'trailer', label: 'Trailers', icon: '🎞️' },
              { id: 'short', label: 'Shorts', icon: '⏱️' },
            ].map(type => (
              <button
                key={type.id}
                onClick={() => setSelectedContentType(type.id)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all flex items-center gap-1 ${
                  selectedContentType === type.id
                    ? 'bg-green-500/30 text-green-300 border border-green-500/50'
                    : 'glass text-white/60 hover:text-white'
                }`}
              >
                <span>{type.icon}</span>
                <span>{type.label}</span>
              </button>
            ))}
          </div>

          {/* Genre Pills */}
          {genres.length > 0 && (
            <div className="flex gap-2 overflow-x-auto custom-scrollbar pb-1">
              <span className="text-xs text-white/30 py-1.5 pr-2">Genre:</span>
              <button
                onClick={() => setSelectedGenre('all')}
                className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                  selectedGenre === 'all'
                    ? 'bg-purple-500/30 text-purple-300 border border-purple-500/50'
                    : 'glass text-white/60 hover:text-white'
                }`}
              >
                All
              </button>
              {genres.map(genre => (
                <button
                  key={genre}
                  onClick={() => setSelectedGenre(genre)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all flex items-center gap-1 ${
                    selectedGenre === genre
                      ? 'bg-purple-500/30 text-purple-300 border border-purple-500/50'
                      : 'glass text-white/60 hover:text-white'
                  }`}
                >
                  <span>{GENRE_INFO[genre]?.icon || '🎬'}</span>
                  <span>{GENRE_INFO[genre]?.label || genre}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Gallery Content */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-4">
        {filteredChannels.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-white/40">
            <Film size={48} className="mb-4 opacity-50" />
            <p>No movies found for this source</p>
          </div>
        ) : (
          <YouTubeGallery
            channels={filteredChannels}
            selectedChannelId={selectedChannelId}
            favorites={favoriteIds}
            onPlay={onPlay}
            onToggleFavorite={onToggleFavorite}
          />
        )}
      </div>
    </div>
  );
}

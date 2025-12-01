'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { Search, Filter, Globe, Tv, Play, Plus, Loader2, ChevronDown, X } from 'lucide-react';
import { Channel } from '@/lib/channels';

interface SearchResult {
  id: string;
  name: string;
  altNames: string[];
  country: string;
  categories: string[];
  logo: string;
  website: string | null;
  streams: {
    url: string;
    quality: string | null;
    title: string | null;
  }[];
}

interface SearchResponse {
  results: SearchResult[];
  total: number;
  limit: number;
  offset: number;
}

interface CategoryOption {
  id: string;
  name: string;
}

interface CountryOption {
  code: string;
  name: string;
  flag: string;
}

interface ChannelSearchProps {
  onAddChannel: (channel: Channel) => void;
  onPlayChannel?: (channel: Channel) => void;
}

export function ChannelSearch({ onAddChannel, onPlayChannel }: ChannelSearchProps) {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('');
  const [country, setCountry] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [countries, setCountries] = useState<CountryOption[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [offset, setOffset] = useState(0);
  const limit = 20;

  // Fetch filter options on mount
  useEffect(() => {
    async function loadFilters() {
      try {
        const [catRes, countryRes] = await Promise.all([
          fetch('/api/iptv-search?list=categories'),
          fetch('/api/iptv-search?list=countries'),
        ]);

        if (catRes.ok) {
          const catData = await catRes.json();
          setCategories(catData.categories || []);
        }

        if (countryRes.ok) {
          const countryData = await countryRes.json();
          setCountries(countryData.countries || []);
        }
      } catch {
        console.error('Failed to load filter options');
      }
    }
    loadFilters();
  }, []);

  const search = useCallback(async (newOffset = 0) => {
    if (!query && !category && !country) {
      setResults([]);
      setTotal(0);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (query) params.set('q', query);
      if (category) params.set('category', category);
      if (country) params.set('country', country);
      params.set('limit', limit.toString());
      params.set('offset', newOffset.toString());

      const response = await fetch(`/api/iptv-search?${params}`);

      if (!response.ok) {
        throw new Error('Search failed');
      }

      const data: SearchResponse = await response.json();
      setResults(data.results);
      setTotal(data.total);
      setOffset(newOffset);
    } catch (err) {
      setError('Failed to search channels. Please try again.');
      console.error('Search error:', err);
    } finally {
      setLoading(false);
    }
  }, [query, category, country]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    search(0);
  };

  const handleAddChannel = (result: SearchResult, streamIndex = 0) => {
    const stream = result.streams[streamIndex];
    if (!stream) return;

    const channel: Channel = {
      id: `iptv-${result.id}-${Date.now()}`,
      number: 900 + Math.floor(Math.random() * 100),
      name: result.name,
      category: result.categories[0] || 'Entertainment',
      url: stream.url,
    };

    onAddChannel(channel);
  };

  const handlePlayChannel = (result: SearchResult, streamIndex = 0) => {
    if (!onPlayChannel) return;

    const stream = result.streams[streamIndex];
    if (!stream) return;

    const channel: Channel = {
      id: `iptv-${result.id}-${Date.now()}`,
      number: 900 + Math.floor(Math.random() * 100),
      name: result.name,
      category: result.categories[0] || 'Entertainment',
      url: stream.url,
    };

    onPlayChannel(channel);
  };

  const clearFilters = () => {
    setCategory('');
    setCountry('');
    setQuery('');
    setResults([]);
    setTotal(0);
  };

  const hasFilters = category || country;

  return (
    <div className="space-y-4">
      {/* Search Form */}
      <form onSubmit={handleSearch} className="space-y-3">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search channels (e.g., CNN, BBC, ESPN)..."
              className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            type="button"
            onClick={() => setShowFilters(!showFilters)}
            className={`px-3 py-2 rounded-lg border transition-colors ${
              hasFilters
                ? 'bg-blue-600 border-blue-500 text-white'
                : 'bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700'
            }`}
          >
            <Filter className="w-4 h-4" />
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Search'}
          </button>
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="flex flex-wrap gap-3 p-3 bg-gray-800/50 rounded-lg">
            <div className="flex-1 min-w-[150px]">
              <label className="block text-xs text-gray-400 mb-1">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Categories</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex-1 min-w-[150px]">
              <label className="block text-xs text-gray-400 mb-1">Country</label>
              <select
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Countries</option>
                {countries.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.flag} {c.name}
                  </option>
                ))}
              </select>
            </div>

            {hasFilters && (
              <button
                type="button"
                onClick={clearFilters}
                className="self-end px-3 py-2 text-sm text-gray-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        )}
      </form>

      {/* Error */}
      {error && (
        <div className="p-3 bg-red-900/30 border border-red-800 rounded-lg text-red-300 text-sm">
          {error}
        </div>
      )}

      {/* Results */}
      {results.length > 0 && (
        <div className="space-y-2">
          <div className="text-sm text-gray-400">
            Showing {offset + 1}-{Math.min(offset + results.length, total)} of {total} channels
          </div>

          <div className="max-h-[400px] overflow-y-auto space-y-2 pr-2">
            {results.map((result) => (
              <div
                key={result.id}
                className="flex items-center gap-3 p-3 bg-gray-800 rounded-lg hover:bg-gray-750 transition-colors"
              >
                {/* Logo */}
                <div className="w-12 h-12 flex-shrink-0 bg-gray-700 rounded-lg overflow-hidden">
                  {result.logo ? (
                    <img
                      src={result.logo}
                      alt={result.name}
                      className="w-full h-full object-contain"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Tv className="w-6 h-6 text-gray-500" />
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-white truncate">{result.name}</h4>
                  <div className="flex items-center gap-2 text-xs text-gray-400">
                    <span className="flex items-center gap-1">
                      <Globe className="w-3 h-3" />
                      {result.country}
                    </span>
                    {result.categories.length > 0 && (
                      <>
                        <span>•</span>
                        <span>{result.categories.slice(0, 2).join(', ')}</span>
                      </>
                    )}
                    {result.streams.length > 1 && (
                      <>
                        <span>•</span>
                        <span>{result.streams.length} streams</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  {result.streams.length > 1 ? (
                    <div className="relative group">
                      <button className="px-3 py-1.5 bg-gray-700 text-white rounded-lg text-sm hover:bg-gray-600 flex items-center gap-1">
                        Streams <ChevronDown className="w-3 h-3" />
                      </button>
                      <div className="absolute right-0 mt-1 w-48 bg-gray-800 border border-gray-700 rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
                        {result.streams.map((stream, i) => (
                          <button
                            key={i}
                            onClick={() => handleAddChannel(result, i)}
                            className="w-full px-3 py-2 text-left text-sm text-gray-300 hover:bg-gray-700 first:rounded-t-lg last:rounded-b-lg"
                          >
                            {stream.quality || stream.title || `Stream ${i + 1}`}
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <>
                      {onPlayChannel && (
                        <button
                          onClick={() => handlePlayChannel(result)}
                          className="p-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700"
                          title="Play"
                        >
                          <Play className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        onClick={() => handleAddChannel(result)}
                        className="p-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                        title="Add to channels"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {total > limit && (
            <div className="flex justify-center gap-2 pt-2">
              <button
                onClick={() => search(Math.max(0, offset - limit))}
                disabled={offset === 0 || loading}
                className="px-3 py-1 bg-gray-800 text-gray-300 rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              >
                Previous
              </button>
              <span className="px-3 py-1 text-gray-400 text-sm">
                Page {Math.floor(offset / limit) + 1} of {Math.ceil(total / limit)}
              </span>
              <button
                onClick={() => search(offset + limit)}
                disabled={offset + limit >= total || loading}
                className="px-3 py-1 bg-gray-800 text-gray-300 rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              >
                Next
              </button>
            </div>
          )}
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && results.length === 0 && (query || hasFilters) && (
        <div className="text-center py-8 text-gray-400">
          <Search className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>No channels found matching your search.</p>
          <p className="text-sm mt-1">Try different keywords or filters.</p>
        </div>
      )}

      {/* Initial State */}
      {!loading && !error && results.length === 0 && !query && !hasFilters && (
        <div className="text-center py-8 text-gray-400">
          <Globe className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>Search the iptv-org database</p>
          <p className="text-sm mt-1">Over 10,000+ channels from around the world</p>
        </div>
      )}
    </div>
  );
}

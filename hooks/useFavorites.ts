/**
 * React hook for favorites management
 */

import { useState, useEffect, useCallback } from 'react';
import { Channel } from '@/lib/channels';
import {
  getFavorites,
  getFavoriteIds,
  toggleFavorite,
  addFavorite,
  removeFavorite,
  clearFavorites,
  downloadFavoritesExport,
  importFavoritesFromFile,
  FavoriteEntry,
} from '@/lib/favorites';

export interface UseFavoritesReturn {
  favorites: FavoriteEntry[];
  favoriteIds: Set<string>;
  isLoading: boolean;
  isFavorite: (channelId: string) => boolean;
  toggle: (channel: Channel) => Promise<void>;
  add: (channel: Channel) => Promise<void>;
  remove: (channelId: string) => Promise<void>;
  clear: () => Promise<void>;
  exportToFile: () => Promise<void>;
  importFromFile: (file: File, mode?: 'merge' | 'replace') => Promise<{ added: number; skipped: number }>;
  refresh: () => Promise<void>;
}

export function useFavorites(): UseFavoritesReturn {
  const [favorites, setFavorites] = useState<FavoriteEntry[]>([]);
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);

  // Load favorites on mount
  const refresh = useCallback(async () => {
    try {
      const [entries, ids] = await Promise.all([
        getFavorites(),
        getFavoriteIds(),
      ]);
      setFavorites(entries);
      setFavoriteIds(ids);
    } catch (error) {
      console.error('Failed to load favorites:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const isFavorite = useCallback(
    (channelId: string) => favoriteIds.has(channelId),
    [favoriteIds]
  );

  const toggle = useCallback(
    async (channel: Channel) => {
      const nowFavorite = await toggleFavorite(channel.id, channel);

      // Optimistic update
      setFavoriteIds(prev => {
        const next = new Set(prev);
        if (nowFavorite) {
          next.add(channel.id);
        } else {
          next.delete(channel.id);
        }
        return next;
      });

      if (nowFavorite) {
        setFavorites(prev => [
          { channelId: channel.id, addedAt: Date.now(), channelData: { name: channel.name, url: channel.url, category: channel.category } },
          ...prev,
        ]);
      } else {
        setFavorites(prev => prev.filter(f => f.channelId !== channel.id));
      }
    },
    []
  );

  const add = useCallback(
    async (channel: Channel) => {
      await addFavorite(channel.id, channel);
      setFavoriteIds(prev => new Set([...prev, channel.id]));
      setFavorites(prev => [
        { channelId: channel.id, addedAt: Date.now(), channelData: { name: channel.name, url: channel.url, category: channel.category } },
        ...prev.filter(f => f.channelId !== channel.id),
      ]);
    },
    []
  );

  const remove = useCallback(
    async (channelId: string) => {
      await removeFavorite(channelId);
      setFavoriteIds(prev => {
        const next = new Set(prev);
        next.delete(channelId);
        return next;
      });
      setFavorites(prev => prev.filter(f => f.channelId !== channelId));
    },
    []
  );

  const clear = useCallback(async () => {
    await clearFavorites();
    setFavorites([]);
    setFavoriteIds(new Set());
  }, []);

  const exportToFile = useCallback(async () => {
    await downloadFavoritesExport();
  }, []);

  const importFromFile = useCallback(
    async (file: File, mode: 'merge' | 'replace' = 'merge') => {
      const result = await importFavoritesFromFile(file, mode);
      await refresh();
      return result;
    },
    [refresh]
  );

  return {
    favorites,
    favoriteIds,
    isLoading,
    isFavorite,
    toggle,
    add,
    remove,
    clear,
    exportToFile,
    importFromFile,
    refresh,
  };
}

/**
 * Favorites System with IndexedDB + localStorage fallback
 * Supports import/export for backup and cross-device transfer
 */

import { Channel } from './channels';

const DB_NAME = 'streamvault_db';
const DB_VERSION = 1;
const FAVORITES_STORE = 'favorites';
const LOCALSTORAGE_KEY = 'streamvault_favorites';

// Favorite entry with metadata
export interface FavoriteEntry {
  channelId: string;
  addedAt: number;
  // Optional cached channel data for export
  channelData?: {
    name: string;
    url: string;
    category?: string;
    logo?: string;
  };
}

// Export format
export interface FavoritesExport {
  version: 1;
  exportedAt: string;
  favorites: FavoriteEntry[];
}

let db: IDBDatabase | null = null;
let dbInitPromise: Promise<IDBDatabase> | null = null;

/**
 * Initialize IndexedDB
 */
function initDB(): Promise<IDBDatabase> {
  if (db) return Promise.resolve(db);
  if (dbInitPromise) return dbInitPromise;

  dbInitPromise = new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB not available'));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      console.error('IndexedDB error:', request.error);
      reject(request.error);
    };

    request.onsuccess = () => {
      db = request.result;
      resolve(db);
    };

    request.onupgradeneeded = (event) => {
      const database = (event.target as IDBOpenDBRequest).result;

      // Create favorites store with channelId as key
      if (!database.objectStoreNames.contains(FAVORITES_STORE)) {
        const store = database.createObjectStore(FAVORITES_STORE, { keyPath: 'channelId' });
        store.createIndex('addedAt', 'addedAt', { unique: false });
      }
    };
  });

  return dbInitPromise;
}

/**
 * Fallback to localStorage if IndexedDB fails
 */
function getLocalStorageFavorites(): FavoriteEntry[] {
  if (typeof window === 'undefined') return [];
  try {
    const saved = localStorage.getItem(LOCALSTORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      // Handle old format (just array of IDs)
      if (Array.isArray(parsed) && typeof parsed[0] === 'string') {
        return parsed.map((id: string) => ({
          channelId: id,
          addedAt: Date.now(),
        }));
      }
      return parsed;
    }
  } catch {
    // Ignore
  }
  return [];
}

function saveLocalStorageFavorites(favorites: FavoriteEntry[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(LOCALSTORAGE_KEY, JSON.stringify(favorites));
  } catch {
    // Ignore
  }
}

/**
 * Get all favorites
 */
export async function getFavorites(): Promise<FavoriteEntry[]> {
  try {
    const database = await initDB();
    return new Promise((resolve, reject) => {
      const tx = database.transaction(FAVORITES_STORE, 'readonly');
      const store = tx.objectStore(FAVORITES_STORE);
      const request = store.getAll();

      request.onsuccess = () => {
        const results = request.result || [];
        // Sort by addedAt descending (newest first)
        results.sort((a, b) => b.addedAt - a.addedAt);
        resolve(results);
      };

      request.onerror = () => reject(request.error);
    });
  } catch {
    // Fallback to localStorage
    return getLocalStorageFavorites();
  }
}

/**
 * Get favorite channel IDs only
 */
export async function getFavoriteIds(): Promise<Set<string>> {
  const favorites = await getFavorites();
  return new Set(favorites.map(f => f.channelId));
}

/**
 * Check if a channel is favorited
 */
export async function isFavorite(channelId: string): Promise<boolean> {
  try {
    const database = await initDB();
    return new Promise((resolve, reject) => {
      const tx = database.transaction(FAVORITES_STORE, 'readonly');
      const store = tx.objectStore(FAVORITES_STORE);
      const request = store.get(channelId);

      request.onsuccess = () => resolve(!!request.result);
      request.onerror = () => reject(request.error);
    });
  } catch {
    const favorites = getLocalStorageFavorites();
    return favorites.some(f => f.channelId === channelId);
  }
}

/**
 * Add a channel to favorites
 */
export async function addFavorite(channelId: string, channelData?: Channel): Promise<void> {
  const entry: FavoriteEntry = {
    channelId,
    addedAt: Date.now(),
    channelData: channelData ? {
      name: channelData.name,
      url: channelData.url,
      category: channelData.category,
    } : undefined,
  };

  try {
    const database = await initDB();
    return new Promise((resolve, reject) => {
      const tx = database.transaction(FAVORITES_STORE, 'readwrite');
      const store = tx.objectStore(FAVORITES_STORE);
      const request = store.put(entry);

      request.onsuccess = () => {
        // Also update localStorage as backup
        syncToLocalStorage();
        resolve();
      };
      request.onerror = () => reject(request.error);
    });
  } catch {
    // Fallback to localStorage
    const favorites = getLocalStorageFavorites();
    if (!favorites.some(f => f.channelId === channelId)) {
      favorites.push(entry);
      saveLocalStorageFavorites(favorites);
    }
  }
}

/**
 * Remove a channel from favorites
 */
export async function removeFavorite(channelId: string): Promise<void> {
  try {
    const database = await initDB();
    return new Promise((resolve, reject) => {
      const tx = database.transaction(FAVORITES_STORE, 'readwrite');
      const store = tx.objectStore(FAVORITES_STORE);
      const request = store.delete(channelId);

      request.onsuccess = () => {
        syncToLocalStorage();
        resolve();
      };
      request.onerror = () => reject(request.error);
    });
  } catch {
    const favorites = getLocalStorageFavorites().filter(f => f.channelId !== channelId);
    saveLocalStorageFavorites(favorites);
  }
}

/**
 * Toggle favorite status
 */
export async function toggleFavorite(channelId: string, channelData?: Channel): Promise<boolean> {
  const isFav = await isFavorite(channelId);
  if (isFav) {
    await removeFavorite(channelId);
    return false;
  } else {
    await addFavorite(channelId, channelData);
    return true;
  }
}

/**
 * Clear all favorites
 */
export async function clearFavorites(): Promise<void> {
  try {
    const database = await initDB();
    return new Promise((resolve, reject) => {
      const tx = database.transaction(FAVORITES_STORE, 'readwrite');
      const store = tx.objectStore(FAVORITES_STORE);
      const request = store.clear();

      request.onsuccess = () => {
        localStorage.removeItem(LOCALSTORAGE_KEY);
        resolve();
      };
      request.onerror = () => reject(request.error);
    });
  } catch {
    localStorage.removeItem(LOCALSTORAGE_KEY);
  }
}

/**
 * Sync IndexedDB to localStorage for backup
 */
async function syncToLocalStorage(): Promise<void> {
  try {
    const favorites = await getFavorites();
    saveLocalStorageFavorites(favorites);
  } catch {
    // Ignore
  }
}

/**
 * Export favorites to JSON
 */
export async function exportFavorites(): Promise<FavoritesExport> {
  const favorites = await getFavorites();
  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    favorites,
  };
}

/**
 * Export favorites and trigger download
 */
export async function downloadFavoritesExport(): Promise<void> {
  const data = await exportFavorites();
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = `streamvault-favorites-${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Import favorites from JSON
 */
export async function importFavorites(
  data: FavoritesExport,
  mode: 'merge' | 'replace' = 'merge'
): Promise<{ added: number; skipped: number }> {
  if (data.version !== 1) {
    throw new Error('Unsupported export version');
  }

  let added = 0;
  let skipped = 0;

  if (mode === 'replace') {
    await clearFavorites();
  }

  const existingIds = await getFavoriteIds();

  for (const entry of data.favorites) {
    if (mode === 'merge' && existingIds.has(entry.channelId)) {
      skipped++;
      continue;
    }

    try {
      const database = await initDB();
      await new Promise<void>((resolve, reject) => {
        const tx = database.transaction(FAVORITES_STORE, 'readwrite');
        const store = tx.objectStore(FAVORITES_STORE);
        const request = store.put(entry);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
      added++;
    } catch {
      // Fallback
      const favorites = getLocalStorageFavorites();
      if (!favorites.some(f => f.channelId === entry.channelId)) {
        favorites.push(entry);
        added++;
      } else {
        skipped++;
      }
      saveLocalStorageFavorites(favorites);
    }
  }

  await syncToLocalStorage();
  return { added, skipped };
}

/**
 * Import from file input
 */
export async function importFavoritesFromFile(
  file: File,
  mode: 'merge' | 'replace' = 'merge'
): Promise<{ added: number; skipped: number }> {
  const text = await file.text();
  const data = JSON.parse(text) as FavoritesExport;
  return importFavorites(data, mode);
}

/**
 * Get favorites count
 */
export async function getFavoritesCount(): Promise<number> {
  const favorites = await getFavorites();
  return favorites.length;
}

/**
 * Hook for React components to use favorites
 * Returns synchronous check using cached data
 */
let cachedFavoriteIds: Set<string> = new Set();
let cacheInitialized = false;

export async function initFavoritesCache(): Promise<void> {
  cachedFavoriteIds = await getFavoriteIds();
  cacheInitialized = true;
}

export function isFavoriteCached(channelId: string): boolean {
  return cachedFavoriteIds.has(channelId);
}

export function updateFavoritesCache(channelId: string, isFav: boolean): void {
  if (isFav) {
    cachedFavoriteIds.add(channelId);
  } else {
    cachedFavoriteIds.delete(channelId);
  }
}

export function isCacheInitialized(): boolean {
  return cacheInitialized;
}

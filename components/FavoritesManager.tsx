'use client';

import { useState, useRef } from 'react';

interface FavoritesManagerProps {
  favoritesCount: number;
  onExport: () => Promise<void>;
  onImport: (file: File, mode: 'merge' | 'replace') => Promise<{ added: number; skipped: number }>;
  onClear: () => Promise<void>;
  onClose: () => void;
}

export function FavoritesManager({
  favoritesCount,
  onExport,
  onImport,
  onClear,
  onClose,
}: FavoritesManagerProps) {
  const [importing, setImporting] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [importMode, setImportMode] = useState<'merge' | 'replace'>('merge');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = async () => {
    setExporting(true);
    setMessage(null);
    try {
      await onExport();
      setMessage({ type: 'success', text: 'Favorites exported successfully!' });
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to export favorites' });
    } finally {
      setExporting(false);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImporting(true);
    setMessage(null);

    try {
      const result = await onImport(file, importMode);
      setMessage({
        type: 'success',
        text: `Imported ${result.added} favorites${result.skipped > 0 ? ` (${result.skipped} skipped)` : ''}`,
      });
    } catch (error) {
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Failed to import favorites',
      });
    } finally {
      setImporting(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleClear = async () => {
    if (!confirm(`Are you sure you want to clear all ${favoritesCount} favorites? This cannot be undone.`)) {
      return;
    }

    try {
      await onClear();
      setMessage({ type: 'success', text: 'All favorites cleared' });
    } catch {
      setMessage({ type: 'error', text: 'Failed to clear favorites' });
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-zinc-900 rounded-xl max-w-md w-full p-6 border border-zinc-700">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-white">Manage Favorites</h2>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-white transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-4">
          {/* Stats */}
          <div className="bg-zinc-800 rounded-lg p-4">
            <div className="text-sm text-zinc-400">Total Favorites</div>
            <div className="text-2xl font-bold text-white">{favoritesCount}</div>
          </div>

          {/* Export */}
          <div className="bg-zinc-800 rounded-lg p-4">
            <h3 className="font-medium text-white mb-2">Export Favorites</h3>
            <p className="text-sm text-zinc-400 mb-3">
              Download your favorites as a JSON file for backup or transfer.
            </p>
            <button
              onClick={handleExport}
              disabled={exporting || favoritesCount === 0}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-zinc-700 disabled:text-zinc-500 text-white py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              {exporting ? (
                <>
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Exporting...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Export to File
                </>
              )}
            </button>
          </div>

          {/* Import */}
          <div className="bg-zinc-800 rounded-lg p-4">
            <h3 className="font-medium text-white mb-2">Import Favorites</h3>
            <p className="text-sm text-zinc-400 mb-3">
              Import favorites from a previously exported JSON file.
            </p>

            <div className="flex gap-2 mb-3">
              <button
                onClick={() => setImportMode('merge')}
                className={`flex-1 py-1.5 px-3 rounded text-sm transition-colors ${
                  importMode === 'merge'
                    ? 'bg-blue-600 text-white'
                    : 'bg-zinc-700 text-zinc-300 hover:bg-zinc-600'
                }`}
              >
                Merge
              </button>
              <button
                onClick={() => setImportMode('replace')}
                className={`flex-1 py-1.5 px-3 rounded text-sm transition-colors ${
                  importMode === 'replace'
                    ? 'bg-red-600 text-white'
                    : 'bg-zinc-700 text-zinc-300 hover:bg-zinc-600'
                }`}
              >
                Replace All
              </button>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleFileSelect}
              className="hidden"
              id="favorites-import"
            />
            <label
              htmlFor="favorites-import"
              className={`w-full bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2 cursor-pointer ${
                importing ? 'opacity-50 pointer-events-none' : ''
              }`}
            >
              {importing ? (
                <>
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Importing...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                  </svg>
                  Choose File to Import
                </>
              )}
            </label>
          </div>

          {/* Clear */}
          {favoritesCount > 0 && (
            <button
              onClick={handleClear}
              className="w-full bg-red-600/20 hover:bg-red-600/30 text-red-400 py-2 px-4 rounded-lg transition-colors border border-red-600/30"
            >
              Clear All Favorites
            </button>
          )}

          {/* Message */}
          {message && (
            <div
              className={`p-3 rounded-lg text-sm ${
                message.type === 'success'
                  ? 'bg-green-600/20 text-green-400 border border-green-600/30'
                  : 'bg-red-600/20 text-red-400 border border-red-600/30'
              }`}
            >
              {message.text}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

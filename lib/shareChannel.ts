/**
 * Channel Sharing Utilities
 * Share channels via links, native share API, or QR codes
 */

import { Channel } from './channels';

export interface ShareData {
  title: string;
  text: string;
  url: string;
}

/**
 * Generate a shareable URL for a channel
 */
export function generateChannelUrl(channel: Channel): string {
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
  const params = new URLSearchParams({
    channel: channel.id,
  });
  return `${baseUrl}?${params.toString()}`;
}

/**
 * Generate share data for a channel
 */
export function generateShareData(channel: Channel, currentProgram?: string): ShareData {
  const url = generateChannelUrl(channel);
  const programInfo = currentProgram ? ` - Now playing: ${currentProgram}` : '';

  return {
    title: `Watch ${channel.name} on StreamVault`,
    text: `Check out ${channel.name} (CH ${channel.number})${programInfo}`,
    url,
  };
}

/**
 * Check if native sharing is supported
 */
export function isNativeShareSupported(): boolean {
  return typeof navigator !== 'undefined' && !!navigator.share;
}

/**
 * Share using native share API (mobile)
 */
export async function shareNative(shareData: ShareData): Promise<boolean> {
  if (!isNativeShareSupported()) {
    return false;
  }

  try {
    await navigator.share(shareData);
    return true;
  } catch (error) {
    // User cancelled or error
    if ((error as Error).name !== 'AbortError') {
      console.error('Share failed:', error);
    }
    return false;
  }
}

/**
 * Copy text to clipboard
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }

    // Fallback for older browsers
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.left = '-9999px';
    document.body.appendChild(textarea);
    textarea.select();
    const success = document.execCommand('copy');
    document.body.removeChild(textarea);
    return success;
  } catch {
    return false;
  }
}

/**
 * Share a channel (auto-selects best method)
 */
export async function shareChannel(
  channel: Channel,
  currentProgram?: string
): Promise<{ method: 'native' | 'clipboard'; success: boolean }> {
  const shareData = generateShareData(channel, currentProgram);

  // Try native share first (mobile)
  if (isNativeShareSupported()) {
    const success = await shareNative(shareData);
    return { method: 'native', success };
  }

  // Fallback to clipboard
  const success = await copyToClipboard(shareData.url);
  return { method: 'clipboard', success };
}

/**
 * Generate a simple QR code SVG (no external dependencies)
 */
export function generateQRCodeSVG(url: string, size: number = 200): string {
  // This is a simplified QR code placeholder
  // For a real implementation, you'd use a QR library
  // For now, return a placeholder that indicates QR functionality
  return `
    <svg width="${size}" height="${size}" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
      <rect width="200" height="200" fill="white"/>
      <text x="100" y="100" text-anchor="middle" font-size="12" fill="#666">
        QR Code
      </text>
      <text x="100" y="120" text-anchor="middle" font-size="10" fill="#999">
        (Scan to open)
      </text>
    </svg>
  `;
}

/**
 * Parse channel from URL query params
 */
export function parseChannelFromUrl(): string | null {
  if (typeof window === 'undefined') return null;

  const params = new URLSearchParams(window.location.search);
  return params.get('channel');
}

/**
 * Clear channel from URL (after handling)
 */
export function clearChannelFromUrl(): void {
  if (typeof window === 'undefined') return;

  const url = new URL(window.location.href);
  url.searchParams.delete('channel');

  // Update URL without reload
  window.history.replaceState({}, '', url.pathname);
}

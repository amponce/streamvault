/**
 * Cast Service for Chromecast and AirPlay
 * Provides casting functionality to external devices
 */

import { Channel } from './channels';

// Cast state
export interface CastState {
  isAvailable: boolean;
  isConnected: boolean;
  deviceName: string | null;
  castType: 'chromecast' | 'airplay' | null;
}

// Chromecast namespace
declare global {
  interface Window {
    __onGCastApiAvailable?: (isAvailable: boolean) => void;
    cast?: {
      framework: {
        CastContext: {
          getInstance(): CastContext;
        };
        CastContextEventType: {
          CAST_STATE_CHANGED: string;
          SESSION_STATE_CHANGED: string;
        };
        CastState: {
          NO_DEVICES_AVAILABLE: string;
          NOT_CONNECTED: string;
          CONNECTING: string;
          CONNECTED: string;
        };
        SessionState: {
          SESSION_STARTED: string;
          SESSION_RESUMED: string;
          SESSION_ENDING: string;
          SESSION_ENDED: string;
        };
      };
    };
    chrome?: {
      cast: {
        AutoJoinPolicy: {
          ORIGIN_SCOPED: string;
        };
        media: {
          MediaInfo: new (contentId: string, contentType: string) => MediaInfo;
          LoadRequest: new (mediaInfo: MediaInfo) => LoadRequest;
          StreamType: {
            LIVE: string;
            BUFFERED: string;
          };
        };
      };
    };
  }

  interface CastContext {
    setOptions(options: CastOptions): void;
    getCastState(): string;
    getCurrentSession(): CastSession | null;
    requestSession(): Promise<void>;
    addEventListener(type: string, handler: (event: CastStateEvent) => void): void;
    removeEventListener(type: string, handler: (event: CastStateEvent) => void): void;
  }

  interface CastSession {
    getSessionId(): string;
    getCastDevice(): CastDevice;
    loadMedia(request: LoadRequest): Promise<void>;
    endSession(stopCasting: boolean): void;
  }

  interface CastDevice {
    friendlyName: string;
  }

  interface CastStateEvent {
    castState: string;
  }

  interface CastOptions {
    receiverApplicationId: string;
    autoJoinPolicy: string;
  }

  interface MediaInfo {
    streamType: string;
    metadata: {
      type: number;
      title: string;
      subtitle: string;
      images: { url: string }[];
    };
  }

  interface LoadRequest {
    autoplay: boolean;
    currentTime: number;
  }
}

// Cast context singleton
let castContext: CastContext | null = null;
let castStateListeners: ((state: CastState) => void)[] = [];
let currentCastState: CastState = {
  isAvailable: false,
  isConnected: false,
  deviceName: null,
  castType: null,
};

/**
 * Initialize Chromecast SDK
 */
export function initializeChromecast(): Promise<boolean> {
  return new Promise((resolve) => {
    // Check if already initialized
    if (castContext) {
      resolve(true);
      return;
    }

    // Check if Cast SDK is available
    if (!window.cast || !window.chrome?.cast) {
      // Load Cast SDK
      const script = document.createElement('script');
      script.src = 'https://www.gstatic.com/cv/js/sender/v1/cast_sender.js?loadCastFramework=1';
      script.async = true;

      window.__onGCastApiAvailable = (isAvailable: boolean) => {
        if (isAvailable && window.cast) {
          setupCastContext();
          resolve(true);
        } else {
          resolve(false);
        }
      };

      document.head.appendChild(script);

      // Timeout after 5 seconds
      setTimeout(() => {
        if (!castContext) {
          resolve(false);
        }
      }, 5000);
    } else {
      setupCastContext();
      resolve(true);
    }
  });
}

/**
 * Setup Cast context
 */
function setupCastContext(): void {
  if (!window.cast || !window.chrome?.cast) return;

  try {
    castContext = window.cast.framework.CastContext.getInstance();

    castContext.setOptions({
      receiverApplicationId: 'CC1AD845', // Default media receiver
      autoJoinPolicy: window.chrome.cast.AutoJoinPolicy.ORIGIN_SCOPED,
    });

    // Listen for cast state changes
    castContext.addEventListener(
      window.cast.framework.CastContextEventType.CAST_STATE_CHANGED,
      handleCastStateChanged
    );

    // Update initial state
    updateCastState();
  } catch (error) {
    console.error('Failed to setup Cast context:', error);
  }
}

/**
 * Handle cast state changes
 */
function handleCastStateChanged(event: CastStateEvent): void {
  updateCastState();
}

/**
 * Update current cast state
 */
function updateCastState(): void {
  if (!castContext || !window.cast) {
    currentCastState = {
      isAvailable: false,
      isConnected: false,
      deviceName: null,
      castType: null,
    };
    notifyListeners();
    return;
  }

  const castState = castContext.getCastState();
  const session = castContext.getCurrentSession();

  currentCastState = {
    isAvailable: castState !== window.cast.framework.CastState.NO_DEVICES_AVAILABLE,
    isConnected: castState === window.cast.framework.CastState.CONNECTED,
    deviceName: session?.getCastDevice()?.friendlyName || null,
    castType: 'chromecast',
  };

  notifyListeners();
}

/**
 * Notify all listeners of state change
 */
function notifyListeners(): void {
  castStateListeners.forEach(listener => listener(currentCastState));
}

/**
 * Subscribe to cast state changes
 */
export function subscribeToCastState(listener: (state: CastState) => void): () => void {
  castStateListeners.push(listener);
  // Immediately call with current state
  listener(currentCastState);

  // Return unsubscribe function
  return () => {
    castStateListeners = castStateListeners.filter(l => l !== listener);
  };
}

/**
 * Get current cast state
 */
export function getCastState(): CastState {
  return currentCastState;
}

/**
 * Request a cast session (show device picker)
 */
export async function requestCastSession(): Promise<boolean> {
  if (!castContext) {
    await initializeChromecast();
  }

  if (!castContext) {
    return false;
  }

  try {
    await castContext.requestSession();
    return true;
  } catch (error) {
    console.error('Failed to start cast session:', error);
    return false;
  }
}

/**
 * Cast a channel to the connected device
 */
export async function castChannel(channel: Channel): Promise<boolean> {
  if (!castContext || !window.chrome?.cast) {
    return false;
  }

  const session = castContext.getCurrentSession();
  if (!session) {
    return false;
  }

  try {
    const mediaInfo = new window.chrome.cast.media.MediaInfo(
      channel.url,
      'application/x-mpegURL'
    );

    mediaInfo.streamType = window.chrome.cast.media.StreamType.LIVE;
    mediaInfo.metadata = {
      type: 0, // Generic media
      title: channel.name,
      subtitle: `Channel ${channel.number} • ${channel.category}`,
      images: [], // Add channel logo here if available
    };

    const request = new window.chrome.cast.media.LoadRequest(mediaInfo);
    request.autoplay = true;
    request.currentTime = 0;

    await session.loadMedia(request);
    return true;
  } catch (error) {
    console.error('Failed to cast media:', error);
    return false;
  }
}

/**
 * Stop casting
 */
export function stopCasting(): void {
  if (!castContext) return;

  const session = castContext.getCurrentSession();
  if (session) {
    session.endSession(true);
  }
}

/**
 * Check if AirPlay is available (Safari only)
 */
export function isAirPlayAvailable(): boolean {
  if (typeof window === 'undefined') return false;

  // Check for Safari's AirPlay support
  const video = document.createElement('video');
  return !!(video as HTMLVideoElement & { webkitShowPlaybackTargetPicker?: () => void }).webkitShowPlaybackTargetPicker;
}

/**
 * Show AirPlay picker (Safari)
 */
export function showAirPlayPicker(videoElement: HTMLVideoElement): void {
  const video = videoElement as HTMLVideoElement & { webkitShowPlaybackTargetPicker?: () => void };
  if (video.webkitShowPlaybackTargetPicker) {
    video.webkitShowPlaybackTargetPicker();
  }
}

/**
 * Check if any casting method is available
 */
export function isCastingAvailable(): boolean {
  return currentCastState.isAvailable || isAirPlayAvailable();
}

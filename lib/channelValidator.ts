import { Channel } from './channels';

export interface ChannelStatus {
  channelId: string;
  isActive: boolean;
  lastChecked: Date;
  error?: string;
}

class ChannelValidator {
  private statusCache: Map<string, ChannelStatus> = new Map();
  private checkInProgress: Set<string> = new Set();

  async validateChannel(channel: Channel): Promise<ChannelStatus> {
    // Check cache first
    const cached = this.statusCache.get(channel.id);
    if (cached && Date.now() - cached.lastChecked.getTime() < 5 * 60 * 1000) { // 5 min cache
      return cached;
    }

    // Prevent duplicate checks
    if (this.checkInProgress.has(channel.id)) {
      return cached || { channelId: channel.id, isActive: false, lastChecked: new Date() };
    }

    this.checkInProgress.add(channel.id);

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000); // 5 second timeout

      const response = await fetch(channel.url, {
        method: 'HEAD',
        signal: controller.signal,
        mode: 'no-cors' // This won't give us status but at least checks if reachable
      });

      clearTimeout(timeout);

      // For no-cors, we can't read the response status, but if we get here without error, assume it's working
      const status: ChannelStatus = {
        channelId: channel.id,
        isActive: true,
        lastChecked: new Date()
      };

      this.statusCache.set(channel.id, status);
      return status;

    } catch (error) {
      const status: ChannelStatus = {
        channelId: channel.id,
        isActive: false,
        lastChecked: new Date(),
        error: error instanceof Error ? error.message : 'Unknown error'
      };

      this.statusCache.set(channel.id, status);
      return status;

    } finally {
      this.checkInProgress.delete(channel.id);
    }
  }

  async validateChannels(channels: Channel[]): Promise<Map<string, ChannelStatus>> {
    const results = new Map<string, ChannelStatus>();
    
    // Validate in batches to avoid overwhelming the network
    const batchSize = 10;
    for (let i = 0; i < channels.length; i += batchSize) {
      const batch = channels.slice(i, i + batchSize);
      const batchResults = await Promise.allSettled(
        batch.map(channel => this.validateChannel(channel))
      );

      batchResults.forEach((result, index) => {
        const channel = batch[index];
        if (result.status === 'fulfilled') {
          results.set(channel.id, result.value);
        } else {
          results.set(channel.id, {
            channelId: channel.id,
            isActive: false,
            lastChecked: new Date(),
            error: 'Validation failed'
          });
        }
      });
    }

    return results;
  }

  clearCache() {
    this.statusCache.clear();
  }

  getCachedStatus(channelId: string): ChannelStatus | undefined {
    return this.statusCache.get(channelId);
  }
}

export const channelValidator = new ChannelValidator();
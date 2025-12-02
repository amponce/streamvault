import { NextResponse } from 'next/server';
import { v1 as uuidv1, v4 as uuidv4 } from 'uuid';

/**
 * Pluto TV API Proxy
 * Based on maddox/pluto-for-channels approach
 * Uses api.pluto.tv/v2/channels with proper UUID generation
 */

// Enable edge caching - revalidate every 30 minutes
export const revalidate = 1800;

interface PlutoChannel {
  _id: string;
  slug: string;
  name: string;
  number: number;
  category: string;
  stitched?: {
    urls?: Array<{
      type: string;
      url: string;
    }>;
  };
  colorLogoPNG?: { path: string };
  thumbnail?: { path: string };
  logo?: { path: string };
  timelines?: Array<{
    start: string;
    stop: string;
    episode?: {
      name: string;
      description?: string;
      genre?: string;
      series?: { name: string };
    };
  }>;
}

interface PlutoResponse {
  channels?: PlutoChannel[];
  [key: string]: unknown;
}

/**
 * Build a fresh stream URL from the stitched base URL
 * This is the key insight from maddox/pluto-for-channels
 */
function buildFreshStreamUrl(stitchedUrl: string, deviceId: string, sid: string): string {
  try {
    const url = new URL(stitchedUrl);
    const params = url.searchParams;

    // Set all the required parameters like the working implementation
    params.set('advertisingId', '');
    params.set('appName', 'web');
    params.set('appVersion', 'unknown');
    params.set('appStoreUrl', '');
    params.set('architecture', '');
    params.set('buildVersion', '');
    params.set('clientTime', '0');
    params.set('deviceDNT', '0');
    params.set('deviceId', deviceId);
    params.set('deviceMake', 'Chrome');
    params.set('deviceModel', 'web');
    params.set('deviceType', 'web');
    params.set('deviceVersion', 'unknown');
    params.set('includeExtendedEvents', 'false');
    params.set('sid', sid);
    params.set('userId', '');
    params.set('serverSideAds', 'true');  // Key: must be true

    url.search = params.toString();
    return url.toString();
  } catch (e) {
    console.error('Failed to build fresh URL:', e);
    return stitchedUrl;
  }
}

/**
 * Get time range for API request (6 hour window)
 */
function getTimeRange(): { start: string; stop: string } {
  const now = new Date();
  // Round to current hour
  now.setMinutes(0, 0, 0);

  const stop = new Date(now.getTime() + 6 * 60 * 60 * 1000); // +6 hours

  // Format as ISO string (Pluto API accepts this format)
  return {
    start: now.toISOString(),
    stop: stop.toISOString()
  };
}

export async function GET() {
  // Generate proper UUIDs like the working implementation
  const deviceId = uuidv1();  // Time-based UUID v1
  const sid = uuidv4();       // Random UUID v4

  const { start, stop } = getTimeRange();

  console.log('Fetching Pluto channels from api.pluto.tv/v2/channels...');
  console.log(`Time range: ${start} to ${stop}`);

  try {
    // Use the v2/channels endpoint like maddox/pluto-for-channels
    const apiUrl = `https://api.pluto.tv/v2/channels?start=${encodeURIComponent(start)}&stop=${encodeURIComponent(stop)}`;

    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
    });

    if (!response.ok) {
      console.error('Pluto API error:', response.status);
      throw new Error(`API returned ${response.status}`);
    }

    const data = await response.json();
    // API may return array directly or object with channels property
    const channels: PlutoChannel[] = Array.isArray(data) ? data : (data.channels || []);
    console.log(`Pluto API returned ${channels.length} channels`);

    // Process channels: rebuild URLs with fresh session params
    const processedChannels = channels
      .filter(ch => ch.stitched?.urls && ch.stitched.urls.length > 0)
      .map(ch => {
        const hlsUrl = ch.stitched!.urls!.find(u => u.type === 'hls')?.url;
        if (!hlsUrl) return null;

        // Build fresh URL with our session params
        const freshUrl = buildFreshStreamUrl(hlsUrl, deviceId, sid);

        // Get current program from timelines
        const now = new Date();
        const currentProgram = ch.timelines?.find(t => {
          const start = new Date(t.start);
          const stop = new Date(t.stop);
          return now >= start && now < stop;
        });

        return {
          ...ch,
          streamUrl: freshUrl,
          currentProgram: currentProgram?.episode ? {
            title: currentProgram.episode.name,
            description: currentProgram.episode.description,
            series: currentProgram.episode.series?.name,
            genre: currentProgram.episode.genre,
            startTime: currentProgram.start,
            endTime: currentProgram.stop,
          } : null,
        };
      })
      .filter(Boolean);

    console.log(`Processed ${processedChannels.length} channels with fresh URLs`);

    return NextResponse.json({
      channels: processedChannels,
      sessionInfo: {
        deviceId,
        sid,
        generatedAt: new Date().toISOString(),
      }
    }, {
      headers: {
        // Cache at edge for 30 min, allow stale for 1 hour while revalidating
        'Cache-Control': 'public, s-maxage=1800, stale-while-revalidate=3600',
      }
    });

  } catch (error) {
    console.error('Pluto API error:', error);

    // Fallback to boot.pluto.tv
    try {
      console.log('Trying boot.pluto.tv fallback...');

      const params = new URLSearchParams({
        appName: 'web',
        appVersion: '7.0.0',
        deviceVersion: '120.0.0',
        deviceId: deviceId,
        deviceType: 'web',
        deviceMake: 'Chrome',
        deviceModel: 'Chrome',
        deviceDNT: '0',
        sid: sid,
        userId: '',
        advertisingId: '',
        serverSideAds: 'true',  // Changed to true
        clientID: deviceId,
        clientModelNumber: '1.0.0',
      });

      const fallbackResponse = await fetch(`https://boot.pluto.tv/v4/start?${params.toString()}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Origin': 'https://pluto.tv',
          'Referer': 'https://pluto.tv/',
        },
      });

      if (fallbackResponse.ok) {
        const data: PlutoResponse = await fallbackResponse.json();
        console.log(`boot.pluto.tv returned ${data.channels?.length || 0} channels`);

        // Process channels with fresh URLs
        const processedChannels = (data.channels || [])
          .filter(ch => ch.stitched?.urls && ch.stitched.urls.length > 0)
          .map(ch => {
            const hlsUrl = ch.stitched!.urls!.find(u => u.type === 'hls')?.url;
            if (!hlsUrl) return null;

            return {
              ...ch,
              streamUrl: buildFreshStreamUrl(hlsUrl, deviceId, sid),
            };
          })
          .filter(Boolean);

        return NextResponse.json({
          channels: processedChannels,
          sessionInfo: { deviceId, sid, generatedAt: new Date().toISOString() },
          source: 'boot.pluto.tv'
        });
      }
    } catch (fallbackError) {
      console.error('Fallback also failed:', fallbackError);
    }

    return NextResponse.json({
      error: 'All Pluto TV APIs failed',
      message: 'Pluto may be geo-blocked or temporarily unavailable',
      channels: []
    }, { status: 503 });
  }
}

import { NextResponse } from 'next/server';

function generateDeviceId(): string {
  const chars = 'abcdef0123456789';
  let result = '';
  for (let i = 0; i < 32; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export async function GET() {
  const deviceId = generateDeviceId();
  const sid = `${Date.now()}-${Math.random().toString(36).substring(2, 10)}`;

  // Use boot.pluto.tv - this is the endpoint that returns actual playable stream URLs
  try {
    console.log('Fetching Pluto channels from boot.pluto.tv...');

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
      serverSideAds: 'false',
      clientID: deviceId,
      clientModelNumber: '1.0.0',
    });

    const response = await fetch(`https://boot.pluto.tv/v4/start?${params.toString()}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Origin': 'https://pluto.tv',
        'Referer': 'https://pluto.tv/',
      },
    });

    if (response.ok) {
      const data = await response.json();

      // Log what we got
      const channelCount = data.channels?.length || 0;
      console.log(`Pluto API returned ${channelCount} channels`);

      // Check if channels have stitched URLs
      if (data.channels && data.channels.length > 0) {
        const withUrls = data.channels.filter((ch: { stitched?: { urls?: unknown[] } }) =>
          ch.stitched?.urls && ch.stitched.urls.length > 0
        ).length;
        console.log(`${withUrls} channels have stitched URLs`);
      }

      return NextResponse.json(data);
    }

    console.log('boot.pluto.tv failed:', response.status, await response.text());
  } catch (e) {
    console.error('boot.pluto.tv error:', e);
  }

  // Fallback: Try service-stitcher directly to get channel list
  try {
    console.log('Trying service-channels fallback...');
    const response = await fetch('https://service-channels.clusters.pluto.tv/v2/guide/channels', {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });

    if (response.ok) {
      const data = await response.json();
      console.log('service-channels fallback succeeded');
      return NextResponse.json(data);
    }
  } catch (e) {
    console.error('service-channels fallback error:', e);
  }

  return NextResponse.json({
    error: 'All Pluto TV APIs failed',
    message: 'Pluto may be geo-blocked or blocking this server',
    channels: []
  }, { status: 503 });
}

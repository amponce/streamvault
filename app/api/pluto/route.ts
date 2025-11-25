import { NextResponse } from 'next/server';

// Multiple Pluto TV API endpoints to try
const PLUTO_APIS = [
  'https://service-channels.clusters.pluto.tv/v2/guide/channels',
  'https://api.pluto.tv/v2/channels',
  'https://boot.pluto.tv/v4/start',
];

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

  // Try service-channels endpoint first (most reliable)
  try {
    console.log('Trying service-channels API...');
    const response = await fetch(PLUTO_APIS[0], {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
    });

    if (response.ok) {
      const data = await response.json();
      console.log('service-channels API succeeded');
      return NextResponse.json(data);
    }
    console.log('service-channels failed:', response.status);
  } catch (e) {
    console.error('service-channels error:', e);
  }

  // Try v2/channels endpoint
  try {
    console.log('Trying v2/channels API...');
    const response = await fetch(PLUTO_APIS[1], {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
    });

    if (response.ok) {
      const data = await response.json();
      console.log('v2/channels API succeeded');
      return NextResponse.json(data);
    }
    console.log('v2/channels failed:', response.status);
  } catch (e) {
    console.error('v2/channels error:', e);
  }

  // Try boot.pluto.tv v4/start as last resort
  try {
    console.log('Trying boot.pluto.tv v4/start API...');
    const params = new URLSearchParams({
      appName: 'web',
      appVersion: '5.127.0',
      deviceVersion: '120.0.0',
      deviceId: deviceId,
      deviceType: 'web',
      deviceMake: 'Chrome',
      deviceModel: 'Chrome',
      deviceDNT: '0',
      userId: '',
      advertisingId: '',
      serverSideAds: 'false',
      clientID: deviceId,
      clientModelNumber: '1.0.0',
    });

    const response = await fetch(`${PLUTO_APIS[2]}?${params.toString()}`, {
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
      console.log('boot.pluto.tv API succeeded');
      return NextResponse.json(data);
    }
    console.log('boot.pluto.tv failed:', response.status);
  } catch (e) {
    console.error('boot.pluto.tv error:', e);
  }

  // All APIs failed
  return NextResponse.json({
    error: 'All Pluto TV APIs failed',
    message: 'Pluto may be blocking requests from this server',
    channels: []
  }, { status: 503 });
}

import { NextResponse } from 'next/server';

const PLUTO_API_BASE = 'https://boot.pluto.tv/v4/start';

function generateDeviceId(): string {
  const chars = 'abcdef0123456789';
  let result = '';
  for (let i = 0; i < 32; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

function generateSessionId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
}

export async function GET() {
  const deviceId = generateDeviceId();
  const sessionId = generateSessionId();

  const params = new URLSearchParams({
    appName: 'web',
    appVersion: '8.0.0',
    deviceVersion: 'Chrome',
    deviceId: deviceId,
    deviceType: 'web',
    deviceMake: 'Chrome',
    deviceModel: 'Chrome',
    deviceDNT: '0',
    userId: '',
    advertisingId: '',
    sid: sessionId,
    serverSideAds: 'false',
    clientID: deviceId,
    clientModelNumber: 'na',
    channelSlug: '',
  });

  try {
    const response = await fetch(`${PLUTO_API_BASE}?${params.toString()}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
      next: { revalidate: 1800 }, // Cache for 30 minutes
    });

    if (!response.ok) {
      console.error('Pluto API error:', response.status);
      return NextResponse.json({ error: 'Pluto API error', status: response.status }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Failed to fetch Pluto channels:', error);
    return NextResponse.json({ error: 'Failed to fetch Pluto channels' }, { status: 500 });
  }
}

# StreamVault

> AI-Powered Live TV Streaming with a Stunning Glass UI

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/YOUR_USERNAME/streamvault)
[![License: MIT](https://img.shields.io/badge/License-MIT-violet.svg)](https://opensource.org/licenses/MIT)

StreamVault is a modern IPTV streaming application built with Next.js 16, featuring AI-powered recommendations, a beautiful glassmorphism UI, and smart channel management.

## Features

### Glass UI Design
- Stunning glassmorphism effects with backdrop blur
- Animated gradients and smooth transitions
- Dark theme optimized for viewing
- Responsive design for all screen sizes

### AI-Powered Discovery
- **"Surprise Me"** - AI picks channels based on your watch history
- **Mood-based selection** - Choose how you're feeling and get matching content
- **Time-of-day suggestions** - Morning news, evening entertainment, late-night movies
- **Quick Picks** - Your most-watched channels at a glance
- **Continue Watching** - Jump back to your last channel

### Smart Channel Management
- **Auto-filters dead channels** - Broken streams are automatically hidden
- **Persistent preferences** - Your settings survive browser refresh
- **Category filtering** - Browse by News, Sports, Movies, Horror, and more
- **Real-time search** - Find channels instantly

### Three View Modes
1. **Browse** - Classic channel list with category pills
2. **Schedule** - TV guide showing what's on with progress bars
3. **Discover** - AI recommendations and mood-based discovery

### Enhanced Video Player
- Custom glass controls (play/pause, volume, fullscreen)
- Auto-hiding UI during playback
- Stream error recovery with retry option
- Now playing overlay with channel info

## Quick Start

### Prerequisites
- Node.js 18+
- npm, yarn, or pnpm

### Installation

```bash
# Clone the repository
git clone https://github.com/YOUR_USERNAME/streamvault.git
cd streamvault

# Install dependencies
npm install

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Production Build

```bash
# Create production build
npm run build

# Start production server
npm start
```

## Deploy to Vercel

The easiest way to deploy StreamVault is with [Vercel](https://vercel.com):

1. Click the "Deploy with Vercel" button above
2. Connect your GitHub account
3. Import the repository
4. Deploy!

No environment variables required - it works out of the box.

### Manual Vercel Deployment

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

## Project Structure

```
streamvault/
├── app/
│   ├── layout.tsx      # Root layout with metadata
│   ├── page.tsx        # Home page
│   └── globals.css     # Glass UI design system
├── components/
│   ├── IPTVPlayer.tsx  # Main app component
│   └── VideoPlayer.tsx # HLS video player
├── lib/
│   ├── channels.ts     # Channel database (170+ channels)
│   ├── aiFeatures.ts   # AI recommendation engine
│   ├── schedule.ts     # TV schedule/EPG system
│   └── channelHealth.ts # Dead channel detection
└── public/             # Static assets
```

## Channel Sources

StreamVault uses publicly available free streaming sources:

- **[iptv-org](https://github.com/iptv-org/iptv)** - Community-maintained IPTV playlist
- **Tubi TV** - Free ad-supported streaming
- **Pluto TV** - Free live TV channels
- **Various FAST channels** - Free ad-supported television

All channels are from legitimate free-to-air or ad-supported sources.

### Adding Custom Channels

Edit `lib/channels.ts` to add your own channels:

```typescript
{
  id: "my-channel",
  number: 300,
  name: "My Channel",
  url: "https://example.com/stream.m3u8",
  category: "Entertainment"
}
```

### Available Categories
- All, Local, News, Sports, Entertainment
- Movies, Music, Kids, Documentary
- Horror, Comedy

## Tech Stack

- **Framework**: [Next.js 16](https://nextjs.org/) with App Router
- **Language**: TypeScript 5
- **Styling**: [Tailwind CSS 4](https://tailwindcss.com/)
- **Video**: [HLS.js](https://github.com/video-dev/hls.js/) for adaptive streaming
- **State**: React hooks (no external state management)

## Configuration

### Customizing the UI

The glass UI system is defined in `app/globals.css`. Key CSS variables:

```css
:root {
  --accent-primary: #8b5cf6;    /* Purple accent */
  --accent-secondary: #06b6d4;  /* Cyan accent */
  --glass-bg: rgba(255, 255, 255, 0.03);
  --glass-border: rgba(255, 255, 255, 0.08);
}
```

### AI Features Configuration

AI preferences are stored in localStorage under `streamvault_user_prefs`. The system learns from:
- Watch duration (longer = higher preference)
- Time of day viewing patterns
- Category preferences

## Browser Support

- Chrome/Edge 80+
- Firefox 75+
- Safari 13+ (native HLS)
- Opera 67+

## Known Limitations

1. **EPG Data**: Schedule information is generated/mock data, not from real TV guides
2. **Channel Availability**: Some streams may go offline without notice
3. **Geo-restrictions**: Some channels may be region-locked
4. **No DVR**: Live streams only, no recording capability

## Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing`)
5. Open a Pull Request

### Adding New Channels

When adding channels via PR:
- Verify the stream works
- Ensure it's from a legitimate free source
- Follow the existing format in `channels.ts`
- Test in multiple browsers

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Disclaimer

StreamVault is a player/interface only. It does not host any streams. All streams are sourced from publicly available, free-to-air, or ad-supported services. Users are responsible for ensuring they have the right to access any content they stream.

## Acknowledgments

- [iptv-org](https://github.com/iptv-org/iptv) for the channel database inspiration
- [HLS.js](https://github.com/video-dev/hls.js/) for excellent streaming support
- The Next.js and Tailwind CSS teams for amazing tools

---

**Made with love for cord-cutters everywhere**

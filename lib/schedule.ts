/**
 * TV Schedule / EPG (Electronic Program Guide) System
 * Generates realistic mock schedule data for channels
 */

import { Channel, allChannels } from './channels';

export interface ProgramSlot {
  id: string;
  title: string;
  description: string;
  startTime: Date;
  endTime: Date;
  duration: number; // minutes
  isLive: boolean;
  rating?: string;
  genre?: string;
}

export interface ChannelSchedule {
  channelId: string;
  channel: Channel;
  programs: ProgramSlot[];
}

// Mock program templates by category
const programTemplates: Record<string, { titles: string[]; descriptions: string[] }> = {
  News: {
    titles: [
      'Morning Headlines', 'Breaking News Update', 'World Report', 'Evening Edition',
      'Political Roundtable', 'Business Today', 'Weather Watch', 'Sports Desk',
      'Tech Talk', 'Health Matters', 'Global Focus', 'Local Spotlight',
    ],
    descriptions: [
      'Top stories from around the world',
      'In-depth analysis of current events',
      'Live coverage and expert commentary',
      'Breaking developments as they happen',
    ],
  },
  Sports: {
    titles: [
      'Game Day Live', 'Sports Center', 'Championship Highlights', 'Pregame Show',
      'Post-Game Analysis', 'Fantasy Football Hour', 'Baseball Tonight', 'Soccer Saturday',
      'Basketball Breakdown', 'Hockey Night', 'Golf Classic', 'Tennis Masters',
    ],
    descriptions: [
      'Live sports action and analysis',
      'Expert commentary and highlights',
      'Exclusive interviews with athletes',
      'Comprehensive game coverage',
    ],
  },
  Entertainment: {
    titles: [
      'Celebrity Spotlight', 'Talk Show Live', 'Reality Hour', 'Comedy Night',
      'Drama Series', 'Sitcom Marathon', 'Award Show Special', 'Behind the Scenes',
      'Entertainment Tonight', 'Pop Culture Weekly', 'Red Carpet Live', 'Star Interview',
    ],
    descriptions: [
      'Entertainment news and celebrity interviews',
      'The latest in pop culture',
      'Your favorite shows and stars',
      'Exclusive entertainment coverage',
    ],
  },
  Movies: {
    titles: [
      'Action Blockbuster', 'Romantic Comedy', 'Sci-Fi Classic', 'Thriller Night',
      'Oscar Winner', 'Cult Classic', 'Director\'s Cut', 'Family Movie',
      'Crime Drama', 'Adventure Epic', 'Indie Gem', 'Documentary Feature',
    ],
    descriptions: [
      'Award-winning cinema',
      'Classic film presentation',
      'Uncut and commercial-free',
      'Premium movie experience',
    ],
  },
  Music: {
    titles: [
      'Top 40 Countdown', 'Classic Rock Hour', 'Hip-Hop Hits', 'Country Roads',
      'Jazz Session', 'Electronic Beats', 'Acoustic Lounge', 'World Music',
      'Music Video Marathon', 'Artist Spotlight', 'Live Concert', 'Behind the Music',
    ],
    descriptions: [
      'Non-stop music and videos',
      'The best hits and new releases',
      'Live performances and exclusives',
      'Music from around the world',
    ],
  },
  Kids: {
    titles: [
      'Cartoon Morning', 'Animation Station', 'Learning Adventures', 'Puppet Show',
      'Superhero Hour', 'Princess Tales', 'Animal Friends', 'Science Fun',
      'Storytime', 'Art Attack', 'Game Show Jr.', 'Music & Dance',
    ],
    descriptions: [
      'Fun and educational content for kids',
      'Age-appropriate entertainment',
      'Learning through play',
      'Family-friendly programming',
    ],
  },
  Documentary: {
    titles: [
      'Nature Wonders', 'History Revealed', 'Science Frontiers', 'True Crime',
      'Wildlife Safari', 'Ancient Mysteries', 'Space Exploration', 'Ocean Deep',
      'Human Story', 'Tech Revolution', 'Planet Earth', 'War Stories',
    ],
    descriptions: [
      'Eye-opening documentary content',
      'Explore the world and beyond',
      'In-depth investigative journalism',
      'Award-winning documentary filmmaking',
    ],
  },
  Horror: {
    titles: [
      'Nightmare Theater', 'Creature Feature', 'Slasher Saturday', 'Supernatural',
      'Ghost Stories', 'Monster Mash', 'Zombie Zone', 'Haunted House',
      'Thriller Cinema', 'Dark Tales', 'Fear Factor', 'Scream Factory',
    ],
    descriptions: [
      'Terrifying entertainment',
      'Classic horror and new frights',
      'Not for the faint of heart',
      'Spine-chilling programming',
    ],
  },
  Comedy: {
    titles: [
      'Stand-Up Showcase', 'Sitcom Central', 'Comedy Classics', 'Improv Night',
      'Sketch Comedy', 'Late Night Laughs', 'Family Comedy', 'Roast Battle',
      'Comedy Film Festival', 'Blooper Reel', 'Prank Wars', 'Funny Business',
    ],
    descriptions: [
      'Non-stop laughs and entertainment',
      'The best in comedy',
      'Guaranteed to make you smile',
      'Comedy for everyone',
    ],
  },
  Local: {
    titles: [
      'Local Morning News', 'Community Report', 'City Council Live', 'Traffic & Weather',
      'High School Sports', 'Local Heroes', 'Town Hall', 'Neighborhood Watch',
      'Local Business Spotlight', 'Community Events', 'School Report', 'Local Matters',
    ],
    descriptions: [
      'News and events from your community',
      'Local coverage you can trust',
      'Your connection to the community',
      'Hyperlocal news and information',
    ],
  },
};

// Program durations (in minutes)
const programDurations = [30, 30, 60, 60, 60, 90, 120, 30, 45, 60];

/**
 * Generate schedule for a single channel
 */
export function generateChannelSchedule(channel: Channel, hoursAhead = 24): ChannelSchedule {
  const programs: ProgramSlot[] = [];
  const templates = programTemplates[channel.category] || programTemplates.Entertainment;

  const now = new Date();
  // Start from the beginning of the current hour
  let currentTime = new Date(now);
  currentTime.setMinutes(0, 0, 0);

  // Go back a few hours for "what was on"
  currentTime.setHours(currentTime.getHours() - 2);

  const endTime = new Date(now);
  endTime.setHours(endTime.getHours() + hoursAhead);

  let programIndex = 0;
  while (currentTime < endTime) {
    const duration = programDurations[programIndex % programDurations.length];
    const titleIndex = programIndex % templates.titles.length;
    const descIndex = programIndex % templates.descriptions.length;

    const programStart = new Date(currentTime);
    const programEnd = new Date(currentTime);
    programEnd.setMinutes(programEnd.getMinutes() + duration);

    // Check if currently live
    const isLive = programStart <= now && programEnd > now;

    programs.push({
      id: `${channel.id}-${programIndex}`,
      title: templates.titles[titleIndex],
      description: templates.descriptions[descIndex],
      startTime: programStart,
      endTime: programEnd,
      duration,
      isLive,
      rating: ['TV-G', 'TV-PG', 'TV-14', 'TV-MA'][Math.floor(Math.random() * 4)],
      genre: channel.category,
    });

    currentTime = programEnd;
    programIndex++;
  }

  return {
    channelId: channel.id,
    channel,
    programs,
  };
}

/**
 * Get current program for a channel
 */
export function getCurrentProgram(channel: Channel): ProgramSlot | null {
  const schedule = generateChannelSchedule(channel, 1);
  return schedule.programs.find(p => p.isLive) || null;
}

/**
 * Get upcoming programs for a channel
 */
export function getUpcomingPrograms(channel: Channel, limit = 5): ProgramSlot[] {
  const schedule = generateChannelSchedule(channel, 12);
  const now = new Date();
  return schedule.programs
    .filter(p => p.startTime > now)
    .slice(0, limit);
}

/**
 * Get schedules for multiple channels
 */
export function getMultiChannelSchedule(
  channels: Channel[],
  hoursAhead = 6
): ChannelSchedule[] {
  return channels.map(ch => generateChannelSchedule(ch, hoursAhead));
}

/**
 * Format time for display
 */
export function formatTime(date: Date): string {
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

/**
 * Format duration for display
 */
export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
}

/**
 * Get progress percentage for current program
 */
export function getProgramProgress(program: ProgramSlot): number {
  const now = new Date();
  const total = program.endTime.getTime() - program.startTime.getTime();
  const elapsed = now.getTime() - program.startTime.getTime();
  return Math.min(100, Math.max(0, (elapsed / total) * 100));
}

/**
 * Get "What's on now" for all channels grouped by category
 */
export function getWhatsOnNow(): Map<string, { channel: Channel; program: ProgramSlot }[]> {
  const result = new Map<string, { channel: Channel; program: ProgramSlot }[]>();

  allChannels.forEach(channel => {
    const program = getCurrentProgram(channel);
    if (program) {
      const existing = result.get(channel.category) || [];
      existing.push({ channel, program });
      result.set(channel.category, existing);
    }
  });

  return result;
}

/**
 * Category Sub-Filters Configuration
 * Defines sub-categories for deeper content filtering
 */

export interface SubFilter {
  id: string;
  label: string;
  icon: string;
  keywords: string[];  // Keywords to match in channel names
}

export interface CategoryFilters {
  category: string;
  subFilters: SubFilter[];
}

// Sub-filter definitions by category
export const CATEGORY_SUB_FILTERS: CategoryFilters[] = [
  {
    category: 'Sports',
    subFilters: [
      { id: 'football', label: 'Football', icon: '', keywords: ['nfl', 'football', 'espn', 'fox sports'] },
      { id: 'basketball', label: 'Basketball', icon: '', keywords: ['nba', 'basketball', 'espn'] },
      { id: 'baseball', label: 'Baseball', icon: '', keywords: ['mlb', 'baseball'] },
      { id: 'soccer', label: 'Soccer', icon: '', keywords: ['soccer', 'futbol', 'mls', 'premier', 'bein'] },
      { id: 'hockey', label: 'Hockey', icon: '', keywords: ['nhl', 'hockey'] },
      { id: 'golf', label: 'Golf', icon: '', keywords: ['golf', 'pga'] },
      { id: 'tennis', label: 'Tennis', icon: '', keywords: ['tennis'] },
      { id: 'racing', label: 'Racing', icon: '', keywords: ['nascar', 'f1', 'racing', 'motor'] },
      { id: 'college', label: 'College', icon: '', keywords: ['college', 'ncaa', 'acc', 'sec', 'big ten', 'pac'] },
      { id: 'fighting', label: 'MMA/Boxing', icon: '', keywords: ['ufc', 'boxing', 'mma', 'fight'] },
    ],
  },
  {
    category: 'News',
    subFilters: [
      { id: 'breaking', label: 'Breaking', icon: '', keywords: ['breaking', 'live', '24/7'] },
      { id: 'world', label: 'World', icon: '', keywords: ['world', 'international', 'global', 'bbc'] },
      { id: 'us', label: 'US News', icon: '', keywords: ['cnn', 'fox news', 'msnbc', 'abc news', 'cbs news', 'nbc news'] },
      { id: 'business', label: 'Business', icon: '', keywords: ['business', 'cnbc', 'bloomberg', 'fox business'] },
      { id: 'weather', label: 'Weather', icon: '', keywords: ['weather', 'accuweather'] },
      { id: 'tech', label: 'Tech', icon: '', keywords: ['tech', 'technology', 'cnet'] },
    ],
  },
  {
    category: 'Entertainment',
    subFilters: [
      { id: 'drama', label: 'Drama', icon: '', keywords: ['drama', 'amc', 'fx', 'tnt', 'usa'] },
      { id: 'reality', label: 'Reality', icon: '', keywords: ['reality', 'bravo', 'e!', 'tlc'] },
      { id: 'talkshow', label: 'Talk Shows', icon: '', keywords: ['talk', 'late night', 'tonight', 'daily'] },
      { id: 'awards', label: 'Awards/Red Carpet', icon: '', keywords: ['awards', 'oscar', 'grammy', 'emmy', 'red carpet'] },
      { id: 'british', label: 'British', icon: '', keywords: ['bbc', 'british', 'uk', 'itv'] },
    ],
  },
  {
    category: 'Movies',
    subFilters: [
      { id: 'action', label: 'Action', icon: '', keywords: ['action', 'thriller'] },
      { id: 'comedy', label: 'Comedy', icon: '', keywords: ['comedy', 'funny'] },
      { id: 'drama', label: 'Drama', icon: '', keywords: ['drama'] },
      { id: 'scifi', label: 'Sci-Fi', icon: '', keywords: ['sci-fi', 'science fiction', 'syfy'] },
      { id: 'classic', label: 'Classic', icon: '', keywords: ['classic', 'tcm', 'turner'] },
      { id: 'indie', label: 'Indie', icon: '', keywords: ['indie', 'independent', 'sundance'] },
    ],
  },
  {
    category: 'Kids',
    subFilters: [
      { id: 'cartoons', label: 'Cartoons', icon: '', keywords: ['cartoon', 'nickelodeon', 'disney'] },
      { id: 'educational', label: 'Educational', icon: '', keywords: ['educational', 'learning', 'pbs'] },
      { id: 'movies', label: 'Kids Movies', icon: '', keywords: ['disney', 'pixar', 'dreamworks'] },
      { id: 'preschool', label: 'Preschool', icon: '', keywords: ['preschool', 'baby', 'toddler', 'nick jr'] },
    ],
  },
  {
    category: 'Music',
    subFilters: [
      { id: 'pop', label: 'Pop/Top 40', icon: '', keywords: ['pop', 'top 40', 'hits', 'mtv'] },
      { id: 'hiphop', label: 'Hip-Hop/R&B', icon: '', keywords: ['hip hop', 'rap', 'r&b', 'bet'] },
      { id: 'rock', label: 'Rock', icon: '', keywords: ['rock', 'metal', 'alternative'] },
      { id: 'country', label: 'Country', icon: '', keywords: ['country', 'cmt'] },
      { id: 'latin', label: 'Latin', icon: '', keywords: ['latin', 'spanish', 'reggaeton'] },
      { id: 'concerts', label: 'Live Concerts', icon: '', keywords: ['concert', 'live', 'festival'] },
    ],
  },
  {
    category: 'Documentary',
    subFilters: [
      { id: 'nature', label: 'Nature', icon: '', keywords: ['nature', 'planet', 'wildlife', 'nat geo'] },
      { id: 'history', label: 'History', icon: '', keywords: ['history', 'ancient', 'war'] },
      { id: 'science', label: 'Science', icon: '', keywords: ['science', 'discovery', 'space'] },
      { id: 'truecrime', label: 'True Crime', icon: '', keywords: ['crime', 'investigation', 'murder', 'cold case'] },
      { id: 'travel', label: 'Travel', icon: '', keywords: ['travel', 'adventure', 'food'] },
    ],
  },
  {
    category: 'Horror',
    subFilters: [
      { id: 'slasher', label: 'Slasher', icon: '', keywords: ['slasher', 'friday', 'halloween', 'scream'] },
      { id: 'supernatural', label: 'Supernatural', icon: '', keywords: ['ghost', 'haunted', 'supernatural', 'paranormal'] },
      { id: 'monster', label: 'Monster', icon: '', keywords: ['zombie', 'monster', 'creature', 'alien'] },
      { id: 'psychological', label: 'Psychological', icon: '', keywords: ['psychological', 'thriller', 'suspense'] },
      { id: 'classic', label: 'Classic Horror', icon: '', keywords: ['classic', 'dracula', 'frankenstein', 'vampire'] },
    ],
  },
  {
    category: 'Comedy',
    subFilters: [
      { id: 'standup', label: 'Stand-Up', icon: '', keywords: ['standup', 'stand-up', 'comedy special'] },
      { id: 'sitcom', label: 'Sitcoms', icon: '', keywords: ['sitcom', 'friends', 'office', 'seinfeld'] },
      { id: 'improv', label: 'Improv/Sketch', icon: '', keywords: ['improv', 'sketch', 'snl'] },
      { id: 'animated', label: 'Animated', icon: '', keywords: ['animated', 'simpsons', 'family guy', 'south park'] },
    ],
  },
];

/**
 * Get sub-filters for a category
 */
export function getSubFiltersForCategory(category: string): SubFilter[] {
  const config = CATEGORY_SUB_FILTERS.find(c => c.category === category);
  return config?.subFilters || [];
}

/**
 * Check if a channel matches a sub-filter
 */
export function channelMatchesSubFilter(
  channelName: string,
  subFilter: SubFilter
): boolean {
  const name = channelName.toLowerCase();
  return subFilter.keywords.some(keyword => name.includes(keyword.toLowerCase()));
}

/**
 * Filter channels by sub-filter
 */
export function filterChannelsBySubFilter<T extends { name: string }>(
  channels: T[],
  subFilter: SubFilter
): T[] {
  return channels.filter(ch => channelMatchesSubFilter(ch.name, subFilter));
}

/**
 * Get all categories that have sub-filters
 */
export function getCategoriesWithSubFilters(): string[] {
  return CATEGORY_SUB_FILTERS.map(c => c.category);
}

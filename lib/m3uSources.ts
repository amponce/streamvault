/**
 * Popular M3U sources (community-maintained, free/legal)
 * Sources from iptv-org and Free-TV GitHub repositories
 */

export interface M3USource {
  name: string;
  url: string;
  description: string;
  category: string;
}

export const popularM3USources: M3USource[] = [
  // === PLUTO TV (RECOMMENDED) ===
  {
    name: 'Pluto TV (US)',
    url: 'https://raw.githubusercontent.com/iptv-org/iptv/refs/heads/master/streams/us_pluto.m3u',
    description: 'Free streaming TV - Movies, News, Sports & more',
    category: 'all',
  },

  // === PLEX TV ===
  {
    name: 'Plex TV (US)',
    url: 'https://raw.githubusercontent.com/iptv-org/iptv/refs/heads/master/streams/us_plex.m3u',
    description: 'Free Plex streaming channels - Movies, Lifestyle & more',
    category: 'all',
  },

  // === COMMUNITY CURATED ===
  {
    name: 'USA Channels (Curated)',
    url: 'https://raw.githubusercontent.com/tdog3344/USA2/5dfa4737b1219c95be8e65c01ffa670a67a331ce/m3u',
    description: 'Curated US channels collection',
    category: 'all',
  },

  // === FREE-TV (uses EPGShare01 guide data) ===
  {
    name: 'Free-TV (All)',
    url: 'https://raw.githubusercontent.com/Free-TV/IPTV/master/playlist.m3u8',
    description: 'Community-maintained free channels worldwide',
    category: 'all',
  },
  {
    name: 'Free-TV: USA',
    url: 'https://raw.githubusercontent.com/Free-TV/IPTV/master/playlists/playlist_usa.m3u8',
    description: 'Free US channels with EPG guide',
    category: 'local',
  },
  {
    name: 'Free-TV: Canada',
    url: 'https://raw.githubusercontent.com/Free-TV/IPTV/master/playlists/playlist_canada.m3u8',
    description: 'Free Canadian channels with EPG guide',
    category: 'local',
  },
  {
    name: 'Free-TV: UK',
    url: 'https://raw.githubusercontent.com/Free-TV/IPTV/master/playlists/playlist_uk.m3u8',
    description: 'Free UK channels with EPG guide',
    category: 'local',
  },
  {
    name: 'Free-TV: Germany',
    url: 'https://raw.githubusercontent.com/Free-TV/IPTV/master/playlists/playlist_germany.m3u8',
    description: 'Free German channels with EPG guide',
    category: 'local',
  },
  {
    name: 'Free-TV: France',
    url: 'https://raw.githubusercontent.com/Free-TV/IPTV/master/playlists/playlist_france.m3u8',
    description: 'Free French channels with EPG guide',
    category: 'local',
  },
  {
    name: 'Free-TV: Spain',
    url: 'https://raw.githubusercontent.com/Free-TV/IPTV/master/playlists/playlist_spain.m3u8',
    description: 'Free Spanish channels with EPG guide',
    category: 'local',
  },
  {
    name: 'Free-TV: Italy',
    url: 'https://raw.githubusercontent.com/Free-TV/IPTV/master/playlists/playlist_italy.m3u8',
    description: 'Free Italian channels with EPG guide',
    category: 'local',
  },
  {
    name: 'Free-TV: Japan',
    url: 'https://raw.githubusercontent.com/Free-TV/IPTV/master/playlists/playlist_japan.m3u8',
    description: 'Free Japanese channels with EPG guide',
    category: 'local',
  },
  {
    name: 'Free-TV: Korea',
    url: 'https://raw.githubusercontent.com/Free-TV/IPTV/master/playlists/playlist_korea.m3u8',
    description: 'Free Korean channels with EPG guide',
    category: 'local',
  },
  {
    name: 'Free-TV: India',
    url: 'https://raw.githubusercontent.com/Free-TV/IPTV/master/playlists/playlist_india.m3u8',
    description: 'Free Indian channels with EPG guide',
    category: 'local',
  },
  {
    name: 'Free-TV: Brazil',
    url: 'https://raw.githubusercontent.com/Free-TV/IPTV/master/playlists/playlist_brazil.m3u8',
    description: 'Free Brazilian channels with EPG guide',
    category: 'local',
  },
  {
    name: 'Free-TV: Mexico',
    url: 'https://raw.githubusercontent.com/Free-TV/IPTV/master/playlists/playlist_mexico.m3u8',
    description: 'Free Mexican channels with EPG guide',
    category: 'local',
  },

  // === IPTV-ORG BY CATEGORY ===
  {
    name: 'iptv-org: All Channels',
    url: 'https://iptv-org.github.io/iptv/index.m3u',
    description: 'All publicly available IPTV channels',
    category: 'all',
  },
  {
    name: 'iptv-org: Movies',
    url: 'https://iptv-org.github.io/iptv/categories/movies.m3u',
    description: 'Movie channels worldwide',
    category: 'movies',
  },
  {
    name: 'iptv-org: News',
    url: 'https://iptv-org.github.io/iptv/categories/news.m3u',
    description: 'News channels worldwide',
    category: 'news',
  },
  {
    name: 'iptv-org: Sports',
    url: 'https://iptv-org.github.io/iptv/categories/sports.m3u',
    description: 'Sports channels worldwide',
    category: 'sports',
  },
  {
    name: 'iptv-org: Entertainment',
    url: 'https://iptv-org.github.io/iptv/categories/entertainment.m3u',
    description: 'Entertainment channels worldwide',
    category: 'entertainment',
  },
  {
    name: 'iptv-org: Music',
    url: 'https://iptv-org.github.io/iptv/categories/music.m3u',
    description: 'Music channels worldwide',
    category: 'music',
  },
  {
    name: 'iptv-org: Kids',
    url: 'https://iptv-org.github.io/iptv/categories/kids.m3u',
    description: 'Kids channels worldwide',
    category: 'kids',
  },
  {
    name: 'iptv-org: Documentary',
    url: 'https://iptv-org.github.io/iptv/categories/documentary.m3u',
    description: 'Documentary channels worldwide',
    category: 'documentary',
  },
  {
    name: 'iptv-org: Comedy',
    url: 'https://iptv-org.github.io/iptv/categories/comedy.m3u',
    description: 'Comedy channels worldwide',
    category: 'comedy',
  },
  {
    name: 'iptv-org: Classic',
    url: 'https://iptv-org.github.io/iptv/categories/classic.m3u',
    description: 'Classic TV channels',
    category: 'entertainment',
  },
  {
    name: 'iptv-org: Cooking',
    url: 'https://iptv-org.github.io/iptv/categories/cooking.m3u',
    description: 'Cooking & food channels',
    category: 'entertainment',
  },
  {
    name: 'iptv-org: Lifestyle',
    url: 'https://iptv-org.github.io/iptv/categories/lifestyle.m3u',
    description: 'Lifestyle channels',
    category: 'entertainment',
  },
  {
    name: 'iptv-org: Travel',
    url: 'https://iptv-org.github.io/iptv/categories/travel.m3u',
    description: 'Travel channels',
    category: 'documentary',
  },
  {
    name: 'iptv-org: Science',
    url: 'https://iptv-org.github.io/iptv/categories/science.m3u',
    description: 'Science channels',
    category: 'documentary',
  },
  {
    name: 'iptv-org: Animation',
    url: 'https://iptv-org.github.io/iptv/categories/animation.m3u',
    description: 'Animation channels',
    category: 'kids',
  },
  {
    name: 'iptv-org: Series',
    url: 'https://iptv-org.github.io/iptv/categories/series.m3u',
    description: 'TV Series channels',
    category: 'entertainment',
  },

  // === IPTV-ORG BY COUNTRY ===
  {
    name: 'iptv-org: USA',
    url: 'https://iptv-org.github.io/iptv/countries/us.m3u',
    description: 'United States channels',
    category: 'local',
  },
  {
    name: 'iptv-org: UK',
    url: 'https://iptv-org.github.io/iptv/countries/uk.m3u',
    description: 'United Kingdom channels',
    category: 'local',
  },
  {
    name: 'iptv-org: Canada',
    url: 'https://iptv-org.github.io/iptv/countries/ca.m3u',
    description: 'Canadian channels',
    category: 'local',
  },
  {
    name: 'iptv-org: Australia',
    url: 'https://iptv-org.github.io/iptv/countries/au.m3u',
    description: 'Australian channels',
    category: 'local',
  },
  {
    name: 'iptv-org: Germany',
    url: 'https://iptv-org.github.io/iptv/countries/de.m3u',
    description: 'German channels',
    category: 'local',
  },
  {
    name: 'iptv-org: France',
    url: 'https://iptv-org.github.io/iptv/countries/fr.m3u',
    description: 'French channels',
    category: 'local',
  },
  {
    name: 'iptv-org: Spain',
    url: 'https://iptv-org.github.io/iptv/countries/es.m3u',
    description: 'Spanish channels',
    category: 'local',
  },
  {
    name: 'iptv-org: Italy',
    url: 'https://iptv-org.github.io/iptv/countries/it.m3u',
    description: 'Italian channels',
    category: 'local',
  },
  {
    name: 'iptv-org: Brazil',
    url: 'https://iptv-org.github.io/iptv/countries/br.m3u',
    description: 'Brazilian channels',
    category: 'local',
  },
  {
    name: 'iptv-org: Mexico',
    url: 'https://iptv-org.github.io/iptv/countries/mx.m3u',
    description: 'Mexican channels',
    category: 'local',
  },
  {
    name: 'iptv-org: India',
    url: 'https://iptv-org.github.io/iptv/countries/in.m3u',
    description: 'Indian channels',
    category: 'local',
  },
  {
    name: 'iptv-org: Japan',
    url: 'https://iptv-org.github.io/iptv/countries/jp.m3u',
    description: 'Japanese channels',
    category: 'local',
  },
  {
    name: 'iptv-org: South Korea',
    url: 'https://iptv-org.github.io/iptv/countries/kr.m3u',
    description: 'South Korean channels',
    category: 'local',
  },
  {
    name: 'iptv-org: China',
    url: 'https://iptv-org.github.io/iptv/countries/cn.m3u',
    description: 'Chinese channels',
    category: 'local',
  },
  {
    name: 'iptv-org: Russia',
    url: 'https://iptv-org.github.io/iptv/countries/ru.m3u',
    description: 'Russian channels',
    category: 'local',
  },
  {
    name: 'iptv-org: Albania',
    url: 'https://iptv-org.github.io/iptv/countries/al.m3u',
    description: 'Albanian channels',
    category: 'local',
  },
  {
    name: 'iptv-org: Netherlands',
    url: 'https://iptv-org.github.io/iptv/countries/nl.m3u',
    description: 'Dutch channels',
    category: 'local',
  },
  {
    name: 'iptv-org: Poland',
    url: 'https://iptv-org.github.io/iptv/countries/pl.m3u',
    description: 'Polish channels',
    category: 'local',
  },
  {
    name: 'iptv-org: Turkey',
    url: 'https://iptv-org.github.io/iptv/countries/tr.m3u',
    description: 'Turkish channels',
    category: 'local',
  },
  {
    name: 'iptv-org: Argentina',
    url: 'https://iptv-org.github.io/iptv/countries/ar.m3u',
    description: 'Argentine channels',
    category: 'local',
  },

  // === IPTV-ORG BY LANGUAGE ===
  {
    name: 'iptv-org: English',
    url: 'https://iptv-org.github.io/iptv/languages/eng.m3u',
    description: 'English language channels',
    category: 'all',
  },
  {
    name: 'iptv-org: Spanish',
    url: 'https://iptv-org.github.io/iptv/languages/spa.m3u',
    description: 'Spanish language channels',
    category: 'all',
  },
  {
    name: 'iptv-org: Portuguese',
    url: 'https://iptv-org.github.io/iptv/languages/por.m3u',
    description: 'Portuguese language channels',
    category: 'all',
  },
  {
    name: 'iptv-org: Arabic',
    url: 'https://iptv-org.github.io/iptv/languages/ara.m3u',
    description: 'Arabic language channels',
    category: 'all',
  },
  {
    name: 'iptv-org: Hindi',
    url: 'https://iptv-org.github.io/iptv/languages/hin.m3u',
    description: 'Hindi language channels',
    category: 'all',
  },
  {
    name: 'iptv-org: Chinese',
    url: 'https://iptv-org.github.io/iptv/languages/zho.m3u',
    description: 'Chinese language channels',
    category: 'all',
  },
];

/**
 * TMDB (The Movie Database) API Integration
 * Fetches rich metadata for movies and TV shows
 *
 * API Docs: https://developer.themoviedb.org/docs
 */

export interface TMDBMovie {
  id: number;
  title: string;
  original_title: string;
  overview: string;
  release_date: string;
  runtime: number | null;
  vote_average: number;
  vote_count: number;
  poster_path: string | null;
  backdrop_path: string | null;
  genres: { id: number; name: string }[];
  production_countries: { iso_3166_1: string; name: string }[];
  production_companies: { id: number; name: string; origin_country: string }[];
  tagline: string;
  budget: number;
  revenue: number;
  status: string;
  imdb_id: string | null;
}

export interface TMDBTVShow {
  id: number;
  name: string;
  original_name: string;
  overview: string;
  first_air_date: string;
  last_air_date: string;
  number_of_seasons: number;
  number_of_episodes: number;
  vote_average: number;
  vote_count: number;
  poster_path: string | null;
  backdrop_path: string | null;
  genres: { id: number; name: string }[];
  production_countries: { iso_3166_1: string; name: string }[];
  production_companies: { id: number; name: string; origin_country: string }[];
  networks: { id: number; name: string }[];
  status: string;
  tagline: string;
  type: string;
  created_by: { id: number; name: string }[];
}

export interface TMDBCastMember {
  id: number;
  name: string;
  character: string;
  profile_path: string | null;
  order: number;
  known_for_department: string;
}

export interface TMDBCrewMember {
  id: number;
  name: string;
  job: string;
  department: string;
  profile_path: string | null;
}

export interface TMDBCredits {
  cast: TMDBCastMember[];
  crew: TMDBCrewMember[];
}

export interface TMDBKeyword {
  id: number;
  name: string;
}

export interface TMDBSearchResult {
  id: number;
  title?: string;
  name?: string;
  media_type: 'movie' | 'tv' | 'person';
  overview: string;
  release_date?: string;
  first_air_date?: string;
  vote_average: number;
  poster_path: string | null;
}

export interface ContentMetadata {
  type: 'movie' | 'tv' | 'unknown';
  id: number;
  title: string;
  originalTitle: string;
  tagline: string;
  overview: string;
  releaseDate: string;
  runtime: string;
  rating: number;
  ratingCount: number;
  genres: string[];
  countries: string[];
  productionCompanies: string[];
  cast: { name: string; character: string; photo: string | null }[];
  directors: string[];
  writers: string[];
  composers: string[];
  cinematographers: string[];
  keywords: string[];
  budget: string | null;
  revenue: string | null;
  status: string;
  imdbId: string | null;
  posterUrl: string | null;
  backdropUrl: string | null;
  // TV-specific
  seasons?: number;
  episodes?: number;
  networks?: string[];
  creators?: string[];
  // Trivia and extras
  trivia: string[];
  filmingLocations: string[];
}

const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p';

/**
 * Format currency for display
 */
function formatCurrency(amount: number): string {
  if (amount === 0) return 'N/A';
  if (amount >= 1_000_000_000) {
    return `$${(amount / 1_000_000_000).toFixed(1)}B`;
  }
  if (amount >= 1_000_000) {
    return `$${(amount / 1_000_000).toFixed(0)}M`;
  }
  return `$${amount.toLocaleString()}`;
}

/**
 * Format runtime for display
 */
function formatRuntime(minutes: number | null): string {
  if (!minutes) return 'Unknown';
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours === 0) return `${mins}m`;
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
}

/**
 * Search TMDB for movies and TV shows
 */
export async function searchTMDB(
  query: string,
  apiKey: string,
  year?: string
): Promise<TMDBSearchResult[]> {
  const params = new URLSearchParams({
    api_key: apiKey,
    query: query,
    include_adult: 'false',
  });

  if (year) {
    params.append('year', year);
  }

  const response = await fetch(
    `https://api.themoviedb.org/3/search/multi?${params}`
  );

  if (!response.ok) {
    throw new Error(`TMDB search failed: ${response.status}`);
  }

  const data = await response.json();
  return data.results || [];
}

/**
 * Get detailed movie information
 */
export async function getMovieDetails(
  movieId: number,
  apiKey: string
): Promise<TMDBMovie> {
  const response = await fetch(
    `https://api.themoviedb.org/3/movie/${movieId}?api_key=${apiKey}`
  );

  if (!response.ok) {
    throw new Error(`TMDB movie details failed: ${response.status}`);
  }

  return response.json();
}

/**
 * Get detailed TV show information
 */
export async function getTVDetails(
  tvId: number,
  apiKey: string
): Promise<TMDBTVShow> {
  const response = await fetch(
    `https://api.themoviedb.org/3/tv/${tvId}?api_key=${apiKey}`
  );

  if (!response.ok) {
    throw new Error(`TMDB TV details failed: ${response.status}`);
  }

  return response.json();
}

/**
 * Get cast and crew credits
 */
export async function getCredits(
  id: number,
  type: 'movie' | 'tv',
  apiKey: string
): Promise<TMDBCredits> {
  const response = await fetch(
    `https://api.themoviedb.org/3/${type}/${id}/credits?api_key=${apiKey}`
  );

  if (!response.ok) {
    throw new Error(`TMDB credits failed: ${response.status}`);
  }

  return response.json();
}

/**
 * Get keywords for a movie or TV show
 */
export async function getKeywords(
  id: number,
  type: 'movie' | 'tv',
  apiKey: string
): Promise<TMDBKeyword[]> {
  const response = await fetch(
    `https://api.themoviedb.org/3/${type}/${id}/keywords?api_key=${apiKey}`
  );

  if (!response.ok) {
    return [];
  }

  const data = await response.json();
  return data.keywords || data.results || [];
}

/**
 * Parse a title to extract show name and potential year
 */
export function parseTitle(rawTitle: string): { title: string; year?: string; season?: number; episode?: number } {
  let title = rawTitle.trim();
  let year: string | undefined;
  let season: number | undefined;
  let episode: number | undefined;

  // Extract year in parentheses: "Die Hard (1988)"
  const yearMatch = title.match(/\((\d{4})\)/);
  if (yearMatch) {
    year = yearMatch[1];
    title = title.replace(/\s*\(\d{4}\)\s*/, ' ').trim();
  }

  // Extract season/episode: "S3E5" or "Season 3 Episode 5"
  const seMatch = title.match(/S(\d+)E(\d+)/i);
  if (seMatch) {
    season = parseInt(seMatch[1], 10);
    episode = parseInt(seMatch[2], 10);
    title = title.replace(/S\d+E\d+/i, '').trim();
  }

  const seasonEpMatch = title.match(/Season\s*(\d+)\s*Episode\s*(\d+)/i);
  if (seasonEpMatch) {
    season = parseInt(seasonEpMatch[1], 10);
    episode = parseInt(seasonEpMatch[2], 10);
    title = title.replace(/Season\s*\d+\s*Episode\s*\d+/i, '').trim();
  }

  // Clean up common suffixes
  title = title
    .replace(/\s*-\s*$/, '')
    .replace(/\s*:\s*$/, '')
    .replace(/\s+/g, ' ')
    .trim();

  return { title, year, season, episode };
}

/**
 * Generate trivia based on metadata
 */
function generateTrivia(metadata: Partial<ContentMetadata>): string[] {
  const trivia: string[] = [];

  if (metadata.budget && metadata.revenue) {
    const budgetNum = parseInt(metadata.budget.replace(/[^0-9]/g, '')) || 0;
    const revenueNum = parseInt(metadata.revenue.replace(/[^0-9]/g, '')) || 0;
    if (budgetNum > 0 && revenueNum > budgetNum * 2) {
      trivia.push(`This was a major box office success, earning ${metadata.revenue} against a ${metadata.budget} budget.`);
    }
  }

  if (metadata.rating && metadata.rating >= 8.0) {
    trivia.push(`Highly rated with a ${metadata.rating}/10 score from ${metadata.ratingCount?.toLocaleString()} votes.`);
  }

  if (metadata.genres?.includes('Horror') && metadata.releaseDate) {
    const month = new Date(metadata.releaseDate).getMonth();
    if (month === 9) { // October
      trivia.push('Released in October, perfect timing for Halloween season!');
    }
  }

  if (metadata.seasons && metadata.seasons >= 5) {
    trivia.push(`A long-running series with ${metadata.seasons} seasons and ${metadata.episodes} episodes.`);
  }

  return trivia;
}

/**
 * Look up content metadata by title
 * This is the main function to use for the Ask AI feature
 */
export async function lookupContent(
  rawTitle: string,
  apiKey: string
): Promise<ContentMetadata | null> {
  try {
    const { title, year, season, episode } = parseTitle(rawTitle);

    if (!title || title.length < 2) {
      return null;
    }

    // Search TMDB
    const searchResults = await searchTMDB(title, apiKey, year);

    if (searchResults.length === 0) {
      return null;
    }

    // Find the best match (prefer exact title matches)
    const bestMatch = searchResults.find(
      r => (r.title?.toLowerCase() === title.toLowerCase()) ||
           (r.name?.toLowerCase() === title.toLowerCase())
    ) || searchResults[0];

    const isMovie = bestMatch.media_type === 'movie';
    const id = bestMatch.id;

    // Fetch detailed info and credits in parallel
    const [details, credits, keywords] = await Promise.all([
      isMovie ? getMovieDetails(id, apiKey) : getTVDetails(id, apiKey),
      getCredits(id, isMovie ? 'movie' : 'tv', apiKey),
      getKeywords(id, isMovie ? 'movie' : 'tv', apiKey),
    ]);

    // Build the metadata object
    const metadata: ContentMetadata = {
      type: isMovie ? 'movie' : 'tv',
      id,
      title: isMovie ? (details as TMDBMovie).title : (details as TMDBTVShow).name,
      originalTitle: isMovie ? (details as TMDBMovie).original_title : (details as TMDBTVShow).original_name,
      tagline: isMovie ? (details as TMDBMovie).tagline : (details as TMDBTVShow).tagline || '',
      overview: details.overview || '',
      releaseDate: isMovie ? (details as TMDBMovie).release_date : (details as TMDBTVShow).first_air_date,
      runtime: isMovie ? formatRuntime((details as TMDBMovie).runtime) : 'Series',
      rating: Math.round(details.vote_average * 10) / 10,
      ratingCount: details.vote_count,
      genres: details.genres?.map(g => g.name) || [],
      countries: details.production_countries?.map(c => c.name) || [],
      productionCompanies: details.production_companies?.map(c => c.name) || [],
      cast: credits.cast.slice(0, 10).map(c => ({
        name: c.name,
        character: c.character,
        photo: c.profile_path ? `${TMDB_IMAGE_BASE}/w185${c.profile_path}` : null,
      })),
      directors: credits.crew.filter(c => c.job === 'Director').map(c => c.name),
      writers: credits.crew.filter(c =>
        c.job === 'Writer' || c.job === 'Screenplay' || c.job === 'Story'
      ).map(c => c.name).slice(0, 5),
      composers: credits.crew.filter(c =>
        c.job === 'Original Music Composer' || c.job === 'Music'
      ).map(c => c.name),
      cinematographers: credits.crew.filter(c =>
        c.job === 'Director of Photography' || c.job === 'Cinematography'
      ).map(c => c.name),
      keywords: keywords.map(k => k.name).slice(0, 10),
      budget: isMovie ? formatCurrency((details as TMDBMovie).budget) : null,
      revenue: isMovie ? formatCurrency((details as TMDBMovie).revenue) : null,
      status: details.status,
      imdbId: isMovie ? (details as TMDBMovie).imdb_id : null,
      posterUrl: details.poster_path ? `${TMDB_IMAGE_BASE}/w500${details.poster_path}` : null,
      backdropUrl: details.backdrop_path ? `${TMDB_IMAGE_BASE}/w1280${details.backdrop_path}` : null,
      trivia: [],
      filmingLocations: [], // Would need additional API call to get these
    };

    // Add TV-specific fields
    if (!isMovie) {
      const tvDetails = details as TMDBTVShow;
      metadata.seasons = tvDetails.number_of_seasons;
      metadata.episodes = tvDetails.number_of_episodes;
      metadata.networks = tvDetails.networks?.map(n => n.name) || [];
      metadata.creators = tvDetails.created_by?.map(c => c.name) || [];
    }

    // Generate trivia
    metadata.trivia = generateTrivia(metadata);

    return metadata;
  } catch (error) {
    console.error('TMDB lookup error:', error);
    return null;
  }
}

/**
 * Format metadata into a context string for the AI
 */
export function formatMetadataForAI(metadata: ContentMetadata): string {
  const lines: string[] = [];

  lines.push(`Title: ${metadata.title}`);
  if (metadata.tagline) lines.push(`Tagline: "${metadata.tagline}"`);
  lines.push(`Type: ${metadata.type === 'movie' ? 'Movie' : 'TV Show'}`);
  lines.push(`Released: ${metadata.releaseDate}`);
  if (metadata.runtime !== 'Series') lines.push(`Runtime: ${metadata.runtime}`);
  lines.push(`Rating: ${metadata.rating}/10 (${metadata.ratingCount.toLocaleString()} votes)`);
  lines.push(`Genres: ${metadata.genres.join(', ')}`);

  if (metadata.directors.length > 0) {
    lines.push(`Director(s): ${metadata.directors.join(', ')}`);
  }

  if (metadata.creators && metadata.creators.length > 0) {
    lines.push(`Created by: ${metadata.creators.join(', ')}`);
  }

  if (metadata.cast.length > 0) {
    const castStr = metadata.cast
      .slice(0, 5)
      .map(c => `${c.name} as ${c.character}`)
      .join(', ');
    lines.push(`Cast: ${castStr}`);
  }

  if (metadata.writers.length > 0) {
    lines.push(`Writers: ${metadata.writers.join(', ')}`);
  }

  if (metadata.composers.length > 0) {
    lines.push(`Music by: ${metadata.composers.join(', ')}`);
  }

  if (metadata.countries.length > 0) {
    lines.push(`Country: ${metadata.countries.join(', ')}`);
  }

  if (metadata.productionCompanies.length > 0) {
    lines.push(`Production: ${metadata.productionCompanies.slice(0, 3).join(', ')}`);
  }

  if (metadata.budget && metadata.budget !== 'N/A') {
    lines.push(`Budget: ${metadata.budget}`);
  }

  if (metadata.revenue && metadata.revenue !== 'N/A') {
    lines.push(`Box Office: ${metadata.revenue}`);
  }

  if (metadata.seasons) {
    lines.push(`Seasons: ${metadata.seasons} (${metadata.episodes} episodes)`);
  }

  if (metadata.networks && metadata.networks.length > 0) {
    lines.push(`Network: ${metadata.networks.join(', ')}`);
  }

  lines.push('');
  lines.push(`Synopsis: ${metadata.overview}`);

  if (metadata.keywords.length > 0) {
    lines.push(`Keywords: ${metadata.keywords.join(', ')}`);
  }

  return lines.join('\n');
}

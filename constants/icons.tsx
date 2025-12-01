/**
 * Icon constants for the application
 * Moved outside components to avoid recreation on every render
 */

import {
  Tv,
  Home,
  Newspaper,
  Trophy,
  Clapperboard,
  Film,
  Music,
  Baby,
  GraduationCap,
  Skull,
  Laugh,
  Flame,
  Smile,
  Brain,
  PartyPopper,
  Ghost,
  Radio,
  MonitorPlay,
  Heart,
} from 'lucide-react';
import { Mood } from '@/lib/aiFeatures';

// Category icon components
export const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  Favorites: <Heart size={16} />,
  All: <Tv size={16} />,
  Local: <Home size={16} />,
  News: <Newspaper size={16} />,
  Sports: <Trophy size={16} />,
  Entertainment: <Clapperboard size={16} />,
  Movies: <Film size={16} />,
  Music: <Music size={16} />,
  Kids: <Baby size={16} />,
  Documentary: <GraduationCap size={16} />,
  Horror: <Skull size={16} />,
  Comedy: <Laugh size={16} />,
};

// Mood icon components
export const MOOD_ICONS: Record<Mood, React.ReactNode> = {
  excited: <Flame size={24} />,
  relaxed: <Smile size={24} />,
  informed: <Brain size={24} />,
  entertained: <PartyPopper size={24} />,
  scared: <Ghost size={24} />,
};

// Content filter icons
export const CONTENT_FILTER_ICONS: Record<string, React.ReactNode> = {
  movies: <Film size={14} />,
  tv: <MonitorPlay size={14} />,
  all: <Radio size={14} />,
};

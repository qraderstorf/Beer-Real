export interface ActivityComment {
  id: string;
  user: string;
  text: string;
  date: string;
  reactions?: Record<string, string[]>;
}

export interface BeerLog {
  id: string;
  user: string;
  beerName: string;
  beerStyle: string;
  abv: number;
  date: string;
  rating: number;
  cheers: string[];
  comment?: string;
  imageUrl?: string;
  comments?: ActivityComment[];
  reactions?: Record<string, string[]>;
  hadCig?: boolean;
  pubId?: string;
}

export interface UserProfile {
  username: string;
  favoriteStyle: string;
  joinedDate: string;
  avatar: string; // Emoji avatar or standard icon name
  bio?: string;
  password?: string;
  realName?: string;
  photoUrl?: string;
  email?: string;
  stats?: {
    totalPints: number;
    avgRating: string;
    favoriteStyle: string;
    totalCheers: number;
    benderCount: number;
    longestDrinkingStreak: number;
    longestDryStreak: number;
    currentDrinkingStreak: number;
    currentDryStreak: number;
  };
}

export type TimeFilter = 'week' | 'month' | 'all';

export function isSeymoreBeers(username: string): boolean {
  if (!username) return false;
  const normalized = username.toLowerCase().trim().replace(/\s+/g, "");
  return normalized === "seymorebeers" || normalized === "seymorebeerz" || normalized === "seymore";
}

export interface AppNotification {
  id: string;
  user: string;
  text: string;
  date: string;
  readBy: string[];
  targetUser?: string;
  type?: 'post' | 'comment' | 'cheer' | 'reaction' | 'bender' | 'invite' | 'tag' | 'imposter' | 'beacon' | 'chat';
}

export interface Pub {
  id: string;
  name: string;
  owner: string;
  members: string[];
  invited: string[];
  emblem?: string;
}

export interface PubChatMessage {
  id: string;
  pubId: string;
  user: string;
  text: string;
  date: string;
}



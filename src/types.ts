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
  isFirstOfDay?: boolean; // first pint logged by anyone, that calendar day
  isNewStyle?: boolean; // first time this user has logged this beerStyle
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
  friends?: string[]; // mutual friend usernames
  friendRequests?: string[]; // incoming pending friend request usernames
  blockedUsers?: string[]; // usernames this profile has blocked
  stats?: {
    totalPints: number;
    avgRating: string;
    favoriteStyle: string;
    totalCheers: number;
    theUsualBeerName: string;
    theUsualCount: number;
    goldenHourLabel: string;
    goldenHourEmoji: string;
    firstPourCount: number;
    longestDryStreak: number;
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
  type?: 'post' | 'comment' | 'cheer' | 'reaction' | 'bender' | 'first_pour' | 'invite' | 'tag' | 'imposter' | 'beacon' | 'chat' | 'friend_request' | 'friend_accept';
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

export interface ContentReport {
  id: string;
  reporterUsername: string;
  targetType: 'user' | 'post' | 'comment';
  targetId: string; // username for 'user', beer log id for 'post', comment id for 'comment'
  targetUsername?: string; // the username being reported/whose content is being reported
  reason: string;
  note?: string;
  date: string;
  status: 'open' | 'resolved';
}



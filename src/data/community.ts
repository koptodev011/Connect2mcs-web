import type { SceneKind } from '@/components/Scenes';
import type { Tone } from '@/lib/tokens';
import type { IconName } from '@/components/Icon';

export interface CommunityPerson {
  name: string;
  role: string;
  city: string;
  mandal: string;
  open: string;
  conn: string;
}

export interface Group {
  name: string;
  members: number;
  posts: string;
  tone: Tone;
  kind: SceneKind;
}

export interface CommunityStat {
  k: string;
  l: string;
  s: string;
  ic: IconName;
  tone: string;
  bg: string;
}

/** Full directory of featured community members (also used on the home page — take first 5). */
export const communityPeople: CommunityPerson[] = [
  { name: 'Madhura Phadke',   role: 'UX Designer · Atlassian',        city: 'Sydney',    mandal: 'Sydney MM',  open: 'Mentor',    conn: '12 mutual' },
  { name: 'Rohan Bhave',      role: 'Software Engineer · Amazon',     city: 'Seattle',   mandal: 'Seattle MM', open: 'Refer',     conn: '8 mutual'  },
  { name: 'Snehal Joshi',     role: 'Bharatanatyam Dancer',           city: 'Toronto',   mandal: 'Toronto MM', open: 'Collab',    conn: '4 mutual'  },
  { name: 'Mihir Apte',       role: "Author · \"Kokanchya Aathvani\"", city: 'Mumbai',    mandal: 'Mumbai MM',  open: 'Speaker',   conn: '22 mutual' },
  { name: 'Sai Karve',        role: 'Chef · Saatvik Kitchen',         city: 'London',    mandal: 'London MM',  open: 'Catering',  conn: '6 mutual'  },
  { name: 'Ananya Deshmukh',  role: 'Founder · Vidya Tech',           city: 'Bengaluru', mandal: 'BMM',        open: 'Hiring',    conn: '14 mutual' },
  { name: 'Tejas Mhatre',     role: 'PhD Student · MIT',              city: 'Boston',    mandal: 'Boston MM',  open: 'Study',     conn: '2 mutual'  },
  { name: 'Priyanka Gokhale', role: 'Marathi Journalist · Loksatta',  city: 'Pune',      mandal: 'BMM',        open: 'Interview', conn: '5 mutual'  },
];

export const groups: Group[] = [
  { name: 'Marathi in Tech',         members: 4218, posts: '38 today',  tone: 'blue',    kind: 'job'   },
  { name: 'Aai-cha Swayampaak',      members: 1842, posts: '12 today',  tone: 'saffron', kind: 'food'  },
  { name: 'Marathi Sahitya Charcha', members: 968,  posts: '6 today',   tone: 'brick',   kind: 'study' },
  { name: 'Bay Area Mandal Squad',   members: 412,  posts: '24 today',  tone: 'green',   kind: 'group' },
];

export const communityStats: CommunityStat[] = [
  { k: '38,420', l: 'Members',              s: '+412 this week', ic: 'people', tone: '#E26A1F', bg: '#FFE9D6' },
  { k: '6,248',  l: 'Mentors offering time', s: 'avg 4hr/month', ic: 'spark',  tone: '#1F7A3A', bg: '#E1F2E6' },
  { k: '142',    l: 'Active groups',         s: '24 hiring now', ic: 'chat',   tone: '#1F4DA8', bg: '#DCE5F4' },
  { k: '94%',    l: 'Verified profiles',     s: 'mandal-vouched',ic: 'verify', tone: '#A8321F', bg: '#FAE0DA' },
];

/** Gradient pairs used for member card cover strips (cycles by index). */
export const memberGradients: [string, string][] = [
  ['#FFD9B0', '#F2B57A'],
  ['#E8B6A8', '#C97D6D'],
  ['#C8DCC0', '#9DBE8A'],
  ['#BCC9E0', '#8FA3CC'],
];

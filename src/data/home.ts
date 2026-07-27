import type { Tone } from '@/lib/tokens';
import type { SceneKind } from '@/components/Scenes';

/** Slim mandal record used only for the home page featured row. */
export interface HomeMandal {
  name: string;
  city: string;
  code: string;
  tone: Tone;
  rating: number;
  members: number;
  events: number;
  dist: string;
  badge?: string;
}

export const homeMandals: HomeMandal[] = [
  { name: 'Boston Marathi Mandal',     city: 'Boston, USA',     code: 'BMM',  tone: 'saffron', rating: 4.8, members: 412,  events: 7,  dist: '6 mi',     badge: 'Active'    },
  { name: 'BMM New Jersey',            city: 'Edison, USA',     code: 'BMM',  tone: 'brick',   rating: 4.7, members: 738,  events: 9,  dist: '210 mi',   badge: 'Hosting'   },
  { name: 'Marathi Mandal Toronto',    city: 'Toronto, Canada', code: 'MMT',  tone: 'green',   rating: 4.9, members: 1024, events: 11, dist: '462 mi'                       },
  { name: 'Maharashtra Mandal London', city: 'London, UK',      code: 'MML',  tone: 'blue',    rating: 4.9, members: 2104, events: 14, dist: '3,277 mi', badge: 'Est. 1932' },
  { name: 'Marathi Mandal Sydney',     city: 'Sydney, AU',      code: 'MMS',  tone: 'gold',    rating: 4.6, members: 384,  events: 5,  dist: '10K mi'                       },
];

export interface HomeResource {
  href: string;
  title: string;
  sub: string;
  tone: Tone;
  kind: SceneKind;
}

export interface HomeEvent {
  day: string;
  month: string;
  title: string;
  where: string;
  cat: string;
  going: number;
  tone: Tone;
  tag?: string;
}

export interface HeroStat {
  v: string;
  l: string;
}

export const heroStats: HeroStat[] = [
  { v: '184',    l: 'Mandals · 27 countries'  },
  { v: '38,420', l: 'members worldwide'        },
  { v: '1,248',  l: 'open jobs'                },
];

export const homeEvents: HomeEvent[] = [
  { day: '07', month: 'MAY', title: 'Marathi Poetry Evening',    where: 'Shivaji Mandir, Dadar',    cat: 'Cultural', going: 42,  tone: 'saffron', tag: 'Trending' },
  { day: '08', month: 'MAY', title: 'Gudhipadwa Get-together',   where: 'Marathi Mandal, Pune',     cat: 'Festival', going: 128, tone: 'brick',   tag: 'Featured' },
  { day: '09', month: 'MAY', title: 'Pt. Bhimsen Joshi Tribute', where: 'Boston Public Library',    cat: 'Music',    going: 64,  tone: 'green'                    },
  { day: '14', month: 'MAY', title: 'Marathi Book Exhibition',   where: 'Bharatiya Bhavan, London', cat: 'Literary', going: 96,  tone: 'blue'                     },
];

export const homeEventKindMap: Record<string, SceneKind> = {
  Cultural: 'event',
  Festival: 'event',
  Music:    'music',
  Literary: 'study',
};

export const resources: HomeResource[] = [
  { href: '/learn',       title: 'Scholarships',    sub: '24 open · $120K pool',          tone: 'gold',    kind: 'scholarship' },
  { href: '/learn',       title: 'Internships',     sub: '38 open · summer 2026',         tone: 'green',   kind: 'study'       },
  { href: '/mentorship',  title: 'Mentorship',      sub: '142 mentors offering time',     tone: 'blue',    kind: 'people'      },
  { href: '/housing',     title: 'Shared housing',  sub: '76 listings worldwide',         tone: 'pink',    kind: 'housing'     },
  { href: '/tiffin',      title: 'Tiffin services', sub: '6 home cooks near Boston',      tone: 'saffron', kind: 'food'        },
  { href: '/taxi',        title: 'NRI Taxi',        sub: 'Community-vetted drivers',      tone: 'brick',   kind: 'people'      },
  { href: '/marketplace', title: 'Buy & Sell',      sub: 'Community classifieds',         tone: 'green',   kind: 'group'       },
  { href: '/businesses',  title: 'Businesses',      sub: '240+ Marathi-owned businesses', tone: 'gold',    kind: 'job'         },
  { href: '/offers',      title: 'MCS Offers',      sub: 'Exclusive member deals',        tone: 'pink',    kind: 'ornament'    },
  { href: '/rates',       title: 'Exchange rates',  sub: 'Live USD/INR + 6 currencies',   tone: 'blue',    kind: 'panchang'    },
  { href: '/newspaper',   title: 'Newspaper',       sub: '5 Marathi papers · today',      tone: 'sand',    kind: 'news'        },
  { href: '/culture',     title: 'Marathi Arti',    sub: '120+ devotional hymns',         tone: 'brick',   kind: 'arti'        },
  { href: '/culture',     title: 'Panchang',        sub: 'Today: Vaishakh Saptami',       tone: 'saffron', kind: 'panchang'    },
  { href: '/news',        title: 'News',            sub: 'Updated daily',                 tone: 'sand',    kind: 'news'        },
  { href: '/chat',        title: 'Chat',            sub: '3 unread messages',             tone: 'green',   kind: 'group'       },
  { href: '/jobs',        title: 'Career Quiz',     sub: '12 questions · ~6 min',         tone: 'saffron', kind: 'job'         },
  { href: '/jobs',        title: 'Resume builder',  sub: '5 professional templates',      tone: 'blue',    kind: 'job'         },
  { href: '/profile',     title: 'Your profile',    sub: 'Saved Mandals · RSVPs',         tone: 'pink',    kind: 'people'      },
  { href: '/help',        title: 'Help & support',  sub: 'Median reply under 6h',         tone: 'sand',    kind: 'ornament'    },
];

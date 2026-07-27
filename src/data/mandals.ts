import type { Tone } from '@/lib/tokens';

export type Region = 'Near me' | 'India' | 'North America' | 'Europe' | 'Middle East' | 'Asia-Pacific' | 'Africa';

export interface Mandal {
  image?: string;
  about?: string;
  address?: string;
  postal?: string;
  name: string;
  city: string;
  country: string;
  est: number;
  members: number;
  events: number;
  rating: number;
  dist: string;
  tone: Tone;
  code: string;
  hosting?: boolean;
  region: Region;
  nearMe?: boolean;
  /** Badge string shown on the home page mandal card. */
  badge?: string | null;
  /** Whether this mandal appears in the home page featured row. */
  home?: boolean;
  email?: string;
}

export const mandals: Mandal[] = [
  { name: 'Boston Marathi Mandal',        city: 'Boston, MA',    country: 'USA',    est: 1972, members: 412,  events: 7,  rating: 4.8, dist: '6 mi',      tone: 'saffron', code: 'BMM',     hosting: true,  region: 'North America', nearMe: true, badge: 'Active',    home: true  },
  { name: 'Brihan Maharashtra Mandal',    city: 'Edison, NJ',    country: 'USA',    est: 1981, members: 738,  events: 9,  rating: 4.7, dist: '210 mi',    tone: 'brick',   code: 'BMM-NJ',  region: 'North America', nearMe: true, badge: 'Hosting',   home: true  },
  { name: 'Marathi Mandal Toronto',       city: 'Toronto, ON',   country: 'Canada', est: 1968, members: 1024, events: 11, rating: 4.9, dist: '462 mi',    tone: 'green',   code: 'MMT',     region: 'North America', badge: null,         home: true  },
  { name: 'Maharashtra Mandal London',    city: 'London',        country: 'UK',     est: 1932, members: 2104, events: 14, rating: 4.9, dist: '3,277 mi',  tone: 'blue',    code: 'MML',     hosting: true,  region: 'Europe',        badge: 'Est. 1932', home: true  },
  { name: 'Marathi Vishwa Dubai',         city: 'Dubai',         country: 'UAE',    est: 2002, members: 612,  events: 6,  rating: 4.5, dist: '7,000 mi',  tone: 'gold',    code: 'MVD',     region: 'Middle East',   badge: null                        },
  { name: 'Marathi Mandal Sydney',        city: 'Sydney, NSW',   country: 'AU',     est: 1989, members: 384,  events: 5,  rating: 4.6, dist: '10,400 mi', tone: 'pink',    code: 'MMS',     region: 'Asia-Pacific',  badge: null,         home: true  },
  { name: 'Maharashtra Mandal Singapore', city: 'Singapore',     country: 'SG',     est: 1995, members: 528,  events: 8,  rating: 4.7, dist: '9,800 mi',  tone: 'green',   code: 'MMS-SG',  region: 'Asia-Pacific',  badge: null                        },
  { name: 'Maharashtra Mandal Frankfurt', city: 'Frankfurt',     country: 'DE',     est: 1998, members: 296,  events: 4,  rating: 4.5, dist: '3,800 mi',  tone: 'sand',    code: 'MMF',     region: 'Europe',        badge: null                        },
];

/** Approximate SVG percentage positions used to render dots on the global map. */
export const mapDots = [
  { x: 24, y: 24 }, { x: 30, y: 26 }, { x: 16, y: 30 }, { x: 22, y: 38 },
  { x: 50, y: 22 }, { x: 56, y: 28 }, { x: 60, y: 36 }, { x: 66, y: 42 },
  { x: 74, y: 46 }, { x: 86, y: 70 },
];

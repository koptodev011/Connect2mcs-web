import type { Tone } from '@/lib/tokens';

export interface CurrentUser {
  name: string;
  marathi: string;
  role: string;
  city: string;
  country: string;
  origin: string;
  type: string;
  mandal: string;
  joined: string;
  bio: string;
  langs: string[];
  open: string[];
  email: string;
  phone: string;
}

export interface SavedMandal {
  name: string;
  city: string;
  tone: Tone;
}

export interface ProfileEvent {
  day: string;
  month: string;
  title: string;
  role: string;
}

export interface ProfileStat {
  v: string;
  l: string;
  h: string;
}

export const me: CurrentUser = {
  name:    'Anuja Karandikar',
  marathi: 'अनुजा करंदीकर',
  role:    'Senior Product Designer',
  city:    'Boston, MA',
  country: 'United States',
  origin:  'Pune, IN',
  type:    'NRI',
  mandal:  'Boston Marathi Mandal',
  joined:  'Apr 2024',
  bio:     'Designer building enterprise software at Persistent Systems. Lifelong Marathi reader, occasional Bharatanatyam dancer, Pune-born, Boston-based. Happy to mentor early-career designers from the community.',
  langs:   ['English', 'मराठी', 'हिंदी'],
  open:    ['Mentor', 'Speaker', 'Casual chai'],
  email:   'anuja@example.com',
  phone:   '+1 617 xxx xx22',
};

export const savedMandals: SavedMandal[] = [
  { name: 'Boston Marathi Mandal',     city: 'Boston, MA', tone: 'saffron' },
  { name: 'BMM New Jersey',            city: 'Edison, NJ', tone: 'brick'   },
  { name: 'Maharashtra Mandal London', city: 'London, UK', tone: 'blue'    },
];

export const myEvents: ProfileEvent[] = [
  { day: '17', month: 'MAY', title: 'Marathi Food Festival', role: 'Going · 412 others'     },
  { day: '24', month: 'MAY', title: 'Lavani Dance Workshop', role: 'Going · 38 others'      },
  { day: '08', month: 'JUN', title: 'BMM AGM Meeting',       role: 'Hosting · committee'   },
];

export const profileStats: ProfileStat[] = [
  { v: '142', l: 'Connections',   h: '+8 this week'      },
  { v: '7',   l: 'Saved Mandals', h: 'across 4 countries'},
  { v: '12',  l: 'Events RSVPed', h: '3 upcoming'        },
  { v: '4',   l: 'Applications',  h: '2 pending'         },
];

import type { Tone } from '@/lib/tokens';

export interface HousingListing {
  id: string;
  title: string;
  city: string;
  rent: string;
  type: string;
  gender: string;
  size: string;
  host: string;
  stay: string;
  tone: Tone;
  nearMe?: boolean;
  student?: boolean;
}

export interface HousingRequest {
  name: string;
  looking: string;
  budget: string;
  when: string;
  note: string;
  tone: Tone;
}

export const housingListings: HousingListing[] = [
  { id: 'cambridge', title: 'Sunny 2BHK near Kendall',         city: 'Cambridge, MA', rent: '$1,650/mo',  type: 'Roommate',    gender: 'Female only', size: '1 room of 2',  host: 'Anuja K.',  stay: 'Long-term',  tone: 'saffron', nearMe: true, student: true },
  { id: 'edison',    title: 'Studio next to BMM Edison',        city: 'Edison, NJ',    rent: '$1,200/mo',  type: 'Whole place', gender: 'Anyone',      size: 'Studio',       host: 'Ravi P.',   stay: 'Short stay', tone: 'brick',   nearMe: true              },
  { id: 'pune',      title: 'Marathi-veg friendly home',        city: 'Pune, IN',      rent: '₹14,000/mo', type: 'PG',          gender: 'Male only',   size: 'Shared',       host: 'Suhas D.',  stay: 'Long-term',  tone: 'green',                 student: true },
  { id: 'london',    title: 'Quiet flat near Marathi Mandal',   city: 'London, UK',    rent: '£950/mo',    type: 'Roommate',    gender: 'Anyone',      size: '1 of 3 rooms', host: 'Snehal G.', stay: 'Long-term',  tone: 'blue'                                },
  { id: 'toronto',   title: 'Cozy room for graduate student',   city: 'Toronto, ON',   rent: 'C$780/mo',   type: 'Roommate',    gender: 'Female only', size: '1 of 2 rooms', host: 'Maya J.',   stay: 'Long-term',  tone: 'pink',                  student: true },
  { id: 'dubai',     title: 'Family suite near Marathi Vishwa', city: 'Dubai, UAE',    rent: 'AED 4,200',  type: 'Whole place', gender: 'Family',      size: '2BHK',         host: 'Kiran A.',  stay: 'Short stay', tone: 'gold'                                },
];

export const housingRequests: HousingRequest[] = [
  { name: 'Tejas Mhatre',     looking: 'Boston, MA',   budget: '$900–1,200', when: 'Aug 2026', note: 'PhD student joining MIT — looking for shared room near Cambridge.', tone: 'saffron' },
  { name: 'Priyanka Gokhale', looking: 'Pune, IN',     budget: '₹12k–18k',   when: 'Jun 2026', note: 'Marathi journalist relocating from Mumbai. Female roommate preferred.', tone: 'brick' },
  { name: 'Ananya Deshmukh',  looking: 'San Jose, CA', budget: '$1,500–2k',  when: 'Jul 2026', note: 'Founder, vegetarian, can host events. Quiet street preferred.', tone: 'blue' },
];

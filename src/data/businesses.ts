import type { Tone } from '@/lib/tokens';

export interface Business {
  id: string;
  name: string;
  owner: string;
  cat: string;
  city: string;
  desc: string;
  services: string[];
  rating: number;
  reviews: number;
  years: number;
  tone: Tone;
  mandal: string;
  verified: boolean;
  phone?: string;
}

export interface BusinessStat {
  v: string;
  l: string;
  s: string;
}

export const businesses: Business[] = [
  {
    id: 'apte-law',      name: 'Apte & Associates',           owner: 'Adv. Suresh Apte',    cat: 'Legal',
    city: 'Boston, MA',  rating: 4.9, reviews: 84,  years: 14, tone: 'blue',    mandal: 'Boston MM',  verified: true,
    desc: 'Immigration, family law, NRI property matters. Marathi and English consultation. Free 30-min first call.',
    services: ['Immigration law', 'Property disputes', 'NRI estate planning', 'Family law'],
  },
  {
    id: 'dr-kale',       name: 'Dr. Aarti Kale · Cardiology', owner: 'Dr. Aarti Kale',      cat: 'Medical',
    city: 'Boston, MA',  rating: 5.0, reviews: 212, years: 22, tone: 'green',   mandal: 'Boston MM',  verified: true,
    desc: 'Board-certified cardiologist at Mass General. Marathi-speaking. Accepting new NRI patients.',
    services: ['Cardiology', 'Preventive care', 'Teleconsultation', 'Second opinion'],
  },
  {
    id: 'kulkarni-re',   name: 'Kulkarni Real Estate',        owner: 'Rajesh Kulkarni',     cat: 'Real Estate',
    city: 'Edison, NJ',  rating: 4.8, reviews: 138, years: 11, tone: 'saffron', mandal: 'BMM NJ',     verified: true,
    desc: 'NJ/NY residential and commercial real estate. Specialises in first-home purchases for NRI families.',
    services: ['Home buying', 'Rentals', 'NRI property management', 'Commercial leasing'],
  },
  {
    id: 'saatvik',       name: 'Saatvik Kitchen',             owner: 'Chef Sai Karve',       cat: 'Restaurant',
    city: 'London, UK',  rating: 4.9, reviews: 320, years: 8,  tone: 'brick',   mandal: 'MML',        verified: true,
    desc: 'Authentic Maharashtrian cuisine — puran poli, sol kadhi, sabudana vada. Catering for events up to 400.',
    services: ['Dine-in', 'Event catering', 'Tiffin delivery', 'Cooking classes'],
  },
  {
    id: 'vidya-tech',    name: 'Vidya Tech Solutions',        owner: 'Ananya Deshmukh',     cat: 'IT & Tech',
    city: 'Bengaluru',   rating: 4.7, reviews: 67,  years: 9,  tone: 'gold',    mandal: 'BMM Pune',   verified: true,
    desc: 'EdTech and enterprise software. 35-person team. Marathi-medium education apps + custom SaaS builds.',
    services: ['EdTech development', 'SaaS products', 'Mobile apps', 'IT staffing'],
  },
  {
    id: 'joshi-finance', name: 'Joshi Financial Advisory',   owner: 'CA Anil Joshi',        cat: 'Finance',
    city: 'Boston, MA',  rating: 4.8, reviews: 102, years: 18, tone: 'pink',    mandal: 'Boston MM',  verified: true,
    desc: 'CPA and SEBI-registered advisor for NRIs. US tax filing, FBAR, NRE/NRO account advisory.',
    services: ['US tax filing', 'NRI investment planning', 'FBAR/FATCA compliance', 'Retirement planning'],
  },
  {
    id: 'mandal-tours',  name: 'Mandal Tours & Travel',      owner: 'Vivek Apte',           cat: 'Travel',
    city: 'Toronto',     rating: 4.6, reviews: 189, years: 12, tone: 'sand',    mandal: 'MMT',        verified: true,
    desc: 'Pilgrimage and family tour packages — Pandharpur, Nashik, Shirdi. India trips curated for NRIs.',
    services: ['Temple tours', 'Family vacations', 'Group pilgrimages', 'India visa support'],
  },
  {
    id: 'marathi-school',name: 'Marathi Shala Boston',       owner: 'Priya Gokhale',        cat: 'Education',
    city: 'Boston, MA',  rating: 4.9, reviews: 58,  years: 6,  tone: 'green',   mandal: 'Boston MM',  verified: true,
    desc: 'Weekend Marathi language school for children ages 4–14. Spoken, written, and cultural curriculum.',
    services: ['Marathi language', 'Cultural education', 'Weekend classes', 'Online sessions'],
  },
  {
    id: 'gore-realestate',name: 'Gore & Co. Properties',     owner: 'Prashant Gore',        cat: 'Real Estate',
    city: 'London, UK',  rating: 4.7, reviews: 94,  years: 15, tone: 'blue',    mandal: 'MML',        verified: false,
    desc: 'London residential lettings and property management. Marathi diaspora clients across East London.',
    services: ['Lettings', 'Property management', 'Buy-to-let advice', 'Tenant placement'],
  },
];

export const businessStats: BusinessStat[] = [
  { v: '240+', l: 'Registered businesses', s: 'across 8 categories'      },
  { v: '94%',  l: 'Mandal-verified',       s: 'community-vouched owners' },
  { v: '4.8',  l: 'Average rating',        s: 'from 2,400+ reviews'      },
  { v: '18',   l: 'Countries',             s: 'global Marathi businesses' },
];

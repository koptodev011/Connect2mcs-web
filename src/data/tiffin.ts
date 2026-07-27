import type { Tone } from '@/lib/tokens';

export interface TiffinProvider {
  id: string;
  name: string;
  city: string;
  specialty: string;
  per: string;
  perMeal: string;
  perMonth: string;
  delivery: string;
  menu: string[];
  rating: number;
  orders: number;
  mandal: string;
  tone: Tone;
  veg: boolean;
  trial: boolean;
  days: string;
  since: string;
  note: string;
}

export const tiffinProviders: TiffinProvider[] = [
  {
    id: 'sunita',   name: 'Sunita Kulkarni',  city: 'Boston, MA',  specialty: 'Pune-style home cooking',
    per: '$14/meal', perMeal: '$14', perMonth: '$280', delivery: 'Cambridge, Somerville, Allston',
    menu: ['Varan-bhaat', 'Poli-bhaji', 'Usal', 'Koshimbir'],
    rating: 4.9, orders: 1240, mandal: 'Boston MM', tone: 'saffron', veg: true,  trial: true,
    days: 'Mon–Fri', since: '2020', note: 'Homemade masalas, no MSG. Saturday meals on request.',
  },
  {
    id: 'kavita',   name: 'Kavita Deshmukh',  city: 'Edison, NJ',  specialty: 'Kolhapuri & Marathwada',
    per: '$12/meal', perMeal: '$12', perMonth: '$240', delivery: 'Edison, Iselin, Woodbridge',
    menu: ['Tambda rassa', 'Pandhra rassa', 'Bhakri + thecha', 'Sol kadhi'],
    rating: 4.8, orders: 876, mandal: 'BMM NJ', tone: 'brick', veg: false, trial: true,
    days: 'Mon–Sat', since: '2018', note: 'Famous for weekend rassa. Fiery and authentic.',
  },
  {
    id: 'meera',    name: 'Meera Joshi',      city: 'Toronto',     specialty: 'Konkan-style tiffin',
    per: 'C$15/meal', perMeal: 'C$15', perMonth: 'C$300', delivery: 'Mississauga, Brampton, Etobicoke',
    menu: ['Fish curry', 'Solkadhi', 'Ukde bhat', 'Bharli vangi'],
    rating: 4.9, orders: 2104, mandal: 'MMT', tone: 'blue', veg: false, trial: true,
    days: 'Mon–Fri', since: '2017', note: 'Coastal Konkan specialties — weekend fish thali available.',
  },
  {
    id: 'alka',     name: 'Alka Phadke',      city: 'London, UK',  specialty: 'Vidarbha-style meals',
    per: '£11/meal', perMeal: '£11', perMonth: '£220', delivery: 'Wembley, Harrow, Southall',
    menu: ['Saoji mutton', 'Puran poli', 'Patodi', 'Sabudana khichdi'],
    rating: 4.7, orders: 538, mandal: 'MML', tone: 'gold', veg: false, trial: false,
    days: 'Tue–Sat', since: '2021', note: 'Monthly subscription preferred. Weekend mutton specials.',
  },
  {
    id: 'priya',    name: 'Priya Wagh',        city: 'Pune, IN',    specialty: 'Jain + Sattvic cooking',
    per: '₹120/meal', perMeal: '₹120', perMonth: '₹2,400', delivery: 'Kothrud, Baner, Aundh, Pashan',
    menu: ['Jain thalipeeth', 'Dudhi sabji', 'Dahi poli', 'Moong usal'],
    rating: 5.0, orders: 3210, mandal: 'BMM', tone: 'green', veg: true,  trial: true,
    days: 'Mon–Sun', since: '2016', note: 'Strictly no onion, no garlic. FSSAI certified kitchen.',
  },
  {
    id: 'sangeeta', name: 'Sangeeta Apte',     city: 'Sydney',      specialty: 'Classic Maharashtrian',
    per: 'A$16/meal', perMeal: 'A$16', perMonth: 'A$320', delivery: 'Parramatta, Blacktown, Liverpool',
    menu: ['Zunka-bhakar', 'Misal pav', 'Varan-bhaat', 'Amti'],
    rating: 4.6, orders: 418, mandal: 'MMS', tone: 'pink', veg: true,  trial: true,
    days: 'Mon–Fri', since: '2022', note: 'No artificial preservatives. Pickle and papad included.',
  },
];

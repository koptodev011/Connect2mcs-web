import type { Tone } from '@/lib/tokens';
import type { SceneKind } from '@/components/Scenes';

export interface FeaturedOffer {
  id: string;
  partner: string;
  cat: string;
  title: string;
  desc: string;
  code: string;
  expires: string;
  tone: Tone;
  savings: string;
}

export interface Offer {
  id: string;
  partner: string;
  cat: string;
  title: string;
  desc: string;
  code: string;
  expires: string;
  tone: Tone;
  kind: SceneKind;
  savings: string;
  claimed: number;
  new?: boolean;
}

export const featuredOffer: FeaturedOffer = {
  id:      'desi-basket',
  partner: 'Desi Basket',
  cat:     'Grocery',
  title:   '20% off your first Indian grocery order',
  desc:    'Shop from 5,000+ Indian products — atta, dal, pickle, spices — delivered to your door in the US, UK and Canada. Exclusive to Connect2MCS members.',
  code:    'MCS20',
  expires: 'Jun 30, 2026',
  tone:    'saffron',
  savings: 'Save up to $30',
};

export const offers: Offer[] = [
  { id: 'wise',       partner: 'Wise',           cat: 'Finance',      title: 'Zero fees on your first transfer',      desc: 'Send money home fee-free. Up to $500 transfer, no fees on the first transaction.',       code: 'MCS-WISE',  expires: 'Jul 31, 2026', tone: 'green',   kind: 'job',     savings: 'Save ~$6',   claimed: 2104, new: true  },
  { id: 'swiggy',     partner: 'Swiggy Genie',   cat: 'Food & Dining',title: '₹150 off your first 3 orders',          desc: 'Get ₹150 off on your first three Swiggy orders. Valid on orders above ₹400.',            code: 'MCS150',    expires: 'Jun 30, 2026', tone: 'brick',   kind: 'food',    savings: '₹150 × 3',  claimed: 876             },
  { id: 'hdfc',       partner: 'HDFC Bank NRI',  cat: 'Finance',      title: 'Zero AMC NRI savings account',          desc: 'Open an HDFC NRI account — zero annual maintenance charge for Connect2MCS members.',     code: 'MCS-HDFC',  expires: 'Aug 15, 2026', tone: 'blue',    kind: 'job',     savings: '₹750/yr',   claimed: 412             },
  { id: 'air',        partner: 'Air India',      cat: 'Travel',       title: '8% off India round-trip fares',         desc: 'Fly home with Air India. 8% off on all routes to India booked via Connect2MCS.',          code: 'MCSFLIGHT', expires: 'Sep 01, 2026', tone: 'saffron', kind: 'event',   savings: '$80+ off',  claimed: 1248, new: true  },
  { id: 'spiceroute', partner: 'Spice Route',    cat: 'Food & Dining',title: 'Free dessert at any Spice Route',       desc: 'Complimentary mithai platter for table of 2+ at any Spice Route Marathi restaurant.',     code: 'MCSMITHAI', expires: 'Dec 31, 2026', tone: 'gold',    kind: 'food',    savings: '$12 value', claimed: 538             },
  { id: 'legalzoom',  partner: 'IndiaWills',     cat: 'Legal',        title: '30% off NRI will and estate planning',  desc: 'Draft your Indian will from abroad. Reviewed by an Indian advocate within 48 hours.',     code: 'MCSWILL',   expires: 'Jul 31, 2026', tone: 'sand',    kind: 'study',   savings: '30% off',   claimed: 86              },
  { id: 'healthians', partner: 'Healthians',     cat: 'Health',       title: 'Free health check-up for parents',      desc: 'Gift a full-body health package to your parents in India — free for one family member.',  code: 'MCSHEATH',  expires: 'Jun 30, 2026', tone: 'pink',    kind: 'people',  savings: '₹1,800',    claimed: 204,  new: true  },
  { id: 'notion',     partner: 'iGlobalConnect', cat: 'Tech',         title: '3 months premium SIM for India trips',  desc: 'Unlimited calls + 10GB data roaming SIM for your India trip. Delivered to US/UK address.', code: 'MCSSIM',    expires: 'Aug 31, 2026', tone: 'green',   kind: 'news',    savings: '$24 value', claimed: 318             },
];

import type { Tone } from '@/lib/tokens';
import type { SceneKind } from '@/components/Scenes';

export interface CalendarEvent {
  id: string;
  day: string;
  month: string;
  wk: string;
  title: string;
  where: string;
  cat: string;
  going: number;
  free?: boolean;
  price?: string;
  tone: Tone;
  image?: string;
  desc?: string;
  link?: string;
  fullDate?: string;
  country?: string;
  organizer?: string;
  value?: string;
}

export interface CalendarDay {
  d: number;
  dy: string;
  ev: number;
  today?: boolean;
}

export const events: CalendarEvent[] = [
  { id: 'poetry',  day: '07', month: 'MAY', wk: 'Wed', title: 'Marathi Poetry Evening',     where: 'Shivaji Mandir, Dadar',    cat: 'Literary',  going: 42,  free: true,    tone: 'saffron' },
  { id: 'gudhi',   day: '08', month: 'MAY', wk: 'Thu', title: 'Gudhipadwa Get-together',    where: 'Marathi Mandal, Pune',     cat: 'Festival',  going: 128, price: '₹250', tone: 'brick'   },
  { id: 'bhimsen', day: '09', month: 'MAY', wk: 'Fri', title: 'Pt. Bhimsen Joshi Tribute',  where: 'Boston Public Library',    cat: 'Music',     going: 64,  price: '$15',  tone: 'green'   },
  { id: 'book',    day: '14', month: 'MAY', wk: 'Wed', title: 'Marathi Book Exhibition',    where: 'Bharatiya Bhavan, London', cat: 'Literary',  going: 96,  free: true,    tone: 'blue'    },
  { id: 'food',    day: '17', month: 'MAY', wk: 'Sat', title: 'Marathi Food Festival',      where: 'NJ Convention Centre',     cat: 'Family',    going: 412, price: '$25',  tone: 'gold'    },
  { id: 'lavani',  day: '24', month: 'MAY', wk: 'Sat', title: 'Lavani Dance Workshop',      where: 'MMT Toronto Hall',         cat: 'Cultural',  going: 38,  price: 'C$40', tone: 'pink'    },
];

export const calendarWeek: CalendarDay[] = [
  { d: 4,  dy: 'Sun', ev: 0 },
  { d: 5,  dy: 'Mon', ev: 1 },
  { d: 6,  dy: 'Tue', ev: 0 },
  { d: 7,  dy: 'Wed', ev: 1, today: true },
  { d: 8,  dy: 'Thu', ev: 1 },
  { d: 9,  dy: 'Fri', ev: 1 },
  { d: 10, dy: 'Sat', ev: 3 },
];

export const eventKindMap: Record<string, SceneKind> = {
  Cultural:  'dance',
  Festival:  'event',
  Music:     'music',
  Literary:  'study',
  Family:    'food',
};

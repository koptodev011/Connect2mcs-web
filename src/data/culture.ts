import type { Tone } from '@/lib/tokens';

export interface PanchangEntry {
  key: string;
  value: string;
}

export interface PanchangRow {
  id: string;
  date: string;
  sunrise: string;
  sunset: string;
  tithi: string;
  nakshatra: string;
  day: string;
  devDay?: string;
  yoga?: string;
  rashi?: string;
}

export interface Arti {
  title: string;
  deity: string;
  duration: string;
  tone: Tone;
  popular: boolean;
  image?: string;
}

export interface MarathiMonth {
  name: string;
  dev: string;
  tone: Tone;
  days: number;
  current?: boolean;
  image?: string;
}

export const todayPanchang: PanchangEntry[] = [
  { key: 'Tithi',     value: 'Saptami'          },
  { key: 'Nakshatra', value: 'Mrigashira'        },
  { key: 'Yoga',      value: 'Vyaghata'          },
  { key: 'Karana',    value: 'Vanij'             },
  { key: 'Sunrise',   value: '06:08'             },
  { key: 'Sunset',    value: '19:02'             },
  { key: 'Moonrise',  value: '11:42'             },
  { key: 'Rahu Kaal', value: '10:42 – 12:18'     },
  { key: 'Abhijit',   value: '11:48 – 12:34'     },
  { key: 'Gulika',    value: '14:54 – 16:30'     },
];

export const todayPanchangTitle  = 'Vaishakh Shukla Saptami';
export const todayDevanagariDay  = '७';
export const todayDateLine       = 'Shukla Saptami · Wed 7 May 2026';

/** The 4 entries shown on the home page panchang mini-card. */
export const homePanchangRows: [string, string][] = [
  ['Sunrise',   '06:08'],
  ['Sunset',    '19:02'],
  ['Nakshatra', 'Mrigashira'],
  ['Rahu Kaal', '10:42–12:18'],
];

export const artis: Arti[] = [
  { title: 'Sukhakarta Dukhaharta',      deity: 'Ganpati', duration: '1:24', tone: 'saffron', popular: true  },
  { title: 'Lavthavti Vikrala',          deity: 'Shankar', duration: '0:58', tone: 'brick',   popular: true  },
  { title: 'Yuge Atthavis Vitevari',     deity: 'Vitthal', duration: '2:12', tone: 'gold',    popular: false },
  { title: 'Durge Durghat Bhari',        deity: 'Durga',   duration: '1:46', tone: 'pink',    popular: true  },
  { title: 'Jai Dev Jai Dev',            deity: 'Datta',   duration: '1:18', tone: 'green',   popular: false },
  { title: 'Karpur Gauram Karunavtaram', deity: 'Shankar', duration: '0:42', tone: 'blue',    popular: false },
];

export const marathiMonths: MarathiMonth[] = [
  { name: 'Chaitra',   dev: 'चैत्र',     tone: 'saffron', days: 30                },
  { name: 'Vaishakh',  dev: 'वैशाख',    tone: 'gold',    days: 31, current: true },
  { name: 'Jyeshtha',  dev: 'ज्येष्ठ',   tone: 'brick',   days: 31                },
  { name: 'Ashadh',    dev: 'आषाढ',    tone: 'green',   days: 30                },
  { name: 'Shravan',   dev: 'श्रावण',    tone: 'blue',    days: 30                },
  { name: 'Bhadrapad', dev: 'भाद्रपद',  tone: 'pink',    days: 31                },
];

/** Festival days (date numbers) highlighted in the May 2026 calendar grid. */
export const festivalDays = [4, 17, 24];

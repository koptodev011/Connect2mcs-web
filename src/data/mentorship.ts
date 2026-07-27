import type { Tone } from '@/lib/tokens';

export interface Mentor {
  name: string;
  role: string;
  years: number;
  city: string;
  mandal: string;
  topics: string[];
  slots: number;
  rate: string;
  tone: Tone;
}

export interface MentorSession {
  with: string;
  when: string;
  topic: string;
  status: 'upcoming' | 'past';
}

export interface MentorStat {
  v: string;
  l: string;
  h: string;
}

export const mentors: Mentor[] = [
  { name: 'Madhura Phadke',  role: 'Sr. UX Designer · Atlassian',    years: 12, city: 'Sydney',    mandal: 'Sydney MM',  topics: ['Design career', 'Portfolio reviews', 'IC vs Manager'],     slots: 4, rate: 'Free',   tone: 'saffron' },
  { name: 'Rohan Bhave',     role: 'Principal Engineer · Amazon',     years: 18, city: 'Seattle',   mandal: 'Seattle MM', topics: ['System design', 'Backend interviews', 'Tech leadership'],   slots: 2, rate: 'Free',   tone: 'blue'    },
  { name: 'Ananya Deshmukh', role: 'Founder · Vidya Tech',            years: 9,  city: 'Bengaluru', mandal: 'BMM Pune',   topics: ['Founder journey', 'Fundraising', 'Hiring early team'],     slots: 1, rate: '$80/hr', tone: 'brick'   },
  { name: 'Dr. Aarti Kale',  role: 'Cardiologist · Mass General',    years: 22, city: 'Boston',    mandal: 'Boston MM',  topics: ['Med school path', 'USMLE', 'Residency in US'],              slots: 3, rate: 'Free',   tone: 'green'   },
  { name: 'Mihir Apte',      role: 'Author · 4 published books',      years: 15, city: 'Mumbai',    mandal: 'Mumbai MM',  topics: ['Writing in Marathi', 'Publishing', 'Editorial'],            slots: 5, rate: 'Free',   tone: 'gold'    },
  { name: 'Snehal Joshi',    role: 'Bharatanatyam dancer & teacher',  years: 20, city: 'Toronto',   mandal: 'Toronto MM', topics: ['Classical arts', 'Teaching path', 'Performance career'],   slots: 2, rate: 'Free',   tone: 'pink'    },
];

export const mentorSessions: MentorSession[] = [
  { with: 'Rohan Bhave',    when: 'Sat 17 May · 9:30 am', topic: 'Backend system design',        status: 'upcoming' },
  { with: 'Madhura Phadke', when: 'Mon 5 May · 7:00 pm',  topic: 'Portfolio review · 30 min',   status: 'upcoming' },
  { with: 'Mihir Apte',     when: 'Tue 22 Apr · 6:00 pm', topic: 'First chapter feedback',       status: 'past'     },
];

export const mentorStats: MentorStat[] = [
  { v: '142',    l: 'Active mentors',     h: 'across 12 fields'       },
  { v: '4.9',    l: 'Average rating',     h: 'from 1,200+ sessions'   },
  { v: '30 min', l: 'Default slot',       h: 'free · book in 1 click' },
  { v: '38',     l: 'Sessions this week', h: 'community-wide'         },
];

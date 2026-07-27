import type { Tone } from '@/lib/tokens';

export interface Scholarship {
  id: string;
  title: string;
  org: string;
  amount: string;
  field: string;
  deadline: string;
  eligible: boolean;
  criteria?: string;
  tone: Tone;
}

export interface Internship {
  id: string;
  role: string;
  co: string;
  loc: string;
  stipend: string;
  dur: string;
  when: string;
  logo: string;
  tone: Tone;
}

export interface Deadline {
  title: string;
  kind: 'Scholarship' | 'Internship';
  org: string;
  date: string;
  daysLeft: number;
  amount: string;
  tone: Tone;
  eligible: boolean;
}

export interface Application {
  item: string;
  kind: 'Scholarship' | 'Internship';
  status: 'pending' | 'approved' | 'rejected';
  when: string;
}

export interface LearnStat {
  v: string;
  l: string;
  h: string;
}

export const scholarships: Scholarship[] = [
  { id: 'tilak',    title: 'BMM Lokmanya Tilak Scholarship',  org: 'Brihan Maharashtra Mandal', amount: '$3,000',    field: 'Engineering · Sciences', deadline: 'Jun 30, 2026', eligible: true,  tone: 'saffron' },
  { id: 'pmet',     title: 'Pune Marathi Education Trust',    org: 'PMET',                      amount: '₹1,00,000', field: 'Any UG / PG',            deadline: 'Jul 15, 2026', eligible: true,  tone: 'brick'   },
  { id: 'heritage', title: 'Marathi Heritage Arts Grant',     org: 'Maharashtra Mandal London', amount: '£2,500',    field: 'Performing arts',        deadline: 'Aug 10, 2026', eligible: true,  tone: 'gold'    },
  { id: 'nri-nj',   title: 'NRI Maharashtra Scholar Award',  org: 'BMM New Jersey',            amount: '$5,000',    field: 'STEM · Marathi origin',  deadline: 'Sep 01, 2026', eligible: false, tone: 'blue'    },
];

export const internships: Internship[] = [
  { id: 'razorpay', role: 'Product Design Intern',    co: 'Razorpay',    loc: 'Bengaluru · Hybrid', stipend: '₹50K/mo',   dur: '6 months', when: 'Summer 2026', logo: 'R', tone: 'blue'    },
  { id: 'sakal',    role: 'Marathi Editorial Intern', co: 'Sakal Media', loc: 'Pune · On-site',     stipend: '₹35K/mo',   dur: '3 months', when: 'Summer 2026', logo: 'S', tone: 'brick'   },
  { id: 'c2mcs',    role: 'Community Ops Intern',     co: 'Connect2MCS', loc: 'Remote',             stipend: '$1,200/mo', dur: '4 months', when: 'Fall 2026',   logo: 'C', tone: 'saffron' },
  { id: 'tata1mg',  role: 'Data Science Intern',      co: 'Tata 1mg',    loc: 'Gurgaon · Hybrid',   stipend: '₹60K/mo',   dur: '6 months', when: 'Summer 2026', logo: 'T', tone: 'green'   },
];

export const deadlines: Deadline[] = [
  { title: 'BMM Lokmanya Tilak Scholarship',   kind: 'Scholarship', org: 'Brihan Maharashtra Mandal', date: 'Jun 30, 2026', daysLeft: 23, amount: '$3,000',    tone: 'saffron', eligible: true  },
  { title: 'Connect2MCS Community Ops Intern', kind: 'Internship',  org: 'Connect2MCS',              date: 'Jul 10, 2026', daysLeft: 33, amount: '$1,200/mo', tone: 'blue',    eligible: true  },
  { title: 'Pune Marathi Education Trust',     kind: 'Scholarship', org: 'PMET',                     date: 'Jul 15, 2026', daysLeft: 38, amount: '₹1,00,000', tone: 'brick',   eligible: true  },
  { title: 'Data Science Intern — Tata 1mg',  kind: 'Internship',  org: 'Tata 1mg',                  date: 'Aug 01, 2026', daysLeft: 55, amount: '₹60K/mo',   tone: 'green',   eligible: true  },
  { title: 'Marathi Heritage Arts Grant',      kind: 'Scholarship', org: 'Maharashtra Mandal London', date: 'Aug 10, 2026', daysLeft: 64, amount: '£2,500',    tone: 'gold',    eligible: true  },
  { title: 'NRI Maharashtra Scholar Award',   kind: 'Scholarship', org: 'BMM New Jersey',            date: 'Sep 01, 2026', daysLeft: 86, amount: '$5,000',     tone: 'blue',    eligible: false },
];

export const myApplications: Application[] = [
  { item: 'Pune Marathi Education Trust', kind: 'Scholarship', status: 'pending',  when: 'Submitted 5 Apr' },
  { item: 'Razorpay · Product Design',   kind: 'Internship',  status: 'approved', when: 'Offer 28 Apr'    },
  { item: 'BMM Lokmanya Tilak',          kind: 'Scholarship', status: 'rejected', when: 'Decision 12 Apr' },
];

export const learnStats: LearnStat[] = [
  { v: '24',    l: 'Open scholarships', h: '$120K total pool'      },
  { v: '38',    l: 'Open internships',  h: '12 paid · 26 stipend'  },
  { v: '4',     l: 'Your applications', h: '1 pending'             },
  { v: '$8.4K', l: 'Avg. award',        h: 'across last cycle'     },
];

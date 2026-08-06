import type { Tone } from '@/lib/tokens';

export type JobCat = 'Tech' | 'Design' | 'Editorial' | 'Operations' | 'Volunteer';

export interface Job {
  id: string;
  role: string;
  co: string;
  loc: string;
  pay: string;
  type: string;
  exp: string;
  posted: string;
  tag?: string;
  applicants: number;
  logo: string;
  tone: Tone;
  cat: JobCat;
  desc?: string;
  detail?: string;
  education?: string;
  additionalEdu?: string;
  applyUrl?: string;
  featured?: boolean;
}

export const jobs: Job[] = [
  { id: 'persistent', role: 'Senior Product Designer', co: 'Persistent Systems',    loc: 'Pune · Hybrid',      pay: '₹28–42 L',   type: 'Full-time', exp: '5–8y',  posted: '2d ago', tag: 'Hot',   applicants: 84,  logo: 'P', tone: 'saffron', cat: 'Design'    },
  { id: 'razorpay',   role: 'Senior Frontend Engineer', co: 'Razorpay',              loc: 'Bengaluru · Remote', pay: '₹32–48 L',   type: 'Full-time', exp: '4–7y',  posted: '4h ago', tag: 'New',   applicants: 142, logo: 'R', tone: 'blue',    cat: 'Tech'      },
  { id: 'sakal',      role: 'Marathi Content Editor',   co: 'Sakal Media Group',     loc: 'Mumbai · On-site',   pay: '₹8–12 L',    type: 'Full-time', exp: '3–5y',  posted: '1w ago',               applicants: 47,  logo: 'S', tone: 'brick',   cat: 'Editorial' },
  { id: 'tata1mg',    role: 'Lead Data Scientist',      co: 'Tata 1mg',              loc: 'Gurgaon · Hybrid',   pay: '₹38–55 L',   type: 'Full-time', exp: '7+y',   posted: '3d ago', tag: 'Match', applicants: 26,  logo: 'T', tone: 'green',   cat: 'Tech'      },
  { id: 'bmm-ops',    role: 'Operations Coordinator',   co: 'Boston Marathi Mandal', loc: 'Boston · Volunteer', pay: 'Honorary',   type: 'Volunteer', exp: 'Open',  posted: '5d ago',               applicants: 12,  logo: 'B', tone: 'gold',    cat: 'Volunteer' },
  { id: 'atlassian',  role: 'UX Researcher',            co: 'Atlassian',             loc: 'Sydney · Hybrid',    pay: 'A$120–160K', type: 'Full-time', exp: '4–6y',  posted: '6h ago', tag: 'New',   applicants: 38,  logo: 'A', tone: 'pink',    cat: 'Design'    },
];

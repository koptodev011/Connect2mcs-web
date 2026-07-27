import type { Tone } from '@/lib/tokens';

export interface NewsStory {
  id: string;
  cat: string;
  tone: Tone;
  title: string;
  excerpt: string;
  when: string;
  read: string;
  author?: string;
  featured?: boolean;
}

export const newsStories: NewsStory[] = [
  {
    id: 'bmm-54',
    cat: 'Community',
    tone: 'saffron',
    title: 'Boston Marathi Mandal turns 54 — community gathers for celebration weekend',
    excerpt: 'Three days of gudi-padwa events, a sahitya panel, and a record turnout of 2,400 members from across New England gather for the milestone weekend.',
    when: '2h ago',
    read: '6 min read',
    author: 'Anuja Karandikar',
    featured: true,
  },
  {
    id: 'sahitya-2026',
    cat: 'Culture',
    tone: 'brick',
    title: 'Marathi Sahitya Sammelan 2026 dates announced — Pune in November',
    excerpt: 'The 96th edition will host 38 sessions across literature, theatre and Marathi cinema.',
    when: '4h ago',
    read: '3 min',
  },
  {
    id: 'scholarships-2026',
    cat: 'Education',
    tone: 'gold',
    title: 'BMM scholarships open: $200K pool across 24 awards this cycle',
    excerpt: 'Applications close June 30. Eligibility extended to children of first-generation immigrants.',
    when: '1d ago',
    read: '4 min',
  },
  {
    id: 'cookbook',
    cat: 'Cuisine',
    tone: 'green',
    title: '"Aai-cha Swayampaak" cookbook launches, all proceeds to community kitchen',
    excerpt: 'A 240-recipe ode to home kitchens of Pune, Sangli, and Boston, edited by 38 community contributors.',
    when: '2d ago',
    read: '5 min',
  },
  {
    id: 'bhimsen-tour',
    cat: 'Arts',
    tone: 'blue',
    title: 'Pt. Bhimsen Joshi tribute concert tour reaches Boston, NYC, Toronto',
    excerpt: 'A young vocalist from Pune leads the 9-city diaspora tour. Tickets free for community members.',
    when: '3d ago',
    read: '4 min',
  },
  {
    id: 'sydney-school',
    cat: 'Diaspora',
    tone: 'pink',
    title: 'Sydney Marathi Mandal launches first Marathi Saturday school in NSW',
    excerpt: 'Weekend programme covers language, history, and folk arts for kids 5–14.',
    when: '4d ago',
    read: '3 min',
  },
  {
    id: 'cricket-cup',
    cat: 'Sports',
    tone: 'sand',
    title: 'Inter-Mandal cricket cup expands to 12 teams across North America',
    excerpt: 'Finals to be hosted at BMM-NJ in August. Sign-ups open through your Mandal lead.',
    when: '6d ago',
    read: '2 min',
  },
];

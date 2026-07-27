import type { IconName } from '@/components/Icon';

export interface HelpTopic {
  id?: string;
  icon: IconName;
  title: string;
  desc: string;
  count: number;
}

export interface FAQ {
  id?: string;
  q: string;
  a: string;
}

export const topics: HelpTopic[] = [
  { icon: 'map',    title: 'Finding your Mandal',       desc: 'Search by city or country, save favourites, and contact committee members.',   count: 8  },
  { icon: 'cal',    title: 'Events & RSVPs',             desc: 'How to RSVP, host events, and add them to your calendar.',                     count: 6  },
  { icon: 'work',   title: 'Jobs & resume builder',      desc: 'Apply through Connect2MCS, build your resume, and find referrals.',            count: 9  },
  { icon: 'people', title: 'Connections & chat',         desc: 'Send connection requests, manage messages, and report misuse.',                count: 7  },
  { icon: 'home2',  title: 'Shared accommodation',       desc: 'Post a listing, find a place to stay, or post a requirement.',                 count: 5  },
  { icon: 'grad',   title: 'Scholarships & internships', desc: 'Eligibility, applying, and tracking your application status.',                 count: 6  },
  { icon: 'spark',  title: 'Mentorship sessions',        desc: 'Booking sessions, becoming a mentor, and code of conduct.',                    count: 4  },
  { icon: 'lamp',   title: 'Culture: Panchang & Arti',   desc: 'Reading the Marathi calendar and using the Arti collection.',                  count: 3  },
  { icon: 'user',   title: 'Account & privacy',          desc: 'Profile, language preference, deleting your account, data exports.',           count: 11 },
];

export const faqs: FAQ[] = [
  {
    q: 'I can’t find my Mandal in the directory — what now?',
    a: 'Use the "Add Mandal" button on the Mandals page. A community moderator typically verifies new entries within 48 hours. You’ll be notified by email once it’s live.',
  },
  {
    q: 'How does the platform decide if I’m an NRI or Indian Resident?',
    a: 'It’s self-declared during signup, based on your current city. You can switch in Profile › Edit if you relocate, and your feed personalises accordingly.',
  },
  {
    q: 'Are scholarship applications binding?',
    a: 'No. Submitting an application sends your profile to the awarding Mandal/organisation. They’ll reach out for next steps. You can withdraw any time before the decision.',
  },
  {
    q: 'Can I post a job for free?',
    a: 'Yes — community job posts are free for verified members. B2B partner postings have a separate flow with optional promoted placement.',
  },
  {
    q: 'How is my chat data protected?',
    a: 'One-on-one messages are end-to-end encrypted. We never read your messages. Group chat has standard transport encryption with admin moderation.',
  },
  {
    q: 'What does the green “Verified” badge mean?',
    a: 'It means a Mandal committee member has vouched for the profile. Roughly 94% of active members are verified through their home Mandal.',
  },
];

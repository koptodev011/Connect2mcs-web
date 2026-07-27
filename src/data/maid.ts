export type Arrangement = 'Live-in' | 'Full-time' | 'Part-time';

export interface HelperReview {
  name: string;
  rating: number;
  text: string;
  when: string;
}

export interface Helper {
  id: string;
  name: string;
  city: string;
  area: string;
  services: string[];
  arrangement: Arrangement;
  ratePerMonth: string;
  rateNum: number;
  hoursPerDay: string;
  daysPerWeek: string;
  rating: number;
  jobs: number;
  expYears: number;
  langs: string[];
  verified: boolean;
  policeVerified: boolean;
  available: boolean;
  skills: string[];
  about: string;
  workHours: string;
  workDays: string;
  startDate: string;
  reviews: HelperReview[];
  tone: string;
}

export const helpers: Helper[] = [
  {
    id: 'rekha-joshi',
    name: 'Rekha Joshi',
    city: 'Mumbai',
    area: 'Thane West',
    services: ['Cooking', 'House Cleaning', 'Live-in'],
    arrangement: 'Live-in',
    ratePerMonth: '₹9,500/mo',
    rateNum: 9500,
    hoursPerDay: '8 hrs/day',
    daysPerWeek: '6 days/week',
    rating: 4.9,
    jobs: 56,
    expYears: 6,
    langs: ['Marathi', 'Hindi', 'English'],
    verified: true,
    policeVerified: true,
    available: true,
    skills: ['House Cleaning', 'Indoor & Outdoor', 'Marathi Cooking', 'North Indian', 'Dishwashing', 'Laundry & Ironing'],
    about: 'Experienced live-in helper with 6 years working with Marathi families. Specialises in authentic Maharashtrian cooking and thorough house cleaning. Honest, punctual, and great with children and elders. References available.',
    workHours: '7:00 AM – 7:00 PM',
    workDays: 'Mon – Sat',
    startDate: 'Available Immediately',
    reviews: [
      { name: 'Priya Kulkarni',  rating: 5, text: 'Rekha has been with us for 2 years. Punctual, honest, and an excellent cook. Highly recommended!', when: 'May 2025' },
      { name: 'Amit Deshmukh',   rating: 5, text: 'Very reliable and trustworthy. Keeps the house spotless. Great with our elderly parents too.', when: 'Apr 2025'  },
      { name: 'Sunita Patil',    rating: 4, text: 'Good cook, especially Maharashtrian food. Very caring with kids.', when: 'Feb 2025' },
    ],
    tone: 'saffron',
  },
  {
    id: 'sunita-pawar',
    name: 'Sunita Pawar',
    city: 'Mumbai',
    area: 'Andheri',
    services: ['Cooking', 'Cleaning'],
    arrangement: 'Full-time',
    ratePerMonth: '₹8,000/mo',
    rateNum: 8000,
    hoursPerDay: '8 hrs/day',
    daysPerWeek: '5 days/week',
    rating: 4.9,
    jobs: 48,
    expYears: 8,
    langs: ['Marathi', 'Hindi'],
    verified: true,
    policeVerified: false,
    available: true,
    skills: ['Marathi Cooking', 'House Cleaning', 'Dishwashing', 'Mopping & Sweeping'],
    about: 'Experienced full-time helper with 8 years in Marathi households. Expert in traditional Maharashtrian dishes. Reliable and hardworking with excellent references.',
    workHours: '8:00 AM – 5:00 PM',
    workDays: 'Mon – Fri',
    startDate: 'Available from 1 Aug',
    reviews: [
      { name: 'Meera Gokhale', rating: 5, text: 'Sunita\'s cooking is just like home. Puran poli, varan bhaat — all perfect.', when: 'Jun 2025' },
      { name: 'Raj Joshi',     rating: 5, text: 'Very disciplined and hardworking. Would rehire anytime.', when: 'Mar 2025' },
    ],
    tone: 'brick',
  },
  {
    id: 'anita-more',
    name: 'Anita More',
    city: 'Mumbai',
    area: 'Dadar',
    services: ['Elder Care', 'Live-in'],
    arrangement: 'Live-in',
    ratePerMonth: '₹15,000/mo',
    rateNum: 15000,
    hoursPerDay: '12 hrs/day',
    daysPerWeek: '7 days/week',
    rating: 4.6,
    jobs: 18,
    expYears: 5,
    langs: ['Marathi', 'Hindi'],
    verified: true,
    policeVerified: true,
    available: true,
    skills: ['Elder Care', 'Medication Management', 'Physiotherapy Assistance', 'Companionship', 'Light Cooking'],
    about: 'Specialised in elder care with 5 years of experience. Has worked with bedridden patients and seniors with mobility issues. Certified in basic first aid. Patient and compassionate.',
    workHours: '24/7 Live-in',
    workDays: 'All 7 days',
    startDate: 'Available from 15 Jul',
    reviews: [
      { name: 'Kavita Shah', rating: 5, text: 'Anita cared for my mother-in-law with so much patience. We couldn\'t have managed without her.', when: 'May 2025' },
      { name: 'Sunil More',  rating: 4, text: 'Very attentive and responsible. Always on time with medicines.', when: 'Jan 2025' },
    ],
    tone: 'green',
  },
  {
    id: 'meena-shinde',
    name: 'Meena Shinde',
    city: 'Mumbai',
    area: 'Powai',
    services: ['House Cleaning'],
    arrangement: 'Part-time',
    ratePerMonth: '₹6,000/mo',
    rateNum: 6000,
    hoursPerDay: '4 hrs/day',
    daysPerWeek: '6 days/week',
    rating: 4.7,
    jobs: 24,
    expYears: 4,
    langs: ['Marathi', 'Hindi'],
    verified: true,
    policeVerified: false,
    available: true,
    skills: ['Deep Cleaning', 'Mopping & Sweeping', 'Dishwashing', 'Bathroom Cleaning', 'Window Cleaning'],
    about: 'Part-time cleaning specialist with 4 years of experience in residential and office spaces. Thorough, quick, and uses eco-friendly products only on request.',
    workHours: '7:00 AM – 11:00 AM',
    workDays: 'Mon – Sat',
    startDate: 'Available Immediately',
    reviews: [
      { name: 'Pooja Desai',   rating: 5, text: 'Meena leaves the house spotless. Very particular about corners and bathrooms.', when: 'Jun 2025' },
      { name: 'Ravi Kulkarni', rating: 4, text: 'Reliable and prompt. Good value for money.', when: 'Apr 2025' },
    ],
    tone: 'blue',
  },
  {
    id: 'sushma-patil',
    name: 'Sushma Patil',
    city: 'Mumbai',
    area: 'Vashi, Navi Mumbai',
    services: ['Childcare', 'Laundry'],
    arrangement: 'Part-time',
    ratePerMonth: '₹10,000/mo',
    rateNum: 10000,
    hoursPerDay: '6 hrs/day',
    daysPerWeek: '6 days/week',
    rating: 4.8,
    jobs: 41,
    expYears: 7,
    langs: ['Marathi', 'Hindi'],
    verified: true,
    policeVerified: true,
    available: false,
    skills: ['Childcare', 'Infant Care', 'Activity Planning', 'Laundry', 'Ironing', 'School Drop Pickup'],
    about: 'Experienced nanny and childcare specialist. Has worked with infants from 3 months and toddlers up to age 10. Loves teaching Marathi nursery rhymes and stories. Background in early childhood education.',
    workHours: '9:00 AM – 3:00 PM',
    workDays: 'Mon – Sat',
    startDate: 'Available from 1 Sep',
    reviews: [
      { name: 'Neha Joshi',   rating: 5, text: 'My daughter loves Sushma auntie. She\'s patient, creative and always on time.', when: 'May 2025' },
      { name: 'Vikram Apte',  rating: 5, text: 'Very caring and professional. Our baby was safe and happy with her.', when: 'Mar 2025' },
    ],
    tone: 'gold',
  },
  {
    id: 'lakshmi-bai',
    name: 'Lakshmi Bai',
    city: 'Mumbai',
    area: 'Bandra',
    services: ['Childcare', 'Cooking'],
    arrangement: 'Full-time',
    ratePerMonth: '₹12,000/mo',
    rateNum: 12000,
    hoursPerDay: '8 hrs/day',
    daysPerWeek: '6 days/week',
    rating: 4.8,
    jobs: 32,
    expYears: 6,
    langs: ['Marathi', 'Hindi', 'Kannada'],
    verified: true,
    policeVerified: false,
    available: true,
    skills: ['Childcare', 'South Indian Cooking', 'Marathi Cooking', 'Dishwashing', 'Laundry'],
    about: 'Versatile helper with 6 years experience in cooking and childcare. Fluent in Marathi and comfortable in Marathi households. Known for clean kitchen habits and patient child supervision.',
    workHours: '8:00 AM – 5:00 PM',
    workDays: 'Mon – Sat',
    startDate: 'Available Immediately',
    reviews: [
      { name: 'Smita Barve', rating: 5, text: 'Lakshmi manages the kitchen and kids effortlessly. Very versatile.', when: 'Jun 2025' },
      { name: 'Anup Rao',    rating: 4, text: 'Trustworthy and energetic. Kids adore her.', when: 'Apr 2025' },
    ],
    tone: 'pink',
  },
];

export const helperStats = [
  { v: '240+', l: 'Verified helpers',      s: 'across Mumbai & NRI cities' },
  { v: '4.8',  l: 'Average rating',        s: 'from 2,400+ bookings'       },
  { v: '94%',  l: 'Police verified',       s: 'background checked'         },
  { v: '48h',  l: 'Avg. response time',    s: 'to your booking request'    },
];

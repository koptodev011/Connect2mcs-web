import { EducationLevel, Stream, Specialization, WorkingProfessionalCareerPath } from '@/types/career-simulator';

export const INTERESTS_OPTIONS = [
  'Technology', 'Business', 'Finance', 'Creativity', 'Social Work',
  'Science', 'Sales', 'Operations', 'People Management', 'Marketing',
  'Healthcare', 'Education', 'Law', 'Design', 'Engineering'
];

export const getAvailableStreams = (educationLevel: EducationLevel | undefined): Stream[] => {
  if (!educationLevel) {
    return Object.values(Stream);
  }

  const eduLevelStr = String(educationLevel);

  if (eduLevelStr.includes('10th (SSC')) {
    return ['11th-12th', 'Diploma', 'ITI'] as Stream[];
  }
  if (eduLevelStr.includes('12th (HSC')) {
    return ['12th-Science-PCM', '12th-Science-PCB', '12th-Commerce', '12th-Arts'] as Stream[];
  }
  if (eduLevelStr.includes('Diploma (Polytechnic/ITI)')) {
    return ['Diploma', 'Engineering', 'Medical', 'Other'] as Stream[];
  }
  if (eduLevelStr.includes('Undergraduate')) {
    return ['Science', 'Commerce', 'Arts', 'Engineering', 'Medical', 'Diploma', 'Other'] as Stream[];
  }
  if (eduLevelStr.includes('Postgraduate') || eduLevelStr.includes('PhD') || eduLevelStr.includes('Doctorate') || eduLevelStr.includes('Working Professional') || eduLevelStr === 'Other') {
    return Object.values(Stream);
  }
  return Object.values(Stream);
};

export const getWorkingProfessionalOptions = (): { category: string; options: WorkingProfessionalCareerPath[] }[] => {
  return [
    {
      category: 'Career Growth',
      options: ['Senior Role', 'Team Lead', 'Manager', 'Architect', 'Consultant'] as WorkingProfessionalCareerPath[]
    },
    {
      category: 'Higher Studies',
      options: ['MBA', 'Executive MBA', 'M.Tech', 'MCA', 'Distance PG'] as WorkingProfessionalCareerPath[]
    },
    {
      category: 'Skill Upgrade - IT',
      options: ['Cloud', 'DevOps', 'AI/ML', 'Cyber Security'] as WorkingProfessionalCareerPath[]
    },
    {
      category: 'Skill Upgrade - Finance',
      options: ['CFA', 'CPA'] as WorkingProfessionalCareerPath[]
    },
    {
      category: 'Skill Upgrade - Management',
      options: ['PMP', 'Agile'] as WorkingProfessionalCareerPath[]
    },
    {
      category: 'Career Switch',
      options: ['IT to Data Science', 'Core to IT', 'Private to Government', 'Job to Startup'] as WorkingProfessionalCareerPath[]
    },
    {
      category: 'Government Exams',
      options: ['UPSC', 'MPSC', 'SSC', 'Banking'] as WorkingProfessionalCareerPath[]
    },
    {
      category: 'Entrepreneurship',
      options: ['Startup', 'Freelancing', 'Consulting', 'Agriculture Business'] as WorkingProfessionalCareerPath[]
    }
  ];
};

export const getSpecializationOptions = (stream: Stream | undefined): { category: string; options: Specialization[] }[] => {
  if (!stream) return [];

  if (stream === 'Diploma') return [{ category: 'Diploma Specialization', options: ['Mechanical', 'Civil', 'Computer', 'Electrical'] as Specialization[] }];
  if (stream === 'ITI') return [{ category: 'ITI Trade', options: ['Electrician', 'Fitter', 'Welder', 'COPA'] as Specialization[] }];
  
  if (stream === '12th-Science-PCM') {
    return [
      { category: 'Engineering', options: ['Computer Engineering', 'Mechanical Engineering', 'Civil Engineering', 'AI & DS'] as Specialization[] },
      { category: 'BSc', options: ['Physics', 'Chemistry', 'Mathematics'] as Specialization[] },
      { category: 'Architecture', options: ['Architecture'] as Specialization[] }
    ];
  }
  if (stream === '12th-Science-PCB') {
    return [
      { category: 'Medical', options: ['MBBS', 'BDS', 'BAMS'] as Specialization[] },
      { category: 'Pharmacy', options: ['B.Pharm', 'D.Pharm'] as Specialization[] },
      { category: 'BSc', options: ['Biotech', 'Microbiology'] as Specialization[] }
    ];
  }
  if (stream === '12th-Commerce') {
    return [
      { category: 'Degree', options: ['B.Com', 'BBA', 'BMS'] as Specialization[] },
      { category: 'Professional', options: ['CA', 'CS', 'CMA'] as Specialization[] }
    ];
  }
  if (stream === '12th-Arts') {
    return [
      { category: 'Degree', options: ['BA', 'Journalism', 'Psychology'] as Specialization[] },
      { category: 'Law', options: ['LLB 5 Years'] as Specialization[] }
    ];
  }

  return [];
};

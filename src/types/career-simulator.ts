/**
 * TypeScript types for Career Simulator
 */

export const EducationLevel = {
  "10th (SSC - Secondary School Certificate)": "10th (SSC - Secondary School Certificate)" as const,
  "12th (HSC - Higher Secondary Certificate)": "12th (HSC - Higher Secondary Certificate)" as const,
  "Diploma (Polytechnic/ITI)": "Diploma (Polytechnic/ITI)" as const,
  "Undergraduate (Bachelors - B.A./B.Sc./B.Com./B.Tech/B.E.)": "Undergraduate (Bachelors - B.A./B.Sc./B.Com./B.Tech/B.E.)" as const,
  "Postgraduate (Masters - M.A./M.Sc./M.Com./M.Tech/M.E.)": "Postgraduate (Masters - M.A./M.Sc./M.Com./M.Tech/M.E.)" as const,
  "PhD/Doctorate": "PhD/Doctorate" as const,
  "Working Professional": "Working Professional" as const,
  "Other": "Other" as const,
} as const;

export type EducationLevel = typeof EducationLevel[keyof typeof EducationLevel];

export const Stream = {
  "Science": "Science" as const,
  "Commerce": "Commerce" as const,
  "Arts": "Arts" as const,
  "Diploma": "Diploma" as const,
  "Engineering": "Engineering" as const,
  "Medical": "Medical" as const,
  "Other": "Other" as const,
  // 10th options
  "11th-12th": "11th-12th" as const,
  "ITI": "ITI" as const,
  // 12th Science options
  "12th-Science-PCM": "12th-Science-PCM" as const,
  "12th-Science-PCB": "12th-Science-PCB" as const,
  // 12th Commerce options
  "12th-Commerce": "12th-Commerce" as const,
  // 12th Arts options
  "12th-Arts": "12th-Arts" as const,
} as const;

export type Stream = typeof Stream[keyof typeof Stream];

// Specialization/Sub-stream options
export const Specialization = {
  // After 10th - Diploma
  "Mechanical": "Mechanical" as const,
  "Civil": "Civil" as const,
  "Computer": "Computer" as const,
  "Electrical": "Electrical" as const,
  // After 10th - ITI
  "Electrician": "Electrician" as const,
  "Fitter": "Fitter" as const,
  "Welder": "Welder" as const,
  "COPA": "COPA" as const,
  // After 12th-Science-PCM - Engineering
  "Computer Engineering": "Computer Engineering" as const,
  "Mechanical Engineering": "Mechanical Engineering" as const,
  "Civil Engineering": "Civil Engineering" as const,
  "AI & DS": "AI & DS" as const,
  // After 12th-Science-PCM - BSc
  "Physics": "Physics" as const,
  "Chemistry": "Chemistry" as const,
  "Mathematics": "Mathematics" as const,
  // After 12th-Science-PCM - Architecture
  "Architecture": "Architecture" as const,
  // After 12th-Science-PCB - Medical
  "MBBS": "MBBS" as const,
  "BDS": "BDS" as const,
  "BAMS": "BAMS" as const,
  // After 12th-Science-PCB - Pharmacy
  "B.Pharm": "B.Pharm" as const,
  "D.Pharm": "D.Pharm" as const,
  // After 12th-Science-PCB - BSc
  "Biotech": "Biotech" as const,
  "Microbiology": "Microbiology" as const,
  // After 12th-Commerce - Degree
  "B.Com": "B.Com" as const,
  "BBA": "BBA" as const,
  "BMS": "BMS" as const,
  // After 12th-Commerce - Professional
  "CA": "CA" as const,
  "CS": "CS" as const,
  "CMA": "CMA" as const,
  // After 12th-Arts - Degree
  "BA": "BA" as const,
  "Journalism": "Journalism" as const,
  "Psychology": "Psychology" as const,
  // After 12th-Arts - Law
  "LLB 5 Years": "LLB 5 Years" as const,
} as const;

export type Specialization = typeof Specialization[keyof typeof Specialization];

export const Location = {
  "Village / Rural area": "Village / Rural area" as const,
  "Small town / Semi-urban": "Small town / Semi-urban" as const,
  "City / Urban area": "City / Urban area" as const,
  "Abroad / International exposure": "Abroad / International exposure" as const,
} as const;

export type Location = typeof Location[keyof typeof Location];

export const CareerDirection = {
  "Job": "Job" as const,
  "Business": "Business" as const,
  "Research": "Research" as const,
  "Gov Service": "Gov Service" as const,
  "Undecided / Exploring": "Undecided / Exploring" as const,
} as const;

export type CareerDirection = typeof CareerDirection[keyof typeof CareerDirection];

export const SettlementPreference = {
  "Same city/state": "Same city/state" as const,
  "Metro city in India": "Metro city in India" as const,
  "Abroad": "Abroad" as const,
  "Open to opportunities anywhere": "Open to opportunities anywhere" as const,
} as const;

export type SettlementPreference = typeof SettlementPreference[keyof typeof SettlementPreference];

export const MarriageAge = {
  "Before 25": "Before 25" as const,
  "25-30": "25-30" as const,
  "30-35": "30-35" as const,
  "Not sure / Flexible": "Not sure / Flexible" as const,
} as const;

export type MarriageAge = typeof MarriageAge[keyof typeof MarriageAge];

export const FamilyImportance = {
  "Very important (location, spouse career, children)": "Very important (location, spouse career, children)" as const,
  "Moderately important": "Moderately important" as const,
  "Not a priority right now": "Not a priority right now" as const,
} as const;

export type FamilyImportance = typeof FamilyImportance[keyof typeof FamilyImportance];

export const SpouseCareerPreference = {
  "Working": "Working" as const,
  "Non Working": "Non Working" as const,
} as const;

export type SpouseCareerPreference = typeof SpouseCareerPreference[keyof typeof SpouseCareerPreference];

export const ExpectedKids = {
  "1": "1" as const,
  "2": "2" as const,
  "3": "3" as const,
  "4": "4" as const,
  "More": "More" as const,
} as const;

export type ExpectedKids = typeof ExpectedKids[keyof typeof ExpectedKids];

export const FatherProfession = {
  "Job": "Job" as const,
  "Farmer": "Farmer" as const,
  "Small Business": "Small Business" as const,
  "Gov Servant": "Gov Servant" as const,
  "Mod Business": "Mod Business" as const,
} as const;

export type FatherProfession = typeof FatherProfession[keyof typeof FatherProfession];

export const FinancialBackground = {
  "Upper-middle / high stability (able to support career/business risk)": "Upper-middle / high stability (able to support career/business risk)" as const,
  "Middle income (moderate support available)": "Middle income (moderate support available)" as const,
  "Lower income (limited support; career choice may need early income)": "Lower income (limited support; career choice may need early income)" as const,
  "Prefer not to disclose": "Prefer not to disclose" as const,
} as const;

export type FinancialBackground = typeof FinancialBackground[keyof typeof FinancialBackground];

export const RiskTolerance = {
  "Low (stable salary/job only)": "Low (stable salary/job only)" as const,
  "Moderate (business, startups, or high-growth roles)": "Moderate (business, startups, or high-growth roles)" as const,
  "High (entrepreneurship, overseas education, high-risk jobs)": "High (entrepreneurship, overseas education, high-risk jobs)" as const,
} as const;

export type RiskTolerance = typeof RiskTolerance[keyof typeof RiskTolerance];

export const ShortTermGoals = {
  "Achieve basic financial stability": "Achieve basic financial stability" as const,
  "Buy a house / settle in preferred city": "Buy a house / settle in preferred city" as const,
} as const;

export type ShortTermGoals = typeof ShortTermGoals[keyof typeof ShortTermGoals];

export const LongTermGoals = {
  "Comfortable upper-middle lifestyle": "Comfortable upper-middle lifestyle" as const,
  "High wealth creation / entrepreneurship": "High wealth creation / entrepreneurship" as const,
  "Children's education fund": "Children's education fund" as const,
  "Early retirement / financial independence": "Early retirement / financial independence" as const,
} as const;

export type LongTermGoals = typeof LongTermGoals[keyof typeof LongTermGoals];

export const HigherEducationPreference = {
  "Yes (India)": "Yes (India)" as const,
  "Yes (Abroad)": "Yes (Abroad)" as const,
  "Only if required": "Only if required" as const,
  "No, prefer skill-based growth": "No, prefer skill-based growth" as const,
} as const;

export type HigherEducationPreference = typeof HigherEducationPreference[keyof typeof HigherEducationPreference];

export const CareerOutcome = {
  "Salary growth": "Salary growth" as const,
  "Job stability": "Job stability" as const,
  "Work-life balance": "Work-life balance" as const,
  "Social impact": "Social impact" as const,
  "Career flexibility (multiple options later)": "Career flexibility (multiple options later)" as const,
} as const;

export type CareerOutcome = typeof CareerOutcome[keyof typeof CareerOutcome];

export const PreferredCareerDomain = {
  "Sales and Marketing": "Sales and Marketing" as const,
  "Research and Development": "Research and Development" as const,
  "Operations": "Operations" as const,
  "HR (Human Resources)": "HR (Human Resources)" as const,
  "Finance": "Finance" as const,
  "Clinical Lab": "Clinical Lab" as const,
  "Pharmacist": "Pharmacist" as const,
  "IT/Software Development": "IT/Software Development" as const,
  "Healthcare/Medical": "Healthcare/Medical" as const,
  "Education/Teaching": "Education/Teaching" as const,
  "Legal": "Legal" as const,
  "Design/Creative": "Design/Creative" as const,
  "Other": "Other" as const,
} as const;

export type PreferredCareerDomain = typeof PreferredCareerDomain[keyof typeof PreferredCareerDomain];

// Working Professional Career Paths
export const WorkingProfessionalCareerPath = {
  // Career Growth
  "Senior Role": "Senior Role" as const,
  "Team Lead": "Team Lead" as const,
  "Manager": "Manager" as const,
  "Architect": "Architect" as const,
  "Consultant": "Consultant" as const,
  // Higher Studies
  "MBA": "MBA" as const,
  "Executive MBA": "Executive MBA" as const,
  "M.Tech": "M.Tech" as const,
  "MCA": "MCA" as const,
  "Distance PG": "Distance PG" as const,
  // Skill Upgrade - IT
  "Cloud": "Cloud" as const,
  "DevOps": "DevOps" as const,
  "AI/ML": "AI/ML" as const,
  "Cyber Security": "Cyber Security" as const,
  // Skill Upgrade - Finance
  "CFA": "CFA" as const,
  "CPA": "CPA" as const,
  // Skill Upgrade - Management
  "PMP": "PMP" as const,
  "Agile": "Agile" as const,
  // Career Switch
  "IT to Data Science": "IT to Data Science" as const,
  "Core to IT": "Core to IT" as const,
  "Private to Government": "Private to Government" as const,
  "Job to Startup": "Job to Startup" as const,
  // Government Exams
  "UPSC": "UPSC" as const,
  "MPSC": "MPSC" as const,
  "SSC": "SSC" as const,
  "Banking": "Banking" as const,
  // Entrepreneurship
  "Startup": "Startup" as const,
  "Freelancing": "Freelancing" as const,
  "Consulting": "Consulting" as const,
  "Agriculture Business": "Agriculture Business" as const,
} as const;

export type WorkingProfessionalCareerPath = typeof WorkingProfessionalCareerPath[keyof typeof WorkingProfessionalCareerPath];

export interface UserResponse {
  birth_date?: string; // Birth date in YYYY-MM-DD format
  age: number; // Calculated age from birth_date
  education_level: EducationLevel;
  custom_education_level?: string; // Custom education level description when "Other" is selected
  stream: Stream;
  specialization?: Specialization; // Sub-stream or specialization (e.g., PCM, PCB, specific course)
  interests: string[];
  location: Location;
  career_direction: CareerDirection;
  preferred_career_domain?: PreferredCareerDomain; // Preferred career domain if job is selected
  working_professional_career_path?: WorkingProfessionalCareerPath; // Career path for working professionals
  settlement_preference: SettlementPreference;
  marriage_age: MarriageAge;
  family_importance: FamilyImportance;
  spouse_career_preference?: SpouseCareerPreference;
  expected_kids?: ExpectedKids;
  father_profession?: FatherProfession;
  financial_background: FinancialBackground;
  risk_tolerance: RiskTolerance;
  short_term_goals?: ShortTermGoals;
  long_term_goals?: LongTermGoals;
  higher_education_preference: HigherEducationPreference;
  career_outcomes: CareerOutcome[];
}

export interface CareerPath {
  title: string;
  description: string;
  required_education: string;
  salary_range: string;
  growth_prospects: string;
  risk_level: string;
  work_life_balance: string;
  location_flexibility: string;
  family_friendly: boolean;
  steps: string[];
  timeline: string;
  pros: string[];
  cons: string[];
}

export interface FinancialProjection {
  career_path: string;
  year_1_5: Record<string, number>;
  year_6_10: Record<string, number>;
  year_11_15: Record<string, number>;
  year_16_20: Record<string, number>;
  total_20_year_earnings: number;
  risk_adjusted_return: number;
}

export interface RecommendationResponse {
  top_career_paths: CareerPath[];
  financial_projections: FinancialProjection[];
  risk_assessment: Record<string, any>;
  family_considerations: Record<string, any>;
  spouse_compatibility: Record<string, any>;
  mentor_connections: Array<Record<string, any>>;
  next_steps: string[];
  retrieved_context?: Array<Record<string, any>>;
}

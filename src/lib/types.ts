export type SkillSource = 'chat' | 'manual' | 'seed' | 'course' | 'interview' | 'project';

export interface Skill {
  id: string;
  name: string;
  category: 'core' | 'technical' | 'domain' | 'soft';
  level: number; // 0 to 5
  evidence?: string;
  source: SkillSource;
  user_edited: boolean;
  updated_at: string;
}

export interface ToolItem {
  id: string;
  name: string;
  category: string;
  proficiency?: 'beginner' | 'intermediate' | 'expert';
  user_edited: boolean;
  source: SkillSource;
  updated_at: string;
}

export interface MemoryFact {
  id: string;
  key: string;
  label: string;
  value: string;
  source: SkillSource;
  confidence: number;
  user_edited: boolean;
  updated_at: string;
}

export interface Profile {
  id: string;
  fullName: string;
  email: string;
  phone?: string;
  location?: string;
  targetRole: string;
  targetRoleId?: string;
  summary: string;
  careerGapMonths?: number;
  careerGapReason?: string;
  careerBreakNotes?: string;
  yearsExperience?: number;
  educationLevel?: string;
  updated_at: string;
}

export interface ExperienceItem {
  id: string;
  role: string;
  company: string;
  startDate: string;
  endDate: string;
  isCurrent?: boolean;
  isCareerBreak?: boolean;
  bullets: string[];
  user_edited: boolean;
  updated_at: string;
}

export interface EducationItem {
  id: string;
  degree: string;
  institution: string;
  year: string;
  fieldOfStudy: string;
  user_edited: boolean;
  updated_at: string;
}

export interface ProjectItem {
  id: string;
  title: string;
  problemStatement: string;
  expectedOutcome: string;
  technologies: string[];
  skillsDemonstrated: string[];
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  portfolioValue: string;
  status: 'recommended' | 'in_progress' | 'completed' | 'skipped';
  githubUrl?: string;
  liveUrl?: string;
  user_edited: boolean;
  updated_at: string;
}

export interface CertificateItem {
  id: string;
  title: string;
  issuer: string;
  issueDate: string;
  verifyUrl: string;
  skillName: string;
  user_edited: boolean;
  updated_at: string;
}

export type LearningDecision = 'pending' | 'accepted' | 'in_progress' | 'completed' | 'skipped' | 'not_relevant';

export interface LearningMilestone {
  id: string;
  resourceId: string;
  skillName: string;
  title: string;
  provider: string;
  effortHours: number;
  officialUrl: string;
  targetRoleContribution: string;
  status: LearningDecision;
  notes?: string;
  user_edited: boolean;
  completedAt?: string;
  updated_at: string;
}

export interface InterviewSession {
  id: string;
  mode: 'technical' | 'behavioral' | 'resume-gap' | 'role-specific';
  roleName: string;
  createdAt: string;
  overallScore: number; // 0 - 100
  questions: Array<{
    question: string;
    userAnswer: string;
    dimensionScores: {
      clarity: number;
      depth: number;
      relevance: number;
      gapExplanation?: number;
    };
    feedback: string;
    strengths: string[];
    improvements: string[];
    sampleResponse: string;
  }>;
}

export interface ATSFactorBreakdown {
  keywordMatch: number;   // max 40
  structure: number;      // max 20
  bulletQuality: number;  // max 20
  parseability: number;   // max 10
  readability: number;    // max 10
}

export interface ATSScanResult {
  id: string;
  targetRole: string;
  score: number; // 0 to 100
  breakdown: ATSFactorBreakdown;
  matchedKeywords: string[];
  missingKeywords: string[];
  weakBullets: Array<{
    original: string;
    issue: string;
    suggestedRewrite: string;
  }>;
  actionableFixes: string[];
  disclaimer: string;
  createdAt: string;
}

export interface ResumeData {
  id: string;
  version: number;
  targetRole: string;
  fullName: string;
  email: string;
  phone: string;
  location: string;
  summary: string;
  careerBreakNarrative?: string;
  skills: string[];
  tools: string[];
  experiences: ExperienceItem[];
  education: EducationItem[];
  projects: ProjectItem[];
  certifications: CertificateItem[];
  lastAtsScore?: number;
  updatedAt: string;
}

export interface JobPosting {
  id: string;
  title: string;
  company: string;
  location: string;
  city?: string;
  country?: string;
  isIndia?: boolean;
  sector: 'Finance' | 'FinTech' | 'Technology';
  url: string;
  fullText: string;
  requiredSkills: string[];
  preferredSkills: string[];
  requiredTools: string[];
  experienceYears: number;
  education: string;
  gapRestriction: 'explicit' | 'none_found' | 'returner_friendly';
  gapAnalysisNote: string;
  sourceType?: 'verified_seed' | 'grounded_live_search' | 'user_pasted';
  groundingUrls?: Array<{ title: string; url: string }>;
  customAnalysis?: CustomJDAnalysis;
}

export interface DynamicSkillComparison {
  skillName: string;
  requiredLevel: number; // 1 to 5
  userLevel: number; // 0 to 5
  category: 'core' | 'technical' | 'domain' | 'soft';
  status: 'mastered' | 'developing' | 'critical_gap';
  gapSeverity: 'none' | 'low' | 'medium' | 'high';
  userEvidence?: string;
  reentryAdvice: string;
}

export interface CustomJDAnalysis {
  id: string;
  jobTitle: string;
  companyName: string;
  location: string;
  matchScore: number; // 0 - 100
  verdict: 'Strong Opportunity' | 'Viable with Bridge Plan' | 'High Risk / Severe Gaps';
  executiveSummary: string;
  whyThisJobHurts: Array<{
    title: string;
    riskLevel: 'high' | 'medium' | 'moderate';
    detail: string;
    mitigationStrategy: string;
  }>;
  positivePoints: Array<{
    title: string;
    impact: 'strong' | 'moderate';
    detail: string;
    howToLeverage: string;
  }>;
  skillComparisons: DynamicSkillComparison[];
  careerGapEvaluation: {
    gapPolicy: 'returner_friendly' | 'neutral' | 'restrictive';
    riskAssessment: string;
    flaggedClauses: string[];
    interviewTalkingPoint: string;
  };
  actionPlaybook: {
    quickWins: string[];
    learningPathPriorities: string[];
    recommendedProjectHighlight: string;
  };
  jobPosting: JobPosting;
  createdAt: string;
}

export interface JobMatchResult {
  job: JobPosting;
  matchScore: number; // 0 - 100
  matchedSkills: string[];
  missingSkills: string[];
  matchedTools: string[];
  gapAssessment: string;
  recommendedAction: string;
}

export interface RoleProfile {
  id: string;
  roleName: string;
  sector: 'Finance' | 'FinTech' | 'Technology';
  description: string;
  requiredSkills: Array<{
    name: string;
    level: number; // 0 to 5
    weight: number; // e.g. 1.0 to 2.0
    category: 'core' | 'technical' | 'domain' | 'soft';
  }>;
  requiredTools: string[];
  typicalCareerGapsAccepted: boolean;
}

export interface ResourceItem {
  id: string;
  skillName: string;
  title: string;
  provider: string;
  effortHours: number;
  officialUrl: string;
  description: string;
}

export interface ReadinessFactor {
  factor: string;
  weight: number;
  earned: number;
  max: number;
  status: 'critical' | 'moderate' | 'strong';
  tip: string;
}

export interface ReadinessMetrics {
  totalScore: number; // 0 - 100
  skillsScore: number;     // 35% max
  toolsScore: number;      // 10% max
  learningScore: number;   // 20% max
  projectsScore: number;   // 15% max
  certsScore: number;      // 5% max
  interviewScore: number;  // 15% max
  breakdown: ReadinessFactor[];
  isStarted: boolean;
}

export type JourneyStage = 'DISCOVER' | 'SKILL GAP' | 'LEARN' | 'BUILD' | 'PRACTICE' | 'MATCH';

export interface AdviceItem {
  id: string;
  question: string;
  assessment: string;
  options: Array<{
    title: string;
    tradeoffs: string;
  }>;
  recommendation: string;
  nextStep: string;
  savedToPlan: boolean;
  createdAt: string;
}

export interface ConsultantReport {
  id: string;
  generatedAt: string;
  candidateName: string;
  targetRole: string;
  readinessTotal: number;
  executiveSummary: string;
  strengths: string[];
  identifiedRisks: string[];
  plan30Days: string[];
  plan60Days: string[];
  plan90Days: string[];
}

import { InterviewSession, ProjectItem, Skill, RoleProfile } from '../types';

export interface InterviewQuestionTemplate {
  id: string;
  mode: InterviewSession['mode'];
  roleCategory: string;
  question: string;
  contextTip: string;
  evaluationRubric: string;
  sampleModelAnswer: string;
}

export const INTERVIEW_QUESTION_BANK: InterviewQuestionTemplate[] = [
  // 1. Resume & Career Gap Mode
  {
    id: 'gap-q1',
    mode: 'resume-gap',
    roleCategory: 'All',
    question: 'I noticed there is a period of time on your resume where you were away from full-time work. Could you walk me through how you spent that time and how you prepared for returning?',
    contextTip: 'Focus on honesty, intentionality, and highlighting transferable personal management or self-directed learning.',
    evaluationRubric: 'Look for candid confidence without apologies, clear mention of intentional activities or caregiving, and recent proactive steps taken to refresh skills.',
    sampleModelAnswer: 'Thank you for asking. I stepped away from full-time corporate work for 18 months to manage important family caregiving responsibilities. While away, I maintained my professional curiosity by completing updated coursework in SQL and Power BI, following industry shifts, and building personal data projects. I am now fully prepared, recharged, and eager to bring both my seasoned prior experience and fresh technical competencies to this role.'
  },
  {
    id: 'gap-q2',
    mode: 'resume-gap',
    roleCategory: 'All',
    question: 'How do you feel your previous work experience aligns with this role, given the fast pace of change in the industry while you were away?',
    contextTip: 'Bridge past core fundamentals (problem-solving, stakeholder communication) with recent contemporary tooling.',
    evaluationRubric: 'Candidate should emphasize timeless domain foundation combined with evidence of modern tool adoption.',
    sampleModelAnswer: 'Core business fundamentals—understanding data accuracy, communicating insights to executives, and disciplined project delivery—do not expire. While tooling evolves, I have deliberately modernized my technical stack with current tools like Python and Power BI. Combining battle-tested business judgment with modern tools makes me a highly dependable contributor.'
  },
  // 2. Technical Mode
  {
    id: 'tech-q1',
    mode: 'technical',
    roleCategory: 'Data Analyst',
    question: 'Suppose you have a slow-running SQL query joining three large tables with 10 million rows each. What steps and principles would you use to diagnose and optimize the query?',
    contextTip: 'Discuss query execution plans (EXPLAIN), indexes, filtering early (WHERE before JOIN), and avoiding SELECT *.',
    evaluationRubric: 'Evaluate understanding of relational query plans, index utilization, avoiding unnecessary Cartesian joins, and aggregating before joining.',
    sampleModelAnswer: 'First, I run EXPLAIN ANALYZE to inspect the query execution plan and identify bottlenecks like sequential table scans or nested loops. Second, I ensure appropriate indexes exist on foreign key join columns. Third, I filter records early using WHERE clauses before joining, replace SELECT * with only necessary columns, and evaluate whether pre-aggregating in a Common Table Expression (CTE) reduces row volume prior to the main join.'
  },
  {
    id: 'tech-q2',
    mode: 'technical',
    roleCategory: 'Finance',
    question: 'Can you walk me through how a $10 increase in depreciation flows through the three financial statements?',
    contextTip: 'Address Income Statement (pre-tax vs post-tax), Cash Flow Statement (operating activities add-back), and Balance Sheet (PP&E and cash equity balance).',
    evaluationRubric: 'Correct tax rate assumption (e.g. 20%), correct net income reduction, cash flow from operations increase, balance sheet equilibrium.',
    sampleModelAnswer: 'Assuming a 20% tax rate: On the Income Statement, operating income decreases by $10, reducing pre-tax income by $10. Taxes decrease by $2, so Net Income falls by $8. On the Cash Flow Statement, Net Income starts down $8, but since depreciation is a non-cash expense, we add back $10 in Operating Cash Flow, leading to a net cash increase of $2. On the Balance Sheet, Cash is up $2, PP&E is down $10 from accumulated depreciation, so Assets decrease by $8. On the Liabilities & Equity side, Retained Earnings is down $8 from Net Income, maintaining perfect balance.'
  },
  // 3. Behavioral Mode
  {
    id: 'behav-q1',
    mode: 'behavioral',
    roleCategory: 'All',
    question: 'Describe a situation where a stakeholder or team member disagreed with your analytical findings or assumptions. How did you resolve the disagreement?',
    contextTip: 'Use the STAR format (Situation, Task, Action, Result) with an emphasis on empathy, transparency, and data validation.',
    evaluationRubric: 'Assessment of conflict resolution, active listening, returning to source data, and maintaining positive stakeholder relations.',
    sampleModelAnswer: 'In my previous position, a department head challenged our revenue variance report, believing their branch had surpassed target. I scheduled a one-on-one session to walk through our methodology together with complete transparency. We discovered their team had recorded revenue on gross order placements rather than invoiced delivery dates. By explaining GAAP revenue recognition calmly and offering an auxiliary operational tracking sheet for their pending pipeline, we aligned on the official figures while preserving trust.'
  },
  // 4. Role-Specific Mode
  {
    id: 'role-q1',
    mode: 'role-specific',
    roleCategory: 'FinTech',
    question: 'In a FinTech environment, what key metrics would you monitor on a daily dashboard to safeguard against abnormal transaction anomalies or chargeback spikes?',
    contextTip: 'Mention chargeback ratios, authorization rates, velocity checks, and average ticket size anomalies.',
    evaluationRubric: 'Specific awareness of payments risk indicators, fraud alert thresholds, and practical executive dashboard visualization.',
    sampleModelAnswer: 'I would monitor four primary indicators: Transaction Velocity (sudden bursts per card or IP), Authorization-to-Settlement Success Rate, Chargeback-to-Volume Ratio (keeping well below the 1% card network threshold), and Average Order Value deviation. Setting automated threshold alerts enables the risk team to intervene before regulatory or network penalties trigger.'
  }
];

export function evaluateInterviewResponse(
  question: InterviewQuestionTemplate,
  userAnswer: string
): {
  overallScore: number;
  dimensionScores: { clarity: number; depth: number; relevance: number; gapExplanation?: number };
  feedback: string;
  strengths: string[];
  improvements: string[];
  sampleModelAnswer: string;
} {
  const words = userAnswer.trim().split(/\s+/).filter(w => w.length > 0);
  const wordCount = words.length;

  let clarity = 75;
  let depth = 70;
  let relevance = 80;
  let gapExplanation = question.mode === 'resume-gap' ? 78 : undefined;

  // Length heuristics
  if (wordCount < 20) {
    clarity = 50;
    depth = 40;
    relevance = 60;
  } else if (wordCount >= 60 && wordCount <= 220) {
    clarity = 88;
    depth = 85;
    relevance = 90;
    if (gapExplanation) gapExplanation = 90;
  } else if (wordCount > 250) {
    clarity = 75;
    depth = 88;
    relevance = 82;
  }

  // Keywords check
  const lowerAnswer = userAnswer.toLowerCase();
  const strengths: string[] = [];
  const improvements: string[] = [];

  if (wordCount >= 50) {
    strengths.push('Good narrative structure with sufficient detail to evaluate competency.');
  } else {
    improvements.push('Expand your answer with specific concrete examples or metrics to illustrate your points.');
  }

  if (question.mode === 'resume-gap') {
    if (lowerAnswer.includes('learn') || lowerAnswer.includes('course') || lowerAnswer.includes('skill') || lowerAnswer.includes('prepare') || lowerAnswer.includes('project')) {
      strengths.push('Effectively highlighted proactive upskilling and forward-looking readiness.');
    } else {
      improvements.push('Explicitly mention your recent refresher projects or certifications to reassure interviewers.');
    }
  }

  if (question.mode === 'technical') {
    if (lowerAnswer.includes('plan') || lowerAnswer.includes('index') || lowerAnswer.includes('tax') || lowerAnswer.includes('statement') || lowerAnswer.includes('flow')) {
      strengths.push('Demonstrated solid grasp of technical domain terminology.');
    } else {
      improvements.push('Incorporate standard technical terms and formal methodology steps.');
    }
  }

  const overallScore = Math.round(
    gapExplanation 
      ? (clarity * 0.25 + depth * 0.25 + relevance * 0.25 + gapExplanation * 0.25)
      : (clarity * 0.35 + depth * 0.35 + relevance * 0.30)
  );

  const feedback = overallScore >= 80
    ? 'Strong, articulate response that answers the core prompt with professional confidence.'
    : overallScore >= 60
    ? 'Solid foundation, but would benefit from tighter structure and measurable impact metrics.'
    : 'Brief response. Practice using the STAR method or structured technical diagnostic steps.';

  return {
    overallScore,
    dimensionScores: {
      clarity,
      depth,
      relevance,
      gapExplanation,
    },
    feedback,
    strengths,
    improvements,
    sampleModelAnswer: question.sampleModelAnswer,
  };
}

// Project recommendations when user lacks proof for a required skill
export function recommendProjectsForGaps(
  targetRole: RoleProfile | null,
  userSkills: Skill[]
): ProjectItem[] {
  if (!targetRole) return [];

  const skillMap = new Map(userSkills.map(s => [s.name.toLowerCase(), s.level]));
  const projects: ProjectItem[] = [];

  // Project 1: SQL & Data Modeling
  const sqlLevel = skillMap.get('sql querying') || 0;
  if (sqlLevel < 4) {
    projects.push({
      id: 'proj-sql-ecom',
      title: 'E-Commerce Operational Analytics & Cohort Retention Database',
      problemStatement: 'Retail businesses struggle to track monthly customer repeat order rates and cohort lifetime value from disconnected sales logs.',
      expectedOutcome: 'A reproducible PostgreSQL database schema with automated SQL window queries calculating 30-day retention and churn matrices.',
      technologies: ['PostgreSQL', 'SQL Window Functions', 'Git', 'DB Diagram'],
      skillsDemonstrated: ['SQL Querying', 'Data Cleaning & Validation', 'Relational Modeling'],
      difficulty: 'Intermediate',
      portfolioValue: 'High employer appeal: demonstrates complex joins, CTEs, and business metrics calculation directly in SQL.',
      status: 'recommended',
      user_edited: false,
      updated_at: new Date().toISOString(),
    });
  }

  // Project 2: Power BI / Executive Dashboard
  const pbiLevel = skillMap.get('data visualization & dashboards') || 0;
  if (pbiLevel < 4) {
    projects.push({
      id: 'proj-pbi-exec',
      title: 'Executive Financial & Sales KPI Intelligence Dashboard',
      problemStatement: 'Executive leadership lacks visibility into daily regional sales trends and profit margin variance against budget targets.',
      expectedOutcome: 'An interactive multi-page Power BI dashboard featuring DAX measures (YTD, YoY Variance, Moving Averages) and automated drill-downs.',
      technologies: ['Power BI', 'DAX', 'Excel Data Modeling', 'Power Query'],
      skillsDemonstrated: ['Data Visualization & Dashboards', 'Business Communication', 'Excel & Spreadsheet Modeling'],
      difficulty: 'Intermediate',
      portfolioValue: 'Visual portfolio piece you can demo in video recordings or live technical interviews.',
      status: 'recommended',
      user_edited: false,
      updated_at: new Date().toISOString(),
    });
  }

  // Project 3: Financial Valuation & 3-Statement Model
  const finLevel = skillMap.get('financial modeling') || 0;
  if (finLevel < 4 && targetRole.sector === 'Finance') {
    projects.push({
      id: 'proj-dcf-val',
      title: 'Dynamic 3-Statement & DCF Valuation Model for Public Tech Firm',
      problemStatement: 'Investors need an audited dynamic financial projection to determine intrinsic share value under sensitivity scenarios.',
      expectedOutcome: 'A dynamic, fully circularity-checked Excel workbook linking Income Statement, Balance Sheet, and Cash Flow with WACC and sensitivity tables.',
      technologies: ['Excel (Advanced)', 'DCF Valuation', 'Sensitivity Matrices'],
      skillsDemonstrated: ['Financial Modeling', 'DCF & Valuation', 'Variance Analysis'],
      difficulty: 'Advanced',
      portfolioValue: 'Gold standard for finance interviews: proves immediate day-one modeling capability.',
      status: 'recommended',
      user_edited: false,
      updated_at: new Date().toISOString(),
    });
  }

  // Project 4: Full Stack REST Application
  if (targetRole.sector === 'Technology') {
    projects.push({
      id: 'proj-swe-portal',
      title: 'Job Tracker & Portfolio Showcase REST API',
      problemStatement: 'Job seekers require a centralized portal to log application milestones, interview notes, and parse ATS match scores.',
      expectedOutcome: 'A responsive full-stack TypeScript web application with modular REST API endpoints, input validation, and database storage.',
      technologies: ['TypeScript', 'Node.js', 'React', 'PostgreSQL', 'Tailwind CSS'],
      skillsDemonstrated: ['TypeScript / JavaScript', 'REST APIs & Backend Integration', 'Git Version Control'],
      difficulty: 'Intermediate',
      portfolioValue: 'Showcases clean architecture, typed code, and end-to-end full stack development.',
      status: 'recommended',
      user_edited: false,
      updated_at: new Date().toISOString(),
    });
  }

  return projects;
}

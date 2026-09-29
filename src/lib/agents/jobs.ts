import {
  JobPosting,
  JobMatchResult,
  Skill,
  ToolItem,
  Profile,
  ProjectItem,
  LearningMilestone,
  CustomJDAnalysis,
  DynamicSkillComparison,
} from '../types';
import { SEEDED_JOBS } from '../data/seed';

export function matchJobPostings(
  jobs: JobPosting[],
  userProfile: Profile,
  userSkills: Skill[],
  userTools: ToolItem[]
): JobMatchResult[] {
  const skillMap = new Map(userSkills.map(s => [s.name.toLowerCase().trim(), s.level]));
  const userToolSet = new Set(userTools.map(t => t.name.toLowerCase().trim()));

  return jobs.map(job => {
    // 1. Matched skills
    const matchedSkills: string[] = [];
    const missingSkills: string[] = [];
    for (const req of job.requiredSkills) {
      if (skillMap.has(req.toLowerCase().trim()) && (skillMap.get(req.toLowerCase().trim()) || 0) >= 2) {
        matchedSkills.push(req);
      } else {
        missingSkills.push(req);
      }
    }

    // 2. Matched tools
    const matchedTools: string[] = [];
    for (const tool of job.requiredTools) {
      if (userToolSet.has(tool.toLowerCase().trim())) {
        matchedTools.push(tool);
      }
    }

    // Calculate score
    const skillScore = job.requiredSkills.length > 0 
      ? (matchedSkills.length / job.requiredSkills.length) * 60
      : 60;
    const toolScore = job.requiredTools.length > 0
      ? (matchedTools.length / job.requiredTools.length) * 30
      : 30;
    const returnerBonus = job.gapRestriction === 'returner_friendly' ? 10 : 5;

    const matchScore = Math.min(100, Math.round(skillScore + toolScore + returnerBonus));

    // Career gap note
    let gapAssessment = '';
    const gapYears = userProfile.careerGapMonths ? (userProfile.careerGapMonths / 12).toFixed(1) : '1.5';
    if (job.gapRestriction === 'returner_friendly') {
      gapAssessment = `Career gap: ${gapYears} yrs. Highly favorable: ${job.company} explicitly operates inclusive / return-to-work hiring initiatives.`;
    } else if (job.gapRestriction === 'none_found') {
      gapAssessment = `Career gap: ${gapYears} yrs. No continuous-employment requirement or disqualifying clause identified in job text.`;
    } else {
      gapAssessment = `Notice: Continuous employment or recency clause may apply. Highlight recent projects to counter this.`;
    }

    let recommendedAction = '';
    if (missingSkills.length === 0) {
      recommendedAction = 'Strong alignment. Polish your tailored resume and apply directly.';
    } else {
      recommendedAction = `Bridge the gap on ${missingSkills[0]} in your Learning Path before final submission.`;
    }

    return {
      job,
      matchScore,
      matchedSkills,
      missingSkills,
      matchedTools,
      gapAssessment,
      recommendedAction,
    };
  }).sort((a, b) => b.matchScore - a.matchScore);
}

/**
 * Deep diagnostic analyzer for arbitrary pasted Job Descriptions.
 * Audits for:
 * 1. "Why this job would hurt" (vulnerabilities, career gap traps, steep tool cliffs, high-pressure flags)
 * 2. "Positive points & strengths" (transfers from past experience, verified ReturnPath competencies)
 * 3. Dynamic Skill Comparison Matrix against candidate's current system state
 * 4. Strategic re-entry interview talking points
 */
export function analyzeCustomJobDescription(
  pastedText: string,
  userProfile: Profile,
  userSkills: Skill[],
  userTools: ToolItem[],
  projects: ProjectItem[] = [],
  milestones: LearningMilestone[] = []
): CustomJDAnalysis {
  const lower = pastedText.toLowerCase();

  // 1. Extract Role Title
  let title = 'Analytical Role';
  if (lower.includes('senior data analyst') || lower.includes('lead data analyst')) title = 'Senior Data Analyst';
  else if (lower.includes('data analyst')) title = 'Data Analyst';
  else if (lower.includes('business intelligence analyst') || lower.includes('bi analyst')) title = 'BI Analyst';
  else if (lower.includes('financial analyst') || lower.includes('fp&a analyst')) title = 'Financial Analyst';
  else if (lower.includes('data engineer')) title = 'Data Engineer';
  else if (lower.includes('software engineer') || lower.includes('frontend developer') || lower.includes('full stack')) title = 'Software Engineer';
  else if (lower.includes('business analyst')) title = 'Business Analyst';
  else if (lower.includes('operations analyst')) title = 'Operations Analyst';
  else if (lower.includes('product analyst')) title = 'Product Analyst';
  else if (userProfile.targetRole) title = userProfile.targetRole;

  // 2. Extract Company
  let company = 'Target Employer';
  const companyMatch = pastedText.match(/(?:at|about|join|company:|employer:)\s+([A-Z][A-Za-z0-9&.\s]{2,25})/i);
  if (companyMatch && companyMatch[1] && !companyMatch[1].toLowerCase().includes('the') && !companyMatch[1].toLowerCase().includes('this')) {
    company = companyMatch[1].trim();
  } else if (lower.includes('amazon')) company = 'Amazon';
  else if (lower.includes('google')) company = 'Google';
  else if (lower.includes('microsoft')) company = 'Microsoft';
  else if (lower.includes('tcs') || lower.includes('tata consultancy')) company = 'TCS';
  else if (lower.includes('infosys')) company = 'Infosys';
  else if (lower.includes('wipro')) company = 'Wipro';
  else if (lower.includes('accenture')) company = 'Accenture';
  else if (lower.includes('sap')) company = 'SAP Labs';
  else if (lower.includes('deloitte')) company = 'Deloitte';

  // 3. Extract Location & India city
  let location = 'Hybrid / Onsite';
  let isIndia = true; // Set to true by default for compatibility with India verified filter
  let city = 'All India';

  if (lower.includes('bengaluru') || lower.includes('bangalore')) {
    city = 'Bengaluru';
    location = 'Bengaluru, India';
  } else if (lower.includes('hyderabad')) {
    city = 'Hyderabad';
    location = 'Hyderabad, India';
  } else if (lower.includes('pune')) {
    city = 'Pune';
    location = 'Pune, India';
  } else if (lower.includes('mumbai')) {
    city = 'Mumbai';
    location = 'Mumbai, India';
  } else if (lower.includes('gurugram') || lower.includes('gurgaon') || lower.includes('delhi') || lower.includes('noida')) {
    city = 'Gurugram';
    location = 'Gurugram / Delhi NCR, India';
  } else if (lower.includes('chennai')) {
    city = 'Chennai';
    location = 'Chennai, India';
  } else if (lower.includes('remote')) {
    city = 'Remote (India)';
    location = 'Remote / Distributed';
  } else if (userProfile.location) {
    location = userProfile.location;
  }

  // 4. Candidate dynamic skills lookup
  const userSkillMap = new Map(userSkills.map(s => [s.name.toLowerCase().trim(), s]));
  const userToolSet = new Set(userTools.map(t => t.name.toLowerCase().trim()));

  // 5. Skills extraction database
  const catalogSkills = [
    { name: 'SQL Querying', keywords: ['sql', 'query', 'queries', 'rdbms', 'relational', 'joins', 'subqueries'], category: 'technical' as const, reqLevel: 3 },
    { name: 'Excel & Spreadsheet Modeling', keywords: ['excel', 'vlookup', 'xlookup', 'pivot tables', 'spreadsheet', 'macros'], category: 'technical' as const, reqLevel: 3 },
    { name: 'Power BI', keywords: ['power bi', 'powerbi', 'dax', 'power query'], category: 'technical' as const, reqLevel: 3 },
    { name: 'Tableau', keywords: ['tableau', 'viz', 'visualizations'], category: 'technical' as const, reqLevel: 2 },
    { name: 'Python for Data Analysis', keywords: ['python', 'pandas', 'numpy', 'matplotlib', 'seaborn', 'jupyter'], category: 'technical' as const, reqLevel: 2 },
    { name: 'Data Visualization & Dashboards', keywords: ['dashboard', 'visualization', 'reporting', 'kpi dashboards', 'charting'], category: 'technical' as const, reqLevel: 3 },
    { name: 'Financial Modeling', keywords: ['financial model', 'p&l', 'variance analysis', 'forecasting', 'budgeting', 'dcf'], category: 'domain' as const, reqLevel: 3 },
    { name: 'Business Acumen & Storytelling', keywords: ['storytelling', 'stakeholder', 'presentation', 'business acumen', 'insights'], category: 'core' as const, reqLevel: 3 },
    { name: 'Data Cleaning & Validation', keywords: ['cleaning', 'validation', 'etl', 'wrangling', 'data quality'], category: 'technical' as const, reqLevel: 2 },
    { name: 'Statistical Analysis', keywords: ['statistics', 'statistical', 'hypothesis', 'regression', 'a/b testing'], category: 'technical' as const, reqLevel: 2 },
    { name: 'Cross-Functional Communication', keywords: ['communication', 'cross-functional', 'collaborate', 'interpersonal', 'teamwork'], category: 'soft' as const, reqLevel: 3 },
    { name: 'Git Version Control', keywords: ['git', 'github', 'version control', 'repository', 'branches'], category: 'technical' as const, reqLevel: 2 },
    { name: 'Cloud Data Platforms (AWS/Azure/GCP)', keywords: ['aws', 'azure', 'gcp', 'bigquery', 'snowflake', 'redshift', 'cloud'], category: 'technical' as const, reqLevel: 2 },
  ];

  const matchedRequiredSkills: string[] = [];
  const skillComparisons: DynamicSkillComparison[] = [];

  for (const item of catalogSkills) {
    const isDemanded = item.keywords.some(k => lower.includes(k));
    if (isDemanded) {
      matchedRequiredSkills.push(item.name);
      
      // Look up user's dynamic skill in ReturnPath store
      const userSkill = userSkillMap.get(item.name.toLowerCase().trim());
      const userLevel = userSkill ? userSkill.level : 0;
      const userEvidence = userSkill?.evidence;

      let status: 'mastered' | 'developing' | 'critical_gap' = 'critical_gap';
      let gapSeverity: 'none' | 'low' | 'medium' | 'high' = 'high';
      let reentryAdvice = '';

      if (userLevel >= item.reqLevel) {
        status = 'mastered';
        gapSeverity = 'none';
        reentryAdvice = `Strong alignment (Level ${userLevel}/5). Emphasize this as an immediate contributor asset in your interview.`;
      } else if (userLevel > 0) {
        status = 'developing';
        gapSeverity = (item.reqLevel - userLevel === 1) ? 'low' : 'medium';
        reentryAdvice = `You've developed Level ${userLevel} in ReturnPath. Complete 1 hands-on scenario to reach required Level ${item.reqLevel}.`;
      } else {
        status = 'critical_gap';
        gapSeverity = 'high';
        reentryAdvice = `Zero verified exposure in your current profile. Recommend adding the ${item.name} module to your Learning Path immediately.`;
      }

      skillComparisons.push({
        skillName: item.name,
        requiredLevel: item.reqLevel,
        userLevel,
        category: item.category,
        status,
        gapSeverity,
        userEvidence,
        reentryAdvice,
      });
    }
  }

  // Ensure at least core analytical competencies if brief JD pasted
  if (skillComparisons.length === 0) {
    const defaultSkills = ['SQL Querying', 'Excel & Spreadsheet Modeling', 'Data Visualization & Dashboards'];
    for (const name of defaultSkills) {
      const userSkill = userSkillMap.get(name.toLowerCase().trim());
      const userLevel = userSkill ? userSkill.level : 1;
      skillComparisons.push({
        skillName: name,
        requiredLevel: 3,
        userLevel,
        category: 'technical',
        status: userLevel >= 3 ? 'mastered' : 'developing',
        gapSeverity: userLevel >= 3 ? 'none' : 'low',
        reentryAdvice: 'Core requirement for this role type. Verified foundation in your ReturnPath system.',
      });
      matchedRequiredSkills.push(name);
    }
  }

  // 6. Tools extraction
  const toolsToAudit = ['SQL', 'Excel', 'Power BI', 'Tableau', 'Python', 'Snowflake', 'AWS', 'Jira', 'Git'];
  const extractedTools: string[] = [];
  for (const t of toolsToAudit) {
    if (lower.includes(t.toLowerCase())) {
      extractedTools.push(t);
    }
  }
  if (extractedTools.length === 0) {
    extractedTools.push('SQL', 'Excel', 'Power BI');
  }

  // 7. FLAG: "Why this job would hurt" (Critical Vulnerabilities & Red Flags)
  const whyThisJobHurts: CustomJDAnalysis['whyThisJobHurts'] = [];

  // Check 1: Continuous employment / recency traps
  const hasStrictRecency = lower.includes('continuous') ||
    lower.includes('unbroken') ||
    lower.includes('strictly recent') ||
    lower.includes('current employment') ||
    lower.includes('no career break') ||
    lower.includes('immediate past 2 years in production');

  if (hasStrictRecency) {
    whyThisJobHurts.push({
      title: 'Strict Continuous Employment / Recency Requirement Flagged',
      riskLevel: 'high',
      detail: `The job description contains restrictive clauses requiring unbroken or immediate recent employment. For a career re-entrant (${userProfile.careerGapMonths ? (userProfile.careerGapMonths / 12).toFixed(1) : '1.5'} year break), automated applicant tracking systems (ATS) or traditional recruiters may screen this out before human review.`,
      mitigationStrategy: 'Lead with ReturnPath portfolio projects directly in your summary. Emphasize continuous upskilling and frame the break as intentional professional renewal.',
    });
  }

  // Check 2: High experience threshold / Seniority Overhang
  let experienceYears = 2;
  const expMatch = pastedText.match(/(\d+)\+?\s*(?:to\s*\d+\s*)?years?(?:\s*of)?\s*experience/i);
  if (expMatch && expMatch[1]) {
    experienceYears = parseInt(expMatch[1], 10);
  }

  if (experienceYears >= 5) {
    whyThisJobHurts.push({
      title: `High Seniority Gate (${experienceYears}+ Years Required)`,
      riskLevel: 'high',
      detail: `The role expects ${experienceYears}+ years of recent, continuous domain leadership. Following a career break, competing against candidates currently in unbroken senior posts creates an uphill evaluation bias.`,
      mitigationStrategy: 'Target equivalent mid-level openings first, or request an informational screening emphasizing high-velocity execution rather than title seniority.',
    });
  }

  // Check 3: Critical missing tool or tech stack cliff
  const highGapSkills = skillComparisons.filter(s => s.status === 'critical_gap');
  if (highGapSkills.length > 0) {
    const missingNames = highGapSkills.map(s => s.skillName).join(', ');
    whyThisJobHurts.push({
      title: `Critical Technical Stack Cliff (${highGapSkills.length} Required Skills Not in Your Profile)`,
      riskLevel: highGapSkills.length > 2 ? 'high' : 'medium',
      detail: `The JD heavily demands: ${missingNames}. You currently have 0 verified proficiency in these areas within ReturnPath. In a technical interview, deep questions on these tools will expose vulnerabilities.`,
      mitigationStrategy: `Add these competencies to your ReturnPath Learning Path. Complete at least 1 guided scenario before submitting your application.`,
    });
  }

  // Check 4: Burnout / High-Pressure / Lack of Re-onboarding support
  const hasHighPressureLanguage = lower.includes('fast-paced') ||
    lower.includes('wear many hats') ||
    lower.includes('minimal supervision') ||
    lower.includes('hit the ground running on day one') ||
    lower.includes('24/7') ||
    lower.includes('high pressure') ||
    lower.includes('aggressive deadlines');

  if (hasHighPressureLanguage) {
    whyThisJobHurts.push({
      title: 'Zero Onboarding Ramp / High-Velocity Pressure Culture',
      riskLevel: 'medium',
      detail: `Job posting uses "hit the ground running on day 1" or "minimal supervision" language. For re-entering professionals, environments without structured onboarding or mentorship often lead to rapid burnout and low support during the transition window.`,
      mitigationStrategy: 'Ask probing culture questions in round 1: "What does the first 90 days of onboarding and technical ramp-up look like for this team?"',
    });
  }

  // If no negative points flagged yet, add a realistic vigilance note
  if (whyThisJobHurts.length === 0) {
    whyThisJobHurts.push({
      title: 'Unspecified Onboarding & Mentorship Framework',
      riskLevel: 'moderate',
      detail: 'The job posting does not explicitly mention formal training or re-entry support programs. Standard enterprise ramp-up will be expected.',
      mitigationStrategy: 'Clarify team size, buddy assignment, and tooling access during early interview rounds.',
    });
  }

  // 8. IDENTIFY: "Positive Points & Strengths" (Competitive Edges)
  const positivePoints: CustomJDAnalysis['positivePoints'] = [];

  // Positive 1: Mastered skills from ReturnPath dynamic growth
  const masteredSkills = skillComparisons.filter(s => s.status === 'mastered');
  if (masteredSkills.length > 0) {
    positivePoints.push({
      title: `Strong Core Overlap (${masteredSkills.length} Verified Skills Match)`,
      impact: 'strong',
      detail: `You have demonstrated verified competency in: ${masteredSkills.map(s => s.skillName).join(', ')}. These match the primary deliverables described in the posting.`,
      howToLeverage: 'Place these skills in the top third of your resume and cite specific metrics from your past accomplishments.',
    });
  }

  // Positive 2: Returner friendly signals
  const isReturnerFriendly = lower.includes('return to work') ||
    lower.includes('career break') ||
    lower.includes('inclusive') ||
    lower.includes('re-entry') ||
    lower.includes('equal opportunity') ||
    lower.includes('diverse backgrounds');

  if (isReturnerFriendly) {
    positivePoints.push({
      title: 'Inclusive & Career-Break Positive Employer Stance',
      impact: 'strong',
      detail: 'The employer explicitly mentions equal opportunity, inclusive hiring, or welcome pathways for non-linear career trajectories.',
      howToLeverage: 'Be open and confident about your career break. Focus on the intentional skills modernization you completed during your hiatus.',
    });
  } else {
    positivePoints.push({
      title: 'No Explicit Career Break Disqualifier',
      impact: 'moderate',
      detail: 'No overt continuous-employment mandate was found in the text. Evaluation will depend primarily on your demonstrated technical competency.',
      howToLeverage: 'Use a functional / hybrid resume format to spotlight recent projects over chronological dates.',
    });
  }

  // Positive 3: Verified Tools in toolkit
  const matchedTools = extractedTools.filter(t => userToolSet.has(t.toLowerCase()));
  if (matchedTools.length > 0) {
    positivePoints.push({
      title: `Hands-on Tooling Currency (${matchedTools.join(', ')})`,
      impact: 'strong',
      detail: `Your verified toolkit already contains ${matchedTools.join(', ')}, which eliminates immediate software training overhead for the hiring team.`,
      howToLeverage: 'Highlight modern version proficiencies (e.g. Power BI DAX, advanced SQL CTEs/window functions).',
    });
  }

  // Positive 4: Dynamic Project Proof
  const completedProjects = projects.filter(p => p.status === 'completed');
  if (completedProjects.length > 0) {
    positivePoints.push({
      title: `Active ReturnPath Portfolio Proof (${completedProjects.length} Verified Projects)`,
      impact: 'strong',
      detail: `You have completed concrete portfolio projects in ReturnPath demonstrating live problem solving and recent currency.`,
      howToLeverage: 'Include GitHub links and live dashboard URLs in your resume and application responses.',
    });
  }

  // 9. Match Score & Verdict Calculation
  const totalSkills = Math.max(1, skillComparisons.length);
  const masteredCount = masteredSkills.length;
  const developingCount = skillComparisons.filter(s => s.status === 'developing').length;
  
  const skillScore = ((masteredCount * 1.0 + developingCount * 0.5) / totalSkills) * 60;
  const toolScore = (matchedTools.length / Math.max(1, extractedTools.length)) * 25;
  const gapScore = isReturnerFriendly ? 15 : (hasStrictRecency ? 0 : 10);
  
  const matchScore = Math.min(100, Math.max(20, Math.round(skillScore + toolScore + gapScore)));

  let verdict: CustomJDAnalysis['verdict'] = 'Viable with Bridge Plan';
  if (matchScore >= 75 && !hasStrictRecency) {
    verdict = 'Strong Opportunity';
  } else if (matchScore < 50 || (hasStrictRecency && experienceYears >= 5)) {
    verdict = 'High Risk / Severe Gaps';
  }

  // 10. Gap Evaluation & Interview Talking Points
  const gapYears = userProfile.careerGapMonths ? (userProfile.careerGapMonths / 12).toFixed(1) : '1.5';
  let gapPolicy: 'returner_friendly' | 'neutral' | 'restrictive' = 'neutral';
  if (isReturnerFriendly) gapPolicy = 'returner_friendly';
  else if (hasStrictRecency) gapPolicy = 'restrictive';

  const flaggedClauses: string[] = [];
  if (hasStrictRecency) flaggedClauses.push('Strict continuous employment or recency clause');
  if (experienceYears >= 5) flaggedClauses.push(`Seniority threshold (${experienceYears}+ years continuous)`);
  if (hasHighPressureLanguage) flaggedClauses.push('Zero-onboarding / high-pressure velocity markers');

  const interviewTalkingPoint = `“During my ${gapYears}-year planned career pause to address family priorities, I maintained active technical currency by modernizing my stack in ${matchedRequiredSkills.slice(0, 2).join(' and ')} through rigorous project builds with ReturnPath. I am fully energized and ready to deliver immediate value to ${company}.”`;

  // 11. Action Playbook
  const quickWins = [
    `Tailor your executive summary to explicitly highlight ${matchedRequiredSkills.slice(0, 2).join(' and ')}.`,
    `Scan your resume in the ATS Scanner using this exact JD to identify keyword frequency gaps.`,
    `Prepare your 90-second career break narrative using the provided interview talking point.`,
  ];

  const learningPathPriorities = highGapSkills.slice(0, 2).map(s => `Complete ${s.skillName} foundation module in your Learning Path`);
  if (learningPathPriorities.length === 0) {
    learningPathPriorities.push('Review advanced scenario questions in the Mock Interview simulator.');
  }

  const recommendedProjectHighlight = completedProjects.length > 0
    ? completedProjects[0].title
    : 'Executive Financial & Operational Analytics Dashboard with SQL & Power BI';

  // 12. Complete JobPosting representation
  const jobPosting: JobPosting = {
    id: `custom_analyzed_${Date.now()}`,
    title,
    company,
    location,
    city,
    country: 'India',
    isIndia: true, // Always true to ensure visibility in India filter
    sector: title.toLowerCase().includes('finan') ? 'Finance' : 'Technology',
    url: 'https://example.com/custom-job-posting',
    fullText: pastedText,
    requiredSkills: matchedRequiredSkills,
    preferredSkills: ['Problem Solving', 'Structured Communication', 'Business Acumen'],
    requiredTools: extractedTools,
    experienceYears,
    education: "Bachelor's degree or equivalent technical capabilities",
    gapRestriction: gapPolicy === 'returner_friendly' ? 'returner_friendly' : (gapPolicy === 'restrictive' ? 'explicit' : 'none_found'),
    gapAnalysisNote: isReturnerFriendly 
      ? 'Positive: Employer embraces career breaks and return-to-work professionals.'
      : (hasStrictRecency ? 'Warning: Strict recency clause detected. Address proactively.' : 'Neutral: No explicit continuous employment restriction identified.'),
    sourceType: 'user_pasted',
  };

  const executiveSummary = `This ${title} role at ${company} presents a ${matchScore}% alignment with your dynamic profile. You have ${masteredSkills.length} mastered competencies ready to showcase, but must navigate ${whyThisJobHurts.length} critical vulnerability areas (including ${whyThisJobHurts[0]?.title || 'stack nuances'}).`;

  const analysis: CustomJDAnalysis = {
    id: `analysis_${Date.now()}`,
    jobTitle: title,
    companyName: company,
    location,
    matchScore,
    verdict,
    executiveSummary,
    whyThisJobHurts,
    positivePoints,
    skillComparisons,
    careerGapEvaluation: {
      gapPolicy,
      riskAssessment: gapPolicy === 'returner_friendly'
        ? 'High probability of fair evaluation. Break is unlikely to be a barrier.'
        : (gapPolicy === 'restrictive'
            ? 'High risk of automated ATS penalty. Direct outreach or referral strongly recommended.'
            : 'Moderate risk. Emphasize recent project currency over chronological timeline.'),
      flaggedClauses,
      interviewTalkingPoint,
    },
    actionPlaybook: {
      quickWins,
      learningPathPriorities,
      recommendedProjectHighlight,
    },
    jobPosting,
    createdAt: new Date().toISOString(),
  };

  jobPosting.customAnalysis = analysis;
  return analysis;
}

export function parseCustomJobDescription(pastedText: string): JobPosting {
  const emptyProfile: Profile = {
    id: 'user_default',
    fullName: 'Candidate',
    email: '',
    targetRole: 'Data Analyst',
    summary: '',
    careerGapMonths: 18,
    updated_at: new Date().toISOString(),
  };
  const analysis = analyzeCustomJobDescription(pastedText, emptyProfile, [], []);
  return analysis.jobPosting;
}


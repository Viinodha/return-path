import { AdviceItem, ConsultantReport, Profile, ReadinessMetrics, Skill, LearningMilestone, ATSScanResult, InterviewSession, ProjectItem } from '../types';

export function generateConsultantAdvice(
  question: string,
  profile: Profile,
  readiness: ReadinessMetrics,
  skills: Skill[]
): AdviceItem {
  const lower = question.toLowerCase();

  // Scenario 1: Explaining career gap
  if (lower.includes('gap') || lower.includes('break') || lower.includes('time off') || lower.includes('explain')) {
    return {
      id: `adv_${Date.now()}`,
      question,
      assessment: `Addressing a career break of ${profile.careerGapMonths ? (profile.careerGapMonths / 12).toFixed(1) + ' years' : 'time away'} is primarily about narrative framing and proof of currency. Hiring managers rarely hold caregiving or transitions against candidates if they show intentionality and recent practical work.`,
      options: [
        {
          title: 'Direct Functional Framing (Recommended)',
          tradeoffs: 'Explicitly state the reason in 1-2 sentences, then immediately pivot to recent projects and certifications. Pro: Eliminates employer curiosity and highlights proactive discipline. Con: Requires verifiable recent projects.',
        },
        {
          title: 'Chronological Minimization',
          tradeoffs: 'Group dates by year rather than months. Pro: Softens the visual appearance of the gap. Con: Will inevitably be queried in live interviews and could appear evasive if probed.',
        }
      ],
      recommendation: `Use the Direct Functional Framing approach. In both your resume and interview conversations, name the break honestly (e.g. "${profile.careerGapReason || 'Family Care & Professional Regrouping'}"), highlight your active coursework in ${profile.targetRole || 'analytics'}, and showcase a working code or dashboard repository.`,
      nextStep: 'Add your career break line into the Resume Builder and rehearse Question 1 in the Interview Coach.',
      savedToPlan: false,
      createdAt: new Date().toISOString(),
    };
  }

  // Scenario 2: Choosing between roles or courses
  if (lower.includes('choose') || lower.includes('course') || lower.includes('role') || lower.includes('which')) {
    return {
      id: `adv_${Date.now()}`,
      question,
      assessment: `With your current readiness at ${readiness.totalScore}%, strategic focus is more effective than broad exploratory study. Coursework without demonstrable project artifacts has diminishing returns.`,
      options: [
        {
          title: 'Depth in One Core Credential (e.g., PL-300 or SQL Masterclass)',
          tradeoffs: 'Pro: Strong signal to ATS and recruiters for specific technical filtering. Con: Requires 30-40 hours of dedicated study.',
        },
        {
          title: 'Immediate Project Building',
          tradeoffs: 'Pro: Creates immediate visual talking points for interviews. Con: Does not grant an accredited vendor badge.',
        }
      ],
      recommendation: `Pair one vendor-recognized certification milestone with one end-to-end portfolio project. This provides both the algorithmic filter pass (ATS) and the conversational proof required by hiring managers.`,
      nextStep: 'Accept the top prioritized milestone in your Learning Path and check the Project Coach for a linked project statement.',
      savedToPlan: false,
      createdAt: new Date().toISOString(),
    };
  }

  // Default strategic career advice
  return {
    id: `adv_${Date.now()}`,
    question,
    assessment: `At ${readiness.totalScore}% career readiness toward ${profile.targetRole || 'your target role'}, your foundation is taking shape. The biggest leverage point right now is converting self-reported knowledge into auditable artifacts.`,
    options: [
      {
        title: 'Accelerate Portfolio & Verification',
        tradeoffs: 'Pro: Rapidly moves readiness score above 75%. Con: Requires concentrated technical effort.',
      },
      {
        title: 'Begin Early Informational Applications',
        tradeoffs: 'Pro: Tests real market feedback early. Con: Risk of early rejection if ATS keyword score remains low.',
      }
    ],
    recommendation: `Focus on closing the two highest-weight skill gaps first, run an ATS scan on your resume draft, and achieve at least 70% overall readiness before submitting high-priority applications.`,
    nextStep: 'Review your personalized 30/60/90 day action plan in the Report tab.',
    savedToPlan: false,
    createdAt: new Date().toISOString(),
  };
}

export function compileConsultantReport(
  profile: Profile,
  readiness: ReadinessMetrics,
  skills: Skill[],
  milestones: LearningMilestone[],
  scans: ATSScanResult[],
  interviews: InterviewSession[],
  projects: ProjectItem[]
): ConsultantReport {
  const latestScan = scans.length > 0 ? scans[0] : null;
  const targetRole = profile.targetRole || 'Data Analyst / Finance Specialist';
  const candidateName = profile.fullName || 'Candidate';

  const strengths: string[] = [];
  if (readiness.skillsScore >= 20) strengths.push('Solid core skill foundations established across required role competencies.');
  if (milestones.some(m => m.status === 'completed')) strengths.push('Proactive upskilling demonstrated through completed structured learning milestones.');
  if (projects.length > 0) strengths.push('Applied portfolio project in progress providing concrete conversational evidence.');
  if (interviews.some(i => i.overallScore >= 70)) strengths.push('Demonstrated interview articulation when explaining background and career transition.');
  if (strengths.length === 0) strengths.push('Clear motivation and structured framework initiated to manage workforce re-entry.');

  const identifiedRisks: string[] = [];
  if (readiness.toolsScore < 6) identifiedRisks.push('Tooling gap: Missing verified exposure to some standard employer software requirements.');
  if (!latestScan || latestScan.score < 70) identifiedRisks.push('Resume ATS vulnerability: Current resume may lack high-density keywords needed for automated screeners.');
  if (interviews.length === 0) identifiedRisks.push('Unrehearsed interview narrative: Career break explanation has not yet been stress-tested in mock sessions.');
  if (identifiedRisks.length === 0) identifiedRisks.push('Pacing: Maintain weekly momentum across coursework and networking.');

  const plan30Days = [
    `Complete active coursework in Learning Path (focus on top weighted skill requirements for ${targetRole}).`,
    `Update Career Memory with verified tools and software proficiencies.`,
    `Draft updated ATS-compliant resume incorporating honest career break narrative.`,
  ];

  const plan60Days = [
    `Build and deploy 1 high-visibility portfolio project from the Project Coach.`,
    `Run ATS scans against at least 3 target job descriptions and achieve scores of 80+.`,
    `Complete 2 mock interview sessions in the Interview Coach (technical + career gap modes).`,
  ];

  const plan90Days = [
    `Achieve 80%+ overall Career Readiness.`,
    `Submit applications to vetted inclusive / returner-friendly employers from the Jobs board.`,
    `Conduct live interviews backed by documented portfolio artifacts and refreshed domain mastery.`,
  ];

  return {
    id: `rep_${Date.now()}`,
    generatedAt: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
    candidateName,
    targetRole,
    readinessTotal: readiness.totalScore,
    executiveSummary: `Strategic workforce re-entry assessment prepared for ${candidateName}. The candidate is actively pursuing ${targetRole}. Current Career Readiness is calculated at ${readiness.totalScore}% across skills, tools, learning progress, portfolio projects, certifications, and interview preparation. This report provides an audit of existing strengths, high-impact gaps, and a structured 30/60/90 day execution roadmap.`,
    strengths,
    identifiedRisks,
    plan30Days,
    plan60Days,
    plan90Days,
  };
}

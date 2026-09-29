import { JourneyStage, Profile, RoleProfile, Skill, LearningMilestone, ProjectItem, InterviewSession } from './types';
import { SEEDED_ROLES } from './data/seed';

export function deriveJourneyStage(
  profile: Profile,
  targetRole: RoleProfile | null | undefined,
  skills: Skill[],
  milestones: LearningMilestone[],
  projects: ProjectItem[],
  interviews: InterviewSession[]
): {
  currentStage: JourneyStage;
  stageProgress: number; // 0 - 100
  stageDescription: string;
  nextStepPrompt: string;
} {
  // Stage 1: DISCOVER
  // If target role is not selected or summary is missing
  if (!profile.targetRole || !targetRole) {
    return {
      currentStage: 'DISCOVER',
      stageProgress: profile.targetRole ? 60 : 20,
      stageDescription: 'Clarifying your background, career break, and target career direction.',
      nextStepPrompt: 'Tell your Companion what role you are aiming for (e.g. Financial Analyst, Data Analyst, Software Engineer).',
    };
  }

  // Check skill gaps
  const skillMap = new Map<string, number>();
  for (const s of skills) {
    skillMap.set(s.name.toLowerCase().trim(), s.level);
  }

  let totalGaps = 0;
  for (const req of targetRole.requiredSkills) {
    const userLvl = skillMap.get(req.name.toLowerCase().trim()) || 0;
    if (userLvl < req.level) {
      totalGaps++;
    }
  }

  // Stage 2: SKILL GAP
  // If learning path milestones haven't been reviewed or accepted
  const acceptedMilestones = milestones.filter(m => m.status === 'accepted' || m.status === 'in_progress' || m.status === 'completed');
  if (milestones.length === 0 || acceptedMilestones.length === 0) {
    return {
      currentStage: 'SKILL GAP',
      stageProgress: 35,
      stageDescription: `Identified ${totalGaps} core competency gaps for ${targetRole.roleName}.`,
      nextStepPrompt: 'Review the recommended coursework and accept or edit items in your Learning Path.',
    };
  }

  // Stage 3: LEARN
  // Milestones accepted, but less than 60% completed
  const completedMilestones = milestones.filter(m => m.status === 'completed');
  const learnRatio = completedMilestones.length / Math.max(1, acceptedMilestones.length);
  if (learnRatio < 0.6) {
    return {
      currentStage: 'LEARN',
      stageProgress: Math.round(learnRatio * 100),
      stageDescription: `Upskilling in progress: ${completedMilestones.length}/${acceptedMilestones.length} active learning milestones finished.`,
      nextStepPrompt: 'Continue completing learning milestones to build verified skill proof.',
    };
  }

  // Stage 4: BUILD (Portfolio Projects)
  const completedProjects = projects.filter(p => p.status === 'completed');
  if (completedProjects.length < 1) {
    return {
      currentStage: 'BUILD',
      stageProgress: projects.some(p => p.status === 'in_progress') ? 50 : 20,
      stageDescription: 'Translate your newly refreshed skills into concrete, demonstrable portfolio artifacts.',
      nextStepPrompt: 'Explore the Project Coach to start a targeted project that closes remaining resume gaps.',
    };
  }

  // Stage 5: PRACTICE (Mock Interviews)
  if (interviews.length === 0 || (interviews[interviews.length - 1].overallScore < 70)) {
    return {
      currentStage: 'PRACTICE',
      stageProgress: interviews.length > 0 ? 65 : 30,
      stageDescription: 'Prepare for technical and behavioral interviews, including confidently explaining your career break.',
      nextStepPrompt: 'Launch a practice interview in the Interview Coach to rehearse real employer questions.',
    };
  }

  // Stage 6: MATCH
  return {
    currentStage: 'MATCH',
    stageProgress: 100,
    stageDescription: 'High career readiness achieved. Ready to align with vetted inclusive job postings.',
    nextStepPrompt: 'Review vetted job matches and scan your tailored resume against target descriptions.',
  };
}

export const JOURNEY_STAGES: JourneyStage[] = [
  'DISCOVER',
  'SKILL GAP',
  'LEARN',
  'BUILD',
  'PRACTICE',
  'MATCH',
];

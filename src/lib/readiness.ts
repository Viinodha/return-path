import { ReadinessMetrics, ReadinessFactor, RoleProfile, Skill, ToolItem, ProjectItem, CertificateItem, InterviewSession, LearningMilestone } from './types';

export function calculateCareerReadiness(
  targetRole: RoleProfile | null | undefined,
  userSkills: Skill[],
  userTools: ToolItem[],
  learningMilestones: LearningMilestone[],
  projects: ProjectItem[],
  certifications: CertificateItem[],
  interviews: InterviewSession[]
): ReadinessMetrics {
  // Empty state check per Section 8: if no target role is chosen, return Not started
  if (!targetRole) {
    return {
      totalScore: 0,
      skillsScore: 0,
      toolsScore: 0,
      learningScore: 0,
      projectsScore: 0,
      certsScore: 0,
      interviewScore: 0,
      breakdown: [
        { factor: 'Required Skills', weight: 35, earned: 0, max: 35, status: 'critical', tip: 'Select a target role in Companion to evaluate skill gaps' },
        { factor: 'Tools & Software', weight: 10, earned: 0, max: 10, status: 'critical', tip: 'Add tools you know in Career Memory' },
        { factor: 'Learning Path', weight: 20, earned: 0, max: 20, status: 'critical', tip: 'Start coursework in your adaptive Learning Path' },
        { factor: 'Portfolio Projects', weight: 15, earned: 0, max: 15, status: 'critical', tip: 'Build hands-on projects demonstrating required competencies' },
        { factor: 'Certifications', weight: 5, earned: 0, max: 5, status: 'critical', tip: 'Add verified credentials or certifications' },
        { factor: 'Interview Practice', weight: 15, earned: 0, max: 15, status: 'critical', tip: 'Complete a mock interview session' },
      ],
      isStarted: false,
    };
  }

  // 1. Required Skills Coverage (35%)
  const skillMap = new Map<string, number>();
  for (const s of userSkills) {
    skillMap.set(s.name.toLowerCase().trim(), s.level);
  }

  let totalWeight = 0;
  let earnedSkillRatio = 0;

  for (const req of targetRole.requiredSkills) {
    const userLvl = skillMap.get(req.name.toLowerCase().trim()) || 0;
    const ratio = Math.min(userLvl / req.level, 1.0);
    earnedSkillRatio += ratio * req.weight;
    totalWeight += req.weight;
  }

  const skillsScore = totalWeight > 0 ? Math.round((earnedSkillRatio / totalWeight) * 35) : 0;

  // 2. Required Tools Coverage (10%)
  const userToolSet = new Set(userTools.map(t => t.name.toLowerCase().trim()));
  const requiredToolsCount = targetRole.requiredTools.length;
  let matchedToolsCount = 0;
  for (const tool of targetRole.requiredTools) {
    if (userToolSet.has(tool.toLowerCase().trim())) {
      matchedToolsCount++;
    }
  }
  const toolsScore = requiredToolsCount > 0 ? Math.round((matchedToolsCount / requiredToolsCount) * 10) : 10;

  // 3. Learning Path Progress (20%)
  const activeMilestones = learningMilestones.filter(m => m.status !== 'skipped' && m.status !== 'not_relevant');
  const completedMilestones = activeMilestones.filter(m => m.status === 'completed');
  const learningScore = activeMilestones.length > 0 
    ? Math.round((completedMilestones.length / activeMilestones.length) * 20)
    : 0;

  // 4. Portfolio Projects (15%) - targeting 3 projects for full 15%
  const completedProjects = projects.filter(p => p.status === 'completed' || p.status === 'in_progress');
  const projectRatio = Math.min(completedProjects.length / 3, 1.0);
  const projectsScore = Math.round(projectRatio * 15);

  // 5. Certifications (5%) - 2 verified certs for full 5%
  const certRatio = Math.min(certifications.length / 2, 1.0);
  const certsScore = Math.round(certRatio * 5);

  // 6. Interview Practice (15%) - average of recent interview sessions (0 to 100 scaled to 15)
  let interviewScore = 0;
  if (interviews.length > 0) {
    const recentScores = interviews.slice(-3).map(i => i.overallScore);
    const avgScore = recentScores.reduce((a, b) => a + b, 0) / recentScores.length;
    interviewScore = Math.round((avgScore / 100) * 15);
  }

  const totalScore = Math.min(100, Math.round(skillsScore + toolsScore + learningScore + projectsScore + certsScore + interviewScore));

  const breakdown: ReadinessFactor[] = [
    {
      factor: 'Required Skills',
      weight: 35,
      earned: skillsScore,
      max: 35,
      status: skillsScore >= 28 ? 'strong' : skillsScore >= 15 ? 'moderate' : 'critical',
      tip: skillsScore >= 35 ? 'Skill requirements fully satisfied' : 'Complete learning milestones or projects to raise core skill levels',
    },
    {
      factor: 'Tools & Software',
      weight: 10,
      earned: toolsScore,
      max: 10,
      status: toolsScore >= 8 ? 'strong' : toolsScore >= 4 ? 'moderate' : 'critical',
      tip: `${matchedToolsCount} of ${requiredToolsCount} required tools added to Career Memory`,
    },
    {
      factor: 'Learning Path',
      weight: 20,
      earned: learningScore,
      max: 20,
      status: learningScore >= 16 ? 'strong' : learningScore >= 8 ? 'moderate' : 'critical',
      tip: `${completedMilestones.length} of ${activeMilestones.length || 0} active milestones completed`,
    },
    {
      factor: 'Portfolio Projects',
      weight: 15,
      earned: projectsScore,
      max: 15,
      status: projectsScore >= 10 ? 'strong' : projectsScore >= 5 ? 'moderate' : 'critical',
      tip: `${completedProjects.length} / 3 recommended projects completed with code artifacts`,
    },
    {
      factor: 'Certifications',
      weight: 5,
      earned: certsScore,
      max: 5,
      status: certsScore >= 4 ? 'strong' : certsScore >= 2 ? 'moderate' : 'critical',
      tip: `${certifications.length} verified credentials on record`,
    },
    {
      factor: 'Interview Practice',
      weight: 15,
      earned: interviewScore,
      max: 15,
      status: interviewScore >= 12 ? 'strong' : interviewScore >= 6 ? 'moderate' : 'critical',
      tip: interviews.length === 0 ? 'No mock interviews completed yet. Complete a session in Interview Coach.' : `Avg recent score: ${Math.round((interviewScore / 15) * 100)}%`,
    },
  ];

  return {
    totalScore,
    skillsScore,
    toolsScore,
    learningScore,
    projectsScore,
    certsScore,
    interviewScore,
    breakdown,
    isStarted: true,
  };
}

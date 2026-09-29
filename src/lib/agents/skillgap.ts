import { RoleProfile, Skill, ToolItem, ResourceItem, LearningMilestone } from '../types';
import { SEEDED_ROLES, SEEDED_RESOURCES } from '../data/seed';

export interface SkillGapAnalysisItem {
  skillName: string;
  category: 'core' | 'technical' | 'domain' | 'soft';
  requiredLevel: number;
  userLevel: number;
  gap: number;
  weight: number;
  isCovered: boolean;
  source: string;
  recommendedResource?: ResourceItem;
}

export interface SkillGapReport {
  targetRole: RoleProfile | null;
  items: SkillGapAnalysisItem[];
  missingTools: string[];
  coveredTools: string[];
  totalGapsCount: number;
  criticalGapsCount: number;
  summaryMessage: string;
}

export function performSkillGapAnalysis(
  targetRoleName: string,
  userSkills: Skill[],
  userTools: ToolItem[]
): SkillGapReport {
  const role = SEEDED_ROLES.find(r => r.roleName.toLowerCase() === targetRoleName.toLowerCase()) || null;

  if (!role) {
    return {
      targetRole: null,
      items: [],
      missingTools: [],
      coveredTools: [],
      totalGapsCount: 0,
      criticalGapsCount: 0,
      summaryMessage: targetRoleName 
        ? `We do not yet have a verified benchmark profile for "${targetRoleName}". Supported roles: ${SEEDED_ROLES.map(r => r.roleName).join(', ')}.`
        : 'Please select a target role to perform a skill gap analysis.',
    };
  }

  const skillMap = new Map<string, Skill>();
  for (const s of userSkills) {
    skillMap.set(s.name.toLowerCase().trim(), s);
  }

  const items: SkillGapAnalysisItem[] = [];
  let totalGaps = 0;
  let criticalGaps = 0;

  for (const req of role.requiredSkills) {
    const userSkill = skillMap.get(req.name.toLowerCase().trim());
    const userLvl = userSkill ? userSkill.level : 0;
    const gap = Math.max(0, req.level - userLvl);
    const isCovered = gap === 0;

    if (gap > 0) totalGaps++;
    if (gap >= 2) criticalGaps++;

    // Find official resource mapped to this skill
    const matchingResource = SEEDED_RESOURCES.find(
      r => r.skillName.toLowerCase() === req.name.toLowerCase()
    );

    items.push({
      skillName: req.name,
      category: req.category,
      requiredLevel: req.level,
      userLevel: userLvl,
      gap,
      weight: req.weight,
      isCovered,
      source: userSkill ? `${userSkill.source} (${userSkill.evidence || 'Recorded'})` : 'No evidence on record (Level 0)',
      recommendedResource: matchingResource,
    });
  }

  // Tools gap
  const userToolSet = new Set(userTools.map(t => t.name.toLowerCase().trim()));
  const missingTools = role.requiredTools.filter(t => !userToolSet.has(t.toLowerCase().trim()));
  const coveredTools = role.requiredTools.filter(t => userToolSet.has(t.toLowerCase().trim()));

  const summaryMessage = totalGaps === 0
    ? `All ${role.requiredSkills.length} core competency requirements for ${role.roleName} are fully satisfied.`
    : `Identified ${totalGaps} competency gap${totalGaps === 1 ? '' : 's'} (${criticalGaps} critical) for ${role.roleName}. Recommended coursework is available to close them.`;

  return {
    targetRole: role,
    items,
    missingTools,
    coveredTools,
    totalGapsCount: totalGaps,
    criticalGapsCount: criticalGaps,
    summaryMessage,
  };
}

export function generateCompanionAnnouncement(
  milestoneTitle: string,
  skillName: string,
  remainingGaps: SkillGapAnalysisItem[]
): string {
  const nextTopGap = remainingGaps.find(g => !g.isCovered);
  if (nextTopGap) {
    return `Great work! "${milestoneTitle}" is completed, updating your ${skillName} competency. Your largest remaining gap is now ${nextTopGap.skillName} (need level ${nextTopGap.requiredLevel}/5), so I have adjusted your learning priority accordingly.`;
  } else {
    return `Outstanding! "${milestoneTitle}" is completed. All core skill requirements for your target role are now covered. You are ready to start project building or interview practice!`;
  }
}

import { Profile, Skill, ToolItem, MemoryFact, SkillSource } from '../types';
import { SEEDED_ROLES } from '../data/seed';

export interface ExtractedFact {
  type: 'profile' | 'skill' | 'tool' | 'memory' | 'career_break';
  key: string;
  label: string;
  value: string;
  level?: number;
  category?: string;
  source: SkillSource;
  confidence: number;
}

export interface CompanionReply {
  replyText: string;
  extractedFacts: ExtractedFact[];
  suggestedTargetRole?: string;
  proposedUpdates?: Array<{
    field: string;
    oldValue: string;
    newValue: string;
  }>;
}

export function extractFactsFromText(
  userMessage: string,
  currentProfile: Profile,
  existingSkills: Skill[],
  existingTools: ToolItem[],
  existingMemories: MemoryFact[]
): CompanionReply {
  const text = userMessage.trim();
  const lower = text.toLowerCase();
  const facts: ExtractedFact[] = [];
  let suggestedTargetRole = currentProfile.targetRole;

  // 1. Role Identification
  if (lower.includes('data analyst') || lower.includes('analytics')) {
    if (lower.includes('junior') || lower.includes('entry')) {
      suggestedTargetRole = 'Junior Data Analyst';
    } else {
      suggestedTargetRole = 'Data Analyst';
    }
    facts.push({
      type: 'profile',
      key: 'target_role',
      label: 'Target Career Role',
      value: suggestedTargetRole,
      source: 'chat',
      confidence: 0.95,
    });
  } else if (lower.includes('financial analyst') || lower.includes('finance') || lower.includes('fp&a')) {
    suggestedTargetRole = 'Financial Analyst';
    facts.push({
      type: 'profile',
      key: 'target_role',
      label: 'Target Career Role',
      value: 'Financial Analyst',
      source: 'chat',
      confidence: 0.95,
    });
  } else if (lower.includes('fintech') || lower.includes('bi analyst')) {
    suggestedTargetRole = 'FinTech Data & BI Analyst';
    facts.push({
      type: 'profile',
      key: 'target_role',
      label: 'Target Career Role',
      value: 'FinTech Data & BI Analyst',
      source: 'chat',
      confidence: 0.95,
    });
  } else if (lower.includes('software engineer') || lower.includes('developer') || lower.includes('coding') || lower.includes('programmer')) {
    suggestedTargetRole = 'Junior Software Engineer';
    facts.push({
      type: 'profile',
      key: 'target_role',
      label: 'Target Career Role',
      value: 'Junior Software Engineer',
      source: 'chat',
      confidence: 0.95,
    });
  }

  // 2. Career Break / Gap Identification
  const gapRegex = /(?:break|gap|took\s+(?:a|some)\s+time|away\s+from|stepped\s+back)\s*(?:for\s+)?(\d+)?\s*(year|month|yr|mo)?/i;
  const gapMatch = lower.match(gapRegex);
  if (gapMatch || lower.includes('childcare') || lower.includes('caregiving') || lower.includes('health') || lower.includes('family') || lower.includes('parental') || lower.includes('recharge') || lower.includes('layoff')) {
    let reason = 'Personal / Caregiving leave';
    if (lower.includes('childcare') || lower.includes('parental') || lower.includes('children') || lower.includes('family')) {
      reason = 'Family care & parental leave';
    } else if (lower.includes('health') || lower.includes('recovery')) {
      reason = 'Health & personal wellness leave';
    } else if (lower.includes('layoff') || lower.includes('downsizing') || lower.includes('restructuring')) {
      reason = 'Company restructuring & transition';
    } else if (lower.includes('study') || lower.includes('upskill') || lower.includes('course')) {
      reason = 'Self-directed upskilling & transition';
    }

    let months = 12;
    if (lower.includes('2 year') || lower.includes('two year')) months = 24;
    else if (lower.includes('3 year') || lower.includes('three year')) months = 36;
    else if (lower.includes('6 month')) months = 6;
    else if (lower.includes('4 year')) months = 48;

    facts.push({
      type: 'career_break',
      key: 'career_gap_reason',
      label: 'Career Break Context',
      value: `${reason} (${months >= 12 ? Math.round(months / 12) + ' yrs' : months + ' mos'})`,
      source: 'chat',
      confidence: 0.9,
    });
  }

  // 3. Skills Identification with levels
  const skillKeywords: Array<{ name: string; category: Skill['category']; defaultLevel: number; keywords: string[] }> = [
    { name: 'SQL Querying', category: 'technical', defaultLevel: 3, keywords: ['sql', 'postgres', 'mysql', 'queries', 'querying'] },
    { name: 'Power BI', category: 'technical', defaultLevel: 3, keywords: ['power bi', 'powerbi', 'dax'] },
    { name: 'Excel (Advanced)', category: 'core', defaultLevel: 4, keywords: ['excel', 'vlookup', 'xlookup', 'pivot tables', 'spreadsheets'] },
    { name: 'Python for Data Analysis', category: 'technical', defaultLevel: 2, keywords: ['python', 'pandas', 'numpy', 'jupyter'] },
    { name: 'Financial Modeling', category: 'technical', defaultLevel: 3, keywords: ['financial model', 'financial modeling', 'dcf', '3-statement'] },
    { name: 'Financial Reporting (GAAP/IFRS)', category: 'domain', defaultLevel: 3, keywords: ['gaap', 'ifrs', 'general ledger', 'financial reporting', 'balance sheet'] },
    { name: 'Data Visualization & Dashboards', category: 'technical', defaultLevel: 3, keywords: ['data visualization', 'tableau', 'dashboard', 'dashboards'] },
    { name: 'TypeScript / JavaScript', category: 'technical', defaultLevel: 3, keywords: ['typescript', 'javascript', 'react', 'node'] },
    { name: 'Git Version Control', category: 'technical', defaultLevel: 3, keywords: ['git', 'github', 'version control', 'commits'] },
  ];

  for (const sk of skillKeywords) {
    if (sk.keywords.some(k => lower.includes(k))) {
      // Determine level estimate from context
      let level = sk.defaultLevel;
      if (lower.includes(`expert in ${sk.name.toLowerCase()}`) || lower.includes(`advanced ${sk.name.toLowerCase()}`) || lower.includes(`years of ${sk.name.toLowerCase()}`)) {
        level = 4;
      } else if (lower.includes(`basic ${sk.name.toLowerCase()}`) || lower.includes(`beginner ${sk.name.toLowerCase()}`) || lower.includes(`learning ${sk.name.toLowerCase()}`)) {
        level = 2;
      }

      facts.push({
        type: 'skill',
        key: `skill_${sk.name.toLowerCase().replace(/\s+/g, '_')}`,
        label: sk.name,
        value: `Level ${level}/5`,
        level,
        category: sk.category,
        source: 'chat',
        confidence: 0.85,
      });
    }
  }

  // 4. Tools Identification
  const toolList = ['Power BI', 'Excel', 'Tableau', 'SQL', 'Bloomberg Terminal', 'SAP ERP', 'Git', 'Docker', 'Python', 'VS Code', 'PostgreSQL', 'Snowflake'];
  for (const tool of toolList) {
    if (lower.includes(tool.toLowerCase())) {
      facts.push({
        type: 'tool',
        key: `tool_${tool.toLowerCase().replace(/\s+/g, '_')}`,
        label: tool,
        value: tool,
        source: 'chat',
        confidence: 0.9,
      });
    }
  }

  // 5. Generate conversational consultant reply
  const replyText = buildConsultantReply(text, suggestedTargetRole, facts, currentProfile);

  return {
    replyText,
    extractedFacts: facts,
    suggestedTargetRole,
  };
}

function buildConsultantReply(
  userText: string,
  targetRole: string,
  facts: ExtractedFact[],
  profile: Profile
): string {
  const lower = userText.toLowerCase();

  // If user is sharing their career break
  if (facts.some(f => f.type === 'career_break')) {
    const breakFact = facts.find(f => f.type === 'career_break');
    return `Thank you for sharing that context openly. Career breaks for caregiving, wellness, or transitions are a natural part of human life, and ReturnPath is built specifically to highlight your transferable strengths rather than penalizing time away.

I've noted: **${breakFact?.value}**. 

${targetRole ? `Given your interest in **${targetRole}**, employers today value verified contemporary readiness. What tools or technical skills did you rely on most in your prior work, or what have you looked into recently?` : `To tailor our path, what kind of role are you hoping to transition back into? (For instance: Data Analyst, Financial Analyst, or Software Engineer?)`}`;
  }

  // If target role was just identified
  if (facts.some(f => f.key === 'target_role') && !profile.targetRole) {
    const roleObj = SEEDED_ROLES.find(r => r.roleName.toLowerCase() === targetRole.toLowerCase());
    const sampleSkills = roleObj ? roleObj.requiredSkills.map(s => s.name).slice(0, 3).join(', ') : 'SQL, Excel, and Dashboards';

    return `Targeting **${targetRole}** is a strong, concrete focus. In our database, this role centers on core competencies like ${sampleSkills}, alongside modern tooling.

I've saved **${targetRole}** as your target career goal in your Career Memory. 

To map out where you stand today, how comfortable do you feel with these core tools? Which ones have you used before, and where would you like a refresher?`;
  }

  // If skills were extracted
  const extractedSkills = facts.filter(f => f.type === 'skill');
  if (extractedSkills.length > 0) {
    const skillList = extractedSkills.map(s => `${s.label} (${s.value})`).join(', ');
    return `I've recorded ${skillList} in your Career Memory. 

Because we hold the principle that *the AI recommends and you decide*, you can inspect and adjust these levels at any time in the Career Memory tab.

Have you worked on any personal projects, coursework, or certifications during your career break, or would you like me to recommend a hands-on project to refresh your portfolio?`;
  }

  // General conversational response if user asks advice or introduces themselves
  if (lower.includes('hello') || lower.includes('hi') || lower.includes('hey')) {
    return `Hello! I'm here as your career companion. We'll take this step by step at your pace. 

Where would you like to begin today? You can tell me about your background, the role you're aiming for, or any questions you have about re-entering the workforce.`;
  }

  return `I've noted that down and updated your career context. 

We can look at how this fits into your target role readiness, or you can explore your Learning Path to see the exact recommended courses and milestones tailored to close any remaining gaps. What would you like to focus on next?`;
}

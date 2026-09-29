import { ATSScanResult, ResumeData, RoleProfile, ExperienceItem, ProjectItem, CertificateItem, EducationItem } from '../types';
import { SEEDED_ROLES } from '../data/seed';

export function runATSScan(
  resumeText: string,
  targetRoleName?: string,
  customKeywords?: string[]
): ATSScanResult {
  const lower = resumeText.toLowerCase();

  // 1. Determine target keywords
  let targetKeywords: string[] = customKeywords || [];
  if (targetKeywords.length === 0 && targetRoleName) {
    const role = SEEDED_ROLES.find(r => r.roleName.toLowerCase() === targetRoleName.toLowerCase());
    if (role) {
      targetKeywords = [
        ...role.requiredSkills.map(s => s.name),
        ...role.requiredTools,
      ];
    }
  }

  if (targetKeywords.length === 0) {
    targetKeywords = ['SQL', 'Excel', 'Data Analysis', 'Dashboards', 'Reporting', 'Communication', 'Project Management'];
  }

  // Factor 1: Keyword Match (40 pts)
  const matchedKeywords: string[] = [];
  const missingKeywords: string[] = [];

  for (const kw of targetKeywords) {
    if (lower.includes(kw.toLowerCase())) {
      matchedKeywords.push(kw);
    } else {
      missingKeywords.push(kw);
    }
  }

  const keywordRatio = matchedKeywords.length / Math.max(1, targetKeywords.length);
  const keywordScore = Math.round(keywordRatio * 40);

  // Factor 2: Standard Structure (20 pts)
  const requiredSections = [
    { name: 'Summary / Profile', keywords: ['summary', 'profile', 'about'] },
    { name: 'Experience', keywords: ['experience', 'employment', 'work history'] },
    { name: 'Education', keywords: ['education', 'degree', 'university', 'college'] },
    { name: 'Skills / Tools', keywords: ['skills', 'technologies', 'tools', 'competencies'] },
    { name: 'Projects / Certifications', keywords: ['project', 'projects', 'certification', 'certifications', 'credentials'] },
  ];

  let presentSectionCount = 0;
  for (const sec of requiredSections) {
    if (sec.keywords.some(k => lower.includes(k))) {
      presentSectionCount++;
    }
  }
  const structureScore = Math.round((presentSectionCount / requiredSections.length) * 20);

  // Factor 3: Bullet Quality - Action Verbs & Measurable Metrics (20 pts)
  const lines = resumeText
    .split('\n')
    .map(l => l.trim())
    .filter(l => l.startsWith('-') || l.startsWith('•') || l.startsWith('*') || /^\d+\./.test(l));

  const actionVerbRegex = /^(led|built|developed|designed|managed|implemented|optimized|created|engineered|analyzed|spearheaded|automated|increased|reduced|delivered|formulated|orchestrated|established|accelerated)/i;
  const metricRegex = /(\d+%\b|\$\d+|\b\d+\s*(?:k|m|million|billion|users|customers|hours|days|weeks|projects|reports|records|queries))/i;

  let strongBulletsCount = 0;
  const weakBullets: Array<{ original: string; issue: string; suggestedRewrite: string }> = [];

  for (const line of lines) {
    const clean = line.replace(/^[-•*]|\d+\.\s*/, '').trim();
    if (clean.length < 10) continue;

    const hasActionVerb = actionVerbRegex.test(clean);
    const hasMetric = metricRegex.test(clean);

    if (hasActionVerb && hasMetric) {
      strongBulletsCount++;
    } else {
      let issue = '';
      if (!hasActionVerb && !hasMetric) {
        issue = 'Missing strong action verb and quantifiable business metric.';
      } else if (!hasActionVerb) {
        issue = 'Begins with passive description rather than decisive action verb.';
      } else {
        issue = 'Lacks quantified outcome (e.g., % improvement, hours saved, volume processed).';
      }

      const firstWord = clean.split(' ')[0] || 'Managed';
      const suggestedRewrite = `Engineered and executed ${clean.toLowerCase().replace(/^(was responsible for|handled|helped with)\s*/i, '')}, improving turnaround efficiency by 15% across departmental reporting.`;

      if (weakBullets.length < 4) {
        weakBullets.push({
          original: clean,
          issue,
          suggestedRewrite,
        });
      }
    }
  }

  const bulletScore = lines.length > 0 
    ? Math.round((strongBulletsCount / lines.length) * 20)
    : 10;

  // Factor 4: Parseability (10 pts)
  const hasEmail = /[\w.-]+@[\w.-]+\.[a-zA-Z]{2,}/.test(resumeText);
  const hasPhone = /(?:\+\d{1,3}[- ]?)?\(?\d{3}\)?[- ]?\d{3}[- ]?\d{4}/.test(resumeText);
  const hasConsistentDates = /(?:19|20)\d{2}\s*[-–]\s*(?:(?:19|20)\d{2}|present|current)/i.test(resumeText);
  
  let parseabilityScore = 0;
  if (hasEmail) parseabilityScore += 4;
  if (hasPhone) parseabilityScore += 3;
  if (hasConsistentDates) parseabilityScore += 3;

  // Factor 5: Length & Readability (10 pts)
  const words = resumeText.trim().split(/\s+/).filter(w => w.length > 0);
  const wordCount = words.length;
  let readabilityScore = 5;
  if (wordCount >= 250 && wordCount <= 750) {
    readabilityScore = 10;
  } else if (wordCount >= 150 && wordCount <= 1000) {
    readabilityScore = 8;
  } else {
    readabilityScore = 4;
  }

  const totalScore = Math.min(100, Math.max(0, keywordScore + structureScore + bulletScore + parseabilityScore + readabilityScore));

  const actionableFixes: string[] = [];
  if (missingKeywords.length > 0) {
    actionableFixes.push(`Integrate missing high-priority role keywords: ${missingKeywords.slice(0, 4).join(', ')} where your verified experience applies.`);
  }
  if (bulletScore < 15) {
    actionableFixes.push('Upgrade bullet points to begin with past-tense action verbs (e.g. Automated, Optimized, Spearheaded) paired with measurable impact metrics.');
  }
  if (!hasEmail || !hasPhone) {
    actionableFixes.push('Ensure standard contact information (email address and phone number) appears prominently in the top header.');
  }
  if (structureScore < 20) {
    actionableFixes.push('Add clearly delineated section headers: Summary, Experience, Education, Technical Skills, and Projects.');
  }
  if (wordCount < 250) {
    actionableFixes.push('Resume length is too brief for ATS depth assessment. Add specific project achievements or course completions.');
  }

  return {
    id: `scan_${Date.now()}`,
    targetRole: targetRoleName || 'General Analytics',
    score: totalScore,
    breakdown: {
      keywordMatch: keywordScore,
      structure: structureScore,
      bulletQuality: bulletScore,
      parseability: parseabilityScore,
      readability: readabilityScore,
    },
    matchedKeywords,
    missingKeywords,
    weakBullets,
    actionableFixes,
    disclaimer: 'This is an ATS-style benchmark scan based on industry parsing norms and keyword density. It is an advisory tool and does not guarantee employer ATS acceptance.',
    createdAt: new Date().toISOString(),
  };
}

export function buildATSResumeText(data: ResumeData): string {
  const parts: string[] = [];

  // Header
  parts.push(data.fullName.toUpperCase());
  const contactLine = [data.email, data.phone, data.location].filter(Boolean).join(' | ');
  if (contactLine) parts.push(contactLine);
  parts.push('');

  // Target Role & Summary
  parts.push(`PROFESSIONAL SUMMARY`);
  parts.push(data.summary || `Dedicated professional targeting ${data.targetRole || 'analytical opportunities'}, offering proven business problem-solving foundation combined with modernized technical proficiencies.`);
  parts.push('');

  // Core Competencies & Tools
  if (data.skills.length > 0 || data.tools.length > 0) {
    parts.push(`TECHNICAL SKILLS & COMPETENCIES`);
    if (data.skills.length > 0) parts.push(`Core Competencies: ${data.skills.join(', ')}`);
    if (data.tools.length > 0) parts.push(`Tools & Technologies: ${data.tools.join(', ')}`);
    parts.push('');
  }

  // Professional Experience & Honest Career Break
  if (data.experiences.length > 0 || data.careerBreakNarrative) {
    parts.push(`PROFESSIONAL EXPERIENCE`);

    // If career break is documented, handle honestly
    if (data.careerBreakNarrative) {
      parts.push(`CAREER BREAK | Professional Development & Family Care`);
      parts.push(`- ${data.careerBreakNarrative}`);
      parts.push('');
    }

    for (const exp of data.experiences) {
      parts.push(`${exp.role.toUpperCase()} | ${exp.company}`);
      parts.push(`${exp.startDate} - ${exp.isCurrent ? 'Present' : exp.endDate}`);
      for (const bullet of exp.bullets) {
        parts.push(`- ${bullet}`);
      }
      parts.push('');
    }
  }

  // Key Projects
  if (data.projects.length > 0) {
    parts.push(`KEY PORTFOLIO PROJECTS`);
    for (const proj of data.projects) {
      parts.push(`${proj.title.toUpperCase()} [${proj.technologies.join(', ')}]`);
      parts.push(`- Problem: ${proj.problemStatement}`);
      parts.push(`- Outcome: ${proj.expectedOutcome}`);
      parts.push('');
    }
  }

  // Certifications
  if (data.certifications.length > 0) {
    parts.push(`CERTIFICATIONS & VERIFIED CREDENTIALS`);
    for (const cert of data.certifications) {
      parts.push(`- ${cert.title} - ${cert.issuer} (${cert.issueDate})`);
    }
    parts.push('');
  }

  // Education
  if (data.education.length > 0) {
    parts.push(`EDUCATION`);
    for (const edu of data.education) {
      parts.push(`${edu.degree} in ${edu.fieldOfStudy} | ${edu.institution} (${edu.year})`);
    }
    parts.push('');
  }

  return parts.join('\n');
}

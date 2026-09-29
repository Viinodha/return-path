import {
  Profile,
  Skill,
  ToolItem,
  MemoryFact,
  ExperienceItem,
  EducationItem,
  ProjectItem,
  CertificateItem,
  LearningMilestone,
  InterviewSession,
  ATSScanResult,
  ResumeData,
  AdviceItem,
  ConsultantReport,
  SkillSource,
} from '../types';
import { SEEDED_RESOURCES, SEEDED_ROLES } from './seed';

export interface UserStoreData {
  profile: Profile;
  skills: Skill[];
  tools: ToolItem[];
  memories: MemoryFact[];
  experience: ExperienceItem[];
  education: EducationItem[];
  projects: ProjectItem[];
  certificates: CertificateItem[];
  learningMilestones: LearningMilestone[];
  interviews: InterviewSession[];
  atsScans: ATSScanResult[];
  resumes: ResumeData[];
  adviceList: AdviceItem[];
  report: ConsultantReport | null;
}

const STORAGE_KEY = 'returnpath_v1_store';

function getEmptyStore(): UserStoreData {
  return {
    profile: {
      id: 'user_default',
      fullName: '',
      email: '',
      targetRole: '',
      summary: '',
      updated_at: new Date().toISOString(),
    },
    skills: [],
    tools: [],
    memories: [],
    experience: [],
    education: [],
    projects: [],
    certificates: [],
    learningMilestones: [],
    interviews: [],
    atsScans: [],
    resumes: [],
    adviceList: [],
    report: null,
  };
}

export class MemoryStore {
  private data: UserStoreData;
  private listeners: Array<() => void> = [];

  constructor() {
    this.data = this.loadFromStorage();
  }

  private loadFromStorage(): UserStoreData {
    if (typeof window === 'undefined') {
      return getEmptyStore();
    }
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        return {
          ...getEmptyStore(),
          ...parsed,
        };
      }
    } catch {
      // Ignore parse failure, return clean empty store
    }
    return getEmptyStore();
  }

  private saveToStorage(): void {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
      } catch (err) {
        console.error('Failed to save to local store', err);
      }
    }
    this.notify();
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notify(): void {
    for (const listener of this.listeners) {
      try {
        listener();
      } catch (e) {
        console.error(e);
      }
    }
  }

  public getState(): UserStoreData {
    return this.data;
  }

  // Profile
  public getProfile(): Profile {
    return this.data.profile;
  }

  public updateProfile(updates: Partial<Profile>): void {
    const prevRole = this.data.profile.targetRole;
    this.data.profile = {
      ...this.data.profile,
      ...updates,
      updated_at: new Date().toISOString(),
    };

    // If target role changed, automatically populate recommended learning milestones from seeded resources if not already present
    if (updates.targetRole && updates.targetRole !== prevRole) {
      this.syncLearningMilestonesForRole(updates.targetRole);
    }

    this.saveToStorage();
  }

  // Sync learning milestones for target role
  public syncLearningMilestonesForRole(targetRoleName: string): void {
    const role = SEEDED_ROLES.find(r => r.roleName.toLowerCase() === targetRoleName.toLowerCase());
    if (!role) return;

    const existingSkillNames = new Set(this.data.learningMilestones.map(m => m.skillName.toLowerCase()));
    const newMilestones: LearningMilestone[] = [];

    for (const req of role.requiredSkills) {
      if (!existingSkillNames.has(req.name.toLowerCase())) {
        const matchingRes = SEEDED_RESOURCES.find(r => r.skillName.toLowerCase() === req.name.toLowerCase());
        if (matchingRes) {
          newMilestones.push({
            id: `milestone-${matchingRes.id}-${Date.now()}`,
            resourceId: matchingRes.id,
            skillName: req.name,
            title: matchingRes.title,
            provider: matchingRes.provider,
            effortHours: matchingRes.effortHours,
            officialUrl: matchingRes.officialUrl,
            targetRoleContribution: `Addresses core requirement for ${role.roleName} (target level ${req.level}/5)`,
            status: 'pending',
            user_edited: false,
            updated_at: new Date().toISOString(),
          });
        }
      }
    }

    if (newMilestones.length > 0) {
      this.data.learningMilestones = [...this.data.learningMilestones, ...newMilestones];
    }
  }

  // Skills
  public getSkills(): Skill[] {
    return this.data.skills;
  }

  public saveSkill(skill: Omit<Skill, 'id' | 'updated_at'>): { success: boolean; requiresConfirmation?: boolean; message?: string } {
    const existingIndex = this.data.skills.findIndex(
      s => s.name.toLowerCase().trim() === skill.name.toLowerCase().trim()
    );

    if (existingIndex >= 0) {
      const existing = this.data.skills[existingIndex];
      // Rule 4: If row has user_edited = true, AI may not overwrite it
      if (existing.user_edited && skill.source === 'chat') {
        return {
          success: false,
          requiresConfirmation: true,
          message: `You previously set ${existing.name} to level ${existing.level}/5 manually. Would you like to update it to ${skill.level}/5?`,
        };
      }

      this.data.skills[existingIndex] = {
        ...existing,
        level: skill.level,
        category: skill.category || existing.category,
        evidence: skill.evidence || existing.evidence,
        source: skill.source,
        user_edited: skill.user_edited,
        updated_at: new Date().toISOString(),
      };
    } else {
      this.data.skills.push({
        ...skill,
        id: `skill_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        updated_at: new Date().toISOString(),
      });
    }

    this.saveToStorage();
    return { success: true };
  }

  public updateSkillManual(id: string, updates: Partial<Skill>): void {
    const idx = this.data.skills.findIndex(s => s.id === id);
    if (idx >= 0) {
      this.data.skills[idx] = {
        ...this.data.skills[idx],
        ...updates,
        user_edited: true, // User manual edit flag
        source: 'manual',
        updated_at: new Date().toISOString(),
      };
      this.saveToStorage();
    }
  }

  public deleteSkill(id: string): void {
    this.data.skills = this.data.skills.filter(s => s.id !== id);
    this.saveToStorage();
  }

  // Tools
  public getTools(): ToolItem[] {
    return this.data.tools;
  }

  public saveTool(toolName: string, category = 'Software', source: SkillSource = 'chat'): void {
    const clean = toolName.trim();
    if (!clean) return;
    const existing = this.data.tools.find(t => t.name.toLowerCase() === clean.toLowerCase());
    if (!existing) {
      this.data.tools.push({
        id: `tool_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        name: clean,
        category,
        source,
        user_edited: source === 'manual',
        updated_at: new Date().toISOString(),
      });
      this.saveToStorage();
    }
  }

  public deleteTool(id: string): void {
    this.data.tools = this.data.tools.filter(t => t.id !== id);
    this.saveToStorage();
  }

  // Memories
  public getMemories(): MemoryFact[] {
    return this.data.memories;
  }

  public saveMemoryFact(key: string, label: string, value: string, source: SkillSource = 'chat', confidence = 0.9): { success: boolean; requiresConfirmation?: boolean; message?: string } {
    const existingIdx = this.data.memories.findIndex(m => m.key.toLowerCase() === key.toLowerCase());
    if (existingIdx >= 0) {
      const existing = this.data.memories[existingIdx];
      if (existing.user_edited && source === 'chat') {
        return {
          success: false,
          requiresConfirmation: true,
          message: `You previously set "${existing.label}" to "${existing.value}". Do you want me to update it to "${value}"?`,
        };
      }
      this.data.memories[existingIdx] = {
        ...existing,
        label,
        value,
        source,
        confidence,
        user_edited: source === 'manual',
        updated_at: new Date().toISOString(),
      };
    } else {
      this.data.memories.push({
        id: `mem_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        key,
        label,
        value,
        source,
        confidence,
        user_edited: source === 'manual',
        updated_at: new Date().toISOString(),
      });
    }

    this.saveToStorage();
    return { success: true };
  }

  public updateMemoryFact(id: string, updates: Partial<MemoryFact>): void {
    const idx = this.data.memories.findIndex(m => m.id === id);
    if (idx >= 0) {
      this.data.memories[idx] = {
        ...this.data.memories[idx],
        ...updates,
        user_edited: true,
        updated_at: new Date().toISOString(),
      };
      this.saveToStorage();
    }
  }

  public deleteMemoryFact(id: string): void {
    this.data.memories = this.data.memories.filter(m => m.id !== id);
    this.saveToStorage();
  }

  // Experience
  public getExperience(): ExperienceItem[] {
    return this.data.experience;
  }

  public saveExperience(exp: Omit<ExperienceItem, 'id' | 'updated_at'>): void {
    this.data.experience.push({
      ...exp,
      id: `exp_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      updated_at: new Date().toISOString(),
    });
    this.saveToStorage();
  }

  public updateExperience(id: string, updates: Partial<ExperienceItem>): void {
    const idx = this.data.experience.findIndex(e => e.id === id);
    if (idx >= 0) {
      this.data.experience[idx] = {
        ...this.data.experience[idx],
        ...updates,
        user_edited: true,
        updated_at: new Date().toISOString(),
      };
      this.saveToStorage();
    }
  }

  public deleteExperience(id: string): void {
    this.data.experience = this.data.experience.filter(e => e.id !== id);
    this.saveToStorage();
  }

  // Education
  public getEducation(): EducationItem[] {
    return this.data.education;
  }

  public saveEducation(edu: Omit<EducationItem, 'id' | 'updated_at'>): void {
    this.data.education.push({
      ...edu,
      id: `edu_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      updated_at: new Date().toISOString(),
    });
    this.saveToStorage();
  }

  public deleteEducation(id: string): void {
    this.data.education = this.data.education.filter(e => e.id !== id);
    this.saveToStorage();
  }

  // Projects
  public getProjects(): ProjectItem[] {
    return this.data.projects;
  }

  public saveProject(project: Omit<ProjectItem, 'id' | 'updated_at'>): void {
    this.data.projects.push({
      ...project,
      id: `proj_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      updated_at: new Date().toISOString(),
    });
    this.saveToStorage();
  }

  public updateProject(id: string, updates: Partial<ProjectItem>): void {
    const idx = this.data.projects.findIndex(p => p.id === id);
    if (idx >= 0) {
      this.data.projects[idx] = {
        ...this.data.projects[idx],
        ...updates,
        user_edited: true,
        updated_at: new Date().toISOString(),
      };
      this.saveToStorage();
    }
  }

  // Certificates
  public getCertificates(): CertificateItem[] {
    return this.data.certificates;
  }

  public saveCertificate(cert: Omit<CertificateItem, 'id' | 'updated_at'>): void {
    this.data.certificates.push({
      ...cert,
      id: `cert_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      updated_at: new Date().toISOString(),
    });
    this.saveToStorage();
  }

  public deleteCertificate(id: string): void {
    this.data.certificates = this.data.certificates.filter(c => c.id !== id);
    this.saveToStorage();
  }

  // Learning Milestones
  public getLearningMilestones(): LearningMilestone[] {
    return this.data.learningMilestones;
  }

  public updateMilestoneStatus(id: string, status: LearningMilestone['status']): void {
    const idx = this.data.learningMilestones.findIndex(m => m.id === id);
    if (idx >= 0) {
      const milestone = this.data.learningMilestones[idx];
      this.data.learningMilestones[idx] = {
        ...milestone,
        status,
        user_edited: true,
        completedAt: status === 'completed' ? new Date().toISOString() : undefined,
        updated_at: new Date().toISOString(),
      };

      // If completed, boost user skill level for this skill
      if (status === 'completed') {
        const existingSkill = this.data.skills.find(
          s => s.name.toLowerCase() === milestone.skillName.toLowerCase()
        );
        if (existingSkill) {
          const newLevel = Math.min(5, Math.max(existingSkill.level + 1, 3));
          this.saveSkill({
            name: existingSkill.name,
            category: existingSkill.category,
            level: newLevel,
            evidence: `Completed coursework: ${milestone.title} (${milestone.provider})`,
            source: 'course',
            user_edited: false,
          });
        } else {
          this.saveSkill({
            name: milestone.skillName,
            category: 'technical',
            level: 3,
            evidence: `Completed coursework: ${milestone.title} (${milestone.provider})`,
            source: 'course',
            user_edited: false,
          });
        }
      }

      this.saveToStorage();
    }
  }

  // Interview Sessions
  public getInterviews(): InterviewSession[] {
    return this.data.interviews;
  }

  public saveInterview(interview: InterviewSession): void {
    this.data.interviews.push(interview);
    this.saveToStorage();
  }

  // ATS Scans
  public getAtsScans(): ATSScanResult[] {
    return this.data.atsScans;
  }

  public saveAtsScan(scan: ATSScanResult): void {
    this.data.atsScans.unshift(scan); // newest first
    this.saveToStorage();
  }

  // Resumes
  public getResumes(): ResumeData[] {
    return this.data.resumes;
  }

  public saveResume(resume: ResumeData): void {
    const idx = this.data.resumes.findIndex(r => r.id === resume.id);
    if (idx >= 0) {
      this.data.resumes[idx] = resume;
    } else {
      this.data.resumes.unshift(resume);
    }
    this.saveToStorage();
  }

  // Advice
  public getAdviceList(): AdviceItem[] {
    return this.data.adviceList;
  }

  public saveAdvice(advice: AdviceItem): void {
    this.data.adviceList.unshift(advice);
    this.saveToStorage();
  }

  public toggleAdviceSaveToPlan(id: string): void {
    const item = this.data.adviceList.find(a => a.id === id);
    if (item) {
      item.savedToPlan = !item.savedToPlan;
      this.saveToStorage();
    }
  }

  // Report
  public getReport(): ConsultantReport | null {
    return this.data.report;
  }

  public saveReport(report: ConsultantReport): void {
    this.data.report = report;
    this.saveToStorage();
  }

  // Reset to initial clean empty state
  public resetToEmpty(): void {
    this.data = getEmptyStore();
    this.saveToStorage();
  }
}

// Global singleton instance for easy client-side reactivity
export const memoryStore = new MemoryStore();

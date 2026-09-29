import React from 'react';
import {
  Sparkles,
  ArrowRight,
  Target,
  Award,
  AlertCircle,
  CheckCircle2,
  BookOpen,
  FileText,
  UserCheck,
  TrendingUp,
} from 'lucide-react';
import { MemoryStore } from '../../lib/data/store';
import { calculateCareerReadiness } from '../../lib/readiness';
import { deriveJourneyStage } from '../../lib/orchestrator';
import { SEEDED_ROLES } from '../../lib/data/seed';
import { JourneyStepper } from '../common/JourneyStepper';
import { ProgressBar } from '../common/ProgressBar';

interface DashboardViewProps {
  store: MemoryStore;
  onNavigateToTab: (tab: string) => void;
  onOpenReadinessModal: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  store,
  onNavigateToTab,
  onOpenReadinessModal,
}) => {
  const state = store.getState();
  const profile = state.profile;
  const skills = state.skills;
  const tools = state.tools;
  const milestones = state.learningMilestones;
  const projects = state.projects;
  const certs = state.certificates;
  const interviews = state.interviews;

  const targetRoleObj = SEEDED_ROLES.find(
    r => r.roleName.toLowerCase() === profile.targetRole?.toLowerCase()
  );

  const readiness = calculateCareerReadiness(
    targetRoleObj,
    skills,
    tools,
    milestones,
    projects,
    certs,
    interviews
  );

  const journey = deriveJourneyStage(
    profile,
    targetRoleObj,
    skills,
    milestones,
    projects,
    interviews
  );

  // Empty State Rule per Section 8:
  // "Dashboard before a goal exists says 'Tell me about your goals in the Companion to get started', with readiness shown as 'Not started', never 0% as if calculated."
  if (!profile.targetRole) {
    return (
      <div className="flex-1 p-8 max-w-4xl mx-auto space-y-6">
        <div className="bg-white border border-[#D5DADD] rounded-[6px] p-8 text-center space-y-4">
          <div className="w-12 h-12 rounded-[4px] bg-[#EBF5FF] text-[#0070F2] flex items-center justify-center mx-auto">
            <Target className="w-6 h-6 stroke-[1.5]" />
          </div>
          <div>
            <h2 className="text-xl font-bold font-display text-[#1D2D3E]">
              Tell me about your goals in the Companion to get started
            </h2>
            <p className="text-xs text-[#556B82] max-w-md mx-auto mt-2 leading-relaxed">
              ReturnPath creates a personalized career re-entry journey with zero fake personas. Start by having a brief conversation with your Career Companion about your previous experience and target role.
            </p>
          </div>

          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#F5F6F7] border border-[#D5DADD] rounded-[4px] text-xs">
            <span className="text-[#556B82]">Career Readiness Status:</span>
            <span className="font-semibold text-[#0070F2] font-display">Not started</span>
          </div>

          <div className="pt-2">
            <button
              onClick={() => onNavigateToTab('companion')}
              className="px-5 py-2.5 bg-[#0070F2] hover:bg-[#0064D9] text-white rounded-[4px] font-display font-semibold text-xs transition-colors inline-flex items-center gap-2"
            >
              <span>Talk to Career Companion</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Supported Benchmark Roles Showcase */}
        <div className="bg-white border border-[#D5DADD] rounded-[6px] p-6 space-y-3">
          <span className="section-label">Supported Benchmark Target Roles</span>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {SEEDED_ROLES.slice(0, 3).map(role => (
              <div
                key={role.id}
                onClick={() => {
                  store.updateProfile({ targetRole: role.roleName });
                  onNavigateToTab('companion');
                }}
                className="p-3.5 border border-[#EAEDEF] rounded-[4px] hover:border-[#0070F2] hover:bg-[#EBF5FF]/30 transition-all cursor-pointer group"
              >
                <span className="text-[10px] uppercase font-bold text-[#0070F2] block mb-1">
                  {role.sector}
                </span>
                <h4 className="text-xs font-bold font-display text-[#1D2D3E] group-hover:text-[#0070F2]">
                  {role.roleName}
                </h4>
                <p className="text-[11px] text-[#556B82] mt-1 line-clamp-2">
                  {role.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Active Journey Dashboard
  const activeMilestones = milestones.filter(m => m.status !== 'skipped' && m.status !== 'not_relevant');
  const completedMilestones = activeMilestones.filter(m => m.status === 'completed');

  return (
    <div className="flex-1 p-6 max-w-5xl mx-auto space-y-6">
      {/* Journey Stepper Component */}
      <div className="bg-white border border-[#D5DADD] rounded-[6px] p-4">
        <div className="flex items-center justify-between px-4 pb-2 border-b border-[#EAEDEF] mb-3">
          <span className="section-label">Current Journey Phase</span>
          <span className="text-xs font-display font-semibold text-[#0070F2]">
            {journey.currentStage} · {journey.stageProgress}%
          </span>
        </div>
        <JourneyStepper
          currentStage={journey.currentStage}
          onSelectStage={stage => {
            if (stage === 'DISCOVER') onNavigateToTab('companion');
            else if (stage === 'SKILL GAP' || stage === 'LEARN') onNavigateToTab('learning');
            else if (stage === 'BUILD') onNavigateToTab('interview');
            else if (stage === 'PRACTICE') onNavigateToTab('interview');
            else if (stage === 'MATCH') onNavigateToTab('jobs');
          }}
        />
        <div className="mt-2 px-4 py-2 bg-[#F5F6F7] rounded-[4px] flex items-center justify-between text-xs">
          <span className="text-[#1D2D3E] font-medium">
            {journey.stageDescription}
          </span>
          <span className="text-[#556B82] hidden md:inline">
            Next: {journey.nextStepPrompt}
          </span>
        </div>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Career Readiness Card */}
        <div className="bg-white border border-[#D5DADD] rounded-[6px] p-5 space-y-4">
          <div className="flex items-center justify-between">
            <span className="section-label">Career Readiness</span>
            <button
              onClick={onOpenReadinessModal}
              className="text-[11px] text-[#0070F2] font-semibold hover:underline"
            >
              Audit Details
            </button>
          </div>

          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold font-display text-[#0070F2]">
              {readiness.totalScore}%
            </span>
            <span className="text-xs text-[#556B82]">
              target for {profile.targetRole}
            </span>
          </div>

          <ProgressBar value={readiness.totalScore} height={8} />

          <div className="space-y-2 pt-2 border-t border-[#EAEDEF] text-xs">
            <div className="flex justify-between text-[#556B82]">
              <span>Skills Coverage (35%)</span>
              <span className="font-mono text-[#1D2D3E] font-semibold">{readiness.skillsScore} pts</span>
            </div>
            <div className="flex justify-between text-[#556B82]">
              <span>Tools & Software (10%)</span>
              <span className="font-mono text-[#1D2D3E] font-semibold">{readiness.toolsScore} pts</span>
            </div>
            <div className="flex justify-between text-[#556B82]">
              <span>Learning Progress (20%)</span>
              <span className="font-mono text-[#1D2D3E] font-semibold">{readiness.learningScore} pts</span>
            </div>
            <div className="flex justify-between text-[#556B82]">
              <span>Projects (15%)</span>
              <span className="font-mono text-[#1D2D3E] font-semibold">{readiness.projectsScore} pts</span>
            </div>
            <div className="flex justify-between text-[#556B82]">
              <span>Interview Readiness (15%)</span>
              <span className="font-mono text-[#1D2D3E] font-semibold">{readiness.interviewScore} pts</span>
            </div>
          </div>
        </div>

        {/* Target Role & Gaps Card */}
        <div className="bg-white border border-[#D5DADD] rounded-[6px] p-5 flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="section-label">Target Role Overview</span>
              <span className="text-[11px] text-[#0070F2] bg-[#EBF5FF] px-2 py-0.5 rounded font-medium">
                {targetRoleObj?.sector || 'Active Track'}
              </span>
            </div>

            <h3 className="text-base font-bold font-display text-[#1D2D3E]">
              {profile.targetRole}
            </h3>

            <p className="text-xs text-[#556B82] mt-1.5 leading-relaxed">
              {targetRoleObj?.description || 'Personalized career track tailored to your background.'}
            </p>

            {profile.careerGapReason && (
              <div className="mt-3 p-2 bg-[#F5F6F7] border border-[#EAEDEF] rounded-[4px] text-xs">
                <span className="text-[10px] uppercase font-bold text-[#556B82] block">Career Break Handled</span>
                <span className="text-[#1D2D3E]">{profile.careerGapReason}</span>
              </div>
            )}
          </div>

          <div className="pt-3 border-t border-[#EAEDEF]">
            <button
              onClick={() => onNavigateToTab('learning')}
              className="w-full py-2 bg-[#F5F6F7] hover:bg-[#EBF5FF] text-[#0070F2] border border-[#D5DADD] hover:border-[#0070F2]/40 rounded-[4px] text-xs font-semibold font-display flex items-center justify-center gap-1.5 transition-colors"
            >
              <span>Inspect Skill Gaps & Milestones</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Recommended Action Card */}
        <div className="bg-white border border-[#D5DADD] rounded-[6px] p-5 flex flex-col justify-between space-y-4">
          <div>
            <span className="section-label block mb-2">Prioritized Next Action</span>
            <div className="p-3 bg-[#EBF5FF] border border-[#0070F2]/20 rounded-[4px] space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-[#0070F2] font-display">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Recommended Next Step</span>
              </div>
              <p className="text-xs text-[#1D2D3E] leading-relaxed">
                {journey.nextStepPrompt}
              </p>
            </div>

            <div className="mt-3 text-xs text-[#556B82] space-y-1">
              <p>• Coursework completed: {completedMilestones.length} / {activeMilestones.length || 0}</p>
              <p>• Mock interviews completed: {interviews.length}</p>
              <p>• Portfolio projects on file: {projects.length}</p>
            </div>
          </div>

          <div className="pt-3 border-t border-[#EAEDEF] space-y-2">
            <button
              onClick={() => onNavigateToTab('companion')}
              className="w-full py-2 bg-[#0070F2] hover:bg-[#0064D9] text-white rounded-[4px] text-xs font-semibold font-display flex items-center justify-center gap-1.5 transition-colors"
            >
              <span>Consult Career Companion</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Quick Launchpad to Core Tools */}
      <div className="bg-white border border-[#D5DADD] rounded-[6px] p-5 space-y-3">
        <span className="section-label">Career Journey Modules</span>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <button
            onClick={() => onNavigateToTab('learning')}
            className="p-3 border border-[#EAEDEF] hover:border-[#0070F2] rounded-[4px] text-left hover:bg-[#F5F6F7] transition-all group"
          >
            <BookOpen className="w-4 h-4 text-[#0070F2] mb-1.5" />
            <h4 className="text-xs font-bold font-display text-[#1D2D3E] group-hover:text-[#0070F2]">
              Learning Path
            </h4>
            <p className="text-[11px] text-[#556B82] mt-0.5">
              Targeted accredited coursework
            </p>
          </button>

          <button
            onClick={() => onNavigateToTab('resume')}
            className="p-3 border border-[#EAEDEF] hover:border-[#0070F2] rounded-[4px] text-left hover:bg-[#F5F6F7] transition-all group"
          >
            <FileText className="w-4 h-4 text-[#0070F2] mb-1.5" />
            <h4 className="text-xs font-bold font-display text-[#1D2D3E] group-hover:text-[#0070F2]">
              ATS Resume
            </h4>
            <p className="text-[11px] text-[#556B82] mt-0.5">
              100-pt check & single-column builder
            </p>
          </button>

          <button
            onClick={() => onNavigateToTab('interview')}
            className="p-3 border border-[#EAEDEF] hover:border-[#0070F2] rounded-[4px] text-left hover:bg-[#F5F6F7] transition-all group"
          >
            <UserCheck className="w-4 h-4 text-[#0070F2] mb-1.5" />
            <h4 className="text-xs font-bold font-display text-[#1D2D3E] group-hover:text-[#0070F2]">
              Interview Coach
            </h4>
            <p className="text-[11px] text-[#556B82] mt-0.5">
              Mock technical & career break practice
            </p>
          </button>

          <button
            onClick={() => onNavigateToTab('report')}
            className="p-3 border border-[#EAEDEF] hover:border-[#0070F2] rounded-[4px] text-left hover:bg-[#F5F6F7] transition-all group"
          >
            <TrendingUp className="w-4 h-4 text-[#0070F2] mb-1.5" />
            <h4 className="text-xs font-bold font-display text-[#1D2D3E] group-hover:text-[#0070F2]">
              Consultant Report
            </h4>
            <p className="text-[11px] text-[#556B82] mt-0.5">
              30/60/90 day plan & executive PDF
            </p>
          </button>
        </div>
      </div>
    </div>
  );
};

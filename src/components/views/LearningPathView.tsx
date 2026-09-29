import React, { useState } from 'react';
import {
  Route,
  CheckCircle,
  ExternalLink,
  Clock,
  BookOpen,
  Award,
  AlertCircle,
  Check,
  X,
  SkipForward,
  Filter,
} from 'lucide-react';
import { MemoryStore } from '../../lib/data/store';
import { performSkillGapAnalysis, generateCompanionAnnouncement } from '../../lib/agents/skillgap';
import { LearningMilestone, LearningDecision } from '../../lib/types';
import { ProgressBar } from '../common/ProgressBar';

interface LearningPathViewProps {
  store: MemoryStore;
  onNavigateToTab?: (tab: string) => void;
}

export const LearningPathView: React.FC<LearningPathViewProps> = ({ store, onNavigateToTab }) => {
  const state = store.getState();
  const profile = state.profile;
  const skills = state.skills;
  const tools = state.tools;
  const milestones = state.learningMilestones;

  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'in_progress' | 'completed'>('all');
  const [announcement, setAnnouncement] = useState<string | null>(null);

  const gapAnalysis = performSkillGapAnalysis(profile.targetRole || '', skills, tools);

  const handleUpdateStatus = (milestone: LearningMilestone, newStatus: LearningDecision) => {
    store.updateMilestoneStatus(milestone.id, newStatus);

    if (newStatus === 'completed') {
      const remainingGaps = performSkillGapAnalysis(profile.targetRole || '', store.getSkills(), tools);
      const text = generateCompanionAnnouncement(milestone.title, milestone.skillName, remainingGaps.items);
      setAnnouncement(text);
    }
  };

  const filteredMilestones = milestones.filter(m => {
    if (filterStatus === 'all') return true;
    return m.status === filterStatus;
  });

  if (!profile.targetRole) {
    return (
      <div className="flex-1 p-8 max-w-4xl mx-auto">
        <div className="bg-white border border-[#D5DADD] rounded-[6px] p-8 text-center space-y-4">
          <Route className="w-12 h-12 text-[#0070F2] stroke-[1.5] mx-auto" />
          <h2 className="text-xl font-bold font-display text-[#1D2D3E]">
            No Target Role Selected
          </h2>
          <p className="text-xs text-[#556B82] max-w-md mx-auto leading-relaxed">
            The adaptive learning path dynamically benchmarks requirements against your chosen career target. Please select a role in your Career Memory or discuss it with your Companion.
          </p>
          <button
            onClick={() => onNavigateToTab?.('memory')}
            className="px-4 py-2 bg-[#0070F2] text-white rounded-[4px] text-xs font-semibold font-display hover:bg-[#0064D9]"
          >
            Select Target Role
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 p-6 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[#EAEDEF] gap-2">
        <div>
          <span className="section-label">Agent 2: Adaptive Skill Gap Engine</span>
          <h2 className="text-xl font-bold font-display text-[#1D2D3E]">
            Skill Gaps & Adaptive Learning Path
          </h2>
          <p className="text-xs text-[#556B82] mt-0.5">
            Requirements benchmarked for <strong className="text-[#0070F2] font-display">{profile.targetRole}</strong>.
          </p>
        </div>
      </div>

      {/* Companion Announcement Toast */}
      {announcement && (
        <div className="p-4 bg-[#EBF5FF] border border-[#0070F2]/40 rounded-[6px] text-xs text-[#1D2D3E] flex items-start justify-between gap-3 animate-in fade-in duration-200">
          <div className="flex items-start gap-2">
            <CheckCircle className="w-4 h-4 text-[#0070F2] flex-shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-[#0070F2] font-display block">Career Companion Announcement:</span>
              <p className="leading-relaxed mt-0.5">{announcement}</p>
            </div>
          </div>
          <button
            onClick={() => setAnnouncement(null)}
            className="text-[#556B82] hover:text-[#1D2D3E] p-1"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* 1. Skill Gap Analysis Table */}
      <div className="bg-white border border-[#D5DADD] rounded-[6px] p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <span className="section-label">Competency Gap Audit</span>
            <p className="text-xs text-[#556B82]">
              {gapAnalysis.summaryMessage}
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="px-2 py-0.5 bg-[#188918]/10 text-[#188918] font-semibold rounded">
              {gapAnalysis.items.filter(i => i.isCovered).length} Covered
            </span>
            <span className="px-2 py-0.5 bg-[#E76500]/10 text-[#E76500] font-semibold rounded">
              {gapAnalysis.totalGapsCount} Gaps Remaining
            </span>
          </div>
        </div>

        <div className="divide-y divide-[#EAEDEF] border border-[#EAEDEF] rounded-[4px] overflow-hidden text-xs">
          {gapAnalysis.items.map(item => (
            <div
              key={item.skillName}
              className="p-3.5 flex flex-col md:flex-row md:items-center justify-between gap-3 hover:bg-[#F5F6F7]/50 transition-colors"
            >
              <div className="space-y-0.5 max-w-sm">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-[#1D2D3E] font-display text-sm">
                    {item.skillName}
                  </span>
                  <span className="text-[10px] text-[#556B82] border border-[#EAEDEF] px-1.5 py-0.2 rounded capitalize">
                    {item.category}
                  </span>
                </div>
                <p className="text-[11px] text-[#556B82]">
                  Verification Source: <strong className="text-[#1D2D3E]">{item.source}</strong>
                </p>
              </div>

              {/* Levels comparison */}
              <div className="flex items-center gap-4">
                <div className="space-y-1 w-48">
                  <div className="flex justify-between text-[11px] text-[#556B82]">
                    <span>Current: <strong className="text-[#1D2D3E]">{item.userLevel}/5</strong></span>
                    <span>Required: <strong className="text-[#0070F2]">{item.requiredLevel}/5</strong></span>
                  </div>
                  <ProgressBar
                    value={item.userLevel}
                    max={item.requiredLevel}
                    height={6}
                    color={item.isCovered ? '#188918' : '#0070F2'}
                  />
                </div>

                <div className="w-24 text-right">
                  {item.isCovered ? (
                    <span className="text-[11px] font-bold text-[#188918] bg-[#188918]/10 px-2 py-0.5 rounded">
                      Satisfied
                    </span>
                  ) : (
                    <span className="text-[11px] font-bold text-[#E76500] bg-[#E76500]/10 px-2 py-0.5 rounded">
                      Gap: {item.gap} lvl
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Missing Tools Callout */}
        {gapAnalysis.missingTools.length > 0 && (
          <div className="p-3 bg-[#F5F6F7] border border-[#EAEDEF] rounded-[4px] text-xs space-y-1">
            <span className="font-bold text-[#1D2D3E] font-display">Required Tools to Add:</span>
            <div className="flex flex-wrap gap-1.5 pt-1">
              {gapAnalysis.missingTools.map(t => (
                <span
                  key={t}
                  className="px-2 py-0.5 bg-white border border-[#D5DADD] text-[#E76500] rounded text-[11px] font-semibold"
                >
                  {t} (missing)
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 2. Adaptive Learning Path Milestones */}
      <div className="bg-white border border-[#D5DADD] rounded-[6px] p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2 border-b border-[#EAEDEF] gap-2">
          <div>
            <span className="section-label">Tailored Milestones ({milestones.length})</span>
            <p className="text-xs text-[#556B82]">
              Official accredited curriculum from real providers. You decide whether to Accept, Edit, or Skip.
            </p>
          </div>

          {/* Filter tabs */}
          <div className="flex items-center gap-1 text-xs">
            {(['all', 'pending', 'in_progress', 'completed'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setFilterStatus(tab)}
                className={`px-2.5 py-1 rounded-[4px] capitalize transition-colors ${
                  filterStatus === tab
                    ? 'bg-[#EBF5FF] text-[#0070F2] font-semibold border border-[#0070F2]/30'
                    : 'text-[#556B82] hover:bg-[#F5F6F7]'
                }`}
              >
                {tab.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>

        {filteredMilestones.length === 0 ? (
          <div className="text-center py-8 text-xs text-[#556B82] italic">
            No milestones matching the active filter.
          </div>
        ) : (
          <div className="space-y-3">
            {filteredMilestones.map(m => (
              <div
                key={m.id}
                className="p-4 border border-[#D5DADD] rounded-[6px] bg-white hover:border-[#0070F2] transition-colors space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 bg-[#EBF5FF] text-[#0070F2] rounded text-[10px] font-bold">
                        {m.skillName}
                      </span>
                      <span className="text-[11px] text-[#556B82] flex items-center gap-1 font-mono">
                        <Clock className="w-3 h-3" />
                        {m.effortHours}h effort
                      </span>
                      <span className="text-[11px] text-[#556B82]">· {m.provider}</span>
                    </div>

                    <h4 className="text-sm font-bold font-display text-[#1D2D3E]">
                      {m.title}
                    </h4>

                    <p className="text-xs text-[#556B82] leading-relaxed">
                      {m.targetRoleContribution}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <a
                      href={m.officialUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-2.5 py-1 bg-[#F5F6F7] hover:bg-[#EBF5FF] text-[#0070F2] border border-[#D5DADD] rounded-[4px] text-xs font-medium flex items-center gap-1 transition-colors"
                    >
                      <span>Course Page</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>

                {/* Status Actions: Accept / Edit / Skip / Not Relevant / Complete */}
                <div className="pt-2 border-t border-[#EAEDEF] flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] text-[#556B82]">Status:</span>
                    <span
                      className={`font-semibold capitalize px-2 py-0.5 rounded text-[11px] ${
                        m.status === 'completed'
                          ? 'bg-[#188918]/10 text-[#188918]'
                          : m.status === 'in_progress'
                          ? 'bg-[#0070F2]/10 text-[#0070F2]'
                          : m.status === 'accepted'
                          ? 'bg-[#EBF5FF] text-[#0070F2]'
                          : 'bg-[#F5F6F7] text-[#556B82]'
                      }`}
                    >
                      {m.status.replace('_', ' ')}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {m.status !== 'completed' && (
                      <button
                        onClick={() => handleUpdateStatus(m, 'completed')}
                        className="px-2.5 py-1 bg-[#188918] hover:bg-[#157715] text-white rounded-[4px] font-semibold text-xs flex items-center gap-1 transition-colors"
                      >
                        <Check className="w-3 h-3" />
                        <span>Mark Completed</span>
                      </button>
                    )}

                    {m.status === 'pending' && (
                      <button
                        onClick={() => handleUpdateStatus(m, 'accepted')}
                        className="px-2.5 py-1 bg-[#0070F2] hover:bg-[#0064D9] text-white rounded-[4px] text-xs font-semibold transition-colors"
                      >
                        Accept
                      </button>
                    )}

                    {m.status === 'accepted' && (
                      <button
                        onClick={() => handleUpdateStatus(m, 'in_progress')}
                        className="px-2.5 py-1 bg-[#0070F2] text-white rounded-[4px] text-xs font-semibold"
                      >
                        Start Learning
                      </button>
                    )}

                    {m.status !== 'skipped' && m.status !== 'completed' && (
                      <button
                        onClick={() => handleUpdateStatus(m, 'skipped')}
                        className="px-2 py-1 bg-white border border-[#D5DADD] hover:bg-[#F5F6F7] text-[#556B82] rounded-[4px] text-xs transition-colors"
                      >
                        Skip
                      </button>
                    )}

                    {m.status !== 'not_relevant' && m.status !== 'completed' && (
                      <button
                        onClick={() => handleUpdateStatus(m, 'not_relevant')}
                        className="px-2 py-1 bg-white border border-[#D5DADD] hover:bg-[#F5F6F7] text-[#556B82] rounded-[4px] text-xs transition-colors"
                      >
                        Not Relevant
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

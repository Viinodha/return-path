import React, { useState } from 'react';
import {
  Database,
  Plus,
  Trash2,
  Edit2,
  Check,
  X,
  Target,
  Wrench,
  GraduationCap,
  Briefcase,
  Award,
  Layers,
  Info,
} from 'lucide-react';
import { MemoryStore } from '../../lib/data/store';
import { Skill, ToolItem, ExperienceItem, EducationItem, ProjectItem, CertificateItem, MemoryFact } from '../../lib/types';
import { SEEDED_ROLES } from '../../lib/data/seed';

interface CareerMemoryViewProps {
  store: MemoryStore;
}

export const CareerMemoryView: React.FC<CareerMemoryViewProps> = ({ store }) => {
  const state = store.getState();
  const profile = state.profile;
  const skills = state.skills;
  const tools = state.tools;
  const experience = state.experience;
  const education = state.education;
  const projects = state.projects;
  const certificates = state.certificates;
  const memories = state.memories;

  // Modals / Editing states
  const [editingSkill, setEditingSkill] = useState<Skill | null>(null);
  const [isAddingSkill, setIsAddingSkill] = useState(false);
  const [newSkillName, setNewSkillName] = useState('');
  const [newSkillLevel, setNewSkillLevel] = useState(3);
  const [newSkillCategory, setNewSkillCategory] = useState<'core' | 'technical' | 'domain' | 'soft'>('technical');

  const [newToolName, setNewToolName] = useState('');
  const [isAddingTool, setIsAddingTool] = useState(false);

  const [editingTargetRole, setEditingTargetRole] = useState(false);
  const [targetRoleInput, setTargetRoleInput] = useState(profile.targetRole || '');

  const [editingGap, setEditingGap] = useState(false);
  const [gapMonthsInput, setGapMonthsInput] = useState(profile.careerGapMonths || 18);
  const [gapReasonInput, setGapReasonInput] = useState(profile.careerGapReason || 'Family Caregiving & Transition');

  const handleSaveNewSkill = () => {
    if (!newSkillName.trim()) return;
    store.saveSkill({
      name: newSkillName.trim(),
      category: newSkillCategory,
      level: newSkillLevel,
      evidence: 'Manually verified by user',
      source: 'manual',
      user_edited: true,
    });
    setNewSkillName('');
    setIsAddingSkill(false);
  };

  const handleSaveNewTool = () => {
    if (!newToolName.trim()) return;
    store.saveTool(newToolName.trim(), 'Software', 'manual');
    setNewToolName('');
    setIsAddingTool(false);
  };

  return (
    <div className="flex-1 p-6 max-w-5xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[#EAEDEF] gap-2">
        <div>
          <span className="section-label">Persistent Memory Layer</span>
          <h2 className="text-xl font-bold font-display text-[#1D2D3E]">
            Career Memory Store
          </h2>
          <p className="text-xs text-[#556B82] mt-0.5">
            You own your data. AI recommendations will never silently overwrite items you edit manually.
          </p>
        </div>
      </div>

      {/* 1. Target Role & Career Goal */}
      <div className="bg-white border border-[#D5DADD] rounded-[6px] p-5 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Target className="w-4 h-4 text-[#0070F2]" />
            <span className="section-label">1. Target Career Role</span>
          </div>
          {!editingTargetRole ? (
            <button
              onClick={() => {
                setTargetRoleInput(profile.targetRole || '');
                setEditingTargetRole(true);
              }}
              className="text-xs text-[#0070F2] font-semibold hover:underline flex items-center gap-1"
            >
              <Edit2 className="w-3 h-3" />
              <span>Edit Goal</span>
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  store.updateProfile({ targetRole: targetRoleInput.trim() });
                  setEditingTargetRole(false);
                }}
                className="px-2.5 py-1 bg-[#0070F2] text-white rounded-[4px] text-xs font-semibold"
              >
                Save
              </button>
              <button
                onClick={() => setEditingTargetRole(false)}
                className="px-2 py-1 bg-[#F5F6F7] border border-[#D5DADD] rounded-[4px] text-xs"
              >
                Cancel
              </button>
            </div>
          )}
        </div>

        {!editingTargetRole ? (
          <div className="flex flex-wrap items-center gap-2">
            {profile.targetRole ? (
              <span className="px-3 py-1.5 bg-[#EBF5FF] border border-[#0070F2]/30 text-[#0070F2] font-bold font-display text-sm rounded-[4px]">
                {profile.targetRole}
              </span>
            ) : (
              <span className="text-xs text-[#556B82] italic">
                No target role set yet. Choose a benchmark role below or tell your Companion.
              </span>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            <select
              value={targetRoleInput}
              onChange={e => setTargetRoleInput(e.target.value)}
              className="w-full text-xs p-2 border border-[#D5DADD] rounded-[4px] bg-white outline-none focus:border-[#0070F2]"
            >
              <option value="">Select a benchmark role...</option>
              {SEEDED_ROLES.map(r => (
                <option key={r.id} value={r.roleName}>
                  {r.roleName} ({r.sector})
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* 2. Career Break Narrative */}
      <div className="bg-white border border-[#D5DADD] rounded-[6px] p-5 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-[#0070F2]" />
            <span className="section-label">2. Career Break / Gap Framing</span>
          </div>
          {!editingGap ? (
            <button
              onClick={() => {
                setGapReasonInput(profile.careerGapReason || '');
                setGapMonthsInput(profile.careerGapMonths || 18);
                setEditingGap(true);
              }}
              className="text-xs text-[#0070F2] font-semibold hover:underline flex items-center gap-1"
            >
              <Edit2 className="w-3 h-3" />
              <span>Edit Framing</span>
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  store.updateProfile({
                    careerGapReason: gapReasonInput.trim(),
                    careerGapMonths: Number(gapMonthsInput),
                  });
                  setEditingGap(false);
                }}
                className="px-2.5 py-1 bg-[#0070F2] text-white rounded-[4px] text-xs font-semibold"
              >
                Save
              </button>
              <button
                onClick={() => setEditingGap(false)}
                className="px-2 py-1 bg-[#F5F6F7] border border-[#D5DADD] rounded-[4px] text-xs"
              >
                Cancel
              </button>
            </div>
          )}
        </div>

        {!editingGap ? (
          <div className="p-3 bg-[#F5F6F7] rounded-[4px] text-xs text-[#1D2D3E]">
            <p className="font-semibold text-[#1D2D3E]">
              {profile.careerGapReason || 'No career break specified yet'}
            </p>
            <p className="text-[11px] text-[#556B82] mt-0.5">
              Duration: {profile.careerGapMonths ? `${profile.careerGapMonths} months (${(profile.careerGapMonths / 12).toFixed(1)} yrs)` : 'Not specified'}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            <input
              type="text"
              value={gapReasonInput}
              onChange={e => setGapReasonInput(e.target.value)}
              placeholder="e.g. Family Caregiving & Professional Upskilling"
              className="w-full text-xs p-2 border border-[#D5DADD] rounded-[4px] outline-none focus:border-[#0070F2]"
            />
            <div className="flex items-center gap-2">
              <label className="text-xs text-[#556B82]">Duration (Months):</label>
              <input
                type="number"
                value={gapMonthsInput}
                onChange={e => setGapMonthsInput(Number(e.target.value))}
                className="w-24 text-xs p-1.5 border border-[#D5DADD] rounded-[4px] outline-none focus:border-[#0070F2]"
              />
            </div>
          </div>
        )}
      </div>

      {/* 3. Skills Matrix (0 to 5) */}
      <div className="bg-white border border-[#D5DADD] rounded-[6px] p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <span className="section-label">3. Core Competencies & Skills ({skills.length})</span>
            <p className="text-[11px] text-[#556B82]">
              Levels range from 0 to 5. Hover over any row to inspect its verification source.
            </p>
          </div>
          <button
            onClick={() => setIsAddingSkill(true)}
            className="px-3 py-1.5 bg-[#0070F2] hover:bg-[#0064D9] text-white rounded-[4px] text-xs font-semibold font-display flex items-center gap-1.5 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Skill</span>
          </button>
        </div>

        {/* Add Skill Form */}
        {isAddingSkill && (
          <div className="p-3 bg-[#F5F6F7] border border-[#D5DADD] rounded-[4px] space-y-2 text-xs">
            <span className="font-bold text-[#1D2D3E] font-display">Add Verified Skill</span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <input
                type="text"
                placeholder="Skill name (e.g. SQL Querying)"
                value={newSkillName}
                onChange={e => setNewSkillName(e.target.value)}
                className="p-1.5 border border-[#D5DADD] rounded-[4px] bg-white outline-none focus:border-[#0070F2]"
              />
              <select
                value={newSkillCategory}
                onChange={e => setNewSkillCategory(e.target.value as any)}
                className="p-1.5 border border-[#D5DADD] rounded-[4px] bg-white outline-none focus:border-[#0070F2]"
              >
                <option value="technical">Technical</option>
                <option value="core">Core / Analytical</option>
                <option value="domain">Domain</option>
                <option value="soft">Soft / Communication</option>
              </select>
              <div className="flex items-center gap-2">
                <label className="text-[#556B82]">Level (0-5):</label>
                <input
                  type="number"
                  min={0}
                  max={5}
                  value={newSkillLevel}
                  onChange={e => setNewSkillLevel(Number(e.target.value))}
                  className="w-16 p-1.5 border border-[#D5DADD] rounded-[4px] bg-white outline-none focus:border-[#0070F2]"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <button
                onClick={handleSaveNewSkill}
                className="px-3 py-1 bg-[#0070F2] text-white rounded-[4px] font-semibold"
              >
                Add Skill
              </button>
              <button
                onClick={() => setIsAddingSkill(false)}
                className="px-2.5 py-1 bg-white border border-[#D5DADD] rounded-[4px]"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Skills Table */}
        {skills.length === 0 ? (
          <div className="text-center py-6 border border-dashed border-[#D5DADD] rounded-[4px]">
            <p className="text-xs text-[#556B82] italic">
              No skills added yet. Discuss your skills with Companion or click Add Skill above.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-[#EAEDEF] border border-[#EAEDEF] rounded-[4px] overflow-hidden">
            {skills.map(skill => (
              <div
                key={skill.id}
                className="p-3 flex items-center justify-between text-xs hover:bg-[#F5F6F7]/50 transition-colors group"
                title={`Level: ${skill.level}/5 · Source: ${skill.source} · Evidence: ${skill.evidence || 'None'} · User Edited: ${skill.user_edited}`}
              >
                <div className="space-y-0.5 max-w-[50%]">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-[#1D2D3E] font-display text-sm">
                      {skill.name}
                    </span>
                    {skill.user_edited && (
                      <span className="px-1.5 py-0.2 bg-[#EBF5FF] text-[#0070F2] rounded text-[10px] font-bold">
                        Manual Edit
                      </span>
                    )}
                    <span className="px-1.5 py-0.2 bg-[#F5F6F7] border border-[#EAEDEF] text-[#556B82] rounded text-[10px] capitalize">
                      {skill.category}
                    </span>
                  </div>
                  <p className="text-[11px] text-[#556B82] truncate">
                    Source: <strong className="text-[#1D2D3E]">{skill.source}</strong> · {skill.evidence || 'No specific notes'}
                  </p>
                </div>

                <div className="flex items-center gap-4">
                  {/* Visual 5-step Level Bar */}
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map(step => (
                      <button
                        key={step}
                        onClick={() => store.updateSkillManual(skill.id, { level: step })}
                        className={`w-5 h-5 rounded-[2px] text-[10px] font-mono font-bold flex items-center justify-center transition-all ${
                          step <= skill.level
                            ? 'bg-[#0070F2] text-white'
                            : 'bg-[#EAEDEF] text-[#556B82] hover:bg-[#D5DADD]'
                        }`}
                        title={`Set level to ${step}/5`}
                      >
                        {step}
                      </button>
                    ))}
                  </div>

                  <button
                    onClick={() => store.deleteSkill(skill.id)}
                    className="p-1 text-[#556B82] hover:text-[#D20A0A] rounded transition-colors"
                    title="Delete skill"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 4. Tools & Software */}
      <div className="bg-white border border-[#D5DADD] rounded-[6px] p-5 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Wrench className="w-4 h-4 text-[#0070F2]" />
            <span className="section-label">4. Tools & Technologies ({tools.length})</span>
          </div>
          <button
            onClick={() => setIsAddingTool(true)}
            className="text-xs text-[#0070F2] font-semibold hover:underline flex items-center gap-1"
          >
            <Plus className="w-3 h-3" />
            <span>Add Tool</span>
          </button>
        </div>

        {isAddingTool && (
          <div className="flex items-center gap-2 pt-1">
            <input
              type="text"
              placeholder="e.g. Power BI, Snowflake, Bloomberg Terminal"
              value={newToolName}
              onChange={e => setNewToolName(e.target.value)}
              className="text-xs p-1.5 border border-[#D5DADD] rounded-[4px] flex-1 outline-none focus:border-[#0070F2]"
            />
            <button
              onClick={handleSaveNewTool}
              className="px-3 py-1.5 bg-[#0070F2] text-white rounded-[4px] text-xs font-semibold"
            >
              Add
            </button>
            <button
              onClick={() => setIsAddingTool(false)}
              className="px-2.5 py-1.5 bg-[#F5F6F7] border border-[#D5DADD] rounded-[4px] text-xs"
            >
              Cancel
            </button>
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          {tools.length === 0 ? (
            <span className="text-xs text-[#556B82] italic">
              No tools recorded. Mention tools in Companion or add above.
            </span>
          ) : (
            tools.map(tool => (
              <span
                key={tool.id}
                className="px-2.5 py-1 bg-[#F5F6F7] border border-[#D5DADD] rounded-[4px] text-xs text-[#1D2D3E] flex items-center gap-2"
              >
                <span>{tool.name}</span>
                <button
                  onClick={() => store.deleteTool(tool.id)}
                  className="text-[#556B82] hover:text-[#D20A0A]"
                  title="Remove tool"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))
          )}
        </div>
      </div>

      {/* 5. Education & Certifications Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Education */}
        <div className="bg-white border border-[#D5DADD] rounded-[6px] p-5 space-y-3">
          <div className="flex items-center gap-2">
            <GraduationCap className="w-4 h-4 text-[#0070F2]" />
            <span className="section-label">5. Education</span>
          </div>
          {education.length === 0 ? (
            <p className="text-xs text-[#556B82] italic">
              No formal degrees logged yet.
            </p>
          ) : (
            <div className="space-y-2">
              {education.map(edu => (
                <div key={edu.id} className="p-2 border border-[#EAEDEF] rounded text-xs">
                  <strong className="text-[#1D2D3E]">{edu.degree} in {edu.fieldOfStudy}</strong>
                  <p className="text-[#556B82]">{edu.institution} ({edu.year})</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Certifications */}
        <div className="bg-white border border-[#D5DADD] rounded-[6px] p-5 space-y-3">
          <div className="flex items-center gap-2">
            <Award className="w-4 h-4 text-[#0070F2]" />
            <span className="section-label">6. Verified Certifications</span>
          </div>
          {certificates.length === 0 ? (
            <p className="text-xs text-[#556B82] italic">
              No certifications on file. Complete milestones in Learning Path to verify skills.
            </p>
          ) : (
            <div className="space-y-2">
              {certificates.map(cert => (
                <div key={cert.id} className="p-2 border border-[#EAEDEF] rounded text-xs">
                  <strong className="text-[#1D2D3E]">{cert.title}</strong>
                  <p className="text-[#556B82]">{cert.issuer} · {cert.issueDate}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

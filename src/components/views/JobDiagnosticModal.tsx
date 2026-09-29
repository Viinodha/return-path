import React, { useState } from 'react';
import {
  X,
  AlertTriangle,
  CheckCircle2,
  Sparkles,
  ShieldAlert,
  ArrowRight,
  Download,
  Copy,
  Check,
  Briefcase,
  MapPin,
  Building2,
  ExternalLink,
  Scan,
  TrendingUp,
  BookmarkPlus,
  HelpCircle,
} from 'lucide-react';
import { CustomJDAnalysis, JobPosting } from '../../lib/types';
import { exportJDAuditToPDF } from '../../lib/pdfExport';
import { ProgressBar } from '../common/ProgressBar';

interface JobDiagnosticModalProps {
  analysis: CustomJDAnalysis;
  onClose: () => void;
  onScanResume: (job: JobPosting) => void;
  onSaveToOpportunities?: (job: JobPosting) => void;
  isAlreadySaved?: boolean;
}

export const JobDiagnosticModal: React.FC<JobDiagnosticModalProps> = ({
  analysis,
  onClose,
  onScanResume,
  onSaveToOpportunities,
  isAlreadySaved = false,
}) => {
  const [activeTab, setActiveTab] = useState<'fit' | 'skills' | 'playbook'>('fit');
  const [copiedScript, setCopiedScript] = useState(false);
  const [pdfToast, setPdfToast] = useState<string | null>(null);
  const [savedSuccess, setSavedSuccess] = useState(isAlreadySaved);

  const handleCopyScript = () => {
    navigator.clipboard.writeText(analysis.careerGapEvaluation.interviewTalkingPoint);
    setCopiedScript(true);
    setTimeout(() => setCopiedScript(false), 2500);
  };

  const handleDownloadPDF = () => {
    try {
      exportJDAuditToPDF(analysis);
      setPdfToast('Job Diagnostic Report PDF downloaded successfully!');
      setTimeout(() => setPdfToast(null), 3000);
    } catch (err) {
      console.error('Failed to export JD diagnostic PDF:', err);
    }
  };

  const handleSave = () => {
    if (onSaveToOpportunities) {
      onSaveToOpportunities(analysis.jobPosting);
      setSavedSuccess(true);
    }
  };

  // Verdict colors
  const getVerdictStyle = () => {
    switch (analysis.verdict) {
      case 'Strong Opportunity':
        return 'bg-[#E7F6ED] text-[#188918] border-[#188918]/30';
      case 'Viable with Bridge Plan':
        return 'bg-[#EBF5FF] text-[#0070F2] border-[#0070F2]/30';
      case 'High Risk / Severe Gaps':
        return 'bg-[#FFF0F0] text-[#D32F2F] border-[#D32F2F]/30';
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white border border-[#D5DADD] rounded-[8px] max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden my-auto">
        
        {/* Modal Header */}
        <div className="p-5 border-b border-[#EAEDEF] bg-[#F8FAFC] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2 py-0.5 bg-[#EBF5FF] text-[#0070F2] text-[10px] font-bold rounded flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                ReturnPath Deep JD Diagnostic
              </span>
              <span className={`px-2 py-0.5 text-[10px] font-bold rounded border ${getVerdictStyle()}`}>
                {analysis.verdict}
              </span>
            </div>
            
            <h2 className="text-xl font-bold font-display text-[#1D2D3E] flex items-center gap-2">
              <span>{analysis.jobTitle}</span>
              <span className="text-sm font-normal text-[#556B82]">at {analysis.companyName}</span>
            </h2>

            <div className="flex flex-wrap items-center gap-3 text-xs text-[#556B82]">
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-[#E76500]" />
                {analysis.location}
              </span>
              <span>•</span>
              <span>Audited against candidate's dynamic ReturnPath profile</span>
            </div>
          </div>

          <div className="flex items-center gap-3 self-end sm:self-center">
            {/* Score Ring / Pill */}
            <div className="text-center px-4 py-2 bg-white border border-[#D5DADD] rounded-[6px] shadow-xs">
              <span className="text-2xl font-bold font-display text-[#0070F2]">
                {analysis.matchScore}%
              </span>
              <span className="block text-[9px] uppercase font-bold text-[#556B82]">Fit Score</span>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 hover:bg-[#EAEDEF] text-[#556B82] hover:text-[#1D2D3E] rounded-[4px] transition-colors cursor-pointer"
              title="Close Modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Executive Summary Callout */}
        <div className="px-6 py-3 bg-[#F0F6FD] border-b border-[#0070F2]/15 text-xs text-[#1D2D3E] flex items-start gap-2.5">
          <TrendingUp className="w-4 h-4 text-[#0070F2] flex-shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            <strong>Executive Recruiter Diagnostic:</strong> {analysis.executiveSummary}
          </p>
        </div>

        {/* Toast Notification */}
        {pdfToast && (
          <div className="mx-6 mt-3 p-2.5 bg-[#188918]/10 border border-[#188918]/30 rounded-[4px] text-xs text-[#188918] font-semibold flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            <span>{pdfToast}</span>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="flex border-b border-[#EAEDEF] px-6 bg-white">
          <button
            onClick={() => setActiveTab('fit')}
            className={`py-3 px-4 text-xs font-semibold font-display border-b-2 flex items-center gap-2 transition-colors cursor-pointer ${
              activeTab === 'fit'
                ? 'border-[#0070F2] text-[#0070F2]'
                : 'border-transparent text-[#556B82] hover:text-[#1D2D3E]'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Fit & Vulnerabilities Audit</span>
            <span className="px-1.5 py-0.2 bg-[#F5F6F7] text-[10px] text-[#556B82] rounded-full">
              {analysis.whyThisJobHurts.length + analysis.positivePoints.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('skills')}
            className={`py-3 px-4 text-xs font-semibold font-display border-b-2 flex items-center gap-2 transition-colors cursor-pointer ${
              activeTab === 'skills'
                ? 'border-[#0070F2] text-[#0070F2]'
                : 'border-transparent text-[#556B82] hover:text-[#1D2D3E]'
            }`}
          >
            <Briefcase className="w-3.5 h-3.5" />
            <span>Dynamic Skillset Matrix</span>
            <span className="px-1.5 py-0.2 bg-[#F5F6F7] text-[10px] text-[#556B82] rounded-full">
              {analysis.skillComparisons.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('playbook')}
            className={`py-3 px-4 text-xs font-semibold font-display border-b-2 flex items-center gap-2 transition-colors cursor-pointer ${
              activeTab === 'playbook'
                ? 'border-[#0070F2] text-[#0070F2]'
                : 'border-transparent text-[#556B82] hover:text-[#1D2D3E]'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Interview Script & Action Plan</span>
          </button>
        </div>

        {/* Modal Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* TAB 1: FIT & RISK AUDIT */}
          {activeTab === 'fit' && (
            <div className="space-y-6">
              {/* Dual Column: Why it Hurts vs Positive Points */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Left Column: Why This Job Would Hurt */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between pb-2 border-b border-[#EAEDEF]">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-[#FFF0F0] text-[#D32F2F] flex items-center justify-center">
                        <AlertTriangle className="w-3.5 h-3.5" />
                      </div>
                      <h3 className="text-sm font-bold font-display text-[#1D2D3E]">
                        Why This Job Would Hurt
                      </h3>
                    </div>
                    <span className="text-[11px] font-semibold text-[#D32F2F]">
                      {analysis.whyThisJobHurts.length} Vulnerabilities Flagged
                    </span>
                  </div>

                  <p className="text-xs text-[#556B82]">
                    Potential career break traps, strict continuous employment clauses, steep technical cliffs, or high-burnout language detected in this JD text.
                  </p>

                  <div className="space-y-3">
                    {analysis.whyThisJobHurts.map((item, idx) => (
                      <div
                        key={idx}
                        className="p-3.5 bg-[#FFF9F9] border border-[#FFD0D0] rounded-[6px] space-y-2 text-xs"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="font-bold text-[#1D2D3E] flex items-center gap-1.5">
                            <span>{item.title}</span>
                          </h4>
                          <span
                            className={`px-1.5 py-0.2 rounded text-[10px] font-bold uppercase ${
                              item.riskLevel === 'high'
                                ? 'bg-[#D32F2F] text-white'
                                : item.riskLevel === 'medium'
                                ? 'bg-[#E76500] text-white'
                                : 'bg-[#556B82] text-white'
                            }`}
                          >
                            {item.riskLevel} Risk
                          </span>
                        </div>

                        <p className="text-[#556B82] leading-relaxed">
                          {item.detail}
                        </p>

                        <div className="pt-2 border-t border-[#FFD0D0]/50 text-[11px] text-[#0070F2] bg-white/70 p-2 rounded">
                          <strong className="block text-[#1D2D3E] font-semibold mb-0.5">
                            🛡️ Re-Entry Mitigation Strategy:
                          </strong>
                          <span>{item.mitigationStrategy}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Right Column: Positive Points & Strengths */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between pb-2 border-b border-[#EAEDEF]">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-[#E7F6ED] text-[#188918] flex items-center justify-center">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      </div>
                      <h3 className="text-sm font-bold font-display text-[#1D2D3E]">
                        Positive Points & Competitive Edges
                      </h3>
                    </div>
                    <span className="text-[11px] font-semibold text-[#188918]">
                      {analysis.positivePoints.length} Levers Identified
                    </span>
                  </div>

                  <p className="text-xs text-[#556B82]">
                    Competencies and verified artifacts you have dynamically built in ReturnPath, combined with favorable hiring signals in the posting.
                  </p>

                  <div className="space-y-3">
                    {analysis.positivePoints.map((item, idx) => (
                      <div
                        key={idx}
                        className="p-3.5 bg-[#F6FBF7] border border-[#C5E8CF] rounded-[6px] space-y-2 text-xs"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="font-bold text-[#1D2D3E] flex items-center gap-1.5">
                            <span>{item.title}</span>
                          </h4>
                          <span
                            className={`px-1.5 py-0.2 rounded text-[10px] font-bold uppercase ${
                              item.impact === 'strong'
                                ? 'bg-[#188918] text-white'
                                : 'bg-[#0070F2] text-white'
                            }`}
                          >
                            {item.impact} Fit
                          </span>
                        </div>

                        <p className="text-[#556B82] leading-relaxed">
                          {item.detail}
                        </p>

                        <div className="pt-2 border-t border-[#C5E8CF]/50 text-[11px] text-[#188918] bg-white/70 p-2 rounded">
                          <strong className="block text-[#1D2D3E] font-semibold mb-0.5">
                            💡 How to Leverage in Application:
                          </strong>
                          <span>{item.howToLeverage}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

              </div>

              {/* Career Gap Clause Banner */}
              <div className="p-4 bg-white border border-[#D5DADD] rounded-[6px] space-y-2 text-xs">
                <div className="flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-[#0070F2]" />
                  <h4 className="font-bold text-[#1D2D3E]">
                    Employer Career Break & Continuity Policy Audit
                  </h4>
                </div>
                <p className="text-[#556B82]">
                  {analysis.careerGapEvaluation.riskAssessment}
                </p>
                {analysis.careerGapEvaluation.flaggedClauses.length > 0 && (
                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    <span className="text-[11px] font-semibold text-[#1D2D3E]">Flagged clauses:</span>
                    {analysis.careerGapEvaluation.flaggedClauses.map((clause, idx) => (
                      <span key={idx} className="px-2 py-0.5 bg-[#FFF0F0] text-[#D32F2F] border border-[#FFD0D0] rounded text-[10px]">
                        {clause}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: DYNAMIC SKILLSET MATRIX */}
          {activeTab === 'skills' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2 border-b border-[#EAEDEF] gap-2">
                <div>
                  <h3 className="text-sm font-bold font-display text-[#1D2D3E]">
                    Dynamic Skillset Comparison (System State vs JD)
                  </h3>
                  <p className="text-xs text-[#556B82]">
                    Direct comparison of competencies extracted from this JD against your dynamically growing skills in ReturnPath.
                  </p>
                </div>
                <div className="flex items-center gap-2 text-[11px]">
                  <span className="flex items-center gap-1 text-[#188918] font-semibold">
                    <span className="w-2 h-2 rounded-full bg-[#188918]"></span> Mastered
                  </span>
                  <span className="flex items-center gap-1 text-[#E76500] font-semibold">
                    <span className="w-2 h-2 rounded-full bg-[#E76500]"></span> Developing
                  </span>
                  <span className="flex items-center gap-1 text-[#D32F2F] font-semibold">
                    <span className="w-2 h-2 rounded-full bg-[#D32F2F]"></span> Critical Gap
                  </span>
                </div>
              </div>

              {/* Skills Matrix Table */}
              <div className="border border-[#EAEDEF] rounded-[6px] overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#F8FAFC] border-b border-[#EAEDEF] text-[11px] font-semibold text-[#556B82] uppercase">
                    <tr>
                      <th className="py-2.5 px-4">Demanded Competency</th>
                      <th className="py-2.5 px-3">Req. Level</th>
                      <th className="py-2.5 px-3">Your ReturnPath Level</th>
                      <th className="py-2.5 px-3">System Status</th>
                      <th className="py-2.5 px-4">Strategic Re-Entry Guidance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#EAEDEF]">
                    {analysis.skillComparisons.map((item, idx) => (
                      <tr key={idx} className="hover:bg-[#F8FAFC]/60 transition-colors">
                        <td className="py-3 px-4 font-semibold text-[#1D2D3E]">
                          {item.skillName}
                          <span className="block text-[10px] font-normal text-[#556B82] capitalize">
                            {item.category}
                          </span>
                        </td>

                        <td className="py-3 px-3 text-[#556B82]">
                          Level {item.requiredLevel} / 5
                        </td>

                        <td className="py-3 px-3">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-[#1D2D3E]">
                              {item.userLevel} / 5
                            </span>
                            <div className="w-16 bg-[#EAEDEF] h-2 rounded-full overflow-hidden">
                              <div
                                className={`h-full ${
                                  item.userLevel >= item.requiredLevel
                                    ? 'bg-[#188918]'
                                    : item.userLevel > 0
                                    ? 'bg-[#E76500]'
                                    : 'bg-[#D32F2F]'
                                }`}
                                style={{ width: `${(item.userLevel / 5) * 100}%` }}
                              />
                            </div>
                          </div>
                        </td>

                        <td className="py-3 px-3">
                          {item.status === 'mastered' ? (
                            <span className="px-2 py-0.5 bg-[#E7F6ED] text-[#188918] font-bold text-[10px] rounded">
                              ✓ Mastered
                            </span>
                          ) : item.status === 'developing' ? (
                            <span className="px-2 py-0.5 bg-[#FFF4EB] text-[#E76500] font-bold text-[10px] rounded">
                              Developing
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 bg-[#FFF0F0] text-[#D32F2F] font-bold text-[10px] rounded">
                              ! Critical Gap
                            </span>
                          )}
                        </td>

                        <td className="py-3 px-4 text-[#556B82] text-[11px] leading-relaxed">
                          {item.reentryAdvice}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: PLAYBOOK & INTERVIEW SCRIPT */}
          {activeTab === 'playbook' && (
            <div className="space-y-6">
              {/* Interview Script Card */}
              <div className="p-5 bg-gradient-to-r from-[#EBF5FF] to-[#F0F6FD] border border-[#0070F2]/30 rounded-[8px] space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-[#0070F2]" />
                    <h3 className="text-sm font-bold font-display text-[#1D2D3E]">
                      Tailored Career Break Interview Script (The 90-Second Response)
                    </h3>
                  </div>
                  <button
                    onClick={handleCopyScript}
                    className="px-2.5 py-1 bg-white hover:bg-[#EAEDEF] border border-[#D5DADD] text-[#1D2D3E] rounded-[4px] text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    {copiedScript ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-[#188918]" />
                        <span className="text-[#188918]">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-[#556B82]" />
                        <span>Copy Script</span>
                      </>
                    )}
                  </button>
                </div>

                <p className="text-xs text-[#556B82]">
                  When an interviewer at {analysis.companyName} asks: <em>"We noticed a gap on your resume, could you walk us through that?"</em>, deliver this confident, structured reply:
                </p>

                <blockquote className="p-3.5 bg-white border-l-4 border-[#0070F2] rounded-r-[4px] text-xs text-[#1D2D3E] italic leading-relaxed shadow-xs">
                  {analysis.careerGapEvaluation.interviewTalkingPoint}
                </blockquote>
              </div>

              {/* Action Playbook */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                
                {/* Column 1: Quick Wins */}
                <div className="p-4 bg-white border border-[#D5DADD] rounded-[6px] space-y-2">
                  <span className="text-[10px] font-bold uppercase text-[#0070F2] tracking-wider">
                    Step 1: Immediate Wins
                  </span>
                  <h4 className="text-xs font-bold text-[#1D2D3E]">Application Preparation</h4>
                  <ul className="space-y-2 text-xs text-[#556B82] pt-1">
                    {analysis.actionPlaybook.quickWins.map((win, idx) => (
                      <li key={idx} className="flex items-start gap-1.5">
                        <span className="text-[#0070F2] font-bold mt-0.5">•</span>
                        <span>{win}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Column 2: Learning Priorities */}
                <div className="p-4 bg-white border border-[#D5DADD] rounded-[6px] space-y-2">
                  <span className="text-[10px] font-bold uppercase text-[#E76500] tracking-wider">
                    Step 2: Bridge The Gap
                  </span>
                  <h4 className="text-xs font-bold text-[#1D2D3E]">Learning Path Focus</h4>
                  <ul className="space-y-2 text-xs text-[#556B82] pt-1">
                    {analysis.actionPlaybook.learningPathPriorities.map((item, idx) => (
                      <li key={idx} className="flex items-start gap-1.5">
                        <span className="text-[#E76500] font-bold mt-0.5">•</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Column 3: Recommended Project */}
                <div className="p-4 bg-white border border-[#D5DADD] rounded-[6px] space-y-2">
                  <span className="text-[10px] font-bold uppercase text-[#188918] tracking-wider">
                    Step 3: Proof of Currency
                  </span>
                  <h4 className="text-xs font-bold text-[#1D2D3E]">Highlight This Project</h4>
                  <p className="text-xs text-[#556B82] leading-relaxed pt-1">
                    Feature <strong>"{analysis.actionPlaybook.recommendedProjectHighlight}"</strong> on your resume summary to validate recent, hands-on production readiness.
                  </p>
                </div>

              </div>
            </div>
          )}

        </div>

        {/* Modal Action Footer */}
        <div className="p-4 border-t border-[#EAEDEF] bg-[#F8FAFC] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadPDF}
              className="px-3.5 py-1.5 bg-white border border-[#D5DADD] hover:bg-[#EAEDEF] text-[#1D2D3E] rounded-[4px] text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-[#556B82]" />
              <span>Download Diagnostic PDF</span>
            </button>

            {onSaveToOpportunities && (
              <button
                onClick={handleSave}
                disabled={savedSuccess}
                className={`px-3.5 py-1.5 rounded-[4px] text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                  savedSuccess
                    ? 'bg-[#E7F6ED] text-[#188918] border border-[#188918]/30 cursor-default'
                    : 'bg-white border border-[#D5DADD] hover:bg-[#EAEDEF] text-[#1D2D3E]'
                }`}
              >
                {savedSuccess ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-[#188918]" />
                    <span>Saved to My Jobs</span>
                  </>
                ) : (
                  <>
                    <BookmarkPlus className="w-3.5 h-3.5 text-[#556B82]" />
                    <span>Save to My Opportunities</span>
                  </>
                )}
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 self-end sm:self-center">
            <button
              onClick={onClose}
              className="px-3 py-1.5 bg-[#EAEDEF] hover:bg-[#D5DADD] text-[#1D2D3E] rounded-[4px] text-xs font-semibold transition-colors cursor-pointer"
            >
              Close
            </button>

            <button
              onClick={() => {
                onScanResume(analysis.jobPosting);
                onClose();
              }}
              className="px-4 py-1.5 bg-[#0070F2] hover:bg-[#0064D9] text-white rounded-[4px] text-xs font-semibold font-display flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm"
            >
              <Scan className="w-3.5 h-3.5" />
              <span>Scan Resume Against This Job</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

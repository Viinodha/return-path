import React, { useState } from 'react';
import {
  FileSpreadsheet,
  Printer,
  Sparkles,
  Bookmark,
  CheckCircle2,
  AlertTriangle,
  Calendar,
  Send,
  HelpCircle,
  TrendingUp,
  Download,
} from 'lucide-react';
import { MemoryStore } from '../../lib/data/store';
import { compileConsultantReport, generateConsultantAdvice } from '../../lib/agents/consultant';
import { calculateCareerReadiness } from '../../lib/readiness';
import { SEEDED_ROLES } from '../../lib/data/seed';
import { AdviceItem, ConsultantReport } from '../../lib/types';
import { ProgressBar } from '../common/ProgressBar';
import { ReturnPathLogo } from '../common/ReturnPathLogo';
import { exportConsultantReportToPDF } from '../../lib/pdfExport';

interface ReportViewProps {
  store: MemoryStore;
}

export const ReportView: React.FC<ReportViewProps> = ({ store }) => {
  const state = store.getState();
  const profile = state.profile;
  const skills = state.skills;
  const tools = state.tools;
  const milestones = state.learningMilestones;
  const projects = state.projects;
  const certs = state.certificates;
  const interviews = state.interviews;
  const atsScans = state.atsScans;
  const adviceList = state.adviceList;

  const [activeTab, setActiveTab] = useState<'report' | 'advice'>('report');
  const [adviceQuestion, setAdviceQuestion] = useState('');
  const [isAskingAdvice, setIsAskingAdvice] = useState(false);

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

  const report: ConsultantReport = compileConsultantReport(
    profile,
    readiness,
    skills,
    milestones,
    atsScans,
    interviews,
    projects
  );

  const handleAskAdvice = () => {
    if (!adviceQuestion.trim() || isAskingAdvice) return;
    setIsAskingAdvice(true);

    setTimeout(() => {
      const advice = generateConsultantAdvice(adviceQuestion, profile, readiness, skills);
      store.saveAdvice(advice);
      setAdviceQuestion('');
      setIsAskingAdvice(false);
      setActiveTab('advice');
    }, 350);
  };

  const [reportToast, setReportToast] = useState<string | null>(null);

  const handlePrint = () => {
    try {
      exportConsultantReportToPDF(report);
      setReportToast('Strategic Consultant Report PDF downloaded successfully!');
      setTimeout(() => setReportToast(null), 3000);
    } catch (err) {
      console.error('Error generating report PDF:', err);
      window.print();
    }
  };

  return (
    <div className="flex-1 p-6 max-w-5xl mx-auto space-y-6">
      {/* Top Header & Tab Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[#EAEDEF] gap-3 no-print">
        <div>
          <span className="section-label">Agent 6: Career Consultant Report</span>
          <h2 className="text-xl font-bold font-display text-[#1D2D3E]">
            Consultant Strategic Report & Strategic Advice
          </h2>
          <p className="text-xs text-[#556B82] mt-0.5">
            Audit-ready strategic documentation and structured advisory sessions.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-[#F5F6F7] p-1 border border-[#D5DADD] rounded-[4px]">
            <button
              onClick={() => setActiveTab('report')}
              className={`px-3 py-1.5 rounded-[4px] text-xs font-semibold font-display transition-colors ${
                activeTab === 'report'
                  ? 'bg-white text-[#0070F2] shadow-sm'
                  : 'text-[#556B82] hover:text-[#1D2D3E]'
              }`}
            >
              Consultant Report
            </button>
            <button
              onClick={() => setActiveTab('advice')}
              className={`px-3 py-1.5 rounded-[4px] text-xs font-semibold font-display transition-colors ${
                activeTab === 'advice'
                  ? 'bg-white text-[#0070F2] shadow-sm'
                  : 'text-[#556B82] hover:text-[#1D2D3E]'
              }`}
            >
              Advisory Sessions ({adviceList.length})
            </button>
          </div>

          {activeTab === 'report' && (
            <div className="flex items-center gap-1.5">
              <button
                onClick={handlePrint}
                className="px-3.5 py-1.5 bg-[#0070F2] hover:bg-[#0064D9] text-white rounded-[4px] text-xs font-semibold font-display flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Save as PDF</span>
              </button>
              <button
                onClick={() => window.print()}
                className="px-3 py-1.5 bg-white border border-[#D5DADD] hover:bg-[#F5F6F7] text-[#1D2D3E] rounded-[4px] text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Browser print dialog"
              >
                <Printer className="w-3.5 h-3.5 text-[#556B82]" />
                <span>Print</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {reportToast && (
        <div className="p-3 bg-[#EBF5FF] border border-[#0070F2]/40 rounded-[4px] text-xs text-[#0070F2] font-semibold flex items-center justify-between gap-2 animate-in fade-in">
          <div className="flex items-center gap-2">
            <Download className="w-4 h-4 text-[#0070F2]" />
            <span>{reportToast}</span>
          </div>
          <button
            onClick={() => setReportToast(null)}
            className="text-[11px] text-[#556B82] hover:text-[#1D2D3E] font-normal cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Quick Ask Consultant Prompt Bar */}
      <div className="bg-white border border-[#D5DADD] rounded-[6px] p-4 space-y-2 no-print">
        <span className="section-label text-[#0070F2] flex items-center gap-1">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Ask Career Consultant for Reasoned Strategic Advice</span>
        </span>
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={adviceQuestion}
            onChange={e => setAdviceQuestion(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAskAdvice()}
            placeholder="e.g. How should I position my 2-year career gap? Should I focus on PL-300 or Python projects first?"
            className="flex-1 text-xs p-2.5 border border-[#D5DADD] rounded-[4px] outline-none focus:border-[#0070F2]"
          />
          <button
            onClick={handleAskAdvice}
            disabled={!adviceQuestion.trim() || isAskingAdvice}
            className="px-4 py-2.5 bg-[#0070F2] hover:bg-[#0064D9] disabled:bg-[#D5DADD] text-white rounded-[4px] text-xs font-semibold font-display flex items-center gap-1.5 transition-colors"
          >
            <Send className="w-3.5 h-3.5" />
            <span>{isAskingAdvice ? 'Analyzing...' : 'Ask Consultant'}</span>
          </button>
        </div>
      </div>

      {/* TAB 1: CONSULTANT REPORT */}
      {activeTab === 'report' && (
        <div
          id="report-print-container"
          className="bg-white border border-[#D5DADD] rounded-[6px] p-8 space-y-6 shadow-sm text-xs text-[#1D2D3E] leading-relaxed"
        >
          {/* Report Cover Header */}
          <div className="border-b-2 border-[#0070F2] pb-4 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div className="flex items-center gap-3">
              <ReturnPathLogo size={42} className="rounded-[4px] shadow-xs" />
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-[#0070F2] font-display">
                  ReturnPath Career Advisory Practice
                </span>
                <h1 className="text-2xl font-bold font-display text-[#1D2D3E] mt-0.5">
                  Strategic Career Re-entry Report
                </h1>
                <p className="text-[#556B82] mt-0.5">
                  Target Role: <strong>{report.targetRole}</strong> · Candidate: <strong>{report.candidateName}</strong>
                </p>
              </div>
            </div>
            <div className="text-right">
              <span className="text-[10px] uppercase font-bold text-[#556B82] block">Audit Date</span>
              <span className="font-mono text-sm font-semibold">{report.generatedAt}</span>
            </div>
          </div>

          {/* 1. Executive Summary */}
          <div className="space-y-2">
            <h2 className="text-sm font-bold font-display uppercase tracking-wider text-[#1D2D3E] border-b border-[#EAEDEF] pb-1">
              1. Executive Assessment
            </h2>
            <p className="text-[#1D2D3E] text-xs leading-relaxed">
              {report.executiveSummary}
            </p>
          </div>

          {/* 2. Career Readiness Audit */}
          <div className="space-y-3">
            <h2 className="text-sm font-bold font-display uppercase tracking-wider text-[#1D2D3E] border-b border-[#EAEDEF] pb-1">
              2. Deterministic Career Readiness Score: {report.readinessTotal}%
            </h2>
            <ProgressBar value={report.readinessTotal} height={8} />

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
              {readiness.breakdown.map((b, idx) => (
                <div key={idx} className="p-2.5 bg-[#F5F6F7] rounded border border-[#EAEDEF] space-y-1">
                  <div className="flex justify-between font-bold text-[11px]">
                    <span>{b.factor}</span>
                    <span className="text-[#0070F2] font-mono">{b.earned} / {b.max} pts</span>
                  </div>
                  <ProgressBar value={b.earned} max={b.max} height={4} />
                  <span className="text-[10px] text-[#556B82] block truncate">{b.tip}</span>
                </div>
              ))}
            </div>
          </div>

          {/* 3. Strengths vs Identified Strategic Risks */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 bg-[#188918]/5 border border-[#188918]/20 rounded-[4px] space-y-2">
              <h3 className="font-bold font-display text-[#188918] text-xs flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Verified Candidate Strengths
              </h3>
              <ul className="list-disc list-inside space-y-1 text-[#1D2D3E]">
                {report.strengths.map((s, idx) => (
                  <li key={idx}>{s}</li>
                ))}
              </ul>
            </div>

            <div className="p-4 bg-[#E76500]/5 border border-[#E76500]/20 rounded-[4px] space-y-2">
              <h3 className="font-bold font-display text-[#E76500] text-xs flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5" />
                Honest Risks & Considerations
              </h3>
              <ul className="list-disc list-inside space-y-1 text-[#1D2D3E]">
                {report.identifiedRisks.map((r, idx) => (
                  <li key={idx}>{r}</li>
                ))}
              </ul>
            </div>
          </div>

          {/* 4. Structured 30 / 60 / 90 Day Strategic Plan */}
          <div className="space-y-3">
            <h2 className="text-sm font-bold font-display uppercase tracking-wider text-[#1D2D3E] border-b border-[#EAEDEF] pb-1">
              4. 30 / 60 / 90 Day Strategic Execution Roadmap
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* 30 Days */}
              <div className="p-3.5 bg-[#F5F6F7] border border-[#D5DADD] rounded-[4px] space-y-2">
                <span className="section-label text-[#0070F2] flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  First 30 Days (Foundation)
                </span>
                <ul className="space-y-1 text-[11px] text-[#1D2D3E]">
                  {report.plan30Days.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-1.5">
                      <span className="font-bold text-[#0070F2]">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* 60 Days */}
              <div className="p-3.5 bg-[#F5F6F7] border border-[#D5DADD] rounded-[4px] space-y-2">
                <span className="section-label text-[#0070F2] flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  Day 31 - 60 (Application & Build)
                </span>
                <ul className="space-y-1 text-[11px] text-[#1D2D3E]">
                  {report.plan60Days.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-1.5">
                      <span className="font-bold text-[#0070F2]">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* 90 Days */}
              <div className="p-3.5 bg-[#F5F6F7] border border-[#D5DADD] rounded-[4px] space-y-2">
                <span className="section-label text-[#0070F2] flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  Day 61 - 90 (Market Alignment)
                </span>
                <ul className="space-y-1 text-[11px] text-[#1D2D3E]">
                  {report.plan90Days.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-1.5">
                      <span className="font-bold text-[#0070F2]">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Footer Sign-off */}
          <div className="pt-4 border-t border-[#EAEDEF] flex justify-between items-center text-[10px] text-[#556B82]">
            <span>Generated deterministically by ReturnPath Career Consultant Agent</span>
            <span>Inclusive Workforce Protocol · SAP Hackfest Edition</span>
          </div>
        </div>
      )}

      {/* TAB 2: CONSULTANT ADVICE SESSIONS */}
      {activeTab === 'advice' && (
        <div className="space-y-4">
          {adviceList.length === 0 ? (
            <div className="bg-white border border-[#D5DADD] rounded-[6px] p-8 text-center space-y-3">
              <HelpCircle className="w-8 h-8 text-[#0070F2] mx-auto" />
              <h3 className="text-sm font-bold font-display text-[#1D2D3E]">
                No Advisory Sessions Logged Yet
              </h3>
              <p className="text-xs text-[#556B82] max-w-sm mx-auto">
                Ask any strategic question above (career gap framing, course trade-offs, salary reality). The consultant responds with Assessment, Options, Recommendation, and Next Step.
              </p>
            </div>
          ) : (
            adviceList.map(adv => (
              <div
                key={adv.id}
                className="bg-white border border-[#D5DADD] rounded-[6px] p-5 space-y-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-[#0070F2] block font-display">
                      Strategic Query
                    </span>
                    <h3 className="text-sm font-bold font-display text-[#1D2D3E] mt-0.5">
                      "{adv.question}"
                    </h3>
                  </div>
                  <button
                    onClick={() => store.toggleAdviceSaveToPlan(adv.id)}
                    className={`px-2.5 py-1 rounded-[4px] text-xs font-semibold flex items-center gap-1 transition-colors ${
                      adv.savedToPlan
                        ? 'bg-[#188918]/10 text-[#188918] border border-[#188918]/30'
                        : 'bg-[#F5F6F7] text-[#556B82] hover:text-[#0070F2]'
                    }`}
                  >
                    <Bookmark className="w-3 h-3" />
                    <span>{adv.savedToPlan ? 'Saved to Plan' : 'Save to Plan'}</span>
                  </button>
                </div>

                {/* Fixed Shape: Assessment, Options, Recommendation, Next Step */}
                <div className="space-y-3 text-xs">
                  {/* 1. Assessment */}
                  <div className="p-3 bg-[#F5F6F7] rounded border border-[#EAEDEF]">
                    <strong className="text-[#1D2D3E] block mb-1">Assessment:</strong>
                    <p className="text-[#556B82] leading-relaxed">{adv.assessment}</p>
                  </div>

                  {/* 2. Options with Trade-offs */}
                  <div className="space-y-2">
                    <strong className="text-[#1D2D3E] block">Strategic Options & Trade-offs:</strong>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {adv.options.map((opt, idx) => (
                        <div key={idx} className="p-2.5 bg-white border border-[#D5DADD] rounded-[4px] space-y-1">
                          <span className="font-bold text-[#0070F2] font-display text-[11px] block">
                            {opt.title}
                          </span>
                          <p className="text-[#556B82] text-[11px] leading-relaxed">{opt.tradeoffs}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* 3. Recommendation */}
                  <div className="p-3 bg-[#EBF5FF] border border-[#0070F2]/30 rounded-[4px]">
                    <strong className="text-[#0070F2] block mb-0.5 font-display">
                      Consultant Recommendation:
                    </strong>
                    <p className="text-[#1D2D3E] leading-relaxed">{adv.recommendation}</p>
                  </div>

                  {/* 4. Concrete Next Step */}
                  <div className="flex items-center gap-2 text-[#556B82] text-xs pt-1">
                    <span className="font-bold text-[#1D2D3E]">Concrete Next Step:</span>
                    <span className="text-[#0070F2] font-medium">{adv.nextStep}</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

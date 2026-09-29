import React, { useState, useEffect } from 'react';
import {
  FileText,
  Scan,
  Download,
  Printer,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  Upload,
  RefreshCw,
  History,
  Layers,
  ArrowRight,
  Eye,
  Check,
} from 'lucide-react';
import { MemoryStore } from '../../lib/data/store';
import { runATSScan, buildATSResumeText } from '../../lib/agents/resume';
import { ResumeData, ATSScanResult } from '../../lib/types';
import { SEEDED_ROLES } from '../../lib/data/seed';
import { ProgressBar } from '../common/ProgressBar';
import { exportATSScanToPDF, exportResumeToPDF } from '../../lib/pdfExport';

interface ResumeViewProps {
  store: MemoryStore;
}

export const ResumeView: React.FC<ResumeViewProps> = ({ store }) => {
  const state = store.getState();
  const profile = state.profile;
  const skills = state.skills;
  const tools = state.tools;
  const experience = state.experience;
  const education = state.education;
  const projects = state.projects;
  const certs = state.certificates;
  const atsScans = state.atsScans;

  const [activeTab, setActiveTab] = useState<'scan' | 'builder'>('scan');

  // Scanner State
  const [scanText, setScanText] = useState('');
  const [targetRoleSelection, setTargetRoleSelection] = useState(profile.targetRole || 'Data Analyst');
  const [currentScanResult, setCurrentScanResult] = useState<ATSScanResult | null>(
    atsScans.length > 0 ? atsScans[0] : null
  );

  // Builder State
  const [resumeData, setResumeData] = useState<ResumeData>(() => {
    return {
      id: `res_${Date.now()}`,
      version: 1,
      targetRole: profile.targetRole || 'Data Analyst',
      fullName: profile.fullName || 'Candidate Name',
      email: profile.email || 'candidate@example.com',
      phone: profile.phone || '+1 (555) 019-2834',
      location: profile.location || 'New York, NY (Open to Remote)',
      summary: profile.summary || `Dedicated professional targeting ${profile.targetRole || 'analytical opportunities'}, offering proven business problem-solving foundation combined with modernized technical proficiencies in data modeling and business analytics.`,
      careerBreakNarrative: profile.careerGapReason ? `${profile.careerGapReason} — Dedicated time away focusing on family responsibilities while actively maintaining technical currency through self-directed projects and professional coursework.` : undefined,
      skills: skills.map(s => s.name),
      tools: tools.map(t => t.name),
      experiences: experience,
      education: education,
      projects: projects,
      certifications: certs,
      updatedAt: new Date().toISOString(),
    };
  });

  const [isSavedToast, setIsSavedToast] = useState(false);
  const [pdfToast, setPdfToast] = useState<string | null>(null);

  // Sync builder when profile changes
  useEffect(() => {
    if (profile.targetRole && !resumeData.targetRole) {
      setResumeData(prev => ({ ...prev, targetRole: profile.targetRole }));
    }
  }, [profile]);

  const handleRunScan = (textToScan?: string) => {
    const raw = textToScan || scanText;
    if (!raw.trim()) return;

    const result = runATSScan(raw, targetRoleSelection);
    setCurrentScanResult(result);
    store.saveAtsScan(result);
  };

  const handleScanBuiltResume = () => {
    const text = buildATSResumeText(resumeData);
    setScanText(text);
    setActiveTab('scan');
    handleRunScan(text);
  };

  const handleSaveResumeVersion = () => {
    const updated = {
      ...resumeData,
      version: resumeData.version + 1,
      updatedAt: new Date().toISOString(),
    };
    setResumeData(updated);
    store.saveResume(updated);
    setIsSavedToast(true);
    setTimeout(() => setIsSavedToast(false), 2500);
  };

  // Export ATS Scan Diagnostic Report as PDF
  const handleExportScanPDF = () => {
    if (!currentScanResult) return;
    try {
      exportATSScanToPDF(currentScanResult, targetRoleSelection);
      setPdfToast('ATS Diagnostic Report PDF generated and downloaded!');
      setTimeout(() => setPdfToast(null), 3000);
    } catch (err) {
      console.error('Error generating scan PDF:', err);
      window.print();
    }
  };

  // Export Built Single-Column ATS Resume as PDF
  const handlePrintPDF = () => {
    try {
      exportResumeToPDF(resumeData);
      setPdfToast('Single-Column ATS Resume PDF generated and downloaded!');
      setTimeout(() => setPdfToast(null), 3000);
    } catch (err) {
      console.error('Error generating resume PDF:', err);
      window.print();
    }
  };

  const handleExportText = () => {
    const text = buildATSResumeText(resumeData);
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${resumeData.fullName.replace(/\s+/g, '_')}_Resume_ATS.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex-1 p-6 max-w-6xl mx-auto space-y-6">
      {/* Header and Tab Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[#EAEDEF] gap-3 no-print">
        <div>
          <span className="section-label">Agent 5: ATS Diagnostic & Resume Builder</span>
          <h2 className="text-xl font-bold font-display text-[#1D2D3E]">
            ATS Scanner & Single-Column Builder
          </h2>
          <p className="text-xs text-[#556B82] mt-0.5">
            Single-column ATS formatting strictly compliant with enterprise parser standards.
          </p>
        </div>

        <div className="flex items-center gap-1 bg-[#F5F6F7] p-1 border border-[#D5DADD] rounded-[4px] self-start sm:self-auto">
          <button
            onClick={() => setActiveTab('scan')}
            className={`px-3 py-1.5 rounded-[4px] text-xs font-semibold font-display transition-colors flex items-center gap-1.5 ${
              activeTab === 'scan'
                ? 'bg-white text-[#0070F2] shadow-sm'
                : 'text-[#556B82] hover:text-[#1D2D3E]'
            }`}
          >
            <Scan className="w-3.5 h-3.5" />
            <span>ATS Scanner</span>
          </button>
          <button
            onClick={() => setActiveTab('builder')}
            className={`px-3 py-1.5 rounded-[4px] text-xs font-semibold font-display transition-colors flex items-center gap-1.5 ${
              activeTab === 'builder'
                ? 'bg-white text-[#0070F2] shadow-sm'
                : 'text-[#556B82] hover:text-[#1D2D3E]'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Resume Builder</span>
          </button>
        </div>
      </div>

      {isSavedToast && (
        <div className="p-3 bg-[#188918]/10 border border-[#188918]/30 rounded-[4px] text-xs text-[#188918] font-semibold flex items-center gap-2 animate-in fade-in">
          <Check className="w-4 h-4" />
          <span>Resume version saved to persistent Career Memory.</span>
        </div>
      )}

      {pdfToast && (
        <div className="p-3 bg-[#EBF5FF] border border-[#0070F2]/40 rounded-[4px] text-xs text-[#0070F2] font-semibold flex items-center justify-between gap-2 animate-in fade-in">
          <div className="flex items-center gap-2">
            <Download className="w-4 h-4 text-[#0070F2]" />
            <span>{pdfToast}</span>
          </div>
          <button
            onClick={() => setPdfToast(null)}
            className="text-[11px] text-[#556B82] hover:text-[#1D2D3E] font-normal cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* TAB 1: SCANNER */}
      {activeTab === 'scan' && (
        <div className="space-y-6 no-print">
          {/* Input & Target Role selector */}
          <div className="bg-white border border-[#D5DADD] rounded-[6px] p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="section-label">Resume Input</span>
                <p className="text-xs text-[#556B82]">
                  Paste text from your current resume or test against a target benchmark role.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <label className="text-xs text-[#556B82]">Target Benchmark:</label>
                <select
                  value={targetRoleSelection}
                  onChange={e => setTargetRoleSelection(e.target.value)}
                  className="text-xs p-1.5 border border-[#D5DADD] rounded-[4px] bg-white outline-none focus:border-[#0070F2]"
                >
                  {SEEDED_ROLES.map(r => (
                    <option key={r.id} value={r.roleName}>
                      {r.roleName}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <textarea
              rows={6}
              value={scanText}
              onChange={e => setScanText(e.target.value)}
              placeholder="Paste your plain resume text here (Contact info, Summary, Skills, Experience, Education)..."
              className="w-full text-xs font-mono p-3 border border-[#D5DADD] rounded-[4px] outline-none focus:border-[#0070F2] bg-[#F5F6F7]/30"
            />

            <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
              <button
                onClick={() => {
                  const sample = buildATSResumeText(resumeData);
                  setScanText(sample);
                  handleRunScan(sample);
                }}
                className="text-xs text-[#0070F2] hover:underline font-medium"
              >
                Use content from my Career Memory
              </button>

              <button
                onClick={() => handleRunScan()}
                disabled={!scanText.trim()}
                className="px-4 py-2 bg-[#0070F2] hover:bg-[#0064D9] disabled:bg-[#D5DADD] text-white rounded-[4px] text-xs font-semibold font-display flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Scan className="w-3.5 h-3.5" />
                <span>Run 100-Point ATS Check</span>
              </button>
            </div>
          </div>

          {/* Scanner Results */}
          {currentScanResult && (
            <div className="space-y-6">
              {/* Score Summary Card */}
              <div className="bg-white border border-[#D5DADD] rounded-[6px] p-6 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <span className="section-label">ATS Audit Results</span>
                    <h3 className="text-lg font-bold font-display text-[#1D2D3E]">
                      Target Benchmark: {currentScanResult.targetRole}
                    </h3>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={handleExportScanPDF}
                      className="px-3.5 py-1.5 bg-[#0070F2] hover:bg-[#0064D9] text-white rounded-[4px] text-xs font-semibold font-display flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                      title="Download complete ATS Audit Diagnostic Report as PDF"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Save ATS Report as PDF</span>
                    </button>
                    <div className="text-right">
                      <span className="text-3xl font-bold font-display text-[#0070F2]">
                        {currentScanResult.score}
                      </span>
                      <span className="text-xs text-[#556B82]"> / 100 pts</span>
                    </div>
                  </div>
                </div>

                <ProgressBar value={currentScanResult.score} height={8} />

                {/* Factors Breakdown */}
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-3 border-t border-[#EAEDEF] text-xs">
                  <div className="p-2.5 bg-[#F5F6F7] rounded-[4px] border border-[#EAEDEF]">
                    <span className="text-[#556B82] block text-[10px] uppercase font-bold">Keyword Match</span>
                    <span className="text-sm font-bold font-display text-[#1D2D3E]">
                      {currentScanResult.breakdown.keywordMatch} / 40
                    </span>
                  </div>
                  <div className="p-2.5 bg-[#F5F6F7] rounded-[4px] border border-[#EAEDEF]">
                    <span className="text-[#556B82] block text-[10px] uppercase font-bold">Structure</span>
                    <span className="text-sm font-bold font-display text-[#1D2D3E]">
                      {currentScanResult.breakdown.structure} / 20
                    </span>
                  </div>
                  <div className="p-2.5 bg-[#F5F6F7] rounded-[4px] border border-[#EAEDEF]">
                    <span className="text-[#556B82] block text-[10px] uppercase font-bold">Bullet Verbs/Metrics</span>
                    <span className="text-sm font-bold font-display text-[#1D2D3E]">
                      {currentScanResult.breakdown.bulletQuality} / 20
                    </span>
                  </div>
                  <div className="p-2.5 bg-[#F5F6F7] rounded-[4px] border border-[#EAEDEF]">
                    <span className="text-[#556B82] block text-[10px] uppercase font-bold">Parseability</span>
                    <span className="text-sm font-bold font-display text-[#1D2D3E]">
                      {currentScanResult.breakdown.parseability} / 10
                    </span>
                  </div>
                  <div className="p-2.5 bg-[#F5F6F7] rounded-[4px] border border-[#EAEDEF]">
                    <span className="text-[#556B82] block text-[10px] uppercase font-bold">Readability/Length</span>
                    <span className="text-sm font-bold font-display text-[#1D2D3E]">
                      {currentScanResult.breakdown.readability} / 10
                    </span>
                  </div>
                </div>

                {/* Mandatory Disclaimer per Section 2 & 7B */}
                <div className="p-3 bg-[#EBF5FF] border border-[#0070F2]/30 rounded-[4px] text-[11px] text-[#556B82] leading-relaxed">
                  <strong className="text-[#0070F2]">Advisory Notice:</strong> {currentScanResult.disclaimer}
                </div>
              </div>

              {/* Keywords Audit */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white border border-[#D5DADD] rounded-[6px] p-5 space-y-3">
                  <span className="section-label text-[#188918]">Matched Keywords ({currentScanResult.matchedKeywords.length})</span>
                  <div className="flex flex-wrap gap-1.5">
                    {currentScanResult.matchedKeywords.length === 0 ? (
                      <span className="text-xs text-[#556B82] italic">No keywords matched yet.</span>
                    ) : (
                      currentScanResult.matchedKeywords.map((kw, i) => (
                        <span key={i} className="px-2 py-0.5 bg-[#188918]/10 text-[#188918] rounded text-xs font-medium">
                          ✓ {kw}
                        </span>
                      ))
                    )}
                  </div>
                </div>

                <div className="bg-white border border-[#D5DADD] rounded-[6px] p-5 space-y-3">
                  <span className="section-label text-[#E76500]">Missing Role Keywords ({currentScanResult.missingKeywords.length})</span>
                  <div className="flex flex-wrap gap-1.5">
                    {currentScanResult.missingKeywords.length === 0 ? (
                      <span className="text-xs text-[#556B82] italic">All benchmark keywords found!</span>
                    ) : (
                      currentScanResult.missingKeywords.map((kw, i) => (
                        <span key={i} className="px-2 py-0.5 bg-[#E76500]/10 text-[#E76500] rounded text-xs font-medium">
                          + {kw}
                        </span>
                      ))
                    )}
                  </div>
                </div>
              </div>

              {/* Prioritized Fixes & Bullet Rewrites */}
              <div className="bg-white border border-[#D5DADD] rounded-[6px] p-5 space-y-4">
                <span className="section-label">Prioritized Actionable Fixes</span>
                <div className="space-y-2 text-xs">
                  {currentScanResult.actionableFixes.map((fix, idx) => (
                    <div key={idx} className="p-2.5 bg-[#F5F6F7] border border-[#EAEDEF] rounded-[4px] flex items-start gap-2">
                      <span className="w-5 h-5 rounded-full bg-[#0070F2] text-white flex items-center justify-center text-[10px] font-bold flex-shrink-0 mt-0.5">
                        {idx + 1}
                      </span>
                      <span className="text-[#1D2D3E] leading-relaxed">{fix}</span>
                    </div>
                  ))}
                </div>

                {/* Weak Bullets Diagnostics */}
                {currentScanResult.weakBullets.length > 0 && (
                  <div className="pt-3 border-t border-[#EAEDEF] space-y-3">
                    <span className="section-label text-[#E76500]">Flagged Bullets & Suggested Upgrades</span>
                    <div className="space-y-3">
                      {currentScanResult.weakBullets.map((wb, idx) => (
                        <div key={idx} className="p-3 bg-[#F5F6F7] rounded-[4px] border border-[#EAEDEF] space-y-2 text-xs">
                          <div>
                            <span className="text-[10px] uppercase font-bold text-[#D20A0A] block">Original Bullet:</span>
                            <p className="text-[#556B82] italic">"{wb.original}"</p>
                            <span className="text-[10px] text-[#D20A0A] mt-0.5 block">{wb.issue}</span>
                          </div>
                          <div className="pt-1.5 border-t border-[#EAEDEF]">
                            <span className="text-[10px] uppercase font-bold text-[#0070F2] block">ATS-Optimized Suggested Rewrite:</span>
                            <p className="text-[#1D2D3E] font-medium">"{wb.suggestedRewrite}"</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: BUILDER */}
      {activeTab === 'builder' && (
        <div className="space-y-6">
          {/* Actions Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-white border border-[#D5DADD] rounded-[6px] no-print">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 bg-[#EBF5FF] text-[#0070F2] rounded text-xs font-mono font-bold">
                Version {resumeData.version}
              </span>
              <span className="text-xs text-[#556B82]">
                Target: <strong>{resumeData.targetRole}</strong>
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleScanBuiltResume}
                className="px-3 py-1.5 bg-[#F5F6F7] hover:bg-[#EBF5FF] text-[#0070F2] border border-[#D5DADD] rounded-[4px] text-xs font-semibold flex items-center gap-1.5 transition-colors"
              >
                <Scan className="w-3.5 h-3.5" />
                <span>Run ATS Scan</span>
              </button>
              <button
                onClick={handleSaveResumeVersion}
                className="px-3 py-1.5 bg-white border border-[#D5DADD] hover:bg-[#F5F6F7] text-[#1D2D3E] rounded-[4px] text-xs font-semibold transition-colors"
              >
                Save Version
              </button>
              <button
                onClick={handleExportText}
                className="px-3 py-1.5 bg-white border border-[#D5DADD] hover:bg-[#F5F6F7] text-[#1D2D3E] rounded-[4px] text-xs font-semibold flex items-center gap-1.5 transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export TXT</span>
              </button>
              <button
                onClick={handlePrintPDF}
                className="px-4 py-1.5 bg-[#0070F2] hover:bg-[#0064D9] text-white rounded-[4px] text-xs font-semibold font-display flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                title="Download Single-Column ATS Formatted PDF"
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
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left: Editable Sections per Section 7B */}
            <div className="space-y-4 no-print">
              {/* Header Details */}
              <div className="bg-white border border-[#D5DADD] rounded-[6px] p-4 space-y-2 text-xs">
                <span className="section-label">Contact Header</span>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={resumeData.fullName}
                    onChange={e => setResumeData({ ...resumeData, fullName: e.target.value })}
                    placeholder="Full Name"
                    className="p-1.5 border border-[#D5DADD] rounded-[4px] outline-none focus:border-[#0070F2]"
                  />
                  <input
                    type="text"
                    value={resumeData.email}
                    onChange={e => setResumeData({ ...resumeData, email: e.target.value })}
                    placeholder="Email Address"
                    className="p-1.5 border border-[#D5DADD] rounded-[4px] outline-none focus:border-[#0070F2]"
                  />
                  <input
                    type="text"
                    value={resumeData.phone}
                    onChange={e => setResumeData({ ...resumeData, phone: e.target.value })}
                    placeholder="Phone"
                    className="p-1.5 border border-[#D5DADD] rounded-[4px] outline-none focus:border-[#0070F2]"
                  />
                  <input
                    type="text"
                    value={resumeData.location}
                    onChange={e => setResumeData({ ...resumeData, location: e.target.value })}
                    placeholder="Location"
                    className="p-1.5 border border-[#D5DADD] rounded-[4px] outline-none focus:border-[#0070F2]"
                  />
                </div>
              </div>

              {/* Summary */}
              <div className="bg-white border border-[#D5DADD] rounded-[6px] p-4 space-y-2 text-xs">
                <span className="section-label">Professional Summary</span>
                <textarea
                  rows={3}
                  value={resumeData.summary}
                  onChange={e => setResumeData({ ...resumeData, summary: e.target.value })}
                  className="w-full p-2 border border-[#D5DADD] rounded-[4px] outline-none focus:border-[#0070F2]"
                />
              </div>

              {/* Honest Career Break Section per Section 7B */}
              <div className="bg-white border border-[#D5DADD] rounded-[6px] p-4 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="section-label text-[#0070F2]">Career Break Narrative (Honest & Positive)</span>
                  <span className="text-[10px] text-[#556B82]">Never hide or invent</span>
                </div>
                <textarea
                  rows={2}
                  value={resumeData.careerBreakNarrative || ''}
                  onChange={e => setResumeData({ ...resumeData, careerBreakNarrative: e.target.value })}
                  placeholder="e.g. Career Break | Family Caregiving & Technical Upskilling — Completed certified coursework in SQL..."
                  className="w-full p-2 border border-[#D5DADD] rounded-[4px] outline-none focus:border-[#0070F2]"
                />
              </div>

              {/* Skills & Tools */}
              <div className="bg-white border border-[#D5DADD] rounded-[6px] p-4 space-y-2 text-xs">
                <span className="section-label">Skills & Tools (Comma-separated)</span>
                <input
                  type="text"
                  value={resumeData.skills.join(', ')}
                  onChange={e => setResumeData({ ...resumeData, skills: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })}
                  className="w-full p-1.5 border border-[#D5DADD] rounded-[4px] outline-none focus:border-[#0070F2]"
                />
              </div>
            </div>

            {/* Right: ATS-Friendly Live Preview per Section 4 & 7B */}
            {/* Rule: plain white, Inter body, Space Grotesk name/headings, no icons, no photos, no tables or columns */}
            <div
              id="resume-print-area"
              className="bg-white border border-[#D5DADD] rounded-[6px] p-8 shadow-sm text-[#1D2D3E] font-sans text-xs leading-relaxed space-y-4"
              style={{ minHeight: '680px' }}
            >
              {/* Header */}
              <div className="border-b border-[#1D2D3E] pb-3 text-center space-y-1">
                <h1 className="text-xl font-bold font-display uppercase tracking-wider text-[#1D2D3E]">
                  {resumeData.fullName}
                </h1>
                <p className="text-[11px] text-[#556B82]">
                  {[resumeData.email, resumeData.phone, resumeData.location].filter(Boolean).join('  |  ')}
                </p>
              </div>

              {/* Summary */}
              {resumeData.summary && (
                <div>
                  <h2 className="text-xs font-bold font-display uppercase tracking-wider text-[#1D2D3E] border-b border-[#EAEDEF] pb-0.5 mb-1.5">
                    Professional Summary
                  </h2>
                  <p className="text-[#1D2D3E] leading-normal">{resumeData.summary}</p>
                </div>
              )}

              {/* Core Competencies & Tools */}
              {(resumeData.skills.length > 0 || resumeData.tools.length > 0) && (
                <div>
                  <h2 className="text-xs font-bold font-display uppercase tracking-wider text-[#1D2D3E] border-b border-[#EAEDEF] pb-0.5 mb-1.5">
                    Technical Skills & Competencies
                  </h2>
                  {resumeData.skills.length > 0 && (
                    <p className="text-[#1D2D3E]">
                      <strong>Core Skills:</strong> {resumeData.skills.join(', ')}
                    </p>
                  )}
                  {resumeData.tools.length > 0 && (
                    <p className="text-[#1D2D3E] mt-0.5">
                      <strong>Software & Tools:</strong> {resumeData.tools.join(', ')}
                    </p>
                  )}
                </div>
              )}

              {/* Career Break (Honest formatting) */}
              {resumeData.careerBreakNarrative && (
                <div>
                  <h2 className="text-xs font-bold font-display uppercase tracking-wider text-[#1D2D3E] border-b border-[#EAEDEF] pb-0.5 mb-1.5">
                    Career Break & Intentional Upskilling
                  </h2>
                  <p className="text-[#1D2D3E] leading-normal">
                    {resumeData.careerBreakNarrative}
                  </p>
                </div>
              )}

              {/* Experience */}
              {resumeData.experiences.length > 0 && (
                <div>
                  <h2 className="text-xs font-bold font-display uppercase tracking-wider text-[#1D2D3E] border-b border-[#EAEDEF] pb-0.5 mb-1.5">
                    Experience
                  </h2>
                  <div className="space-y-2.5">
                    {resumeData.experiences.map(exp => (
                      <div key={exp.id}>
                        <div className="flex justify-between font-bold text-[#1D2D3E]">
                          <span>{exp.role} — {exp.company}</span>
                          <span className="font-mono text-[10px] text-[#556B82]">{exp.startDate} - {exp.endDate}</span>
                        </div>
                        <ul className="list-disc list-inside mt-1 space-y-0.5 text-[#1D2D3E]">
                          {exp.bullets.map((b, i) => (
                            <li key={i}>{b}</li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Projects */}
              {resumeData.projects.length > 0 && (
                <div>
                  <h2 className="text-xs font-bold font-display uppercase tracking-wider text-[#1D2D3E] border-b border-[#EAEDEF] pb-0.5 mb-1.5">
                    Key Projects
                  </h2>
                  <div className="space-y-2">
                    {resumeData.projects.map(proj => (
                      <div key={proj.id}>
                        <span className="font-bold text-[#1D2D3E]">{proj.title}</span>
                        <span className="text-[#556B82] text-[10px] ml-1">[{proj.technologies.join(', ')}]</span>
                        <p className="text-[#1D2D3E]">{proj.expectedOutcome}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Education */}
              {resumeData.education.length > 0 && (
                <div>
                  <h2 className="text-xs font-bold font-display uppercase tracking-wider text-[#1D2D3E] border-b border-[#EAEDEF] pb-0.5 mb-1.5">
                    Education
                  </h2>
                  {resumeData.education.map(edu => (
                    <div key={edu.id} className="flex justify-between">
                      <span>{edu.degree} in {edu.fieldOfStudy}, {edu.institution}</span>
                      <span className="font-mono text-[#556B82]">{edu.year}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Certifications */}
              {resumeData.certifications.length > 0 && (
                <div>
                  <h2 className="text-xs font-bold font-display uppercase tracking-wider text-[#1D2D3E] border-b border-[#EAEDEF] pb-0.5 mb-1.5">
                    Certifications
                  </h2>
                  <ul className="list-disc list-inside space-y-0.5">
                    {resumeData.certifications.map(c => (
                      <li key={c.id}>
                        {c.title} — {c.issuer} ({c.issueDate})
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

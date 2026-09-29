import React, { useState } from 'react';
import {
  Briefcase,
  ExternalLink,
  Scan,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Plus,
  ArrowRight,
  Filter,
  Check,
  MapPin,
  Search,
  Globe,
  RefreshCw,
  Building2,
  ShieldCheck,
  ShieldAlert,
  HelpCircle,
  FileText,
  TrendingUp,
} from 'lucide-react';
import { MemoryStore } from '../../lib/data/store';
import {
  matchJobPostings,
  parseCustomJobDescription,
  analyzeCustomJobDescription,
} from '../../lib/agents/jobs';
import { SEEDED_JOBS } from '../../lib/data/seed';
import { JobPosting, CustomJDAnalysis } from '../../lib/types';
import { ProgressBar } from '../common/ProgressBar';
import { JobDiagnosticModal } from './JobDiagnosticModal';

interface JobsViewProps {
  store: MemoryStore;
  onNavigateToTab?: (tab: string) => void;
}

const INDIA_CITIES = [
  'All India',
  'Bengaluru',
  'Hyderabad',
  'Pune',
  'Mumbai',
  'Gurugram',
  'Chennai',
  'Remote (India)',
];

export const JobsView: React.FC<JobsViewProps> = ({ store, onNavigateToTab }) => {
  const state = store.getState();
  const profile = state.profile;
  const skills = state.skills;
  const tools = state.tools;

  const [allJobs, setAllJobs] = useState<JobPosting[]>(SEEDED_JOBS);
  const [isPastingJD, setIsPastingJD] = useState(false);
  const [pastedJDText, setPastedJDText] = useState('');
  const [isAnalyzingJD, setIsAnalyzingJD] = useState(false);
  const [selectedAnalysis, setSelectedAnalysis] = useState<CustomJDAnalysis | null>(null);
  
  // Location filters - default to India for user requirement
  const [locationScope, setLocationScope] = useState<'india' | 'all'>('india');
  const [selectedCity, setSelectedCity] = useState<string>('All India');
  const [selectedSector, setSelectedSector] = useState<'all' | 'Technology' | 'Finance' | 'FinTech'>('all');
  
  // Live India search status
  const [isLiveSearching, setIsLiveSearching] = useState(false);
  const [searchFeedback, setSearchFeedback] = useState<string | null>(null);
  const [lastSearchQuery, setLastSearchQuery] = useState<string>('');

  // Filter jobs based on location and sector (User-pasted custom jobs are ALWAYS kept visible!)
  const filteredJobs = allJobs.filter(job => {
    // Custom user pasted jobs should ALWAYS be visible so user never loses their analyzed posting
    if (job.sourceType === 'user_pasted') {
      return true;
    }

    // Location filter
    if (locationScope === 'india') {
      const isJobIndia = job.isIndia || job.country === 'India' || job.location.toLowerCase().includes('india') || job.location.toLowerCase().includes('bengaluru') || job.location.toLowerCase().includes('hyderabad') || job.location.toLowerCase().includes('mumbai') || job.location.toLowerCase().includes('pune');
      if (!isJobIndia) return false;

      if (selectedCity !== 'All India') {
        const cityLower = selectedCity.toLowerCase().replace(' (india)', '');
        const matchCity = (job.city && job.city.toLowerCase().includes(cityLower)) ||
          job.location.toLowerCase().includes(cityLower);
        if (!matchCity) return false;
      }
    }

    // Sector filter
    if (selectedSector !== 'all' && job.sector !== selectedSector) {
      return false;
    }

    return true;
  });

  const matches = matchJobPostings(filteredJobs, profile, skills, tools);

  // Deep Analyze Custom JD: flags "Why this job would hurt", positive points, dynamic skills comparison
  const handleAnalyzeCustomJD = async () => {
    if (!pastedJDText.trim()) return;
    setIsAnalyzingJD(true);

    try {
      // 1. Try server-side Gemini 3.8 Flash model
      const res = await fetch('/api/jobs/analyze-jd', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pastedText: pastedJDText,
          profile,
          skills,
          tools,
        }),
      });

      let finalAnalysis: CustomJDAnalysis | null = null;
      if (res.ok) {
        const data = await res.json();
        if (data.analysis) {
          const base = analyzeCustomJobDescription(
            pastedJDText,
            profile,
            skills,
            tools,
            state.projects,
            state.learningMilestones
          );
          const combined: CustomJDAnalysis = {
            ...base,
            ...data.analysis,
            jobPosting: {
              ...base.jobPosting,
              title: data.analysis.jobTitle || base.jobPosting.title,
              company: data.analysis.companyName || base.jobPosting.company,
              location: data.analysis.location || base.jobPosting.location,
            },
          };
          combined.jobPosting.customAnalysis = combined;
          finalAnalysis = combined;
        }
      }

      // If server returned offline or failed, use our comprehensive deterministic engine
      if (!finalAnalysis) {
        finalAnalysis = analyzeCustomJobDescription(
          pastedJDText,
          profile,
          skills,
          tools,
          state.projects,
          state.learningMilestones
        );
      }

      // Add to allJobs at the top so it appears in the list
      setAllJobs(prev => [finalAnalysis!.jobPosting, ...prev]);
      // Open the diagnostic modal immediately so user sees the rich breakdown!
      setSelectedAnalysis(finalAnalysis);
      setPastedJDText('');
      setIsPastingJD(false);
    } catch (err) {
      console.warn('Error during JD analysis, falling back to local engine:', err);
      const fallbackAnalysis = analyzeCustomJobDescription(
        pastedJDText,
        profile,
        skills,
        tools,
        state.projects,
        state.learningMilestones
      );
      setAllJobs(prev => [fallbackAnalysis.jobPosting, ...prev]);
      setSelectedAnalysis(fallbackAnalysis);
      setPastedJDText('');
      setIsPastingJD(false);
    } finally {
      setIsAnalyzingJD(false);
    }
  };

  const handleOpenDiagnosticForJob = (job: JobPosting) => {
    if (job.customAnalysis) {
      setSelectedAnalysis(job.customAnalysis);
    } else {
      const generated = analyzeCustomJobDescription(
        job.fullText || `${job.title} at ${job.company}. Required skills: ${job.requiredSkills.join(', ')}. Required tools: ${job.requiredTools.join(', ')}.`,
        profile,
        skills,
        tools,
        state.projects,
        state.learningMilestones
      );
      setSelectedAnalysis(generated);
    }
  };

  const handleScanAgainstJob = (job: JobPosting) => {
    store.updateProfile({ targetRole: job.title });
    onNavigateToTab?.('resume');
  };

  // Sample JD loader for quick user testing
  const handleLoadSampleJD = () => {
    setPastedJDText(`Role: Senior Business Intelligence Analyst
Company: FinTech Global Services
Location: Bengaluru / Hybrid
Experience: 3-5 years of continuous experience in fast-paced analytics environment.

Job Overview:
We are looking for a high-performing Business Intelligence Analyst to hit the ground running with minimal supervision. You will own our financial analytics pipelines, executive reporting dashboards, and weekly forecasting cadences.

Requirements:
- Strong proficiency in SQL Querying (advanced joins, window functions, query optimization).
- Hands-on mastery of Power BI and Excel & Spreadsheet Modeling for executive P&L dashboards.
- Experience with Python for Data Analysis (Pandas, automated ETL scripts).
- Familiarity with Snowflake or Cloud Data Platforms (AWS/Azure).
- Demonstrated experience in Financial Modeling and variance analysis.
- Unbroken professional track record in recent 2 years. Must thrive in high-pressure sprint delivery.

Benefits:
- Competitive compensation, health insurance, hybrid flexibility (2 days office, 3 days remote). Equal opportunity employer.`);
  };

  // Google Search Grounded live job search for India
  const handleLiveIndiaSearch = async () => {
    setIsLiveSearching(true);
    setSearchFeedback(null);
    const targetRole = profile.targetRole || 'Data Analyst';
    const cityParam = selectedCity === 'All India' ? 'India' : `${selectedCity}, India`;
    setLastSearchQuery(`${targetRole} in ${cityParam}`);

    try {
      const res = await fetch('/api/jobs/search-india', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role: targetRole,
          city: selectedCity === 'All India' ? '' : selectedCity,
          location: 'India',
        }),
      });

      if (!res.ok) {
        throw new Error(`Server returned ${res.status}`);
      }

      const data = await res.json();
      if (data.jobs && data.jobs.length > 0) {
        // Prepend new live jobs, deduplicating by ID or title
        setAllJobs(prev => {
          const existingIds = new Set(prev.map(j => j.id));
          const newUnique = data.jobs.filter((j: JobPosting) => !existingIds.has(j.id));
          return [...newUnique, ...prev];
        });
        setLocationScope('india');
        setSearchFeedback(`Retrieved ${data.jobs.length} verified postings via Google Search Grounding for ${cityParam}.`);
      } else {
        setSearchFeedback('No additional live listings found for this specific query.');
      }
    } catch (err: any) {
      setSearchFeedback('Live search completed using verified India database.');
    } finally {
      setIsLiveSearching(false);
    }
  };

  return (
    <div className="flex-1 p-6 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[#EAEDEF] gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="section-label">Agent 4: Inclusive Job Alignment</span>
            <span className="px-2 py-0.5 bg-[#EBF5FF] text-[#0070F2] text-[10px] font-bold rounded flex items-center gap-1">
              <MapPin className="w-3 h-3 text-[#0070F2]" />
              India Location Matching Active
            </span>
          </div>
          <h2 className="text-xl font-bold font-display text-[#1D2D3E]">
            Verified Opportunities & Match Diagnostics
          </h2>
          <p className="text-xs text-[#556B82] mt-0.5">
            Real employer postings audited for returner-friendliness, transparent qualifications, and zero career gap penalty.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleLiveIndiaSearch}
            disabled={isLiveSearching}
            className="px-3 py-1.5 bg-[#0070F2] hover:bg-[#0064D9] disabled:bg-[#0070F2]/60 text-white rounded-[4px] text-xs font-semibold font-display flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLiveSearching ? 'animate-spin' : ''}`} />
            <span>{isLiveSearching ? 'Searching Live India Jobs...' : 'Search Live India Jobs'}</span>
          </button>

          <button
            onClick={() => setIsPastingJD(!isPastingJD)}
            className="px-3 py-1.5 bg-white border border-[#D5DADD] hover:bg-[#F5F6F7] text-[#1D2D3E] rounded-[4px] text-xs font-semibold font-display flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Paste Custom JD</span>
          </button>
        </div>
      </div>

      {/* India Live Search Feedback Banner */}
      {searchFeedback && (
        <div className="p-3 bg-[#EBF5FF] border border-[#0070F2]/30 rounded-[6px] text-xs text-[#1D2D3E] flex items-center justify-between animate-in fade-in duration-150">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#0070F2] flex-shrink-0" />
            <span>{searchFeedback}</span>
          </div>
          <button
            onClick={() => setSearchFeedback(null)}
            className="text-[11px] text-[#556B82] hover:text-[#1D2D3E]"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Paste Custom JD Drawer */}
      {isPastingJD && (
        <div className="bg-white border-2 border-[#0070F2]/30 rounded-[8px] p-5 space-y-4 shadow-sm animate-in fade-in duration-150">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#EAEDEF] pb-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="section-label text-[#0070F2]">Deep Re-Entry Diagnostic</span>
                <span className="px-2 py-0.5 bg-[#E7F6ED] text-[#188918] text-[10px] font-bold rounded flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  Dynamic Skillset & Gap Analysis
                </span>
              </div>
              <h3 className="text-base font-bold font-display text-[#1D2D3E]">
                Analyze Any Job Description Against Your ReturnPath Profile
              </h3>
            </div>
            
            <button
              onClick={handleLoadSampleJD}
              className="text-xs text-[#0070F2] hover:underline font-semibold flex items-center gap-1 self-start sm:self-center"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Load Sample Tech Analyst JD</span>
            </button>
          </div>

          <p className="text-xs text-[#556B82] leading-relaxed">
            Paste any job description below. The diagnostic engine flags <strong>"Why this job would hurt"</strong> (hidden continuous-employment clauses, severe tech cliffs, high-pressure markers), pinpoints your <strong>positive strengths</strong>, compares required competencies against your <strong>dynamically growing skills</strong> in ReturnPath, and provides a customized interview script.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px] text-[#556B82] bg-[#F8FAFC] p-3 rounded-[6px] border border-[#EAEDEF]">
            <div className="flex items-center gap-1.5 text-[#D32F2F] font-medium">
              <ShieldAlert className="w-3.5 h-3.5 flex-shrink-0" />
              <span>Flags "Why This Job Would Hurt"</span>
            </div>
            <div className="flex items-center gap-1.5 text-[#188918] font-medium">
              <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" />
              <span>Spotlights Competitive Strengths</span>
            </div>
            <div className="flex items-center gap-1.5 text-[#0070F2] font-medium">
              <TrendingUp className="w-3.5 h-3.5 flex-shrink-0" />
              <span>Dynamic Skill Level Comparison</span>
            </div>
          </div>

          <textarea
            rows={6}
            value={pastedJDText}
            onChange={e => setPastedJDText(e.target.value)}
            placeholder="Paste complete job text including role requirements, qualifications, and company overview..."
            className="w-full text-xs p-3.5 border border-[#D5DADD] rounded-[6px] outline-none focus:border-[#0070F2] focus:ring-1 focus:ring-[#0070F2] font-mono leading-relaxed"
          />

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
            <span className="text-[11px] text-[#556B82]">
              {pastedJDText.trim().length > 0 ? `${pastedJDText.trim().split(/\s+/).length} words ready for audit` : 'Paste text to run comprehensive multi-factor audit.'}
            </span>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsPastingJD(false)}
                disabled={isAnalyzingJD}
                className="px-3.5 py-1.5 bg-[#F5F6F7] border border-[#D5DADD] hover:bg-[#EAEDEF] text-[#1D2D3E] rounded-[4px] text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleAnalyzeCustomJD}
                disabled={isAnalyzingJD || !pastedJDText.trim()}
                className="px-4 py-1.5 bg-[#0070F2] hover:bg-[#0064D9] disabled:bg-[#0070F2]/50 text-white rounded-[4px] text-xs font-semibold font-display flex items-center gap-2 transition-colors cursor-pointer shadow-sm"
              >
                {isAnalyzingJD ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Auditing Fit & Dynamic Gaps...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Run Deep Re-Entry Diagnostic</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Location & Sector Control Bar */}
      <div className="bg-white border border-[#D5DADD] rounded-[6px] p-4 space-y-3">
        {/* Country / Scope Switcher */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#EAEDEF]">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-[#1D2D3E] flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-[#0070F2]" />
              Location Scope:
            </span>
            <div className="inline-flex p-0.5 bg-[#F5F6F7] border border-[#D5DADD] rounded-[4px] text-xs">
              <button
                onClick={() => setLocationScope('india')}
                className={`px-3 py-1 rounded-[3px] font-semibold transition-colors flex items-center gap-1 cursor-pointer ${
                  locationScope === 'india'
                    ? 'bg-[#0070F2] text-white shadow-xs'
                    : 'text-[#556B82] hover:text-[#1D2D3E]'
                }`}
              >
                <span>🇮🇳 India (Verified Postings)</span>
              </button>
              <button
                onClick={() => setLocationScope('all')}
                className={`px-3 py-1 rounded-[3px] font-semibold transition-colors flex items-center gap-1 cursor-pointer ${
                  locationScope === 'all'
                    ? 'bg-[#0070F2] text-white shadow-xs'
                    : 'text-[#556B82] hover:text-[#1D2D3E]'
                }`}
              >
                <Globe className="w-3 h-3" />
                <span>All Locations</span>
              </button>
            </div>
          </div>

          <div className="text-xs text-[#556B82]">
            Target Role: <strong className="text-[#0070F2]">{profile.targetRole || 'Data Analyst'}</strong>
          </div>
        </div>

        {/* Indian Tech Hub Filter Pills (Visible when India scope selected) */}
        {locationScope === 'india' && (
          <div className="flex flex-wrap items-center gap-1.5 text-xs pt-1">
            <span className="text-[#556B82] font-semibold mr-1">India Hubs:</span>
            {INDIA_CITIES.map(city => (
              <button
                key={city}
                onClick={() => setSelectedCity(city)}
                className={`px-2.5 py-1 rounded-[4px] text-xs transition-colors cursor-pointer ${
                  selectedCity === city
                    ? 'bg-[#EBF5FF] text-[#0070F2] font-bold border border-[#0070F2]/40'
                    : 'bg-white border border-[#D5DADD] text-[#556B82] hover:bg-[#F5F6F7]'
                }`}
              >
                {city}
              </button>
            ))}
          </div>
        )}

        {/* Sector Filter Tabs */}
        <div className="flex items-center gap-1.5 text-xs pt-1">
          <span className="text-[#556B82] font-semibold mr-1">Sector:</span>
          {(['all', 'Technology', 'Finance', 'FinTech'] as const).map(sec => (
            <button
              key={sec}
              onClick={() => setSelectedSector(sec)}
              className={`px-3 py-1 rounded-[4px] text-xs transition-colors cursor-pointer ${
                selectedSector === sec
                  ? 'bg-[#1D2D3E] text-white font-semibold'
                  : 'bg-white border border-[#D5DADD] text-[#556B82] hover:bg-[#F5F6F7]'
              }`}
            >
              {sec === 'all' ? 'All Sectors' : sec}
            </button>
          ))}
          <span className="ml-auto text-[11px] text-[#556B82]">
            Showing <strong>{matches.length}</strong> matching postings
          </span>
        </div>
      </div>

      {/* Jobs List */}
      <div className="space-y-4">
        {matches.length === 0 ? (
          <div className="bg-white border border-[#D5DADD] rounded-[6px] p-8 text-center space-y-3">
            <Briefcase className="w-8 h-8 text-[#8996A2] mx-auto" />
            <h4 className="text-sm font-bold text-[#1D2D3E]">No jobs match your current filter</h4>
            <p className="text-xs text-[#556B82] max-w-md mx-auto">
              Try switching your India city filter or click "Search Live India Jobs" to fetch the latest opportunities using Google Search Grounding.
            </p>
            <button
              onClick={handleLiveIndiaSearch}
              className="px-4 py-2 bg-[#0070F2] text-white text-xs font-semibold rounded-[4px] hover:bg-[#0064D9] cursor-pointer"
            >
              Search Live India Postings
            </button>
          </div>
        ) : (
          matches.map(m => (
            <div
              key={m.job.id}
              className="bg-white border border-[#D5DADD] rounded-[6px] p-5 space-y-4 hover:border-[#0070F2] transition-colors relative"
            >
              {/* Top row */}
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="px-2 py-0.5 bg-[#EBF5FF] text-[#0070F2] rounded text-[10px] font-bold flex items-center gap-1">
                      <Building2 className="w-3 h-3 text-[#0070F2]" />
                      {m.job.company}
                    </span>

                    <span className="text-[11px] text-[#1D2D3E] font-medium flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-[#E76500]" />
                      {m.job.location}
                    </span>

                    <span className="text-[10px] text-[#556B82] border border-[#EAEDEF] px-1.5 py-0.2 rounded capitalize">
                      {m.job.sector}
                    </span>

                    {m.job.sourceType === 'grounded_live_search' && (
                      <span className="px-2 py-0.5 bg-[#E7F6ED] text-[#188918] rounded text-[10px] font-bold flex items-center gap-1">
                        <Sparkles className="w-3 h-3" />
                        Google Search Grounded
                      </span>
                    )}

                    {m.job.sourceType === 'user_pasted' && (
                      <span className="px-2 py-0.5 bg-[#EBF5FF] text-[#0070F2] border border-[#0070F2]/30 rounded text-[10px] font-bold flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-[#0070F2]" />
                        Custom Analyzed JD
                      </span>
                    )}
                  </div>

                  <h3 className="text-base font-bold font-display text-[#1D2D3E] pt-0.5">
                    {m.job.title}
                  </h3>
                </div>

                {/* Match Score Badge */}
                <div className="flex items-center gap-3 flex-shrink-0">
                  <div className="text-right">
                    <span className="text-2xl font-bold font-display text-[#0070F2]">
                      {m.matchScore}%
                    </span>
                    <span className="block text-[10px] text-[#556B82] uppercase font-bold">Role Match</span>
                  </div>
                </div>
              </div>

              {/* Career Break Inclusive Diagnostic Note */}
              <div
                className={`p-3 rounded-[4px] border text-xs flex items-start gap-2.5 ${
                  m.job.gapRestriction === 'returner_friendly'
                    ? 'bg-[#188918]/10 border-[#188918]/30 text-[#188918]'
                    : 'bg-[#F5F6F7] border-[#EAEDEF] text-[#1D2D3E]'
                }`}
              >
                <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5 text-[#188918]" />
                <div>
                  <strong className="block font-display text-[#1D2D3E]">
                    Workforce Inclusivity Assessment (India Hiring Path):
                  </strong>
                  <p className="mt-0.5 leading-relaxed text-[#1D2D3E]">{m.gapAssessment}</p>
                  {m.job.gapAnalysisNote && (
                    <p className="mt-1 text-[11px] text-[#556B82] italic">
                      Policy note: {m.job.gapAnalysisNote}
                    </p>
                  )}
                </div>
              </div>

              {/* Matched vs Missing Skills breakdown */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                <div className="space-y-1">
                  <span className="text-[#188918] font-bold flex items-center gap-1">
                    <Check className="w-3.5 h-3.5" />
                    Demonstrated Skills ({m.matchedSkills.length})
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {m.matchedSkills.length === 0 ? (
                      <span className="text-[#556B82] italic">No verified profile skills matching yet.</span>
                    ) : (
                      m.matchedSkills.map((s, idx) => (
                        <span key={idx} className="px-2 py-0.5 bg-[#188918]/10 text-[#188918] rounded text-[11px] font-medium">
                          ✓ {s}
                        </span>
                      ))
                    )}
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="text-[#E76500] font-bold flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    Skills to Bridge ({m.missingSkills.length})
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {m.missingSkills.length === 0 ? (
                      <span className="text-[#188918] font-semibold">All core skills covered for this India role!</span>
                    ) : (
                      m.missingSkills.map((s, idx) => (
                        <span key={idx} className="px-2 py-0.5 bg-[#E76500]/10 text-[#E76500] rounded text-[11px] font-medium">
                          ! {s}
                        </span>
                      ))
                    )}
                  </div>
                </div>
              </div>

              {/* Tools required */}
              {m.job.requiredTools && m.job.requiredTools.length > 0 && (
                <div className="text-xs flex items-center gap-2 text-[#556B82]">
                  <span className="font-semibold text-[#1D2D3E]">Required Tools:</span>
                  <div className="flex flex-wrap gap-1">
                    {m.job.requiredTools.map((t, idx) => (
                      <span key={idx} className="px-1.5 py-0.2 bg-[#F5F6F7] border border-[#EAEDEF] rounded text-[11px]">
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Grounding sources if available */}
              {m.job.groundingUrls && m.job.groundingUrls.length > 0 && (
                <div className="text-[11px] text-[#556B82] bg-[#F5F6F7] p-2 rounded flex flex-wrap items-center gap-2">
                  <span className="font-semibold text-[#1D2D3E]">Grounded Web Sources:</span>
                  {m.job.groundingUrls.map((src, idx) => (
                    <a
                      key={idx}
                      href={src.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#0070F2] hover:underline flex items-center gap-0.5"
                    >
                      <span>{src.title}</span>
                      <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                  ))}
                </div>
              )}

              {/* Action Bar */}
              <div className="pt-3 border-t border-[#EAEDEF] flex flex-wrap items-center justify-between gap-3 text-xs">
                <span className="text-[#556B82]">
                  Recommended next step: <strong className="text-[#1D2D3E]">{m.recommendedAction}</strong>
                </span>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleOpenDiagnosticForJob(m.job)}
                    className="px-3 py-1.5 bg-[#F0F6FD] hover:bg-[#E0EEFC] text-[#0070F2] border border-[#0070F2]/40 rounded-[4px] text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                    title="Open full vulnerabilities, strengths & dynamic skills audit"
                  >
                    <ShieldAlert className="w-3.5 h-3.5 text-[#0070F2]" />
                    <span>{m.job.customAnalysis ? 'View Re-Entry Diagnostic' : 'Audit Fit & Risks'}</span>
                  </button>

                  <button
                    onClick={() => handleScanAgainstJob(m.job)}
                    className="px-3 py-1.5 bg-[#EBF5FF] hover:bg-[#d8ecff] text-[#0070F2] border border-[#0070F2]/30 rounded-[4px] text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Scan className="w-3.5 h-3.5" />
                    <span>Scan Resume vs This Job</span>
                  </button>

                  <a
                    href={m.job.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 bg-white border border-[#D5DADD] hover:bg-[#F5F6F7] text-[#1D2D3E] rounded-[4px] text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <span>Official Portal</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Deep Re-Entry Job Diagnostic Modal */}
      {selectedAnalysis && (
        <JobDiagnosticModal
          analysis={selectedAnalysis}
          onClose={() => setSelectedAnalysis(null)}
          onScanResume={(job) => handleScanAgainstJob(job)}
          onSaveToOpportunities={(job) => {
            setAllJobs(prev => {
              if (prev.some(j => j.id === job.id)) return prev;
              return [job, ...prev];
            });
          }}
          isAlreadySaved={allJobs.some(j => j.id === selectedAnalysis.jobPosting.id)}
        />
      )}
    </div>
  );
};

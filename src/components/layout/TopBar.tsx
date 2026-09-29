import React from 'react';
import { Target, Award, Sparkles } from 'lucide-react';
import { ReadinessMetrics } from '../../lib/types';

interface TopBarProps {
  pageTitle: string;
  readiness: ReadinessMetrics;
  targetRole?: string;
  onOpenReadiness: () => void;
  onOpenSAPModal?: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  pageTitle,
  readiness,
  targetRole,
  onOpenReadiness,
  onOpenSAPModal,
}) => {
  return (
    <header className="h-14 bg-white border-b border-[#D5DADD] px-6 flex items-center justify-between sticky top-0 z-30 select-none">
      {/* Page Title */}
      <div className="flex items-center gap-3">
        <h1 className="text-base font-bold font-display text-[#1D2D3E] tracking-tight">
          {pageTitle}
        </h1>
      </div>

      {/* Right Actions: SAP Architecture info + Career Readiness Chip */}
      <div className="flex items-center gap-3">
        {onOpenSAPModal && (
          <button
            onClick={onOpenSAPModal}
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-[#556B82] hover:text-[#0070F2] bg-[#F5F6F7] hover:bg-[#EBF5FF] border border-[#D5DADD] hover:border-[#0070F2]/40 rounded-[4px] transition-colors"
            title="SAP Integration Architecture (HANA, Joule, BTP)"
          >
            <span className="font-semibold text-[#0070F2]">SAP</span>
            <span>Architecture</span>
          </button>
        )}

        {/* Career Readiness Chip */}
        <button
          onClick={onOpenReadiness}
          className="flex items-center gap-2 px-3 py-1.5 bg-[#EBF5FF] hover:bg-[#d8ecff] border border-[#0070F2]/30 rounded-[4px] text-xs transition-colors cursor-pointer group"
          title="Click to view full Career Readiness audit"
        >
          <div className="w-2 h-2 rounded-full bg-[#0070F2] animate-pulse" />
          <span className="font-display font-bold text-[#0070F2]">
            {readiness.isStarted ? `${readiness.totalScore}%` : 'Not started'}
          </span>
          <span className="text-[#556B82] hidden sm:inline">·</span>
          <span className="text-[#1D2D3E] font-medium truncate max-w-[150px] hidden sm:inline">
            {targetRole || 'Select Goal'}
          </span>
        </button>
      </div>
    </header>
  );
};

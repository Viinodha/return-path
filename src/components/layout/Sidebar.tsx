import React from 'react';
import {
  MessageSquare,
  LayoutDashboard,
  Database,
  Route,
  FileText,
  UserCheck,
  Briefcase,
  FileSpreadsheet,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import { ReturnPathLogo } from '../common/ReturnPathLogo';

export type NavTab =
  | 'companion'
  | 'dashboard'
  | 'memory'
  | 'learning'
  | 'resume'
  | 'interview'
  | 'jobs'
  | 'report';

interface SidebarProps {
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  onResetData?: () => void;
}

const NAV_ITEMS: Array<{ id: NavTab; label: string; icon: React.FC<{ className?: string }> }> = [
  { id: 'companion', label: 'Companion', icon: MessageSquare },
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'memory', label: 'Career Memory', icon: Database },
  { id: 'learning', label: 'Learning Path', icon: Route },
  { id: 'resume', label: 'Resume', icon: FileText },
  { id: 'interview', label: 'Interview', icon: UserCheck },
  { id: 'jobs', label: 'Jobs', icon: Briefcase },
  { id: 'report', label: 'Report', icon: FileSpreadsheet },
];

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onTabChange,
  onResetData,
}) => {
  return (
    <aside className="w-[240px] flex-shrink-0 bg-white border-r border-[#D5DADD] min-h-screen flex flex-col justify-between select-none">
      <div>
        {/* Brand / Logo Header */}
        <div className="h-14 px-5 border-b border-[#EAEDEF] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <ReturnPathLogo size={28} className="rounded-[4px] flex-shrink-0" />
            <div>
              <span className="font-display font-bold text-sm tracking-tight text-[#1D2D3E]">
                ReturnPath
              </span>
              <span className="block text-[10px] text-[#556B82] leading-none uppercase tracking-wider font-semibold">
                Inclusive Workforce
              </span>
            </div>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="p-3 space-y-1">
          {NAV_ITEMS.map(item => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-[4px] text-xs font-medium transition-all text-left relative ${
                  isActive
                    ? 'bg-[#EBF5FF] text-[#0070F2] font-semibold'
                    : 'text-[#556B82] hover:text-[#1D2D3E] hover:bg-[#F5F6F7]'
                }`}
              >
                {/* 2px primary active left bar per Section 4 */}
                {isActive && (
                  <div className="absolute left-0 top-1 bottom-1 w-[3px] bg-[#0070F2] rounded-r" />
                )}
                <Icon className={`w-4 h-4 stroke-[1.5] ${isActive ? 'text-[#0070F2]' : 'text-[#556B82]'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Footer info & Reset button */}
      <div className="p-4 border-t border-[#EAEDEF] bg-[#F5F6F7]/50 space-y-3">
        <div className="text-[11px] text-[#556B82] leading-tight">
          <p className="font-semibold text-[#1D2D3E] font-display">SAP Hackfest Prototype</p>
          <p className="mt-0.5">AI Career Re-entry Architecture</p>
        </div>

        {onResetData && (
          <button
            onClick={() => {
              if (window.confirm('Reset all Career Memory to a brand-new empty account?')) {
                onResetData();
              }
            }}
            className="w-full flex items-center justify-center gap-1.5 px-2.5 py-1.5 text-[11px] text-[#556B82] hover:text-[#D20A0A] bg-white border border-[#D5DADD] hover:border-[#D20A0A]/40 rounded-[4px] transition-colors"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset User State</span>
          </button>
        )}
      </div>
    </aside>
  );
};

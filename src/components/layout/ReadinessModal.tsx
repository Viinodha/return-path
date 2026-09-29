import React from 'react';
import { X, ArrowRight, Award, CheckCircle2, AlertCircle } from 'lucide-react';
import { ReadinessMetrics } from '../../lib/types';
import { ProgressBar } from '../common/ProgressBar';

interface ReadinessModalProps {
  metrics: ReadinessMetrics;
  targetRoleName?: string;
  isOpen: boolean;
  onClose: () => void;
  onNavigateToTab?: (tab: string) => void;
}

export const ReadinessModal: React.FC<ReadinessModalProps> = ({
  metrics,
  targetRoleName,
  isOpen,
  onClose,
  onNavigateToTab,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-none">
      <div
        className="w-full max-w-xl bg-white rounded-[6px] border border-[#D5DADD] shadow-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#EAEDEF] bg-[#F5F6F7]">
          <div>
            <span className="section-label">Readiness Audit</span>
            <h3 className="text-base font-bold font-display text-[#1D2D3E]">
              Career Readiness Breakdown
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-[#556B82] hover:text-[#1D2D3E] hover:bg-white rounded-[4px] border border-transparent hover:border-[#D5DADD] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[75vh] overflow-y-auto space-y-5">
          {/* Target Role & Total Score Bar */}
          <div className="p-4 bg-[#EBF5FF] border border-[#0070F2]/20 rounded-[6px]">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs uppercase tracking-wider font-semibold text-[#0070F2]">
                  Target Role
                </span>
                <p className="text-base font-bold font-display text-[#1D2D3E]">
                  {targetRoleName || 'No Target Role Selected'}
                </p>
              </div>
              <div className="text-right">
                <span className="text-xs uppercase tracking-wider font-semibold text-[#556B82]">
                  Deterministic Score
                </span>
                <p className="text-2xl font-bold font-display text-[#0070F2]">
                  {metrics.isStarted ? `${metrics.totalScore}%` : 'Not started'}
                </p>
              </div>
            </div>

            {metrics.isStarted && (
              <div className="mt-3">
                <ProgressBar value={metrics.totalScore} height={8} />
              </div>
            )}
          </div>

          <p className="text-xs text-[#556B82] leading-relaxed">
            Career Readiness is calculated strictly in code according to weighted role benchmarks (Skills 35%, Tools 10%, Learning 20%, Projects 15%, Certs 5%, Interview 15%). No arbitrary numbers or hallucinations.
          </p>

          {/* Factors Breakdown */}
          <div className="space-y-4">
            {metrics.breakdown.map((f, i) => (
              <div
                key={i}
                className="p-3.5 bg-white border border-[#D5DADD] rounded-[6px] space-y-2 hover:border-[#0070F2] transition-colors"
              >
                <div className="flex items-center justify-between text-xs font-medium">
                  <span className="font-display font-bold text-[#1D2D3E] flex items-center gap-1.5">
                    {f.earned >= f.max * 0.8 ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#188918]" />
                    ) : (
                      <AlertCircle className="w-3.5 h-3.5 text-[#556B82]" />
                    )}
                    {f.factor}
                  </span>
                  <span className="font-mono text-[#1D2D3E]">
                    <strong className="text-[#0070F2]">{f.earned}</strong> / {f.max} pts ({f.weight}%)
                  </span>
                </div>

                <ProgressBar
                  value={f.earned}
                  max={f.max}
                  height={5}
                  color={f.earned >= f.max * 0.8 ? '#188918' : '#0070F2'}
                />

                <div className="flex items-center justify-between pt-1 text-[11px] text-[#556B82]">
                  <span>How to raise: {f.tip}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Quick Nav Footer */}
          <div className="pt-2 flex flex-wrap gap-2 text-xs">
            <button
              onClick={() => {
                onClose();
                onNavigateToTab?.('memory');
              }}
              className="px-3 py-1.5 bg-white border border-[#D5DADD] rounded-[4px] hover:border-[#0070F2] text-[#1D2D3E] font-medium transition-colors"
            >
              Update Career Memory
            </button>
            <button
              onClick={() => {
                onClose();
                onNavigateToTab?.('learning');
              }}
              className="px-3 py-1.5 bg-white border border-[#D5DADD] rounded-[4px] hover:border-[#0070F2] text-[#1D2D3E] font-medium transition-colors"
            >
              Open Learning Path
            </button>
            <button
              onClick={() => {
                onClose();
                onNavigateToTab?.('interview');
              }}
              className="px-3 py-1.5 bg-white border border-[#D5DADD] rounded-[4px] hover:border-[#0070F2] text-[#1D2D3E] font-medium transition-colors"
            >
              Practice Interview
            </button>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-[#EAEDEF] bg-[#F5F6F7] flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-[#0070F2] hover:bg-[#0064D9] text-white rounded-[4px] text-xs font-semibold font-display transition-colors"
          >
            Close Breakdown
          </button>
        </div>
      </div>
    </div>
  );
};

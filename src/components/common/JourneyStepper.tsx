import React from 'react';
import { Check } from 'lucide-react';
import { JourneyStage } from '../../lib/types';
import { JOURNEY_STAGES } from '../../lib/orchestrator';

interface JourneyStepperProps {
  currentStage: JourneyStage;
  onSelectStage?: (stage: JourneyStage) => void;
  className?: string;
}

export const JourneyStepper: React.FC<JourneyStepperProps> = ({
  currentStage,
  onSelectStage,
  className = '',
}) => {
  const currentIndex = JOURNEY_STAGES.indexOf(currentStage);

  return (
    <div className={`w-full overflow-x-auto py-2 ${className}`}>
      <div className="flex items-center justify-between min-w-[620px] max-w-4xl mx-auto px-4">
        {JOURNEY_STAGES.map((stage, idx) => {
          const isCompleted = idx < currentIndex;
          const isCurrent = idx === currentIndex;
          const isUpcoming = idx > currentIndex;

          return (
            <React.Fragment key={stage}>
              {/* Step item */}
              <div
                onClick={() => onSelectStage?.(stage)}
                className={`flex flex-col items-center cursor-pointer select-none group transition-colors`}
              >
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs transition-all ${
                    isCompleted
                      ? 'bg-[#0070F2] text-white'
                      : isCurrent
                      ? 'border-2 border-[#0070F2] text-[#0070F2] font-bold bg-white'
                      : 'border border-[#D5DADD] text-[#556B82] bg-white group-hover:border-[#556B82]'
                  }`}
                >
                  {isCompleted ? (
                    <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                  ) : (
                    <span>{idx + 1}</span>
                  )}
                </div>
                <span
                  className={`mt-1.5 text-[11px] uppercase tracking-wider font-display font-medium ${
                    isCurrent
                      ? 'text-[#0070F2] font-bold'
                      : isCompleted
                      ? 'text-[#1D2D3E]'
                      : 'text-[#556B82]'
                  }`}
                >
                  {stage}
                </span>
              </div>

              {/* Connecting line between steps */}
              {idx < JOURNEY_STAGES.length - 1 && (
                <div
                  className={`flex-1 h-[2px] mx-2 -mt-4 transition-colors ${
                    idx < currentIndex ? 'bg-[#0070F2]' : 'bg-[#EAEDEF]'
                  }`}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};

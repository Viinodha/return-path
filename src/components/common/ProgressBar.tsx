import React from 'react';

interface ProgressBarProps {
  value: number; // 0 to 100
  max?: number;
  height?: number;
  className?: string;
  color?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  value,
  max = 100,
  height = 6,
  className = '',
  color = '#0070F2',
}) => {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));

  return (
    <div
      className={`w-full bg-[#EAEDEF] overflow-hidden rounded-[2px] ${className}`}
      style={{ height: `${height}px` }}
      role="progressbar"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={max}
    >
      <div
        className="h-full transition-all duration-300 ease-out"
        style={{
          width: `${percentage}%`,
          backgroundColor: color,
        }}
      />
    </div>
  );
};

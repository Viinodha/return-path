import React, { useState } from 'react';

interface ReturnPathLogoProps {
  className?: string;
  size?: number;
}

export const ReturnPathLogo: React.FC<ReturnPathLogoProps> = ({
  className = '',
  size = 32,
}) => {
  const [imageError, setImageError] = useState(false);

  // If the generated image asset loads cleanly, render it
  if (!imageError) {
    return (
      <div
        className={`relative inline-flex items-center justify-center overflow-hidden rounded-[6px] flex-shrink-0 ${className}`}
        style={{ width: size, height: size }}
      >
        <img
          src="/src/assets/images/returnpath_logo_1790692516741.jpg"
          alt="ReturnPath Logo"
          referrerPolicy="no-referrer"
          onError={() => setImageError(true)}
          className="w-full h-full object-contain"
        />
      </div>
    );
  }

  // High-fidelity vector SVG matching the user's uploaded logo exactly
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`flex-shrink-0 ${className}`}
      aria-label="ReturnPath Logo"
    >
      {/* 4-Point Golden Sparkle Stars */}
      {/* Top Star */}
      <path
        d="M52 14 C52 19 50 21 45 21 C50 21 52 23 52 28 C52 23 54 21 59 21 C54 21 52 19 52 14 Z"
        fill="#E5A500"
      />
      {/* Upper Left Star */}
      <path
        d="M24 28 C24 32 22 34 18 34 C22 34 24 36 24 40 C24 36 26 34 30 34 C26 34 24 32 24 28 Z"
        fill="#E5A500"
      />
      {/* Large Right Star */}
      <path
        d="M84 42 C84 48 81 51 75 51 C81 51 84 54 84 60 C84 54 87 51 93 51 C87 51 84 48 84 42 Z"
        fill="#E5A500"
      />
      {/* Middle Right Star */}
      <path
        d="M72 61 C72 64 70 66 67 66 C70 66 72 68 72 71 C72 68 74 66 77 66 C74 66 72 64 72 61 Z"
        fill="#E5A500"
      />
      {/* Lower Right Star */}
      <path
        d="M80 78 C80 81 78 83 75 83 C78 83 80 85 80 88 C80 85 82 83 85 83 C82 83 80 81 80 78 Z"
        fill="#E5A500"
      />
      {/* Lower Left Star */}
      <path
        d="M29 80 C29 83 27 85 24 85 C27 85 29 87 29 90 C29 87 31 85 34 85 C31 85 29 83 29 80 Z"
        fill="#E5A500"
      />
      {/* Mid Left Star */}
      <path
        d="M34 71 C34 74 32 76 29 76 C32 76 34 78 34 81 C34 78 36 76 39 76 C36 76 34 74 34 71 Z"
        fill="#E5A500"
      />

      {/* Dynamic Cyan Arm Arcs */}
      {/* Right Arm Arc */}
      <path
        d="M59 18 C64 22 68 33 66 43 C64 49 61 55 58 60 C58 55 60 48 62 43 C64 35 60 25 59 18 Z"
        fill="#00A2F8"
      />
      {/* Left Wing / Arm Arc */}
      <path
        d="M20 50 C26 52 35 56 42 61 C37 63 30 65 24 64 C20 63 19 56 20 50 Z"
        fill="#00A2F8"
      />

      {/* Leaping Figure (Deep Blue) */}
      {/* Head */}
      <circle cx="40" cy="38" r="8" fill="#0058B6" />

      {/* Main Body & Leaping Leg Arcs */}
      <path
        d="M44 45 C49 42 56 39 63 36 C59 43 56 50 51 58 C45 66 41 78 35 91 C33 93 29 95 27 94 C26 92 28 87 32 80 C36 72 40 64 43 58 C37 57 26 53 19 51 C14 50 18 48 24 49 C30 50 38 52 44 45 Z"
        fill="#0058B6"
      />
      {/* Supporting Right Leg Arc */}
      <path
        d="M56 65 C58 72 61 80 62 90 C62 95 59 97 57 96 C56 94 56 88 54 82 C53 76 52 70 56 65 Z"
        fill="#0058B6"
      />
    </svg>
  );
};

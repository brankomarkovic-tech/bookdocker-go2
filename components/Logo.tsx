import React from 'react';

export const Logo: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
    aria-label="BookDocker GO2 Logo"
  >
    <g fill="currentColor">
      <circle cx="12" cy="7" r="5" />
      <path d="M4 12 L12 17 L20 12 L18 12 L12 15 L6 12 Z" />
      {/* Upper book, colored */}
      <rect x="4" y="17" width="16" height="3" fill="#51ADC9" />
      {/* Lower book */}
      <rect x="4" y="20" width="16" height="3" />
    </g>
  </svg>
);

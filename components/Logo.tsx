
import React from 'react';

interface LogoProps {
  className?: string;
  size?: number;
}

const Logo: React.FC<LogoProps> = ({ className = "w-10 h-10", size = 40 }) => {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 100 100" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Background shape - Subtle Hexagon */}
      <path 
        d="M50 5L89.4 27.5V72.5L50 95L10.6 72.5V27.5L50 5Z" 
        fill="#0F172A" 
        stroke="#1E293B" 
        strokeWidth="1"
      />
      
      {/* Brain Hemispheres - Left */}
      <path 
        d="M46 25C34 25 25 34 25 46V54C25 66 34 75 46 75V25Z" 
        stroke="#2DD4BF" 
        strokeWidth="3.5" 
        strokeLinecap="round" 
        strokeLinejoin="round"
      />
      
      {/* Brain Hemispheres - Right */}
      <path 
        d="M54 25C66 25 75 34 75 46V54C75 66 66 75 54 75V25Z" 
        stroke="#2DD4BF" 
        strokeWidth="3.5" 
        strokeLinecap="round" 
        strokeLinejoin="round"
      />
      
      {/* Neural Pathways / Connectivity Lines */}
      <path 
        d="M35 35L46 46M30 50H46M35 65L46 54" 
        stroke="#2DD4BF" 
        strokeWidth="2.5" 
        strokeLinecap="round" 
        opacity="0.6"
      />
      
      <path 
        d="M65 35L54 46M70 50H54M65 65L54 54" 
        stroke="#2DD4BF" 
        strokeWidth="2.5" 
        strokeLinecap="round" 
        opacity="0.6"
      />
      
      {/* Central Logic Core */}
      <circle cx="50" cy="50" r="4" fill="#2DD4BF" />
      <path 
        d="M50 40V25M50 60V75" 
        stroke="#2DD4BF" 
        strokeWidth="2.5" 
        strokeLinecap="round"
      />
    </svg>
  );
};

export default Logo;

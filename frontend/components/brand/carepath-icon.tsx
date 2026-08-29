'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface CarePathIconProps extends React.SVGProps<SVGSVGElement> {
  size?: number;
  className?: string;
  showAccent?: boolean;
}

export function CarePathIcon({
  size = 36,
  className = '',
  showAccent = true,
  ...props
}: CarePathIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`select-none overflow-visible ${className}`}
      {...props}
    >
      <defs>
        <linearGradient id="redGradient" x1="0" y1="0" x2="100" y2="100">
          <stop offset="0%" stopColor="#FF4D4D" />
          <stop offset="100%" stopColor="#CC0000" />
        </linearGradient>
        <linearGradient id="whiteGradient" x1="0" y1="0" x2="100" y2="100">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="100%" stopColor="#E5E5E5" />
        </linearGradient>
        <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>

      {/* Left Figure (Red) */}
      <motion.g
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      >
        <circle cx="38" cy="22" r="8" fill="url(#redGradient)" />
        <path 
          d="M 42 36 C 15 32, 10 65, 45 85" 
          stroke="url(#redGradient)" 
          strokeWidth="12" 
          strokeLinecap="round" 
          fill="none" 
        />
      </motion.g>

      {/* Right Figure (White) */}
      <motion.g
        initial={{ opacity: 0, x: 10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
      >
        <circle cx="62" cy="26" r="7" fill="url(#whiteGradient)" />
        <path 
          d="M 58 40 C 85 45, 80 75, 55 85" 
          stroke="url(#whiteGradient)" 
          strokeWidth="12" 
          strokeLinecap="round" 
          fill="none" 
        />
      </motion.g>

      {/* Sweeping Path (White) */}
      <motion.path
        d="M 35 90 Q 55 90, 75 75"
        stroke="url(#whiteGradient)"
        strokeWidth="10"
        strokeLinecap="round"
        fill="none"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ duration: 1.2, ease: "easeInOut", delay: 0.5 }}
      />

      {/* Medical Cross (Red) */}
      <motion.g
        animate={{ 
          scale: [1, 1.15, 1],
          opacity: [0.9, 1, 0.9],
        }}
        transition={{ 
          duration: 2, 
          repeat: Infinity, 
          ease: "easeInOut" 
        }}
        style={{ transformOrigin: "50px 55px" }}
        filter="url(#glow)"
      >
        <rect x="42" y="52" width="16" height="6" rx="1.5" fill="#EF3030" />
        <rect x="47" y="47" width="6" height="16" rx="1.5" fill="#EF3030" />
      </motion.g>
    </svg>
  );
}

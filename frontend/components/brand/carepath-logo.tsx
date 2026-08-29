'use client';

import React from 'react';
import { CarePathIcon } from './carepath-icon';

interface CarePathLogoProps {
  variant?: 'full' | 'compact' | 'icon';
  size?: 'sm' | 'md' | 'lg';
  showTagline?: boolean;
  className?: string;
}

export function CarePathLogo({
  variant = 'full',
  size = 'md',
  showTagline = true,
  className = '',
}: CarePathLogoProps) {
  // Size mappings
  const iconSizes = {
    sm: 32,
    md: 40,
    lg: 52,
  };

  const titleSizes = {
    sm: 'text-base',
    md: 'text-xl',
    lg: 'text-2xl',
  };

  const subtitleSizes = {
    sm: 'text-[10px]',
    md: 'text-xs',
    lg: 'text-sm',
  };

  const iconDimension = iconSizes[size];

  if (variant === 'icon') {
    return <CarePathIcon size={iconDimension} className={className} />;
  }

  return (
    <div className={`flex items-center gap-3 select-none ${className}`}>
      <CarePathIcon size={iconDimension} />

      <div className="flex flex-col justify-center">
        <div className="flex items-center leading-none">
          <span className={`font-black tracking-tight text-white ${titleSizes[size]}`}>
            CarePath
          </span>
          <span className={`font-black tracking-tight text-[#EF3030] ${titleSizes[size]}`}>
            +
          </span>
        </div>

        {showTagline && variant === 'full' && (
          <span className={`font-semibold text-[#999999] mt-1 tracking-widest ${subtitleSizes[size]} uppercase`}>
            CARE . CONNECT . CURE
          </span>
        )}
      </div>
    </div>
  );
}

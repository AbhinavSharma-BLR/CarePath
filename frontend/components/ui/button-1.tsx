'use client';
import React from 'react';

export type ColorKey =
  | 'color1' | 'color2' | 'color3' | 'color4' | 'color5' | 'color6' 
  | 'color7' | 'color8' | 'color9' | 'color10' | 'color11' | 'color12' 
  | 'color13' | 'color14' | 'color15' | 'color16' | 'color17';

export type Colors = Record<ColorKey, string>;

// Adjusted Hospital Theme Colors for CarePath
export const HOSPITAL_THEME_COLORS: Colors = {
  color1: '#FFFFFF', // White
  color2: '#EF3030', // Deep Red
  color3: '#FF5959', // Lighter Red
  color4: '#111111', // Almost Black
  color5: '#1A1A1A', // Dark Gray
  color6: '#FF3333', // Bright Red
  color7: '#0A0A0A', // Pure Black
  color8: '#E60000', // Intense Red
  color9: '#333333', // Charcoal
  color10: '#FF4D4D', // Soft Red
  color11: '#000000', // Black
  color12: '#FF6666', // Peach Red
  color13: '#990000', // Dark Blood Red
  color14: '#FF1A1A', // Vibrant Red
  color15: '#CC0000', // Crimson
  color16: '#222222', // Very Dark Gray
  color17: '#444444', // Med Gray
};

interface LiquidButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  icon?: React.ReactNode;
  className?: string;
  themeColors?: Colors;
}

export const LiquidButton: React.FC<LiquidButtonProps> = ({ 
  children, 
  icon, 
  className = "", 
  themeColors = HOSPITAL_THEME_COLORS,
  ...props 
}) => {
  return (
    <div className={`flex justify-center ${className}`}>
      <button
        {...props}
        className="relative flex w-full items-center justify-center gap-3 px-6 py-3.5 min-w-[140px] bg-[#EF3030] hover:bg-[#D92727] text-white font-bold text-lg tracking-wide rounded-xl shadow-md transition-all duration-200 transform hover:-translate-y-0.5 hover:shadow-red-500/30 active:scale-[0.98] active:translate-y-0 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:transform-none disabled:hover:bg-[#EF3030] disabled:active:scale-100 group"
      >
        {icon && (
          <span className="group-hover:scale-110 transition-transform duration-300 drop-shadow-sm">
            {icon}
          </span>
        )}
        <span>{children}</span>
      </button>
    </div>
  );
};

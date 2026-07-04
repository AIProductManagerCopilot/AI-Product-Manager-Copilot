import React from 'react';
import { AnimatedBackground } from './AnimatedBackground';

export const ThemeWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="min-h-screen bg-[#0D1117] text-[#F8FAFC] relative overflow-hidden flex flex-col font-sans selection:bg-primary selection:text-white">
      <AnimatedBackground />
      <div className="relative z-10 flex-1 flex flex-col">{children}</div>
    </div>
  );
};

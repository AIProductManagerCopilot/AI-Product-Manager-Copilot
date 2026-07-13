import React from 'react';
import { AnimatedBackground } from './AnimatedBackground';
import { useTheme } from '../context/ThemeContext';

export const ThemeWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isDark } = useTheme();

  return (
    <div
      className={`min-h-screen relative overflow-hidden flex flex-col font-sans selection:bg-[#3B82F6] selection:text-white transition-colors duration-300 ${
        isDark ? 'bg-[#0D1117] text-[#F8FAFC]' : 'bg-[#F8FAFC] text-[#0F172A]'
      }`}
    >
      {/* Only show animated background in dark mode */}
      {isDark && <AnimatedBackground />}

      {/* Light mode subtle background pattern */}
      {!isDark && (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: `
              radial-gradient(circle at 20% 20%, rgba(59,130,246,0.04) 0%, transparent 50%),
              radial-gradient(circle at 80% 80%, rgba(139,92,246,0.04) 0%, transparent 50%)
            `,
          }}
        />
      )}

      <div className="relative z-10 flex-1 flex flex-col">{children}</div>
    </div>
  );
};

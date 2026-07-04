import React from 'react';
import { Cpu, Sparkles } from 'lucide-react';

export const SkeletonLoader: React.FC = () => {
  return (
    <div className="w-full max-w-md p-8 glass-panel rounded-card border border-[#2D3748] flex flex-col gap-6 animate-pulse">
      {/* Animated Logo Loading Header */}
      <div className="flex flex-col items-center justify-center gap-3 text-center mb-2">
        <div className="relative w-12 h-12 bg-[#161B22] border border-[#2D3748] rounded-2xl flex items-center justify-center text-primary">
          <Cpu className="w-6 h-6 text-primary animate-spin" />
          <Sparkles className="w-4 h-4 text-secondary absolute -top-1 -right-1" />
        </div>
        <div className="h-5 w-48 bg-[#2D3748]/50 rounded-md"></div>
        <div className="h-3 w-64 bg-[#2D3748]/30 rounded-md"></div>
      </div>

      {/* Inputs skeleton */}
      <div className="space-y-4">
        <div className="space-y-2">
          <div className="h-3 w-16 bg-[#2D3748]/40 rounded"></div>
          <div className="h-10 w-full bg-[#161B22] border border-[#2D3748]/50 rounded-input"></div>
        </div>
        <div className="space-y-2">
          <div className="h-3 w-20 bg-[#2D3748]/40 rounded"></div>
          <div className="h-10 w-full bg-[#161B22] border border-[#2D3748]/50 rounded-input"></div>
        </div>
      </div>

      {/* Button skeleton */}
      <div className="h-11 w-full bg-gradient-to-r from-[#3B82F6]/40 to-[#8B5CF6]/40 rounded-button animate-pulse"></div>

      {/* Gradient Loading Bar */}
      <div className="w-full bg-[#161B22] h-1.5 rounded-full overflow-hidden relative">
        <div className="absolute inset-y-0 w-1/3 bg-gradient-to-r from-primary via-secondary to-primary animate-shimmer rounded-full"></div>
      </div>
    </div>
  );
};

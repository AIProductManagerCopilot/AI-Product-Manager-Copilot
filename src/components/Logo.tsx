import React from 'react';
import { Sparkles, Cpu } from 'lucide-react';
import { Link } from 'react-router-dom';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  showSubtitle?: boolean;
}

export const Logo: React.FC<LogoProps> = ({ size = 'md', showSubtitle = false }) => {
  const iconSizes = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-10 h-10',
  };

  const textSizes = {
    sm: 'text-base',
    md: 'text-xl',
    lg: 'text-2xl',
  };

  return (
    <Link to="/" className="inline-flex items-center gap-3 group focus:outline-none focus:ring-2 focus:ring-primary/50 rounded-lg p-1">
      <div className="relative flex items-center justify-center">
        {/* Glow halo */}
        <div className="absolute -inset-1 bg-gradient-to-r from-primary to-secondary rounded-xl blur opacity-70 group-hover:opacity-100 transition duration-500 group-hover:duration-200 animate-pulse-slow"></div>
        
        {/* Badge container */}
        <div className={`relative ${iconSizes[size]} bg-[#161B22] border border-[#2D3748] rounded-xl flex items-center justify-center text-primary group-hover:scale-105 transition-transform duration-300`}>
          <Cpu className="w-5 h-5 text-primary animate-pulse" />
          <Sparkles className="w-3 h-3 text-secondary absolute -top-1 -right-1" />
        </div>
      </div>

      <div className="flex flex-col">
        <div className={`font-display font-extrabold ${textSizes[size]} tracking-tight text-white flex items-center gap-2`}>
          <span>AI Product Manager</span>
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary font-semibold">
            Copilot
          </span>
        </div>
        {showSubtitle && (
          <span className="text-xs text-text-secondary font-medium tracking-wide">
            Next-Gen Product Intelligence
          </span>
        )}
      </div>
    </Link>
  );
};

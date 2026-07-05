import React from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  isLoading?: boolean;
  variant?: 'primary' | 'secondary' | 'outline';
  fullWidth?: boolean;
  children: React.ReactNode;
  icon?: React.ReactNode;
}

export const LoadingButton: React.FC<LoadingButtonProps> = ({
  isLoading = false,
  variant = 'primary',
  fullWidth = true,
  children,
  icon,
  className = '',
  disabled,
  ...props
}) => {
  const variantStyles = {
    primary:
      'bg-gradient-to-r from-[#3B82F6] to-[#8B5CF6] hover:from-[#2563EB] hover:to-[#7C3AED] text-white shadow-lg shadow-primary/20 hover:shadow-primary/35 border border-white/10',
    secondary:
      'bg-[#161B22] hover:bg-[#1F242C] text-text-primary border border-[#2D3748] hover:border-primary/50',
    outline:
      'bg-transparent hover:bg-primary/10 text-primary border border-primary/40 hover:border-primary',
  };

  return (
    <button
      disabled={isLoading || disabled}
      className={`relative inline-flex items-center justify-center gap-2 py-3 px-5 rounded-button text-sm font-semibold tracking-wide transition-all duration-200 active:scale-[0.99] focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-60 disabled:cursor-not-allowed ${
        fullWidth ? 'w-full' : ''
      } ${variantStyles[variant]} ${className}`}
      {...props}
    >
      {isLoading ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin text-current" />
          <span>Processing...</span>
        </>
      ) : (
        <>
          {children}
          {icon && <span className="shrink-0">{icon}</span>}
        </>
      )}
    </button>
  );
};

import React, { useState, forwardRef } from 'react';
import { Eye, EyeOff, Lock, AlertCircle } from 'lucide-react';

export interface PasswordFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const PasswordField = forwardRef<HTMLInputElement, PasswordFieldProps>(
  ({ label = 'Password', error, helperText, id, ...props }, ref) => {
    const [showPassword, setShowPassword] = useState(false);
    const inputId = id || label.toLowerCase().replace(/\s+/g, '-');

    return (
      <div className="flex flex-col gap-1.5 w-full">
        <div className="flex items-center justify-between">
          {label && (
            <label
              htmlFor={inputId}
              className="text-xs font-semibold text-text-secondary uppercase tracking-wider"
            >
              {label}
            </label>
          )}
        </div>

        <div className="relative flex items-center">
          <div className="absolute left-3.5 text-text-muted pointer-events-none flex items-center justify-center">
            <Lock className="w-4 h-4" />
          </div>

          <input
            ref={ref}
            id={inputId}
            type={showPassword ? 'text' : 'password'}
            aria-invalid={!!error}
            aria-describedby={error ? `${inputId}-error` : helperText ? `${inputId}-helper` : undefined}
            className={`w-full py-2.5 pl-10 pr-10 rounded-input text-sm glass-input placeholder:text-text-muted/60 ${
              error ? 'border-status-error/80 focus:border-status-error focus:ring-status-error/20' : ''
            }`}
            {...props}
          />

          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            tabIndex={0}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
            className="absolute right-3.5 text-text-muted hover:text-text-primary focus:outline-none focus:text-text-primary transition-colors p-1"
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>

        {error ? (
          <p id={`${inputId}-error`} className="text-xs text-status-error flex items-center gap-1 mt-0.5 font-medium animate-fadeIn">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            <span>{error}</span>
          </p>
        ) : helperText ? (
          <p id={`${inputId}-helper`} className="text-xs text-text-muted mt-0.5">
            {helperText}
          </p>
        ) : null}
      </div>
    );
  }
);

PasswordField.displayName = 'PasswordField';

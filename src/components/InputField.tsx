import React, { forwardRef } from 'react';
import { AlertCircle } from 'lucide-react';

export interface InputFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  icon?: React.ReactNode;
}

export const InputField = forwardRef<HTMLInputElement, InputFieldProps>(
  ({ label, error, helperText, icon, className = '', id, ...props }, ref) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className="flex flex-col gap-1.5 w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="text-xs font-semibold text-text-secondary uppercase tracking-wider flex items-center justify-between"
          >
            <span>{label}</span>
          </label>
        )}

        <div className="relative flex items-center">
          {icon && (
            <div className="absolute left-3.5 text-text-muted pointer-events-none flex items-center justify-center">
              {icon}
            </div>
          )}

          <input
            ref={ref}
            id={inputId}
            aria-invalid={!!error}
            aria-describedby={error ? `${inputId}-error` : helperText ? `${inputId}-helper` : undefined}
            className={`w-full py-2.5 ${icon ? 'pl-10' : 'pl-3.5'} pr-3.5 rounded-input text-sm glass-input placeholder:text-text-muted/60 ${
              error ? 'border-status-error/80 focus:border-status-error focus:ring-status-error/20' : ''
            } ${className}`}
            {...props}
          />
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

InputField.displayName = 'InputField';

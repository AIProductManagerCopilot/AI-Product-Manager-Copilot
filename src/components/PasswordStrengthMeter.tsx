import React from 'react';
import { Check, X } from 'lucide-react';

interface PasswordStrengthMeterProps {
  password?: string;
}

export const PasswordStrengthMeter: React.FC<PasswordStrengthMeterProps> = ({ password = '' }) => {
  const checks = [
    { label: 'At least 8 characters', valid: password.length >= 8 },
    { label: 'Includes uppercase & lowercase letter', valid: /[a-z]/.test(password) && /[A-Z]/.test(password) },
    { label: 'Includes a number (0-9)', valid: /\d/.test(password) },
    { label: 'Includes special character (!@#$%^&*)', valid: /[!@#$%^&*(),.?":{}|<>]/.test(password) },
  ];

  const score = checks.filter((c) => c.valid).length;

  const getStrengthLabel = () => {
    if (!password) return { text: 'Password Strength', color: 'text-text-muted', barColor: 'bg-[#2D3748]' };
    if (score <= 1) return { text: 'Weak', color: 'text-status-error', barColor: 'bg-status-error' };
    if (score === 2) return { text: 'Fair', color: 'text-amber-400', barColor: 'bg-amber-400' };
    if (score === 3) return { text: 'Good', color: 'text-blue-400', barColor: 'bg-blue-400' };
    return { text: 'Strong', color: 'text-status-success', barColor: 'bg-status-success' };
  };

  const strength = getStrengthLabel();

  return (
    <div className="flex flex-col gap-2 mt-2 p-3 rounded-xl bg-[#0D1117]/60 border border-[#2D3748]/60">
      <div className="flex items-center justify-between text-xs">
        <span className="text-text-secondary font-medium">Password Strength:</span>
        <span className={`font-semibold ${strength.color}`}>{strength.text}</span>
      </div>

      {/* Progress Bars */}
      <div className="grid grid-cols-4 gap-1.5 h-1.5 w-full">
        {[1, 2, 3, 4].map((level) => (
          <div
            key={level}
            className={`h-full rounded-full transition-all duration-300 ${
              level <= score ? strength.barColor : 'bg-[#2D3748]/50'
            }`}
          />
        ))}
      </div>

      {/* Criteria checklist */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 mt-1">
        {checks.map((item, index) => (
          <div key={index} className="flex items-center gap-1.5 text-[11px]">
            {item.valid ? (
              <Check className="w-3.5 h-3.5 text-status-success shrink-0" />
            ) : (
              <X className="w-3.5 h-3.5 text-text-muted/60 shrink-0" />
            )}
            <span className={item.valid ? 'text-text-primary font-medium' : 'text-text-muted'}>
              {item.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

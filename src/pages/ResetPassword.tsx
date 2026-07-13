import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, ShieldCheck } from 'lucide-react';
import { AuthLayout } from '../components/AuthLayout';
import { PasswordField } from '../components/PasswordField';
import { PasswordStrengthMeter } from '../components/PasswordStrengthMeter';
import { LoadingButton } from '../components/LoadingButton';
import { authService } from '../services/authService';
import { useTheme } from '../context/ThemeContext';

const resetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
      .regex(/[0-9]/, 'Password must contain at least one number'),
    confirmPassword: z.string().min(1, 'Please confirm your new password'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type ResetPasswordData = z.infer<typeof resetPasswordSchema>;

export const ResetPasswordPage: React.FC = () => {
  const navigate = useNavigate();
  const { isDark } = useTheme();
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<ResetPasswordData>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { password: '', confirmPassword: '' },
  });

  const passwordValue = watch('password');

  const onSubmit = async (data: ResetPasswordData) => {
    try {
      setIsLoading(true);
      setErrorMsg(null);
      await authService.resetPassword(data.password);
      setIsSuccess(true);
      setTimeout(() => {
        navigate('/login');
      }, 1500);
    } catch (err: any) {
      setErrorMsg('Failed to reset password. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const titleColor = isDark ? 'text-white' : 'text-[#0F172A]';

  return (
    <AuthLayout
      title="Reset Password"
      subtitle="Set a new secure password for your AI Copilot account"
    >
      {isSuccess ? (
        <div className="py-8 flex flex-col items-center justify-center gap-4 text-center animate-fadeIn">
          <div className="w-16 h-16 rounded-full bg-status-success/20 border border-status-success flex items-center justify-center text-status-success animate-bounce">
            <CheckCircle2 className="w-10 h-10" />
          </div>
          <div className="space-y-1">
            <h3 className={`text-xl font-bold ${titleColor}`}>Password Updated!</h3>
            <p className="text-xs text-text-secondary">
              Your password has been changed successfully. Redirecting to login...
            </p>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          {errorMsg && (
            <div className="p-3 rounded-lg bg-status-error/15 border border-status-error/40 text-xs text-status-error font-medium">
              {errorMsg}
            </div>
          )}

          {/* New Password */}
          <PasswordField
            label="New Password"
            placeholder="Enter new password"
            error={errors.password?.message}
            {...register('password')}
          />

          {/* Dynamic Password Strength & Criteria */}
          <PasswordStrengthMeter password={passwordValue} />

          {/* Confirm Password */}
          <PasswordField
            label="Confirm New Password"
            placeholder="Re-enter new password"
            error={errors.confirmPassword?.message}
            {...register('confirmPassword')}
          />

          {/* Reset CTA */}
          <div className="pt-2">
            <LoadingButton
              type="submit"
              isLoading={isLoading}
              icon={<ShieldCheck className="w-4 h-4" />}
            >
              Reset Password
            </LoadingButton>
          </div>
        </form>
      )}
    </AuthLayout>
  );
};

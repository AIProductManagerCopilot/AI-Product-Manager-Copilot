import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft, Send, CheckCircle2, RefreshCw } from 'lucide-react';
import { AuthLayout } from '../components/AuthLayout';
import { InputField } from '../components/InputField';
import { LoadingButton } from '../components/LoadingButton';
import { authService } from '../services/authService';

const forgotPasswordSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Please enter a valid email address'),
});

type ForgotPasswordData = z.infer<typeof forgotPasswordSchema>;

export const ForgotPasswordPage: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordData>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: '' },
  });

  const onSubmit = async (data: ForgotPasswordData) => {
    try {
      setIsLoading(true);
      setErrorMsg(null);
      await authService.requestPasswordReset(data.email);
      setSubmittedEmail(data.email);
      setIsSent(true);
    } catch (err: any) {
      setErrorMsg('Failed to send reset link. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout
      title={isSent ? 'Check Your Inbox' : 'Forgot Password?'}
      subtitle={
        isSent
          ? `We've sent password recovery instructions to ${submittedEmail}`
          : 'Enter your email address to receive a secure password reset link'
      }
    >
      {isSent ? (
        <div className="space-y-6 animate-fadeIn py-2">
          {/* Inbox Success Card */}
          <div className="p-5 rounded-2xl bg-[#0D1117]/80 border border-[#2D3748] flex flex-col items-center justify-center gap-3 text-center">
            <div className="w-12 h-12 rounded-xl bg-status-success/20 border border-status-success/40 flex items-center justify-center text-status-success">
              <CheckCircle2 className="w-7 h-7" />
            </div>

            <div className="space-y-1">
              <h4 className="text-sm font-bold text-white">Reset Link Dispatched</h4>
              <p className="text-xs text-text-secondary leading-relaxed">
                Check your email inbox and click the reset button inside to set up a new password for your account.
              </p>
            </div>
          </div>

          {/* Quick Resend / Back to Login buttons */}
          <div className="space-y-3">
            <LoadingButton
              type="button"
              variant="secondary"
              onClick={() => setIsSent(false)}
              icon={<RefreshCw className="w-4 h-4" />}
            >
              Resend Reset Link
            </LoadingButton>

            <Link
              to="/login"
              className="flex items-center justify-center gap-2 text-xs font-semibold text-text-secondary hover:text-text-primary py-2 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Login</span>
            </Link>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
          {errorMsg && (
            <div className="p-3 rounded-lg bg-status-error/15 border border-status-error/40 text-xs text-status-error font-medium">
              {errorMsg}
            </div>
          )}

          <InputField
            label="Account Email"
            type="email"
            placeholder="name@company.com"
            icon={<Mail className="w-4 h-4" />}
            error={errors.email?.message}
            {...register('email')}
          />

          <LoadingButton
            type="submit"
            isLoading={isLoading}
            icon={<Send className="w-4 h-4" />}
          >
            Send Reset Link
          </LoadingButton>

          <div className="text-center pt-2">
            <Link
              to="/login"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-text-secondary hover:text-text-primary transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Login</span>
            </Link>
          </div>
        </form>
      )}
    </AuthLayout>
  );
};

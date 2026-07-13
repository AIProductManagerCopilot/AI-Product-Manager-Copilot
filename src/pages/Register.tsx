import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { User, Mail, Building2, Briefcase, CheckCircle2, ArrowRight } from 'lucide-react';
import { AuthLayout } from '../components/AuthLayout';
import { InputField } from '../components/InputField';
import { PasswordField } from '../components/PasswordField';
import { PasswordStrengthMeter } from '../components/PasswordStrengthMeter';
import { LoadingButton } from '../components/LoadingButton';
import { SocialLoginButtons } from '../components/SocialLoginButtons';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

// Zod schema for Registration
const registerSchema = z
  .object({
    fullName: z.string().min(2, 'Full Name must be at least 2 characters'),
    email: z.string().min(1, 'Email address is required').email('Please enter a valid email address'),
    organization: z.string().min(2, 'Organization Name is required'),
    role: z.string().min(1, 'Please select your role'),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
      .regex(/[0-9]/, 'Password must contain at least one number'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
    termsAccepted: z.literal(true, {
      errorMap: () => ({ message: 'You must accept the Terms & Conditions to proceed' }),
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type RegisterFormData = z.infer<typeof registerSchema>;

const ROLES = ['Product Manager', 'Founder', 'Business Analyst', 'Developer', 'Student'];

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const { registerUser, loginOAuth } = useAuth();
  const { isDark } = useTheme();

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successAnimation, setSuccessAnimation] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      fullName: '',
      email: '',
      organization: '',
      role: 'Product Manager',
      password: '',
      confirmPassword: '',
      termsAccepted: true,
    },
  });

  const passwordValue = watch('password');

  const onSubmit = async (data: RegisterFormData) => {
    try {
      setIsLoading(true);
      setErrorMessage(null);
      await registerUser({
        fullName: data.fullName,
        email: data.email,
        organization: data.organization,
        role: data.role,
        password: data.password,
      });

      setSuccessAnimation(true);
      setTimeout(() => {
        navigate('/verify-email');
      }, 1200);
    } catch (err: any) {
      setErrorMessage(err.message || 'Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOAuth = async (provider: 'google' | 'github') => {
    try {
      setIsLoading(true);
      setErrorMessage(null);
      await loginOAuth(provider);
      setSuccessAnimation(true);
      setTimeout(() => {
        navigate('/dashboard');
      }, 1000);
    } catch (err: any) {
      setErrorMessage(`OAuth registration failed.`);
    } finally {
      setIsLoading(false);
    }
  };

  const successTitleColor = isDark ? 'text-white' : 'text-[#0F172A]';
  const dividerBorder = isDark ? 'border-[#2D3748]' : 'border-[#E2E8F0]';
  const dividerBg = isDark ? 'bg-[#161B22]' : 'bg-[#FFFFFF]';
  const checkboxBg = isDark ? 'bg-[#0D1117] border-[#2D3748]' : 'bg-white border-[#CBD5E1]';
  const subBorder = isDark ? 'border-[#2D3748]/50' : 'border-[#E2E8F0]';
  const dropdownBg = isDark ? 'bg-[#161B22]' : 'bg-white';

  return (
    <AuthLayout
      title="Create Workspace"
      subtitle="Get started with AI Product Manager Copilot"
    >
      {successAnimation ? (
        <div className="py-12 flex flex-col items-center justify-center gap-4 text-center animate-fadeIn">
          <div className="w-16 h-16 rounded-full bg-status-success/20 border border-status-success flex items-center justify-center text-status-success animate-bounce">
            <CheckCircle2 className="w-10 h-10" />
          </div>
          <h3 className={`text-xl font-bold ${successTitleColor}`}>Account Created!</h3>
          <p className="text-xs text-text-secondary">Directing to email verification...</p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Social CTAs */}
          <SocialLoginButtons
            isLoading={isLoading}
            onGoogleClick={() => handleOAuth('google')}
            onGithubClick={() => handleOAuth('github')}
          />

          <div className="relative flex items-center justify-center my-3">
            <div className={`w-full border-t ${dividerBorder}`}></div>
            <span className={`absolute px-3 text-xs font-semibold text-text-muted uppercase tracking-wider ${dividerBg}`}>
              OR
            </span>
          </div>

          {errorMessage && (
            <div className="p-3 rounded-lg bg-status-error/15 border border-status-error/40 text-xs text-status-error font-medium animate-fadeIn">
              {errorMessage}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-3" noValidate>
            {/* Full Name */}
            <InputField
              label="Full Name"
              type="text"
              placeholder="Alex Morgan"
              icon={<User className="w-4 h-4" />}
              error={errors.fullName?.message}
              {...register('fullName')}
            />

            {/* Email Address */}
            <InputField
              label="Work Email"
              type="email"
              placeholder="alex@company.com"
              icon={<Mail className="w-4 h-4" />}
              error={errors.email?.message}
              {...register('email')}
            />

            {/* Organization Name & Role (2 Column Grid) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <InputField
                label="Organization Name"
                type="text"
                placeholder="Acme Inc."
                icon={<Building2 className="w-4 h-4" />}
                error={errors.organization?.message}
                {...register('organization')}
              />

              {/* Role Select Dropdown */}
              <div className="flex flex-col gap-1.5 w-full">
                <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
                  Role
                </label>
                <div className="relative flex items-center">
                  <div className="absolute left-3.5 text-text-muted pointer-events-none flex items-center justify-center">
                    <Briefcase className="w-4 h-4" />
                  </div>
                  <select
                    {...register('role')}
                    className="w-full py-2.5 pl-10 pr-3.5 rounded-input text-sm glass-input appearance-none cursor-pointer"
                  >
                    {ROLES.map((r) => (
                      <option key={r} value={r} className={`${dropdownBg} text-text-primary`}>
                        {r}
                      </option>
                    ))}
                  </select>
                </div>
                {errors.role && (
                  <p className="text-xs text-status-error">{errors.role.message}</p>
                )}
              </div>
            </div>

            {/* Password */}
            <PasswordField
              label="Password"
              placeholder="Create a strong password"
              error={errors.password?.message}
              {...register('password')}
            />

            {/* Password Strength Meter */}
            <PasswordStrengthMeter password={passwordValue} />

            {/* Confirm Password */}
            <PasswordField
              label="Confirm Password"
              placeholder="Re-enter password"
              error={errors.confirmPassword?.message}
              {...register('confirmPassword')}
            />

            {/* Terms & Conditions Checkbox */}
            <div className="pt-1">
              <label className="flex items-start gap-2.5 cursor-pointer text-xs text-text-secondary hover:text-text-primary transition-colors">
                <input
                  type="checkbox"
                  className={`mt-0.5 w-4 h-4 rounded text-primary focus:ring-primary/40 focus:ring-offset-0 ${checkboxBg}`}
                  {...register('termsAccepted')}
                />
                <span>
                  I agree to the{' '}
                  <a href="#terms" className="text-primary hover:underline font-medium">
                    Terms of Service
                  </a>{' '}
                  and{' '}
                  <a href="#privacy" className="text-primary hover:underline font-medium">
                    Privacy Policy
                  </a>
                </span>
              </label>
              {errors.termsAccepted && (
                <p className="text-xs text-status-error mt-1">{errors.termsAccepted.message}</p>
              )}
            </div>

            {/* Submit CTA */}
            <div className="pt-2">
              <LoadingButton
                type="submit"
                isLoading={isLoading}
                icon={<ArrowRight className="w-4 h-4" />}
              >
                Create Account
              </LoadingButton>
            </div>
          </form>

          {/* Footer Navigation */}
          <div className={`text-center text-xs text-text-secondary pt-2 border-t ${subBorder}`}>
            <span>Already have an account? </span>
            <Link to="/login" className="text-primary hover:text-primary-light font-bold transition-colors">
              Login
            </Link>
          </div>
        </div>
      )}
    </AuthLayout>
  );
};

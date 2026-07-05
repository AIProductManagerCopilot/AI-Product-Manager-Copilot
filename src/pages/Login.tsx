import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, CheckCircle2, ArrowRight } from 'lucide-react';
import { AuthLayout } from '../components/AuthLayout';
import { InputField } from '../components/InputField';
import { PasswordField } from '../components/PasswordField';
import { LoadingButton } from '../components/LoadingButton';
import { SocialLoginButtons } from '../components/SocialLoginButtons';
import { useAuth } from '../context/AuthContext';

// Zod validation schema
const loginSchema = z.object({
  email: z.string().min(1, 'Email address is required').email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  rememberMe: z.boolean().optional(),
});

type LoginFormData = z.infer<typeof loginSchema>;

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login, loginOAuth } = useAuth();

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successAnimation, setSuccessAnimation] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
      rememberMe: true,
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    try {
      setIsLoading(true);
      setErrorMessage(null);
      await login(data.email, data.password);

      setSuccessAnimation(true);
      setTimeout(() => {
        navigate('/dashboard');
      }, 1200);
    } catch (err: any) {
      setErrorMessage(err.message || 'Login failed. Please check your credentials.');
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
      setErrorMessage(`Failed to authenticate with ${provider}.`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Welcome Back"
      subtitle="Log in to your AI Product Manager Copilot workspace"
    >
      {/* Success Animation Overlay */}
      {successAnimation ? (
        <div className="py-12 flex flex-col items-center justify-center gap-4 text-center animate-fadeIn">
          <div className="w-16 h-16 rounded-full bg-status-success/20 border border-status-success flex items-center justify-center text-status-success animate-bounce">
            <CheckCircle2 className="w-10 h-10" />
          </div>
          <h3 className="text-xl font-bold text-white">Authenticated Successfully!</h3>
          <p className="text-xs text-text-secondary">Redirecting to your copilot dashboard...</p>
        </div>
      ) : (
        <div className="space-y-5">
          {/* Social Logins */}
          <SocialLoginButtons
            isLoading={isLoading}
            onGoogleClick={() => handleOAuth('google')}
            onGithubClick={() => handleOAuth('github')}
          />

          {/* Divider */}
          <div className="relative flex items-center justify-center my-4">
            <div className="w-full border-t border-[#2D3748]"></div>
            <span className="absolute px-3 bg-[#161B22] text-xs font-semibold text-text-muted uppercase tracking-wider">
              OR
            </span>
          </div>

          {/* Error Banner */}
          {errorMessage && (
            <div className="p-3 rounded-lg bg-status-error/15 border border-status-error/40 text-xs text-status-error font-medium animate-fadeIn">
              {errorMessage}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
            {/* Email Field */}
            <InputField
              label="Email Address"
              type="email"
              placeholder="name@company.com"
              icon={<Mail className="w-4 h-4" />}
              error={errors.email?.message}
              {...register('email')}
            />

            {/* Password Field */}
            <PasswordField
              label="Password"
              placeholder="••••••••••••"
              error={errors.password?.message}
              {...register('password')}
            />

            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between text-xs pt-1">
              <label className="flex items-center gap-2 text-text-secondary cursor-pointer hover:text-text-primary transition-colors">
                <input
                  type="checkbox"
                  className="w-4 h-4 rounded bg-[#0D1117] border-[#2D3748] text-primary focus:ring-primary/40 focus:ring-offset-0"
                  {...register('rememberMe')}
                />
                <span>Remember Me</span>
              </label>

              <Link
                to="/forgot-password"
                className="text-primary hover:text-primary-light font-medium transition-colors hover:underline"
              >
                Forgot Password?
              </Link>
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <LoadingButton
                type="submit"
                isLoading={isLoading}
                icon={<ArrowRight className="w-4 h-4" />}
              >
                Sign In
              </LoadingButton>
            </div>
          </form>

          {/* Footer Navigation */}
          <div className="text-center text-xs text-text-secondary pt-2 border-t border-[#2D3748]/50">
            <span>Don't have an account? </span>
            <Link to="/register" className="text-primary hover:text-primary-light font-bold transition-colors">
              Create Account
            </Link>
          </div>
        </div>
      )}
    </AuthLayout>
  );
};

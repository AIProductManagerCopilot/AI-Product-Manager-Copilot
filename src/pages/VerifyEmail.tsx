import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, ArrowRight, ShieldCheck, Sparkles } from 'lucide-react';
import { AuthLayout } from '../components/AuthLayout';
import { LoadingButton } from '../components/LoadingButton';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

export const VerifyEmailPage: React.FC = () => {
  const navigate = useNavigate();
  const { verifyEmail, user } = useAuth();
  const { isDark } = useTheme();
  const [isVerifying, setIsVerifying] = useState(true);

  useEffect(() => {
    const timer = setTimeout(async () => {
      await verifyEmail('mock_verification_token_123');
      setIsVerifying(false);
    }, 1200);

    return () => clearTimeout(timer);
  }, [verifyEmail]);

  const cardClass = isDark
    ? 'bg-gradient-to-b from-status-success/15 via-[#161B22] to-[#0D1117] border-status-success/30'
    : 'bg-gradient-to-b from-status-success/5 via-white to-white border-status-success/20 shadow-xl';

  const titleColor = isDark ? 'text-white' : 'text-[#0F172A]';

  return (
    <AuthLayout
      title={isVerifying ? 'Verifying Email' : 'Email Verified!'}
      subtitle={
        isVerifying
          ? 'Connecting to security server to confirm your email link...'
          : 'Your account is fully activated and ready for product strategy.'
      }
    >
      {isVerifying ? (
        <div className="py-12 flex flex-col items-center justify-center gap-4 text-center">
          <div className="w-14 h-14 rounded-2xl bg-primary/20 border border-primary/40 flex items-center justify-center text-primary animate-spin">
            <Sparkles className="w-7 h-7" />
          </div>
          <p className="text-xs text-text-secondary">Authenticating security token...</p>
        </div>
      ) : (
        <div className="space-y-6 animate-fadeIn py-2">
          {/* Success Card */}
          <div className={`p-6 rounded-2xl border flex flex-col items-center justify-center gap-4 text-center ${cardClass}`}>
            {/* Glowing Success Icon */}
            <div className="relative">
              <div className="absolute -inset-2 bg-status-success/30 rounded-full blur-md animate-pulse"></div>
              <div className="relative w-16 h-16 rounded-full bg-status-success/20 border-2 border-status-success flex items-center justify-center text-status-success">
                <CheckCircle2 className="w-10 h-10" />
              </div>
            </div>

            <div className="space-y-1.5">
              <h3 className={`text-xl font-extrabold tracking-tight ${titleColor}`}>
                Email Verified Successfully
              </h3>
              <p className="text-xs text-text-secondary leading-relaxed max-w-xs mx-auto">
                Welcome aboard, <span className="text-text-primary font-bold">{user?.name || 'Product Manager'}</span>! Your workspace is unlocked.
              </p>
            </div>

            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-status-success/10 border border-status-success/30 text-[11px] font-semibold text-status-success">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Full Access Unlocked</span>
            </div>
          </div>

          {/* Action CTA */}
          <LoadingButton
            onClick={() => navigate('/dashboard')}
            icon={<ArrowRight className="w-4 h-4" />}
          >
            Continue to Dashboard
          </LoadingButton>
        </div>
      )}
    </AuthLayout>
  );
};

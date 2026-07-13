import React from 'react';
import { motion } from 'framer-motion';
import { Logo } from './Logo';
import { Sparkles, Bot, LineChart, FileText, CheckCircle2, Zap, Layers, BarChart3 } from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';
import { useTheme } from '../context/ThemeContext';

interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle: string;
}

export const AuthLayout: React.FC<AuthLayoutProps> = ({ children, title, subtitle }) => {
  const { isDark } = useTheme();

  const cardBg = isDark
    ? 'glass-panel border-[#2D3748]'
    : 'bg-white border-[#E2E8F0] shadow-2xl';

  const titleClass   = isDark ? 'text-white' : 'text-[#0F172A]';
  const subtitleClass = isDark ? 'text-text-secondary' : 'text-[#64748B]';

  return (
    <div className="min-h-screen w-full flex flex-col lg:flex-row items-center justify-center p-4 sm:p-6 lg:p-0 relative">

      {/* Theme Toggle — top-right corner on all screen sizes */}
      <div className="absolute top-4 right-4 z-50">
        <ThemeToggle variant="auth" />
      </div>

      {/* LEFT SIDE */}
      <div className="hidden lg:flex lg:w-1/2 min-h-screen flex-col justify-between p-12 relative border-r border-[#2D3748]/50 bg-gradient-to-br from-[#0D1117] via-[#161B22]/60 to-[#0D1117] overflow-hidden">
        
        {/* Header Logo */}
        <div className="relative z-20">
          <Logo size="lg" showSubtitle />
        </div>

        {/* Floating Interactive Visual Showcase */}
        <div className="relative z-10 my-auto flex flex-col items-center justify-center w-full max-w-lg mx-auto py-8">
          
          {/* Main Visual Node */}
          <div className="relative w-full flex items-center justify-center">
            
            {/* Glowing Backdrop Ring */}
            <div className="absolute w-72 h-72 rounded-full bg-gradient-to-r from-[#3B82F6]/30 to-[#8B5CF6]/30 blur-2xl animate-pulse-slow"></div>

            {/* Central AI Copilot Core Card */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.8 }}
              className="relative z-10 w-full p-6 rounded-2xl glass-panel-glow border border-primary/30 shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between border-b border-[#2D3748] pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-gradient-to-r from-primary to-secondary text-white shadow-md">
                    <Bot className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                      <span>AI Copilot Engine</span>
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-primary/20 text-primary border border-primary/30">
                        ACTIVE
                      </span>
                    </h4>
                    <p className="text-[11px] text-text-secondary">Synthesizing Product Roadmap...</p>
                  </div>
                </div>
                <Sparkles className="w-4 h-4 text-secondary animate-spin" />
              </div>

              {/* Sample AI Roadmap Metrics */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-[#0D1117]/80 border border-[#2D3748] flex flex-col gap-1">
                  <div className="flex items-center gap-1.5 text-xs text-text-secondary">
                    <FileText className="w-3.5 h-3.5 text-primary" />
                    <span>PRD Drafted</span>
                  </div>
                  <span className="text-base font-extrabold text-white">12 Documents</span>
                  <div className="w-full bg-[#2D3748] h-1 rounded-full overflow-hidden">
                    <div className="bg-primary h-full w-[85%] rounded-full"></div>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-[#0D1117]/80 border border-[#2D3748] flex flex-col gap-1">
                  <div className="flex items-center gap-1.5 text-xs text-text-secondary">
                    <LineChart className="w-3.5 h-3.5 text-secondary" />
                    <span>Feedback Score</span>
                  </div>
                  <span className="text-base font-extrabold text-white">94.8% Positive</span>
                  <div className="w-full bg-[#2D3748] h-1 rounded-full overflow-hidden">
                    <div className="bg-secondary h-full w-[94%] rounded-full"></div>
                  </div>
                </div>
              </div>

              {/* Feature Matrix Pulse */}
              <div className="p-3 rounded-xl bg-[#0D1117]/60 border border-[#2D3748] flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs text-text-primary font-medium">
                  <CheckCircle2 className="w-4 h-4 text-status-success" />
                  <span>Strategic Feature Prioritization RICE Score</span>
                </div>
                <span className="text-xs font-mono font-bold text-primary bg-primary/10 px-2 py-0.5 rounded border border-primary/20">
                  9.4 / 10
                </span>
              </div>
            </motion.div>

            {/* Floating Card Widget 1 - Top Right */}
            <motion.div
              animate={{ y: [-6, 6, -6] }}
              transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
              className="absolute -top-6 -right-6 z-20 hidden xl:flex items-center gap-2.5 p-3 rounded-xl bg-[#161B22]/90 border border-secondary/40 backdrop-blur-md shadow-xl text-xs"
            >
              <Zap className="w-4 h-4 text-amber-400 fill-amber-400/20" />
              <div className="flex flex-col">
                <span className="font-bold text-white">Auto-PRD Generation</span>
                <span className="text-[10px] text-text-secondary">5x Faster Strategy</span>
              </div>
            </motion.div>

            {/* Floating Card Widget 2 - Bottom Left */}
            <motion.div
              animate={{ y: [6, -6, 6] }}
              transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
              className="absolute -bottom-6 -left-6 z-20 hidden xl:flex items-center gap-2.5 p-3 rounded-xl bg-[#161B22]/90 border border-primary/40 backdrop-blur-md shadow-xl text-xs"
            >
              <BarChart3 className="w-4 h-4 text-primary" />
              <div className="flex flex-col">
                <span className="font-bold text-white">Customer Insights</span>
                <span className="text-[10px] text-text-secondary">Real-time Semantic Cluster</span>
              </div>
            </motion.div>
          </div>

          {/* Tagline text showcase */}
          <div className="mt-12 text-center space-y-2">
            <h3 className="text-2xl font-bold text-white tracking-tight">
              Supercharge Product Strategy with AI
            </h3>
            <p className="text-sm text-text-secondary leading-relaxed max-w-md mx-auto">
              "Your intelligent AI assistant for product planning, strategy, roadmaps, and customer insights."
            </p>
          </div>

        </div>

        {/* Footer Brand Badges */}
        <div className="relative z-20 flex items-center justify-between text-xs text-text-muted border-t border-[#2D3748]/40 pt-4">
          <span>© 2026 AI Product Manager Copilot</span>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <Layers className="w-3.5 h-3.5 text-primary" /> Enterprise Ready
            </span>
            <span>Security Certified</span>
          </div>
        </div>

      </div>

      {/* RIGHT SIDE: Centered Authentication Form Card */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-2 sm:p-6 lg:p-12 relative z-10">
        
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-md"
        >
          {/* Mobile Logo View Header */}
          <div className="flex lg:hidden justify-center mb-6">
            <Logo size="md" />
          </div>

          {/* Main Auth Card */}
          <div className={`rounded-card p-6 sm:p-8 border relative overflow-hidden ${cardBg}`}>
            
            {/* Top Subtle Card Glow Accent Line */}
            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-primary to-transparent opacity-80" />

            {/* Card Title & Subtitle */}
            <div className="mb-6 space-y-1">
              <h2 className={`text-xl sm:text-2xl font-extrabold tracking-tight ${titleClass}`}>
                {title}
              </h2>
              <p className={`text-xs sm:text-sm ${subtitleClass}`}>
                {subtitle}
              </p>
            </div>

            {/* Dynamic Form Content */}
            {children}

          </div>

          {/* Bottom Trust Badge */}
          <div className="mt-6 text-center text-xs text-text-muted flex items-center justify-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-status-success inline-block"></span>
            <span>256-bit Encrypted SSL & OAuth 2.0 Integration</span>
          </div>

        </motion.div>

      </div>

    </div>
  );
};

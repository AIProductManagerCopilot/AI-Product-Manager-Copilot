import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Logo } from '../components/Logo';
import { ArrowRight, Bot, Sparkles, FileText, Compass, Users, Layers, Zap } from 'lucide-react';

export const WelcomePage: React.FC = () => {
  return (
    <div className="min-h-screen w-full flex flex-col justify-between p-6 sm:p-12 relative overflow-hidden bg-gradient-to-b from-[#0D1117] via-[#161B22]/80 to-[#0D1117]">
      
      {/* Navbar Header */}
      <header className="flex items-center justify-between w-full max-w-7xl mx-auto z-20">
        <Logo size="lg" showSubtitle />

        <div className="flex items-center gap-3">
          <Link
            to="/login"
            className="px-4 py-2 rounded-button text-sm font-semibold text-text-primary hover:text-white bg-[#161B22] border border-[#2D3748] hover:border-primary/50 transition-all"
          >
            Log In
          </Link>
          <Link
            to="/register"
            className="px-4 py-2 rounded-button text-sm font-semibold text-white bg-gradient-to-r from-primary to-secondary hover:from-primary-hover hover:to-secondary-hover shadow-lg shadow-primary/20 transition-all flex items-center gap-1.5"
          >
            <span>Get Started</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </header>

      {/* Main Hero Container */}
      <main className="w-full max-w-6xl mx-auto my-auto py-12 z-10 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        
        {/* Left Content Column */}
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          className="flex flex-col gap-6 text-left"
        >
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary/10 border border-primary/30 text-primary text-xs font-semibold w-fit">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Next-Gen Enterprise AI SaaS</span>
          </div>

          {/* Heading */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white tracking-tight leading-[1.15]">
            Transform Idea to <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-secondary to-primary animate-shimmer">
              Roadmap in Seconds
            </span>
          </h1>

          {/* Short Description */}
          <p className="text-base sm:text-lg text-text-secondary leading-relaxed max-w-xl">
            Your intelligent AI assistant for product planning, strategy, roadmaps, and customer insights. Supercharge product management workflows with real-time PRD generation, semantic user feedback clustering, and automated feature scoring.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center gap-4 pt-2">
            <Link
              to="/register"
              className="w-full sm:w-auto px-8 py-3.5 rounded-button text-base font-bold text-white bg-gradient-to-r from-primary to-secondary hover:opacity-95 shadow-xl shadow-primary/25 transition-all flex items-center justify-center gap-2 group"
            >
              <span>Get Started Free</span>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>

            <Link
              to="/login"
              className="w-full sm:w-auto px-8 py-3.5 rounded-button text-base font-bold text-text-primary bg-[#161B22] border border-[#2D3748] hover:border-text-secondary/50 transition-all text-center"
            >
              Sign In to Workspace
            </Link>
          </div>

          {/* Feature Highlights List */}
          <div className="grid grid-cols-2 gap-4 pt-6 border-t border-[#2D3748]/60 text-xs text-text-secondary">
            <div className="flex items-center gap-2">
              <Bot className="w-4 h-4 text-primary" />
              <span>Automated PRD Writing</span>
            </div>
            <div className="flex items-center gap-2">
              <Compass className="w-4 h-4 text-secondary" />
              <span>Strategic Roadmap Generator</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-status-success" />
              <span>Customer Insight Clustering</span>
            </div>
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-400" />
              <span>RICE & KANO Feature Scoring</span>
            </div>
          </div>
        </motion.div>

        {/* Right Illustration Column */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8 }}
          className="relative flex items-center justify-center"
        >
          {/* Ambient Glow */}
          <div className="absolute w-80 h-80 rounded-full bg-gradient-to-tr from-primary/30 to-secondary/30 blur-3xl animate-pulse-slow"></div>

          {/* Illustration Card Container */}
          <div className="relative z-10 w-full max-w-lg p-6 glass-panel rounded-card border border-[#2D3748] shadow-2xl flex flex-col gap-5">
            
            {/* Window Top Bar */}
            <div className="flex items-center justify-between border-b border-[#2D3748] pb-3">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-status-error/80"></span>
                <span className="w-3 h-3 rounded-full bg-amber-500/80"></span>
                <span className="w-3 h-3 rounded-full bg-status-success/80"></span>
                <span className="ml-2 text-xs font-mono text-text-muted">ai-copilot-studio.v1</span>
              </div>
              <span className="text-[11px] font-semibold text-primary px-2.5 py-0.5 rounded-full bg-primary/10 border border-primary/20">
                PRO ENGINE
              </span>
            </div>

            {/* AI Roadmap Visual Card */}
            <div className="p-4 rounded-xl bg-[#0D1117] border border-[#2D3748] space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-primary" />
                  <span className="text-xs font-bold text-white">Q3 Product Strategy PRD</span>
                </div>
                <span className="text-[10px] text-status-success font-mono">98% Match</span>
              </div>

              {/* Progress bars */}
              <div className="space-y-2 text-[11px]">
                <div className="flex justify-between text-text-secondary">
                  <span>Market Analysis & Persona Alignment</span>
                  <span className="text-white font-semibold">100%</span>
                </div>
                <div className="w-full bg-[#2D3748] h-1.5 rounded-full overflow-hidden">
                  <div className="bg-primary h-full w-full rounded-full"></div>
                </div>

                <div className="flex justify-between text-text-secondary">
                  <span>Engineering Effort Estimation</span>
                  <span className="text-white font-semibold">82%</span>
                </div>
                <div className="w-full bg-[#2D3748] h-1.5 rounded-full overflow-hidden">
                  <div className="bg-secondary h-full w-[82%] rounded-full"></div>
                </div>
              </div>
            </div>

            {/* Micro Floating Modules */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-xl bg-[#161B22] border border-[#2D3748] flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/20 text-primary">
                  <Layers className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-white">Feature Specs</div>
                  <div className="text-[10px] text-text-muted">Instant Jira export</div>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-[#161B22] border border-[#2D3748] flex items-center gap-3">
                <div className="p-2 rounded-lg bg-secondary/20 text-secondary">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-white">LLM Assistant</div>
                  <div className="text-[10px] text-text-muted">GPT-4o & Claude 3.5</div>
                </div>
              </div>
            </div>

          </div>
        </motion.div>

      </main>

      {/* Footer */}
      <footer className="w-full max-w-7xl mx-auto z-20 flex flex-col sm:flex-row items-center justify-between text-xs text-text-muted border-t border-[#2D3748]/50 pt-6 gap-3">
        <span>© 2026 AI Product Manager Copilot. All rights reserved.</span>
        <div className="flex items-center gap-6">
          <a href="#privacy" className="hover:text-text-primary transition-colors">Privacy Policy</a>
          <a href="#terms" className="hover:text-text-primary transition-colors">Terms of Service</a>
          <a href="#contact" className="hover:text-text-primary transition-colors">Support</a>
        </div>
      </footer>

    </div>
  );
};

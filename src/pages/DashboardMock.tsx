import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Logo } from '../components/Logo';
import { useAuth } from '../context/AuthContext';
import { LogOut, Bot, Sparkles, FileText, BarChart2, CheckCircle2, ShieldAlert } from 'lucide-react';

export const DashboardMockPage: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-[#0D1117] text-[#F8FAFC] flex flex-col">
      {/* Top Navbar */}
      <header className="w-full border-b border-[#2D3748] bg-[#161B22]/80 backdrop-blur-md px-6 py-4 flex items-center justify-between sticky top-0 z-30">
        <Logo size="md" />

        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-3 px-3 py-1.5 rounded-xl bg-[#0D1117] border border-[#2D3748]">
            <img
              src={user?.avatarUrl || 'https://api.dicebear.com/7.x/bottts/svg?seed=pm'}
              alt="Avatar"
              className="w-7 h-7 rounded-full bg-primary/20 border border-primary/40"
            />
            <div className="flex flex-col text-left">
              <span className="text-xs font-bold text-white">{user?.name || 'Alex Morgan'}</span>
              <span className="text-[10px] text-text-secondary">{user?.role || 'Product Lead'}</span>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-3.5 py-2 rounded-button text-xs font-semibold bg-[#161B22] border border-[#2D3748] hover:border-status-error/50 text-text-secondary hover:text-status-error transition-all"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Sign Out</span>
          </button>
        </div>
      </header>

      {/* Workspace Dashboard Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 sm:p-10 space-y-8">
        
        {/* Welcome Banner */}
        <div className="p-8 rounded-card glass-panel-glow border border-primary/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative overflow-hidden">
          <div className="space-y-2 relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/15 border border-primary/30 text-primary text-xs font-bold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Session Authenticated</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Welcome back, {user?.name || 'Product Manager'}!
            </h1>
            <p className="text-sm text-text-secondary">
              Logged in as <span className="text-text-primary font-semibold">{user?.email}</span> ({user?.organization || 'Acme Corp'})
            </p>
          </div>

          <div className="flex items-center gap-3 relative z-10">
            <button className="px-5 py-3 rounded-button text-sm font-bold text-white bg-gradient-to-r from-primary to-secondary hover:opacity-90 transition-all shadow-lg shadow-primary/25 flex items-center gap-2">
              <Bot className="w-4 h-4" />
              <span>New AI PRD Draft</span>
            </button>
          </div>
        </div>

        {/* Dashboard Grid Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          <div className="p-6 rounded-card glass-panel border border-[#2D3748] space-y-4">
            <div className="p-3 rounded-xl bg-primary/20 text-primary w-fit">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">PRD Generation Engine</h3>
              <p className="text-xs text-text-secondary mt-1">
                Generate enterprise-ready specs from raw user prompts in seconds.
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs font-semibold text-status-success">
              <CheckCircle2 className="w-4 h-4" />
              <span>Ready for Copilot Prompts</span>
            </div>
          </div>

          <div className="p-6 rounded-card glass-panel border border-[#2D3748] space-y-4">
            <div className="p-3 rounded-xl bg-secondary/20 text-secondary w-fit">
              <BarChart2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Semantic Insight Cluster</h3>
              <p className="text-xs text-text-secondary mt-1">
                Parse customer feedback across Zendesk, Intercom, and App Store reviews.
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs font-semibold text-primary">
              <Sparkles className="w-4 h-4" />
              <span>48 New Feedback Signals</span>
            </div>
          </div>

          <div className="p-6 rounded-card glass-panel border border-[#2D3748] space-y-4">
            <div className="p-3 rounded-xl bg-status-success/20 text-status-success w-fit">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Security & JWT Status</h3>
              <p className="text-xs text-text-secondary mt-1">
                Session active with token refresh support and OAuth 2.0 integration.
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs font-semibold text-status-success">
              <CheckCircle2 className="w-4 h-4" />
              <span>JWT Session Active</span>
            </div>
          </div>

        </div>

      </main>
    </div>
  );
};

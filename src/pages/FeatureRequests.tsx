import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  FileText,
  Users,
  BrainCircuit,
  Search,
  ChevronDown,
  ArrowRight,
  TrendingUp,
  Sparkles,
  SortDesc,
  Moon,
  PieChart,
  LogOut,
  Link,
  Settings2,
  File
} from 'lucide-react';
import { Sidebar } from '../components/Sidebar';
import { TopNavbar } from '../components/TopNavbar';
import { useTheme } from '../context/ThemeContext';

const PurpleSparkline: React.FC = () => (
  <svg className="w-24 h-10 overflow-visible" viewBox="0 0 100 40" fill="none">
    <defs>
      <linearGradient id="purpleGrad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#8B5CF6" stopOpacity="0.35" />
        <stop offset="100%" stopColor="#8B5CF6" stopOpacity="0.0" />
      </linearGradient>
    </defs>
    <path
      d="M0 30 Q15 28, 30 22 T60 25 T80 12 T100 18 L100 40 L0 40 Z"
      fill="url(#purpleGrad)"
    />
    <path
      d="M0 30 Q15 28, 30 22 T60 25 T80 12 T100 18"
      stroke="#8B5CF6"
      strokeWidth="2.5"
      strokeLinecap="round"
    />
  </svg>
);

const BlueSparkline: React.FC = () => (
  <svg className="w-24 h-10 overflow-visible" viewBox="0 0 100 40" fill="none">
    <defs>
      <linearGradient id="blueGrad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.35" />
        <stop offset="100%" stopColor="#3B82F6" stopOpacity="0.0" />
      </linearGradient>
    </defs>
    <path
      d="M0 25 Q20 35, 40 20 T70 22 T100 10 L100 40 L0 40 Z"
      fill="url(#blueGrad)"
    />
    <path
      d="M0 25 Q20 35, 40 20 T70 22 T100 10"
      stroke="#3B82F6"
      strokeWidth="2.5"
      strokeLinecap="round"
    />
  </svg>
);

const GreenSparkline: React.FC = () => (
  <svg className="w-24 h-10 overflow-visible" viewBox="0 0 100 40" fill="none">
    <defs>
      <linearGradient id="greenGrad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#10B981" stopOpacity="0.35" />
        <stop offset="100%" stopColor="#10B981" stopOpacity="0.0" />
      </linearGradient>
    </defs>
    <path
      d="M0 20 Q15 25, 30 15 T60 20 T80 10 T100 15 L100 40 L0 40 Z"
      fill="url(#greenGrad)"
    />
    <path
      d="M0 20 Q15 25, 30 15 T60 20 T80 10 T100 15"
      stroke="#10B981"
      strokeWidth="2.5"
      strokeLinecap="round"
    />
  </svg>
);

const FEATURES_DATA = [
  { 
    id: 1, 
    rank: 1, 
    title: 'PDF Statement Export', 
    reqs: 612, 
    segment: 'Finance', 
    quote: 'Need PDF for tax filing and record keeping', 
    icon: FileText,
    rankColor: '#F59E0B',
    segmentColor: 'text-[#8B5CF6] bg-[#8B5CF6]/10 border-[#8B5CF6]/20'
  },
  { 
    id: 2, 
    rank: 2, 
    title: 'Dark Mode', 
    reqs: 381, 
    segment: 'Enterprise', 
    quote: 'My eyes hurt at night, please add dark mode', 
    icon: Moon,
    rankColor: '#94A3B8',
    segmentColor: 'text-[#3B82F6] bg-[#3B82F6]/10 border-[#3B82F6]/20'
  },
  { 
    id: 3, 
    rank: 3, 
    title: 'Spending Analytics', 
    reqs: 344, 
    segment: 'All Users', 
    quote: 'Category breakdown missing in dashboard', 
    icon: PieChart,
    rankColor: '#F97316',
    segmentColor: 'text-[#10B981] bg-[#10B981]/10 border-[#10B981]/20'
  },
  { 
    id: 4, 
    rank: 4, 
    title: 'Bulk Transaction Export', 
    reqs: 287, 
    segment: 'Consumer', 
    quote: 'Exporting one by one is time consuming', 
    icon: LogOut,
    rankColor: '#475569',
    segmentColor: 'text-[#F59E0B] bg-[#F59E0B]/10 border-[#F59E0B]/20'
  },
  { 
    id: 5, 
    rank: 5, 
    title: 'UPI Payment Support', 
    reqs: 241, 
    segment: 'Retail', 
    quote: 'Need UPI payments for quick transfers', 
    icon: Link,
    rankColor: '#475569',
    segmentColor: 'text-[#14B8A6] bg-[#14B8A6]/10 border-[#14B8A6]/20'
  },
];

export const FeatureRequestsPage: React.FC = () => {
  const { isDark } = useTheme();
  
  const cardBg = isDark
    ? 'bg-[#161B22]/90 border-[#2D3748] shadow-lg shadow-black/20'
    : 'bg-white border-[#E2E8F0] shadow-sm hover:shadow-md';

  const tableHeaderBg = isDark ? 'bg-[#0D1117]/60 text-[#64748B]' : 'bg-[#F8FAFC] text-[#64748B]';

  return (
    <div className="min-h-screen transition-colors duration-200" style={{ backgroundColor: 'var(--bg-base)' }}>
      <Sidebar />
      <div className="ml-60 min-h-screen flex flex-col">
        <TopNavbar />
        <main className="flex-1 pt-20 px-8 pb-12 space-y-7 max-w-screen-2xl mx-auto w-full">
          <div className="space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-extrabold flex items-center gap-3" style={{ color: 'var(--text-primary)' }}>
                  Feature Requests
                  <Settings2 className="w-6 h-6 text-[#8B5CF6]" />
                </h1>
                <p className="mt-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
                  AI-clustered and prioritized customer requests ranked by impact and frequency.
                </p>
              </div>
              <button className="px-5 py-2.5 rounded-xl font-bold bg-gradient-to-r from-[#3B82F6] to-[#8B5CF6] text-white flex items-center gap-2 hover:opacity-90 shadow-lg shadow-[#8B5CF6]/20 transition-all">
                <Sparkles className="w-4 h-4" />
                Generate PRD for Selected
              </button>
            </div>

            {/* Metrics Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Card 1 */}
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                className={`rounded-2xl border p-5 flex items-center justify-between ${cardBg}`}
              >
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2.5 rounded-xl bg-[#8B5CF6]/15 border border-[#8B5CF6]/30 text-[#8B5CF6]">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>Total Requests</p>
                      <p className="text-2xl font-extrabold" style={{ color: 'var(--text-primary)' }}>1,247</p>
                    </div>
                  </div>
                  <div className="text-[11px] font-bold text-[#10B981] flex items-center gap-1">
                    <TrendingUp className="w-3.5 h-3.5" />
                    <span>8% this month</span>
                  </div>
                </div>
                <PurpleSparkline />
              </motion.div>

              {/* Card 2 */}
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className={`rounded-2xl border p-5 flex items-center justify-between ${cardBg}`}
              >
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2.5 rounded-xl bg-[#3B82F6]/15 border border-[#3B82F6]/30 text-[#3B82F6]">
                      <Users className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>Unique Features</p>
                      <p className="text-2xl font-extrabold" style={{ color: 'var(--text-primary)' }}>38</p>
                    </div>
                  </div>
                  <div className="text-[11px] font-medium" style={{ color: 'var(--text-muted)' }}>
                    After semantic deduplication
                  </div>
                </div>
                <BlueSparkline />
              </motion.div>

              {/* Card 3 */}
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className={`rounded-2xl border p-5 flex items-center justify-between ${cardBg}`}
              >
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2.5 rounded-xl bg-[#10B981]/15 border border-[#10B981]/30 text-[#10B981]">
                      <BrainCircuit className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>Clustered by AI</p>
                      <p className="text-2xl font-extrabold" style={{ color: 'var(--text-primary)' }}>100%</p>
                    </div>
                  </div>
                  <div className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-[#3B82F6]/10 text-[#3B82F6] border border-[#3B82F6]/20">
                    Embeddings Active
                  </div>
                </div>
                <GreenSparkline />
              </motion.div>
            </div>

            {/* Filters Row */}
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className={`flex items-center px-4 py-2 rounded-xl border ${isDark ? 'bg-[#0D1117] border-[#2D3748]' : 'bg-white border-[#E2E8F0]'}`}>
                  <Search className="w-4 h-4 mr-2" style={{ color: 'var(--text-muted)' }} />
                  <input
                    type="text"
                    placeholder="Search features..."
                    className="bg-transparent border-none outline-none text-sm w-48"
                    style={{ color: 'var(--text-primary)' }}
                  />
                </div>
                <button className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-medium ${isDark ? 'bg-[#0D1117] border-[#2D3748] text-[#94A3B8]' : 'bg-white border-[#E2E8F0] text-[#64748B]'}`}>
                  <Users className="w-4 h-4" />
                  All Segments
                  <ChevronDown className="w-4 h-4 ml-1" />
                </button>
              </div>
              <button className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-medium ${isDark ? 'bg-[#0D1117] border-[#2D3748] text-[#94A3B8]' : 'bg-white border-[#E2E8F0] text-[#64748B]'}`}>
                <SortDesc className="w-4 h-4" />
                Sort by Rank
                <ChevronDown className="w-4 h-4 ml-1" />
              </button>
            </div>

            {/* Table */}
            <div className={`border rounded-2xl overflow-hidden ${cardBg}`}>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className={`text-xs uppercase ${tableHeaderBg}`}>
                    <tr>
                      <th className="px-6 py-4 font-semibold">Rank</th>
                      <th className="px-6 py-4 font-semibold">Feature</th>
                      <th className="px-6 py-4 font-semibold">Requests</th>
                      <th className="px-6 py-4 font-semibold">Segments</th>
                      <th className="px-6 py-4 font-semibold">Sample Quote</th>
                      <th className="px-6 py-4 font-semibold text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#2D3748]">
                    {FEATURES_DATA.map((row) => (
                      <tr key={row.id} className="hover:bg-[#161B22]/50 transition-colors group">
                        <td className="px-6 py-4">
                          <div 
                            className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm border-2"
                            style={{ borderColor: row.rankColor, color: row.rankColor, backgroundColor: isDark ? 'transparent' : 'white' }}
                          >
                            {row.rank}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-[#8B5CF6]/10 border border-[#8B5CF6]/20 text-[#8B5CF6]">
                              <row.icon className="w-4 h-4" />
                            </div>
                            <span className="font-semibold text-[15px]" style={{ color: 'var(--text-primary)' }}>
                              {row.title}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 font-bold" style={{ color: 'var(--text-primary)' }}>
                          {row.reqs}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2.5 py-1 rounded-md text-[11px] font-bold border flex items-center gap-1.5 w-max ${row.segmentColor}`}>
                            <Users className="w-3 h-3" />
                            {row.segment}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-start gap-1">
                            <span className="text-[#8B5CF6] text-lg font-serif">"</span>
                            <span className="italic text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
                              {row.quote}
                            </span>
                            <span className="text-[#8B5CF6] text-lg font-serif">"</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button className="px-3 py-1.5 rounded-lg border border-[#3B82F6]/30 text-[#3B82F6] hover:bg-[#3B82F6]/10 text-xs font-semibold flex items-center gap-1.5 ml-auto transition-colors">
                            <File className="w-3.5 h-3.5" />
                            Generate PRD
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              {/* Pagination */}
              <div className={`p-4 border-t flex items-center justify-between text-xs ${isDark ? 'border-[#2D3748] text-[#64748B]' : 'border-[#E2E8F0] text-[#94A3B8]'}`}>
                <span>Showing 1 to 5 of 38 features</span>
                <div className="flex items-center gap-1">
                  <button className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-[#2D3748] transition-colors">&lt;</button>
                  <button className="w-7 h-7 flex items-center justify-center rounded-md bg-[#3B82F6] text-white font-bold">1</button>
                  <button className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-[#2D3748] transition-colors text-[#94A3B8]">2</button>
                  <button className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-[#2D3748] transition-colors text-[#94A3B8]">3</button>
                  <span className="px-1 text-[#64748B]">...</span>
                  <button className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-[#2D3748] transition-colors text-[#94A3B8]">8</button>
                  <button className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-[#2D3748] transition-colors">&gt;</button>
                </div>
              </div>
            </div>
            
          </div>
        </main>
      </div>
    </div>
  );
};

export default FeatureRequestsPage;

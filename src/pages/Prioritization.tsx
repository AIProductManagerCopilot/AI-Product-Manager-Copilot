import React from 'react';
import { motion } from 'framer-motion';
import {
  FileText,
  Users,
  Moon,
  PieChart,
  LogOut,
  Settings2,
  RefreshCcw,
  Star,
  Snowflake,
  LayoutGrid,
  Target,
  CheckCircle2,
  Clock,
  File
} from 'lucide-react';
import { Sidebar } from '../components/Sidebar';
import { TopNavbar } from '../components/TopNavbar';
import { useTheme } from '../context/ThemeContext';

const PRIORITIZATION_DATA = [
  { 
    id: 1, 
    rank: '#1', 
    score: 87,
    title: 'PDF Statement Export', 
    description: 'Allow users to export statements in PDF format',
    tags: ['Feature Request', 'High Impact'],
    icon: FileText,
    color: '#F59E0B',
    reach: '16,000',
    impact: '3.0',
    impactLabel: 'High',
    confidence: '90%',
    confidenceLabel: 'High',
    effort: '4',
    iconColor: '#8B5CF6'
  },
  { 
    id: 2, 
    rank: '#2', 
    score: 74,
    title: 'Dark Mode', 
    description: 'Enable dark mode across the application',
    tags: ['Feature Request', 'Medium Impact'],
    icon: Moon,
    color: '#94A3B8',
    reach: '12,500',
    impact: '2.5',
    impactLabel: 'High',
    confidence: '85%',
    confidenceLabel: 'High',
    effort: '3',
    iconColor: '#3B82F6'
  },
  { 
    id: 3, 
    rank: '#3', 
    score: 61,
    title: 'Spending Analytics', 
    description: 'Provide category-wise spending insights',
    tags: ['Feature Request', 'Medium Impact'],
    icon: PieChart,
    color: '#F97316',
    reach: '10,200',
    impact: '2.0',
    impactLabel: 'Medium',
    confidence: '80%',
    confidenceLabel: 'Medium',
    effort: '3',
    iconColor: '#10B981'
  },
  { 
    id: 4, 
    rank: '#4', 
    score: 48,
    title: 'Bulk Transaction Export', 
    description: 'Export multiple transactions at once',
    tags: ['Feature Request', 'Low Impact'],
    icon: LogOut,
    color: '#3B82F6',
    reach: '7,800',
    impact: '1.5',
    impactLabel: 'Medium',
    confidence: '75%',
    confidenceLabel: 'Medium',
    effort: '5',
    iconColor: '#F59E0B'
  },
];

export const PrioritizationPage: React.FC = () => {
  const { isDark } = useTheme();
  
  const cardBg = isDark
    ? 'bg-[#161B22]/90 border-[#2D3748]'
    : 'bg-white border-[#E2E8F0]';

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
                  Prioritization Engine — <span className={`font-medium text-xl mt-1 text-[#94A3B8]`}>Abstract Scoring Matrix</span>
                  <Settings2 className="w-5 h-5 text-[#8B5CF6] ml-2" />
                </h1>
                <p className="mt-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
                  Score and rank feature requests using proven prioritization frameworks.
                </p>
              </div>
              <button className={`px-5 py-2.5 rounded-xl font-bold bg-[#3B82F6] hover:bg-[#2563EB] ${isDark ? 'text-white' : 'text-gray-900'} flex items-center gap-2 transition-all`}>
                <RefreshCcw className="w-4 h-4" />
                Recalculate
              </button>
            </div>

            {/* Tabs */}
            <div className={`rounded-xl border ${cardBg}`}>
              <div className="flex items-center divide-x divide-[#2D3748]">
                <button className="flex-1 py-4 flex items-center justify-center gap-2 font-bold text-[#3B82F6] border-b-2 border-[#3B82F6] bg-[#3B82F6]/5">
                  <Star className="w-4 h-4" />
                  RICE Score
                </button>
                <button className={`flex-1 py-4 flex items-center justify-center gap-2 font-medium hover:bg-[#1e2530] transition-colors ${isDark ? 'text-[#94A3B8]' : 'text-[#64748B]'}`}>
                  <Snowflake className="w-4 h-4" />
                  ICE Score
                </button>
                <button className={`flex-1 py-4 flex items-center justify-center gap-2 font-medium hover:bg-[#1e2530] transition-colors ${isDark ? 'text-[#94A3B8]' : 'text-[#64748B]'}`}>
                  <LayoutGrid className="w-4 h-4" />
                  MoSCoW Matrix
                </button>
                <button className={`flex-1 py-4 flex items-center justify-center gap-2 font-medium hover:bg-[#1e2530] transition-colors ${isDark ? 'text-[#94A3B8]' : 'text-[#64748B]'}`}>
                  <Target className="w-4 h-4" />
                  Custom Weights
                </button>
              </div>
              <div className="p-4 text-center text-sm" style={{ color: 'var(--text-muted)' }}>
                Score = ( <span className="text-[#3B82F6]">Reach</span> × <span className="text-[#8B5CF6]">Impact</span> × <span className="text-[#10B981]">Confidence</span> ) / <span className="text-[#F43F5E]">Effort</span>
              </div>
            </div>

            {/* Table */}
            <div className={`border rounded-2xl overflow-hidden ${cardBg}`}>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className={`text-xs ${tableHeaderBg}`}>
                    <tr>
                      <th className="px-6 py-4 font-semibold w-32">Rank & Score</th>
                      <th className="px-6 py-4 font-semibold">Feature & Details</th>
                      <th className="px-6 py-4 font-semibold text-center" colSpan={4}>RICE Parameters</th>
                      <th className="px-6 py-4 font-semibold text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#2D3748]">
                    {PRIORITIZATION_DATA.map((row) => (
                      <tr key={row.id} className="hover:bg-[#161B22]/50 transition-colors group">
                        <td className="px-6 py-6">
                          <div className="flex items-center gap-4">
                            <span className="font-bold text-lg" style={{ color: row.color }}>{row.rank}</span>
                            <div className="relative w-16 h-16 rounded-full flex items-center justify-center" style={{ border: `3px solid ${row.color}40`, borderTopColor: row.color, transform: 'rotate(-45deg)' }}>
                              <div className="absolute inset-0 flex flex-col items-center justify-center" style={{ transform: 'rotate(45deg)' }}>
                                <span className={`text-xl font-bold leading-none ${isDark ? 'text-white' : 'text-gray-900'}`}>{row.score}</span>
                                <span className="text-[10px] text-[#64748B]">/100</span>
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-start gap-4">
                            <div className="p-2.5 rounded-xl bg-opacity-10 border mt-1 flex-shrink-0" style={{ backgroundColor: `${row.iconColor}15`, borderColor: `${row.iconColor}30`, color: row.iconColor }}>
                              <row.icon className="w-5 h-5" />
                            </div>
                            <div>
                              <h3 className={`font-bold text-base ${isDark ? 'text-white' : 'text-gray-900'}`}>{row.title}</h3>
                              <p className={`text-sm text-[#94A3B8] mt-0.5`}>{row.description}</p>
                              <div className="flex items-center gap-2 mt-2.5">
                                {row.tags.map((tag, idx) => (
                                  <span key={idx} className={`px-2 py-0.5 rounded-md text-[11px] font-medium bg-[#1e2530] text-[#94A3B8] border border-[#2D3748]`}>
                                    {tag}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>
                        </td>
                        
                        {/* Reach */}
                        <td className="px-2 py-4 align-top pt-8">
                          <div className="flex flex-col items-center text-center">
                            <div className={`flex items-center gap-1.5 text-[11px] text-[#94A3B8] mb-1.5`}>
                              <Users className="w-3.5 h-3.5" /> Reach
                            </div>
                            <span className={`font-bold text-[15px] ${isDark ? 'text-white' : 'text-gray-900'}`}>{row.reach}</span>
                            <span className="text-[11px] text-[#64748B]">users</span>
                          </div>
                        </td>
                        
                        {/* Impact */}
                        <td className="px-2 py-4 align-top pt-8">
                          <div className="flex flex-col items-center text-center">
                            <div className={`flex items-center gap-1.5 text-[11px] text-[#94A3B8] mb-1.5`}>
                              <Target className="w-3.5 h-3.5 text-[#3B82F6]" /> Impact
                            </div>
                            <span className={`font-bold text-[15px] ${isDark ? 'text-white' : 'text-gray-900'}`}>{row.impact}</span>
                            <span className="text-[11px] text-[#64748B]">{row.impactLabel}</span>
                          </div>
                        </td>
                        
                        {/* Confidence */}
                        <td className="px-2 py-4 align-top pt-8">
                          <div className="flex flex-col items-center text-center">
                            <div className={`flex items-center gap-1.5 text-[11px] text-[#94A3B8] mb-1.5`}>
                              <CheckCircle2 className="w-3.5 h-3.5 text-[#10B981]" /> Confidence
                            </div>
                            <span className={`font-bold text-[15px] ${isDark ? 'text-white' : 'text-gray-900'}`}>{row.confidence}</span>
                            <span className="text-[11px] text-[#64748B]">{row.confidenceLabel}</span>
                          </div>
                        </td>
                        
                        {/* Effort */}
                        <td className="px-2 py-4 align-top pt-8">
                          <div className="flex flex-col items-center text-center">
                            <div className={`flex items-center gap-1.5 text-[11px] text-[#94A3B8] mb-1.5`}>
                              <Clock className="w-3.5 h-3.5 text-[#F43F5E]" /> Effort
                            </div>
                            <span className={`font-bold text-[15px] ${isDark ? 'text-white' : 'text-gray-900'}`}>{row.effort}</span>
                            <span className="text-[11px] text-[#64748B]">person-weeks</span>
                          </div>
                        </td>

                        <td className="px-6 py-4 text-right align-middle">
                          <button className={`px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-[#3B82F6] to-[#8B5CF6] ${isDark ? 'text-white' : 'text-gray-900'} hover:opacity-90 inline-flex items-center gap-2`}>
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
                <span>Showing 1 to 4 of 38 features</span>
                <div className="flex items-center gap-1">
                  <button className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-[#2D3748] transition-colors">&lt;</button>
                  <button className={`w-7 h-7 flex items-center justify-center rounded-md bg-[#6366F1] ${isDark ? 'text-white' : 'text-gray-900'} font-bold`}>1</button>
                  <button className={`w-7 h-7 flex items-center justify-center rounded-md hover:bg-[#2D3748] transition-colors text-[#94A3B8]`}>2</button>
                  <button className={`w-7 h-7 flex items-center justify-center rounded-md hover:bg-[#2D3748] transition-colors text-[#94A3B8]`}>3</button>
                  <span className="px-1 text-[#64748B]">...</span>
                  <button className={`w-7 h-7 flex items-center justify-center rounded-md hover:bg-[#2D3748] transition-colors text-[#94A3B8]`}>10</button>
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

export default PrioritizationPage;

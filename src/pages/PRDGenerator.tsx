import React from 'react';
import { motion } from 'framer-motion';
import {
  FileText,
  Download,
  ClipboardList,
  Target,
  Users,
  CheckCircle2,
  MinusCircle,
  BarChart2,
  Building2,
  Clock,
  Calendar,
  Sparkles,
  ChevronDown,
  User,
  Check,
  X
} from 'lucide-react';
import { Sidebar } from '../components/Sidebar';
import { TopNavbar } from '../components/TopNavbar';
import { useTheme } from '../context/ThemeContext';

export const PRDGeneratorPage: React.FC = () => {
  const { isDark } = useTheme();

  const cardBg = isDark
    ? 'bg-[#161B22]/90 border-[#2D3748] shadow-lg shadow-black/20'
    : 'bg-white border-[#E2E8F0] shadow-sm hover:shadow-md';

  const sectionBg = isDark ? 'bg-[#0D1117]/50 border-[#2D3748]' : 'bg-[#F8FAFC] border-[#E2E8F0]';

  return (
    <div className="min-h-screen transition-colors duration-200" style={{ backgroundColor: 'var(--bg-base)' }}>
      <Sidebar />
      <div className="ml-60 min-h-screen flex flex-col">
        <TopNavbar />
        <main className="flex-1 pt-20 px-8 pb-12 w-full max-w-screen-2xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Left Column - PRD Document */}
            <div className="lg:col-span-2 space-y-6">
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                className={`rounded-2xl border p-8 ${cardBg}`}
              >
                {/* Header */}
                <div className={`flex items-start justify-between pb-6 border-b border-[#2D3748]`}>
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-xl bg-[#8B5CF6]/15 border border-[#8B5CF6]/30 text-[#8B5CF6]">
                      <FileText className="w-8 h-8" />
                    </div>
                    <div>
                      <h1 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'} mb-1`}>PDF Statement Export</h1>
                      <p className={`text-sm text-[#94A3B8]`}>
                        Generated Oct 12, 2025 • Based on 612 feedback items
                      </p>
                    </div>
                  </div>
                  <button className={`px-4 py-2 rounded-xl border border-[#2D3748] ${isDark ? 'text-white' : 'text-gray-900'} hover:bg-[#1e2530] flex items-center gap-2 transition-colors`}>
                    <Download className="w-4 h-4" />
                    Export PDF
                  </button>
                </div>

                <div className="py-6 space-y-10">
                  {/* 1. Problem Statement */}
                  <section>
                    <h2 className="flex items-center gap-2 text-lg font-bold text-[#8B5CF6] mb-3">
                      <ClipboardList className="w-5 h-5" /> 1. Problem Statement
                    </h2>
                    <p className={`text-[#CBD5E1] text-sm leading-relaxed`}>
                      Users currently cannot download their transaction history in PDF format for record keeping, tax filing, or accounting purposes. This leads to manual workarounds, user frustration, and high volume of support tickets related to statement exports.
                    </p>
                  </section>

                  {/* 2. Goals */}
                  <section>
                    <h2 className="flex items-center gap-2 text-lg font-bold text-[#8B5CF6] mb-4">
                      <Target className="w-5 h-5" /> 2. Goals
                    </h2>
                    <div className={`rounded-xl border border-[#2D3748] overflow-hidden`}>
                      <div className={`grid grid-cols-2 divide-x divide-[#2D3748] border-b border-[#2D3748]`}>
                        <div className={`p-3 text-sm text-[#CBD5E1] flex items-center gap-2`}>
                          <div className="w-1.5 h-1.5 rounded-full bg-[#8B5CF6]"></div>
                          Enable users to export transaction history as PDF
                        </div>
                        <div className={`p-3 text-sm text-[#94A3B8]`}>Improve user convenience</div>
                      </div>
                      <div className={`grid grid-cols-2 divide-x divide-[#2D3748] border-b border-[#2D3748]`}>
                        <div className={`p-3 text-sm text-[#CBD5E1] flex items-center gap-2`}>
                          <div className="w-1.5 h-1.5 rounded-full bg-[#8B5CF6]"></div>
                          Reduce support tickets related to statement requests
                        </div>
                        <div className={`p-3 text-sm text-[#94A3B8]`}>Decrease by 40%</div>
                      </div>
                      <div className={`grid grid-cols-2 divide-x divide-[#2D3748] border-b border-[#2D3748]`}>
                        <div className={`p-3 text-sm text-[#CBD5E1] flex items-center gap-2`}>
                          <div className="w-1.5 h-1.5 rounded-full bg-[#8B5CF6]"></div>
                          Improve retention among enterprise users
                        </div>
                        <div className={`p-3 text-sm text-[#94A3B8]`}>Increase NPS by 15 points</div>
                      </div>
                      <div className="grid grid-cols-2 divide-x divide-[#2D3748]">
                        <div className={`p-3 text-sm text-[#CBD5E1] flex items-center gap-2`}>
                          <div className="w-1.5 h-1.5 rounded-full bg-[#8B5CF6]"></div>
                          Ensure secure and compliant document generation
                        </div>
                        <div className={`p-3 text-sm text-[#94A3B8]`}>Meet enterprise standards</div>
                      </div>
                    </div>
                  </section>

                  {/* 3. User Stories */}
                  <section>
                    <h2 className="flex items-center gap-2 text-lg font-bold text-[#8B5CF6] mb-4">
                      <Users className="w-5 h-5" /> 3. User Stories
                    </h2>
                    <div className="space-y-3">
                      <div className={`p-4 rounded-xl border flex items-start justify-between ${sectionBg}`}>
                        <div className="flex items-start gap-3">
                          <User className="w-5 h-5 text-[#8B5CF6] mt-0.5" />
                          <p className={`text-sm text-[#CBD5E1]`}>As a finance manager, I want to download transaction statements in PDF so that I can share reports with my team.</p>
                        </div>
                        <span className="px-2.5 py-1 rounded-md text-[11px] font-medium bg-[#8B5CF6]/10 text-[#8B5CF6] border border-[#8B5CF6]/20 whitespace-nowrap ml-4">
                          Finance Manager
                        </span>
                      </div>
                      <div className={`p-4 rounded-xl border flex items-start justify-between ${sectionBg}`}>
                        <div className="flex items-start gap-3">
                          <User className="w-5 h-5 text-[#8B5CF6] mt-0.5" />
                          <p className={`text-sm text-[#CBD5E1]`}>As an individual user, I want to export my statements for tax filing without visiting a branch.</p>
                        </div>
                        <span className="px-2.5 py-1 rounded-md text-[11px] font-medium bg-[#8B5CF6]/10 text-[#8B5CF6] border border-[#8B5CF6]/20 whitespace-nowrap ml-4">
                          Individual User
                        </span>
                      </div>
                      <div className={`p-4 rounded-xl border flex items-start justify-between ${sectionBg}`}>
                        <div className="flex items-start gap-3">
                          <User className="w-5 h-5 text-[#8B5CF6] mt-0.5" />
                          <p className={`text-sm text-[#CBD5E1]`}>As an accountant, I want bulk PDF exports of client statements for auditing and compliance.</p>
                        </div>
                        <span className="px-2.5 py-1 rounded-md text-[11px] font-medium bg-[#8B5CF6]/10 text-[#8B5CF6] border border-[#8B5CF6]/20 whitespace-nowrap ml-4">
                          Accountant
                        </span>
                      </div>
                    </div>
                  </section>

                  <div className="grid grid-cols-2 gap-8">
                    {/* 4. Acceptance Criteria */}
                    <section>
                      <h2 className="flex items-center gap-2 text-lg font-bold text-[#8B5CF6] mb-4">
                        <CheckCircle2 className="w-5 h-5" /> 4. Acceptance Criteria
                      </h2>
                      <ul className="space-y-3">
                        {['Users can select date range and download PDF',
                          'PDF includes logo, summary, and transaction table',
                          'Supports filters (date, account, transaction type)',
                          'PDF is password protected for security',
                          'Audit log is created for each export',
                          'Works on web and mobile platforms'
                        ].map((item, idx) => (
                          <li key={idx} className={`flex items-start gap-2 text-sm text-[#CBD5E1]`}>
                            <Check className="w-4 h-4 text-[#10B981] mt-0.5 flex-shrink-0" />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </section>

                    {/* 5. Out of Scope */}
                    <section>
                      <h2 className="flex items-center gap-2 text-lg font-bold text-[#8B5CF6] mb-4">
                        <MinusCircle className="w-5 h-5" /> 5. Out of Scope
                      </h2>
                      <ul className="space-y-3">
                        {['Real-time PDF notifications via email',
                          'Custom branding for individual users',
                          'Editing transactions inside PDF',
                          'Third-party integrations for storage',
                          'Offline PDF generation',
                          'Printed statement delivery by post'
                        ].map((item, idx) => (
                          <li key={idx} className={`flex items-start gap-2 text-sm text-[#CBD5E1]`}>
                            <X className="w-4 h-4 text-[#F43F5E] mt-0.5 flex-shrink-0" />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </section>
                  </div>
                  
                </div>
              </motion.div>
            </div>

            {/* Right Column - Sidebars */}
            <div className="space-y-6">
              
              {/* PRD Summary Panel */}
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className={`rounded-2xl border p-6 ${cardBg}`}
              >
                <h3 className={`flex items-center gap-2 font-bold ${isDark ? 'text-white' : 'text-gray-900'} mb-6`}>
                  <BarChart2 className="w-5 h-5 text-[#8B5CF6]" /> PRD Summary
                </h3>
                
                <div className="space-y-4">
                  <div className={`p-4 rounded-xl border flex items-center gap-4 ${sectionBg}`}>
                    <div className="p-2.5 rounded-lg bg-[#8B5CF6]/15 text-[#8B5CF6]">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div>
                      <p className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'} leading-none`}>612</p>
                      <p className={`text-[11px] text-[#94A3B8] mt-1`}>Feedback Items Analyzed</p>
                    </div>
                  </div>

                  <div className={`p-4 rounded-xl border flex items-center gap-4 ${sectionBg}`}>
                    <div className="p-2.5 rounded-lg bg-[#3B82F6]/15 text-[#3B82F6]">
                      <Users className="w-5 h-5" />
                    </div>
                    <div>
                      <p className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'} leading-none`}>14,203</p>
                      <p className={`text-[11px] text-[#94A3B8] mt-1`}>Users Impacted</p>
                    </div>
                  </div>

                  <div className={`p-4 rounded-xl border flex items-center gap-4 ${sectionBg}`}>
                    <div className="p-2.5 rounded-lg bg-[#10B981]/15 text-[#10B981]">
                      <Building2 className="w-5 h-5" />
                    </div>
                    <div>
                      <p className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'} leading-none`}>43</p>
                      <p className={`text-[11px] text-[#94A3B8] mt-1`}>Enterprise Accounts Risked</p>
                    </div>
                  </div>

                  <div className={`p-4 rounded-xl border flex items-center gap-4 ${sectionBg}`}>
                    <div className="p-2.5 rounded-lg bg-[#F59E0B]/15 text-[#F59E0B]">
                      <Clock className="w-5 h-5" />
                    </div>
                    <div>
                      <p className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'} leading-none`}>Saves 14h</p>
                      <p className={`text-[11px] text-[#94A3B8] mt-1`}>PM Co-writing Time</p>
                    </div>
                  </div>

                  <div className={`p-4 rounded-xl border flex items-center gap-4 ${sectionBg}`}>
                    <div className="p-2.5 rounded-lg bg-[#14B8A6]/15 text-[#14B8A6]">
                      <Calendar className="w-5 h-5" />
                    </div>
                    <div>
                      <p className={`text-[11px] text-[#94A3B8] mb-0.5`}>Estimated Effort</p>
                      <p className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'} leading-none`}>2 weeks</p>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Generate New PRD Panel */}
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className={`rounded-2xl border p-6 ${cardBg}`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="w-5 h-5 text-[#8B5CF6]" />
                  <h3 className={`font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Generate New PRD</h3>
                </div>
                <p className={`text-[11px] text-[#94A3B8] mb-6`}>
                  Create a new PRD using AI based on your selected feature or theme.
                </p>

                <div className="space-y-4">
                  <div>
                    <label className={`block text-[11px] font-medium text-[#94A3B8] mb-1.5`}>Select Feature / Theme</label>
                    <div className={`w-full flex items-center justify-between px-3 py-2 rounded-lg border text-sm ${isDark ? 'text-white' : 'text-gray-900'} ${sectionBg}`}>
                      Dark Mode Support
                      <ChevronDown className="w-4 h-4 text-[#64748B]" />
                    </div>
                  </div>

                  <div>
                    <label className={`block text-[11px] font-medium text-[#94A3B8] mb-1.5`}>Choose Framework</label>
                    <div className={`w-full flex items-center justify-between px-3 py-2 rounded-lg border text-sm ${isDark ? 'text-white' : 'text-gray-900'} ${sectionBg}`}>
                      Dark Mode (UI/UX)
                      <ChevronDown className="w-4 h-4 text-[#64748B]" />
                    </div>
                  </div>

                  <div>
                    <label className={`block text-[11px] font-medium text-[#94A3B8] mb-1.5`}>Context / Additional Notes (Optional)</label>
                    <textarea 
                      className={`w-full p-3 rounded-lg border text-sm ${isDark ? 'text-white' : 'text-gray-900'} placeholder-[#475569] resize-none h-24 outline-none focus:border-[#8B5CF6]/50 ${sectionBg}`}
                      placeholder="e.g., Focus on accessibility, battery optimization, enterprise rollout..."
                    ></textarea>
                  </div>

                  <button className={`w-full py-2.5 rounded-xl font-bold bg-gradient-to-r from-[#3B82F6] to-[#8B5CF6] ${isDark ? 'text-white' : 'text-gray-900'} flex items-center justify-center gap-2 hover:opacity-90 transition-all shadow-lg shadow-[#8B5CF6]/20`}>
                    <Sparkles className="w-4 h-4" />
                    Generate with AI
                  </button>
                </div>
              </motion.div>

            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default PRDGeneratorPage;

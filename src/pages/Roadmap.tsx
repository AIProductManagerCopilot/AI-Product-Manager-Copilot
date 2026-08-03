import React from 'react';
import { motion } from 'framer-motion';
import {
  Map,
  Plus,
  Gauge,
  Lock,
  CloudLightning,
  PenTool,
  BarChart,
  Building,
  MoreHorizontal,
  Sparkles,
  Star,
  Users,
  Calendar,
  BrainCircuit
} from 'lucide-react';
import { Sidebar } from '../components/Sidebar';
import { TopNavbar } from '../components/TopNavbar';
import { useTheme } from '../context/ThemeContext';

export const RoadmapPage: React.FC = () => {
  const { isDark } = useTheme();

  const cardBg = isDark
    ? 'bg-[#161B22]/90 border-[#2D3748] shadow-lg shadow-black/20'
    : 'bg-white border-[#E2E8F0] shadow-sm hover:shadow-md';

  const sectionBg = isDark ? 'bg-[#0D1117]/50 border-[#2D3748]' : 'bg-[#F8FAFC] border-[#E2E8F0]';
  const tableBorder = isDark ? 'border-[#2D3748]' : 'border-[#E2E8F0]';

  return (
    <div className="min-h-screen transition-colors duration-200" style={{ backgroundColor: 'var(--bg-base)' }}>
      <Sidebar />
      <div className="ml-60 min-h-screen flex flex-col">
        <TopNavbar />
        <main className="flex-1 pt-20 px-8 pb-12 w-full max-w-screen-2xl mx-auto space-y-6">
          
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'} flex items-center gap-3`}>
                Roadmap — Dynamic Workspace
                <Map className="w-6 h-6 text-[#8B5CF6]" />
              </h1>
              <p className={`text-sm text-[#94A3B8] mt-1`}>
                Module 7 - <span className="text-[#10B981]">Dynamic Sync Active</span> • 197 total items
              </p>
            </div>
            <button className={`px-4 py-2 rounded-xl bg-[#6366F1] ${isDark ? 'text-white' : 'text-gray-900'} font-medium hover:bg-[#4F46E5] flex items-center gap-2 transition-colors`}>
              <Plus className="w-4 h-4" />
              Add Feature
            </button>
          </div>

          {/* Timeline View */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className={`rounded-2xl border ${cardBg} overflow-hidden`}
          >
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[900px]">
                <thead>
                  <tr className={`border-b ${tableBorder}`}>
                    <th className={`p-4 font-semibold text-xs tracking-wider text-[#94A3B8] uppercase w-[200px] border-r ${tableBorder}`}>
                      Tracks
                    </th>
                    <th className={`p-4 text-center border-r ${tableBorder} w-[25%]`}>
                      <div className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>Q1</div>
                      <div className="text-xs text-[#64748B] font-normal">Jan - Mar</div>
                    </th>
                    <th className={`p-4 text-center border-r ${tableBorder} w-[25%]`}>
                      <div className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>Q2</div>
                      <div className="text-xs text-[#64748B] font-normal">Apr - Jun</div>
                    </th>
                    <th className={`p-4 text-center border-r ${tableBorder} w-[25%] bg-[#8B5CF6]/5 relative`}>
                      <div className="absolute top-0 bottom-0 left-1/2 border-l border-dashed border-[#8B5CF6]/50"></div>
                      <div className="font-semibold text-[#8B5CF6] relative z-10">Q3 - NOW</div>
                      <div className="text-xs text-[#3B82F6] font-normal relative z-10">Jul - Sep</div>
                    </th>
                    <th className="p-4 text-center w-[25%]">
                      <div className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>Q4</div>
                      <div className="text-xs text-[#64748B] font-normal">Oct - Dec</div>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#2D3748]">
                  
                  {/* Track: Performance */}
                  <tr>
                    <td className={`p-4 border-r ${tableBorder}`}>
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg bg-[#1E293B] border border-[#334155] text-[#CBD5E1]`}>
                          <Gauge className="w-4 h-4" />
                        </div>
                        <span className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>Performance</span>
                      </div>
                    </td>
                    <td className="p-2" colSpan={2}>
                      <div className="h-10 rounded-lg border border-[#EF4444]/30 bg-[#EF4444]/10 flex items-center justify-between px-4 w-[90%] mx-auto">
                        <span className="text-sm text-[#FCA5A5] font-medium">Transaction Speed Fix</span>
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full border-2 border-[#EF4444]"></div>
                          <span className="text-xs text-[#FCA5A5]">100%</span>
                        </div>
                      </div>
                    </td>
                    <td className={`p-2 border-l ${tableBorder} relative`}>
                      <div className="absolute top-0 bottom-0 left-1/2 border-l border-dashed border-[#8B5CF6]/30"></div>
                    </td>
                    <td className="p-2 relative"></td>
                  </tr>

                  {/* Track: Auth */}
                  <tr>
                    <td className={`p-4 border-r ${tableBorder}`}>
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg bg-[#1E293B] border border-[#334155] text-[#CBD5E1]`}>
                          <Lock className="w-4 h-4" />
                        </div>
                        <span className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>Auth</span>
                      </div>
                    </td>
                    <td className={`p-2 border-r ${tableBorder}`}>
                      <div className="h-10 rounded-lg border border-[#3B82F6]/30 bg-[#3B82F6]/10 flex items-center justify-between px-4 w-[90%] mx-auto">
                        <span className="text-sm text-[#93C5FD] font-medium">Login Stability</span>
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full border-2 border-[#3B82F6]"></div>
                          <span className="text-xs text-[#93C5FD]">100%</span>
                        </div>
                      </div>
                    </td>
                    <td className="p-2"></td>
                    <td className={`p-2 border-l ${tableBorder} relative`}>
                      <div className="absolute top-0 bottom-0 left-1/2 border-l border-dashed border-[#8B5CF6]/30"></div>
                    </td>
                    <td className="p-2 relative"></td>
                  </tr>

                  {/* Track: Ingestion */}
                  <tr>
                    <td className={`p-4 border-r ${tableBorder}`}>
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg bg-[#1E293B] border border-[#334155] text-[#CBD5E1]`}>
                          <CloudLightning className="w-4 h-4" />
                        </div>
                        <span className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>Ingestion</span>
                      </div>
                    </td>
                    <td className="p-2 relative" colSpan={2}>
                      <div className="h-10 rounded-lg border border-[#8B5CF6]/30 bg-[#8B5CF6]/15 flex items-center justify-between px-4 w-[75%] ml-[10%]">
                        <span className="text-sm text-[#C4B5FD] font-medium">Feedback Ingestion Pipeline</span>
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full border-2 border-[#8B5CF6]"></div>
                          <span className="text-xs text-[#C4B5FD]">100%</span>
                        </div>
                      </div>
                    </td>
                    <td className={`p-2 border-l ${tableBorder} relative`}>
                      <div className="absolute top-0 bottom-0 left-1/2 border-l border-dashed border-[#8B5CF6]/30"></div>
                    </td>
                    <td className="p-2 relative"></td>
                  </tr>

                  {/* Track: UI/UX */}
                  <tr>
                    <td className={`p-4 border-r ${tableBorder}`}>
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg bg-[#1E293B] border border-[#334155] text-[#CBD5E1]`}>
                          <PenTool className="w-4 h-4" />
                        </div>
                        <span className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>UI/UX</span>
                      </div>
                    </td>
                    <td className={`p-2 border-r ${tableBorder}`}>
                      <div className={`h-10 rounded-lg border border-[#475569] bg-[#1E293B]/50 flex items-center justify-between px-4 w-[90%] mx-auto`}>
                        <span className={`text-sm text-[#94A3B8]`}>Planning...</span>
                        <MoreHorizontal className="w-4 h-4 text-[#64748B]" />
                      </div>
                    </td>
                    <td className={`p-2 border-r ${tableBorder}`}>
                      <div className="h-10 rounded-lg border border-[#8B5CF6]/40 bg-[#8B5CF6]/20 flex items-center justify-between px-4 w-[95%] mx-auto">
                        <span className="text-sm text-[#E9D5FF] font-medium">PDF Export - PRD</span>
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full border-2 border-[#C084FC]"></div>
                          <span className="text-xs text-[#E9D5FF]">60%</span>
                        </div>
                      </div>
                    </td>
                    <td className={`p-2 border-r ${tableBorder} relative`}>
                      <div className="absolute top-0 bottom-0 left-1/2 border-l border-dashed border-[#8B5CF6]/30"></div>
                      <div className="h-10 rounded-lg border border-[#10B981]/30 bg-[#052E16]/80 flex items-center justify-between px-4 w-[90%] mx-auto relative z-10">
                        <span className="text-sm text-[#6EE7B7] font-medium">Dark Mode</span>
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full border-2 border-[#10B981]"></div>
                          <span className="text-xs text-[#6EE7B7]">30%</span>
                        </div>
                      </div>
                    </td>
                    <td className="p-2 relative"></td>
                  </tr>

                  {/* Track: Analytics */}
                  <tr>
                    <td className={`p-4 border-r ${tableBorder}`}>
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg bg-[#1E293B] border border-[#334155] text-[#CBD5E1]`}>
                          <BarChart className="w-4 h-4" />
                        </div>
                        <span className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>Analytics</span>
                      </div>
                    </td>
                    <td className={`p-2 border-r ${tableBorder}`}></td>
                    <td className={`p-2 border-r ${tableBorder}`}></td>
                    <td className="p-2 relative" colSpan={2}>
                      <div className="absolute top-0 bottom-0 left-[12.5%] border-l border-dashed border-[#8B5CF6]/30"></div>
                      <div className="h-10 rounded-lg border border-[#F59E0B]/30 bg-[#78350F]/40 flex items-center justify-between px-4 w-[60%] ml-[5%] relative z-10">
                        <span className="text-sm text-[#FCD34D] font-medium">Spending Analytics</span>
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full border-2 border-[#F59E0B]"></div>
                          <span className="text-xs text-[#FCD34D]">20%</span>
                        </div>
                      </div>
                    </td>
                  </tr>

                  {/* Track: Enterprise */}
                  <tr>
                    <td className={`p-4 border-r ${tableBorder}`}>
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg bg-[#1E293B] border border-[#334155] text-[#CBD5E1]`}>
                          <Building className="w-4 h-4" />
                        </div>
                        <span className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>Enterprise</span>
                      </div>
                    </td>
                    <td className={`p-2 border-r ${tableBorder}`}></td>
                    <td className={`p-2 border-r ${tableBorder}`}></td>
                    <td className="p-2 relative" colSpan={2}>
                      <div className="absolute top-0 bottom-0 left-[12.5%] border-l border-dashed border-[#8B5CF6]/30"></div>
                      <div className="h-10 rounded-lg border border-[#D97706]/40 bg-[#D97706]/10 flex items-center justify-between px-4 w-[60%] ml-[30%] relative z-10">
                        <span className="text-sm text-[#FDBA74] font-medium">Bulk Export</span>
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full border-2 border-[#D97706]"></div>
                          <span className="text-xs text-[#FDBA74]">15%</span>
                        </div>
                      </div>
                    </td>
                  </tr>

                </tbody>
              </table>
            </div>

            {/* Legend */}
            <div className={`p-4 border-t ${tableBorder} flex items-center gap-6 justify-center bg-[#0F172A]/50`}>
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full border border-[#64748B]"></div>
                <span className={`text-xs text-[#94A3B8]`}>Not Started</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-[#8B5CF6]"></div>
                <span className={`text-xs text-[#94A3B8]`}>Planning</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-[#3B82F6]"></div>
                <span className={`text-xs text-[#94A3B8]`}>In Progress</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-[#10B981]"></div>
                <span className={`text-xs text-[#94A3B8]`}>In Review</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-[#EF4444]"></div>
                <span className={`text-xs text-[#94A3B8]`}>Completed</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-[#F59E0B]"></div>
                <span className={`text-xs text-[#94A3B8]`}>Upcoming</span>
              </div>
            </div>
          </motion.div>

          {/* Copilot Recommendation Panel */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className={`rounded-2xl border p-6 flex flex-col lg:flex-row gap-8 ${cardBg}`}
          >
            <div className="flex-1 space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-[#8B5CF6]/15 text-[#8B5CF6]">
                  <Sparkles className="w-5 h-5" />
                </div>
                <h3 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Copilot Recommendation</h3>
                <span className="px-2.5 py-1 rounded-md text-[11px] font-medium bg-[#8B5CF6]/10 text-[#8B5CF6] border border-[#8B5CF6]/20">
                  AI Generated
                </span>
              </div>
              
              <div className={`space-y-4 text-sm leading-relaxed text-[#CBD5E1]`}>
                <p>
                  Based on enterprise renewal dates in August and current framework velocity, I recommend shipping{' '}
                  <span className="font-semibold text-[#8B5CF6]">PDF Export before July 31</span> to capture Q3 value and reduce churn risk from{' '}
                  <span className="font-semibold text-[#8B5CF6]">43</span> enterprise accounts.
                </p>
                <p>
                  Shipping <span className="font-semibold text-[#10B981]">Dark Mode</span> in the same sprint adds additional effort and will boost the App Store rating — currently sitting at <span className="font-semibold text-[#8B5CF6]">3.8 stars</span>, primarily dragged down by "too bright" complaints.
                </p>
              </div>
            </div>

            <div className={`lg:w-[400px] flex items-center border-l border-[#2D3748] pl-8 gap-8`}>
              <div className="flex flex-col gap-6 flex-1">
                <div className="flex items-start gap-4">
                  <Star className="w-5 h-5 text-[#8B5CF6] mt-1" />
                  <div>
                    <p className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'} leading-none mb-1`}>3.8</p>
                    <p className={`text-xs text-[#94A3B8]`}>Current App Store<br />Rating</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <Calendar className="w-5 h-5 text-[#8B5CF6] mt-1" />
                  <div>
                    <p className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'} leading-none mb-1`}>Aug 1</p>
                    <p className={`text-xs text-[#94A3B8]`}>Next Enterprise Renewal Wave</p>
                  </div>
                </div>
              </div>
              
              <div className="flex flex-col gap-6 flex-1">
                <div className="flex items-start gap-4">
                  <Users className="w-5 h-5 text-[#8B5CF6] mt-1" />
                  <div>
                    <p className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'} leading-none mb-1`}>43</p>
                    <p className={`text-xs text-[#94A3B8]`}>Enterprise Accounts<br />at Risk</p>
                  </div>
                </div>
                
                <div className="flex items-center justify-center mt-2">
                  <BrainCircuit className="w-16 h-16 text-[#8B5CF6]/30" />
                </div>
              </div>
            </div>
          </motion.div>

        </main>
      </div>
    </div>
  );
};

export default RoadmapPage;

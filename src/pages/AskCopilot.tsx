import React from 'react';
import { motion } from 'framer-motion';
import {
  Sparkles,
  Settings,
  Trash2,
  User,
  MessageSquare,
  Users,
  Bug,
  FileText,
  TrendingUp,
  BrainCircuit,
  Search,
  CheckCircle2,
  ChevronRight,
  Database,
  ArrowRight
} from 'lucide-react';
import { Sidebar } from '../components/Sidebar';
import { TopNavbar } from '../components/TopNavbar';
import { useTheme } from '../context/ThemeContext';

export const AskCopilotPage: React.FC = () => {
  const { isDark } = useTheme();

  const cardBg = isDark
    ? 'bg-[#161B22]/90 border-[#2D3748] shadow-lg shadow-black/20'
    : 'bg-white border-[#E2E8F0] shadow-sm hover:shadow-md';

  const sectionBg = isDark ? 'bg-[#0D1117]/50 border-[#2D3748]' : 'bg-[#F8FAFC] border-[#E2E8F0]';
  const inputBg = isDark ? 'bg-[#0D1117] border-[#2D3748]' : 'bg-white border-[#E2E8F0]';
  const userBubbleBg = isDark ? 'bg-[#2E1065]/30 border-[#4C1D95]/50' : 'bg-[#F3E8FF] border-[#E9D5FF]';
  const aiBubbleBg = isDark ? 'bg-[#161B22]/90 border-[#2D3748]' : 'bg-white border-[#E2E8F0]';

  return (
    <div className="min-h-screen transition-colors duration-200" style={{ backgroundColor: 'var(--bg-base)' }}>
      <Sidebar />
      <div className="ml-60 min-h-screen flex flex-col">
        <TopNavbar />
        <main className="flex-1 pt-20 px-8 pb-12 w-full max-w-screen-2xl mx-auto h-[calc(100vh)] flex flex-col">
          
          {/* Header */}
          <div className="flex items-center justify-between mb-6 shrink-0">
            <div className="flex items-center gap-4">
              <div className="p-2 rounded-lg bg-[#8B5CF6]/15 text-[#8B5CF6] border border-[#8B5CF6]/30">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h1 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'} flex items-center gap-2`}>
                  Ask Copilot — <span className={`text-[#94A3B8] font-normal`}>Module 9 •</span> <span className="text-[#10B981]">RAG Live</span>
                </h1>
                <p className={`text-sm text-[#94A3B8]`}>
                  (8,342 Feedback Items Extended)
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button className={`px-4 py-2 rounded-xl border flex items-center gap-2 text-sm font-medium hover:opacity-80 transition-colors ${isDark ? 'border-[#2D3748] text-[#CBD5E1] bg-[#1E293B]' : 'border-[#E2E8F0] text-[#475569] bg-white'}`}>
                <Settings className="w-4 h-4" />
                Settings
              </button>
              <button className={`px-4 py-2 rounded-xl border flex items-center gap-2 text-sm font-medium hover:opacity-80 transition-colors ${isDark ? 'border-[#2D3748] text-[#CBD5E1] bg-[#1E293B]' : 'border-[#E2E8F0] text-[#475569] bg-white'}`}>
                <Trash2 className="w-4 h-4" />
                Clear Chat
              </button>
            </div>
          </div>

          <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 min-h-0 overflow-hidden">
            
            {/* Left Column - Chat Interface */}
            <div className="lg:col-span-2 flex flex-col h-full gap-4 relative">
              <div className="flex-1 overflow-y-auto pr-2 space-y-6 pb-24 scrollbar-hide">
                
                {/* User Message */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex justify-end gap-4"
                >
                  <div className={`p-4 rounded-2xl rounded-tr-sm border max-w-[80%] ${userBubbleBg}`}>
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`text-xs font-semibold text-[#CBD5E1]`}>You</span>
                      <span className="text-xs text-[#64748B]">• 10:42 AM</span>
                    </div>
                    <p className={`text-sm ${isDark ? 'text-white' : 'text-gray-900'} leading-relaxed`}>
                      What are the top complaints from enterprise customers this quarter?
                    </p>
                  </div>
                  <div className={`w-10 h-10 rounded-full bg-[#1E293B] border border-[#2D3748] flex items-center justify-center shrink-0`}>
                    <User className={`w-5 h-5 text-[#94A3B8]`} />
                  </div>
                </motion.div>

                {/* Copilot Message */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="flex items-start gap-4"
                >
                  <div className="w-10 h-10 rounded-xl bg-[#2E1065]/50 border border-[#4C1D95]/50 flex items-center justify-center shrink-0">
                    <Sparkles className="w-5 h-5 text-[#8B5CF6]" />
                  </div>
                  <div className={`p-6 rounded-2xl rounded-tl-sm border w-full max-w-[90%] ${aiBubbleBg}`}>
                    <div className="flex items-center gap-2 mb-4">
                      <span className={`text-xs font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>Copilot</span>
                      <span className="text-xs text-[#64748B]">• 10:42 AM</span>
                    </div>
                    
                    <p className={`text-sm text-[#CBD5E1] mb-6 leading-relaxed`}>
                      Based on 1,204 feedback items tagged as Enterprise this quarter, here are the top complaints:
                    </p>

                    <div className="space-y-6 mb-6">
                      <div className="flex items-start gap-3">
                        <div className="w-3 h-3 rounded-full bg-[#EF4444] mt-1 shrink-0 shadow-[0_0_8px_rgba(239,68,68,0.4)]"></div>
                        <div>
                          <p className={`text-sm font-bold ${isDark ? 'text-white' : 'text-gray-900'} mb-1`}>
                            Transaction Timeouts <span className={`text-[#94A3B8] font-normal`}>(347 mentions)</span>
                          </p>
                          <p className={`text-sm text-[#94A3B8] leading-relaxed`}>
                            Enterprise users report frequent timeouts during high-volume transactions, especially during month-end.
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <div className="w-3 h-3 rounded-full bg-[#F59E0B] mt-1 shrink-0 shadow-[0_0_8px_rgba(245,158,11,0.4)]"></div>
                        <div>
                          <p className={`text-sm font-bold ${isDark ? 'text-white' : 'text-gray-900'} mb-1`}>
                            No PDF Export <span className={`text-[#94A3B8] font-normal`}>(258 mentions)</span>
                          </p>
                          <p className={`text-sm text-[#94A3B8] leading-relaxed`}>
                            Lack of PDF export for statements and reports is causing manual workarounds and compliance issues.
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <div className="w-3 h-3 rounded-full bg-[#3B82F6] mt-1 shrink-0 shadow-[0_0_8px_rgba(59,130,246,0.4)]"></div>
                        <div>
                          <p className={`text-sm font-bold ${isDark ? 'text-white' : 'text-gray-900'} mb-1`}>
                            Missing role-based permissions <span className={`text-[#94A3B8] font-normal`}>(211 mentions)</span>
                          </p>
                          <p className={`text-sm text-[#94A3B8] leading-relaxed`}>
                            Admins need granular control over user roles and permissions for audit and security compliance.
                          </p>
                        </div>
                      </div>
                    </div>

                    <p className={`text-sm text-[#CBD5E1] mb-6`}>
                      These three account for <span className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>67.8%</span> of all enterprise complaints this quarter.
                    </p>

                    <div className={`flex items-center justify-between pt-4 border-t border-[#2D3748]`}>
                      <div className={`flex items-center gap-2 text-xs text-[#94A3B8]`}>
                        <Database className="w-3.5 h-3.5" />
                        Sources: 1,204 enterprise feedback items • Last synced 2h ago
                      </div>
                      <button className={`px-3 py-1.5 rounded-lg border border-[#2D3748] text-xs text-[#CBD5E1] hover:bg-[#1E293B] flex items-center gap-1 transition-colors`}>
                        View Sources <ChevronRight className="w-3 h-3" />
                      </button>
                    </div>

                  </div>
                </motion.div>
                
              </div>

              {/* Chat Input */}
              <div className="absolute bottom-0 left-0 right-0 pt-4 bg-gradient-to-t from-[var(--bg-base)] via-[var(--bg-base)] to-transparent">
                <div className={`p-2 rounded-2xl border flex items-center gap-3 shadow-lg ${inputBg}`}>
                  <div className={`p-2 rounded-xl text-[#94A3B8]`}>
                    <MessageSquare className="w-5 h-5" />
                  </div>
                  <input
                    type="text"
                    placeholder="Ask about your users, features, or roadmap..."
                    className={`flex-1 bg-transparent border-none outline-none text-sm ${isDark ? 'text-white' : 'text-gray-900'} placeholder-[#64748B]`}
                  />
                  <button className={`px-5 py-2.5 rounded-xl bg-[#6366F1] hover:bg-[#4F46E5] ${isDark ? 'text-white' : 'text-gray-900'} font-medium text-sm flex items-center gap-2 transition-colors`}>
                    Send <Sparkles className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Right Column - Side Panels */}
            <div className="space-y-4 h-full flex flex-col">
              
              {/* Suggested Questions */}
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className={`rounded-2xl border p-5 ${cardBg} shrink-0`}
              >
                <h3 className={`flex items-center gap-2 font-bold ${isDark ? 'text-white' : 'text-gray-900'} mb-4`}>
                  <Sparkles className="w-5 h-5 text-[#8B5CF6]" /> Suggested Questions
                </h3>
                
                <div className="space-y-2">
                  {[
                    { icon: MessageSquare, text: 'What is driving churn this month?', color: 'text-[#8B5CF6]' },
                    { icon: Users, text: 'Summarize feedback from India users', color: 'text-[#3B82F6]' },
                    { icon: Bug, text: 'Which bugs are most critical?', color: 'text-[#EF4444]' },
                    { icon: FileText, text: 'Generate executive summary', color: 'text-[#94A3B8]' },
                    { icon: TrendingUp, text: 'What features have highest demand?', color: 'text-[#8B5CF6]' }
                  ].map((item, idx) => (
                    <button key={idx} className={`w-full flex items-center justify-between p-3 rounded-xl border border-[#2D3748] hover:border-[#475569] hover:bg-[#1E293B]/50 transition-all text-left ${sectionBg}`}>
                      <div className="flex items-center gap-3">
                        <item.icon className={`w-4 h-4 ${item.color}`} />
                        <span className={`text-sm text-[#CBD5E1]`}>{item.text}</span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-[#475569]" />
                    </button>
                  ))}
                </div>
              </motion.div>

              {/* How This Works */}
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className={`rounded-2xl border p-5 ${cardBg} flex-1 overflow-y-auto scrollbar-hide`}
              >
                <h3 className={`flex items-center gap-2 font-bold ${isDark ? 'text-white' : 'text-gray-900'} mb-3`}>
                  <BrainCircuit className="w-5 h-5 text-[#8B5CF6]" /> How This Works
                </h3>
                
                <p className={`text-xs text-[#94A3B8] leading-relaxed mb-6`}>
                  Your question is converted to an embedding, matched against all 8,342 feedback records using vector search, and the most relevant chunks are passed to the AI to generate an accurate, context-aware response.
                </p>

                {/* Flow Diagram */}
                <div className="flex items-center justify-between mb-8 overflow-x-auto pb-2 scrollbar-hide">
                  <div className="flex flex-col items-center gap-2">
                    <div className={`w-12 h-12 rounded-xl border flex items-center justify-center ${sectionBg}`}>
                      <span className="text-[#8B5CF6] font-bold text-lg">?</span>
                    </div>
                    <span className={`text-[10px] text-[#94A3B8] font-medium`}>Your Question</span>
                  </div>
                  
                  <ArrowRight className="w-4 h-4 text-[#475569] shrink-0" />
                  
                  <div className="flex flex-col items-center gap-2">
                    <div className={`w-12 h-12 rounded-xl border flex items-center justify-center ${sectionBg}`}>
                      <BrainCircuit className="w-5 h-5 text-[#8B5CF6]" />
                    </div>
                    <span className={`text-[10px] text-[#94A3B8] font-medium text-center`}>Vector<br/>Embedding</span>
                  </div>

                  <ArrowRight className="w-4 h-4 text-[#475569] shrink-0" />

                  <div className="flex flex-col items-center gap-2">
                    <div className={`w-12 h-12 rounded-xl border border-[#3B82F6]/50 bg-[#3B82F6]/10 flex items-center justify-center`}>
                      <Search className="w-5 h-5 text-[#3B82F6]" />
                    </div>
                    <span className={`text-[10px] text-[#94A3B8] font-medium text-center`}>Vector Search<br/>(8,342 items)</span>
                  </div>

                  <ArrowRight className="w-4 h-4 text-[#475569] shrink-0" />

                  <div className="flex flex-col items-center gap-2">
                    <div className={`w-12 h-12 rounded-xl border border-[#8B5CF6]/50 bg-[#8B5CF6]/10 flex items-center justify-center`}>
                      <Sparkles className="w-5 h-5 text-[#8B5CF6]" />
                    </div>
                    <span className={`text-[10px] text-[#94A3B8] font-medium`}>AI Response</span>
                  </div>
                </div>

                {/* Status Badges */}
                <div className="flex gap-2">
                  <div className="flex-1 p-2 rounded-lg border border-[#10B981]/20 bg-[#052E16]/30 flex flex-col items-center justify-center gap-1">
                    <div className="flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-[#10B981]" />
                      <span className={`text-[11px] font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>RAG</span>
                    </div>
                    <span className="text-[10px] text-[#10B981]">Active</span>
                  </div>
                  <div className="flex-1 p-2 rounded-lg border border-[#10B981]/20 bg-[#052E16]/30 flex flex-col items-center justify-center gap-1">
                    <div className="flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-[#10B981]" />
                      <span className={`text-[11px] font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>Embeddings</span>
                    </div>
                    <span className="text-[10px] text-[#10B981]">Active</span>
                  </div>
                  <div className="flex-1 p-2 rounded-lg border border-[#10B981]/20 bg-[#052E16]/30 flex flex-col items-center justify-center gap-1">
                    <div className="flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-[#10B981]" />
                      <span className={`text-[11px] font-medium ${isDark ? 'text-white' : 'text-gray-900'} flex text-center flex-wrap leading-tight justify-center`}>Vector Search</span>
                    </div>
                    <span className="text-[10px] text-[#10B981]">Active</span>
                  </div>
                </div>

              </motion.div>

            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default AskCopilotPage;

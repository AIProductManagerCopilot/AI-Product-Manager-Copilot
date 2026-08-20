import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
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
import { analyticsService } from '../services/analyticsService';

export const AskCopilotPage: React.FC = () => {
  const { isDark } = useTheme();
  const [messages, setMessages] = useState<Array<{
    id: string;
    sender: 'user' | 'copilot';
    text: string;
    timestamp: string;
    isStreaming?: boolean;
    statusText?: string;
  }>>([
    {
      id: 'welcome',
      sender: 'copilot',
      text: 'Hello! I am your Product Copilot. Ask me anything about customer feedback, feature requests, or product metrics.',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Auto scroll to bottom
  const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
    chatEndRef.current?.scrollIntoView({ behavior, block: 'end' });
  };

  useEffect(() => {
    if (isGenerating) {
      scrollToBottom('auto');
    } else {
      scrollToBottom('smooth');
    }
  }, [messages, isGenerating]);

  const handleSend = async (queryText?: string) => {
    const query = (queryText || inputText).trim();
    if (!query || isGenerating) return;

    if (!queryText) {
      setInputText('');
    }

    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const userMsgId = `user-${Date.now()}`;
    const copilotMsgId = `copilot-${Date.now()}`;

    // 1. Add user message
    setMessages(prev => [
      ...prev,
      { id: userMsgId, sender: 'user', text: query, timestamp }
    ]);

    // 2. Add empty/loading copilot message
    setMessages(prev => [
      ...prev,
      { id: copilotMsgId, sender: 'copilot', text: '', timestamp, isStreaming: true, statusText: 'Analyzing context...' }
    ]);

    setIsGenerating(true);

    try {
      let fullText = '';
      let buffer = '';
      let updateScheduled = false;

      const scheduleStateUpdate = () => {
        if (updateScheduled) return;
        updateScheduled = true;
        requestAnimationFrame(() => {
          setMessages(prev => prev.map(msg => {
            if (msg.id === copilotMsgId) {
              return { ...msg, text: fullText, statusText: undefined };
            }
            return msg;
          }));
          updateScheduled = false;
        });
      };

      await analyticsService.streamCopilotAI(query, (chunk) => {
        buffer += chunk;
        
        // Split by double newline to separate SSE events
        const lines = buffer.split('\n\n');
        buffer = lines.pop() || ''; // keep the last incomplete chunk in buffer

        let textAdded = false;
        for (const line of lines) {
          if (!line.trim()) continue;

          let dataStr = '';
          let hasData = false;

          const partLines = line.split('\n');
          for (const pl of partLines) {
            if (pl.startsWith('data:')) {
              hasData = true;
              // Preserve leading/trailing spaces in streaming tokens
              dataStr = pl.startsWith('data: ') ? pl.substring(6) : pl.substring(5);
            }
          }

          if (hasData) {
            if (dataStr.startsWith('[ERROR]:')) {
              fullText += `\n\n*Error: ${dataStr.replace('[ERROR]:', '').trim()}*`;
              textAdded = true;
            } else if (dataStr.trim().startsWith('{')) {
              try {
                const parsed = JSON.parse(dataStr.trim());
                const delta = parsed.content ?? parsed.delta ?? parsed.text ?? parsed.message ?? parsed.detail ?? '';
                if (delta) {
                  fullText += delta;
                  textAdded = true;
                }
              } catch {
                fullText += dataStr;
                textAdded = true;
              }
            } else {
              fullText += dataStr;
              textAdded = true;
            }
          }
        }

        if (textAdded) {
          scheduleStateUpdate();
        }
      });

      // Final force sync update and cleanup streaming flag when complete
      setMessages(prev => prev.map(msg => {
        if (msg.id === copilotMsgId) {
          return { ...msg, text: fullText, isStreaming: false, statusText: undefined };
        }
        return msg;
      }));

    } catch (err) {
      console.error('Failed to stream AI response:', err);
      setMessages(prev => prev.map(msg => {
        if (msg.id === copilotMsgId) {
          return {
            ...msg,
            text: 'I apologize, but I encountered an error connecting to the AI subsystem.',
            isStreaming: false,
            statusText: undefined
          };
        }
        return msg;
      }));
    } finally {
      setIsGenerating(false);
    }
  };

  const handleClearChat = () => {
    setMessages([
      {
        id: 'welcome',
        sender: 'copilot',
        text: 'Hello! I am your Product Copilot. Ask me anything about customer feedback, feature requests, or product metrics.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      }
    ]);
  };

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
              <button 
                onClick={handleClearChat}
                className={`px-4 py-2 rounded-xl border flex items-center gap-2 text-sm font-medium hover:opacity-80 transition-colors ${isDark ? 'border-[#2D3748] text-[#CBD5E1] bg-[#1E293B]' : 'border-[#E2E8F0] text-[#475569] bg-white'}`}
              >
                <Trash2 className="w-4 h-4" />
                Clear Chat
              </button>
            </div>
          </div>

          <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 min-h-0 overflow-hidden">
            
            {/* Left Column - Chat Interface */}
            <div className="lg:col-span-2 flex flex-col h-full gap-4 relative">
              <div className="flex-1 overflow-y-auto pr-2 space-y-6 pb-24 scrollbar-hide">
                
                {messages.map((msg) => {
                  if (msg.sender === 'user') {
                    return (
                      <motion.div
                        key={msg.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex justify-end gap-4"
                      >
                        <div className={`p-4 rounded-2xl rounded-tr-sm border max-w-[80%] ${userBubbleBg}`}>
                          <div className="flex items-center gap-2 mb-2">
                            <span className={`text-xs font-semibold text-[#CBD5E1]`}>You</span>
                            <span className="text-xs text-[#64748B]">• {msg.timestamp}</span>
                          </div>
                          <p className={`text-sm ${isDark ? 'text-white' : 'text-gray-900'} leading-relaxed`}>
                            {msg.text}
                          </p>
                        </div>
                        <div className={`w-10 h-10 rounded-full bg-[#1E293B] border border-[#2D3748] flex items-center justify-center shrink-0`}>
                          <User className={`w-5 h-5 text-[#94A3B8]`} />
                        </div>
                      </motion.div>
                    );
                  } else {
                    return (
                      <motion.div
                        key={msg.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex items-start gap-4"
                      >
                        <div className="w-10 h-10 rounded-xl bg-[#2E1065]/50 border border-[#4C1D95]/50 flex items-center justify-center shrink-0">
                          <Sparkles className="w-5 h-5 text-[#8B5CF6]" />
                        </div>
                        <div className={`p-6 rounded-2xl rounded-tl-sm border w-full max-w-[90%] ${aiBubbleBg}`}>
                          <div className="flex items-center gap-2 mb-4">
                            <span className={`text-xs font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>Copilot</span>
                            <span className="text-xs text-[#64748B]">• {msg.timestamp}</span>
                          </div>
                          
                          {msg.statusText && (
                            <p className="text-xs text-[#8B5CF6] italic animate-pulse mb-2">{msg.statusText}</p>
                          )}

                          {msg.text ? (
                            <div className="text-sm leading-relaxed text-[#CBD5E1] w-full">
                              <ReactMarkdown
                                remarkPlugins={[remarkGfm]}
                                components={{
                                  h1: ({ children }) => (
                                    <h1 className="text-xl font-bold text-white mt-6 mb-3 border-b border-[#2D3748] pb-2">
                                      {children}
                                    </h1>
                                  ),
                                  h2: ({ children }) => (
                                    <h2 className="text-lg font-bold text-white mt-5 mb-2.5">
                                      {children}
                                    </h2>
                                  ),
                                  h3: ({ children }) => (
                                    <h3 className="text-base font-bold text-[#38BDF8] mt-4 mb-2">
                                      {children}
                                    </h3>
                                  ),
                                  p: ({ children }) => (
                                    <p className="mb-4 leading-relaxed text-[#CBD5E1] text-sm font-normal last:mb-0">
                                      {children}
                                    </p>
                                  ),
                                  strong: ({ children }) => (
                                    <strong className="font-bold text-white">
                                      {children}
                                    </strong>
                                  ),
                                  ul: ({ children }) => (
                                    <ul className="list-disc pl-6 mb-4 space-y-1.5 text-[#CBD5E1] text-sm">{children}</ul>
                                  ),
                                  ol: ({ children }) => (
                                    <ol className="list-decimal pl-6 mb-4 space-y-1.5 text-[#CBD5E1] text-sm">{children}</ol>
                                  ),
                                  li: ({ children }) => (
                                    <li className="leading-relaxed text-[#CBD5E1]">{children}</li>
                                  ),
                                  code: ({ children }) => (
                                    <code className="bg-[#1E293B] text-[#38BDF8] px-1.5 py-0.5 rounded text-xs font-mono border border-[#38BDF8]/20">{children}</code>
                                  ),
                                  pre: ({ children }) => (
                                    <pre className="bg-[#0D1117] border border-[#2D3748] p-4 rounded-xl overflow-x-auto my-4 text-xs text-[#E2E8F0] font-mono shadow-inner">{children}</pre>
                                  ),
                                  table: ({ children }) => (
                                    <div className="overflow-x-auto my-4 border border-[#2D3748] rounded-xl shadow-md">
                                      <table className="min-w-full text-left border-collapse text-xs">{children}</table>
                                    </div>
                                  ),
                                  thead: ({ children }) => (
                                    <thead className="bg-[#1E293B] text-white font-bold border-b border-[#2D3748]">{children}</thead>
                                  ),
                                  tbody: ({ children }) => (
                                    <tbody className="divide-y divide-[#2D3748]/60 bg-[#161B22]/60">{children}</tbody>
                                  ),
                                  th: ({ children }) => (
                                    <th className="px-4 py-2.5 font-bold text-[#F8FAFC] tracking-wider border-b border-[#2D3748]">{children}</th>
                                  ),
                                  td: ({ children }) => (
                                    <td className="px-4 py-2.5 text-[#CBD5E1] leading-relaxed border-b border-[#2D3748]/50">{children}</td>
                                  ),
                                  blockquote: ({ children }) => (
                                    <div className="my-4 p-4 rounded-xl bg-[#1E293B]/60 border-l-4 border-[#8B5CF6] text-sm text-[#F1F5F9] font-medium shadow-sm">
                                      {children}
                                    </div>
                                  ),
                                }}
                              >
                                {msg.text}
                              </ReactMarkdown>
                            </div>
                          ) : (
                            msg.isStreaming && !msg.statusText && <p className="text-sm text-[#94A3B8] italic">Thinking...</p>
                          )}

                          <div className={`flex items-center justify-between pt-4 border-t border-[#2D3748] mt-4`}>
                            <div className={`flex items-center gap-2 text-xs text-[#94A3B8]`}>
                              <Database className="w-3.5 h-3.5" />
                              Sources: Vector search context • Live sync active
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    );
                  }
                })}

                <div ref={chatEndRef} />
              </div>

              {/* Chat Input */}
              <div className="absolute bottom-0 left-0 right-0 pt-4 bg-gradient-to-t from-[var(--bg-base)] via-[var(--bg-base)] to-transparent">
                <form 
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSend();
                  }}
                  className={`p-2 rounded-2xl border flex items-center gap-3 shadow-lg ${inputBg}`}
                >
                  <div className={`p-2 rounded-xl text-[#94A3B8]`}>
                    <MessageSquare className="w-5 h-5" />
                  </div>
                  <input
                    type="text"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    disabled={isGenerating}
                    placeholder="Ask about your users, features, or roadmap..."
                    className={`flex-1 bg-transparent border-none outline-none text-sm ${isDark ? 'text-white' : 'text-gray-900'} placeholder-[#64748B]`}
                  />
                  <button 
                    type="submit"
                    disabled={isGenerating || !inputText.trim()}
                    className={`px-5 py-2.5 rounded-xl bg-[#6366F1] hover:bg-[#4F46E5] disabled:opacity-50 disabled:cursor-not-allowed ${isDark ? 'text-white' : 'text-gray-900'} font-medium text-sm flex items-center gap-2 transition-colors`}
                  >
                    Send <Sparkles className="w-3.5 h-3.5" />
                  </button>
                </form>
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
                    <button 
                      key={idx} 
                      onClick={() => handleSend(item.text)}
                      disabled={isGenerating}
                      className={`w-full flex items-center justify-between p-3 rounded-xl border border-[#2D3748] hover:border-[#475569] hover:bg-[#1E293B]/50 transition-all text-left disabled:opacity-50 ${sectionBg}`}
                    >
                      <div className="flex items-center gap-3">
                        <item.icon className={`w-4 h-4 ${item.color}`} />
                        <span className={`text-sm ${isDark ? 'text-[#CBD5E1]' : 'text-slate-700'}`}>{item.text}</span>
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

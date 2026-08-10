import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
  X,
  Copy,
  CheckSquare,
} from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import { Sidebar } from '../components/Sidebar';
import { TopNavbar } from '../components/TopNavbar';
import { useTheme } from '../context/ThemeContext';
import { analyticsService, type BackendCluster } from '../services/analyticsService';

// ─── Inline Markdown Formatter Component ───────────────────────────────────────

const MarkdownRenderer: React.FC<{ text: string }> = ({ text }) => {
  const { isDark } = useTheme();
  const lines = text.split('\n');

  const renderBoldText = (rawText: string) => {
    const parts = rawText.split(/\*\*([^*]+)\*\*/g);
    return parts.map((part, index) => {
      if (index % 2 === 1) {
        return (
          <strong key={index} className="font-extrabold" style={{ color: 'var(--text-primary)' }}>
            {part}
          </strong>
        );
      }
      return part;
    });
  };

  return (
    <div className="space-y-4 font-sans text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
      {lines.map((line, idx) => {
        const trimmed = line.trim();

        // Headers
        if (trimmed.startsWith('# ')) {
          return (
            <h1
              key={idx}
              className={`text-2xl font-extrabold font-display border-b pb-2 ${
                isDark ? 'text-white border-[#2D3748]' : 'text-gray-900 border-[#E2E8F0]'
              } mt-6 mb-3`}
            >
              {trimmed.replace('# ', '')}
            </h1>
          );
        }
        if (trimmed.startsWith('## ')) {
          return (
            <h2
              key={idx}
              className={`text-xl font-bold font-display ${
                isDark ? 'text-[#8B5CF6]' : 'text-[#6366F1]'
              } mt-5 mb-2`}
            >
              {trimmed.replace('## ', '')}
            </h2>
          );
        }
        if (trimmed.startsWith('### ')) {
          return (
            <h3
              key={idx}
              className={`text-lg font-bold font-display ${
                isDark ? 'text-white' : 'text-gray-900'
              } mt-4 mb-2`}
            >
              {trimmed.replace('### ', '')}
            </h3>
          );
        }
        if (trimmed.startsWith('#### ')) {
          return (
            <h4
              key={idx}
              className="text-base font-bold mt-3 mb-1"
              style={{ color: 'var(--text-primary)' }}
            >
              {trimmed.replace('#### ', '')}
            </h4>
          );
        }

        // Bullet lists
        if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
          const content = trimmed.substring(2);
          return (
            <li key={idx} className="ml-5 list-disc pl-1 mb-1">
              {renderBoldText(content)}
            </li>
          );
        }

        // Ordered lists
        if (/^\d+\.\s/.test(trimmed)) {
          const content = trimmed.replace(/^\d+\.\s/, '');
          return (
            <li key={idx} className="ml-5 list-decimal pl-1 mb-1">
              {renderBoldText(content)}
            </li>
          );
        }

        // Empty line
        if (!trimmed) {
          return <div key={idx} className="h-2" />;
        }

        // Standard Paragraph
        return (
          <p key={idx} className="mb-2">
            {renderBoldText(trimmed)}
          </p>
        );
      })}
    </div>
  );
};

export const PRDGeneratorPage: React.FC = () => {
  const { isDark } = useTheme();

  // State Variables
  const [backendClusters, setBackendClusters] = useState<BackendCluster[]>([]);
  const [selectedCluster, setSelectedCluster] = useState<BackendCluster | null>(null);
  const [framework, setFramework] = useState('Standard PRD (Agile)');
  const [notes, setNotes] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedPRD, setGeneratedPRD] = useState('');
  const [isLiveConnected, setIsLiveConnected] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  // Load backend clusters on mount
  useEffect(() => {
    async function loadClusters() {
      try {
        const clusters = await analyticsService.getThemeClusters();
        if (Array.isArray(clusters) && clusters.length > 0) {
          setBackendClusters(clusters);
          setSelectedCluster(clusters[0]);
          setIsLiveConnected(true);
        }
      } catch (err) {
        console.error('Failed to load database themes for PRD selection dropdown:', err);
      }
    }
    loadClusters();
  }, []);

  // Generate PRD Handler
  const handleGenerate = async () => {
    if (!selectedCluster) {
      toast.error('Please select a feature theme first.');
      return;
    }

    setIsGenerating(true);
    setGeneratedPRD('');
    
    const themeName = selectedCluster.category || selectedCluster.name || selectedCluster.theme || 'Selected Feature';
    const category = selectedCluster.category || '';

    try {
      await analyticsService.streamPRDGeneration(
        {
          feature_name: themeName,
          user_query: notes || `Focus on resolving primary pain points using ${framework} framework.`,
          category_filter: category || undefined,
          limit: 5,
        },
        (chunk) => {
          setGeneratedPRD((prev) => prev + chunk);
        }
      );
    } catch (err) {
      console.error('Failed to stream generated PRD spec:', err);
      toast.error('Failed to communicate with AI Copilot pipeline.');
    } finally {
      setIsGenerating(false);
    }
  };

  // Copy to Clipboard
  const handleCopy = () => {
    if (!generatedPRD) return;
    navigator.clipboard.writeText(generatedPRD);
    setIsCopied(true);
    toast.success('PRD copied to clipboard! 📋', {
      style: {
        background: isDark ? '#161B22' : '#ffffff',
        color: isDark ? '#F8FAFC' : '#0F172A',
        border: `1px solid ${isDark ? '#2D3748' : '#E2E8F0'}`,
      },
    });
    setTimeout(() => setIsCopied(false), 2000);
  };

  // Download Markdown file
  const handleDownload = () => {
    if (!generatedPRD) return;
    const blob = new Blob([generatedPRD], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${(selectedCluster?.category || 'prd').toLowerCase().replace(/\s+/g, '-')}-spec.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const cardBg = isDark
    ? 'bg-[#161B22]/90 border-[#2D3748] shadow-lg shadow-black/20'
    : 'bg-white border-[#E2E8F0] shadow-sm hover:shadow-md';

  const sectionBg = isDark ? 'bg-[#0D1117]/50 border-[#2D3748]' : 'bg-[#F8FAFC] border-[#E2E8F0]';

  // Dynamic values based on selected cluster
  const feedbackCount = selectedCluster
    ? (selectedCluster.total_volume ?? selectedCluster.mentions ?? selectedCluster.count ?? 12)
    : 612;
  const usersImpacted = Math.round(feedbackCount * 18.5) || 14203;
  const enterpriseAccounts = Math.max(1, Math.round(feedbackCount * 0.12)) || 43;

  return (
    <div className="min-h-screen transition-colors duration-200" style={{ backgroundColor: 'var(--bg-base)' }}>
      <Toaster position="top-right" />
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
                className={`rounded-2xl border p-8 min-h-[600px] flex flex-col justify-between ${cardBg}`}
              >
                <div>
                  {/* Header */}
                  <div className="flex items-start justify-between pb-6 border-b border-[#2D3748]/30">
                    <div className="flex items-center gap-4">
                      <div className="p-3 rounded-xl bg-[#8B5CF6]/15 border border-[#8B5CF6]/30 text-[#8B5CF6]">
                        <FileText className="w-8 h-8" />
                      </div>
                      <div>
                        <h1 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'} mb-1`}>
                          {selectedCluster
                            ? selectedCluster.category || selectedCluster.name || selectedCluster.theme
                            : 'PDF Statement Export'}
                        </h1>
                        <p className="text-sm text-[#94A3B8]">
                          {selectedCluster ? 'FastAPI RAG active' : 'Template Mock Spec'} • Based on {feedbackCount} feedback items
                        </p>
                      </div>
                    </div>

                    {generatedPRD && (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={handleCopy}
                          className={`p-2.5 rounded-xl border border-[#2D3748] ${
                            isDark ? 'text-white hover:bg-[#1e2530]' : 'text-gray-900 hover:bg-slate-100'
                          } transition-colors`}
                          title="Copy Markdown"
                        >
                          {isCopied ? <CheckSquare className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                        </button>
                        <button
                          onClick={handleDownload}
                          className={`px-4 py-2 rounded-xl border border-[#2D3748] ${
                            isDark ? 'text-white hover:bg-[#1e2530]' : 'text-gray-900 hover:bg-slate-100'
                          } flex items-center gap-2 transition-colors`}
                        >
                          <Download className="w-4 h-4" />
                          <span>Export Markdown</span>
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Body Content */}
                  <div className="py-6 min-h-[450px]">
                    {generatedPRD ? (
                      <div className="relative">
                        <MarkdownRenderer text={generatedPRD} />
                        {isGenerating && (
                          <div className="flex items-center gap-2 mt-4 text-[#8B5CF6] text-xs font-semibold animate-pulse">
                            <Sparkles className="w-4 h-4 animate-spin" />
                            Streaming specification document...
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-10">
                        {/* 1. Problem Statement */}
                        <section>
                          <h2 className="flex items-center gap-2 text-lg font-bold text-[#8B5CF6] mb-3">
                            <ClipboardList className="w-5 h-5" /> 1. Problem Statement
                          </h2>
                          <p className={`${isDark ? 'text-[#CBD5E1]' : 'text-slate-700'} text-sm leading-relaxed`}>
                            Select a theme/cluster from the right sidebar and click **Generate with AI** to construct a real-time, RAG-grounded PRD specification derived directly from customer feedback logs.
                          </p>
                        </section>

                        {/* 2. Mock Template Preview */}
                        <section className="opacity-40 select-none pointer-events-none">
                          <h2 className="flex items-center gap-2 text-lg font-bold text-[#8B5CF6] mb-4">
                            <Target className="w-5 h-5" /> 2. Goals
                          </h2>
                          <div className="rounded-xl border border-[#2D3748] overflow-hidden">
                            <div className="grid grid-cols-2 divide-x divide-[#2D3748] border-b border-[#2D3748]">
                              <div className="p-3 text-sm flex items-center gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-[#8B5CF6]"></div>
                                Enable users to export transaction history as PDF
                              </div>
                              <div className="p-3 text-sm text-[#94A3B8]">Improve user convenience</div>
                            </div>
                            <div className="grid grid-cols-2 divide-x divide-[#2D3748]">
                              <div className="p-3 text-sm flex items-center gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-[#8B5CF6]"></div>
                                Reduce support tickets related to statement requests
                              </div>
                              <div className="p-3 text-sm text-[#94A3B8]">Decrease by 40%</div>
                            </div>
                          </div>
                        </section>
                      </div>
                    )}
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
                      <p className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'} leading-none`}>
                        {feedbackCount}
                      </p>
                      <p className="text-[11px] text-[#94A3B8] mt-1">Feedback Items Analyzed</p>
                    </div>
                  </div>

                  <div className={`p-4 rounded-xl border flex items-center gap-4 ${sectionBg}`}>
                    <div className="p-2.5 rounded-lg bg-[#3B82F6]/15 text-[#3B82F6]">
                      <Users className="w-5 h-5" />
                    </div>
                    <div>
                      <p className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'} leading-none`}>
                        {usersImpacted.toLocaleString()}
                      </p>
                      <p className="text-[11px] text-[#94A3B8] mt-1">Users Impacted</p>
                    </div>
                  </div>

                  <div className={`p-4 rounded-xl border flex items-center gap-4 ${sectionBg}`}>
                    <div className="p-2.5 rounded-lg bg-[#10B981]/15 text-[#10B981]">
                      <Building2 className="w-5 h-5" />
                    </div>
                    <div>
                      <p className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'} leading-none`}>
                        {enterpriseAccounts}
                      </p>
                      <p className="text-[11px] text-[#94A3B8] mt-1">Enterprise Accounts Risked</p>
                    </div>
                  </div>

                  <div className={`p-4 rounded-xl border flex items-center gap-4 ${sectionBg}`}>
                    <div className="p-2.5 rounded-lg bg-[#F59E0B]/15 text-[#F59E0B]">
                      <Clock className="w-5 h-5" />
                    </div>
                    <div>
                      <p className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'} leading-none`}>
                        Saves ~18h
                      </p>
                      <p className="text-[11px] text-[#94A3B8] mt-1">Productivity Time Saved</p>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Generate New PRD Panel */}
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className={`rounded-2xl border p-6 relative ${cardBg}`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="w-5 h-5 text-[#8B5CF6]" />
                  <h3 className={`font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Generate New PRD</h3>
                </div>
                <p className="text-[11px] text-[#94A3B8] mb-6">
                  Select a theme cluster populated from live database logs.
                </p>

                <div className="space-y-4">
                  {/* Select Theme Dropdown */}
                  <div className="relative">
                    <label className="block text-[11px] font-medium text-[#94A3B8] mb-1.5">
                      Select Feature / Theme
                    </label>
                    <button
                      onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-lg border text-sm text-left ${
                        isDark ? 'text-white border-[#2D3748]' : 'text-gray-900 border-[#E2E8F0]'
                      } ${sectionBg}`}
                    >
                      <span>
                        {selectedCluster
                          ? selectedCluster.category || selectedCluster.name || selectedCluster.theme
                          : 'Select Theme'}
                      </span>
                      <ChevronDown className="w-4 h-4 text-[#64748B]" />
                    </button>

                    <AnimatePresence>
                      {isDropdownOpen && (
                        <motion.div
                          initial={{ opacity: 0, y: 5 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 5 }}
                          className={`absolute z-10 w-full mt-1 border rounded-lg shadow-xl max-h-48 overflow-y-auto ${
                            isDark ? 'bg-[#161B22] border-[#2D3748]' : 'bg-white border-[#E2E8F0]'
                          }`}
                        >
                          {backendClusters.map((c, i) => {
                            const name = c.category || c.name || c.theme || `Theme Cluster #${i + 1}`;
                            return (
                              <button
                                key={i}
                                onClick={() => {
                                  setSelectedCluster(c);
                                  setIsDropdownOpen(false);
                                }}
                                className={`w-full text-left px-3.5 py-2.5 text-xs transition-colors border-b last:border-b-0 ${
                                  isDark
                                    ? 'hover:bg-[#1e2530] text-[#CBD5E1] border-[#2D3748]'
                                    : 'hover:bg-slate-50 text-slate-700 border-[#E2E8F0]'
                                }`}
                              >
                                {name} ({c.total_volume || c.count || 0} reviews)
                              </button>
                            );
                          })}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Choose Framework */}
                  <div>
                    <label className="block text-[11px] font-medium text-[#94A3B8] mb-1.5">
                      Choose Framework
                    </label>
                    <select
                      value={framework}
                      onChange={(e) => setFramework(e.target.value)}
                      className={`w-full px-3 py-2 rounded-lg border text-sm outline-none ${
                        isDark
                          ? 'text-white border-[#2D3748] bg-[#0D1117]'
                          : 'text-gray-900 border-[#E2E8F0] bg-white'
                      }`}
                    >
                      <option value="Standard PRD (Agile)">Standard PRD (Agile)</option>
                      <option value="Job-To-Be-Done (JTBD)">Job-To-Be-Done (JTBD)</option>
                      <option value="Working Backwards (PR/FAQ)">Working Backwards (PR/FAQ)</option>
                    </select>
                  </div>

                  {/* Context / Additional Notes */}
                  <div>
                    <label className="block text-[11px] font-medium text-[#94A3B8] mb-1.5">
                      Context / Additional Notes (Optional)
                    </label>
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className={`w-full p-3 rounded-lg border text-sm ${
                        isDark ? 'text-white' : 'text-gray-900'
                      } placeholder-[#475569] resize-none h-24 outline-none focus:border-[#8B5CF6]/50 ${sectionBg}`}
                      placeholder="e.g., Focus on accessibility, password masking, SSO fallback..."
                    ></textarea>
                  </div>

                  {/* Generate Button */}
                  <button
                    onClick={handleGenerate}
                    disabled={isGenerating || !selectedCluster}
                    className={`w-full py-2.5 rounded-xl font-bold bg-gradient-to-r from-[#3B82F6] to-[#8B5CF6] text-white flex items-center justify-center gap-2 hover:opacity-90 transition-all shadow-lg shadow-[#8B5CF6]/20 cursor-pointer disabled:opacity-50`}
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>{isGenerating ? 'Generating...' : 'Generate with AI'}</span>
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

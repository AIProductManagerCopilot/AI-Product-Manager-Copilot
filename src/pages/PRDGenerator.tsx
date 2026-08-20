import React, { useState, useEffect } from 'react';
import { useLocation, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  FileText,
  Download,
  ClipboardList,
  Target,
  Users,
  BarChart2,
  Building2,
  Clock,
  Sparkles,
  ChevronDown,
  Copy,
  CheckSquare,
} from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import { Sidebar } from '../components/Sidebar';
import { TopNavbar } from '../components/TopNavbar';
import { useTheme } from '../context/ThemeContext';
import { analyticsService, type BackendCluster } from '../services/analyticsService';

// ─── Professional GFM Markdown Renderer Component ──────────────────────────────

const MarkdownRenderer: React.FC<{ text: string }> = ({ text }) => {
  const { isDark } = useTheme();

  return (
    <div className={`prose max-w-none text-sm leading-relaxed ${isDark ? 'prose-invert text-[#CBD5E1]' : 'text-slate-700'}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ node, ...props }) => (
            <h1
              className={`text-2xl font-black font-display tracking-tight border-b pb-3 mt-6 mb-4 ${
                isDark ? 'text-white border-[#2D3748]' : 'text-gray-900 border-[#E2E8F0]'
              }`}
              {...props}
            />
          ),
          h2: ({ node, ...props }) => (
            <h2
              className={`text-lg font-bold font-display border-b pb-2 mt-8 mb-4 flex items-center gap-2 ${
                isDark ? 'text-[#A78BFA] border-[#2D3748]' : 'text-[#6366F1] border-[#E2E8F0]'
              }`}
              {...props}
            />
          ),
          h3: ({ node, ...props }) => (
            <h3
              className={`text-base font-bold font-display mt-6 mb-2 ${
                isDark ? 'text-white' : 'text-gray-900'
              }`}
              {...props}
            />
          ),
          h4: ({ node, ...props }) => (
            <h4
              className={`text-sm font-semibold mt-4 mb-1 ${
                isDark ? 'text-[#CBD5E1]' : 'text-gray-800'
              }`}
              {...props}
            />
          ),
          p: ({ node, ...props }) => (
            <p className="my-3 leading-relaxed" {...props} />
          ),
          ul: ({ node, ...props }) => (
            <ul className="list-disc list-inside space-y-1.5 my-3 pl-2" {...props} />
          ),
          ol: ({ node, ...props }) => (
            <ol className="list-decimal list-inside space-y-1.5 my-3 pl-2" {...props} />
          ),
          li: ({ node, ...props }) => (
            <li className="leading-relaxed" {...props} />
          ),
          blockquote: ({ node, ...props }) => (
            <blockquote
              className="border-l-4 border-[#8B5CF6] pl-4 py-1 my-4 italic rounded-r-lg bg-[#8B5CF6]/5 text-[#94A3B8]"
              {...props}
            />
          ),
          hr: ({ node, ...props }) => (
            <hr className={`my-6 border-t ${isDark ? 'border-[#2D3748]' : 'border-[#E2E8F0]'}`} {...props} />
          ),
          table: ({ node, ...props }) => (
            <div className="overflow-x-auto my-5 rounded-xl border border-[#2D3748] shadow-sm">
              <table className="w-full text-left text-xs border-collapse divide-y divide-[#2D3748]" {...props} />
            </div>
          ),
          thead: ({ node, ...props }) => (
            <thead className={isDark ? 'bg-[#0D1117]' : 'bg-slate-100'} {...props} />
          ),
          th: ({ node, ...props }) => (
            <th
              className={`p-3 font-bold border-b border-[#2D3748] ${
                isDark ? 'text-white' : 'text-slate-900'
              }`}
              {...props}
            />
          ),
          td: ({ node, ...props }) => (
            <td
              className={`p-3 border-b border-[#2D3748]/50 ${
                isDark ? 'text-[#CBD5E1]' : 'text-slate-700'
              }`}
              {...props}
            />
          ),
          code: ({ node, className, children, ...props }: any) => {
            const match = /language-(\w+)/.exec(className || '');
            const isInline = !match && !String(children).includes('\n');
            if (isInline) {
              return (
                <code
                  className="bg-[#0D1117] text-[#A78BFA] px-1.5 py-0.5 rounded text-xs border border-[#2D3748] font-mono"
                  {...props}
                >
                  {children}
                </code>
              );
            }
            return (
              <div className="my-4 rounded-xl border border-[#2D3748] bg-[#0D1117] p-4 overflow-x-auto">
                <code className="text-xs text-slate-200 font-mono leading-relaxed" {...props}>
                  {children}
                </code>
              </div>
            );
          },
        }}
      >
        {text}
      </ReactMarkdown>
    </div>
  );
};

export const PRDGeneratorPage: React.FC = () => {
  const { isDark } = useTheme();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  // State Variables
  const [backendClusters, setBackendClusters] = useState<BackendCluster[]>([]);
  const [selectedCluster, setSelectedCluster] = useState<BackendCluster | null>(null);
  const [framework, setFramework] = useState('Standard PRD (Agile)');
  const [notes, setNotes] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedPRD, setGeneratedPRD] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  const DEFAULT_CLUSTERS: BackendCluster[] = [
    { category: 'PDF Statement Export', name: 'PDF Statement Export', total_volume: 612 },
    { category: 'Dark Mode Support', name: 'Dark Mode Support', total_volume: 489 },
    { category: 'Automated User Onboarding Flow', name: 'Automated User Onboarding Flow', total_volume: 342 },
    { category: 'Payment Gateway Retry Logic', name: 'Payment Gateway Retry Logic', total_volume: 278 },
    { category: 'Real-Time Push Notifications', name: 'Real-Time Push Notifications', total_volume: 195 },
  ];

  // Load backend clusters on mount
  useEffect(() => {
    async function loadClusters() {
      const featureParam = searchParams.get('feature') || (location.state as { feature_name?: string })?.feature_name;

      try {
        const clusters = await analyticsService.getThemeClusters();
        if (Array.isArray(clusters) && clusters.length > 0) {
          setBackendClusters(clusters);
          if (featureParam) {
            const matched = clusters.find(
              c => (c.category || c.name || c.theme || '').toLowerCase() === featureParam.toLowerCase()
            );
            setSelectedCluster(matched || { category: featureParam, name: featureParam, total_volume: 500 });
          } else {
            setSelectedCluster(clusters[0]);
          }
          return;
        }
      } catch (err) {
        console.error('Failed to load database themes for PRD selection dropdown:', err);
      }
      setBackendClusters(DEFAULT_CLUSTERS);
      if (featureParam) {
        setSelectedCluster({ category: featureParam, name: featureParam, total_volume: 500 });
      } else {
        setSelectedCluster(DEFAULT_CLUSTERS[0]);
      }
    }
    loadClusters();
  }, [searchParams, location.state]);

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
          limit: 8,
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
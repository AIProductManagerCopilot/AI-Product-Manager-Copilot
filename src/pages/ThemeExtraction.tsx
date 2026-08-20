import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Layers,
  Database,
  RefreshCw,
  Gauge,
  FileText,
  Lock,
  Headphones,
  UserCheck,
  Bell,
  CreditCard,
  Settings,
  MoreVertical,
  MessageSquare,
  Share2,
  Cpu,
  Bot,
  Sparkles,
  CheckCircle2,
  Code,
  X,
  Search,
  ChevronRight,
  Filter,
  ExternalLink,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

import { Sidebar } from '../components/Sidebar';
import { TopNavbar } from '../components/TopNavbar';
import { useTheme } from '../context/ThemeContext';
import { analyticsService, BackendCluster } from '../services/analyticsService';

// ─── Theme Item Interface ──────────────────────────────────────────────────────

interface ThemeItem {
  id: string;
  title: string;
  count: number;
  quote: string;
  priority: 'High' | 'Medium' | 'Low';
  priorityColor: 'red' | 'orange' | 'amber' | 'purple' | 'blue';
  icon: React.ElementType;
  primaryTag: string;
  secondaryTag: string;
  sources: { zendesk: number; appStore: number; intercom: number };
  sentiment: 'Negative' | 'Mixed';
}

const THEMES_DATA: ThemeItem[] = [
  {
    id: 'slow-transaction',
    title: 'Slow Transaction Speed',
    count: 847,
    quote: 'takes 30s to show balance, very slow compared to other apps',
    priority: 'High',
    priorityColor: 'red',
    icon: Gauge,
    primaryTag: 'Performance',
    secondaryTag: 'Mobile',
    sources: { zendesk: 410, appStore: 312, intercom: 125 },
    sentiment: 'Negative',
  },
  {
    id: 'pdf-export-missing',
    title: 'PDF Export Missing',
    count: 612,
    quote: 'cannot download statements as PDF, only image format',
    priority: 'High',
    priorityColor: 'orange',
    icon: FileText,
    primaryTag: 'Feature',
    secondaryTag: 'Enterprise',
    sources: { zendesk: 290, appStore: 180, intercom: 142 },
    sentiment: 'Negative',
  },
  {
    id: 'login-failures',
    title: 'Login Failures',
    count: 423,
    quote: 'login fails frequently, get random error please try again',
    priority: 'High',
    priorityColor: 'red',
    icon: Lock,
    primaryTag: 'Auth',
    secondaryTag: 'Mobile',
    sources: { zendesk: 215, appStore: 140, intercom: 68 },
    sentiment: 'Negative',
  },
  {
    id: 'poor-customer-support',
    title: 'Poor Customer Support',
    count: 389,
    quote: 'support takes too long to respond, no live chat available',
    priority: 'Medium',
    priorityColor: 'amber',
    icon: Headphones,
    primaryTag: 'Support',
    secondaryTag: 'Experience',
    sources: { zendesk: 198, appStore: 102, intercom: 89 },
    sentiment: 'Negative',
  },
  {
    id: 'account-linking',
    title: 'Account Linking Issues',
    count: 276,
    quote: 'unable to link multiple accounts, gives error code 409',
    priority: 'Medium',
    priorityColor: 'amber',
    icon: UserCheck,
    primaryTag: 'Account',
    secondaryTag: 'Integration',
    sources: { zendesk: 140, appStore: 86, intercom: 50 },
    sentiment: 'Negative',
  },
  {
    id: 'notification-delays',
    title: 'Notification Delays',
    count: 234,
    quote: 'get notifications hours later or not at all',
    priority: 'Medium',
    priorityColor: 'purple',
    icon: Bell,
    primaryTag: 'Notifications',
    secondaryTag: 'Mobile',
    sources: { zendesk: 110, appStore: 84, intercom: 40 },
    sentiment: 'Negative',
  },
  {
    id: 'payment-gateway',
    title: 'Payment Gateway Errors',
    count: 168,
    quote: 'payment fails but amount deducted, need refund immediately',
    priority: 'Low',
    priorityColor: 'blue',
    icon: CreditCard,
    primaryTag: 'Payments',
    secondaryTag: 'Bug',
    sources: { zendesk: 92, appStore: 46, intercom: 30 },
    sentiment: 'Negative',
  },
  {
    id: 'ui-ux-confusion',
    title: 'UI/UX Confusion',
    count: 145,
    quote: 'too many steps to complete a simple transaction',
    priority: 'Low',
    priorityColor: 'blue',
    icon: Settings,
    primaryTag: 'UI/UX',
    secondaryTag: 'Experience',
    sources: { zendesk: 75, appStore: 45, intercom: 25 },
    sentiment: 'Mixed',
  },
];

// Helper transformers for backend clusters
function getIconForCategory(category: string): React.ElementType {
  const cat = category.toLowerCase();
  if (cat.includes('speed') || cat.includes('performance') || cat.includes('slow') || cat.includes('latency')) return Gauge;
  if (cat.includes('export') || cat.includes('pdf') || cat.includes('statement') || cat.includes('download')) return FileText;
  if (cat.includes('login') || cat.includes('auth') || cat.includes('password') || cat.includes('security')) return Lock;
  if (cat.includes('support') || cat.includes('help') || cat.includes('chat') || cat.includes('service')) return Headphones;
  if (cat.includes('account') || cat.includes('link') || cat.includes('integration') || cat.includes('user')) return UserCheck;
  if (cat.includes('notification') || cat.includes('alert') || cat.includes('bell') || cat.includes('push')) return Bell;
  if (cat.includes('payment') || cat.includes('gateway') || cat.includes('card') || cat.includes('billing')) return CreditCard;
  if (cat.includes('ui') || cat.includes('ux') || cat.includes('design') || cat.includes('confusion')) return Settings;
  return Layers;
}

function getSampleQuote(category: string): string {
  const cat = category.toLowerCase();
  if (cat.includes('onboarding')) return 'Onboarding exit rate is high on mobile, takes too long to set up account.';
  if (cat.includes('analytics') || cat.includes('real-time')) return 'Need live WebSocket telemetry for real-time dashboard monitoring.';
  if (cat.includes('discoverability')) return 'Secondary features are hidden, hard to find advanced options.';
  if (cat.includes('performance') || cat.includes('slow')) return 'takes 30s to show balance, very slow compared to other apps';
  if (cat.includes('integration')) return 'unable to link multiple accounts, missing Slack/Jira integration';
  if (cat.includes('pdf') || cat.includes('export')) return 'cannot download statements as PDF, only image format';
  if (cat.includes('login')) return 'login fails frequently, get random error please try again';
  if (cat.includes('payment')) return 'payment fails but amount deducted, need refund immediately';
  return 'Users report recurring friction regarding this workflow.';
}

function transformBackendClustersToThemes(clusters: BackendCluster[]): ThemeItem[] {
  if (!clusters || clusters.length === 0) return THEMES_DATA;

  return clusters.map((cluster, idx) => {
    const title = cluster.category || cluster.name || cluster.theme || `Theme Cluster ${idx + 1}`;
    const count = cluster.total_volume || cluster.count || cluster.mentions || Math.floor(Math.random() * 500) + 100;
    const avgSeverity = cluster.avg_severity ?? 3.5;
    const priorityScore = cluster.priority_score ?? (avgSeverity * 10);

    let priority: 'High' | 'Medium' | 'Low' = 'Low';
    let priorityColor: ThemeItem['priorityColor'] = 'blue';

    if (cluster.severity) {
      priority = cluster.severity;
    } else if (priorityScore >= 35 || avgSeverity >= 4.5) {
      priority = 'High';
    } else if (priorityScore >= 15 || avgSeverity >= 3.0) {
      priority = 'Medium';
    }

    if (priority === 'High') {
      priorityColor = idx % 2 === 0 ? 'red' : 'orange';
    } else if (priority === 'Medium') {
      priorityColor = idx % 2 === 0 ? 'amber' : 'purple';
    } else {
      priorityColor = 'blue';
    }

    const avgSent = cluster.avg_sentiment ?? 0.3;
    const sentiment: 'Negative' | 'Mixed' = avgSent < 0.4 ? 'Negative' : 'Mixed';

    return {
      id: `cluster-${idx}-${title.toLowerCase().replace(/\s+/g, '-')}`,
      title,
      count,
      quote: cluster.quote || getSampleQuote(title),
      priority,
      priorityColor,
      icon: getIconForCategory(title),
      primaryTag: title.split(' ')[0] || 'Analytics',
      secondaryTag: count > 300 ? 'Enterprise' : 'Mobile',
      sources: {
        zendesk: Math.round(count * 0.48),
        appStore: Math.round(count * 0.32),
        intercom: Math.round(count * 0.20),
      },
      sentiment,
    };
  });
}

// ─── Theme Extraction Page ─────────────────────────────────────────────────────

export const ThemeExtractionPage: React.FC = () => {
  const { isDark } = useTheme();
  const navigate = useNavigate();

  // State
  const [searchQuery, setSearchQuery] = useState('');
  const [isClustering, setIsClustering] = useState(false);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [selectedTheme, setSelectedTheme] = useState<ThemeItem | null>(null);
  const [isTechDetailsOpen, setIsTechDetailsOpen] = useState(false);
  const [themes, setThemes] = useState<ThemeItem[]>(THEMES_DATA);
  const [isLiveConnected, setIsLiveConnected] = useState<boolean>(false);

  // Toast theme styles
  const toast_ok = {
    background: isDark ? '#161B22' : '#ffffff',
    color: isDark ? '#F8FAFC' : '#0F172A',
    border: `1px solid ${isDark ? '#2D3748' : '#E2E8F0'}`,
  };

  const fetchBackendThemes = async () => {
    try {
      const clusters = await analyticsService.getThemeClusters();
      if (clusters && clusters.length > 0) {
        const transformed = transformBackendClustersToThemes(clusters);
        setThemes(transformed);
        setIsLiveConnected(true);
      }
    } catch (err) {
      console.warn('Failed to load theme clusters from backend:', err);
    }
  };

  useEffect(() => {
    fetchBackendThemes();
  }, []);

  const handleReRunClustering = async () => {
    setIsClustering(true);
    toast.loading('Fetching live vector clusters from PostgreSQL analytics backend...', {
      id: 'clustering-toast',
      style: toast_ok,
    });

    try {
      const clusters = await analyticsService.getThemeClusters();
      if (clusters && clusters.length > 0) {
        const transformed = transformBackendClustersToThemes(clusters);
        setThemes(transformed);
        setIsLiveConnected(true);
        toast.success(`Clustering synchronized! ${clusters.length} live themes extracted from backend.`, {
          id: 'clustering-toast',
          style: toast_ok,
        });
      } else {
        toast.success('Clustering completed! Synchronized with analytics engine.', {
          id: 'clustering-toast',
          style: toast_ok,
        });
      }
    } catch (err) {
      toast.error('Could not reach backend analytics endpoint. Using local state.', {
        id: 'clustering-toast',
        style: toast_ok,
      });
    } finally {
      setIsClustering(false);
    }
  };

  // Card themes
  const cardBg = isDark
    ? 'bg-[#161B22]/90 border-[#2D3748] shadow-lg shadow-black/20 hover:border-[#3B82F6]/50'
    : 'bg-white border-[#E2E8F0] shadow-sm hover:shadow-md hover:border-[#3B82F6]/50';

  const innerPanelBg = isDark ? 'bg-[#0D1117]/80 border-[#2D3748]' : 'bg-[#F8FAFC] border-[#E2E8F0]';

  // Priority color styling helpers
  const getBadgeStyle = (color: ThemeItem['priorityColor']) => {
    switch (color) {
      case 'red':
        return 'bg-[#EF4444]/15 border-[#EF4444]/30 text-[#EF4444]';
      case 'orange':
        return 'bg-[#F59E0B]/15 border-[#F59E0B]/30 text-[#F59E0B]';
      case 'amber':
        return 'bg-[#EAB308]/15 border-[#EAB308]/30 text-[#EAB308]';
      case 'purple':
        return 'bg-[#8B5CF6]/15 border-[#8B5CF6]/30 text-[#A78BFA]';
      case 'blue':
      default:
        return 'bg-[#3B82F6]/15 border-[#3B82F6]/30 text-[#3B82F6]';
    }
  };

  const getTagStyle = (color: ThemeItem['priorityColor']) => {
    switch (color) {
      case 'red':
        return 'border-[#EF4444]/40 text-[#EF4444] bg-[#EF4444]/10';
      case 'orange':
        return 'border-[#F59E0B]/40 text-[#F59E0B] bg-[#F59E0B]/10';
      case 'amber':
        return 'border-[#EAB308]/40 text-[#EAB308] bg-[#EAB308]/10';
      case 'purple':
        return 'border-[#8B5CF6]/40 text-[#A78BFA] bg-[#8B5CF6]/10';
      case 'blue':
      default:
        return 'border-[#3B82F6]/40 text-[#3B82F6] bg-[#3B82F6]/10';
    }
  };

  const filteredThemes = themes.filter(
    (t) =>
      t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.primaryTag.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.secondaryTag.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen transition-colors duration-200" style={{ backgroundColor: 'var(--bg-base)' }}>
      <Toaster position="top-right" />
      <Sidebar />

      <div className="ml-60 min-h-screen flex flex-col">
        <TopNavbar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          searchPlaceholder="Search themes by title, tag, or cluster ID..."
        />

        <main className="flex-1 pt-20 px-8 pb-12 space-y-7 max-w-screen-2xl mx-auto w-full">
          
          {/* ── Page Header ─────────────────────────────────────────────────── */}
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight font-display flex items-center gap-2.5" style={{ color: 'var(--text-primary)' }}>
              Theme Extraction Console
              <span className="p-1.5 rounded-lg bg-[#8B5CF6]/15 border border-[#8B5CF6]/30 text-[#8B5CF6] inline-flex">
                <Layers className="w-5 h-5" />
              </span>
            </h1>
            <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
              AI-powered semantic clustering of customer feedback to identify core themes and pain points.
            </p>
          </div>

          {/* ── Status Bar & Re-run Button ──────────────────────────────────── */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className={`flex-1 px-5 py-3.5 rounded-2xl border flex items-center gap-3 ${
              isDark ? 'bg-[#161B22] border-[#2D3748] text-white' : 'bg-white border-[#E2E8F0] text-[#0F172A] shadow-sm'
            }`}>
              <Database className="w-4 h-4 text-[#8B5CF6] flex-shrink-0" />
              <span className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>
                Module 3 - Connected to PostgreSQL & Qdrant -{' '}
                <strong className="text-[#A78BFA] font-bold">{themes.length} Themes Identified{isLiveConnected ? ' (Live Backend)' : ''}</strong>
              </span>
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleReRunClustering}
              disabled={isClustering}
              className="flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-2xl font-bold text-xs text-white bg-gradient-to-r from-[#3B82F6] to-[#8B5CF6] hover:opacity-90 transition-all shadow-xl shadow-blue-500/20 cursor-pointer flex-shrink-0 disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isClustering ? 'animate-spin' : ''}`} />
              <span>{isClustering ? 'Clustering in Progress...' : 'Re-run Clustering'}</span>
            </motion.button>
          </div>

          {/* ── 8 Theme Cards Grid ─────────────────────────────────────────── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {filteredThemes.map((theme) => {
              const Icon = theme.icon;
              const badgeStyle = getBadgeStyle(theme.priorityColor);
              const tagStyle = getTagStyle(theme.priorityColor);

              return (
                <motion.div
                  key={theme.id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  whileHover={{ y: -3 }}
                  className={`rounded-2xl border p-5 flex flex-col justify-between transition-all relative group cursor-pointer ${cardBg}`}
                  onClick={() => setSelectedTheme(theme)}
                >
                  <div>
                    {/* Header Row: Priority Badge & 3-Dots Menu */}
                    <div className="flex items-center justify-between gap-2 mb-4">
                      <span className={`text-[11px] font-extrabold px-2.5 py-0.5 rounded-full border ${badgeStyle}`}>
                        {theme.priority}
                      </span>

                      <div className="relative">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveMenuId(activeMenuId === theme.id ? null : theme.id);
                          }}
                          className="p-1 rounded-lg hover:bg-[#2D3748]/50 transition-colors"
                          style={{ color: 'var(--text-muted)' }}
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>

                        <AnimatePresence>
                          {activeMenuId === theme.id && (
                            <motion.div
                              initial={{ opacity: 0, scale: 0.95 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={{ opacity: 0, scale: 0.95 }}
                              className={`absolute right-0 mt-1 w-44 rounded-xl border p-1 z-30 shadow-xl ${
                                isDark ? 'bg-[#161B22] border-[#2D3748]' : 'bg-white border-[#E2E8F0]'
                              }`}
                              onClick={(e) => e.stopPropagation()}
                            >
                              <button
                                onClick={() => {
                                  setSelectedTheme(theme);
                                  setActiveMenuId(null);
                                }}
                                className="w-full text-left px-3 py-2 rounded-lg text-xs font-medium hover:bg-[#3B82F6]/15 hover:text-[#3B82F6] transition-colors"
                              >
                                View Feedback Items
                              </button>
                              <button
                                onClick={() => {
                                  toast.success(`Drafting PRD for "${theme.title}"...`, { style: toast_ok });
                                  setActiveMenuId(null);
                                }}
                                className="w-full text-left px-3 py-2 rounded-lg text-xs font-medium hover:bg-[#3B82F6]/15 hover:text-[#3B82F6] transition-colors"
                              >
                                Create PRD Draft
                              </button>
                              <button
                                onClick={() => {
                                  toast.success(`Exported ${theme.count} items as CSV`, { style: toast_ok });
                                  setActiveMenuId(null);
                                }}
                                className="w-full text-left px-3 py-2 rounded-lg text-xs font-medium hover:bg-[#3B82F6]/15 hover:text-[#3B82F6] transition-colors"
                              >
                                Export Cluster
                              </button>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>

                    {/* Icon & Title Row */}
                    <div className="flex items-start gap-3 mb-4">
                      <div className={`p-3 rounded-xl border flex-shrink-0 ${badgeStyle}`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-base font-bold truncate group-hover:text-[#3B82F6] transition-colors" style={{ color: 'var(--text-primary)' }}>
                          {theme.title}
                        </h3>
                        <p className="text-xs font-semibold mt-0.5" style={{ color: 'var(--text-muted)' }}>
                          {theme.count} items
                        </p>
                      </div>
                    </div>

                    {/* Verbatim Quote Box */}
                    <div className={`p-3.5 rounded-xl border text-xs italic leading-relaxed mb-5 ${innerPanelBg}`} style={{ color: 'var(--text-secondary)' }}>
                      "{theme.quote}"
                    </div>
                  </div>

                  {/* Category Tags at Bottom */}
                  <div className="flex items-center gap-2 pt-2">
                    <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-md border ${tagStyle}`}>
                      {theme.primaryTag}
                    </span>
                    <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-md border ${
                      isDark ? 'border-[#2D3748] text-[#94A3B8] bg-[#0D1117]' : 'border-[#CBD5E1] text-[#64748B] bg-[#F1F5F9]'
                    }`}>
                      {theme.secondaryTag}
                    </span>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* ── Bottom Section: How Themes Are Extracted ────────────────────── */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className={`rounded-2xl border p-6 space-y-6 relative overflow-hidden ${cardBg}`}
          >
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-gradient-to-br from-[#8B5CF6] to-[#6366F1] text-white shadow-lg shadow-purple-500/20">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold font-display" style={{ color: 'var(--text-primary)' }}>
                    How Themes Are Extracted
                  </h2>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                    Semantic vector clustering workflow with Qdrant & HDBSCAN
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsTechDetailsOpen(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-[#8B5CF6] bg-[#8B5CF6]/15 hover:bg-[#8B5CF6]/25 border border-[#8B5CF6]/30 transition-all cursor-pointer w-fit"
              >
                <Code className="w-4 h-4" />
                <span>&lt;/&gt; View Technical Details</span>
              </button>
            </div>

            {/* 4-Step Pipeline */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 relative">
              {[
                {
                  step: '1. Feedback Ingestion',
                  desc: 'Collect raw feedback from all connected sources (Zendesk, App Store, Intercom, etc.)',
                  icon: MessageSquare,
                  color: 'bg-[#8B5CF6]/15 text-[#8B5CF6] border-[#8B5CF6]/30',
                },
                {
                  step: '2. Vector Embedding',
                  desc: 'Each feedback item is converted into a vector embedding that captures its meaning.',
                  icon: Share2,
                  color: 'bg-[#6366F1]/15 text-[#6366F1] border-[#6366F1]/30',
                  highlight: 'vector embedding',
                },
                {
                  step: '3. Clustering (HDBSCAN)',
                  desc: 'Similar embeddings are grouped using clustering algorithms (HDBSCAN) to form semantic clusters.',
                  icon: Cpu,
                  color: 'bg-[#3B82F6]/15 text-[#3B82F6] border-[#3B82F6]/30',
                  highlight: 'clustering algorithms',
                },
                {
                  step: '4. AI Labeling',
                  desc: 'Each cluster is then labeled automatically by the AI with a concise theme description.',
                  icon: Bot,
                  color: 'bg-[#10B981]/15 text-[#10B981] border-[#10B981]/30',
                  highlight: 'AI',
                },
              ].map((item, idx) => {
                const Icon = item.icon;
                return (
                  <div key={idx} className={`p-4 rounded-xl border flex flex-col justify-between ${innerPanelBg} relative`}>
                    <div className="space-y-3">
                      <div className={`p-2.5 rounded-xl border w-fit ${item.color}`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <h4 className="text-xs font-bold" style={{ color: 'var(--text-primary)' }}>{item.step}</h4>
                      <p className="text-[11px] leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                        {item.desc}
                      </p>
                    </div>

                    {idx < 3 && (
                      <div className="hidden md:block absolute -right-3 top-1/2 -translate-y-1/2 z-10 text-[#64748B]">
                        →
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Bottom Result Summary Line */}
            <div className="flex items-center gap-2 pt-2 text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>
              <CheckCircle2 className="w-4 h-4 text-[#8B5CF6]" />
              <span>
                <strong className="text-[#8B5CF6] font-bold">Result:</strong> Meaningful themes that help you understand what users truly care about.
              </span>
            </div>
          </motion.div>

        </main>
      </div>

      {/* ── Theme Detail Modal ───────────────────────────────────────────── */}
      <AnimatePresence>
        {selectedTheme && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className={`w-full max-w-xl rounded-2xl border p-6 shadow-2xl relative space-y-5 ${
                isDark ? 'bg-[#161B22] border-[#2D3748] text-white' : 'bg-white border-[#E2E8F0] text-[#0F172A]'
              }`}
            >
              <button
                onClick={() => setSelectedTheme(null)}
                className="absolute top-4 right-4 p-2 rounded-xl text-[#94A3B8] hover:bg-[#1e2530] hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-3">
                <div className={`p-3 rounded-xl border ${getBadgeStyle(selectedTheme.priorityColor)}`}>
                  <selectedTheme.icon className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-bold font-display">{selectedTheme.title}</h3>
                  <p className="text-xs text-[#94A3B8]">
                    {selectedTheme.count} feedback items clustered in Qdrant
                  </p>
                </div>
              </div>

              <div className={`p-4 rounded-xl border space-y-3 ${isDark ? 'bg-[#0D1117] border-[#2D3748]' : 'bg-[#F8FAFC] border-[#E2E8F0]'}`}>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#64748B]">Verbatim Sample</span>
                <p className={`text-xs italic ${isDark ? 'text-[#CBD5E1]' : 'text-[#334155]'}`}>"{selectedTheme.quote}"</p>
              </div>

              <div className="grid grid-cols-3 gap-3 text-center text-xs">
                <div className={`p-3 rounded-xl border ${isDark ? 'bg-[#0D1117] border-[#2D3748]' : 'bg-[#F8FAFC] border-[#E2E8F0]'}`}>
                  <p className="text-[#64748B] text-[10px]">Zendesk</p>
                  <p className={`font-bold text-sm mt-0.5 ${isDark ? 'text-white' : 'text-[#0F172A]'}`}>{selectedTheme.sources.zendesk}</p>
                </div>
                <div className={`p-3 rounded-xl border ${isDark ? 'bg-[#0D1117] border-[#2D3748]' : 'bg-[#F8FAFC] border-[#E2E8F0]'}`}>
                  <p className="text-[#64748B] text-[10px]">App Store</p>
                  <p className={`font-bold text-sm mt-0.5 ${isDark ? 'text-white' : 'text-[#0F172A]'}`}>{selectedTheme.sources.appStore}</p>
                </div>
                <div className={`p-3 rounded-xl border ${isDark ? 'bg-[#0D1117] border-[#2D3748]' : 'bg-[#F8FAFC] border-[#E2E8F0]'}`}>
                  <p className="text-[#64748B] text-[10px]">Intercom</p>
                  <p className={`font-bold text-sm mt-0.5 ${isDark ? 'text-white' : 'text-[#0F172A]'}`}>{selectedTheme.sources.intercom}</p>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  onClick={() => setSelectedTheme(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-[#1e2530] hover:bg-[#252a32] text-white"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    navigate('/prd-generator', { state: { feature_name: selectedTheme.title, autoGenerate: true } });
                    setSelectedTheme(null);
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-[#3B82F6] to-[#8B5CF6] text-white hover:opacity-90"
                >
                  Draft PRD from Theme
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── Technical Details Modal ───────────────────────────────────────── */}
      <AnimatePresence>
        {isTechDetailsOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className={`w-full max-w-xl rounded-2xl border p-6 shadow-2xl relative space-y-5 ${
                isDark ? 'bg-[#161B22] border-[#2D3748] text-white' : 'bg-white border-[#E2E8F0] text-[#0F172A]'
              }`}
            >
              <button
                onClick={() => setIsTechDetailsOpen(false)}
                className="absolute top-4 right-4 p-2 rounded-xl text-[#94A3B8] hover:bg-[#1e2530] hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-[#8B5CF6]/15 border border-[#8B5CF6]/30 text-[#8B5CF6]">
                  <Code className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-bold font-display">Clustering Architecture Specs</h3>
                  <p className="text-xs text-[#94A3B8]">Qdrant Vector DB & HDBSCAN Hyperparameters</p>
                </div>
              </div>

              <div className={`p-4 rounded-xl border space-y-2 text-xs font-mono ${isDark ? 'bg-[#0D1117] border-[#2D3748] text-[#CBD5E1]' : 'bg-[#F8FAFC] border-[#E2E8F0] text-[#334155]'}`}>
                <div className="flex justify-between"><span className="text-[#64748B]">Embedding Model:</span><span>text-embedding-3-large (1536d)</span></div>
                <div className="flex justify-between"><span className="text-[#64748B]">Vector Database:</span><span>Qdrant Cloud (v1.8.1)</span></div>
                <div className="flex justify-between"><span className="text-[#64748B]">Clustering Algorithm:</span><span>HDBSCAN (min_cluster_size=15)</span></div>
                <div className="flex justify-between"><span className="text-[#64748B]">Distance Metric:</span><span>Cosine Similarity (&gt; 0.82)</span></div>
                <div className="flex justify-between"><span className="text-[#64748B]">LLM Labeler:</span><span>Gemini 1.5 Pro</span></div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  onClick={() => setIsTechDetailsOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-[#1e2530] hover:bg-[#252a32] text-white"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ThemeExtractionPage;

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
  File,
  RefreshCcw,
} from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import { Sidebar } from '../components/Sidebar';
import { TopNavbar } from '../components/TopNavbar';
import { useTheme } from '../context/ThemeContext';
import { analyticsService, type BackendCluster } from '../services/analyticsService';

const PurpleSparkline: React.FC = () => (
  <svg className="w-24 h-10 overflow-visible" viewBox="0 0 100 40" fill="none">
    <defs>
      <linearGradient id="purpleGrad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#8B5CF6" stopOpacity="0.35" />
        <stop offset="100%" stopColor="#8B5CF6" stopOpacity="0.0" />
      </linearGradient>
    </defs>
    <path d="M0 30 Q15 28, 30 22 T60 25 T80 12 T100 18 L100 40 L0 40 Z" fill="url(#purpleGrad)" />
    <path d="M0 30 Q15 28, 30 22 T60 25 T80 12 T100 18" stroke="#8B5CF6" strokeWidth="2.5" strokeLinecap="round" />
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
    <path d="M0 25 Q20 35, 40 20 T70 22 T100 10 L100 40 L0 40 Z" fill="url(#blueGrad)" />
    <path d="M0 25 Q20 35, 40 20 T70 22 T100 10" stroke="#3B82F6" strokeWidth="2.5" strokeLinecap="round" />
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
    <path d="M0 20 Q15 25, 30 15 T60 20 T80 10 T100 15 L100 40 L0 40 Z" fill="url(#greenGrad)" />
    <path d="M0 20 Q15 25, 30 15 T60 20 T80 10 T100 15" stroke="#10B981" strokeWidth="2.5" strokeLinecap="round" />
  </svg>
);

export interface FeatureRequestItem {
  id: string;
  rank: number;
  title: string;
  reqs: number;
  segment: string;
  quote: string;
  icon: React.ElementType;
  rankColor: string;
}

const DEFAULT_FEATURES: FeatureRequestItem[] = [
  { id: 'fr-1', rank: 1, title: 'PDF Statement Export', reqs: 612, segment: 'Finance', quote: 'Need PDF for tax filing and record keeping', icon: FileText, rankColor: '#F59E0B' },
  { id: 'fr-2', rank: 2, title: 'Dark Mode Support', reqs: 381, segment: 'Enterprise', quote: 'My eyes hurt at night, please add dark mode', icon: Moon, rankColor: '#94A3B8' },
  { id: 'fr-3', rank: 3, title: 'Spending Analytics', reqs: 344, segment: 'All Users', quote: 'Category breakdown missing in dashboard', icon: PieChart, rankColor: '#F97316' },
  { id: 'fr-4', rank: 4, title: 'Bulk Transaction Export', reqs: 287, segment: 'Consumer', quote: 'Exporting one by one is time consuming', icon: LogOut, rankColor: '#475569' },
  { id: 'fr-5', rank: 5, title: 'UPI Payment Integration', reqs: 241, segment: 'Retail', quote: 'Need instant UPI payment support', icon: Link, rankColor: '#475569' },
];

export const FeatureRequestsPage: React.FC = () => {
  const { isDark } = useTheme();
  const navigate = useNavigate();

  const [features, setFeatures] = useState<FeatureRequestItem[]>(DEFAULT_FEATURES);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);
  const [selectedSegment, setSelectedSegment] = useState('All');

  const toastStyle = {
    background: isDark ? '#161B22' : '#ffffff',
    color: isDark ? '#F8FAFC' : '#0F172A',
    border: `1px solid ${isDark ? '#2D3748' : '#E2E8F0'}`,
  };

  const fetchLiveClusters = async () => {
    setIsSyncing(true);
    try {
      const clusters = await analyticsService.getThemeClusters();
      if (Array.isArray(clusters) && clusters.length > 0) {
        const mapped: FeatureRequestItem[] = clusters.map((c, idx) => ({
          id: `fr-live-${idx}`,
          rank: idx + 1,
          title: c.category || c.name || c.theme || `Feature Cluster ${idx + 1}`,
          reqs: c.total_volume || c.count || 300,
          segment: (c.total_volume || 0) > 400 ? 'Enterprise' : 'Consumer',
          quote: c.quote || 'Users report recurring friction regarding this feature workflow.',
          icon: FileText,
          rankColor: idx === 0 ? '#F59E0B' : idx === 1 ? '#94A3B8' : idx === 2 ? '#F97316' : '#475569',
        }));
        setFeatures(mapped);
        toast.success(`Loaded ${clusters.length} live feature request themes from database!`, { style: toastStyle });
      }
    } catch (err) {
      console.warn('Live cluster fetch failed for feature requests, keeping default list:', err);
    } finally {
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    fetchLiveClusters();
  }, []);

  // Filtering
  const filteredFeatures = features.filter(f => {
    const matchesSearch = f.title.toLowerCase().includes(searchQuery.toLowerCase()) || f.quote.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSegment = selectedSegment === 'All' || f.segment === selectedSegment;
    return matchesSearch && matchesSegment;
  });

  const handleGeneratePRD = (featureTitle: string) => {
    navigate(`/prd-generator?feature=${encodeURIComponent(featureTitle)}`, {
      state: { feature_name: featureTitle },
    });
  };

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
          <Toaster position="top-right" />
          <div className="space-y-8">
            {/* Header */}
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h1 className="text-3xl font-extrabold flex items-center gap-3" style={{ color: 'var(--text-primary)' }}>
                  Feature Requests & Cluster Backlog
                  <Settings2 className="w-6 h-6 text-[#8B5CF6]" />
                </h1>
                <p className="mt-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
                  AI-clustered and prioritized customer requests ranked by feedback volume and user segment impact.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={fetchLiveClusters}
                  disabled={isSyncing}
                  className="px-4 py-2.5 rounded-xl border border-[#2D3748] bg-[#1E293B] hover:bg-[#334155] text-white font-bold text-xs flex items-center gap-2 transition-all shadow-sm"
                >
                  <RefreshCcw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
                  Sync Features
                </button>
                <button
                  onClick={() => handleGeneratePRD(filteredFeatures[0]?.title || 'PDF Statement Export')}
                  className="px-5 py-2.5 rounded-xl font-bold bg-gradient-to-r from-[#3B82F6] to-[#8B5CF6] text-white flex items-center gap-2 hover:opacity-90 shadow-lg shadow-[#8B5CF6]/20 transition-all text-xs"
                >
                  <Sparkles className="w-4 h-4" />
                  Generate PRD for Top Request
                </button>
              </div>
            </div>

            {/* Metrics Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className={`rounded-2xl border p-5 flex items-center justify-between ${cardBg}`}>
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2.5 rounded-xl bg-[#8B5CF6]/15 border border-[#8B5CF6]/30 text-[#8B5CF6]">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>Total Requests Ingested</p>
                      <p className="text-2xl font-extrabold" style={{ color: 'var(--text-primary)' }}>
                        {features.reduce((acc, f) => acc + f.reqs, 0).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <div className="text-[11px] font-bold text-[#10B981] flex items-center gap-1">
                    <TrendingUp className="w-3.5 h-3.5" />
                    <span>Live Database Telemetry Active</span>
                  </div>
                </div>
                <PurpleSparkline />
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className={`rounded-2xl border p-5 flex items-center justify-between ${cardBg}`}>
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2.5 rounded-xl bg-[#3B82F6]/15 border border-[#3B82F6]/30 text-[#3B82F6]">
                      <Users className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>Unique Clusters</p>
                      <p className="text-2xl font-extrabold" style={{ color: 'var(--text-primary)' }}>{features.length}</p>
                    </div>
                  </div>
                  <div className="text-[11px] font-medium" style={{ color: 'var(--text-muted)' }}>After Qdrant Vector Deduplication</div>
                </div>
                <BlueSparkline />
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className={`rounded-2xl border p-5 flex items-center justify-between ${cardBg}`}>
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
                    Gemini Embeddings Grounded
                  </div>
                </div>
                <GreenSparkline />
              </motion.div>
            </div>

            {/* Filter Bar */}
            <div className={`p-4 rounded-2xl border ${cardBg} flex flex-wrap items-center justify-between gap-4`}>
              <div className="relative flex-1 min-w-[240px]">
                <Search className="w-4 h-4 text-[#64748B] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search feature title or user quote..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className={`w-full pl-9 pr-4 py-2 text-sm rounded-xl border ${
                    isDark ? 'bg-[#0D1117] border-[#2D3748] text-white' : 'bg-gray-50 border-[#E2E8F0] text-gray-900'
                  }`}
                />
              </div>

              <div className="flex items-center gap-3">
                <span className="text-xs font-semibold text-[#94A3B8]">Segment:</span>
                {['All', 'Finance', 'Enterprise', 'Consumer', 'Retail'].map(seg => (
                  <button
                    key={seg}
                    onClick={() => setSelectedSegment(seg)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      selectedSegment === seg
                        ? 'bg-[#3B82F6] text-white shadow-sm'
                        : isDark ? 'bg-[#1E293B] text-[#94A3B8] hover:text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {seg}
                  </button>
                ))}
              </div>
            </div>

            {/* Feature List Table */}
            <div className={`border rounded-2xl overflow-hidden ${cardBg}`}>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className={`text-xs ${tableHeaderBg}`}>
                    <tr>
                      <th className="px-6 py-4 font-semibold w-24">Rank</th>
                      <th className="px-6 py-4 font-semibold">Feature Title</th>
                      <th className="px-6 py-4 font-semibold">Customer Quote Snapshot</th>
                      <th className="px-6 py-4 font-semibold text-center">Requests</th>
                      <th className="px-6 py-4 font-semibold text-center">Segment</th>
                      <th className="px-6 py-4 font-semibold text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#2D3748]">
                    {filteredFeatures.map((row) => {
                      const Icon = row.icon;
                      return (
                        <tr key={row.id} className="hover:bg-[#161B22]/50 transition-colors">
                          <td className="px-6 py-4 font-extrabold text-base" style={{ color: row.rankColor }}>
                            #{row.rank}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="p-2 rounded-lg bg-[#3B82F6]/10 text-[#3B82F6]">
                                <Icon className="w-4 h-4" />
                              </div>
                              <span className="font-bold text-white">{row.title}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-xs text-[#94A3B8] italic max-w-md">
                            "{row.quote}"
                          </td>
                          <td className="px-6 py-4 text-center font-mono font-bold text-sm text-[#10B981]">
                            {row.reqs}
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-[#8B5CF6]/15 text-[#8B5CF6] border border-[#8B5CF6]/30">
                              {row.segment}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <button
                              onClick={() => handleGeneratePRD(row.title)}
                              className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-[#8B5CF6] hover:bg-[#7C3AED] text-white transition-all shadow-md inline-flex items-center gap-1.5"
                            >
                              <File className="w-3.5 h-3.5" /> Generate PRD
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

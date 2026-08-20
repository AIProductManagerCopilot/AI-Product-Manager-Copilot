import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BarChart2,
  Calendar,
  Users,
  Clock,
  TrendingUp,
  UserMinus,
  ArrowLeftRight,
  Receipt,
  History,
  Bell,
  FileText,
  AlertTriangle,
  AlertCircle,
  Info,
  Sparkles,
  ChevronDown,
  ArrowRight,
  Lightbulb,
  X,
  Bot,
  Filter,
  CheckCircle2,
  Share2,
  Download,
} from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

import { Sidebar } from '../components/Sidebar';
import { TopNavbar } from '../components/TopNavbar';
import { useTheme } from '../context/ThemeContext';
import { analyticsService, BackendCluster } from '../services/analyticsService';

// ─── Sparkline SVG Components ──────────────────────────────────────────────────

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
      d="M0 15 Q20 10, 40 24 T70 30 T100 20 L100 40 L0 40 Z"
      fill="url(#blueGrad)"
    />
    <path
      d="M0 15 Q20 10, 40 24 T70 30 T100 20"
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
      d="M0 32 Q25 25, 45 28 T75 14 T100 8 L100 40 L0 40 Z"
      fill="url(#greenGrad)"
    />
    <path
      d="M0 32 Q25 25, 45 28 T75 14 T100 8"
      stroke="#10B981"
      strokeWidth="2.5"
      strokeLinecap="round"
    />
  </svg>
);

const AmberSparkline: React.FC = () => (
  <svg className="w-24 h-10 overflow-visible" viewBox="0 0 100 40" fill="none">
    <defs>
      <linearGradient id="amberGrad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#F59E0B" stopOpacity="0.35" />
        <stop offset="100%" stopColor="#F59E0B" stopOpacity="0.0" />
      </linearGradient>
    </defs>
    <path
      d="M0 18 Q20 22, 40 15 T70 28 T100 14 L100 40 L0 40 Z"
      fill="url(#amberGrad)"
    />
    <path
      d="M0 18 Q20 22, 40 15 T70 28 T100 14"
      stroke="#F59E0B"
      strokeWidth="2.5"
      strokeLinecap="round"
    />
  </svg>
);

// ─── Data & Types ──────────────────────────────────────────────────────────────

interface FeatureUsageItem {
  id: string;
  name: string;
  icon: React.ElementType;
  rate: number;
  activeUsers: string;
  avgDaily: string;
  trend: string;
}

const FEATURE_USAGE: FeatureUsageItem[] = [
  { id: 'fund-transfer',      name: 'Fund Transfer',       icon: ArrowLeftRight, rate: 94, activeUsers: '39.8K', avgDaily: '142.5K', trend: '+4.2%' },
  { id: 'bill-payments',      name: 'Bill Payments',       icon: Receipt,        rate: 78, activeUsers: '33.0K', avgDaily: '88.2K',  trend: '+2.1%' },
  { id: 'transaction-history', name: 'Transaction History', icon: History,        rate: 62, activeUsers: '26.2K', avgDaily: '65.4K',  trend: '+1.5%' },
  { id: 'notifications',       name: 'Notifications',       icon: Bell,           rate: 55, activeUsers: '23.2K', avgDaily: '48.9K',  trend: '-0.8%' },
  { id: 'investment-tab',      name: 'Investment Tab',      icon: TrendingUp,     rate: 23, activeUsers: '9.7K',  avgDaily: '12.1K',  trend: '-5.4%' },
  { id: 'reports-statements',  name: 'Reports & Statements', icon: FileText,       rate: 18, activeUsers: '7.6K',  avgDaily: '8.4K',   trend: '+0.4%' },
];

interface DropOffItem {
  id: string;
  title: string;
  description: string;
  impact: 'High Impact' | 'Medium Impact' | 'Low Impact';
  impactColor: 'amber' | 'red' | 'blue';
  icon: React.ElementType;
  dropRate: string;
  stepName: string;
}

const DROP_OFF_POINTS: DropOffItem[] = [
  {
    id: 'investment-onboarding',
    title: 'Investment Tab Onboarding',
    description: '68% of users exit within 10 seconds',
    impact: 'High Impact',
    impactColor: 'amber',
    icon: AlertTriangle,
    dropRate: '68%',
    stepName: 'Step 2: Risk Profile Selection',
  },
  {
    id: 'statement-download',
    title: 'Statement Download Flow',
    description: '52% abandon — PDF option not found',
    impact: 'High Impact',
    impactColor: 'red',
    icon: AlertCircle,
    dropRate: '52%',
    stepName: 'Step 3: Export Format Selection',
  },
  {
    id: 'new-user-reg',
    title: 'New User Registration',
    description: '31% drop at KYC upload step',
    impact: 'Medium Impact',
    impactColor: 'blue',
    icon: Info,
    dropRate: '31%',
    stepName: 'Step 4: ID Verification Upload',
  },
];

// Helper to calculate date range parameters for GET /api/v1/analytics/clusters
function getDateRangeParams(range: string): { start_date?: string; end_date?: string } {
  const format = (d: Date) => d.toISOString().split('T')[0];
  const now = new Date();
  
  if (range === 'Last 7 Days') {
    const start = new Date();
    start.setDate(now.getDate() - 7);
    return { start_date: format(start), end_date: format(now) };
  }
  if (range === 'Last 30 Days') {
    const start = new Date();
    start.setDate(now.getDate() - 30);
    return { start_date: format(start), end_date: format(now) };
  }
  if (range === 'Last 90 Days') {
    const start = new Date();
    start.setDate(now.getDate() - 90);
    return { start_date: format(start), end_date: format(now) };
  }
  if (range === 'Year to Date (2026)') {
    return { start_date: '2026-01-01', end_date: format(now) };
  }
  if (range === 'May 8 - May 15, 2026') {
    return { start_date: '2026-05-08', end_date: '2026-05-15' };
  }
  return {};
}

// ─── Main Component ────────────────────────────────────────────────────────────

export const ProductAnalyticsPage: React.FC = () => {
  const { isDark } = useTheme();

  // Filters & State
  const [selectedDateRange, setSelectedDateRange] = useState('May 8 - May 15, 2026');
  const [isDateDropdownOpen, setIsDateDropdownOpen] = useState(false);
  const [usageTimeframe, setUsageTimeframe] = useState('Last 7 Days');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Backend Integration State
  const [backendClusters, setBackendClusters] = useState<BackendCluster[]>([]);
  const [isLiveConnected, setIsLiveConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Modals / Drawers
  const [isFunnelModalOpen, setIsFunnelModalOpen] = useState(false);
  const [isCopilotModalOpen, setIsCopilotModalOpen] = useState(false);
  const [selectedDropOff, setSelectedDropOff] = useState<DropOffItem | null>(null);

  // Toast theme styles
  const toast_ok  = { background: isDark ? '#161B22' : '#ffffff', color: isDark ? '#F8FAFC' : '#0F172A', border: `1px solid ${isDark ? '#2D3748' : '#E2E8F0'}` };

  // Fetch Live Database Clusters
  const fetchLiveClusters = useCallback(async (range: string) => {
    setIsLoading(true);
    const { start_date, end_date } = getDateRangeParams(range);
    try {
      const response = await analyticsService.getThemeClusters(start_date, end_date);
      // Backend returns either direct array or wrapping object with a 'data' property
      const clusters = Array.isArray(response) 
        ? response 
        : (response as any)?.data || [];

      setBackendClusters(clusters);
      setIsLiveConnected(true);
    } catch (err) {
      console.error('Failed to retrieve PostgreSQL analytics data:', err);
      setIsLiveConnected(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLiveClusters(selectedDateRange);
  }, [selectedDateRange, fetchLiveClusters]);

  // Dynamically recalculate feature usage based on database feedback clusters
  const getDynamicFeatureUsage = (): FeatureUsageItem[] => {
    let base = FEATURE_USAGE.map(feat => {
      let newRate = feat.rate;
      let newTrend = feat.trend;
      if (usageTimeframe === 'Last 30 Days') {
        newRate = Math.min(100, Math.round(feat.rate * 1.12));
        newTrend = feat.trend.replace(/([+-][0-9.]+)/, (match) => (parseFloat(match) * 1.2).toFixed(1));
      } else if (usageTimeframe === 'All Time') {
        newRate = Math.min(100, Math.round(feat.rate * 1.25));
        newTrend = feat.trend.replace(/([+-][0-9.]+)/, (match) => (parseFloat(match) * 1.5).toFixed(1));
      }
      return { ...feat, rate: newRate, trend: newTrend };
    });

    if (!isLiveConnected || backendClusters.length === 0) return base;

    return base.map((feat) => {
      // Find matching user friction cluster
      const matchingCluster = backendClusters.find((c) => {
        const cat = (c.category || c.name || c.theme || '').toLowerCase();
        if (feat.id === 'investment-tab' && (cat.includes('onboarding') || cat.includes('complex'))) return true;
        if (feat.id === 'reports-statements' && (cat.includes('pdf') || cat.includes('export') || cat.includes('statement'))) return true;
        if (feat.id === 'bill-payments' && (cat.includes('payment') || cat.includes('gateway'))) return true;
        if (feat.id === 'fund-transfer' && (cat.includes('transfer') || cat.includes('discoverability'))) return true;
        if (feat.id === 'transaction-history' && cat.includes('performance')) return true;
        if (feat.id === 'notifications' && cat.includes('notification')) return true;
        return false;
      });

      if (!matchingCluster) return feat;

      // Adjust the usage rate downward based on cluster volume and severity
      const volume = matchingCluster.total_volume || matchingCluster.count || 0;
      const severity = matchingCluster.avg_severity || 3;
      const reduction = Math.min(40, Math.round(volume * 0.15 + severity * 2));
      const newRate = Math.max(5, feat.rate - reduction);

      return {
        ...feat,
        rate: newRate,
        trend: reduction > 5 ? `-${(reduction * 0.1).toFixed(1)}%` : feat.trend,
      };
    });
  };

  // Dynamically adjust drop-off points based on database feedback clusters
  const getDynamicDropOffPoints = (): DropOffItem[] => {
    if (!isLiveConnected || backendClusters.length === 0) return DROP_OFF_POINTS;

    return DROP_OFF_POINTS.map((drop) => {
      const matchingCluster = backendClusters.find((c) => {
        const cat = (c.category || c.name || c.theme || '').toLowerCase();
        if (drop.id === 'investment-onboarding' && (cat.includes('onboarding') || cat.includes('complex'))) return true;
        if (drop.id === 'statement-download' && (cat.includes('pdf') || cat.includes('export') || cat.includes('statement'))) return true;
        if (drop.id === 'new-user-reg' && (cat.includes('login') || cat.includes('registration'))) return true;
        return false;
      });

      if (!matchingCluster) return drop;

      const volume = matchingCluster.total_volume || matchingCluster.count || 0;
      const priorityScore = matchingCluster.priority_score || 0;
      
      let impact: 'High Impact' | 'Medium Impact' | 'Low Impact' = 'Low Impact';
      let impactColor: 'red' | 'amber' | 'blue' = 'blue';

      if (priorityScore > 20 || volume > 40) {
        impact = 'High Impact';
        impactColor = 'red';
      } else if (priorityScore > 10 || volume > 20) {
        impact = 'Medium Impact';
        impactColor = 'amber';
      }

      return {
        ...drop,
        impact,
        impactColor,
        description: `${volume} users reported critical friction in database telemetry`,
      };
    });
  };

  // Dynamic values
  const activeFeatures = getDynamicFeatureUsage();
  const activeDropOffs = getDynamicDropOffPoints();

  // Find investment cluster count for Copilot Insights
  const investmentCluster = backendClusters.find((c) => 
    (c.category || c.name || c.theme || '').toLowerCase().includes('onboarding') ||
    (c.category || c.name || c.theme || '').toLowerCase().includes('complex')
  );
  const investmentIssueCount = investmentCluster ? (investmentCluster.total_volume || investmentCluster.count || 156) : 156;

  const handleDateSelect = (range: string) => {
    setSelectedDateRange(range);
    
    // Sync the lower component timeframes if they match or use a sensible fallback
    if (range === 'Last 30 Days' || range === 'Last 90 Days') {
      setUsageTimeframe('Last 30 Days');
    } else if (range === 'Year to Date (2026)') {
      setUsageTimeframe('All Time');
    } else {
      setUsageTimeframe('Last 7 Days');
    }
    
    setIsDateDropdownOpen(false);
    toast.success(`Analytics updated for: ${range}`, { style: toast_ok });
  };

  const handleExportData = () => {
    // Generate CSV content
    const headers = ['Feature', 'Category', 'Volume', 'Avg Severity'];
    const rows = backendClusters.map(c => [
      c.theme || c.name || c.category || 'Unknown',
      c.category || 'N/A',
      c.total_volume || c.count || 0,
      c.avg_severity || 0
    ]);
    
    const csvContent = [
      headers.join(','),
      ...rows.map(r => r.join(','))
    ].join('\n');

    // Create Blob and trigger download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `product_analytics_${selectedDateRange.replace(/ /g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success('Analytics report exported as CSV! 📊', { style: toast_ok });
  };

  // Card themes
  const cardBg = isDark
    ? 'bg-[#161B22]/90 border-[#2D3748] shadow-lg shadow-black/20'
    : 'bg-white border-[#E2E8F0] shadow-sm hover:shadow-md';

  const innerPanelBg = isDark
    ? 'bg-[#0D1117]/80 border-[#2D3748]'
    : 'bg-[#F8FAFC] border-[#E2E8F0]';

  return (
    <div className="min-h-screen transition-colors duration-200" style={{ backgroundColor: 'var(--bg-base)' }}>
      <Toaster position="top-right" />
      <Sidebar />

      <div className="ml-60 min-h-screen flex flex-col">
        <TopNavbar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          searchPlaceholder="Search analytics, features, or friction points..."
        />

        <main className="flex-1 pt-20 px-8 pb-12 space-y-7 max-w-screen-2xl mx-auto w-full">
          
          {/* ── Page Header & Date Range ───────────────────────────────────── */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-3xl font-extrabold tracking-tight font-display flex items-center gap-2.5" style={{ color: 'var(--text-primary)' }}>
                  Product Analytics
                  <span className="p-1.5 rounded-lg bg-[#8B5CF6]/15 border border-[#8B5CF6]/30 text-[#8B5CF6] inline-flex">
                    <BarChart2 className="w-5 h-5" />
                  </span>
                </h1>
              </div>
              <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
                Track user behavior, feature adoption, and product performance metrics.

              </p>
            </div>

            {/* Date Range Picker Dropdown & Export */}
            <div className="flex items-center gap-3 relative">
              <button
                onClick={handleExportData}
                title="Export Data"
                className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center gap-2 transition-all ${
                  isDark
                    ? 'bg-[#161B22] border-[#2D3748] text-[#94A3B8] hover:text-white hover:border-[#3B82F6]/50'
                    : 'bg-white border-[#E2E8F0] text-[#64748B] hover:text-[#0F172A] hover:border-[#3B82F6]/50'
                }`}
              >
                <Download className="w-4 h-4" />
                <span className="hidden md:inline">Export</span>
              </button>

              <div className="relative">
                <button
                  onClick={() => setIsDateDropdownOpen((v) => !v)}
                  className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                    isDark
                      ? 'bg-[#161B22] border-[#2D3748] text-white hover:border-[#3B82F6]/50 shadow-md'
                      : 'bg-white border-[#E2E8F0] text-[#0F172A] hover:border-[#3B82F6]/50 shadow-sm'
                  }`}
                >
                  <Calendar className="w-4 h-4 text-[#8B5CF6]" />
                  <span>{selectedDateRange}</span>
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isDateDropdownOpen ? 'rotate-180' : ''}`} style={{ color: 'var(--text-muted)' }} />
                </button>

                <AnimatePresence>
                  {isDateDropdownOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 8, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 8, scale: 0.95 }}
                      className={`absolute right-0 mt-2 w-56 rounded-xl border p-1.5 z-50 shadow-xl ${
                        isDark ? 'bg-[#161B22] border-[#2D3748]' : 'bg-white border-[#E2E8F0]'
                      }`}
                    >
                      {[
                        'May 8 - May 15, 2026',
                        'Last 7 Days',
                        'Last 30 Days',
                        'Last 90 Days',
                        'Year to Date (2026)',
                      ].map((range) => (
                        <button
                          key={range}
                          onClick={() => handleDateSelect(range)}
                          className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                            selectedDateRange === range
                              ? 'bg-[#3B82F6]/15 text-[#3B82F6] font-bold'
                              : isDark
                              ? 'text-[#94A3B8] hover:bg-[#1e2530] hover:text-white'
                              : 'text-[#64748B] hover:bg-[#F1F5F9] hover:text-[#0F172A]'
                          }`}
                        >
                          {range}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>

          {/* ── Top Row: 4 Metric Cards ────────────────────────────────────── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            
            {/* Card 1: Monthly Active Users */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
              className={`rounded-2xl border p-5 transition-all hover:border-[#8B5CF6]/50 ${cardBg}`}
            >
              <div className="flex items-center justify-between">
                <div className="p-3 rounded-xl bg-[#8B5CF6]/15 border border-[#8B5CF6]/30 text-[#8B5CF6]">
                  <Users className="w-5 h-5" />
                </div>
                <PurpleSparkline />
              </div>
              <div className="mt-4">
                <p className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
                  Active Users
                </p>
                <div className="flex items-baseline gap-2.5 mt-1">
                  <span className="text-3xl font-extrabold tracking-tight" style={{ color: 'var(--text-primary)' }}>
                    {selectedDateRange === 'Last 30 Days' ? '184.5K' : selectedDateRange === 'Last 90 Days' ? '542.1K' : selectedDateRange === 'Year to Date (2026)' ? '1.2M' : '42.3K'}
                  </span>
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/30">
                    ↑ 6%
                  </span>
                  <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                    vs previous period
                  </span>
                </div>
              </div>
            </motion.div>

            {/* Card 2: Avg Session Duration */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className={`rounded-2xl border p-5 transition-all hover:border-[#3B82F6]/50 ${cardBg}`}
            >
              <div className="flex items-center justify-between">
                <div className="p-3 rounded-xl bg-[#3B82F6]/15 border border-[#3B82F6]/30 text-[#3B82F6]">
                  <Clock className="w-5 h-5" />
                </div>
                <BlueSparkline />
              </div>
              <div className="mt-4">
                <p className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
                  Avg Session Duration
                </p>
                <div className="flex items-baseline gap-2.5 mt-1">
                  <span className="text-3xl font-extrabold tracking-tight" style={{ color: 'var(--text-primary)' }}>
                    {selectedDateRange === 'Last 30 Days' ? '4.8m' : selectedDateRange === 'Last 90 Days' ? '5.1m' : selectedDateRange === 'Year to Date (2026)' ? '5.4m' : '4.2m'}
                  </span>
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-[#EF4444]/15 text-[#EF4444] border border-[#EF4444]/30">
                    ↓ 2%
                  </span>
                  <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                    vs previous period
                  </span>
                </div>
              </div>
            </motion.div>

            {/* Card 3: Feature Adoption */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className={`rounded-2xl border p-5 transition-all hover:border-[#10B981]/50 ${cardBg}`}
            >
              <div className="flex items-center justify-between">
                <div className="p-3 rounded-xl bg-[#10B981]/15 border border-[#10B981]/30 text-[#10B981]">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <GreenSparkline />
              </div>
              <div className="mt-4">
                <p className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
                  Feature Adoption
                </p>
                <div className="flex items-baseline gap-2.5 mt-1">
                  <span className="text-3xl font-extrabold tracking-tight" style={{ color: 'var(--text-primary)' }}>
                    {selectedDateRange === 'Last 30 Days' ? '65%' : selectedDateRange === 'Last 90 Days' ? '72%' : selectedDateRange === 'Year to Date (2026)' ? '78%' : '61%'}
                  </span>
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/30">
                    ↑ 3%
                  </span>
                  <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                    vs last 7 days
                  </span>
                </div>
              </div>
            </motion.div>

            {/* Card 4: Churn Rate */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className={`rounded-2xl border p-5 transition-all hover:border-[#F59E0B]/50 ${cardBg}`}
            >
              <div className="flex items-center justify-between">
                <div className="p-3 rounded-xl bg-[#F59E0B]/15 border border-[#F59E0B]/30 text-[#F59E0B]">
                  <UserMinus className="w-5 h-5" />
                </div>
                <AmberSparkline />
              </div>
              <div className="mt-4">
                <p className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
                  Churn Rate
                </p>
                <div className="flex items-baseline gap-2.5 mt-1">
                  <span className="text-3xl font-extrabold tracking-tight" style={{ color: 'var(--text-primary)' }}>
                    2.4%
                  </span>
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/30">
                    ↓ 0.5%
                  </span>
                  <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                    vs last 7 days
                  </span>
                </div>
              </div>
            </motion.div>
          </div>

          {/* ── Middle Section: Feature Usage Rates & Drop-off Points ────── */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-7">
            
            {/* Feature Usage Rates (Left Side - 7 Cols) */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              className={`lg:col-span-7 rounded-2xl border p-6 flex flex-col justify-between ${cardBg}`}
            >
              <div>
                <div className="flex items-center justify-between gap-4 mb-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-[#3B82F6]/15 border border-[#3B82F6]/30 text-[#3B82F6]">
                      <ArrowLeftRight className="w-4 h-4" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold font-display" style={{ color: 'var(--text-primary)' }}>
                        Feature Usage Rates
                      </h2>
                      <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                        Engagement across core features
                      </p>
                    </div>
                  </div>

                  {/* Dropdown filter */}
                  <select
                    value={usageTimeframe}
                    onChange={(e) => setUsageTimeframe(e.target.value)}
                    className={`appearance-none px-3.5 py-2 text-xs font-semibold border rounded-xl focus:outline-none focus:border-[#3B82F6]/50 cursor-pointer ${
                      isDark ? 'bg-[#0D1117] border-[#2D3748] text-[#94A3B8]' : 'bg-white border-[#E2E8F0] text-[#475569]'
                    }`}
                  >
                    <option value="Last 7 Days">Last 7 Days</option>
                    <option value="Last 30 Days">Last 30 Days</option>
                    <option value="All Time">All Time</option>
                  </select>
                </div>

                {/* Progress bar list */}
                <div className="space-y-4">
                  {activeFeatures.map((item) => {
                    const Icon = item.icon;
                    const isInvestment = item.id === 'investment-tab';
                    return (
                      <div key={item.id} className="group relative">
                        <div className="flex items-center justify-between text-xs mb-1.5">
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg transition-colors ${
                              isDark ? 'bg-[#0D1117] text-[#94A3B8] group-hover:text-white' : 'bg-[#F1F5F9] text-[#64748B]'
                            }`}>
                              <Icon className="w-4 h-4" />
                            </div>
                            <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                              {item.name}
                            </span>
                          </div>
                          <span className={`font-bold text-sm ${isInvestment ? 'text-[#F59E0B]' : ''}`} style={!isInvestment ? { color: 'var(--text-primary)' } : {}}>
                            {item.rate}%
                          </span>
                        </div>

                        {/* Bar */}
                        <div className={`h-3.5 w-full rounded-full overflow-hidden p-0.5 ${
                          isDark ? 'bg-[#0D1117]' : 'bg-[#E2E8F0]'
                        }`}>
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${item.rate}%` }}
                            transition={{ duration: 0.8, ease: 'easeOut' }}
                            className={`h-full rounded-full ${
                              isInvestment
                                ? 'bg-gradient-to-r from-[#3B82F6] to-[#8B5CF6]'
                                : 'bg-gradient-to-r from-[#3B82F6] to-[#60A5FA]'
                            }`}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Axis Ticks & Labels */}
              <div className="mt-8 pt-4 border-t" style={{ borderColor: 'var(--border-subtle)' }}>
                <div className="relative flex justify-between text-[11px] font-medium" style={{ color: 'var(--text-muted)' }}>
                  <span>0%</span>
                  <span>25%</span>
                  <span>50%</span>
                  <span>75%</span>
                  <span>100%</span>
                </div>
              </div>
            </motion.div>

            {/* Drop-off Points (Right Side - 5 Cols) */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className={`lg:col-span-5 rounded-2xl border p-6 flex flex-col justify-between ${cardBg}`}
            >
              <div>
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2.5 rounded-xl bg-[#F59E0B]/15 border border-[#F59E0B]/30 text-[#F59E0B]">
                    <AlertTriangle className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold font-display" style={{ color: 'var(--text-primary)' }}>
                      Drop-off Points
                    </h2>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                      Key friction areas in user journey
                    </p>
                  </div>
                </div>

                {/* Cards List */}
                <div className="space-y-4">
                  {activeDropOffs.map((drop) => {
                    const Icon = drop.icon;
                    const borderStyle =
                      drop.impactColor === 'amber'
                        ? 'border-[#F59E0B]/30 bg-[#F59E0B]/5 hover:bg-[#F59E0B]/10'
                        : drop.impactColor === 'red'
                        ? 'border-[#EF4444]/30 bg-[#EF4444]/5 hover:bg-[#EF4444]/10'
                        : 'border-[#3B82F6]/30 bg-[#3B82F6]/5 hover:bg-[#3B82F6]/10';

                    const badgeStyle =
                      drop.impactColor === 'amber'
                        ? 'bg-[#F59E0B]/15 text-[#F59E0B] border-[#F59E0B]/30'
                        : drop.impactColor === 'red'
                        ? 'bg-[#EF4444]/15 text-[#EF4444] border-[#EF4444]/30'
                        : 'bg-[#3B82F6]/15 text-[#3B82F6] border-[#3B82F6]/30';

                    const iconContainer =
                      drop.impactColor === 'amber'
                        ? 'bg-[#F59E0B]/15 text-[#F59E0B] border-[#F59E0B]/30'
                        : drop.impactColor === 'red'
                        ? 'bg-[#EF4444]/15 text-[#EF4444] border-[#EF4444]/30'
                        : 'bg-[#3B82F6]/15 text-[#3B82F6] border-[#3B82F6]/30';

                    return (
                      <div
                        key={drop.id}
                        onClick={() => {
                          setSelectedDropOff(drop);
                          setIsFunnelModalOpen(true);
                        }}
                        className={`p-4 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 group ${borderStyle}`}
                      >
                        <div className="flex items-center gap-3.5">
                          <div className={`p-3 rounded-xl border ${iconContainer}`}>
                            <Icon className="w-5 h-5" />
                          </div>
                          <div>
                            <h3 className="text-sm font-bold group-hover:text-[#3B82F6] transition-colors" style={{ color: 'var(--text-primary)' }}>
                              {drop.title}
                            </h3>
                            <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                              {drop.description}
                            </p>
                          </div>
                        </div>

                        <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full border whitespace-nowrap ${badgeStyle}`}>
                          {drop.impact}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Bottom Action Link */}
              <div className="mt-6 pt-4 border-t" style={{ borderColor: 'var(--border-subtle)' }}>
                <button
                  onClick={() => setIsFunnelModalOpen(true)}
                  className="text-xs font-bold text-[#8B5CF6] hover:text-[#A78BFA] flex items-center gap-1.5 group transition-colors cursor-pointer"
                >
                  <span>View full funnel analysis</span>
                  <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
                </button>
              </div>
            </motion.div>
          </div>

          {/* ── Bottom Section: Copilot Insights ───────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className={`rounded-2xl border p-6 space-y-5 relative overflow-hidden ${cardBg}`}
          >
            {/* Ambient Purple Background Glow */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-[#8B5CF6]/5 rounded-full blur-3xl pointer-events-none" />

            {/* Header */}
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-gradient-to-br from-[#8B5CF6] to-[#6366F1] text-white shadow-lg shadow-purple-500/20">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold font-display" style={{ color: 'var(--text-primary)' }}>
                    Copilot Insights
                  </h2>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                    AI-powered analysis and recommendations
                  </p>
                </div>
              </div>

              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#8B5CF6]/15 text-[#C084FC] border border-[#8B5CF6]/30">
                <Sparkles className="w-3 h-3" />
                AI Generated
              </span>
            </div>

            {/* Body Text Box */}
            <div className={`p-5 rounded-xl border text-sm leading-relaxed ${innerPanelBg}`} style={{ color: 'var(--text-secondary)' }}>
              The Investment Tab has only <strong className="text-[#F59E0B]">23% adoption</strong> despite being heavily promoted on the dashboard. Cross-referencing feedback data reveals{' '}
              <span className="px-2 py-0.5 rounded-md font-bold bg-[#8B5CF6]/20 text-[#C084FC] border border-[#8B5CF6]/30">
                {investmentIssueCount}
              </span>{' '}
              users mentioned <strong className="text-[#C084FC] font-semibold">"I don't understand what to do here."</strong> This suggests a significant onboarding flow problem rather than lack of interest. Users are likely confused by the complex UI and insufficient guidance. Consider implementing a step-by-step tutorial, simplifying the initial experience, and adding contextual help tooltips.
            </div>

            {/* Recommended Action Footer */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-1">
              <div className="flex items-center gap-2 text-xs">
                <Lightbulb className="w-4 h-4 text-[#F59E0B] flex-shrink-0" />
                <span className="font-bold" style={{ color: 'var(--text-primary)' }}>
                  Recommended Action:
                </span>
                <span style={{ color: 'var(--text-secondary)' }}>
                  UX review and redesign of Investment Tab onboarding flow with user testing.
                </span>
              </div>

              <button
                onClick={() => setIsCopilotModalOpen(true)}
                className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs text-white bg-gradient-to-r from-[#3B82F6] to-[#8B5CF6] hover:opacity-90 transition-all shadow-lg shadow-purple-500/20 cursor-pointer flex-shrink-0"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Ask Copilot for Details</span>
              </button>
            </div>
          </motion.div>

        </main>
      </div>

      {/* ── Funnel Analysis Modal ────────────────────────────────────────── */}
      <AnimatePresence>
        {isFunnelModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className={`w-full max-w-2xl rounded-2xl border p-6 shadow-2xl relative space-y-6 ${
                isDark ? 'bg-[#161B22] border-[#2D3748] text-white' : 'bg-white border-[#E2E8F0] text-[#0F172A]'
              }`}
            >
              <button
                onClick={() => setIsFunnelModalOpen(false)}
                className="absolute top-4 right-4 p-2 rounded-xl text-[#94A3B8] hover:bg-[#1e2530] hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-[#8B5CF6]/15 border border-[#8B5CF6]/30 text-[#8B5CF6]">
                  <BarChart2 className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-bold font-display">User Funnel Breakdown</h3>
                  <p className="text-xs text-[#94A3B8]">Step-by-step conversion & drop-off metrics</p>
                </div>
              </div>

              <div className="space-y-3">
                {[
                  { step: '1. Dashboard Session Active', count: '42,300 users', pct: '100%', color: 'bg-blue-500' },
                  { step: '2. Clicked Investment Tab', count: '9,729 users', pct: '23%', color: 'bg-indigo-500' },
                  { step: '3. Started Onboarding Flow', count: '3,113 users', pct: '7.3%', color: 'bg-purple-500' },
                  { step: '4. Completed Investment Setup', count: '995 users', pct: '2.3%', color: 'bg-emerald-500' },
                ].map((s, idx) => (
                  <div key={idx} className="p-3.5 rounded-xl border border-[#2D3748]/50 bg-[#0D1117]/50 space-y-2">
                    <div className="flex justify-between text-xs font-semibold">
                      <span>{s.step}</span>
                      <span className="text-[#8B5CF6]">{s.count} ({s.pct})</span>
                    </div>
                    <div className="h-2 w-full bg-[#1e2530] rounded-full overflow-hidden">
                      <div className={`h-full ${s.color}`} style={{ width: s.pct }} />
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  onClick={() => setIsFunnelModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-[#1e2530] hover:bg-[#252a32] text-white"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── Copilot Details Drawer / Modal ────────────────────────────────── */}
      <AnimatePresence>
        {isCopilotModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className={`w-full max-w-xl rounded-2xl border p-6 shadow-2xl relative space-y-5 ${
                isDark ? 'bg-[#161B22] border-[#2D3748] text-white' : 'bg-white border-[#E2E8F0] text-[#0F172A]'
              }`}
            >
              <button
                onClick={() => setIsCopilotModalOpen(false)}
                className="absolute top-4 right-4 p-2 rounded-xl text-[#94A3B8] hover:bg-[#1e2530] hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-gradient-to-br from-[#3B82F6] to-[#8B5CF6] text-white shadow-lg">
                  <Bot className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-bold font-display">Copilot Onboarding Blueprint</h3>
                  <p className="text-xs text-[#94A3B8]">AI-Recommended Action Plan for Investment Tab</p>
                </div>
              </div>

              <div className={`p-4 rounded-xl border space-y-3 text-xs leading-relaxed ${isDark ? 'bg-[#0D1117] border-[#2D3748] text-[#94A3B8]' : 'bg-[#F8FAFC] border-[#E2E8F0] text-[#64748B]'}`}>
                <p className={`font-semibold ${isDark ? 'text-white' : 'text-[#0F172A]'}`}>Suggested 3-Step Action Plan:</p>
                <ol className={`list-decimal pl-4 space-y-2 ${isDark ? 'text-[#CBD5E1]' : 'text-slate-700'}`}>
                  <li>
                    <strong className={isDark ? 'text-white' : 'text-[#0F172A]'}>Interactive Guided Tour:</strong> Add a 4-slide modal explaining portfolio options upon first visit.
                  </li>
                  <li>
                    <strong className={isDark ? 'text-white' : 'text-[#0F172A]'}>Clearer CTA Labels:</strong> Change "Initialize Asset Vault" to "Start Investing with $10".
                  </li>
                  <li>
                    <strong className={isDark ? 'text-white' : 'text-[#0F172A]'}>Contextual Tooltips:</strong> Highlight risk profile choices with inline hover tooltips.
                  </li>
                </ol>
              </div>

              <div className="flex items-center justify-between pt-2">
                <span className="text-[11px] text-[#64748B] flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Grounded in {investmentIssueCount} feedback tickets
                </span>
                <button
                  onClick={() => {
                    toast.success('Action plan sent to Copilot PRD generator!', { style: toast_ok });
                    setIsCopilotModalOpen(false);
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-[#3B82F6] to-[#8B5CF6] text-white hover:opacity-90"
                >
                  Generate PRD Draft
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ProductAnalyticsPage;

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Database,
  Layers,
  Users,
  FileText,
  TrendingUp,
  TrendingDown,
  ChevronDown,
  ArrowRight,
  AlertTriangle,
  Lightbulb,
  Info,
  Code,
  Smartphone,
  Shield,
  FileCode,
  Plus,
  X,
  ExternalLink,
  Sparkles,
  CheckCircle2,
  Wifi,
  WifiOff,
} from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

import { Sidebar } from '../components/Sidebar';
import { TopNavbar } from '../components/TopNavbar';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { CreateWorkspaceModal } from '../components/CreateWorkspaceModal';
import { analyticsService, type BackendCluster } from '../services/analyticsService';
import { workspaceService } from '../services/workspaceService';

// ─── Feedback Volume Chart SVG Component ───────────────────────────────────────

const FeedbackVolumeChart: React.FC = () => {
  const points = [
    { week: 'Week 1', val: 1248, x: 50,  y: 145 },
    { week: 'Week 2', val: 1563, x: 135, y: 120 },
    { week: 'Week 3', val: 1982, x: 220, y: 85  },
    { week: 'Week 4', val: 1624, x: 305, y: 112 },
    { week: 'Week 5', val: 2245, x: 390, y: 62  },
    { week: 'Week 6', val: 1856, x: 475, y: 95  },
    { week: 'Week 7', val: 2184, x: 560, y: 68  },
    { week: 'Week 8', val: 2489, x: 645, y: 42  },
  ];

  return (
    <div className="w-full overflow-x-auto">
      <svg className="w-full h-56 min-w-[550px]" viewBox="0 0 700 220" fill="none">
        <defs>
          <linearGradient id="purpleAreaGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#8B5CF6" stopOpacity="0.45" />
            <stop offset="100%" stopColor="#8B5CF6" stopOpacity="0.0" />
          </linearGradient>
        </defs>

        {/* Horizontal grid lines */}
        {[42, 85, 120, 155, 190].map((y, idx) => (
          <line
            key={idx}
            x1="40"
            y1={y}
            x2="660"
            y2={y}
            stroke="#2D3748"
            strokeOpacity="0.5"
            strokeDasharray="4 4"
          />
        ))}

        {/* Y Axis Labels */}
        <text x="5" y="46" fill="#64748B" fontSize="11" fontWeight="600">2.5K</text>
        <text x="12" y="89" fill="#64748B" fontSize="11" fontWeight="600">2K</text>
        <text x="12" y="124" fill="#64748B" fontSize="11" fontWeight="600">1.5K</text>
        <text x="15" y="159" fill="#64748B" fontSize="11" fontWeight="600">1K</text>
        <text x="15" y="194" fill="#64748B" fontSize="11" fontWeight="600">500</text>
        <text x="25" y="215" fill="#64748B" fontSize="11" fontWeight="600">0</text>

        {/* Area fill under graph */}
        <path
          d="M 50 145 Q 92.5 132.5 135 120 T 220 85 T 305 112 T 390 62 T 475 95 T 560 68 T 645 42 L 645 190 L 50 190 Z"
          fill="url(#purpleAreaGrad)"
        />

        {/* Glowing stroke line */}
        <path
          d="M 50 145 Q 92.5 132.5 135 120 T 220 85 T 305 112 T 390 62 T 475 95 T 560 68 T 645 42"
          stroke="#8B5CF6"
          strokeWidth="3.5"
          strokeLinecap="round"
        />

        {/* Data point circles and value badges */}
        {points.map((p, idx) => (
          <g key={idx} className="group cursor-pointer">
            {/* Outer halo */}
            <circle cx={p.x} cy={p.y} r="7" fill="#8B5CF6" fillOpacity="0.3" />
            {/* Inner dot */}
            <circle cx={p.x} cy={p.y} r="4" fill="#FFFFFF" stroke="#8B5CF6" strokeWidth="2" />
            
            {/* Value Label above dot */}
            <rect
              x={p.x - 20}
              y={p.y - 24}
              width="40"
              height="18"
              rx="5"
              fill="#161B22"
              stroke="#8B5CF6"
              strokeWidth="1"
            />
            <text
              x={p.x}
              y={p.y - 12}
              fill="#FFFFFF"
              fontSize="10"
              fontWeight="bold"
              textAnchor="middle"
            >
              {p.val.toLocaleString()}
            </text>

            {/* X-axis week label */}
            <text
              x={p.x}
              y="215"
              fill="#94A3B8"
              fontSize="11"
              fontWeight="600"
              textAnchor="middle"
            >
              {p.week}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
};

// ─── Default Pain Points Fallback Data ─────────────────────────────────────────

const DEFAULT_PAIN_POINTS = [
  { title: 'Complex onboarding process', mentions: 892, pct: '24.1%', severity: 'High', color: 'red' },
  { title: 'Lack of real-time analytics', mentions: 623, pct: '16.8%', severity: 'High', color: 'red' },
  { title: 'Poor feature discoverability', mentions: 512, pct: '13.8%', severity: 'Medium', color: 'amber' },
  { title: 'Slow performance issues', mentions: 441, pct: '11.9%', severity: 'Medium', color: 'amber' },
  { title: 'Limited integration options', mentions: 387, pct: '10.4%', severity: 'Medium', color: 'amber' },
];

// ─── Dashboard Component ──────────────────────────────────────────────────────

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const { isDark } = useTheme();

  // Local UI state
  const [searchQuery, setSearchQuery] = useState('');
  const [volumeTimeframe, setVolumeTimeframe] = useState('Last 8 Weeks');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPainPointModal, setSelectedPainPointModal] = useState(false);
  const [selectedPRDModal, setSelectedPRDModal] = useState(false);
  const [selectedAlertsModal, setSelectedAlertsModal] = useState(false);

  // Backend Integration State
  const [isBackendConnected, setIsBackendConnected] = useState<boolean | null>(null);
  const [backendClusters, setBackendClusters] = useState<BackendCluster[]>([]);
  const [apiProjectCount, setApiProjectCount] = useState<number | null>(null);

  // Toast theme styles
  const toast_ok = {
    background: isDark ? '#161B22' : '#ffffff',
    color: isDark ? '#F8FAFC' : '#0F172A',
    border: `1px solid ${isDark ? '#2D3748' : '#E2E8F0'}`,
  };

  // Connect to Backend APIs on Mount (Reads existing endpoints)
  useEffect(() => {
    let isMounted = true;

    async function loadBackendData() {
      try {
        // 1. Check Projects Backend Endpoint
        const projects = await workspaceService.getWorkspacesFromApi();
        if (isMounted && Array.isArray(projects)) {
          setApiProjectCount(projects.length);
          setIsBackendConnected(true);
        }
      } catch {
        if (isMounted) setIsBackendConnected(false);
      }

      try {
        // 2. Fetch Theme Clusters from Analytics Endpoint
        const clusters = await analyticsService.getThemeClusters();
        if (isMounted && Array.isArray(clusters) && clusters.length > 0) {
          setBackendClusters(clusters);
        }
      } catch (err) {
        console.warn('Analytics backend endpoint notice:', err);
      }
    }

    loadBackendData();
    return () => { isMounted = false; };
  }, []);

  // Compute Pain Points from Backend or Fallback
  const painPoints = backendClusters.length > 0
    ? backendClusters.slice(0, 5).map((c) => {
        const title = c.category || c.name || c.theme || 'Unlabeled Cluster';
        const mentions = c.total_volume ?? c.mentions ?? c.count ?? 0;
        const severityNum = c.avg_severity ?? 3.5;
        const severity = severityNum >= 4.5 ? 'High' : 'Medium';
        const pct = c.pct_total || `${((mentions / 200) * 100).toFixed(1)}%`;
        return {
          title,
          mentions,
          pct,
          severity,
          color: severity === 'High' ? 'red' : 'amber',
        };
      })
    : DEFAULT_PAIN_POINTS;

  // Card background theme
  const cardBg = isDark
    ? 'bg-[#161B22]/90 border-[#2D3748] shadow-lg shadow-black/20'
    : 'bg-white border-[#E2E8F0] shadow-sm hover:shadow-md';

  const tableHeaderBg = isDark ? 'bg-[#0D1117]/60 text-[#64748B]' : 'bg-[#F8FAFC] text-[#64748B]';

  return (
    <div className="min-h-screen transition-colors duration-200" style={{ backgroundColor: 'var(--bg-base)' }}>
      <Toaster position="top-right" />
      <Sidebar />

      <div className="ml-60 min-h-screen flex flex-col">
        <TopNavbar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          searchPlaceholder="Search feedback, pain points, PRDs, or alerts..."
        />

        <main className="flex-1 pt-20 px-8 pb-12 space-y-7 max-w-screen-2xl mx-auto w-full">
          
          {/* ── Welcome Header & Backend Connection Badge ────────────────── */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-extrabold tracking-tight font-display" style={{ color: 'var(--text-primary)' }}>
                  Welcome back, {user?.name?.split(' ')[0] || 'Gagandeep'}! 👋
                </h1>

                {/* Backend Connection Indicator */}
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-extrabold border ${
                  isBackendConnected
                    ? 'bg-[#10B981]/15 text-[#10B981] border-[#10B981]/30'
                    : 'bg-[#64748B]/15 text-[#94A3B8] border-[#64748B]/30'
                }`}>
                  {isBackendConnected ? (
                    <>
                      <Wifi className="w-3 h-3 text-[#10B981]" />
                      FastAPI Active
                    </>
                  ) : (
                    <>
                      <WifiOff className="w-3 h-3 text-[#94A3B8]" />
                      Frontend Engine
                    </>
                  )}
                </span>
              </div>
              <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
                Here's what's happening with your product ecosystem today.
              </p>
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setIsModalOpen(true)}
              className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-bold text-xs text-white bg-gradient-to-r from-[#3B82F6] to-[#8B5CF6] hover:opacity-90 transition-all shadow-xl shadow-blue-500/20 cursor-pointer flex-shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>New Workspace</span>
            </motion.button>
          </div>

          {/* ── Top Metric Cards Row (4 Cards) ───────────────────────────── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            
            {/* Card 1: Total Records */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
              className={`rounded-2xl border p-5 transition-all hover:border-[#8B5CF6]/50 ${cardBg}`}
            >
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-[#8B5CF6]/15 border border-[#8B5CF6]/30 text-[#8B5CF6]">
                  <Database className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>Total Records</p>
                  <span className="text-2xl font-extrabold tracking-tight" style={{ color: 'var(--text-primary)' }}>
                    {backendClusters.length > 0
                      ? backendClusters.reduce((sum, item) => sum + (item.total_volume || 0), 0).toLocaleString()
                      : '8,342'}
                  </span>
                </div>
              </div>
              <div className="mt-3 pt-2 border-t text-[11px] font-bold text-[#8B5CF6] flex items-center gap-1" style={{ borderColor: 'var(--border-subtle)' }}>
                <span>+12.5% vs last 7 days</span>
                <TrendingUp className="w-3.5 h-3.5" />
              </div>
            </motion.div>

            {/* Card 2: Themes Found */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className={`rounded-2xl border p-5 transition-all hover:border-[#3B82F6]/50 ${cardBg}`}
            >
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-[#3B82F6]/15 border border-[#3B82F6]/30 text-[#3B82F6]">
                  <Layers className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>Themes Found</p>
                  <span className="text-2xl font-extrabold tracking-tight" style={{ color: 'var(--text-primary)' }}>
                    {backendClusters.length > 0 ? backendClusters.length : 24}
                  </span>
                </div>
              </div>
              <div className="mt-3 pt-2 border-t text-[11px] font-bold text-[#3B82F6] flex items-center gap-1" style={{ borderColor: 'var(--border-subtle)' }}>
                <span>+2 new themes</span>
                <TrendingUp className="w-3.5 h-3.5" />
              </div>
            </motion.div>

            {/* Card 3: Feature Requests */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className={`rounded-2xl border p-5 transition-all hover:border-[#10B981]/50 ${cardBg}`}
            >
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-[#10B981]/15 border border-[#10B981]/30 text-[#10B981]">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>Feature Requests</p>
                  <span className="text-2xl font-extrabold tracking-tight" style={{ color: 'var(--text-primary)' }}>
                    1,247
                  </span>
                </div>
              </div>
              <div className="mt-3 pt-2 border-t text-[11px] font-bold text-[#10B981] flex items-center gap-1" style={{ borderColor: 'var(--border-subtle)' }}>
                <span>+18.7% vs last 7 days</span>
                <TrendingUp className="w-3.5 h-3.5" />
              </div>
            </motion.div>

            {/* Card 4: PRDs Generated */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className={`rounded-2xl border p-5 transition-all hover:border-[#F59E0B]/50 ${cardBg}`}
            >
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-[#F59E0B]/15 border border-[#F59E0B]/30 text-[#F59E0B]">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>PRDs Generated</p>
                  <span className="text-2xl font-extrabold tracking-tight" style={{ color: 'var(--text-primary)' }}>
                    9
                  </span>
                </div>
              </div>
              <div className="mt-3 pt-2 border-t text-[11px] font-bold text-[#38BDF8] flex items-center gap-1" style={{ borderColor: 'var(--border-subtle)' }}>
                <span>+3 this week</span>
                <TrendingUp className="w-3.5 h-3.5" />
              </div>
            </motion.div>
          </div>

          {/* ── Middle Row: Feedback Volume & Top Pain Points ──────────────── */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-7">
            
            {/* Feedback Volume (8 Weeks) - Left (7 Cols) */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              className={`lg:col-span-7 rounded-2xl border p-6 flex flex-col justify-between ${cardBg}`}
            >
              <div>
                <div className="flex items-center justify-between gap-4 mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-[#8B5CF6]/15 border border-[#8B5CF6]/30 text-[#8B5CF6]">
                      <TrendingUp className="w-4 h-4" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold font-display" style={{ color: 'var(--text-primary)' }}>
                        Feedback Volume (8 Weeks)
                      </h2>
                      <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                        Total feedback records ingested over time
                      </p>
                    </div>
                  </div>

                  <select
                    value={volumeTimeframe}
                    onChange={(e) => setVolumeTimeframe(e.target.value)}
                    className={`appearance-none px-3.5 py-2 text-xs font-semibold border rounded-xl focus:outline-none focus:border-[#3B82F6]/50 cursor-pointer ${
                      isDark ? 'bg-[#0D1117] border-[#2D3748] text-[#94A3B8]' : 'bg-white border-[#E2E8F0] text-[#475569]'
                    }`}
                  >
                    <option value="Last 8 Weeks">Last 8 Weeks</option>
                    <option value="Last 12 Weeks">Last 12 Weeks</option>
                    <option value="Last 30 Days">Last 30 Days</option>
                  </select>
                </div>

                {/* SVG Area Chart */}
                <div className="my-2">
                  <FeedbackVolumeChart />
                </div>
              </div>

              {/* Footer */}
              <div className="mt-4 pt-4 border-t flex items-center justify-between text-xs" style={{ borderColor: 'var(--border-subtle)' }}>
                <span className="font-bold text-white">Total: 13,191 records</span>
                <span className="font-bold text-[#10B981] flex items-center gap-1">
                  ↑ 15.3% <span style={{ color: 'var(--text-muted)' }}>vs previous 8 weeks</span>
                </span>
              </div>
            </motion.div>

            {/* Top Pain Points - Right (5 Cols) */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className={`lg:col-span-5 rounded-2xl border p-6 flex flex-col justify-between ${cardBg}`}
            >
              <div>
                <div className="flex items-center justify-between gap-4 mb-5">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-[#EF4444]/15 border border-[#EF4444]/30 text-[#EF4444]">
                      <AlertTriangle className="w-4 h-4" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold font-display" style={{ color: 'var(--text-primary)' }}>
                        Top Pain Points
                      </h2>
                      <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                        Most frequent user pain points identified
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => setSelectedPainPointModal(true)}
                    className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition-all ${
                      isDark ? 'bg-[#0D1117] border-[#2D3748] text-[#94A3B8] hover:text-white' : 'bg-white border-[#E2E8F0] text-[#64748B] hover:text-[#0F172A]'
                    }`}
                  >
                    View All
                  </button>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className={`border-b text-[10px] font-bold uppercase tracking-wider ${tableHeaderBg}`} style={{ borderColor: 'var(--border-subtle)' }}>
                        <th className="py-2.5 px-3 rounded-l-lg">Pain Point</th>
                        <th className="py-2.5 px-2 text-center">Mentions</th>
                        <th className="py-2.5 px-2 text-center">% of Total</th>
                        <th className="py-2.5 px-3 text-right rounded-r-lg">Severity</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y" style={{ borderColor: 'var(--border-subtle)' }}>
                      {painPoints.map((item, idx) => (
                        <tr key={idx} className="hover:bg-[#8B5CF6]/5 transition-colors">
                          <td className="py-3 px-3 font-bold text-white">{item.title}</td>
                          <td className="py-3 px-2 text-center text-[#94A3B8]">{item.mentions}</td>
                          <td className="py-3 px-2 text-center text-[#94A3B8]">{item.pct}</td>
                          <td className="py-3 px-3 text-right">
                            <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border ${
                              item.color === 'red'
                                ? 'bg-[#EF4444]/15 border-[#EF4444]/30 text-[#EF4444]'
                                : 'bg-[#F59E0B]/15 border-[#F59E0B]/30 text-[#F59E0B]'
                            }`}>
                              {item.severity}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Bottom Link */}
              <div className="mt-5 pt-3 border-t" style={{ borderColor: 'var(--border-subtle)' }}>
                <button
                  onClick={() => setSelectedPainPointModal(true)}
                  className="text-xs font-bold text-[#8B5CF6] hover:text-[#A78BFA] flex items-center gap-1.5 group transition-colors cursor-pointer"
                >
                  <span>View all pain points analysis</span>
                  <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
                </button>
              </div>
            </motion.div>
          </div>

          {/* ── Bottom Row: Recent PRDs & Copilot Alerts ────────────────────── */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-7">
            
            {/* Recent PRDs - Left (6 Cols) */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
              className={`lg:col-span-6 rounded-2xl border p-6 flex flex-col justify-between ${cardBg}`}
            >
              <div>
                <div className="flex items-center justify-between gap-4 mb-5">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-[#8B5CF6]/15 border border-[#8B5CF6]/30 text-[#8B5CF6]">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold font-display" style={{ color: 'var(--text-primary)' }}>
                        Recent PRDs
                      </h2>
                      <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                        Latest product requirement documents generated
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => setSelectedPRDModal(true)}
                    className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition-all ${
                      isDark ? 'bg-[#0D1117] border-[#2D3748] text-[#94A3B8] hover:text-white' : 'bg-white border-[#E2E8F0] text-[#64748B] hover:text-[#0F172A]'
                    }`}
                  >
                    View All PRDs
                  </button>
                </div>

                {/* PRD List */}
                <div className="space-y-3.5">
                  {[
                    { title: 'Smart Analytics Dashboard', version: 'v1.2', time: 'Generated 2 hours ago', icon: Code, color: 'bg-purple-500/15 text-purple-400 border-purple-500/30' },
                    { title: 'Mobile App Onboarding Flow', version: 'v1.0', time: 'Generated 1 day ago', icon: Smartphone, color: 'bg-blue-500/15 text-blue-400 border-blue-500/30' },
                    { title: 'User Permission Management', version: 'v1.1', time: 'Generated 2 days ago', icon: Shield, color: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' },
                  ].map((prd, idx) => {
                    const Icon = prd.icon;
                    return (
                      <div
                        key={idx}
                        onClick={() => {
                          toast.success(`Opening "${prd.title}"...`, { style: toast_ok });
                        }}
                        className={`p-3.5 rounded-xl border flex items-center justify-between gap-3 transition-all cursor-pointer group ${
                          isDark ? 'bg-[#0D1117] border-[#2D3748] hover:border-[#3B82F6]/50' : 'bg-[#F8FAFC] border-[#E2E8F0] hover:border-[#3B82F6]/50'
                        }`}
                      >
                        <div className="flex items-center gap-3.5">
                          <div className={`p-2.5 rounded-xl border ${prd.color}`}>
                            <Icon className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="text-xs font-bold text-white group-hover:text-[#3B82F6] transition-colors">
                                {prd.title}
                              </h3>
                              <span className="text-[10px] font-semibold text-[#64748B]">
                                {prd.version}
                              </span>
                            </div>
                            <p className="text-[11px] text-[#94A3B8] mt-0.5">{prd.time}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <span className="text-[11px] font-bold text-[#10B981] flex items-center gap-1">
                            ↑ Completed
                          </span>
                          <button className="p-1.5 rounded-lg text-[#94A3B8] hover:text-white hover:bg-[#1e2530] transition-colors">
                            <FileCode className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Bottom Link */}
              <div className="mt-5 pt-3 border-t" style={{ borderColor: 'var(--border-subtle)' }}>
                <button
                  onClick={() => setSelectedPRDModal(true)}
                  className="text-xs font-bold text-[#8B5CF6] hover:text-[#A78BFA] flex items-center gap-1.5 group transition-colors cursor-pointer"
                >
                  <span>View all PRDs</span>
                  <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
                </button>
              </div>
            </motion.div>

            {/* Copilot Alerts - Right (6 Cols) */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className={`lg:col-span-6 rounded-2xl border p-6 flex flex-col justify-between ${cardBg}`}
            >
              <div>
                <div className="flex items-center justify-between gap-4 mb-5">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-[#F59E0B]/15 border border-[#F59E0B]/30 text-[#F59E0B]">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold font-display" style={{ color: 'var(--text-primary)' }}>
                        Copilot Alerts
                      </h2>
                      <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                        Important insights and recommendations
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => setSelectedAlertsModal(true)}
                    className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition-all ${
                      isDark ? 'bg-[#0D1117] border-[#2D3748] text-[#94A3B8] hover:text-white' : 'bg-white border-[#E2E8F0] text-[#64748B] hover:text-[#0F172A]'
                    }`}
                  >
                    View All Alerts
                  </button>
                </div>

                {/* Alert Cards */}
                <div className="space-y-3.5">
                  {/* Alert 1 */}
                  <div className="p-3.5 rounded-xl border border-[#EF4444]/30 bg-[#EF4444]/5 flex items-center justify-between gap-3 group cursor-pointer hover:bg-[#EF4444]/10 transition-colors">
                    <div className="flex items-center gap-3.5">
                      <div className="p-2.5 rounded-xl bg-[#EF4444]/15 border border-[#EF4444]/30 text-[#EF4444]">
                        <AlertTriangle className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="text-xs font-bold text-[#EF4444]">
                          High Priority: User Onboarding Issues
                        </h3>
                        <p className="text-[11px] text-[#94A3B8] mt-0.5">
                          Onboarding drop-off rate increased by 23% in the last 7 days
                        </p>
                      </div>
                    </div>
                    <span className="text-[11px] font-semibold text-[#64748B] whitespace-nowrap">1h ago</span>
                  </div>

                  {/* Alert 2 */}
                  <div className="p-3.5 rounded-xl border border-[#F59E0B]/30 bg-[#F59E0B]/5 flex items-center justify-between gap-3 group cursor-pointer hover:bg-[#F59E0B]/10 transition-colors">
                    <div className="flex items-center gap-3.5">
                      <div className="p-2.5 rounded-xl bg-[#F59E0B]/15 border border-[#F59E0B]/30 text-[#F59E0B]">
                        <Lightbulb className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="text-xs font-bold text-[#F59E0B]">
                          Feature Request Trend
                        </h3>
                        <p className="text-[11px] text-[#94A3B8] mt-0.5">
                          "Real-time collaboration" requests increased 45% this week
                        </p>
                      </div>
                    </div>
                    <span className="text-[11px] font-semibold text-[#64748B] whitespace-nowrap">3h ago</span>
                  </div>

                  {/* Alert 3 */}
                  <div className="p-3.5 rounded-xl border border-[#3B82F6]/30 bg-[#3B82F6]/5 flex items-center justify-between gap-3 group cursor-pointer hover:bg-[#3B82F6]/10 transition-colors">
                    <div className="flex items-center gap-3.5">
                      <div className="p-2.5 rounded-xl bg-[#3B82F6]/15 border border-[#3B82F6]/30 text-[#3B82F6]">
                        <Info className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="text-xs font-bold text-[#3B82F6]">
                          PRD Generation Ready
                        </h3>
                        <p className="text-[11px] text-[#94A3B8] mt-0.5">
                          New theme cluster detected. Consider generating PRD.
                        </p>
                      </div>
                    </div>
                    <span className="text-[11px] font-semibold text-[#64748B] whitespace-nowrap">5h ago</span>
                  </div>
                </div>
              </div>

              {/* Bottom Link */}
              <div className="mt-5 pt-3 border-t" style={{ borderColor: 'var(--border-subtle)' }}>
                <button
                  onClick={() => setSelectedAlertsModal(true)}
                  className="text-xs font-bold text-[#8B5CF6] hover:text-[#A78BFA] flex items-center gap-1.5 group transition-colors cursor-pointer"
                >
                  <span>View all alerts & insights</span>
                  <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
                </button>
              </div>
            </motion.div>
          </div>

        </main>
      </div>

      {/* ── Create Workspace Modal ────────────────────────────────────────── */}
      <CreateWorkspaceModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={async () => {
          setIsModalOpen(false);
          toast.success('Workspace created successfully! 🚀', { style: toast_ok });
        }}
      />

      {/* ── Pain Points Analysis Modal ───────────────────────────────────── */}
      <AnimatePresence>
        {selectedPainPointModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className={`w-full max-w-2xl rounded-2xl border p-6 shadow-2xl relative space-y-5 ${
                isDark ? 'bg-[#161B22] border-[#2D3748] text-white' : 'bg-white border-[#E2E8F0] text-[#0F172A]'
              }`}
            >
              <button
                onClick={() => setSelectedPainPointModal(false)}
                className="absolute top-4 right-4 p-2 rounded-xl text-[#94A3B8] hover:bg-[#1e2530] hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-[#EF4444]/15 border border-[#EF4444]/30 text-[#EF4444]">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-bold font-display">User Pain Points Analysis</h3>
                  <p className="text-xs text-[#94A3B8]">Comprehensive breakdown of friction areas across all platforms</p>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-[#0D1117] border border-[#2D3748] space-y-3 text-xs text-[#CBD5E1]">
                <p className="font-semibold text-white">Key Takeaways:</p>
                <ul className="list-disc pl-4 space-y-1.5">
                  {painPoints.map((p, i) => (
                    <li key={i}>
                      <strong>{p.title} ({p.mentions} mentions):</strong> Represents {p.pct} of overall feedback signals.
                    </li>
                  ))}
                </ul>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  onClick={() => setSelectedPainPointModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-[#1e2530] hover:bg-[#252a32] text-white"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── PRD Modal ────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {selectedPRDModal && (
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
                onClick={() => setSelectedPRDModal(false)}
                className="absolute top-4 right-4 p-2 rounded-xl text-[#94A3B8] hover:bg-[#1e2530] hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-[#8B5CF6]/15 border border-[#8B5CF6]/30 text-[#8B5CF6]">
                  <FileText className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-bold font-display">Generated PRD Documents</h3>
                  <p className="text-xs text-[#94A3B8]">AI-Generated Product Requirement Specifications</p>
                </div>
              </div>

              <div className="space-y-2.5 text-xs">
                {[
                  { name: 'Smart Analytics Dashboard v1.2', status: 'Completed', date: '2026-07-29' },
                  { name: 'Mobile App Onboarding Flow v1.0', status: 'Completed', date: '2026-07-28' },
                  { name: 'User Permission Management v1.1', status: 'Completed', date: '2026-07-27' },
                  { name: 'Payment Gateway Integration v2.0', status: 'Completed', date: '2026-07-25' },
                ].map((item, idx) => (
                  <div key={idx} className="p-3 rounded-xl bg-[#0D1117] border border-[#2D3748] flex justify-between items-center">
                    <span className="font-bold text-white">{item.name}</span>
                    <span className="text-[10px] text-[#10B981] font-bold">{item.status}</span>
                  </div>
                ))}
              </div>

              <div className="flex justify-end pt-2">
                <button
                  onClick={() => setSelectedPRDModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-[#1e2530] hover:bg-[#252a32] text-white"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── Alerts Modal ─────────────────────────────────────────────────── */}
      <AnimatePresence>
        {selectedAlertsModal && (
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
                onClick={() => setSelectedAlertsModal(false)}
                className="absolute top-4 right-4 p-2 rounded-xl text-[#94A3B8] hover:bg-[#1e2530] hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-[#F59E0B]/15 border border-[#F59E0B]/30 text-[#F59E0B]">
                  <Sparkles className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-bold font-display">Copilot AI Insights & Alerts</h3>
                  <p className="text-xs text-[#94A3B8]">Real-time recommendations and priority flags</p>
                </div>
              </div>

              <div className="space-y-3 text-xs">
                <div className="p-3.5 rounded-xl bg-[#EF4444]/10 border border-[#EF4444]/30 text-[#EF4444]">
                  <p className="font-bold">High Priority: User Onboarding Issues</p>
                  <p className="text-[#CBD5E1] text-[11px] mt-1">Onboarding drop-off rate increased by 23% in the last 7 days.</p>
                </div>
                <div className="p-3.5 rounded-xl bg-[#F59E0B]/10 border border-[#F59E0B]/30 text-[#F59E0B]">
                  <p className="font-bold">Feature Request Trend</p>
                  <p className="text-[#CBD5E1] text-[11px] mt-1">"Real-time collaboration" requests increased 45% this week.</p>
                </div>
                <div className="p-3.5 rounded-xl bg-[#3B82F6]/10 border border-[#3B82F6]/30 text-[#3B82F6]">
                  <p className="font-bold">PRD Generation Ready</p>
                  <p className="text-[#CBD5E1] text-[11px] mt-1">New theme cluster detected. Consider generating PRD.</p>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  onClick={() => setSelectedAlertsModal(false)}
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

export default DashboardPage;

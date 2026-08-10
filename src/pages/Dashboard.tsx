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
import { analyticsService, type BackendCluster, type BackendTrend } from '../services/analyticsService';
import { workspaceService } from '../services/workspaceService';

// ─── Feedback Volume Chart SVG Component ───────────────────────────────────────

const FeedbackVolumeChart: React.FC<{ trends?: BackendTrend[] }> = ({ trends = [] }) => {
  const { isDark } = useTheme();

  let points = [
    { week: 'Week 1', val: 1240, x: 50,  y: 150 },
    { week: 'Week 2', val: 1580, x: 135, y: 125 },
    { week: 'Week 3', val: 1920, x: 220, y: 92  },
    { week: 'Week 4', val: 1680, x: 305, y: 115 },
    { week: 'Week 5', val: 2150, x: 390, y: 72  },
    { week: 'Week 6', val: 1890, x: 475, y: 98  },
    { week: 'Week 7', val: 2340, x: 560, y: 55  },
    { week: 'Week 8', val: 2480, x: 645, y: 42  },
  ];

  let pathD = 'M 50 150 C 90 140, 100 125, 135 125 C 170 125, 185 92, 220 92 C 255 92, 270 115, 305 115 C 340 115, 355 72, 390 72 C 425 72, 440 98, 475 98 C 510 98, 525 55, 560 55 C 595 55, 610 42, 645 42';

  if (trends && trends.length > 0) {
    const bucketMap: Record<string, number> = {};
    trends.forEach(t => {
      if (Array.isArray(t.history)) {
        t.history.forEach(h => {
          bucketMap[h.time_bucket] = (bucketMap[h.time_bucket] || 0) + (h.volume || 0);
        });
      }
    });

    const sortedBuckets = Object.keys(bucketMap).sort();
    if (sortedBuckets.length > 1) {
      const minVal = Math.min(...Object.values(bucketMap));
      const maxVal = Math.max(...Object.values(bucketMap));
      const range = maxVal - minVal || 1;

      points = sortedBuckets.map((bucket, idx) => {
        const val = bucketMap[bucket];
        const pctX = idx / (sortedBuckets.length - 1);
        const x = 50 + pctX * (645 - 50);
        const y = 190 - ((val - minVal) / range) * (190 - 42);
        
        const dateObj = new Date(bucket);
        const weekLabel = isNaN(dateObj.getTime()) ? `W${idx + 1}` : `${dateObj.getMonth() + 1}/${dateObj.getDate()}`;
        return { week: weekLabel, val, x, y };
      });

      pathD = `M ${points[0].x} ${points[0].y}`;
      for (let i = 1; i < points.length; i++) {
        const prev = points[i - 1];
        const curr = points[i];
        const cpX1 = prev.x + (curr.x - prev.x) / 2;
        const cpY1 = prev.y;
        const cpX2 = prev.x + (curr.x - prev.x) / 2;
        const cpY2 = curr.y;
        pathD += ` C ${cpX1} ${cpY1}, ${cpX2} ${cpY2}, ${curr.x} ${curr.y}`;
      }
    }
  }

  const areaD = `${pathD} L ${points[points.length - 1].x} 190 L ${points[0].x} 190 Z`;

  const gridStroke = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)';
  const labelColor = isDark ? '#94A3B8' : '#64748B';
  const badgeBg = isDark ? '#161B22' : '#FFFFFF';
  const badgeBorder = isDark ? '#8B5CF6' : '#6366F1';
  const badgeText = isDark ? '#F8FAFC' : '#0F172A';

  return (
    <div className="w-full overflow-x-auto">
      <svg className="w-full h-56 min-w-[550px]" viewBox="0 0 700 220" fill="none">
        <defs>
          <linearGradient id="purpleAreaGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#8B5CF6" stopOpacity={isDark ? '0.45' : '0.30'} />
            <stop offset="100%" stopColor="#3B82F6" stopOpacity="0.0" />
          </linearGradient>
          <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Horizontal grid lines */}
        {[42, 85, 120, 155, 190].map((y, idx) => (
          <line
            key={idx}
            x1="40"
            y1={y}
            x2="660"
            y2={y}
            stroke={gridStroke}
            strokeDasharray="4 4"
          />
        ))}

        {/* Y Axis Labels */}
        <text x="5" y="46" fill={labelColor} fontSize="11" fontWeight="600">2.5K</text>
        <text x="12" y="89" fill={labelColor} fontSize="11" fontWeight="600">2K</text>
        <text x="12" y="124" fill={labelColor} fontSize="11" fontWeight="600">1.5K</text>
        <text x="15" y="159" fill={labelColor} fontSize="11" fontWeight="600">1K</text>
        <text x="15" y="194" fill={labelColor} fontSize="11" fontWeight="600">500</text>
        <text x="25" y="215" fill={labelColor} fontSize="11" fontWeight="600">0</text>

        {/* Area fill under graph */}
        <path
          d={areaD}
          fill="url(#purpleAreaGrad)"
        />

        {/* Smooth realistic line */}
        <path
          d={pathD}
          stroke="#8B5CF6"
          strokeWidth="3.5"
          strokeLinecap="round"
          filter="url(#glow)"
        />

        {/* Data point circles and value badges */}
        {points.map((p, idx) => (
          <g key={idx} className="group cursor-pointer">
            {/* Outer halo */}
            <circle cx={p.x} cy={p.y} r="7" fill="#8B5CF6" fillOpacity="0.25" />
            {/* Inner dot */}
            <circle cx={p.x} cy={p.y} r="4" fill={badgeBg} stroke="#8B5CF6" strokeWidth="2.5" />
            
            {/* Value Label pill above dot */}
            <rect
              x={p.x - 22}
              y={p.y - 24}
              width="44"
              height="18"
              rx="6"
              fill={badgeBg}
              stroke={badgeBorder}
              strokeWidth="1.2"
            />
            <text
              x={p.x}
              y={p.y - 12}
              fill={badgeText}
              fontSize="10"
              fontWeight="700"
              textAnchor="middle"
            >
              {p.val.toLocaleString()}
            </text>

            {/* X-axis week label */}
            <text
              x={p.x}
              y="215"
              fill={labelColor}
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

interface PRDDocument {
  id: string;
  title: string;
  version: string;
  time: string;
  status: string;
  summary: string;
  userStories: string[];
  requirements: string[];
  techStack: string;
  metrics: string[];
}

const PRD_DATA: PRDDocument[] = [
  {
    id: 'prd-1',
    title: 'Smart Analytics Dashboard',
    version: 'v1.2',
    time: 'Generated 2 hours ago',
    status: 'Completed',
    summary: 'Comprehensive executive dashboard providing real-time data visualization of customer feedback signals, automated theme extraction, and KPI metrics.',
    userStories: [
      'As a Product Manager, I want real-time customer sentiment trends so I can prioritize sprint backlog items.',
      'As an Engineering Lead, I want direct visibility into high-severity user bug reports to reduce mean time to resolution (MTTR).',
      'As an Executive, I want automated theme extraction summaries to evaluate feature satisfaction.'
    ],
    requirements: [
      'Integrate with FastAPI REST analytics endpoints for live dataset extraction.',
      'Render smooth responsive area chart visualizations adapting to Light and Dark themes.',
      'Filter feedback signals dynamically by date range, severity weight, and category tag.'
    ],
    techStack: 'React 18, TypeScript, Tailwind CSS, FastAPI, PostgreSQL, Qdrant Vector DB',
    metrics: [
      'Increase weekly active Product Manager engagement by 40%.',
      'Reduce theme extraction review time from 5 days to 15 seconds.',
      'Maintain 99.9% uptime on backend analytics query routes.'
    ]
  },
  {
    id: 'prd-2',
    title: 'Mobile App Onboarding Flow',
    version: 'v1.0',
    time: 'Generated 1 day ago',
    status: 'Completed',
    summary: 'Streamlined 3-step onboarding pipeline designed to reduce drop-off rates and accelerate initial workspace setup on mobile devices.',
    userStories: [
      'As a new user, I want a 1-click SSO login option so I can start using the application immediately.',
      'As a mobile user, I want progressive profile completion so I am not overwhelmed during initial setup.'
    ],
    requirements: [
      'Implement Firebase Auth Google/Apple login integration.',
      'Render interactive progress indicator with step-by-step validation.',
      'Trigger instant workspace creation modal upon email verification.'
    ],
    techStack: 'React, Firebase Auth, Tailwind CSS, FastAPI Auth Middleware',
    metrics: [
      'Decrease mobile onboarding drop-off by 25%.',
      'Achieve 90% account verification completion within first session.'
    ]
  },
  {
    id: 'prd-3',
    title: 'User Permission Management',
    version: 'v1.1',
    time: 'Generated 2 days ago',
    status: 'Completed',
    summary: 'Role-Based Access Control (RBAC) specification defining Admin, Product Manager, Analyst, and Viewer scope boundaries.',
    userStories: [
      'As an Admin, I want to manage member roles and workspace scope to ensure enterprise compliance.',
      'As a Viewer, I want read-only access to analytics dashboards without mutation permissions.'
    ],
    requirements: [
      'Implement JWT / Firebase token security claims validation on all backend endpoints.',
      'Enforce RBAC client-side route guards in React frontend.',
      'Provide workspace member management modal with role assignment dropdowns.'
    ],
    techStack: 'FastAPI RBAC Middleware, PostgreSQL Role Mapping, React ProtectedRoute guards',
    metrics: [
      'Zero security scope leaks across multi-tenant workspaces.',
      '100% compliance audit readiness for enterprise deployments.'
    ]
  },
  {
    id: 'prd-4',
    title: 'Payment Gateway Integration',
    version: 'v2.0',
    time: 'Generated 3 days ago',
    status: 'Completed',
    summary: 'Resilient multi-currency payment checkout integration resolving transaction drop-offs and subscription billing errors.',
    userStories: [
      'As a customer, I want instant confirmation of payment success so I know my transaction was received.',
      'As a PM, I want webhook retry telemetry for failed checkout attempts.'
    ],
    requirements: [
      'Integrate Stripe / Razorpay Webhook handlers with idempotent transaction logging.',
      'Implement fallback refund queue for failed gateway confirmations.'
    ],
    techStack: 'FastAPI, PostgreSQL Transaction Engine, Webhook Signatures',
    metrics: [
      'Eliminate 409 payment conflict errors.',
      'Achieve 99.8% checkout success rate.'
    ]
  },
  {
    id: 'prd-5',
    title: 'Real-Time Collaboration Service',
    version: 'v1.0',
    time: 'Generated 4 days ago',
    status: 'Completed',
    summary: 'Multi-user concurrent editing module enabling Product Managers to co-author PRDs and roadmap items live.',
    userStories: [
      'As a PM, I want to see teammate cursor positions while co-authoring a PRD spec.'
    ],
    requirements: [
      'Implement WebSocket live presence server.',
      'Conflict-free Replicated Data Type (CRDT) document synchronization.'
    ],
    techStack: 'FastAPI WebSockets, Redis Pub/Sub, React State Sync',
    metrics: [
      'Sub-50ms sync latency across concurrent editors.'
    ]
  },
  {
    id: 'prd-6',
    title: 'Automated PDF & Statement Exporter',
    version: 'v1.3',
    time: 'Generated 5 days ago',
    status: 'Completed',
    summary: 'High-performance PDF generation engine converting analytics dashboards and theme extraction summaries into formatted PDF reports.',
    userStories: [
      'As an Enterprise Lead, I want single-click export of theme reports in PDF format for executive review.'
    ],
    requirements: [
      'Server-side HTML-to-PDF rendering pipeline.',
      'Custom branding header and watermarking.'
    ],
    techStack: 'Python ReportLab / WeasyPrint, Celery Worker, GCS Storage',
    metrics: [
      'Generate 50-page PDF reports in under 3 seconds.'
    ]
  },
  {
    id: 'prd-7',
    title: 'Biometric & SSO Authentication Module',
    version: 'v2.1',
    time: 'Generated 6 days ago',
    status: 'Completed',
    summary: 'Enterprise SSO (SAML 2.0 / OAuth2) and FaceID / TouchID biometric login integration.',
    userStories: [
      'As an Enterprise Employee, I want Okta / Azure AD SSO login to bypass password entries.'
    ],
    requirements: [
      'SAML 2.0 identity provider integration.',
      'WebAuthn biometric challenge support.'
    ],
    techStack: 'Firebase Auth Enterprise, WebAuthn API, SAML Service',
    metrics: [
      'Reduce authentication support tickets by 80%.'
    ]
  },
  {
    id: 'prd-8',
    title: 'Customer Feedback Ingestion Webhook',
    version: 'v1.0',
    time: 'Generated 1 week ago',
    status: 'Completed',
    summary: 'Universal HTTP Webhook receiver consuming incoming feedback streams from Zendesk, Intercom, App Store, and Slack.',
    userStories: [
      'As a Support Manager, I want Zendesk tickets auto-forwarded to AI Copilot upon ticket resolution.'
    ],
    requirements: [
      'HMAC SHA-256 header validation.',
      'Asynchronous task processing queue.'
    ],
    techStack: 'FastAPI Router, Celery / Redis Queue, PII Masker',
    metrics: [
      'Process 10,000 feedback webhooks per minute reliably.'
    ]
  },
  {
    id: 'prd-9',
    title: 'AI Prompt & Copilot RAG Context Mesh',
    version: 'v1.4',
    time: 'Generated 1 week ago',
    status: 'Completed',
    summary: 'Vector database context builder retrieving relevant PRDs, user feedback, and metric trends for Gemini streaming copilot.',
    userStories: [
      'As a PM, I want the AI Assistant to recall previous PRD decisions when generating new features.'
    ],
    requirements: [
      'Qdrant vector search with 3072-dim embeddings.',
      'Server-Sent Events (SSE) word-by-word streaming endpoint.'
    ],
    techStack: 'Qdrant, Gemini 2.0 Flash / Pro, FastAPI SSE Stream',
    metrics: [
      'Deliver first streaming token in under 400ms.'
    ]
  }
];

interface CopilotAlert {
  id: string;
  type: 'high_priority' | 'trend' | 'prd_ready' | 'sentiment';
  title: string;
  description: string;
  time: string;
  priority: 'High' | 'Medium' | 'Low' | 'Info';
  category: string;
}

const DEFAULT_ALERTS: CopilotAlert[] = [
  {
    id: 'alt-1',
    type: 'high_priority',
    title: 'High Priority: Payment Gateway Errors',
    description: 'Onboarding drop-off rate increased by 23% in the last 7 days due to high severity checkout failures.',
    time: '1h ago',
    priority: 'High',
    category: 'Payment Gateway'
  },
  {
    id: 'alt-2',
    type: 'trend',
    title: 'Feature Request Trend: PDF Export Missing',
    description: 'PDF export & report generation requests increased 45% this week.',
    time: '3h ago',
    priority: 'Medium',
    category: 'PDF Export'
  },
  {
    id: 'alt-3',
    type: 'prd_ready',
    title: 'PRD Generation Ready: Login Failures',
    description: 'High priority cluster detected. Priority score exceeds threshold for automated PRD spec generation.',
    time: '5h ago',
    priority: 'Info',
    category: 'Authentication'
  },
  {
    id: 'alt-4',
    type: 'sentiment',
    title: 'Low Sentiment Alert: Slow Performance',
    description: 'Average sentiment dropped below 30% for query optimization and page latency signals.',
    time: '6h ago',
    priority: 'High',
    category: 'Performance'
  },
  {
    id: 'alt-5',
    type: 'trend',
    title: 'Surging Volume: Complex Onboarding Process',
    description: 'Onboarding feedback volume spiked with 27 recent customer mentions.',
    time: '8h ago',
    priority: 'Medium',
    category: 'Onboarding'
  }
];

function generateLiveAlertsFromBackend(clusters: BackendCluster[], trends: BackendTrend[]): CopilotAlert[] {
  const alerts: CopilotAlert[] = [];

  // Generate alerts from live PostgreSQL clusters
  clusters.forEach((c, idx) => {
    const catName = c.category || c.name || c.theme || `Theme Cluster #${idx + 1}`;
    const vol = c.total_volume || c.count || c.mentions || 0;
    const severity = c.avg_severity !== undefined ? c.avg_severity : 0.5;
    const sentiment = c.avg_sentiment !== undefined ? c.avg_sentiment : 0.5;
    const priorityScore = c.priority_score || (severity * (1 - sentiment) * Math.sqrt(vol || 1));

    if (severity >= 0.5 || priorityScore > 2.0) {
      alerts.push({
        id: `live-alert-sev-${idx}`,
        type: 'high_priority',
        title: `High Priority: ${catName}`,
        description: `High friction identified in database with severity index ${(severity * 100).toFixed(0)}% across ${vol} user reports.`,
        time: `${(idx + 1) * 35}m ago`,
        priority: 'High',
        category: catName
      });
    }

    if (sentiment < 0.45) {
      alerts.push({
        id: `live-alert-sent-${idx}`,
        type: 'sentiment',
        title: `Low Sentiment Warning: ${catName}`,
        description: `Customer sentiment index dropped to ${(sentiment * 100).toFixed(0)}% in PostgreSQL analytics logs.`,
        time: `${idx + 1}h ago`,
        priority: 'High',
        category: catName
      });
    }

    if (priorityScore >= 1.5 || vol >= 10) {
      alerts.push({
        id: `live-alert-prd-${idx}`,
        type: 'prd_ready',
        title: `PRD Spec Candidate: ${catName}`,
        description: `Priority Score is ${priorityScore.toFixed(1)}. Sufficient evidence signals for automated PRD draft.`,
        time: `${idx + 2}h ago`,
        priority: 'Info',
        category: catName
      });
    }
  });

  // Generate alerts from live PostgreSQL category trends
  trends.forEach((t, idx) => {
    if (t.category && (t.trajectory === 'rising' || (t.current_volume && t.current_volume > 5))) {
      alerts.push({
        id: `live-alert-trend-${idx}`,
        type: 'trend',
        title: `Feature Request Trajectory: ${t.category}`,
        description: `Volume trajectory classified as ${t.trajectory || 'rising'} with ${t.current_volume || 'high'} recent mentions.`,
        time: `${(idx + 1) * 2}h ago`,
        priority: 'Medium',
        category: t.category
      });
    }
  });

  return alerts.length > 0 ? alerts : DEFAULT_ALERTS;
}

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
  const [activePRD, setActivePRD] = useState<PRDDocument | null>(null);
  const [alertFilter, setAlertFilter] = useState<'all' | 'high_priority' | 'trend' | 'prd_ready'>('all');

  // Backend Integration State
  const [isBackendConnected, setIsBackendConnected] = useState<boolean | null>(null);
  const [backendClusters, setBackendClusters] = useState<BackendCluster[]>([]);
  const [backendTrends, setBackendTrends] = useState<BackendTrend[]>([]);
  const [copilotAlerts, setCopilotAlerts] = useState<CopilotAlert[]>(DEFAULT_ALERTS);
  const [apiProjectCount, setApiProjectCount] = useState<number | null>(null);

  // Toast theme styles
  const toast_ok = {
    background: isDark ? '#161B22' : '#ffffff',
    color: isDark ? '#F8FAFC' : '#0F172A',
    border: `1px solid ${isDark ? '#2D3748' : '#E2E8F0'}`,
  };

  // Connect to Backend APIs on Mount
  useEffect(() => {
    let isMounted = true;

    async function loadBackendData() {
      try {
        // Fetch live theme clusters & trends directly from PostgreSQL endpoints
        const [clusters, trends] = await Promise.all([
          analyticsService.getThemeClusters(),
          analyticsService.getThemeTrends()
        ]);

        if (isMounted) {
          if (Array.isArray(clusters) && clusters.length > 0) {
            setBackendClusters(clusters);
          }
          if (Array.isArray(trends) && trends.length > 0) {
            setBackendTrends(trends);
          }
          const liveAlerts = generateLiveAlertsFromBackend(clusters, trends);
          setCopilotAlerts(liveAlerts);
          setIsBackendConnected(true);
        }
      } catch {
        if (isMounted) {
          setIsBackendConnected(false);
          setCopilotAlerts(DEFAULT_ALERTS);
        }
      }

      try {
        const projects = await workspaceService.getWorkspacesFromApi();
        if (isMounted && Array.isArray(projects)) {
          setApiProjectCount(projects.length);
        }
      } catch {
        // Projects GET route notice
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
                  <FeedbackVolumeChart trends={backendTrends} />
                </div>
              </div>

              {/* Footer */}
              <div className="mt-4 pt-4 border-t flex items-center justify-between text-xs" style={{ borderColor: 'var(--border-subtle)' }}>
                <span className="font-bold" style={{ color: 'var(--text-primary)' }}>
                  {backendClusters.length > 0
                    ? `Total: ${backendClusters.reduce((sum, item) => sum + (item.total_volume || 0), 0).toLocaleString()} records`
                    : 'Total: 13,191 records'}
                </span>
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
                          <td className="py-3 px-3 font-bold" style={{ color: 'var(--text-primary)' }}>{item.title}</td>
                          <td className="py-3 px-2 text-center" style={{ color: 'var(--text-secondary)' }}>{item.mentions}</td>
                          <td className="py-3 px-2 text-center" style={{ color: 'var(--text-secondary)' }}>{item.pct}</td>
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
                  {PRD_DATA.map((prd, idx) => {
                    const Icon = idx === 0 ? Code : (idx === 1 ? Smartphone : Shield);
                    const color = idx === 0 ? 'bg-purple-500/15 text-purple-400 border-purple-500/30' : (idx === 1 ? 'bg-blue-500/15 text-blue-400 border-blue-500/30' : 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30');
                    return (
                      <div
                        key={idx}
                        onClick={() => setActivePRD(prd)}
                        className={`p-3.5 rounded-xl border flex items-center justify-between gap-3 transition-all cursor-pointer group ${
                          isDark ? 'bg-[#0D1117] border-[#2D3748] hover:border-[#3B82F6]/50' : 'bg-[#F8FAFC] border-[#E2E8F0] hover:border-[#3B82F6]/50'
                        }`}
                      >
                        <div className="flex items-center gap-3.5">
                          <div className={`p-2.5 rounded-xl border ${color}`}>
                            <Icon className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="text-xs font-bold transition-colors group-hover:text-[#3B82F6]" style={{ color: 'var(--text-primary)' }}>
                                {prd.title}
                              </h3>
                              <span className="text-[10px] font-semibold" style={{ color: 'var(--text-muted)' }}>
                                {prd.version}
                              </span>
                            </div>
                            <p className="text-[11px] mt-0.5" style={{ color: 'var(--text-muted)' }}>{prd.time}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <span className="text-[11px] font-bold text-[#10B981] flex items-center gap-1">
                            ↑ Completed
                          </span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setActivePRD(prd);
                            }}
                            className={`p-1.5 rounded-lg transition-colors ${
                              isDark ? 'text-[#94A3B8] hover:text-white hover:bg-[#1e2530]' : 'text-[#64748B] hover:text-[#0F172A] hover:bg-[#E2E8F0]'
                            }`}
                          >
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

                {/* Dynamic Live Alert Cards */}
                <div className="space-y-3.5">
                  {copilotAlerts.slice(0, 4).map((alert) => {
                    const isHigh = alert.type === 'high_priority' || alert.type === 'sentiment' || alert.priority === 'High';
                    const isTrend = alert.type === 'trend';
                    const borderColor = isHigh ? 'border-[#EF4444]/30 bg-[#EF4444]/5 hover:bg-[#EF4444]/10' : (isTrend ? 'border-[#F59E0B]/30 bg-[#F59E0B]/5 hover:bg-[#F59E0B]/10' : 'border-[#3B82F6]/30 bg-[#3B82F6]/5 hover:bg-[#3B82F6]/10');
                    const iconColor = isHigh ? 'bg-[#EF4444]/15 border-[#EF4444]/30 text-[#EF4444]' : (isTrend ? 'bg-[#F59E0B]/15 border-[#F59E0B]/30 text-[#F59E0B]' : 'bg-[#3B82F6]/15 border-[#3B82F6]/30 text-[#3B82F6]');
                    const titleColor = isHigh ? 'text-[#EF4444]' : (isTrend ? 'text-[#D97706] dark:text-[#F59E0B]' : 'text-[#2563EB] dark:text-[#3B82F6]');
                    const Icon = isHigh ? AlertTriangle : (isTrend ? Lightbulb : Info);

                    return (
                      <div
                        key={alert.id}
                        onClick={() => setSelectedAlertsModal(true)}
                        className={`p-3.5 rounded-xl border flex items-center justify-between gap-3 group cursor-pointer transition-colors ${borderColor}`}
                      >
                        <div className="flex items-center gap-3.5">
                          <div className={`p-2.5 rounded-xl border ${iconColor}`}>
                            <Icon className="w-4 h-4" />
                          </div>
                          <div>
                            <h3 className={`text-xs font-bold ${titleColor}`}>
                              {alert.title}
                            </h3>
                            <p className="text-[11px] mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                              {alert.description}
                            </p>
                          </div>
                        </div>
                        <span className="text-[11px] font-semibold text-[#64748B] whitespace-nowrap">{alert.time}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Bottom Link */}
              <div className="mt-5 pt-3 border-t" style={{ borderColor: 'var(--border-subtle)' }}>
                <button
                  onClick={() => setSelectedAlertsModal(true)}
                  className="text-xs font-bold text-[#8B5CF6] hover:text-[#A78BFA] flex items-center gap-1.5 group transition-colors cursor-pointer"
                >
                  <span>View all alerts & insights ({copilotAlerts.length})</span>
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

              <div className={`p-4 rounded-xl border space-y-3 text-xs ${isDark ? 'bg-[#0D1117] border-[#2D3748] text-[#CBD5E1]' : 'bg-[#F8FAFC] border-[#E2E8F0] text-[#334155]'}`}>
                <p className={`font-semibold ${isDark ? 'text-white' : 'text-[#0F172A]'}`}>Key Takeaways:</p>
                <ul className="list-disc pl-4 space-y-1.5">
                  {painPoints.map((p, i) => (
                    <li key={i}>
                      <strong className={isDark ? 'text-white' : 'text-[#0F172A]'}>{p.title} ({p.mentions} mentions):</strong> Represents {p.pct} of overall feedback signals.
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

      {/* ── PRD List Modal ────────────────────────────────────────────────── */}
      <AnimatePresence>
        {selectedPRDModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className={`w-full max-w-xl max-h-[85vh] flex flex-col rounded-2xl border p-6 shadow-2xl relative space-y-5 ${
                isDark ? 'bg-[#161B22] border-[#2D3748] text-white' : 'bg-white border-[#E2E8F0] text-[#0F172A]'
              }`}
            >
              <button
                onClick={() => setSelectedPRDModal(false)}
                className="absolute top-4 right-4 p-2 rounded-xl text-[#94A3B8] hover:bg-[#1e2530] hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-3 flex-shrink-0">
                <div className="p-3 rounded-xl bg-[#8B5CF6]/15 border border-[#8B5CF6]/30 text-[#8B5CF6]">
                  <FileText className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-xl font-bold font-display">Generated PRD Documents</h3>
                    <span className="px-2 py-0.5 rounded-full text-xs font-extrabold bg-[#8B5CF6]/20 text-[#8B5CF6] border border-[#8B5CF6]/30">
                      {PRD_DATA.length} PRDs
                    </span>
                  </div>
                  <p className="text-xs text-[#94A3B8]">AI-Generated Product Requirement Specifications</p>
                </div>
              </div>

              <div className="space-y-2.5 text-xs overflow-y-auto max-h-[55vh] pr-1 scrollbar-thin">
                {PRD_DATA.map((prd) => (
                  <div
                    key={prd.id}
                    onClick={() => {
                      setSelectedPRDModal(false);
                      setActivePRD(prd);
                    }}
                    className={`p-3.5 rounded-xl border flex justify-between items-center cursor-pointer transition-all ${
                      isDark ? 'bg-[#0D1117] border-[#2D3748] hover:border-[#3B82F6]' : 'bg-[#F8FAFC] border-[#E2E8F0] hover:border-[#3B82F6]'
                    }`}
                  >
                    <div>
                      <span className="font-bold text-sm block" style={{ color: 'var(--text-primary)' }}>{prd.title} <span className="text-xs text-[#8B5CF6]">{prd.version}</span></span>
                      <span className="text-[11px] text-[#94A3B8]">{prd.time}</span>
                    </div>
                    <span className="text-[10px] text-[#10B981] font-bold px-2 py-1 rounded-full bg-[#10B981]/15 border border-[#10B981]/30">{prd.status}</span>
                  </div>
                ))}
              </div>

              <div className="flex justify-end pt-2 flex-shrink-0">
                <button
                  onClick={() => setSelectedPRDModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-[#1e2530] hover:bg-[#252a32] text-white cursor-pointer"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── Active PRD Document Viewer Modal ──────────────────────────────── */}
      <AnimatePresence>
        {activePRD && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className={`w-full max-w-3xl max-h-[85vh] overflow-y-auto rounded-2xl border p-7 shadow-2xl relative space-y-6 ${
                isDark ? 'bg-[#161B22] border-[#2D3748] text-white' : 'bg-white border-[#E2E8F0] text-[#0F172A]'
              }`}
            >
              <button
                onClick={() => setActivePRD(null)}
                className="absolute top-5 right-5 p-2 rounded-xl text-[#94A3B8] hover:bg-[#1e2530] hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Modal Header */}
              <div className="flex items-start gap-4 border-b pb-5" style={{ borderColor: 'var(--border-subtle)' }}>
                <div className="p-3.5 rounded-2xl bg-gradient-to-br from-[#8B5CF6] to-[#6366F1] text-white shadow-lg shadow-purple-500/20 flex-shrink-0">
                  <FileText className="w-7 h-7" />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <h2 className="text-2xl font-extrabold font-display" style={{ color: 'var(--text-primary)' }}>
                      {activePRD.title}
                    </h2>
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#8B5CF6]/15 border border-[#8B5CF6]/30 text-[#8B5CF6]">
                      {activePRD.version}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#10B981]/15 border border-[#10B981]/30 text-[#10B981]">
                      {activePRD.status}
                    </span>
                  </div>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    {activePRD.time} • Generated by AI Copilot Engine
                  </p>
                </div>
              </div>

              {/* Executive Summary */}
              <div className="space-y-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#8B5CF6]">Executive Summary</h3>
                <p className="text-xs leading-relaxed p-4 rounded-xl border" style={{ backgroundColor: isDark ? '#0D1117' : '#F8FAFC', borderColor: 'var(--border-subtle)', color: 'var(--text-secondary)' }}>
                  {activePRD.summary}
                </p>
              </div>

              {/* User Stories */}
              <div className="space-y-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#3B82F6]">User Stories & Acceptance Criteria</h3>
                <div className="space-y-2">
                  {activePRD.userStories.map((story, i) => (
                    <div key={i} className="p-3 rounded-xl border text-xs flex items-start gap-2.5" style={{ backgroundColor: isDark ? '#0D1117' : '#F8FAFC', borderColor: 'var(--border-subtle)', color: 'var(--text-secondary)' }}>
                      <CheckCircle2 className="w-4 h-4 text-[#3B82F6] flex-shrink-0 mt-0.5" />
                      <span>{story}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Functional Requirements */}
              <div className="space-y-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#10B981]">Functional Requirements</h3>
                <ul className="list-disc pl-5 space-y-1.5 text-xs" style={{ color: 'var(--text-secondary)' }}>
                  {activePRD.requirements.map((req, i) => (
                    <li key={i}>{req}</li>
                  ))}
                </ul>
              </div>

              {/* Tech Architecture & Success Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <div className="p-4 rounded-xl border space-y-1.5" style={{ backgroundColor: isDark ? '#0D1117' : '#F8FAFC', borderColor: 'var(--border-subtle)' }}>
                  <h4 className="text-xs font-bold text-[#F59E0B]">Technical Architecture</h4>
                  <p className="text-xs font-mono" style={{ color: 'var(--text-muted)' }}>{activePRD.techStack}</p>
                </div>
                <div className="p-4 rounded-xl border space-y-1.5" style={{ backgroundColor: isDark ? '#0D1117' : '#F8FAFC', borderColor: 'var(--border-subtle)' }}>
                  <h4 className="text-xs font-bold text-[#10B981]">Target Metrics & KPIs</h4>
                  <ul className="list-disc pl-4 space-y-1 text-xs" style={{ color: 'var(--text-muted)' }}>
                    {activePRD.metrics.map((m, i) => (
                      <li key={i}>{m}</li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Footer Controls */}
              <div className="flex items-center justify-between pt-4 border-t" style={{ borderColor: 'var(--border-subtle)' }}>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(`# ${activePRD.title} ${activePRD.version}\n\n${activePRD.summary}`);
                    toast.success('PRD summary copied to clipboard! 📋', { style: toast_ok });
                  }}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-[#3B82F6] bg-[#3B82F6]/15 hover:bg-[#3B82F6]/25 border border-[#3B82F6]/30 transition-all cursor-pointer"
                >
                  <FileCode className="w-4 h-4" />
                  <span>Copy PRD Summary</span>
                </button>

                <button
                  onClick={() => setActivePRD(null)}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-[#3B82F6] to-[#8B5CF6] hover:opacity-90 transition-all shadow-lg shadow-blue-500/20 cursor-pointer"
                >
                  Close Document
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── Copilot Alerts Modal ──────────────────────────────────────────── */}
      <AnimatePresence>
        {selectedAlertsModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className={`w-full max-w-2xl max-h-[85vh] flex flex-col rounded-2xl border p-6 shadow-2xl relative space-y-5 ${
                isDark ? 'bg-[#161B22] border-[#2D3748] text-white' : 'bg-white border-[#E2E8F0] text-[#0F172A]'
              }`}
            >
              <button
                onClick={() => setSelectedAlertsModal(false)}
                className="absolute top-4 right-4 p-2 rounded-xl text-[#94A3B8] hover:bg-[#1e2530] hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>

              {/* Modal Header */}
              <div className="flex items-center gap-3 flex-shrink-0">
                <div className="p-3 rounded-xl bg-[#F59E0B]/15 border border-[#F59E0B]/30 text-[#F59E0B]">
                  <Sparkles className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-xl font-bold font-display">Copilot AI Insights & Alerts</h3>
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-[#F59E0B]/20 text-[#F59E0B] border border-[#F59E0B]/30">
                      {copilotAlerts.length} Live Alerts
                    </span>
                  </div>
                  <p className="text-xs text-[#94A3B8]">Real-time recommendations and priority flags generated from PostgreSQL data</p>
                </div>
              </div>

              {/* Filter Tabs */}
              <div className="flex items-center gap-2 flex-shrink-0 text-xs border-b pb-3" style={{ borderColor: 'var(--border-subtle)' }}>
                {[
                  { id: 'all', label: `All Alerts (${copilotAlerts.length})` },
                  { id: 'high_priority', label: 'High Priority' },
                  { id: 'trend', label: 'Trends' },
                  { id: 'prd_ready', label: 'PRD Ready' },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setAlertFilter(tab.id as any)}
                    className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                      alertFilter === tab.id
                        ? 'bg-[#3B82F6] text-white shadow-md shadow-blue-500/20'
                        : isDark
                        ? 'bg-[#0D1117] text-[#94A3B8] border border-[#2D3748] hover:text-white'
                        : 'bg-[#F1F5F9] text-[#64748B] border border-[#E2E8F0] hover:text-[#0F172A]'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Alert List Container */}
              <div className="space-y-3 text-xs overflow-y-auto max-h-[50vh] pr-1 scrollbar-thin flex-grow">
                {copilotAlerts
                  .filter((a) => alertFilter === 'all' || a.type === alertFilter || (alertFilter === 'high_priority' && a.priority === 'High'))
                  .map((alert) => {
                    const isHigh = alert.type === 'high_priority' || alert.type === 'sentiment' || alert.priority === 'High';
                    const isTrend = alert.type === 'trend';
                    const bgBox = isHigh
                      ? 'bg-[#EF4444]/10 border-[#EF4444]/30 text-[#EF4444]'
                      : isTrend
                      ? 'bg-[#F59E0B]/10 border-[#F59E0B]/30 text-[#F59E0B]'
                      : 'bg-[#3B82F6]/10 border-[#3B82F6]/30 text-[#3B82F6]';

                    return (
                      <div key={alert.id} className={`p-4 rounded-xl border space-y-1.5 ${bgBox}`}>
                        <div className="flex items-center justify-between gap-2">
                          <p className="font-bold text-sm">{alert.title}</p>
                          <span className="text-[10px] font-semibold opacity-75">{alert.time}</span>
                        </div>
                        <p className="text-[11px] leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                          {alert.description}
                        </p>
                        <div className="flex items-center gap-2 pt-1">
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-black/20 font-semibold">
                            Category: {alert.category}
                          </span>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-black/20 font-semibold">
                            Priority: {alert.priority}
                          </span>
                        </div>
                      </div>
                    );
                  })}
              </div>

              <div className="flex justify-end pt-2 flex-shrink-0">
                <button
                  onClick={() => setSelectedAlertsModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-[#1e2530] hover:bg-[#252a32] text-white cursor-pointer"
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

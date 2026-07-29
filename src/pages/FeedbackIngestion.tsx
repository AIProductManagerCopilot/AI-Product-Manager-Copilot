import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Inbox,
  Clock,
  Database,
  TrendingUp,
  MoreVertical,
  UploadCloud,
  FileUp,
  MessageSquare,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Search,
  X,
  FileText,
  Zap
} from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import { Sidebar } from '../components/Sidebar';
import { TopNavbar } from '../components/TopNavbar';
import { useTheme } from '../context/ThemeContext';

// ─── SVG Source Logos ──────────────────────────────────────────────────────────

const ZendeskLogo: React.FC<{ className?: string }> = ({ className = 'w-5 h-5' }) => (
  <div className={`rounded-lg bg-[#03363D] flex items-center justify-center p-1.5 ${className}`}>
    <svg viewBox="0 0 24 24" fill="none" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
      <path d="M19 12C19 15.866 15.866 19 12 19C8.13401 19 5 15.866 5 12" stroke="#00E6A5" strokeWidth="2.5" strokeLinecap="round" />
      <circle cx="12" cy="7" r="2.5" fill="#00E6A5" />
    </svg>
  </div>
);

const AppStoreLogo: React.FC<{ className?: string }> = ({ className = 'w-5 h-5' }) => (
  <div className={`rounded-lg bg-[#007AFF] flex items-center justify-center p-1.5 ${className}`}>
    <svg viewBox="0 0 24 24" fill="none" className="w-full h-full text-white" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 4v16M4 17l16-10M4 7l16 10" />
    </svg>
  </div>
);

const IntercomLogo: React.FC<{ className?: string }> = ({ className = 'w-5 h-5' }) => (
  <div className={`rounded-lg bg-[#1F8CEB] flex items-center justify-center p-1.5 ${className}`}>
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full text-white">
      <path d="M6 8h2v8H6V8zm5-2h2v12h-2V6zm5 4h2v4h-2v-4z" />
    </svg>
  </div>
);

const GooglePlayLogo: React.FC<{ className?: string; isDark?: boolean }> = ({ className = 'w-5 h-5', isDark = true }) => (
  <div className={`rounded-lg ${isDark ? 'bg-[#1A1F2C] border-[#2D3748]' : 'bg-[#F1F5F9] border-[#CBD5E1]'} border flex items-center justify-center p-1.5 ${className}`}>
    <svg viewBox="0 0 24 24" fill="none" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
      <path d="M4.5 3.5L14.5 12.5L4.5 21.5V3.5Z" fill="#00E676" />
      <path d="M14.5 12.5L18.5 8.5L4.5 3.5L14.5 12.5Z" fill="#FFC107" />
      <path d="M14.5 12.5L18.5 16.5L4.5 21.5L14.5 12.5Z" fill="#FF3D00" />
      <path d="M18.5 8.5L21.5 11.5C22.1 12 22.1 13 21.5 13.5L18.5 16.5L14.5 12.5L18.5 8.5Z" fill="#29B6F6" />
    </svg>
  </div>
);

// ─── Data Models & Types ───────────────────────────────────────────────────────

interface FeedbackSource {
  id: string;
  name: string;
  description: string;
  status: 'Connected' | 'Disconnected' | 'Connecting';
  logo: React.FC<{ className?: string; isDark?: boolean }>;
}

interface FeedbackEntry {
  id: string;
  content: string;
  source: string;
  sourceType: 'Zendesk' | 'App Store' | 'Intercom' | 'Google Play' | 'Manual Upload';
  date: string;
  category: 'Bug' | 'Feedback' | 'Feature Request' | 'Performance';
  sentiment: 'Positive' | 'Negative' | 'Neutral';
}

const INITIAL_SOURCES: FeedbackSource[] = [
  { id: 'zendesk', name: 'Zendesk', description: 'Support tickets & feedback', status: 'Connected', logo: ZendeskLogo },
  { id: 'appstore', name: 'App Store Reviews', description: 'iOS app store feedback', status: 'Connected', logo: AppStoreLogo },
  { id: 'intercom', name: 'Intercom', description: 'Live chat & conversations', status: 'Disconnected', logo: IntercomLogo },
  { id: 'gplay', name: 'Google Play Reviews', description: 'Android app store feedback', status: 'Connected', logo: GooglePlayLogo },
];

const INITIAL_ENTRIES: FeedbackEntry[] = [
  {
    id: '1',
    content: 'The app crashes frequently when trying to export large dat...',
    source: 'Zendesk',
    sourceType: 'Zendesk',
    date: 'May 15, 2026 6:45 PM',
    category: 'Bug',
    sentiment: 'Negative',
  },
  {
    id: '2',
    content: 'Love the new dashboard! The analytics are super helpful.',
    source: 'App Store',
    sourceType: 'App Store',
    date: 'May 15, 2026 5:32 PM',
    category: 'Feedback',
    sentiment: 'Positive',
  },
  {
    id: '3',
    content: 'Please add dark mode support. It would be great for night ...',
    source: 'Intercom',
    sourceType: 'Intercom',
    date: 'May 15, 2026 4:18 PM',
    category: 'Feature Request',
    sentiment: 'Neutral',
  },
  {
    id: '4',
    content: 'The loading time on the reports page is too slow.',
    source: 'Google Play',
    sourceType: 'Google Play',
    date: 'May 15, 2026 3:02 PM',
    category: 'Performance',
    sentiment: 'Negative',
  },
  {
    id: '5',
    content: 'Can we get an option to export to PDF directly?',
    source: 'Zendesk',
    sourceType: 'Zendesk',
    date: 'May 15, 2026 1:47 PM',
    category: 'Feature Request',
    sentiment: 'Positive',
  },
  {
    id: '6',
    content: 'Push notifications are delayed by up to 10 minutes.',
    source: 'App Store',
    sourceType: 'App Store',
    date: 'May 15, 2026 11:20 AM',
    category: 'Bug',
    sentiment: 'Negative',
  },
  {
    id: '7',
    content: 'Awesome AI copilot features! Saves our PM team hours.',
    source: 'Intercom',
    sourceType: 'Intercom',
    date: 'May 15, 2026 10:05 AM',
    category: 'Feedback',
    sentiment: 'Positive',
  },
];

// ─── Main Component ─────────────────────────────────────────────────────────────

export const FeedbackIngestionPage: React.FC = () => {
  const isCollapsed = false;
  const { isDark } = useTheme();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // State
  const [sources, setSources] = useState<FeedbackSource[]>(INITIAL_SOURCES);
  const [entries, setEntries] = useState<FeedbackEntry[]>(INITIAL_ENTRIES);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(5);

  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isDragOver, setIsDragOver] = useState(false);

  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [showAllModal, setShowAllModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  // Theme Styles
  const cardBg = isDark
    ? 'bg-[#161B22] border-[#1e2530]'
    : 'bg-white border-[#E2E8F0] shadow-sm';
  const cardHoverBorder = isDark
    ? 'hover:border-[#2D3748]'
    : 'hover:border-[#CBD5E1] hover:shadow-md';

  const textPrimary = isDark ? 'text-white' : 'text-[#0F172A]';
  const textSecondary = isDark ? 'text-[#94A3B8]' : 'text-[#475569]';
  const textMuted = isDark ? 'text-[#64748B]' : 'text-[#94A3B8]';

  const itemBg = isDark
    ? 'bg-[#0D1117]/60 border-[#1e2530]'
    : 'bg-[#F8FAFC] border-[#E2E8F0]';
  const itemHoverBorder = isDark ? 'hover:border-[#2D3748]' : 'hover:border-[#CBD5E1]';

  const dragBorder = isDragOver
    ? 'border-[#3B82F6] bg-[#3B82F6]/10 scale-[0.99]'
    : isDark
      ? 'border-[#4F46E5]/40 bg-[#0D1117]/50 hover:bg-[#0D1117] hover:border-[#6366F1]'
      : 'border-[#6366F1]/30 bg-[#F8FAFC] hover:bg-white hover:border-[#6366F1] shadow-inner';

  const fileBadgeBg = isDark
    ? 'bg-[#1e2530] text-[#94A3B8] border-[#2D3748]'
    : 'bg-white text-[#475569] border-[#CBD5E1] shadow-xs';

  const folderBoxBg = isDark ? 'bg-[#161B22]' : 'bg-white';

  const viewAllBtnClass = isDark
    ? 'text-white bg-[#0D1117] border-[#2D3748] hover:border-[#3B82F6]/50 hover:bg-[#1b2027]'
    : 'text-[#0F172A] bg-white border-[#CBD5E1] hover:border-[#3B82F6] hover:bg-[#F1F5F9] shadow-sm';

  const tableHeaderBorder = isDark ? 'border-[#1e2530] text-[#64748B]' : 'border-[#E2E8F0] text-[#64748B]';
  const tableRowHover = isDark ? 'hover:bg-[#0D1117]/60' : 'hover:bg-[#F8FAFC]';
  const tableDivide = isDark ? 'divide-[#1e2530]/60' : 'divide-[#E2E8F0]';

  const menuDropdownBg = isDark
    ? 'bg-[#161B22] border-[#2D3748]'
    : 'bg-white border-[#CBD5E1] shadow-xl';
  const menuItemHover = isDark
    ? 'text-[#94A3B8] hover:text-white hover:bg-[#1e2530]'
    : 'text-[#475569] hover:text-[#0F172A] hover:bg-[#F1F5F9]';

  const modalBg = isDark
    ? 'bg-[#161B22] border-[#2D3748]'
    : 'bg-white border-[#CBD5E1] shadow-2xl';
  const modalInputBg = isDark
    ? 'bg-[#0D1117] border-[#2D3748] text-white'
    : 'bg-[#F8FAFC] border-[#CBD5E1] text-[#0F172A]';

  const toastStyle = {
    background: isDark ? '#161B22' : '#ffffff',
    color: isDark ? '#F8FAFC' : '#0F172A',
    border: `1px solid ${isDark ? '#2D3748' : '#E2E8F0'}`,
  };

  // ── Source Connection Toggle ──────────────────────────────────────────────
  const toggleSourceConnect = (sourceId: string) => {
    setSources((prev) =>
      prev.map((src) => {
        if (src.id === sourceId) {
          const nextStatus = src.status === 'Connected' ? 'Disconnected' : 'Connected';
          toast.success(
            `${src.name} is now ${nextStatus.toLowerCase()}!`,
            { style: toastStyle }
          );
          return { ...src, status: nextStatus };
        }
        return src;
      })
    );
  };

  // ── File Upload Handler ────────────────────────────────────────────────────
  const handleFileUpload = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const file = files[0];
    setIsUploading(true);
    setUploadProgress(10);

    const interval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            setIsUploading(false);
            setUploadProgress(0);

            // Add new simulated entry from uploaded file
            const newEntry: FeedbackEntry = {
              id: Date.now().toString(),
              content: `Uploaded file (${file.name}): ${file.size} bytes ingested successfully.`,
              source: 'Manual Upload',
              sourceType: 'Zendesk',
              date: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              category: 'Feedback',
              sentiment: 'Positive',
            };

            setEntries((prevEntries) => [newEntry, ...prevEntries]);
            toast.success(`File "${file.name}" processed & ingested! 🚀`, { style: toastStyle });
          }, 300);
          return 100;
        }
        return prev + 30;
      });
    }, 200);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    handleFileUpload(e.dataTransfer.files);
  };

  // ── Category & Sentiment Badges ───────────────────────────────────────────
  const getCategoryBadge = (category: FeedbackEntry['category']) => {
    switch (category) {
      case 'Bug':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#EF4444]/15 text-[#EF4444] border border-[#EF4444]/30">
            Bug
          </span>
        );
      case 'Feedback':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#3B82F6]/15 text-[#3B82F6] border border-[#3B82F6]/30">
            Feedback
          </span>
        );
      case 'Feature Request':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#8B5CF6]/15 text-[#8B5CF6] border border-[#8B5CF6]/30">
            Feature Request
          </span>
        );
      case 'Performance':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#F97316]/15 text-[#F97316] border border-[#F97316]/30">
            Performance
          </span>
        );
    }
  };

  const getSentimentBadge = (sentiment: FeedbackEntry['sentiment']) => {
    switch (sentiment) {
      case 'Positive':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/30">
            Positive
          </span>
        );
      case 'Negative':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#EF4444]/15 text-[#EF4444] border border-[#EF4444]/30">
            Negative
          </span>
        );
      case 'Neutral':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#F59E0B]/15 text-[#F59E0B] border border-[#F59E0B]/30">
            Neutral
          </span>
        );
    }
  };

  const renderSourceLogo = (sourceType: FeedbackEntry['sourceType']) => {
    switch (sourceType) {
      case 'Zendesk':
        return <ZendeskLogo className="w-5 h-5 flex-shrink-0" />;
      case 'App Store':
        return <AppStoreLogo className="w-5 h-5 flex-shrink-0" />;
      case 'Intercom':
        return <IntercomLogo className="w-5 h-5 flex-shrink-0" />;
      case 'Google Play':
        return <GooglePlayLogo className="w-5 h-5 flex-shrink-0" isDark={isDark} />;
      default:
        return <Inbox className="w-5 h-5 text-[#8B5CF6] flex-shrink-0" />;
    }
  };

  // Pagination
  const totalEntries = entries.length;
  const totalPages = Math.ceil(totalEntries / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentEntries = entries.slice(startIndex, startIndex + itemsPerPage);

  // Delete Entry
  const handleDeleteEntry = (id: string) => {
    setEntries((prev) => prev.filter((e) => e.id !== id));
    setActiveMenuId(null);
    toast.success('Feedback entry removed.', { style: toastStyle });
  };

  return (
    <div className="min-h-screen transition-colors duration-200" style={{ backgroundColor: 'var(--bg-base)' }}>
      <Toaster position="top-right" />
      <Sidebar />

      <div className={`${isCollapsed ? 'ml-16' : 'ml-60'} min-h-screen flex flex-col transition-all duration-300 ease-in-out`}>
        <TopNavbar searchPlaceholder="Search feedback, sources, or categories..." />

        <main className="flex-1 pt-20 px-8 py-8 space-y-7 max-w-screen-2xl">

          {/* ── Page Header ──────────────────────────────────────────────── */}
          <div>
            <motion.h1
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              className={`text-2xl font-bold font-display tracking-tight ${textPrimary}`}
            >
              Feedback Ingestion & ETL
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
              className={`text-xs mt-1 ${textSecondary}`}
            >
              Ingest, process, and normalize customer feedback from all your sources.
            </motion.p>
          </div>

          {/* ── Top Metric Cards (3 Column Grid) ─────────────────────────── */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">

            {/* Total Records */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className={`p-5 rounded-2xl border flex items-center gap-4 transition-all ${cardBg} ${cardHoverBorder}`}
            >
              <div className="p-3 rounded-xl bg-[#8B5CF6]/15 border border-[#8B5CF6]/30 text-[#8B5CF6] flex-shrink-0">
                <Database className="w-5 h-5" />
              </div>
              <div className="space-y-0.5">
                <p className={`text-xs font-medium ${textSecondary}`}>Total Records</p>
                <h3 className={`text-2xl font-extrabold tracking-tight ${textPrimary}`}>8,342</h3>
                <div className="flex items-center gap-1 text-xs font-semibold text-[#10B981] pt-0.5">
                  <TrendingUp className="w-3.5 h-3.5" />
                  <span>12.5% vs last 7 days</span>
                </div>
              </div>
            </motion.div>

            {/* Last Sync */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className={`p-5 rounded-2xl border flex items-center gap-4 transition-all ${cardBg} ${cardHoverBorder}`}
            >
              <div className="p-3 rounded-xl bg-[#3B82F6]/15 border border-[#3B82F6]/30 text-[#3B82F6] flex-shrink-0">
                <Clock className="w-5 h-5" />
              </div>
              <div className="space-y-0.5">
                <p className={`text-xs font-medium ${textSecondary}`}>Last Sync</p>
                <h3 className={`text-2xl font-extrabold tracking-tight ${textPrimary}`}>2h ago</h3>
                <div className="flex items-center gap-1.5 text-xs font-semibold text-[#10B981] pt-0.5">
                  <span className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse" />
                  <span>All sources live</span>
                </div>
              </div>
            </motion.div>

            {/* Processing Queue */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className={`p-5 rounded-2xl border flex items-center gap-4 transition-all ${cardBg} ${cardHoverBorder}`}
            >
              <div className="p-3 rounded-xl bg-[#10B981]/15 border border-[#10B981]/30 text-[#10B981] flex-shrink-0">
                <Inbox className="w-5 h-5" />
              </div>
              <div className="space-y-0.5">
                <p className={`text-xs font-medium ${textSecondary}`}>Processing Queue</p>
                <h3 className={`text-2xl font-extrabold tracking-tight ${textPrimary}`}>0</h3>
                <div className="flex items-center gap-1.5 text-xs font-semibold text-[#10B981] pt-0.5">
                  <span className="w-2 h-2 rounded-full bg-[#10B981]" />
                  <span>All caught up</span>
                </div>
              </div>
            </motion.div>

          </div>

          {/* ── Middle Row: Connected Sources & Manual Ingestion (2 Columns) ── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

            {/* Left Card: Connected Sources */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              className={`p-6 rounded-2xl border flex flex-col justify-between ${cardBg}`}
            >
              <div>
                {/* Header */}
                <div className="flex items-center gap-2.5 mb-1">
                  <div className="p-1.5 rounded-lg bg-[#8B5CF6]/15 text-[#8B5CF6]">
                    <Zap className="w-4 h-4" />
                  </div>
                  <h2 className={`text-base font-bold ${textPrimary}`}>Connected Sources</h2>
                </div>
                <p className={`text-xs mb-5 ${textSecondary}`}>Manage your feedback data sources</p>

                {/* Source Item List */}
                <div className="space-y-3.5">
                  {sources.map((source) => (
                    <div
                      key={source.id}
                      className={`p-3.5 rounded-xl border flex items-center justify-between transition-all group ${itemBg} ${itemHoverBorder}`}
                    >
                      <div className="flex items-center gap-3">
                        <source.logo className="w-9 h-9" isDark={isDark} />
                        <div>
                          <h4 className={`text-xs font-bold group-hover:text-[#3B82F6] transition-colors ${textPrimary}`}>
                            {source.name}
                          </h4>
                          <p className={`text-[11px] ${textMuted}`}>{source.description}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        {source.status === 'Connected' ? (
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-[11px] font-semibold bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/30">
                            Connected
                          </span>
                        ) : (
                          <button
                            onClick={() => toggleSourceConnect(source.id)}
                            className="px-3.5 py-1 rounded-lg text-[11px] font-semibold border border-[#6366F1]/50 bg-[#6366F1]/10 text-[#818CF8] hover:bg-[#6366F1]/20 transition-all cursor-pointer"
                          >
                            Connect
                          </button>
                        )}
                        <button
                          onClick={() => toggleSourceConnect(source.id)}
                          className={`p-1 rounded-md transition-colors ${isDark ? 'text-[#64748B] hover:text-white' : 'text-[#94A3B8] hover:text-[#0F172A]'}`}
                          title="Source options"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>

            {/* Right Card: Manual Ingestion */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className={`p-6 rounded-2xl border flex flex-col justify-between ${cardBg}`}
            >
              <div>
                {/* Header */}
                <div className="flex items-center gap-2.5 mb-1">
                  <div className="p-1.5 rounded-lg bg-[#3B82F6]/15 text-[#3B82F6]">
                    <UploadCloud className="w-4 h-4" />
                  </div>
                  <h2 className={`text-base font-bold ${textPrimary}`}>Manual Ingestion</h2>
                </div>
                <p className={`text-xs mb-5 ${textSecondary}`}>Upload feedback files manually</p>

                {/* Drag & Drop Zone */}
                <div
                  onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
                  onDragLeave={() => setIsDragOver(false)}
                  onDrop={handleDrop}
                  className={`border-2 border-dashed rounded-2xl p-6 sm:p-8 text-center flex flex-col items-center justify-center transition-all ${dragBorder}`}
                >
                  {/* File Badges & Folder Graphic */}
                  <div className="relative mb-3 flex flex-col items-center">
                    {/* Floating badges */}
                    <div className="flex items-center gap-1.5 mb-1">
                      {['CSV', 'JSON', 'XLSX', 'TXT'].map((ext) => (
                        <span key={ext} className={`px-2 py-0.5 text-[9px] font-mono font-bold rounded border shadow-xs ${fileBadgeBg}`}>
                          {ext}
                        </span>
                      ))}
                    </div>

                    {/* Glowing Folder with Icon */}
                    <div className="w-14 h-12 rounded-xl bg-gradient-to-br from-[#3B82F6] to-[#8B5CF6] p-0.5 shadow-lg shadow-purple-500/20 flex items-center justify-center">
                      <div className={`w-full h-full rounded-[10px] flex items-center justify-center ${folderBoxBg}`}>
                        <FileUp className="w-6 h-6 text-[#3B82F6]" />
                      </div>
                    </div>
                  </div>

                  <h3 className={`text-sm font-bold mt-1 ${textPrimary}`}>Drag & drop files or folders here</h3>
                  <p className={`text-xs mt-1 ${textMuted}`}>CSV, JSON, Excel, TXT transcripts supported</p>

                  {/* Hidden Input */}
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={(e) => handleFileUpload(e.target.files)}
                    className="hidden"
                    accept=".csv,.json,.xlsx,.txt"
                  />

                  {/* Progress or Button */}
                  {isUploading ? (
                    <div className="w-full max-w-xs mt-4 space-y-1.5">
                      <div className={`w-full h-2 rounded-full overflow-hidden ${isDark ? 'bg-[#1e2530]' : 'bg-[#E2E8F0]'}`}>
                        <div
                          className="h-full bg-gradient-to-r from-[#3B82F6] to-[#8B5CF6] transition-all duration-200"
                          style={{ width: `${uploadProgress}%` }}
                        />
                      </div>
                      <p className={`text-[10px] font-mono ${textSecondary}`}>Uploading... {uploadProgress}%</p>
                    </div>
                  ) : (
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="mt-4 px-6 py-2.5 rounded-xl font-bold text-xs text-white bg-gradient-to-r from-[#3B82F6] to-[#8B5CF6] hover:opacity-90 transition-all shadow-lg shadow-blue-500/25 flex items-center gap-2 cursor-pointer"
                    >
                      <UploadCloud className="w-4 h-4" />
                      <span>Choose File</span>
                    </button>
                  )}
                </div>
              </div>
            </motion.div>

          </div>

          {/* ── Bottom Section: Recent Feedback Entries (Table) ─────────────── */}
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className={`p-6 rounded-2xl border space-y-5 ${cardBg}`}
          >
            {/* Header */}
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-[#3B82F6]" />
                  <h2 className={`text-base font-bold ${textPrimary}`}>Recent Feedback Entries</h2>
                </div>
                <p className={`text-xs mt-0.5 ${textSecondary}`}>Latest ingested feedback from all sources</p>
              </div>

              <button
                onClick={() => setShowAllModal(true)}
                className={`px-4 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${viewAllBtnClass}`}
              >
                View All Feedback
              </button>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[700px]">
                <thead>
                  <tr className={`border-b text-[11px] font-bold uppercase tracking-wider ${tableHeaderBorder}`}>
                    <th className="py-3 px-4">Content</th>
                    <th className="py-3 px-4">Source</th>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">Sentiment</th>
                    <th className="py-3 px-4 text-right"></th>
                  </tr>
                </thead>
                <tbody className={`divide-y text-xs ${tableDivide}`}>
                  {currentEntries.map((entry) => (
                    <tr
                      key={entry.id}
                      className={`transition-colors group ${tableRowHover}`}
                    >
                      {/* Content */}
                      <td className={`py-3.5 px-4 font-medium max-w-md truncate ${textPrimary}`}>
                        {entry.content}
                      </td>

                      {/* Source */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          {renderSourceLogo(entry.sourceType)}
                          <span className={`font-medium ${textSecondary}`}>{entry.source}</span>
                        </div>
                      </td>

                      {/* Date */}
                      <td className={`py-3.5 px-4 whitespace-nowrap ${textMuted}`}>
                        {entry.date}
                      </td>

                      {/* Category */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {getCategoryBadge(entry.category)}
                      </td>

                      {/* Sentiment */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {getSentimentBadge(entry.sentiment)}
                      </td>

                      {/* Action Menu */}
                      <td className="py-3.5 px-4 text-right relative">
                        <button
                          onClick={() => setActiveMenuId(activeMenuId === entry.id ? null : entry.id)}
                          className={`p-1.5 rounded-lg transition-colors ${
                            isDark
                              ? 'text-[#64748B] hover:text-white hover:bg-[#1e2530]'
                              : 'text-[#94A3B8] hover:text-[#0F172A] hover:bg-[#F1F5F9]'
                          }`}
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>

                        {/* Dropdown Menu */}
                        <AnimatePresence>
                          {activeMenuId === entry.id && (
                            <>
                              <div
                                className="fixed inset-0 z-10"
                                onClick={() => setActiveMenuId(null)}
                              />
                              <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className={`absolute right-4 top-10 w-44 border rounded-xl shadow-2xl z-20 py-1 overflow-hidden text-left ${menuDropdownBg}`}
                              >
                                <button
                                  onClick={() => {
                                    toast.success(`Viewing raw text: "${entry.content}"`, { style: toastStyle });
                                    setActiveMenuId(null);
                                  }}
                                  className={`w-full px-3 py-2 text-xs transition-colors flex items-center gap-2 ${menuItemHover}`}
                                >
                                  <FileText className="w-3.5 h-3.5" /> View Details
                                </button>
                                <button
                                  onClick={() => {
                                    toast.success('Sentiment re-analyzed!', { style: toastStyle });
                                    setActiveMenuId(null);
                                  }}
                                  className={`w-full px-3 py-2 text-xs transition-colors flex items-center gap-2 ${menuItemHover}`}
                                >
                                  <RefreshCw className="w-3.5 h-3.5" /> Re-analyze
                                </button>
                                <button
                                  onClick={() => handleDeleteEntry(entry.id)}
                                  className="w-full px-3 py-2 text-xs text-[#EF4444] hover:bg-[#EF4444]/15 transition-colors flex items-center gap-2"
                                >
                                  <X className="w-3.5 h-3.5" /> Delete Entry
                                </button>
                              </motion.div>
                            </>
                          )}
                        </AnimatePresence>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            <div className={`flex items-center justify-between pt-2 border-t flex-wrap gap-4 text-xs ${tableHeaderBorder}`}>
              <div>
                Showing {totalEntries > 0 ? startIndex + 1 : 0} to {Math.min(startIndex + itemsPerPage, totalEntries)} of {totalEntries} entries
              </div>

              <div className="flex items-center gap-1.5">
                {/* Previous */}
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  className={`p-1.5 rounded-lg border transition-all disabled:opacity-40 disabled:hover:bg-transparent ${
                    isDark ? 'border-[#2D3748] hover:bg-[#1e2530]' : 'border-[#CBD5E1] hover:bg-[#F1F5F9]'
                  }`}
                >
                  <ChevronLeft className={`w-4 h-4 ${textPrimary}`} />
                </button>

                {/* Page Numbers */}
                {Array.from({ length: totalPages }).map((_, idx) => {
                  const pageNum = idx + 1;
                  const isActive = currentPage === pageNum;
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`px-3 py-1 rounded-lg font-bold text-xs transition-all ${
                        isActive
                          ? 'bg-[#3B82F6] text-white shadow-md shadow-blue-500/20'
                          : isDark
                            ? 'text-[#94A3B8] hover:bg-[#1e2530] hover:text-white'
                            : 'text-[#475569] hover:bg-[#F1F5F9] hover:text-[#0F172A]'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}

                {/* Next */}
                <button
                  disabled={currentPage === totalPages || totalPages === 0}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  className={`p-1.5 rounded-lg border transition-all disabled:opacity-40 disabled:hover:bg-transparent ${
                    isDark ? 'border-[#2D3748] hover:bg-[#1e2530]' : 'border-[#CBD5E1] hover:bg-[#F1F5F9]'
                  }`}
                >
                  <ChevronRight className={`w-4 h-4 ${textPrimary}`} />
                </button>
              </div>
            </div>

          </motion.div>

        </main>
      </div>

      {/* ── View All Feedback Modal ─────────────────────────────────────────── */}
      <AnimatePresence>
        {showAllModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAllModal(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className={`relative w-full max-w-4xl border rounded-2xl p-6 z-10 max-h-[85vh] flex flex-col space-y-4 ${modalBg}`}
            >
              {/* Modal Header */}
              <div className={`flex items-center justify-between border-b pb-4 ${isDark ? 'border-[#1e2530]' : 'border-[#E2E8F0]'}`}>
                <div>
                  <h3 className={`text-lg font-bold flex items-center gap-2 ${textPrimary}`}>
                    <Database className="w-5 h-5 text-[#3B82F6]" />
                    All Ingested Feedback Records
                  </h3>
                  <p className={`text-xs ${textSecondary}`}>Filter and inspect raw customer feedback entries</p>
                </div>
                <button
                  onClick={() => setShowAllModal(false)}
                  className={`p-1.5 rounded-lg transition-colors ${isDark ? 'text-[#94A3B8] hover:text-white hover:bg-[#1e2530]' : 'text-[#64748B] hover:text-[#0F172A] hover:bg-[#F1F5F9]'}`}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Filters & Search */}
              <div className="flex items-center gap-3 flex-wrap">
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#64748B]" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Filter by keyword..."
                    className={`w-full pl-9 pr-3 py-2 text-xs border rounded-xl focus:outline-none focus:border-[#3B82F6] ${modalInputBg}`}
                  />
                </div>

                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className={`text-xs px-3 py-2 rounded-xl focus:outline-none focus:border-[#3B82F6] ${modalInputBg}`}
                >
                  <option value="All">All Categories</option>
                  <option value="Bug">Bug</option>
                  <option value="Feedback">Feedback</option>
                  <option value="Feature Request">Feature Request</option>
                  <option value="Performance">Performance</option>
                </select>
              </div>

              {/* Modal Content Table */}
              <div className={`flex-1 overflow-y-auto border rounded-xl ${isDark ? 'border-[#1e2530] bg-[#0D1117]/40' : 'border-[#E2E8F0] bg-[#F8FAFC]'}`}>
                <table className="w-full text-left text-xs">
                  <thead className={`sticky top-0 border-b font-bold ${isDark ? 'bg-[#161B22] border-[#1e2530] text-[#64748B]' : 'bg-white border-[#E2E8F0] text-[#64748B]'}`}>
                    <tr>
                      <th className="py-2.5 px-4">Content</th>
                      <th className="py-2.5 px-4">Source</th>
                      <th className="py-2.5 px-4">Category</th>
                      <th className="py-2.5 px-4">Sentiment</th>
                    </tr>
                  </thead>
                  <tbody className={`divide-y ${isDark ? 'divide-[#1e2530]' : 'divide-[#E2E8F0]'}`}>
                    {entries
                      .filter((e) =>
                        (selectedCategory === 'All' || e.category === selectedCategory) &&
                        (e.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          e.source.toLowerCase().includes(searchQuery.toLowerCase()))
                      )
                      .map((entry) => (
                        <tr key={entry.id} className={tableRowHover}>
                          <td className={`py-3 px-4 ${textPrimary}`}>{entry.content}</td>
                          <td className={`py-3 px-4 ${textSecondary}`}>{entry.source}</td>
                          <td className="py-3 px-4">{getCategoryBadge(entry.category)}</td>
                          <td className="py-3 px-4">{getSentimentBadge(entry.sentiment)}</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>

              {/* Modal Footer */}
              <div className="pt-2 flex justify-end">
                <button
                  onClick={() => setShowAllModal(false)}
                  className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-[#3B82F6] hover:bg-[#2563EB] transition-colors cursor-pointer"
                >
                  Done
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default FeedbackIngestionPage;

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText,
  Users,
  Moon,
  PieChart,
  LogOut,
  Settings2,
  RefreshCcw,
  Star,
  Snowflake,
  LayoutGrid,
  Target,
  CheckCircle2,
  Clock,
  File,
  Plus,
  X,
  Sparkles,
  Layers,
  Gauge,
  Lock,
  Headphones,
  Bell,
  CreditCard,
  Sliders,
} from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import { Sidebar } from '../components/Sidebar';
import { TopNavbar } from '../components/TopNavbar';
import { useTheme } from '../context/ThemeContext';
import { analyticsService, type BackendCluster } from '../services/analyticsService';

export interface PrioritizationItem {
  id: string;
  title: string;
  description: string;
  tags: string[];
  icon: React.ElementType;
  iconColor: string;
  reach: number; // Raw user reach number (e.g., 16000)
  impact: number; // 0.5 to 3.0 scale
  confidence: number; // 0.5 to 1.0 (50% to 100%)
  effort: number; // 1 to 10 person-weeks
  ease?: number; // 1 to 10 for ICE framework
  moscow?: 'Must' | 'Should' | 'Could' | 'Wont';
  customWeight?: number;
}

const DEFAULT_ITEMS: PrioritizationItem[] = [
  {
    id: 'p1',
    title: 'PDF Statement Export',
    description: 'Allow users to export account statements in PDF format',
    tags: ['Feature Request', 'High Impact'],
    icon: FileText,
    iconColor: '#8B5CF6',
    reach: 16000,
    impact: 3.0,
    confidence: 0.9,
    effort: 4,
    ease: 7,
    moscow: 'Must',
  },
  {
    id: 'p2',
    title: 'Dark Mode Support',
    description: 'Enable dark theme across web and mobile surfaces',
    tags: ['Feature Request', 'Medium Impact'],
    icon: Moon,
    iconColor: '#3B82F6',
    reach: 12500,
    impact: 2.5,
    confidence: 0.85,
    effort: 3,
    ease: 8,
    moscow: 'Should',
  },
  {
    id: 'p3',
    title: 'Spending Analytics Dashboard',
    description: 'Provide category-wise spending insights and metrics',
    tags: ['Feature Request', 'Medium Impact'],
    icon: PieChart,
    iconColor: '#10B981',
    reach: 10200,
    impact: 2.0,
    confidence: 0.8,
    effort: 3,
    ease: 6,
    moscow: 'Should',
  },
  {
    id: 'p4',
    title: 'Bulk Transaction Export',
    description: 'Export multiple transaction rows in CSV/XLS format',
    tags: ['Feature Request', 'Low Impact'],
    icon: LogOut,
    iconColor: '#F59E0B',
    reach: 7800,
    impact: 1.5,
    confidence: 0.75,
    effort: 5,
    ease: 5,
    moscow: 'Could',
  },
];

// Calculation helper for frameworks
function calculateScore(item: PrioritizationItem, framework: string): number {
  if (framework === 'RICE') {
    // RICE = (Reach * Impact * Confidence) / Effort
    // Normalize to roughly 0-100 scale for UI progress ring
    const raw = (item.reach * item.impact * item.confidence) / Math.max(item.effort, 1);
    return Math.min(Math.round(raw / 120), 100);
  } else if (framework === 'ICE') {
    // ICE = (Impact * 10 * Confidence * 10 * Ease) / 10
    const ease = item.ease || (10 - item.effort + 1);
    const raw = (item.impact * 3.33 * item.confidence * 10 * ease) / 10;
    return Math.min(Math.round(raw), 100);
  } else if (framework === 'MoSCoW') {
    switch (item.moscow) {
      case 'Must': return 95;
      case 'Should': return 75;
      case 'Could': return 50;
      case 'Wont': return 25;
      default: return 60;
    }
  } else {
    // Custom Weighted Score
    const score = (item.reach / 200) * 0.3 + (item.impact * 20) * 0.3 + (item.confidence * 100) * 0.2 + ((10 - item.effort) * 10) * 0.2;
    return Math.min(Math.round(score), 100);
  }
}

export const PrioritizationPage: React.FC = () => {
  const { isDark } = useTheme();
  const navigate = useNavigate();

  // Framework selection state
  const [activeFramework, setActiveFramework] = useState<'RICE' | 'ICE' | 'MoSCoW' | 'Custom Weights'>('RICE');
  const [items, setItems] = useState<PrioritizationItem[]>(DEFAULT_ITEMS);
  const [isLiveConnected, setIsLiveConnected] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  // Add Item Modal state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newReach, setNewReach] = useState(5000);
  const [newImpact, setNewImpact] = useState(2.0);
  const [newConfidence, setNewConfidence] = useState(80);
  const [newEffort, setNewEffort] = useState(3);

  // Toast style
  const toastStyle = {
    background: isDark ? '#161B22' : '#ffffff',
    color: isDark ? '#F8FAFC' : '#0F172A',
    border: `1px solid ${isDark ? '#2D3748' : '#E2E8F0'}`,
  };

  // Sync with live backend clusters
  const fetchBackendClusters = async () => {
    setIsSyncing(true);
    try {
      const clusters = await analyticsService.getThemeClusters();
      if (Array.isArray(clusters) && clusters.length > 0) {
        const transformed: PrioritizationItem[] = clusters.map((c, idx) => {
          const title = c.category || c.name || c.theme || `Feature Theme ${idx + 1}`;
          const count = c.total_volume || c.count || c.mentions || 500;
          const avgSeverity = c.avg_severity ?? 3.5;

          return {
            id: `cluster-${idx}-${title.toLowerCase().replace(/\s+/g, '-')}`,
            title,
            description: c.quote || `Extracted pain point cluster with ${count} customer feedback mentions.`,
            tags: ['AI Cluster', avgSeverity > 4 ? 'High Priority' : 'Medium Priority'],
            icon: c.category?.toLowerCase().includes('pdf') ? FileText : c.category?.toLowerCase().includes('dark') ? Moon : Sliders,
            iconColor: idx % 3 === 0 ? '#8B5CF6' : idx % 3 === 1 ? '#3B82F6' : '#10B981',
            reach: count * 15,
            impact: Math.min(Math.max(avgSeverity / 1.5, 1.0), 3.0),
            confidence: 0.85,
            effort: Math.max(Math.floor(6 - avgSeverity), 2),
            ease: Math.min(Math.floor(avgSeverity * 2), 9),
            moscow: avgSeverity >= 4 ? 'Must' : avgSeverity >= 3 ? 'Should' : 'Could',
          };
        });

        setItems(transformed);
        setIsLiveConnected(true);
        toast.success(`Synchronized ${clusters.length} pain point features from backend!`, { style: toastStyle });
      }
    } catch (err) {
      console.warn('Backend clusters sync failed, using current items:', err);
      toast.error('Backend sync unavailable. Operating in local interactive mode.', { style: toastStyle });
    } finally {
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    fetchBackendClusters();
  }, []);

  // Recalculate and sort items by active framework score
  const sortedItems = [...items].map(item => ({
    ...item,
    calculatedScore: calculateScore(item, activeFramework),
  })).sort((a, b) => b.calculatedScore - a.calculatedScore);

  // Update item parameters directly from inline inputs
  const handleItemChange = (id: string, field: keyof PrioritizationItem, value: number) => {
    setItems(prev => prev.map(item => item.id === id ? { ...item, [field]: value } : item));
  };

  // Add Custom Feature
  const handleAddFeature = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) {
      toast.error('Feature title is required');
      return;
    }

    const newItem: PrioritizationItem = {
      id: `custom-${Date.now()}`,
      title: newTitle,
      description: newDescription || 'Custom user feature request',
      tags: ['Custom Request', 'User Defined'],
      icon: Target,
      iconColor: '#3B82F6',
      reach: newReach,
      impact: newImpact,
      confidence: newConfidence / 100,
      effort: newEffort,
      ease: Math.max(10 - newEffort, 1),
      moscow: 'Should',
    };

    setItems(prev => [newItem, ...prev]);
    setIsAddModalOpen(false);
    setNewTitle('');
    setNewDescription('');
    toast.success(`Added "${newItem.title}" to prioritization matrix!`, { style: toastStyle });
  };

  // Generate PRD Handler
  const handleGeneratePRD = (featureTitle: string) => {
    navigate(`/prd-generator?feature=${encodeURIComponent(featureTitle)}`, {
      state: { feature_name: featureTitle },
    });
  };

  const cardBg = isDark
    ? 'bg-[#161B22]/90 border-[#2D3748]'
    : 'bg-white border-[#E2E8F0]';

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
                  Prioritization Engine
                  <span className="text-xs px-2.5 py-1 rounded-full bg-[#8B5CF6]/15 text-[#8B5CF6] border border-[#8B5CF6]/30 font-semibold">
                    {isLiveConnected ? 'FastAPI & RICE Live' : 'Interactive Framework'}
                  </span>
                  <Settings2 className="w-5 h-5 text-[#8B5CF6]" />
                </h1>
                <p className="mt-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
                  Score, rank, and evaluate feature requests using standard PM scoring algorithms (RICE, ICE, MoSCoW).
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => setIsAddModalOpen(true)}
                  className="px-4 py-2.5 rounded-xl font-bold bg-[#8B5CF6] hover:bg-[#7C3AED] text-white flex items-center gap-2 transition-all text-sm shadow-md"
                >
                  <Plus className="w-4 h-4" />
                  Add Feature
                </button>
                <button
                  onClick={fetchBackendClusters}
                  disabled={isSyncing}
                  className={`px-5 py-2.5 rounded-xl font-bold bg-[#3B82F6] hover:bg-[#2563EB] text-white flex items-center gap-2 transition-all text-sm shadow-md ${isSyncing ? 'opacity-50' : ''}`}
                >
                  <RefreshCcw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
                  {isSyncing ? 'Syncing...' : 'Sync & Recalculate'}
                </button>
              </div>
            </div>

            {/* Framework Tabs */}
            <div className={`rounded-xl border ${cardBg}`}>
              <div className="flex flex-wrap items-center divide-x divide-[#2D3748]">
                {[
                  { id: 'RICE', label: 'RICE Score', icon: Star, desc: 'Score = (Reach × Impact × Confidence) / Effort' },
                  { id: 'ICE', label: 'ICE Score', icon: Snowflake, desc: 'Score = (Impact × Confidence × Ease) / 10' },
                  { id: 'MoSCoW', label: 'MoSCoW Matrix', icon: LayoutGrid, desc: 'Categorize by Must, Should, Could, Won\'t' },
                  { id: 'Custom Weights', label: 'Custom Weights', icon: Target, desc: 'Weighted average across Reach, Impact & Effort' },
                ].map(fw => {
                  const Icon = fw.icon;
                  const isActive = activeFramework === fw.id;
                  return (
                    <button
                      key={fw.id}
                      onClick={() => setActiveFramework(fw.id as any)}
                      className={`flex-1 py-4 px-4 flex items-center justify-center gap-2 font-bold transition-all text-sm ${
                        isActive
                          ? 'text-[#3B82F6] border-b-2 border-[#3B82F6] bg-[#3B82F6]/5'
                          : isDark ? 'text-[#94A3B8] hover:bg-[#1e2530]' : 'text-[#64748B] hover:bg-[#F1F5F9]'
                      }`}
                    >
                      <Icon className={`w-4 h-4 ${isActive ? 'text-[#3B82F6]' : ''}`} />
                      {fw.label}
                    </button>
                  );
                })}
              </div>
              <div className="p-3 text-center text-xs font-mono" style={{ color: 'var(--text-muted)' }}>
                Active Framework Formula: <span className="text-[#3B82F6] font-semibold">{
                  activeFramework === 'RICE' ? '(Reach × Impact × Confidence) / Effort' :
                  activeFramework === 'ICE' ? '(Impact × Confidence × Ease) / 10' :
                  activeFramework === 'MoSCoW' ? 'Must Have (95) > Should Have (75) > Could Have (50) > Won\'t Have (25)' :
                  'Reach(30%) + Impact(30%) + Confidence(20%) + Ease(20%)'
                }</span>
              </div>
            </div>

            {/* Interactive Prioritization Table */}
            <div className={`border rounded-2xl overflow-hidden ${cardBg}`}>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className={`text-xs ${tableHeaderBg}`}>
                    <tr>
                      <th className="px-6 py-4 font-semibold w-36">Rank & Score</th>
                      <th className="px-6 py-4 font-semibold">Feature & Details</th>
                      <th className="px-6 py-4 font-semibold text-center" colSpan={4}>Interactive Parameters</th>
                      <th className="px-6 py-4 font-semibold text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className={`divide-y ${isDark ? 'divide-[#2D3748]' : 'divide-slate-200'}`}>
                    {sortedItems.map((row, idx) => {
                      const rankStr = `#${idx + 1}`;
                      const scoreColor = idx === 0 ? '#F59E0B' : idx === 1 ? '#94A3B8' : idx === 2 ? '#F97316' : '#3B82F6';

                      return (
                        <tr key={row.id} className={`transition-colors group ${isDark ? 'hover:bg-[#161B22]/50' : 'hover:bg-slate-50'}`}>
                          {/* Rank & Ring Score */}
                          <td className="px-6 py-6">
                            <div className="flex items-center gap-4">
                              <span className="font-bold text-lg w-6" style={{ color: scoreColor }}>{rankStr}</span>
                              <div className="relative w-14 h-14 rounded-full flex items-center justify-center" style={{ border: `3px solid ${scoreColor}40`, borderTopColor: scoreColor, transform: 'rotate(-45deg)' }}>
                                <div className="absolute inset-0 flex flex-col items-center justify-center" style={{ transform: 'rotate(45deg)' }}>
                                  <span className={`text-base font-extrabold leading-none ${isDark ? 'text-white' : 'text-gray-900'}`}>{row.calculatedScore}</span>
                                  <span className="text-[9px]" style={{ color: 'var(--text-muted)' }}>/100</span>
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Details */}
                          <td className="px-6 py-4 max-w-sm">
                            <div className="flex items-start gap-3">
                              <div className="p-2.5 rounded-xl bg-opacity-10 border mt-1 flex-shrink-0" style={{ backgroundColor: `${row.iconColor}15`, borderColor: `${row.iconColor}30`, color: row.iconColor }}>
                                <row.icon className="w-5 h-5" />
                              </div>
                              <div>
                                <h3 className="font-bold text-base" style={{ color: 'var(--text-primary)' }}>{row.title}</h3>
                                <p className="text-xs mt-0.5 line-clamp-2" style={{ color: 'var(--text-secondary)' }}>{row.description}</p>
                                <div className="flex flex-wrap items-center gap-1.5 mt-2">
                                  {row.tags.map((tag, tIdx) => (
                                    <span key={tIdx} className={`px-2 py-0.5 rounded-md text-[10px] font-semibold border ${
                                      isDark ? 'bg-[#1e2530] text-[#94A3B8] border-[#2D3748]' : 'bg-slate-100 text-slate-700 border-slate-200'
                                    }`}>
                                      {tag}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Parameter Inputs */}
                          {/* Reach */}
                          <td className="px-3 py-4 align-top pt-6">
                            <div className="flex flex-col items-center text-center space-y-1">
                              <span className="flex items-center gap-1 text-[11px] font-semibold" style={{ color: 'var(--text-secondary)' }}>
                                <Users className="w-3 h-3 text-[#3B82F6]" /> Reach
                              </span>
                              <input
                                type="number"
                                step="500"
                                min="100"
                                value={row.reach}
                                onChange={(e) => handleItemChange(row.id, 'reach', Number(e.target.value))}
                                className={`w-20 px-2 py-1 text-xs text-center rounded-lg border font-bold ${
                                  isDark ? 'bg-[#0D1117] border-[#2D3748] text-white' : 'bg-white border-[#CBD5E1] text-gray-900 shadow-sm'
                                }`}
                              />
                              <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>users/mo</span>
                            </div>
                          </td>

                          {/* Impact */}
                          <td className="px-3 py-4 align-top pt-6">
                            <div className="flex flex-col items-center text-center space-y-1">
                              <span className="flex items-center gap-1 text-[11px] font-semibold" style={{ color: 'var(--text-secondary)' }}>
                                <Target className="w-3 h-3 text-[#8B5CF6]" /> Impact
                              </span>
                              <select
                                value={row.impact}
                                onChange={(e) => handleItemChange(row.id, 'impact', Number(e.target.value))}
                                className={`w-20 px-1 py-1 text-xs text-center rounded-lg border font-bold ${
                                  isDark ? 'bg-[#0D1117] border-[#2D3748] text-white' : 'bg-white border-[#E2E8F0] text-gray-900'
                                }`}
                              >
                                <option value={3.0}>3.0 (Massive)</option>
                                <option value={2.5}>2.5 (High)</option>
                                <option value={2.0}>2.0 (Medium)</option>
                                <option value={1.5}>1.5 (Low)</option>
                                <option value={1.0}>1.0 (Minimal)</option>
                              </select>
                              <span className="text-[10px] text-[#64748B]">{row.impact >= 2.5 ? 'High' : 'Medium'}</span>
                            </div>
                          </td>

                          {/* Confidence */}
                          <td className="px-3 py-4 align-top pt-6">
                            <div className="flex flex-col items-center text-center space-y-1">
                              <span className="flex items-center gap-1 text-[11px] text-[#94A3B8]">
                                <CheckCircle2 className="w-3 h-3 text-[#10B981]" /> Confidence
                              </span>
                              <select
                                value={row.confidence}
                                onChange={(e) => handleItemChange(row.id, 'confidence', Number(e.target.value))}
                                className={`w-20 px-1 py-1 text-xs text-center rounded-lg border font-bold ${
                                  isDark ? 'bg-[#0D1117] border-[#2D3748] text-white' : 'bg-white border-[#CBD5E1] text-gray-900 shadow-sm'
                                }`}
                              >
                                <option value={1.0}>100% High</option>
                                <option value={0.9}>90% High</option>
                                <option value={0.8}>80% Medium</option>
                                <option value={0.7}>70% Medium</option>
                                <option value={0.5}>50% Low</option>
                              </select>
                              <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{Math.round(row.confidence * 100)}%</span>
                            </div>
                          </td>

                          {/* Effort */}
                          <td className="px-3 py-4 align-top pt-6">
                            <div className="flex flex-col items-center text-center space-y-1">
                              <span className="flex items-center gap-1 text-[11px] font-semibold" style={{ color: 'var(--text-secondary)' }}>
                                <Clock className="w-3 h-3 text-[#F43F5E]" /> Effort
                              </span>
                              <input
                                type="number"
                                min="1"
                                max="20"
                                value={row.effort}
                                onChange={(e) => handleItemChange(row.id, 'effort', Number(e.target.value))}
                                className={`w-16 px-2 py-1 text-xs text-center rounded-lg border font-bold ${
                                  isDark ? 'bg-[#0D1117] border-[#2D3748] text-white' : 'bg-white border-[#CBD5E1] text-gray-900 shadow-sm'
                                }`}
                              />
                              <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>person-wks</span>
                            </div>
                          </td>

                          {/* Action */}
                          <td className="px-6 py-4 text-right align-middle">
                            <button
                              onClick={() => handleGeneratePRD(row.title)}
                              className="px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-[#3B82F6] to-[#8B5CF6] text-white hover:opacity-90 transition-all shadow-md inline-flex items-center gap-2"
                            >
                              <File className="w-3.5 h-3.5" />
                              Generate PRD
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

          {/* Add Feature Modal */}
          <AnimatePresence>
            {isAddModalOpen && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className={`w-full max-w-lg rounded-2xl border p-6 shadow-2xl ${
                    isDark ? 'bg-[#161B22] border-[#2D3748] text-white' : 'bg-white border-[#E2E8F0] text-gray-900'
                  }`}
                >
                  <div className="flex items-center justify-between pb-4 border-b border-[#2D3748]">
                    <h3 className="text-lg font-bold flex items-center gap-2">
                      <Plus className="w-5 h-5 text-[#8B5CF6]" /> Add Feature for Prioritization
                    </h3>
                    <button onClick={() => setIsAddModalOpen(false)} className="p-1 rounded-lg hover:bg-gray-700/30">
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <form onSubmit={handleAddFeature} className="mt-4 space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-[#94A3B8] mb-1">Feature Title</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Automated Receipt Scanning"
                        value={newTitle}
                        onChange={e => setNewTitle(e.target.value)}
                        className={`w-full px-3 py-2 text-sm rounded-xl border ${
                          isDark ? 'bg-[#0D1117] border-[#2D3748]' : 'bg-gray-50 border-[#E2E8F0]'
                        }`}
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-[#94A3B8] mb-1">Description</label>
                      <textarea
                        rows={2}
                        placeholder="Short summary of user friction or feature scope"
                        value={newDescription}
                        onChange={e => setNewDescription(e.target.value)}
                        className={`w-full px-3 py-2 text-sm rounded-xl border ${
                          isDark ? 'bg-[#0D1117] border-[#2D3748]' : 'bg-gray-50 border-[#E2E8F0]'
                        }`}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-[#94A3B8] mb-1">Reach (users/month)</label>
                        <input
                          type="number"
                          step="500"
                          value={newReach}
                          onChange={e => setNewReach(Number(e.target.value))}
                          className={`w-full px-3 py-2 text-sm rounded-xl border ${
                            isDark ? 'bg-[#0D1117] border-[#2D3748]' : 'bg-gray-50 border-[#E2E8F0]'
                          }`}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-[#94A3B8] mb-1">Impact (1.0 - 3.0)</label>
                        <select
                          value={newImpact}
                          onChange={e => setNewImpact(Number(e.target.value))}
                          className={`w-full px-3 py-2 text-sm rounded-xl border ${
                            isDark ? 'bg-[#0D1117] border-[#2D3748]' : 'bg-gray-50 border-[#E2E8F0]'
                          }`}
                        >
                          <option value={3.0}>3.0 (Massive)</option>
                          <option value={2.5}>2.5 (High)</option>
                          <option value={2.0}>2.0 (Medium)</option>
                          <option value={1.5}>1.5 (Low)</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-[#94A3B8] mb-1">Confidence (%)</label>
                        <input
                          type="number"
                          min="10"
                          max="100"
                          value={newConfidence}
                          onChange={e => setNewConfidence(Number(e.target.value))}
                          className={`w-full px-3 py-2 text-sm rounded-xl border ${
                            isDark ? 'bg-[#0D1117] border-[#2D3748]' : 'bg-gray-50 border-[#E2E8F0]'
                          }`}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-[#94A3B8] mb-1">Effort (Person-Weeks)</label>
                        <input
                          type="number"
                          min="1"
                          max="20"
                          value={newEffort}
                          onChange={e => setNewEffort(Number(e.target.value))}
                          className={`w-full px-3 py-2 text-sm rounded-xl border ${
                            isDark ? 'bg-[#0D1117] border-[#2D3748]' : 'bg-gray-50 border-[#E2E8F0]'
                          }`}
                        />
                      </div>
                    </div>

                    <div className="pt-4 flex justify-end gap-3 border-t border-[#2D3748]">
                      <button
                        type="button"
                        onClick={() => setIsAddModalOpen(false)}
                        className="px-4 py-2 rounded-xl text-sm font-semibold hover:bg-gray-700/30"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-5 py-2 rounded-xl text-sm font-bold bg-[#8B5CF6] hover:bg-[#7C3AED] text-white shadow-md"
                      >
                        Save Feature
                      </button>
                    </div>
                  </form>
                </motion.div>
              </div>
            )}
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
};

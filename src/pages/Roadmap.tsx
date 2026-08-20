import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Map,
  Plus,
  Gauge,
  Lock,
  CloudLightning,
  PenTool,
  BarChart,
  Building,
  MoreHorizontal,
  Sparkles,
  Star,
  Users,
  Calendar,
  BrainCircuit,
  Kanban,
  ListFilter,
  Layers,
  FileText,
  X,
  CheckCircle2,
  Clock,
  RefreshCcw,
} from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import { Sidebar } from '../components/Sidebar';
import { TopNavbar } from '../components/TopNavbar';
import { useTheme } from '../context/ThemeContext';
import { analyticsService } from '../services/analyticsService';

export interface RoadmapItem {
  id: string;
  title: string;
  track: 'Performance' | 'Auth' | 'Ingestion' | 'UI/UX' | 'Analytics' | 'Enterprise';
  stage: 'Now' | 'Next' | 'Later' | 'Shipped';
  quarter: 'Q1' | 'Q2' | 'Q3' | 'Q4';
  progress: number; // 0 to 100
  assignee?: string;
  color: string;
}

const DEFAULT_ROADMAP_ITEMS: RoadmapItem[] = [
  { id: 'rm-1', title: 'Transaction Speed Fix', track: 'Performance', stage: 'Shipped', quarter: 'Q1', progress: 100, assignee: 'Alex M.', color: '#EF4444' },
  { id: 'rm-2', title: 'Login Stability & OAuth', track: 'Auth', stage: 'Shipped', quarter: 'Q1', progress: 100, assignee: 'Sarah K.', color: '#3B82F6' },
  { id: 'rm-3', title: 'Feedback Ingestion Pipeline', track: 'Ingestion', stage: 'Now', quarter: 'Q2', progress: 100, assignee: 'Gagan G.', color: '#8B5CF6' },
  { id: 'rm-4', title: 'PDF Statement Export - PRD', track: 'UI/UX', stage: 'Now', quarter: 'Q2', progress: 60, assignee: 'Syed Adnan', color: '#C084FC' },
  { id: 'rm-5', title: 'Dark Mode Support', track: 'UI/UX', stage: 'Now', quarter: 'Q3', progress: 85, assignee: 'Syed Adnan', color: '#10B981' },
  { id: 'rm-6', title: 'Spending Analytics', track: 'Analytics', stage: 'Next', quarter: 'Q3', progress: 20, assignee: 'Harshita N.', color: '#F59E0B' },
  { id: 'rm-7', title: 'Bulk Export API', track: 'Enterprise', stage: 'Later', quarter: 'Q4', progress: 15, assignee: 'Akhila S.', color: '#D97706' },
];

export const RoadmapPage: React.FC = () => {
  const { isDark } = useTheme();
  const navigate = useNavigate();

  // State
  const [viewMode, setViewMode] = useState<'Gantt' | 'Kanban' | 'Sprint'>('Gantt');
  const [items, setItems] = useState<RoadmapItem[]>(DEFAULT_ROADMAP_ITEMS);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isLiveConnected, setIsLiveConnected] = useState(false);

  // Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newTrack, setNewTrack] = useState<RoadmapItem['track']>('UI/UX');
  const [newStage, setNewStage] = useState<RoadmapItem['stage']>('Next');
  const [newQuarter, setNewQuarter] = useState<RoadmapItem['quarter']>('Q3');
  const [newProgress, setNewProgress] = useState(25);
  const [newAssignee, setNewAssignee] = useState('Product Team');

  // Toast style
  const toastStyle = {
    background: isDark ? '#161B22' : '#ffffff',
    color: isDark ? '#F8FAFC' : '#0F172A',
    border: `1px solid ${isDark ? '#2D3748' : '#E2E8F0'}`,
  };

  // Sync with live clusters from backend
  const handleSyncBackendClusters = async () => {
    setIsSyncing(true);
    try {
      const clusters = await analyticsService.getThemeClusters();
      if (Array.isArray(clusters) && clusters.length > 0) {
        const imported: RoadmapItem[] = clusters.map((c, idx) => {
          const title = c.category || c.name || c.theme || `Feature Cluster ${idx + 1}`;
          const avgSeverity = c.avg_severity ?? 3.5;
          let track: RoadmapItem['track'] = 'UI/UX';
          if (title.toLowerCase().includes('speed') || title.toLowerCase().includes('slow')) track = 'Performance';
          if (title.toLowerCase().includes('login') || title.toLowerCase().includes('auth')) track = 'Auth';
          if (title.toLowerCase().includes('analytics')) track = 'Analytics';

          return {
            id: `cluster-rm-${idx}`,
            title,
            track,
            stage: avgSeverity >= 4 ? 'Now' : avgSeverity >= 3 ? 'Next' : 'Later',
            quarter: idx % 2 === 0 ? 'Q3' : 'Q4',
            progress: Math.round(avgSeverity * 15),
            assignee: 'AI Product Copilot',
            color: idx % 3 === 0 ? '#8B5CF6' : idx % 3 === 1 ? '#3B82F6' : '#10B981',
          };
        });

        setItems(prev => {
          const existingTitles = new Set(prev.map(i => i.title.toLowerCase()));
          const newUnique = imported.filter(i => !existingTitles.has(i.title.toLowerCase()));
          return [...prev, ...newUnique];
        });
        setIsLiveConnected(true);
        toast.success(`Imported ${clusters.length} backend themes into Roadmap backlog!`, { style: toastStyle });
      }
    } catch (err) {
      toast.error('Backend sync unavailable. Local roadmap state active.', { style: toastStyle });
    } finally {
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    handleSyncBackendClusters();
  }, []);

  // Add Item Handler
  const handleAddFeature = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const newItem: RoadmapItem = {
      id: `rm-${Date.now()}`,
      title: newTitle,
      track: newTrack,
      stage: newStage,
      quarter: newQuarter,
      progress: newProgress,
      assignee: newAssignee,
      color: '#8B5CF6',
    };

    setItems(prev => [...prev, newItem]);
    setIsAddModalOpen(false);
    setNewTitle('');
    toast.success(`Added "${newItem.title}" to ${newItem.quarter} Roadmap!`, { style: toastStyle });
  };

  // Update item progress directly
  const handleProgressChange = (id: string, newProgress: number) => {
    setItems(prev => prev.map(item => item.id === id ? { ...item, progress: newProgress } : item));
  };

  // Generate PRD
  const handleGeneratePRD = (title: string) => {
    navigate(`/prd-generator?feature=${encodeURIComponent(title)}`, {
      state: { feature_name: title },
    });
  };

  const cardBg = isDark
    ? 'bg-[#161B22]/90 border-[#2D3748] shadow-lg shadow-black/20'
    : 'bg-white border-[#E2E8F0] shadow-sm hover:shadow-md';

  const tableBorder = isDark ? 'border-[#2D3748]' : 'border-[#E2E8F0]';

  return (
    <div className="min-h-screen transition-colors duration-200" style={{ backgroundColor: 'var(--bg-base)' }}>
      <Sidebar />
      <div className="ml-60 min-h-screen flex flex-col">
        <TopNavbar />
        <main className="flex-1 pt-20 px-8 pb-12 w-full max-w-screen-2xl mx-auto space-y-6">
          <Toaster position="top-right" />

          {/* Header */}
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'} flex items-center gap-3`}>
                Product Roadmap — Dynamic Workspace
                <Map className="w-6 h-6 text-[#8B5CF6]" />
              </h1>
              <p className="text-sm text-[#94A3B8] mt-1 flex items-center gap-2">
                <span>Dynamic Sync:</span>
                <span className="text-[#10B981] font-semibold">{isLiveConnected ? 'Active PostgreSQL Backend' : 'Active Local Store'}</span>
                <span>• {items.length} total roadmap items</span>
              </p>
            </div>

            <div className="flex items-center gap-3">
              {/* View Switcher */}
              <div className={`flex items-center p-1 rounded-xl border ${cardBg}`}>
                <button
                  onClick={() => setViewMode('Gantt')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                    viewMode === 'Gantt' ? 'bg-[#3B82F6] text-white shadow-sm' : 'text-[#94A3B8] hover:text-white'
                  }`}
                >
                  <Calendar className="w-3.5 h-3.5" /> Timeline
                </button>
                <button
                  onClick={() => setViewMode('Kanban')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                    viewMode === 'Kanban' ? 'bg-[#3B82F6] text-white shadow-sm' : 'text-[#94A3B8] hover:text-white'
                  }`}
                >
                  <Kanban className="w-3.5 h-3.5" /> Kanban Board
                </button>
                <button
                  onClick={() => setViewMode('Sprint')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                    viewMode === 'Sprint' ? 'bg-[#3B82F6] text-white shadow-sm' : 'text-[#94A3B8] hover:text-white'
                  }`}
                >
                  <Layers className="w-3.5 h-3.5" /> Sprint View
                </button>
              </div>

              <button
                onClick={handleSyncBackendClusters}
                disabled={isSyncing}
                className="px-3.5 py-2 rounded-xl bg-[#1E293B] hover:bg-[#334155] border border-[#334155] text-white font-medium text-xs flex items-center gap-1.5 transition-all"
              >
                <RefreshCcw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                Import Pain Points
              </button>

              <button
                onClick={() => setIsAddModalOpen(true)}
                className="px-4 py-2 rounded-xl bg-[#6366F1] hover:bg-[#4F46E5] text-white font-bold text-xs flex items-center gap-2 transition-all shadow-md"
              >
                <Plus className="w-4 h-4" />
                Add Feature
              </button>
            </div>
          </div>

          {/* VIEW MODE 1: GANTT TIMELINE TABLE */}
          {viewMode === 'Gantt' && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className={`rounded-2xl border ${cardBg} overflow-hidden`}
            >
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[900px]">
                  <thead>
                    <tr className={`border-b ${tableBorder}`}>
                      <th className={`p-4 font-semibold text-xs tracking-wider text-[#94A3B8] uppercase w-[200px] border-r ${tableBorder}`}>
                        Tracks
                      </th>
                      {['Q1 (Jan-Mar)', 'Q2 (Apr-Jun)', 'Q3 (Jul-Sep)', 'Q4 (Oct-Dec)'].map((q, idx) => (
                        <th key={idx} className={`p-4 text-center border-r ${tableBorder} w-[25%] ${idx === 2 ? 'bg-[#8B5CF6]/5 relative' : ''}`}>
                          <div className={`font-semibold ${idx === 2 ? 'text-[#8B5CF6]' : isDark ? 'text-white' : 'text-gray-900'}`}>{q}</div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#2D3748]">
                    {['Performance', 'Auth', 'Ingestion', 'UI/UX', 'Analytics', 'Enterprise'].map(trackName => {
                      const trackItems = items.filter(i => i.track === trackName);
                      const TrackIcon =
                        trackName === 'Performance' ? Gauge :
                        trackName === 'Auth' ? Lock :
                        trackName === 'Ingestion' ? CloudLightning :
                        trackName === 'UI/UX' ? PenTool :
                        trackName === 'Analytics' ? BarChart : Building;

                      return (
                        <tr key={trackName}>
                          <td className={`p-4 border-r ${tableBorder}`}>
                            <div className="flex items-center gap-3">
                              <div className={`p-2 rounded-lg border ${isDark ? 'bg-[#1E293B] border-[#334155] text-[#CBD5E1]' : 'bg-[#F8FAFC] border-[#E2E8F0] text-[#475569]'}`}>
                                <TrackIcon className="w-4 h-4" />
                              </div>
                              <span className={`text-sm font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{trackName}</span>
                            </div>
                          </td>

                          {(['Q1', 'Q2', 'Q3', 'Q4'] as const).map(q => {
                            const qItem = trackItems.find(i => i.quarter === q);
                            return (
                              <td key={q} className={`p-3 border-r ${tableBorder} relative`}>
                                {qItem ? (
                                  <div className="p-2.5 rounded-xl border border-[#3B82F6]/30 bg-[#3B82F6]/10 flex flex-col space-y-1 shadow-sm">
                                    <div className="flex items-center justify-between">
                                      <span className="text-xs font-bold text-white truncate">{qItem.title}</span>
                                      <span className="text-[10px] font-mono text-[#93C5FD]">{qItem.progress}%</span>
                                    </div>
                                    <div className="w-full bg-[#1E293B] rounded-full h-1.5">
                                      <div className="bg-[#3B82F6] h-1.5 rounded-full" style={{ width: `${qItem.progress}%` }}></div>
                                    </div>
                                    <div className="flex items-center justify-between pt-1 text-[10px] text-[#94A3B8]">
                                      <span>{qItem.assignee}</span>
                                      <button
                                        onClick={() => handleGeneratePRD(qItem.title)}
                                        className="text-[#C084FC] hover:underline font-semibold"
                                      >
                                        PRD →
                                      </button>
                                    </div>
                                  </div>
                                ) : (
                                  <button
                                    onClick={() => {
                                      setNewTrack(trackName as RoadmapItem['track']);
                                      setNewQuarter(q as RoadmapItem['quarter']);
                                      setIsAddModalOpen(true);
                                    }}
                                    className="w-full h-10 rounded-lg border border-dashed border-[#2D3748] hover:border-[#3B82F6]/50 hover:bg-[#3B82F6]/5 flex items-center justify-center text-[11px] text-[#64748B] hover:text-[#3B82F6] transition-colors cursor-pointer"
                                  >
                                    + Add Feature
                                  </button>
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}

          {/* VIEW MODE 2: KANBAN BOARD */}
          {viewMode === 'Kanban' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {(['Now', 'Next', 'Later', 'Shipped'] as const).map(stage => {
                const stageItems = items.filter(i => i.stage === stage);
                const stageBadgeColor =
                  stage === 'Now' ? 'bg-[#8B5CF6]/15 text-[#8B5CF6] border-[#8B5CF6]/30' :
                  stage === 'Next' ? 'bg-[#3B82F6]/15 text-[#3B82F6] border-[#3B82F6]/30' :
                  stage === 'Later' ? 'bg-[#F59E0B]/15 text-[#F59E0B] border-[#F59E0B]/30' :
                  'bg-[#10B981]/15 text-[#10B981] border-[#10B981]/30';

                return (
                  <div key={stage} className={`p-4 rounded-2xl border ${cardBg} space-y-3 min-h-[400px]`}>
                    <div className="flex items-center justify-between pb-2 border-b border-[#2D3748]">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-extrabold border ${stageBadgeColor}`}>
                        {stage} ({stageItems.length})
                      </span>
                    </div>

                    <div className="space-y-3">
                      {stageItems.map(item => (
                        <div key={item.id} className="p-3.5 rounded-xl border border-[#2D3748] bg-[#0D1117] space-y-2 shadow-sm">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-[#1E293B] text-[#94A3B8]">
                              {item.track}
                            </span>
                            <span className="text-[10px] text-[#64748B] font-mono">{item.quarter}</span>
                          </div>
                          <h4 className="text-sm font-bold text-white">{item.title}</h4>

                          <div className="space-y-1 pt-1">
                            <div className="flex justify-between text-[11px] text-[#94A3B8]">
                              <span>Progress</span>
                              <span>{item.progress}%</span>
                            </div>
                            <input
                              type="range"
                              min="0"
                              max="100"
                              value={item.progress}
                              onChange={(e) => handleProgressChange(item.id, Number(e.target.value))}
                              className="w-full h-1.5 bg-[#1E293B] rounded-lg appearance-none cursor-pointer accent-[#3B82F6]"
                            />
                          </div>

                          <div className="flex items-center justify-between pt-2 border-t border-[#2D3748]">
                            <span className="text-[11px] text-[#94A3B8]">{item.assignee}</span>
                            <button
                              onClick={() => handleGeneratePRD(item.title)}
                              className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-[#8B5CF6]/20 text-[#C084FC] hover:bg-[#8B5CF6]/30"
                            >
                              Generate PRD
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </motion.div>
          )}

          {/* VIEW MODE 3: SPRINT VIEW */}
          {viewMode === 'Sprint' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className={`p-6 rounded-2xl border ${cardBg} space-y-4`}>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Layers className="w-5 h-5 text-[#3B82F6]" /> Active Sprint Items & Engineering Deliverables
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {items.map(item => (
                  <div key={item.id} className="p-4 rounded-xl border border-[#2D3748] bg-[#0D1117] flex items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#3B82F6]/20 text-[#3B82F6]">{item.track}</span>
                        <span className="text-xs font-semibold text-[#94A3B8]">{item.stage} • {item.quarter}</span>
                      </div>
                      <h4 className="text-base font-bold text-white mt-1">{item.title}</h4>
                      <p className="text-xs text-[#64748B] mt-0.5">Assigned to: {item.assignee}</p>
                    </div>

                    <div className="flex flex-col items-end gap-2">
                      <span className="text-sm font-extrabold text-[#10B981]">{item.progress}% Done</span>
                      <button
                        onClick={() => handleGeneratePRD(item.title)}
                        className="px-3 py-1.5 rounded-lg text-xs font-bold bg-[#8B5CF6] hover:bg-[#7C3AED] text-white"
                      >
                        PRD Specs →
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

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
                      <Plus className="w-5 h-5 text-[#8B5CF6]" /> Add Feature to Roadmap
                    </h3>
                    <button onClick={() => setIsAddModalOpen(false)} className="p-1 rounded-lg hover:bg-gray-700/30">
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <form onSubmit={handleAddFeature} className="mt-4 space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-[#94A3B8] mb-1">Feature Name</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Real-Time Push Notifications"
                        value={newTitle}
                        onChange={e => setNewTitle(e.target.value)}
                        className={`w-full px-3 py-2 text-sm rounded-xl border ${
                          isDark ? 'bg-[#0D1117] border-[#2D3748]' : 'bg-gray-50 border-[#E2E8F0]'
                        }`}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-[#94A3B8] mb-1">Track</label>
                        <select
                          value={newTrack}
                          onChange={e => setNewTrack(e.target.value as any)}
                          className={`w-full px-3 py-2 text-sm rounded-xl border ${
                            isDark ? 'bg-[#0D1117] border-[#2D3748]' : 'bg-gray-50 border-[#E2E8F0]'
                          }`}
                        >
                          <option value="Performance">Performance</option>
                          <option value="Auth">Auth</option>
                          <option value="Ingestion">Ingestion</option>
                          <option value="UI/UX">UI/UX</option>
                          <option value="Analytics">Analytics</option>
                          <option value="Enterprise">Enterprise</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-[#94A3B8] mb-1">Stage</label>
                        <select
                          value={newStage}
                          onChange={e => setNewStage(e.target.value as any)}
                          className={`w-full px-3 py-2 text-sm rounded-xl border ${
                            isDark ? 'bg-[#0D1117] border-[#2D3748]' : 'bg-gray-50 border-[#E2E8F0]'
                          }`}
                        >
                          <option value="Now">Now</option>
                          <option value="Next">Next</option>
                          <option value="Later">Later</option>
                          <option value="Shipped">Shipped</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-[#94A3B8] mb-1">Target Quarter</label>
                        <select
                          value={newQuarter}
                          onChange={e => setNewQuarter(e.target.value as any)}
                          className={`w-full px-3 py-2 text-sm rounded-xl border ${
                            isDark ? 'bg-[#0D1117] border-[#2D3748]' : 'bg-gray-50 border-[#E2E8F0]'
                          }`}
                        >
                          <option value="Q1">Q1</option>
                          <option value="Q2">Q2</option>
                          <option value="Q3">Q3</option>
                          <option value="Q4">Q4</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-[#94A3B8] mb-1">Assignee</label>
                        <input
                          type="text"
                          value={newAssignee}
                          onChange={e => setNewAssignee(e.target.value)}
                          className={`w-full px-3 py-2 text-sm rounded-xl border ${
                            isDark ? 'bg-[#0D1117] border-[#2D3748]' : 'bg-gray-50 border-[#E2E8F0]'
                          }`}
                        />
                      </div>
                    </div>

                    <div className="pt-4 flex justify-end gap-3 border-t border-[#2D3748]">
                      <button type="button" onClick={() => setIsAddModalOpen(false)} className="px-4 py-2 text-sm font-semibold hover:bg-gray-700/30">
                        Cancel
                      </button>
                      <button type="submit" className="px-5 py-2 rounded-xl text-sm font-bold bg-[#6366F1] text-white shadow-md">
                        Save Item
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

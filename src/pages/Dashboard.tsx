import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, Folders, Bot, FileText, SortAsc, Filter,
  X, ChevronDown, TrendingUp, Sparkles,
} from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

import { Sidebar } from '../components/Sidebar';
import { TopNavbar } from '../components/TopNavbar';
import { WorkspaceCard } from '../components/WorkspaceCard';
import { CreateWorkspaceModal } from '../components/CreateWorkspaceModal';
import { DeleteConfirmDialog } from '../components/DeleteConfirmDialog';
import { EmptyState } from '../components/EmptyState';
import { WorkspaceGridSkeleton } from '../components/SkeletonCard';

import { useWorkspaces, type SortOption } from '../hooks/useWorkspaces';
import { workspaceService, type Workspace, type WorkspaceFormData } from '../services/workspaceService';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

// ─── Stat Card ────────────────────────────────────────────────────────────────

interface StatCardProps {
  icon: React.ElementType;
  label: string;
  value: string | number;
  gradient: string;
  glowDark: string;
  glowLight: string;
}

const StatCard: React.FC<StatCardProps> = ({ icon: Icon, label, value, gradient, glowDark, glowLight }) => {
  const { isDark } = useTheme();
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`theme-card rounded-xl p-4 flex items-center gap-4 hover:border-[var(--border-default)] transition-all hover:shadow-lg ${isDark ? glowDark : glowLight}`}
    >
      <div className={`p-2.5 rounded-xl ${gradient} flex-shrink-0`}>
        <Icon className="w-4 h-4 text-white" />
      </div>
      <div>
        <p className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>{label}</p>
        <span className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>{value}</span>
      </div>
    </motion.div>
  );
};

// ─── Sort Options ─────────────────────────────────────────────────────────────

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'newest',      label: 'Newest First' },
  { value: 'updated',     label: 'Recently Updated' },
  { value: 'alphabetical',label: 'Alphabetical' },
  { value: 'priority',    label: 'By Priority' },
];

// ─── Dashboard Page ───────────────────────────────────────────────────────────

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const { isDark } = useTheme();

  const {
    workspaces, filteredWorkspaces, isLoading,
    searchQuery, setSearchQuery,
    sortBy, setSortBy,
    filterProductType, setFilterProductType,
    filterStage, setFilterStage,
    filterPriority, setFilterPriority,
    clearFilters,
  } = useWorkspaces(user?.id);

  const [isModalOpen, setIsModalOpen]         = useState(false);
  const [editingWorkspace, setEditingWorkspace] = useState<Workspace | null>(null);
  const [isSubmitting, setIsSubmitting]       = useState(false);
  const [deletingWorkspace, setDeletingWorkspace] = useState<Workspace | null>(null);
  const [isDeleting, setIsDeleting]           = useState(false);
  const [showFilters, setShowFilters]         = useState(false);

  // ── Toast style helper ────────────────────────────────────────────────────

  const toast_ok  = { background: isDark ? '#161B22' : '#ffffff', color: isDark ? '#F8FAFC' : '#0F172A', border: `1px solid ${isDark ? '#2D3748' : '#E2E8F0'}` };
  const toast_err = { background: isDark ? '#161B22' : '#ffffff', color: isDark ? '#F8FAFC' : '#0F172A', border: '1px solid #EF4444' };

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleCreate = async (formData: WorkspaceFormData) => {
    if (!user) return;
    setIsSubmitting(true);
    try {
      await workspaceService.createWorkspace(user.id, formData, user.name, user.avatarUrl || '');
      setIsModalOpen(false);
      toast.success('Workspace created successfully! 🚀', { style: toast_ok });
    } catch { toast.error('Failed to create workspace.', { style: toast_err }); }
    finally   { setIsSubmitting(false); }
  };

  const handleUpdate = async (formData: WorkspaceFormData) => {
    if (!editingWorkspace) return;
    setIsSubmitting(true);
    try {
      await workspaceService.updateWorkspace(editingWorkspace.id, formData);
      setEditingWorkspace(null); setIsModalOpen(false);
      toast.success('Workspace updated!', { style: toast_ok });
    } catch { toast.error('Failed to update workspace.', { style: toast_err }); }
    finally   { setIsSubmitting(false); }
  };

  const handleDelete = async () => {
    if (!deletingWorkspace) return;
    setIsDeleting(true);
    try {
      await workspaceService.deleteWorkspace(deletingWorkspace.id);
      setDeletingWorkspace(null);
      toast.success('Workspace deleted.', { style: toast_ok });
    } catch { toast.error('Failed to delete workspace.', { style: toast_err }); }
    finally   { setIsDeleting(false); }
  };

  const handleArchive = async (workspace: Workspace) => {
    try {
      await workspaceService.archiveWorkspace(workspace.id);
      toast.success(`"${workspace.workspaceName}" archived.`, { style: toast_ok });
    } catch { toast.error('Failed to archive.', { style: toast_err }); }
  };

  const handleDuplicate = async (workspace: Workspace) => {
    try {
      await workspaceService.duplicateWorkspace(workspace);
      toast.success(`Duplicated "${workspace.workspaceName}"! 📋`, { style: toast_ok });
    } catch { toast.error('Failed to duplicate.', { style: toast_err }); }
  };

  const openEditModal   = (w: Workspace) => { setEditingWorkspace(w); setIsModalOpen(true); };
  const openCreateModal = ()             => { setEditingWorkspace(null); setIsModalOpen(true); };
  const handleModalClose = ()            => { setIsModalOpen(false); setEditingWorkspace(null); };

  // ── Derived stats ─────────────────────────────────────────────────────────
  const totalDocs    = workspaces.reduce((s, w) => s + w.documentsCount, 0);
  const totalChats   = workspaces.reduce((s, w) => s + w.chatCount, 0);
  const activeCount  = workspaces.filter((w) => ['Development', 'Testing', 'Production'].includes(w.stage)).length;
  const hasActiveFilters = !!(searchQuery || filterProductType || filterStage || filterPriority);

  // ── Control bar classes ──────────────────────────────────────────────────
  const controlBg   = isDark ? 'bg-[#161B22] border-[#1e2530]' : 'bg-white border-[#E2E8F0] shadow-sm';
  const filterPanel = isDark ? 'bg-[#161B22]/60 border-[#1e2530]' : 'bg-[#F8FAFC] border-[#E2E8F0]';
  const filterSelect = isDark
    ? 'bg-[#0D1117] border-[#2D3748] text-[#F8FAFC]'
    : 'bg-white border-[#E2E8F0] text-[#0F172A]';
  const filterLabel = isDark ? 'text-[#64748B]' : 'text-[#94A3B8]';
  const countText   = isDark ? 'text-[#64748B]' : 'text-[#94A3B8]';

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen transition-colors duration-200" style={{ backgroundColor: 'var(--bg-base)' }}>
      <Toaster position="top-right" />
      <Sidebar />

      <div className="ml-60 min-h-screen flex flex-col">
        <TopNavbar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          searchPlaceholder="Search workspaces by name, type, or goal..."
        />

        <main className="flex-1 pt-16 px-8 py-8 space-y-7 max-w-screen-xl">

          {/* ── Header ─────────────────────────────────────── */}
          <div className="flex items-start justify-between gap-4 pt-2">
            <div>
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#3B82F6]/10 border border-[#3B82F6]/20 text-[#3B82F6] text-xs font-bold mb-3"
              >
                <Sparkles className="w-3 h-3" />
                AI Product Manager Copilot
              </motion.div>
              <motion.h1
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 }}
                className="text-3xl font-bold font-display tracking-tight"
                style={{ color: 'var(--text-primary)' }}
              >
                Welcome back, {user?.name?.split(' ')[0]} 👋
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="text-sm mt-1"
                style={{ color: 'var(--text-muted)' }}
              >
                Manage your AI Product Management workspaces.
              </motion.p>
            </div>

            <motion.button
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              onClick={openCreateModal}
              className="flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-white bg-gradient-to-r from-[#3B82F6] to-[#8B5CF6] hover:opacity-90 shadow-xl shadow-blue-500/20 transition-all text-sm flex-shrink-0"
            >
              <Plus className="w-4 h-4" /> New Workspace
            </motion.button>
          </div>

          {/* ── Stats Row ─────────────────────────────────── */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard icon={Folders}    label="Total Workspaces" value={workspaces.length} gradient="bg-gradient-to-br from-[#3B82F6] to-[#1D4ED8]" glowDark="hover:shadow-blue-500/10"    glowLight="hover:shadow-blue-200/50" />
            <StatCard icon={TrendingUp} label="Active Projects"  value={activeCount}       gradient="bg-gradient-to-br from-[#10B981] to-[#059669]" glowDark="hover:shadow-emerald-500/10" glowLight="hover:shadow-emerald-200/50" />
            <StatCard icon={Bot}        label="AI Chats"         value={totalChats}        gradient="bg-gradient-to-br from-[#8B5CF6] to-[#6D28D9]" glowDark="hover:shadow-purple-500/10"  glowLight="hover:shadow-purple-200/50" />
            <StatCard icon={FileText}   label="Documents"        value={totalDocs}         gradient="bg-gradient-to-br from-[#F59E0B] to-[#D97706]" glowDark="hover:shadow-amber-500/10"   glowLight="hover:shadow-amber-200/50" />
          </div>

          {/* ── Controls Bar ──────────────────────────────── */}
          <div className="flex items-center gap-3 flex-wrap">
            {/* Sort */}
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2">
                <SortAsc className="w-3.5 h-3.5" style={{ color: 'var(--text-muted)' }} />
              </div>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className={`appearance-none pl-8 pr-8 py-2 text-xs font-medium border rounded-xl focus:outline-none focus:border-[#3B82F6]/50 cursor-pointer transition-all ${controlBg}`}
                style={{ color: 'var(--text-secondary)' }}
              >
                {SORT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 pointer-events-none" style={{ color: 'var(--text-muted)' }} />
            </div>

            {/* Filter Toggle */}
            <button
              onClick={() => setShowFilters((v) => !v)}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium border transition-all ${
                showFilters || hasActiveFilters
                  ? 'bg-[#3B82F6]/10 border-[#3B82F6]/30 text-[#3B82F6]'
                  : `${controlBg} hover:border-[var(--border-default)]`
              }`}
              style={!(showFilters || hasActiveFilters) ? { color: 'var(--text-secondary)' } : {}}
            >
              <Filter className="w-3.5 h-3.5" />
              Filters
              {hasActiveFilters && (
                <span className="w-4 h-4 rounded-full bg-[#3B82F6] text-white text-[9px] font-bold flex items-center justify-center">!</span>
              )}
            </button>

            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium text-[#EF4444]/70 hover:text-[#EF4444] hover:bg-[#EF4444]/10 transition-all"
              >
                <X className="w-3.5 h-3.5" /> Clear
              </button>
            )}

            <div className={`ml-auto text-xs ${countText}`}>
              {filteredWorkspaces.length} workspace{filteredWorkspaces.length !== 1 ? 's' : ''}
              {hasActiveFilters && ` of ${workspaces.length}`}
            </div>
          </div>

          {/* ── Filter Panel ──────────────────────────────── */}
          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className={`grid grid-cols-3 gap-4 p-4 border rounded-xl ${filterPanel}`}>
                  {[
                    { label: 'Product Type', value: filterProductType, onChange: setFilterProductType,
                      options: ['AI Product','Web Application','Mobile App','Healthcare','Finance','Education','E-Commerce','Gaming','Travel'], all: 'All Types' },
                    { label: 'Stage', value: filterStage, onChange: setFilterStage,
                      options: ['Idea','Research','Planning','Development','Testing','Production'], all: 'All Stages' },
                    { label: 'Priority', value: filterPriority, onChange: setFilterPriority,
                      options: ['Low','Medium','High','Critical'], all: 'All Priorities' },
                  ].map(({ label, value, onChange, options, all }) => (
                    <div key={label} className="space-y-1.5">
                      <label className={`text-[10px] font-bold uppercase tracking-widest ${filterLabel}`}>{label}</label>
                      <select
                        value={value}
                        onChange={(e) => onChange(e.target.value)}
                        className={`w-full appearance-none px-3 py-2 border rounded-lg text-xs focus:outline-none focus:border-[#3B82F6]/50 cursor-pointer ${filterSelect}`}
                      >
                        <option value="">{all}</option>
                        {options.map((o) => <option key={o} value={o}>{o}</option>)}
                      </select>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── Workspace Grid ────────────────────────────── */}
          {isLoading ? (
            <WorkspaceGridSkeleton />
          ) : workspaces.length === 0 ? (
            <EmptyState onCreateWorkspace={openCreateModal} />
          ) : filteredWorkspaces.length === 0 ? (
            <EmptyState onCreateWorkspace={openCreateModal} isFiltered onClearFilters={clearFilters} />
          ) : (
            <motion.div layout className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
              <AnimatePresence>
                {filteredWorkspaces.map((workspace) => (
                  <WorkspaceCard
                    key={workspace.id}
                    workspace={workspace}
                    onEdit={openEditModal}
                    onDelete={(w) => setDeletingWorkspace(w)}
                    onArchive={handleArchive}
                    onDuplicate={handleDuplicate}
                  />
                ))}
              </AnimatePresence>
            </motion.div>
          )}
        </main>
      </div>

      {/* Modals */}
      <CreateWorkspaceModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        onSubmit={editingWorkspace ? handleUpdate : handleCreate}
        editingWorkspace={editingWorkspace}
        isSubmitting={isSubmitting}
      />
      <DeleteConfirmDialog
        isOpen={!!deletingWorkspace}
        onClose={() => setDeletingWorkspace(null)}
        onConfirm={handleDelete}
        isDeleting={isDeleting}
        workspaceName={deletingWorkspace?.workspaceName || ''}
      />
    </div>
  );
};

import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Edit2,
  Archive,
  Trash2,
  FileText,
  MessageSquare,
  Users,
  TrendingUp,
  Bot,
  Calendar,
  User,
  Clock,
  ExternalLink,
  Sparkles,
} from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

import { Sidebar } from '../components/Sidebar';
import { TopNavbar } from '../components/TopNavbar';
import { QuickActions } from '../components/QuickActions';
import { CreateWorkspaceModal } from '../components/CreateWorkspaceModal';
import { DeleteConfirmDialog } from '../components/DeleteConfirmDialog';

import { workspaceService, type Workspace, type WorkspaceFormData, PRODUCT_TYPE_ICONS } from '../services/workspaceService';
import { useAuth } from '../context/AuthContext';
import { formatDate, formatDistanceToNow } from '../utils/dateUtils';
import { useTheme } from '../context/ThemeContext';

// Theme-aware color badges for stages and priorities in light mode
const STAGE_COLORS_DARK: Record<string, string> = {
  Idea:        'text-purple-400 bg-purple-400/10 border-purple-400/20',
  Research:    'text-blue-400 bg-blue-400/10 border-blue-400/20',
  Planning:    'text-yellow-400 bg-yellow-400/10 border-yellow-400/20',
  Development: 'text-cyan-400 bg-cyan-400/10 border-cyan-400/20',
  Testing:     'text-orange-400 bg-orange-400/10 border-orange-400/20',
  Production:  'text-green-400 bg-green-400/10 border-green-400/20',
};

const STAGE_COLORS_LIGHT: Record<string, string> = {
  Idea:        'text-purple-600 bg-purple-50 border-purple-200',
  Research:    'text-blue-600 bg-blue-50 border-blue-200',
  Planning:    'text-yellow-700 bg-yellow-50 border-yellow-200',
  Development: 'text-cyan-700 bg-cyan-50 border-cyan-200',
  Testing:     'text-orange-600 bg-orange-50 border-orange-200',
  Production:  'text-green-700 bg-green-50 border-green-200',
};

const PRIORITY_COLORS_DARK: Record<string, string> = {
  Low:      'text-gray-400 bg-gray-400/10 border-gray-400/20',
  Medium:   'text-blue-400 bg-blue-400/10 border-blue-400/20',
  High:     'text-orange-400 bg-orange-400/10 border-orange-400/20',
  Critical: 'text-red-400 bg-red-400/10 border-red-400/20',
};

const PRIORITY_COLORS_LIGHT: Record<string, string> = {
  Low:      'text-gray-600 bg-gray-50 border-gray-200',
  Medium:   'text-blue-600 bg-blue-50 border-blue-200',
  High:     'text-orange-600 bg-orange-50 border-orange-200',
  Critical: 'text-red-600 bg-red-50 border-red-200',
};

// ─── Recent AI Conversations (Mock) ──────────────────────────────────────────

const MOCK_CONVERSATIONS = [
  { id: '1', title: 'PRD requirements for onboarding flow', time: '2h ago', preview: 'Generated a comprehensive PRD with 12 user stories...' },
  { id: '2', title: 'Competitive analysis: top 5 AI PM tools', time: '1d ago', preview: 'Analyzed Linear, Notion, Jira, Productboard...' },
  { id: '3', title: 'Q3 roadmap prioritization', time: '3d ago', preview: 'RICE scored 24 features, top priorities identified...' },
];

// ─── Section Header ───────────────────────────────────────────────────────────

const SectionHeader: React.FC<{ title: string; icon: React.ElementType; action?: React.ReactNode }> = ({
  title,
  icon: Icon,
  action,
}) => (
  <div className="flex items-center justify-between mb-4">
    <div className="flex items-center gap-2">
      <Icon className="w-4 h-4 text-[#3B82F6]" />
      <h3 className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{title}</h3>
    </div>
    {action}
  </div>
);

// ─── Info Row ─────────────────────────────────────────────────────────────────

const InfoRow: React.FC<{ icon: React.ElementType; label: string; value: string }> = ({
  icon: Icon,
  label,
  value,
}) => (
  <div className="flex items-center justify-between py-2.5 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
    <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--text-muted)' }}>
      <Icon className="w-3.5 h-3.5" />
      {label}
    </div>
    <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>{value}</span>
  </div>
);

// ─── Workspace Detail Page ────────────────────────────────────────────────────

export const WorkspaceDetailPage: React.FC = () => {
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isDark } = useTheme();

  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (!workspaceId || !user?.id) return;
    setIsLoading(true);
    workspaceService.getWorkspace(workspaceId, user.id).then((ws) => {
      setWorkspace(ws);
      setIsLoading(false);
    }).catch(() => {
      setIsLoading(false);
    });
  }, [workspaceId, user?.id]);

  const handleUpdate = async (formData: WorkspaceFormData) => {
    if (!workspace) return;
    setIsSubmitting(true);
    try {
      await workspaceService.updateWorkspace(workspace.id, formData);
      setWorkspace((prev) => prev ? { ...prev, ...formData } : null);
      setIsEditModalOpen(false);
      toast.success('Workspace updated!', {
        style: {
          background: isDark ? '#161B22' : '#ffffff',
          color: isDark ? '#F8FAFC' : '#0F172A',
          border: `1px solid ${isDark ? '#2D3748' : '#E2E8F0'}`,
        },
      });
    } catch {
      toast.error('Failed to update workspace.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!workspace) return;
    setIsDeleting(true);
    try {
      await workspaceService.deleteWorkspace(workspace.id);
      toast.success('Workspace deleted.');
      navigate('/dashboard');
    } catch {
      toast.error('Failed to delete workspace.');
      setIsDeleting(false);
    }
  };

  const handleArchive = async () => {
    if (!workspace) return;
    try {
      await workspaceService.archiveWorkspace(workspace.id);
      toast.success(`"${workspace.workspaceName}" archived.`, {
        style: {
          background: isDark ? '#161B22' : '#ffffff',
          color: isDark ? '#F8FAFC' : '#0F172A',
          border: `1px solid ${isDark ? '#2D3748' : '#E2E8F0'}`,
        },
      });
      navigate('/dashboard');
    } catch {
      toast.error('Failed to archive workspace.');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen transition-colors duration-200" style={{ backgroundColor: 'var(--bg-base)' }}>
        <Sidebar />
        <div className="ml-60 pt-16 flex items-center justify-center min-h-screen">
          <div className="flex items-center gap-3" style={{ color: 'var(--text-muted)' }}>
            <Sparkles className="w-5 h-5 text-[#3B82F6] animate-pulse" />
            <span className="text-sm">Loading workspace...</span>
          </div>
        </div>
        <TopNavbar />
      </div>
    );
  }

  if (!workspace) {
    return (
      <div className="min-h-screen transition-colors duration-200" style={{ backgroundColor: 'var(--bg-base)' }}>
        <Sidebar />
        <div className="ml-60 pt-16 flex flex-col items-center justify-center min-h-screen gap-4">
          <p style={{ color: 'var(--text-secondary)' }}>Workspace not found or access denied.</p>
          <button onClick={() => navigate('/dashboard')} className="text-sm text-[#3B82F6] hover:underline font-semibold">
            ← Back to Dashboard
          </button>
        </div>
        <TopNavbar />
      </div>
    );
  }

  const icon = PRODUCT_TYPE_ICONS[workspace.productType] || '📁';
  const stageClass = isDark ? STAGE_COLORS_DARK[workspace.stage] : STAGE_COLORS_LIGHT[workspace.stage] || '';
  const priorityClass = isDark ? PRIORITY_COLORS_DARK[workspace.priority] : PRIORITY_COLORS_LIGHT[workspace.priority] || '';

  // Theme-aware local variables
  const headerBtnClass = isDark
    ? 'text-[#94A3B8] bg-[#1e2530] border-[#2D3748] hover:text-white hover:border-[#3D4752]'
    : 'text-[#64748B] bg-white border-[#E2E8F0] hover:text-[#0F172A] hover:border-[#CBD5E1] shadow-sm';

  const typeBadgeClass = isDark
    ? 'text-[#64748B] bg-[#1e2530] border-[#2D3748]'
    : 'text-[#64748B] bg-[#F1F5F9] border-[#E2E8F0]';

  const innerPanelClass = isDark
    ? 'bg-[#0D1117]/60 border-[#1e2530]'
    : 'bg-[#F8FAFC] border-[#E2E8F0]';

  const cardListBtnClass = isDark
    ? 'hover:bg-[#1e2530]'
    : 'hover:bg-[#F1F5F9]';

  const listCardClass = isDark
    ? 'bg-[#0D1117]/60 border-[#1e2530] hover:border-[#2D3748]'
    : 'bg-white border-[#E2E8F0] hover:border-[#CBD5E1] shadow-sm';

  return (
    <div className="min-h-screen transition-colors duration-200" style={{ backgroundColor: 'var(--bg-base)' }}>
      <Toaster position="top-right" />
      <Sidebar />
      <TopNavbar />

      <div className="ml-60 pt-16">
        <main className="px-8 py-8 max-w-screen-xl space-y-7">

          {/* ── Breadcrumb + Back ──────────────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2 text-xs"
            style={{ color: 'var(--text-muted)' }}
          >
            <button onClick={() => navigate('/dashboard')} className="hover:text-primary transition-colors flex items-center gap-1" style={{ color: 'var(--text-muted)' }}>
              <ArrowLeft className="w-3.5 h-3.5" /> Dashboard
            </button>
            <span>/</span>
            <span className="font-medium" style={{ color: 'var(--text-secondary)' }}>{workspace.workspaceName}</span>
          </motion.div>

          {/* ── Workspace Header ───────────────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="theme-card rounded-2xl p-6 relative overflow-hidden"
          >
            <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-[#3B82F6]/60 to-transparent" />

            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl border flex items-center justify-center text-2xl flex-shrink-0" style={{ backgroundColor: 'var(--bg-surface-2)', borderColor: 'var(--border-subtle)' }}>
                  {icon}
                </div>
                <div>
                  <h1 className="text-2xl font-bold font-display mb-1" style={{ color: 'var(--text-primary)' }}>{workspace.workspaceName}</h1>
                  <p className="text-sm max-w-xl" style={{ color: 'var(--text-secondary)' }}>{workspace.description}</p>
                  <div className="flex flex-wrap items-center gap-2 mt-2">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${stageClass}`}>
                      {workspace.stage}
                    </span>
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${priorityClass}`}>
                      {workspace.priority} Priority
                    </span>
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${typeBadgeClass}`}>
                      {workspace.productType}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={() => setIsEditModalOpen(true)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold border transition-all ${headerBtnClass}`}
                >
                  <Edit2 className="w-3.5 h-3.5" /> Edit
                </button>
                <button
                  onClick={handleArchive}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold border transition-all ${headerBtnClass}`}
                >
                  <Archive className="w-3.5 h-3.5" /> Archive
                </button>
                <button
                  onClick={() => setIsDeleteOpen(true)}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-[#EF4444]/70 bg-[#EF4444]/5 border border-[#EF4444]/20 hover:text-[#EF4444] hover:bg-[#EF4444]/10 transition-all shadow-sm"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Delete
                </button>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="mt-6">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>Overall Progress</span>
                <span className="text-xs font-bold text-[#3B82F6]">{workspace.progress}%</span>
              </div>
              <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--bg-surface-2)' }}>
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${workspace.progress}%` }}
                  transition={{ duration: 1, ease: 'easeOut', delay: 0.2 }}
                  className="h-full rounded-full bg-gradient-to-r from-[#3B82F6] to-[#8B5CF6]"
                />
              </div>
            </div>
          </motion.div>

          {/* ── Stats Row ──────────────────────────────────────────── */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { icon: FileText, label: 'Documents', value: workspace.documentsCount, color: 'text-blue-500 bg-blue-500/10' },
              { icon: MessageSquare, label: 'AI Chats', value: workspace.chatCount, color: 'text-purple-500 bg-purple-500/10' },
              { icon: Users, label: 'Team Size', value: workspace.teamSize || '—', color: 'text-cyan-500 bg-cyan-500/10' },
              { icon: TrendingUp, label: 'Progress', value: `${workspace.progress}%`, color: 'text-green-500 bg-green-500/10' },
            ].map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 + 0.1 }}
                className="theme-card rounded-xl p-4 flex items-center gap-3"
              >
                <div className={`p-2 rounded-xl ${stat.color}`}>
                  <stat.icon className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-[10px] font-medium" style={{ color: 'var(--text-muted)' }}>{stat.label}</p>
                  <p className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>{stat.value}</p>
                </div>
              </motion.div>
            ))}
          </div>

          {/* ── Main Grid ──────────────────────────────────────────── */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* LEFT: 2/3 */}
            <div className="lg:col-span-2 space-y-6">

              {/* Quick Actions */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="theme-card rounded-2xl p-5"
              >
                <SectionHeader title="Quick Actions" icon={Sparkles} />
                <QuickActions workspaceId={workspace.id} />
              </motion.div>

              {/* Recent AI Conversations */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="theme-card rounded-2xl p-5"
              >
                <SectionHeader
                  title="Recent AI Conversations"
                  icon={Bot}
                  action={
                    <button className="text-xs text-[#3B82F6] hover:underline flex items-center gap-1 font-semibold">
                      View all <ExternalLink className="w-3 h-3" />
                    </button>
                  }
                />
                <div className="space-y-2">
                  {MOCK_CONVERSATIONS.map((conv) => (
                    <button
                      key={conv.id}
                      className={`w-full flex items-start gap-3 p-3 rounded-xl transition-all group text-left ${cardListBtnClass}`}
                    >
                      <div className="p-1.5 rounded-lg bg-[#8B5CF6]/15 border border-[#8B5CF6]/20 flex-shrink-0">
                        <Bot className="w-3.5 h-3.5 text-[#8B5CF6]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-0.5">
                          <p className="text-xs font-semibold group-hover:text-[#3B82F6] transition-colors truncate" style={{ color: 'var(--text-primary)' }}>
                            {conv.title}
                          </p>
                          <span className="text-[10px] ml-2 flex-shrink-0" style={{ color: 'var(--text-muted)' }}>{conv.time}</span>
                        </div>
                        <p className="text-[11px] truncate" style={{ color: 'var(--text-secondary)' }}>{conv.preview}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </motion.div>

              {/* Generated PRDs */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
                className="theme-card rounded-2xl p-5"
              >
                <SectionHeader
                  title="Generated PRDs"
                  icon={FileText}
                  action={
                    <button className="text-xs text-[#3B82F6] hover:underline flex items-center gap-1 font-semibold">
                      View all <ExternalLink className="w-3 h-3" />
                    </button>
                  }
                />
                {workspace.documentsCount > 0 ? (
                  <div className="space-y-2">
                    {[
                      { title: 'Onboarding Flow PRD v2.1', date: 'Jul 8, 2025' },
                      { title: 'AI Assistant Feature Spec v1.0', date: 'Jul 3, 2025' },
                    ].map((prd) => (
                      <div
                        key={prd.title}
                        className={`flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer ${listCardClass}`}
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="p-1.5 rounded-lg bg-[#3B82F6]/10 border border-[#3B82F6]/20">
                            <FileText className="w-3.5 h-3.5 text-[#3B82F6]" />
                          </div>
                          <span className="text-xs font-medium" style={{ color: 'var(--text-primary)' }}>{prd.title}</span>
                        </div>
                        <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{prd.date}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-8 text-center text-sm" style={{ color: 'var(--text-muted)' }}>
                    No PRDs generated yet.
                    <button className="block mx-auto mt-2 text-xs text-[#3B82F6] hover:underline font-semibold">
                      Generate your first PRD →
                    </button>
                  </div>
                )}
              </motion.div>
            </div>

            {/* RIGHT: 1/3 */}
            <div className="space-y-5">

              {/* Workspace Info */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="theme-card rounded-2xl p-5"
              >
                <h3 className="text-sm font-bold mb-4" style={{ color: 'var(--text-primary)' }}>Workspace Info</h3>
                <InfoRow icon={User} label="Owner" value={workspace.ownerName || 'You'} />
                <InfoRow
                  icon={Calendar}
                  label="Created"
                  value={workspace.createdAt ? formatDate(workspace.createdAt.toDate()) : '—'}
                />
                <InfoRow
                  icon={Clock}
                  label="Last Updated"
                  value={workspace.updatedAt ? formatDistanceToNow(workspace.updatedAt.toDate()) : '—'}
                />
                {workspace.targetAudience && (
                  <InfoRow icon={Users} label="Target Audience" value={workspace.targetAudience} />
                )}
                {workspace.businessGoal && (
                  <div className={`mt-3 p-3 rounded-xl border ${innerPanelClass}`}>
                    <p className="text-[10px] font-medium mb-1" style={{ color: 'var(--text-muted)' }}>Business Goal</p>
                    <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>{workspace.businessGoal}</p>
                  </div>
                )}
              </motion.div>

              {/* Customer Feedback Summary */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
                className="theme-card rounded-2xl p-5"
              >
                <h3 className="text-sm font-bold mb-4" style={{ color: 'var(--text-primary)' }}>Customer Feedback</h3>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>Sentiment Score</span>
                  <span className="text-sm font-bold text-green-500">78% Positive</span>
                </div>
                <div className="h-2 rounded-full overflow-hidden mb-4" style={{ backgroundColor: 'var(--bg-surface-2)' }}>
                  <div className="h-full w-[78%] bg-gradient-to-r from-green-500 to-emerald-400 rounded-full" />
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {['Performance', 'UX Issues', 'Feature Requests'].map((tag) => (
                    <span
                      key={tag}
                      className="text-[10px] px-2 py-1 rounded-full border"
                      style={{
                        backgroundColor: 'var(--bg-surface-2)',
                        borderColor: 'var(--border-subtle)',
                        color: 'var(--text-secondary)',
                      }}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </motion.div>

              {/* Uploaded Documents */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="theme-card rounded-2xl p-5"
              >
                <h3 className="text-sm font-bold mb-4" style={{ color: 'var(--text-primary)' }}>Uploaded Documents</h3>
                {workspace.documentsCount > 0 ? (
                  <div className="space-y-2">
                    {['user_research_v1.pdf', 'market_analysis.docx', 'competitive_brief.pdf'].map((doc) => (
                      <div key={doc} className={`flex items-center gap-2.5 p-2.5 rounded-lg transition-colors cursor-pointer ${cardListBtnClass}`}>
                        <FileText className="w-3.5 h-3.5 text-[#3B82F6] flex-shrink-0" />
                        <span className="text-xs truncate" style={{ color: 'var(--text-secondary)' }}>{doc}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-center py-4" style={{ color: 'var(--text-muted)' }}>No documents uploaded yet.</p>
                )}
              </motion.div>
            </div>
          </div>
        </main>
      </div>

      {/* Modals */}
      <CreateWorkspaceModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSubmit={handleUpdate}
        editingWorkspace={workspace}
        isSubmitting={isSubmitting}
      />

      <DeleteConfirmDialog
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleDelete}
        isDeleting={isDeleting}
        workspaceName={workspace.workspaceName}
      />
    </div>
  );
};

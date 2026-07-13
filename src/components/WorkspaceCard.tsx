import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { FileText, MessageSquare, Calendar, MoreVertical, Edit2, Copy, Archive, Trash2 } from 'lucide-react';
import type { Workspace } from '../services/workspaceService';
import { PRODUCT_TYPE_ICONS, STAGE_COLORS, PRIORITY_COLORS } from '../services/workspaceService';
import { formatDistanceToNow } from '../utils/dateUtils';
import { useTheme } from '../context/ThemeContext';

// Light-mode badge overrides
const STAGE_COLORS_LIGHT: Record<string, string> = {
  Idea:        'text-purple-600 bg-purple-50 border-purple-200',
  Research:    'text-blue-600 bg-blue-50 border-blue-200',
  Planning:    'text-yellow-700 bg-yellow-50 border-yellow-200',
  Development: 'text-cyan-700 bg-cyan-50 border-cyan-200',
  Testing:     'text-orange-600 bg-orange-50 border-orange-200',
  Production:  'text-green-700 bg-green-50 border-green-200',
};

const PRIORITY_COLORS_LIGHT: Record<string, string> = {
  Low:      'text-gray-600 bg-gray-50 border-gray-200',
  Medium:   'text-blue-600 bg-blue-50 border-blue-200',
  High:     'text-orange-600 bg-orange-50 border-orange-200',
  Critical: 'text-red-600 bg-red-50 border-red-200',
};

interface WorkspaceCardProps {
  workspace: Workspace;
  onEdit: (workspace: Workspace) => void;
  onDelete: (workspace: Workspace) => void;
  onArchive: (workspace: Workspace) => void;
  onDuplicate: (workspace: Workspace) => void;
}

export const WorkspaceCard: React.FC<WorkspaceCardProps> = ({
  workspace, onEdit, onDelete, onArchive, onDuplicate,
}) => {
  const navigate = useNavigate();
  const { isDark } = useTheme();
  const [showMenu, setShowMenu] = useState(false);

  const icon         = PRODUCT_TYPE_ICONS[workspace.productType] || '📁';
  const stageClass   = isDark ? STAGE_COLORS[workspace.stage] : STAGE_COLORS_LIGHT[workspace.stage] || '';
  const priorityClass = isDark ? PRIORITY_COLORS[workspace.priority] : PRIORITY_COLORS_LIGHT[workspace.priority] || '';

  const cardClass = isDark
    ? 'bg-[#161B22]/80 backdrop-blur-sm border-[#1e2530] hover:border-[#3B82F6]/40 hover:shadow-[#3B82F6]/8'
    : 'bg-white border-[#E2E8F0] hover:border-[#3B82F6]/50 hover:shadow-blue-100/80';

  const iconBoxClass = isDark
    ? 'bg-gradient-to-br from-[#1e2530] to-[#161B22] border-[#2D3748] group-hover:border-[#3B82F6]/30'
    : 'bg-gradient-to-br from-[#F8FAFC] to-[#F1F5F9] border-[#E2E8F0] group-hover:border-[#3B82F6]/30';

  const titleClass    = isDark ? 'text-white group-hover:text-[#3B82F6]' : 'text-[#0F172A] group-hover:text-[#2563EB]';
  const subClass      = isDark ? 'text-[#64748B]' : 'text-[#94A3B8]';
  const descClass     = isDark ? 'text-[#94A3B8]' : 'text-[#64748B]';
  const menuBtnClass  = isDark ? 'text-[#64748B] hover:text-white hover:bg-[#2D3748]' : 'text-[#94A3B8] hover:text-[#0F172A] hover:bg-[#F1F5F9]';
  const menuBoxClass  = isDark ? 'bg-[#1b2027] border-[#2D3748]' : 'bg-white border-[#E2E8F0] shadow-xl';
  const menuItemClass = isDark ? 'text-[#94A3B8] hover:text-white hover:bg-[#252a32]' : 'text-[#64748B] hover:text-[#0F172A] hover:bg-[#F1F5F9]';
  const menuDivider   = isDark ? 'border-[#2D3748]' : 'border-[#E2E8F0]';
  const footerBorder  = isDark ? 'border-[#1e2530]' : 'border-[#F1F5F9]';
  const metaClass     = isDark ? 'text-[#64748B]' : 'text-[#94A3B8]';
  const progressBg    = isDark ? 'bg-[#1e2530]' : 'bg-[#F1F5F9]';

  const handleCardClick = () => navigate(`/workspace/${workspace.id}`);
  const handleMenuAction = (e: React.MouseEvent, action: () => void) => {
    e.stopPropagation();
    setShowMenu(false);
    action();
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      whileHover={{ y: -2 }}
      transition={{ duration: 0.2 }}
      onClick={handleCardClick}
      className={`group relative border rounded-2xl p-5 cursor-pointer hover:shadow-xl transition-all duration-300 overflow-hidden ${cardClass}`}
    >
      {/* Top accent shimmer */}
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-[#3B82F6]/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl border flex items-center justify-center text-xl flex-shrink-0 transition-colors ${iconBoxClass}`}>
            {icon}
          </div>
          <div>
            <h3 className={`text-sm font-bold transition-colors line-clamp-1 ${titleClass}`}>{workspace.workspaceName}</h3>
            <p className={`text-xs line-clamp-1 ${subClass}`}>{workspace.productType}</p>
          </div>
        </div>

        {/* Context menu */}
        <div className="relative" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={(e) => { e.stopPropagation(); setShowMenu((v) => !v); }}
            className={`p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-all ${menuBtnClass}`}
          >
            <MoreVertical className="w-4 h-4" />
          </button>
          {showMenu && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
              <div className={`absolute right-0 top-full mt-1 w-44 border rounded-xl z-20 overflow-hidden py-1 ${menuBoxClass}`}>
                <button onClick={(e) => handleMenuAction(e, () => onEdit(workspace))} className={`flex items-center gap-2.5 w-full px-3 py-2 text-xs transition-colors ${menuItemClass}`}>
                  <Edit2 className="w-3.5 h-3.5" /> Edit Workspace
                </button>
                <button onClick={(e) => handleMenuAction(e, () => onDuplicate(workspace))} className={`flex items-center gap-2.5 w-full px-3 py-2 text-xs transition-colors ${menuItemClass}`}>
                  <Copy className="w-3.5 h-3.5" /> Duplicate
                </button>
                <button onClick={(e) => handleMenuAction(e, () => onArchive(workspace))} className={`flex items-center gap-2.5 w-full px-3 py-2 text-xs transition-colors ${menuItemClass}`}>
                  <Archive className="w-3.5 h-3.5" /> Archive
                </button>
                <div className={`my-1 border-t ${menuDivider}`} />
                <button onClick={(e) => handleMenuAction(e, () => onDelete(workspace))} className="flex items-center gap-2.5 w-full px-3 py-2 text-xs text-[#EF4444] hover:bg-[#EF4444]/10 transition-colors">
                  <Trash2 className="w-3.5 h-3.5" /> Delete
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Description */}
      <p className={`text-xs leading-relaxed mb-4 line-clamp-2 ${descClass}`}>{workspace.description}</p>

      {/* Badges */}
      <div className="flex flex-wrap gap-1.5 mb-4">
        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${stageClass}`}>{workspace.stage}</span>
        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${priorityClass}`}>{workspace.priority}</span>
      </div>

      {/* Progress */}
      <div className="mb-4">
        <div className="flex justify-between items-center mb-1">
          <span className={`text-[10px] font-medium ${metaClass}`}>Progress</span>
          <span className="text-[10px] font-bold text-[#3B82F6]">{workspace.progress}%</span>
        </div>
        <div className={`h-1 rounded-full overflow-hidden ${progressBg}`}>
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${workspace.progress}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="h-full rounded-full bg-gradient-to-r from-[#3B82F6] to-[#8B5CF6]"
          />
        </div>
      </div>

      {/* Footer */}
      <div className={`flex items-center justify-between pt-3 border-t ${footerBorder}`}>
        <div className="flex items-center gap-1.5">
          <img
            src={workspace.ownerAvatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${workspace.ownerId}`}
            alt="owner"
            className="w-5 h-5 rounded-full bg-[#2D3748]"
          />
          <span className={`text-[10px] truncate max-w-16 hidden sm:block ${metaClass}`}>{workspace.ownerName || 'You'}</span>
        </div>
        <div className="flex items-center gap-3">
          {[
            { icon: FileText, val: workspace.documentsCount },
            { icon: MessageSquare, val: workspace.chatCount },
          ].map(({ icon: Icon, val }) => (
            <div key={Icon.toString()} className={`flex items-center gap-1 text-[10px] ${metaClass}`}>
              <Icon className="w-3 h-3" />
              <span>{val}</span>
            </div>
          ))}
          <div className={`flex items-center gap-1 text-[10px] ${metaClass}`}>
            <Calendar className="w-3 h-3" />
            <span>{workspace.updatedAt ? formatDistanceToNow(workspace.updatedAt.toDate()) : '—'}</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

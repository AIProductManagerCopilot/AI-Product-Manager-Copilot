import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Upload,
  FileText,
  BookOpen,
  Map,
  BarChart2,
  MessageSquare,
  ArrowRight,
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

interface QuickActionsProps {
  workspaceId: string;
}

const ACTIONS = [
  {
    id: 'upload',
    label: 'Upload Documents',
    description: 'Add PRDs, specs, user research',
    icon: Upload,
    gradient: 'from-[#3B82F6] to-[#1D4ED8]',
    glowDark: 'shadow-blue-500/10 hover:shadow-blue-500/20',
    glowLight: 'shadow-blue-100/40 hover:shadow-blue-200/50',
  },
  {
    id: 'prd',
    label: 'Generate PRD',
    description: 'AI-powered requirements doc',
    icon: FileText,
    gradient: 'from-[#8B5CF6] to-[#6D28D9]',
    glowDark: 'shadow-purple-500/10 hover:shadow-purple-500/20',
    glowLight: 'shadow-purple-100/40 hover:shadow-purple-200/50',
  },
  {
    id: 'stories',
    label: 'User Stories',
    description: 'Generate acceptance criteria',
    icon: BookOpen,
    gradient: 'from-[#06B6D4] to-[#0891B2]',
    glowDark: 'shadow-cyan-500/10 hover:shadow-cyan-500/20',
    glowLight: 'shadow-cyan-100/40 hover:shadow-cyan-200/50',
  },
  {
    id: 'roadmap',
    label: 'Generate Roadmap',
    description: 'Build strategic roadmaps',
    icon: Map,
    gradient: 'from-[#10B981] to-[#059669]',
    glowDark: 'shadow-emerald-500/10 hover:shadow-emerald-500/20',
    glowLight: 'shadow-emerald-100/40 hover:shadow-emerald-200/50',
  },
  {
    id: 'feedback',
    label: 'Analyze Feedback',
    description: 'Cluster customer insights',
    icon: BarChart2,
    gradient: 'from-[#F59E0B] to-[#D97706]',
    glowDark: 'shadow-amber-500/10 hover:shadow-amber-500/20',
    glowLight: 'shadow-amber-100/40 hover:shadow-amber-200/50',
  },
  {
    id: 'chat',
    label: 'Open AI Chat',
    description: 'Chat with your copilot',
    icon: MessageSquare,
    gradient: 'from-[#EC4899] to-[#DB2777]',
    glowDark: 'shadow-pink-500/10 hover:shadow-pink-500/20',
    glowLight: 'shadow-pink-100/40 hover:shadow-pink-200/50',
  },
];

export const QuickActions: React.FC<QuickActionsProps> = ({ workspaceId }) => {
  const navigate = useNavigate();
  const { isDark } = useTheme();

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
      {ACTIONS.map((action, idx) => (
        <motion.button
          key={action.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: idx * 0.06 }}
          whileHover={{ y: -2, scale: 1.01 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => navigate(`/workspace/${workspaceId}/${action.id}`)}
          className={`group flex flex-col items-start gap-3 p-4 rounded-xl border hover:border-[#3B82F6]/50 transition-all duration-200 text-left theme-card ${
            isDark ? action.glowDark : action.glowLight
          }`}
        >
          <div className={`p-2 rounded-xl bg-gradient-to-br ${action.gradient} shadow-md group-hover:scale-110 transition-transform duration-200`}>
            <action.icon className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="text-xs font-bold mb-0.5" style={{ color: 'var(--text-primary)' }}>{action.label}</p>
            <p className="text-[10px] leading-relaxed" style={{ color: 'var(--text-muted)' }}>{action.description}</p>
          </div>
          <ArrowRight className="w-3 h-3 text-[#64748B] group-hover:text-[#3B82F6] group-hover:translate-x-0.5 transition-all" />
        </motion.button>
      ))}
    </div>
  );
};

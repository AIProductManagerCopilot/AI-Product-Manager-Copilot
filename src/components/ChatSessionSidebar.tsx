import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, Plus, Trash2, X, Clock, BrainCircuit } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { ChatSessionListItem } from '../services/chatService';

interface ChatSessionSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  sessions: ChatSessionListItem[];
  activeSessionId: string | null;
  onSelectSession: (id: string) => void;
  onCreateSession: () => void;
  onDeleteSession: (id: string, e: React.MouseEvent) => void;
  isLoading: boolean;
}

export const ChatSessionSidebar: React.FC<ChatSessionSidebarProps> = ({
  isOpen,
  onClose,
  sessions,
  activeSessionId,
  onSelectSession,
  onCreateSession,
  onDeleteSession,
  isLoading,
}) => {
  const { isDark } = useTheme();

  const sidebarBg = isDark
    ? 'bg-[#161B22] border-[#2D3748] text-white'
    : 'bg-white border-[#E2E8F0] text-slate-900';

  const formatTimestamp = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / (1000 * 60));
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      if (diffDays === 1) return 'Yesterday';
      if (diffDays < 7) return `${diffDays}d ago`;
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    } catch {
      return '';
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.2 }}
          className={`w-72 border-r flex flex-col h-full shrink-0 z-10 ${sidebarBg}`}
        >
          {/* Header */}
          <div className="p-4 border-b flex items-center justify-between border-[#2D3748]/50">
            <div className="flex items-center gap-2">
              <BrainCircuit className="w-5 h-5 text-[#8B5CF6]" />
              <span className="font-bold text-sm">Chat History</span>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={onClose}
                className="p-1 rounded-lg text-slate-400 hover:text-white transition-colors cursor-pointer"
                title="Close panel"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* New Chat Button */}
          <div className="p-3">
            <button
              onClick={onCreateSession}
              disabled={isLoading}
              className="w-full py-2.5 px-4 rounded-xl bg-[#8B5CF6] hover:bg-[#7C3AED] text-white font-medium text-sm flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer disabled:opacity-50"
            >
              <Plus className="w-4 h-4" />
              New Conversation
            </button>
          </div>

          {/* Session List */}
          <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1.5 scrollbar-hide">
            {isLoading && sessions.length === 0 ? (
              <div className="p-4 text-center text-xs text-slate-400">Loading history...</div>
            ) : sessions.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400">
                No past conversations yet.<br />Start a new chat!
              </div>
            ) : (
              sessions.map((session) => {
                const isActive = session.id === activeSessionId;
                return (
                  <div
                    key={session.id}
                    onClick={() => onSelectSession(session.id)}
                    className={`group relative flex items-center justify-between p-3 rounded-xl border text-xs cursor-pointer transition-all ${
                      isActive
                        ? isDark
                          ? 'bg-[#2E1065]/40 border-[#8B5CF6]/50 text-white font-semibold'
                          : 'bg-purple-50 border-purple-300 text-purple-900 font-semibold'
                        : isDark
                        ? 'border-transparent text-slate-300 hover:bg-[#1E293B]/70 hover:border-[#2D3748]'
                        : 'border-transparent text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0 flex-1 mr-2">
                      <MessageSquare className={`w-4 h-4 shrink-0 ${isActive ? 'text-[#8B5CF6]' : 'text-slate-400'}`} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs">
                          {session.title || 'Untitled Conversation'}
                        </p>
                        <span className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                          <Clock className="w-2.5 h-2.5" />
                          {formatTimestamp(session.updated_at || session.created_at)}
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        onDeleteSession(session.id, e);
                      }}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-all shrink-0 cursor-pointer relative z-20"
                      title="Delete conversation"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

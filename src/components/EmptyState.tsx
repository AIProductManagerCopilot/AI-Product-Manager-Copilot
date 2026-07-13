import React from 'react';
import { motion } from 'framer-motion';
import { Folders, Plus, Sparkles } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

interface EmptyStateProps {
  onCreateWorkspace: () => void;
  isFiltered?: boolean;
  onClearFilters?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  onCreateWorkspace,
  isFiltered = false,
  onClearFilters,
}) => {
  const { isDark } = useTheme();

  const iconContainerClass = isDark
    ? 'bg-[#1e2530] border-[#2D3748]'
    : 'bg-[#F1F5F9] border-[#E2E8F0]';

  const folderContainerClass = isDark
    ? 'bg-gradient-to-br from-[#161B22] to-[#1e2530] border-[#2D3748]'
    : 'bg-gradient-to-br from-white to-[#F1F5F9] border-[#E2E8F0] shadow-sm';

  const featureHintClass = isDark
    ? 'bg-[#161B22]/60 border-[#1e2530]'
    : 'bg-white border-[#E2E8F0] shadow-sm';

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-20 text-center"
    >
      {isFiltered ? (
        <>
          <div className={`w-14 h-14 rounded-2xl border flex items-center justify-center mb-4 ${iconContainerClass}`}>
            <Folders className="w-7 h-7" style={{ color: 'var(--text-muted)' }} />
          </div>
          <h3 className="text-base font-bold mb-2" style={{ color: 'var(--text-primary)' }}>No results found</h3>
          <p className="text-sm max-w-xs mb-6" style={{ color: 'var(--text-secondary)' }}>
            No workspaces match your current search or filter criteria.
          </p>
          {onClearFilters && (
            <button
              onClick={onClearFilters}
              className="px-4 py-2 rounded-xl text-sm font-semibold text-[#3B82F6] bg-[#3B82F6]/10 border border-[#3B82F6]/20 hover:bg-[#3B82F6]/20 transition-all"
            >
              Clear Filters
            </button>
          )}
        </>
      ) : (
        <>
          {/* Animated Illustration */}
          <div className="relative mb-8">
            {/* Glow rings */}
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-[#3B82F6]/20 to-[#8B5CF6]/20 blur-xl animate-pulse-slow scale-150" />

            <motion.div
              animate={{ y: [-4, 4, -4] }}
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
              className={`relative w-24 h-24 rounded-3xl border flex items-center justify-center shadow-xl ${folderContainerClass}`}
            >
              <Folders className="w-10 h-10 text-[#3B82F6]" />
            </motion.div>

            {/* Floating sparkle */}
            <motion.div
              animate={{ rotate: [0, 10, -10, 0], scale: [1, 1.1, 1] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
              className="absolute -top-2 -right-2 w-8 h-8 rounded-xl bg-gradient-to-br from-[#8B5CF6] to-[#3B82F6] flex items-center justify-center shadow-lg"
            >
              <Sparkles className="w-4 h-4 text-white" />
            </motion.div>
          </div>

          <h2 className="text-2xl font-bold mb-3 font-display" style={{ color: 'var(--text-primary)' }}>
            No Workspaces Yet
          </h2>
          <p className="text-sm leading-relaxed max-w-md mb-8" style={{ color: 'var(--text-secondary)' }}>
            Create your first AI Product Management workspace. Organize your projects, generate PRDs, 
            analyze customer feedback, and build roadmaps — all in one place.
          </p>

          <motion.button
            onClick={onCreateWorkspace}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            className="flex items-center gap-2.5 px-6 py-3.5 rounded-xl font-bold text-white bg-gradient-to-r from-[#3B82F6] to-[#8B5CF6] hover:opacity-90 shadow-xl shadow-blue-500/25 transition-all text-sm"
          >
            <Plus className="w-4 h-4" />
            Create Your First Workspace
          </motion.button>

          {/* Feature hints */}
          <div className="mt-10 grid grid-cols-3 gap-4 max-w-lg w-full">
            {[
              { icon: '📝', label: 'Generate PRDs' },
              { icon: '🤖', label: 'AI Assistant' },
              { icon: '📊', label: 'Analytics' },
            ].map((item) => (
              <div
                key={item.label}
                className={`flex flex-col items-center gap-2 p-3 rounded-xl border ${featureHintClass}`}
              >
                <span className="text-xl">{item.icon}</span>
                <span className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>{item.label}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </motion.div>
  );
};

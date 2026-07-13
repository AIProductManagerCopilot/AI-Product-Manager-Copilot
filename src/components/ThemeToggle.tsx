import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

interface ThemeToggleProps {
  /** compact = icon only, default = icon + label */
  compact?: boolean;
  /** position variant for different page contexts */
  variant?: 'navbar' | 'floating' | 'auth';
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({
  compact = false,
  variant = 'navbar',
}) => {
  const { theme, toggleTheme, isDark } = useTheme();

  const baseClass =
    variant === 'auth'
      ? 'flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all duration-200'
      : 'flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium border transition-all duration-200';

  const colorClass = isDark
    ? 'bg-[#161B22] border-[#1e2530] text-[#94A3B8] hover:border-[#3B82F6]/40 hover:text-white'
    : 'bg-white border-[#E2E8F0] text-[#64748B] hover:border-[#3B82F6]/50 hover:text-[#0F172A] shadow-sm';

  return (
    <motion.button
      onClick={toggleTheme}
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.96 }}
      className={`${baseClass} ${colorClass} group`}
      title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
      aria-label={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
    >
      {/* Icon swap with animation */}
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={theme}
          initial={{ rotate: -60, opacity: 0, scale: 0.6 }}
          animate={{ rotate: 0, opacity: 1, scale: 1 }}
          exit={{ rotate: 60, opacity: 0, scale: 0.6 }}
          transition={{ duration: 0.18, ease: 'easeOut' }}
          className="flex-shrink-0"
        >
          {isDark ? (
            <Sun className="w-3.5 h-3.5 text-amber-400" />
          ) : (
            <Moon className="w-3.5 h-3.5 text-indigo-500" />
          )}
        </motion.span>
      </AnimatePresence>

      {!compact && (
        <AnimatePresence mode="wait" initial={false}>
          <motion.span
            key={theme + '-label'}
            initial={{ opacity: 0, x: -4 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 4 }}
            transition={{ duration: 0.15 }}
            className="whitespace-nowrap"
          >
            {isDark ? 'Light' : 'Dark'}
          </motion.span>
        </AnimatePresence>
      )}
    </motion.button>
  );
};

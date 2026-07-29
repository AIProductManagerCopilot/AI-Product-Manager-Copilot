import React, { useState } from 'react';
import { Search, Bell, ChevronDown, Sparkles, Command } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { ThemeToggle } from './ThemeToggle';
import { useTheme } from '../context/ThemeContext';

interface TopNavbarProps {
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  searchPlaceholder?: string;
}

export const TopNavbar: React.FC<TopNavbarProps> = ({
  searchQuery = '',
  onSearchChange,
  searchPlaceholder = 'Search workspaces...',
}) => {
  const { user } = useAuth();
  const { isDark } = useTheme();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [hasNotif] = useState(true);

  const navBg = isDark
    ? 'bg-[#0D1117]/90 border-[#1e2530]'
    : 'bg-white/90 border-[#E2E8F0]';

  const inputClass = isDark
    ? 'bg-[#161B22] border-[#1e2530] text-[#F8FAFC] placeholder-[#64748B] focus:border-[#3B82F6]/50 focus:ring-[#3B82F6]/20'
    : 'bg-[#F1F5F9] border-[#E2E8F0] text-[#0F172A] placeholder-[#94A3B8] focus:border-[#3B82F6]/50 focus:ring-[#3B82F6]/20';

  const kbdClass = isDark
    ? 'text-[#64748B] bg-[#1e2530] border-[#2D3748]'
    : 'text-[#94A3B8] bg-[#E2E8F0] border-[#CBD5E1]';

  const bellClass = isDark
    ? 'bg-[#161B22] border-[#1e2530] text-[#64748B] hover:text-white hover:border-[#2D3748]'
    : 'bg-white border-[#E2E8F0] text-[#64748B] hover:text-[#0F172A] hover:border-[#CBD5E1] shadow-sm';

  const profileBtnClass = isDark
    ? 'bg-[#161B22] border-[#1e2530] hover:border-[#2D3748]'
    : 'bg-white border-[#E2E8F0] hover:border-[#CBD5E1] shadow-sm';

  const menuClass = isDark
    ? 'bg-[#161B22] border-[#2D3748]'
    : 'bg-white border-[#E2E8F0]';

  const menuItemClass = isDark
    ? 'text-[#94A3B8] hover:text-white hover:bg-[#1e2530]'
    : 'text-[#64748B] hover:text-[#0F172A] hover:bg-[#F1F5F9]';

  const menuBorderClass = isDark ? 'border-[#2D3748]' : 'border-[#E2E8F0]';

  const nameClass = isDark ? 'text-white' : 'text-[#0F172A]';
  const orgClass = isDark ? 'text-[#64748B]' : 'text-[#94A3B8]';

  return (
    <header
      className={`fixed top-0 left-60 right-0 h-16 backdrop-blur-md border-b z-30 flex items-center px-6 gap-4 transition-colors duration-200 ${navBg}`}
    >
      {/* Search Bar */}
      <div className="flex-1 max-w-md relative">
        <div className="absolute left-3 top-1/2 -translate-y-1/2">
          <Search className="w-3.5 h-3.5 text-[#64748B]" />
        </div>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange?.(e.target.value)}
          placeholder={searchPlaceholder}
          className={`w-full pl-9 pr-24 py-2 text-sm border rounded-xl focus:outline-none focus:ring-1 transition-all ${inputClass}`}
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2 hidden sm:flex items-center gap-1">
          <kbd className={`flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-mono border rounded ${kbdClass}`}>
            <Command className="w-2.5 h-2.5" />K
          </kbd>
        </div>
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* AI Badge */}
      <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-r from-[#3B82F6]/10 to-[#8B5CF6]/10 border border-[#3B82F6]/20">
        <Sparkles className="w-3.5 h-3.5 text-[#3B82F6]" />
        <span className="text-xs font-semibold text-[#3B82F6]">AI Active</span>
      </div>

      {/* 🌓 Theme Toggle */}
      <ThemeToggle variant="navbar" />

      {/* Notification Bell */}
      <button className={`relative p-2 rounded-xl border transition-all ${bellClass}`}>
        <Bell className="w-4 h-4" />
        {hasNotif && (
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-[#3B82F6] animate-pulse" />
        )}
      </button>

      {/* Profile Menu */}
      <div className="relative">
        <button
          onClick={() => setShowProfileMenu((v) => !v)}
          className={`flex items-center gap-2.5 px-3 py-2 rounded-xl border transition-all ${profileBtnClass}`}
        >
          <img
            src={user?.avatarUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${user?.email}`}
            alt="avatar"
            referrerPolicy="no-referrer"
            className="w-6 h-6 rounded-full bg-[#2D3748] flex-shrink-0"
          />
          <div className="hidden sm:flex flex-col items-start">
            <span className={`text-xs font-semibold leading-none ${nameClass}`}>{user?.name}</span>
            <span className={`text-[10px] leading-none mt-0.5 truncate max-w-24 ${orgClass}`}>{user?.organization}</span>
          </div>
          <ChevronDown className="w-3.5 h-3.5 text-[#64748B]" />
        </button>

        <AnimatePresence>
          {showProfileMenu && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowProfileMenu(false)} />
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.96 }}
                transition={{ duration: 0.15 }}
                className={`absolute right-0 top-full mt-2 w-56 border rounded-xl shadow-2xl z-20 overflow-hidden ${menuClass}`}
              >
                <div className={`p-3 border-b ${menuBorderClass}`}>
                  <p className={`text-xs font-semibold ${nameClass}`}>{user?.name}</p>
                  <p className={`text-[11px] truncate ${orgClass}`}>{user?.email}</p>
                  <span className="mt-1.5 inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#3B82F6]/10 text-[#3B82F6] border border-[#3B82F6]/20">
                    {user?.role}
                  </span>
                </div>
                <div className="p-1.5">
                  {['Profile Settings', 'Billing', 'API Keys'].map((item) => (
                    <button
                      key={item}
                      className={`w-full text-left px-3 py-2 text-xs rounded-lg transition-colors ${menuItemClass}`}
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    </header>
  );
};

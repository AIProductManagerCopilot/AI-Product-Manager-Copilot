import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Bell,
  ChevronDown,
  Sparkles,
  Command,
  Check,
  CheckCircle2,
  Inbox,
  FileText,
  Sliders,
  Shield,
  Trash2,
  ExternalLink,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { ThemeToggle } from './ThemeToggle';
import { useTheme } from '../context/ThemeContext';

interface TopNavbarProps {
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  searchPlaceholder?: string;
}

interface NotificationItem {
  id: string;
  title: string;
  description: string;
  time: string;
  category: 'feedback' | 'prd' | 'prioritization' | 'system';
  isRead: boolean;
  link: string;
}

const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  {
    id: 'notif-1',
    title: 'New Feedback Cluster Discovered',
    description: "24 new customer reviews grouped into 'Payment Gateway Errors' theme.",
    time: '10m ago',
    category: 'feedback',
    isRead: false,
    link: '/feedback-ingestion',
  },
  {
    id: 'notif-2',
    title: 'PRD Generation Completed',
    description: "PRD document for 'Mobile Authentication Overhaul' is ready for review.",
    time: '1h ago',
    category: 'prd',
    isRead: false,
    link: '/prd-generator',
  },
  {
    id: 'notif-3',
    title: 'Prioritization Scores Updated',
    description: 'RICE score recalculation completed for 12 feature requests.',
    time: '3h ago',
    category: 'prioritization',
    isRead: false,
    link: '/prioritization',
  },
  {
    id: 'notif-4',
    title: 'Integration Health Check Passed',
    description: 'Qdrant Vector DB pinged successfully with 14.2ms latency.',
    time: '1d ago',
    category: 'system',
    isRead: true,
    link: '/settings',
  },
];

export const TopNavbar: React.FC<TopNavbarProps> = ({
  searchQuery = '',
  onSearchChange,
  searchPlaceholder = 'Search workspaces...',
}) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isDark } = useTheme();

  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotifMenu, setShowNotifMenu] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>(INITIAL_NOTIFICATIONS);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  const clearAllNotifications = () => {
    setNotifications([]);
  };

  const handleNotificationClick = (notif: NotificationItem) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === notif.id ? { ...n, isRead: true } : n))
    );
    setShowNotifMenu(false);
    navigate(notif.link);
  };

  // Theme-aware CSS classes
  const navBg = isDark
    ? 'bg-[#0D1117]/90 border-[#1e2530]'
    : 'bg-white/80 backdrop-blur-md border-[#E2E8F0] shadow-sm';

  const inputClass = isDark
    ? 'bg-[#161B22] border-[#1e2530] text-[#F8FAFC] placeholder-[#64748B] focus:border-[#3B82F6]/50 focus:ring-[#3B82F6]/20'
    : 'bg-[#F8FAFC] border-[#E2E8F0] text-[#0F172A] placeholder-[#64748B] focus:bg-white focus:border-[#3B82F6]/50 focus:ring-[#3B82F6]/20';

  const kbdClass = isDark
    ? 'text-[#64748B] bg-[#1e2530] border-[#2D3748]'
    : 'text-[#64748B] bg-[#F1F5F9] border-[#CBD5E1]';

  const bellClass = isDark
    ? showNotifMenu
      ? 'bg-[#1e2530] border-[#3B82F6]/50 text-white shadow-lg shadow-blue-500/10'
      : 'bg-[#161B22] border-[#1e2530] text-[#64748B] hover:text-white hover:border-[#2D3748]'
    : showNotifMenu
      ? 'bg-white border-[#3B82F6] text-[#0F172A] shadow-md'
      : 'bg-white border-[#E2E8F0] text-[#64748B] hover:text-[#0F172A] hover:border-[#CBD5E1] shadow-sm';

  const profileBtnClass = isDark
    ? 'bg-[#161B22] border-[#1e2530] hover:border-[#2D3748]'
    : 'bg-white border-[#E2E8F0] hover:border-[#CBD5E1] shadow-sm';

  const menuClass = isDark
    ? 'bg-[#161B22] border-[#2D3748]'
    : 'bg-white border-[#E2E8F0] shadow-xl';

  const menuItemClass = isDark
    ? 'text-[#94A3B8] hover:text-white hover:bg-[#1e2530]'
    : 'text-[#475569] hover:text-[#0F172A] hover:bg-[#F1F5F9]';

  const menuBorderClass = isDark ? 'border-[#2D3748]' : 'border-[#E2E8F0]';
  const nameClass = isDark ? 'text-white' : 'text-[#0F172A]';
  const orgClass = isDark ? 'text-[#64748B]' : 'text-[#64748B]';

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

      {/* 🔔 Notification Bell & Dropdown */}
      <div className="relative">
        <button
          onClick={() => {
            setShowNotifMenu((v) => !v);
            setShowProfileMenu(false);
          }}
          className={`relative p-2 rounded-xl border transition-all cursor-pointer ${bellClass}`}
          title="Notifications"
        >
          <Bell className="w-4 h-4" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#3B82F6] opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#3B82F6]" />
            </span>
          )}
        </button>

        <AnimatePresence>
          {showNotifMenu && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowNotifMenu(false)} />
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.96 }}
                transition={{ duration: 0.15 }}
                className={`absolute right-0 top-full mt-2 w-80 sm:w-96 border rounded-2xl shadow-2xl z-20 overflow-hidden ${menuClass}`}
              >
                {/* Header */}
                <div className={`p-4 border-b flex items-center justify-between ${menuBorderClass}`}>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      Notifications
                      {unreadCount > 0 && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#3B82F6]/20 text-[#38BDF8] border border-[#3B82F6]/30">
                          {unreadCount} new
                        </span>
                      )}
                    </h3>
                  </div>

                  <div className="flex items-center gap-2">
                    {unreadCount > 0 && (
                      <button
                        onClick={markAllAsRead}
                        className="text-[11px] font-semibold text-[#38BDF8] hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <Check className="w-3 h-3" /> Mark read
                      </button>
                    )}
                    {notifications.length > 0 && (
                      <button
                        onClick={clearAllNotifications}
                        title="Clear all"
                        className="text-[#64748B] hover:text-[#EF4444] p-1 rounded transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Notifications List */}
                <div className="max-h-80 overflow-y-auto divide-y divide-[#2D3748]/50">
                  {notifications.length === 0 ? (
                    <div className="p-8 text-center space-y-2">
                      <CheckCircle2 className="w-8 h-8 text-[#10B981] mx-auto opacity-80" />
                      <p className="text-xs font-semibold text-white">All caught up!</p>
                      <p className="text-[11px] text-[#64748B]">No pending notifications right now.</p>
                    </div>
                  ) : (
                    notifications.map((notif) => {
                      const IconComponent =
                        notif.category === 'feedback'
                          ? Inbox
                          : notif.category === 'prd'
                          ? FileText
                          : notif.category === 'prioritization'
                          ? Sliders
                          : Shield;

                      const categoryBadge =
                        notif.category === 'feedback'
                          ? 'bg-[#3B82F6]/15 text-[#60A5FA] border-[#3B82F6]/30'
                          : notif.category === 'prd'
                          ? 'bg-[#8B5CF6]/15 text-[#C084FC] border-[#8B5CF6]/30'
                          : notif.category === 'prioritization'
                          ? 'bg-[#10B981]/15 text-[#34D399] border-[#10B981]/30'
                          : 'bg-[#F59E0B]/15 text-[#FBBF24] border-[#F59E0B]/30';

                      return (
                        <div
                          key={notif.id}
                          onClick={() => handleNotificationClick(notif)}
                          className={`p-3.5 flex items-start gap-3 transition-colors cursor-pointer ${
                            !notif.isRead
                              ? isDark
                                ? 'bg-[#1E2633]/60 hover:bg-[#232D3B]'
                                : 'bg-[#F0F9FF] hover:bg-[#E0F2FE]'
                              : isDark
                              ? 'hover:bg-[#1E2633]/30'
                              : 'hover:bg-[#F8FAFC]'
                          }`}
                        >
                          <div className={`p-2 rounded-xl border flex-shrink-0 mt-0.5 ${categoryBadge}`}>
                            <IconComponent className="w-3.5 h-3.5" />
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <h4 className={`text-xs font-bold truncate ${notif.isRead ? 'text-[#94A3B8]' : 'text-white'}`}>
                                {notif.title}
                              </h4>
                              <span className="text-[10px] text-[#64748B] flex-shrink-0">{notif.time}</span>
                            </div>
                            <p className="text-[11px] text-[#94A3B8] mt-0.5 line-clamp-2 leading-relaxed">
                              {notif.description}
                            </p>
                          </div>

                          {!notif.isRead && (
                            <span className="w-2 h-2 rounded-full bg-[#3B82F6] flex-shrink-0 mt-1.5" />
                          )}
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Footer */}
                {notifications.length > 0 && (
                  <div className={`p-2.5 border-t text-center ${menuBorderClass} ${isDark ? 'bg-[#0D1117]/60' : 'bg-[#F8FAFC]'}`}>
                    <button
                      onClick={() => {
                        setShowNotifMenu(false);
                        navigate('/dashboard');
                      }}
                      className="text-[11px] font-bold text-[#3B82F6] hover:underline flex items-center justify-center gap-1 w-full py-1 cursor-pointer"
                    >
                      View All Workspace Activity <ExternalLink className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>

      {/* 👤 Profile Menu */}
      <div className="relative">
        <button
          onClick={() => {
            setShowProfileMenu((v) => !v);
            setShowNotifMenu(false);
          }}
          className={`flex items-center gap-2.5 px-3 py-2 rounded-xl border transition-all cursor-pointer ${profileBtnClass}`}
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
                      onClick={() => {
                        setShowProfileMenu(false);
                        navigate('/settings');
                      }}
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

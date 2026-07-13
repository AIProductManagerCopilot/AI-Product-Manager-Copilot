import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  LayoutDashboard,
  Folders,
  Bot,
  FileText,
  BookOpen,
  Map,
  BarChart2,
  Settings,
  LogOut,
  Sparkles,
  ChevronRight,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

const NAV_ITEMS = [
  { label: 'Dashboard',   icon: LayoutDashboard, href: '/dashboard' },
  { label: 'Workspaces',  icon: Folders,          href: '/workspaces' },
  { label: 'AI Assistant',icon: Bot,              href: '/ai-assistant', badge: 'Beta' },
  { label: 'Documents',   icon: FileText,         href: '/documents' },
  { label: 'PRDs',        icon: BookOpen,         href: '/prds' },
  { label: 'Roadmaps',    icon: Map,              href: '/roadmaps' },
  { label: 'Analytics',   icon: BarChart2,        href: '/analytics' },
];

const BOTTOM_ITEMS = [
  { label: 'Settings', icon: Settings, href: '/settings' },
];

export const Sidebar: React.FC = () => {
  const { user, logout } = useAuth();
  const { isDark } = useTheme();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  // Theme-aware CSS classes
  const sidebarBg   = isDark ? 'bg-[#090f15] border-[#1e2530]' : 'bg-[#F1F5F9] border-[#E2E8F0]';
  const logoText    = isDark ? 'text-white' : 'text-[#0F172A]';
  const logoSub     = isDark ? 'text-[#64748B]' : 'text-[#94A3B8]';
  const divider     = isDark ? 'border-[#1e2530]' : 'border-[#E2E8F0]';

  const navActive   = isDark
    ? 'bg-[#3B82F6]/15 text-[#3B82F6] border border-[#3B82F6]/25'
    : 'bg-[#EFF6FF] text-[#2563EB] border border-[#BFDBFE]';

  const navInactive = isDark
    ? 'text-[#94A3B8] hover:bg-[#1e2530] hover:text-white'
    : 'text-[#64748B] hover:bg-[#E2E8F0] hover:text-[#0F172A]';

  const iconActive  = isDark ? 'text-[#3B82F6]'  : 'text-[#2563EB]';
  const iconDefault = isDark ? 'text-[#64748B] group-hover:text-white' : 'text-[#94A3B8] group-hover:text-[#0F172A]';

  const profileBg   = isDark ? 'bg-[#1b2027] border-[#1e2530]' : 'bg-white border-[#E2E8F0] shadow-sm';
  const profileName = isDark ? 'text-white' : 'text-[#0F172A]';
  const profileRole = isDark ? 'text-[#64748B]' : 'text-[#94A3B8]';

  const logoutClass = isDark
    ? 'text-[#EF4444]/80 hover:text-[#EF4444] hover:bg-[#EF4444]/10'
    : 'text-[#EF4444]/70 hover:text-[#EF4444] hover:bg-[#FEF2F2]';

  return (
    <aside className={`fixed top-0 left-0 h-screen w-60 flex flex-col border-r z-40 overflow-hidden transition-colors duration-200 ${sidebarBg}`}>
      {/* Logo Area */}
      <div className={`flex items-center gap-3 px-5 py-5 border-b ${divider}`}>
        <div className="p-2 rounded-xl bg-gradient-to-br from-[#3B82F6] to-[#8B5CF6] shadow-lg shadow-blue-500/25">
          <Sparkles className="w-4 h-4 text-white" />
        </div>
        <div>
          <p className={`text-sm font-bold leading-none font-display ${logoText}`}>AIPM</p>
          <p className={`text-[10px] leading-none mt-0.5 ${logoSub}`}>Copilot</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-0.5">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.href}
            to={item.href}
            className={({ isActive }) =>
              `group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                isActive ? navActive : navInactive
              }`
            }
          >
            {({ isActive }) => (
              <>
                <item.icon
                  className={`w-4 h-4 flex-shrink-0 transition-colors ${
                    isActive ? iconActive : iconDefault
                  }`}
                />
                <span className="flex-1">{item.label}</span>
                {item.badge && (
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-[#8B5CF6]/20 text-[#8B5CF6] border border-[#8B5CF6]/30">
                    {item.badge}
                  </span>
                )}
                {isActive && (
                  <ChevronRight className={`w-3 h-3 ${isDark ? 'text-[#3B82F6]/60' : 'text-[#2563EB]/60'}`} />
                )}
              </>
            )}
          </NavLink>
        ))}

        {/* Separator */}
        <div className={`my-3 border-t ${divider}`} />

        {BOTTOM_ITEMS.map((item) => (
          <NavLink
            key={item.href}
            to={item.href}
            className={({ isActive }) =>
              `group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                isActive ? navActive : navInactive
              }`
            }
          >
            <item.icon className={`w-4 h-4 flex-shrink-0 transition-colors ${iconDefault}`} />
            <span>Settings</span>
          </NavLink>
        ))}
      </nav>

      {/* User Profile + Logout */}
      <div className={`p-3 border-t ${divider}`}>
        <div className={`flex items-center gap-3 px-3 py-2.5 rounded-xl border mb-2 ${profileBg}`}>
          <img
            src={user?.avatarUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${user?.email}`}
            alt="avatar"
            referrerPolicy="no-referrer"
            className="w-7 h-7 rounded-full flex-shrink-0 bg-[#2D3748]"
          />
          <div className="flex-1 min-w-0">
            <p className={`text-xs font-semibold truncate ${profileName}`}>{user?.name}</p>
            <p className={`text-[10px] truncate ${profileRole}`}>{user?.role}</p>
          </div>
        </div>
        <motion.button
          onClick={handleLogout}
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.98 }}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${logoutClass}`}
        >
          <LogOut className="w-4 h-4 flex-shrink-0" />
          <span>Log Out</span>
        </motion.button>
      </div>
    </aside>
  );
};

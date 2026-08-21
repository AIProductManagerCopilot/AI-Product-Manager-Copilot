import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  LayoutDashboard,
  Inbox,
  BarChart2,
  Layers,
  Lightbulb,
  Sliders,
  FileText,
  Map,
  Bot,
  Settings,
  LogOut,
  Sparkles,
  ChevronRight,
  PanelLeftClose,
  PanelLeftOpen,
  TrendingUp,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

interface NavItem {
  label: string;
  icon: React.ElementType;
  href: string;
  badge?: string;
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard',          icon: LayoutDashboard, href: '/dashboard' },
  { label: 'Executive Summary',  icon: TrendingUp,      href: '/executive-summary' },
  { label: 'Feedback Ingestion', icon: Inbox,           href: '/feedback-ingestion' },
  { label: 'Product Analytics',  icon: BarChart2,       href: '/product-analytics' },
  { label: 'Theme Extraction',   icon: Layers,          href: '/theme-extraction' },
  { label: 'Feature Requests',   icon: Lightbulb,       href: '/feature-requests' },
  { label: 'Prioritization',     icon: Sliders,         href: '/prioritization' },
  { label: 'PRD Generator',      icon: FileText,        href: '/prd-generator' },
  { label: 'Roadmap',            icon: Map,             href: '/roadmap' },
  { label: 'Ask Copilot',        icon: Bot,             href: '/ask-copilot' },
];

const BOTTOM_ITEMS: NavItem[] = [
  { label: 'Settings', icon: Settings, href: '/settings' },
];

export const Sidebar: React.FC = () => {
  const { user, logout } = useAuth();
  const { isDark } = useTheme();
  const [isCollapsed, setIsCollapsed] = React.useState(false);
  const toggleSidebar = () => setIsCollapsed((v) => !v);
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  // Theme-aware CSS classes
  const sidebarBg   = isDark ? 'bg-[#090f15] border-[#1e2530]' : 'bg-[#F8FAFC] border-[#E2E8F0]/80 shadow-sm';
  const logoText    = isDark ? 'text-white' : 'text-[#0F172A]';
  const logoSub     = isDark ? 'text-[#64748B]' : 'text-[#64748B]';
  const divider     = isDark ? 'border-[#1e2530]' : 'border-[#E2E8F0]';

  const navActive   = 'bg-gradient-to-r from-[#3B82F6] to-[#8B5CF6] text-white shadow-lg shadow-blue-500/25 scale-[1.01] font-semibold';

  const navInactive = isDark
    ? 'text-[#94A3B8] border border-transparent hover:bg-[#1e2530]/80 hover:text-white hover:border-[#3B82F6]/30 hover:shadow-md hover:shadow-blue-500/5 hover:translate-x-1 transition-all duration-200'
    : 'text-[#475569] border border-transparent hover:bg-white hover:text-[#0F172A] hover:border-[#E2E8F0] hover:shadow-sm hover:translate-x-1 transition-all duration-200';

  const iconActive  = 'text-white';
  const iconDefault = isDark ? 'text-[#64748B] group-hover:text-white' : 'text-[#64748B] group-hover:text-[#0F172A]';

  const profileBg   = isDark
    ? 'bg-[#1b2027] border-[#1e2530] hover:border-[#3B82F6]/40 hover:bg-[#202730] hover:shadow-lg hover:shadow-blue-500/5 hover:-translate-y-0.5 transition-all cursor-pointer group'
    : 'bg-white border-[#E2E8F0] shadow-sm hover:border-[#3B82F6]/40 hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer group';
  
  const profileName = isDark ? 'text-white group-hover:text-[#3B82F6] transition-colors' : 'text-[#0F172A] group-hover:text-[#2563EB] transition-colors';
  const profileRole = isDark ? 'text-[#64748B]' : 'text-[#64748B]';

  const logoutClass = isDark
    ? 'text-[#EF4444]/80 hover:text-[#EF4444] hover:bg-[#EF4444]/15 hover:border-[#EF4444]/30 hover:shadow-md hover:shadow-red-500/10 border border-transparent transition-all group'
    : 'text-[#EF4444] hover:bg-[#FEF2F2] hover:border-[#FCA5A5] hover:shadow-sm border border-transparent transition-all group';

  return (
    <aside
      className={`fixed top-0 left-0 h-screen ${
        isCollapsed ? 'w-16' : 'w-60'
      } flex flex-col border-r z-40 overflow-hidden transition-all duration-300 ease-in-out ${sidebarBg}`}
    >
      {/* Logo Area */}
      <div className={`h-16 flex-shrink-0 flex items-center justify-between px-4 border-b ${divider}`}>
        {isCollapsed ? (
          <button
            onClick={toggleSidebar}
            title="Expand sidebar"
            className="w-full flex items-center justify-center cursor-pointer"
          >
            <div className="p-2 rounded-xl bg-gradient-to-br from-[#3B82F6] to-[#8B5CF6] shadow-lg shadow-blue-500/25 flex-shrink-0 hover:scale-110 hover:rotate-6 transition-all duration-300">
              <PanelLeftOpen className="w-4 h-4 text-white" />
            </div>
          </button>
        ) : (
          <>
            <div className="flex items-center gap-3 overflow-hidden group cursor-pointer">
              <div className="p-2 rounded-xl bg-gradient-to-br from-[#3B82F6] to-[#8B5CF6] shadow-lg shadow-blue-500/25 flex-shrink-0 group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="whitespace-nowrap"
              >
                <p className={`text-sm font-bold leading-none font-display ${logoText}`}>AIPM</p>
                <p className={`text-[10px] leading-none mt-0.5 ${logoSub}`}>Copilot</p>
              </motion.div>
            </div>

            {toggleSidebar && (
              <button
                onClick={toggleSidebar}
                title="Collapse sidebar"
                className={`p-1.5 rounded-lg flex-shrink-0 cursor-pointer ${isDark ? 'text-[#64748B] hover:text-white' : 'text-[#94A3B8] hover:text-[#0F172A]'}`}
              >
                <PanelLeftClose className="w-4 h-4" />
              </button>
            )}
          </>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-2.5 space-y-1">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.href}
            to={item.href}
            title={isCollapsed ? `${item.label}${item.badge ? ` (${item.badge})` : ''}` : undefined}
            className={({ isActive }) =>
              `group flex items-center ${
                isCollapsed ? 'justify-center px-2 py-2.5' : 'gap-3 px-3 py-2.5'
              } rounded-xl text-sm font-medium transition-all duration-200 ${
                isActive ? navActive : navInactive
              }`
            }
          >
            {({ isActive }) => (
              <>
                <item.icon
                  className={`w-4 h-4 flex-shrink-0 transition-all duration-200 group-hover:scale-110 ${
                    isActive ? iconActive : iconDefault
                  }`}
                />
                {!isCollapsed && (
                  <>
                    <span className="flex-1 truncate">{item.label}</span>
                    {item.badge && (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-[#8B5CF6]/20 text-[#8B5CF6] border border-[#8B5CF6]/30 group-hover:scale-105 group-hover:bg-[#8B5CF6]/30 transition-all">
                        {item.badge}
                      </span>
                    )}
                    {isActive && (
                      <ChevronRight className="w-3.5 h-3.5 text-white transition-transform duration-200 group-hover:translate-x-1" />
                    )}
                  </>
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
            title={isCollapsed ? item.label : undefined}
            className={({ isActive }) =>
              `group flex items-center ${
                isCollapsed ? 'justify-center px-2 py-2.5' : 'gap-3 px-3 py-2.5'
              } rounded-xl text-sm font-medium transition-all duration-200 ${
                isActive ? navActive : navInactive
              }`
            }
          >
            {({ isActive }) => (
              <>
                <item.icon className={`w-4 h-4 flex-shrink-0 transition-all duration-200 group-hover:scale-110 ${isActive ? iconActive : iconDefault}`} />
                {!isCollapsed && <span>{item.label}</span>}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* User Profile + Logout */}
      <div className={`p-2.5 border-t ${divider}`}>
        <div
          title={isCollapsed ? `${user?.name || 'Gagandeep G'} (${user?.role || 'Product Lead'})` : undefined}
          className={`flex items-center ${
            isCollapsed ? 'justify-center p-2' : 'gap-3 px-3 py-2.5'
          } rounded-xl border mb-2 ${profileBg}`}
        >
          {user?.avatarUrl ? (
            <img
              src={user.avatarUrl}
              alt="avatar"
              referrerPolicy="no-referrer"
              className="w-8 h-8 rounded-full flex-shrink-0 bg-[#2D3748] transition-transform duration-200 group-hover:scale-110"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#EC4899] to-[#F43F5E] text-white font-bold text-sm flex items-center justify-center flex-shrink-0 shadow-md">
              {user?.name?.charAt(0) || 'G'}
            </div>
          )}
          {!isCollapsed && (
            <div className="flex-1 min-w-0">
              <p className={`text-xs font-semibold truncate ${profileName}`}>{user?.name || 'Gagandeep G'}</p>
              <p className={`text-[10px] truncate ${profileRole}`}>{user?.role || 'Product Lead'}</p>
            </div>
          )}
        </div>

        <motion.button
          onClick={handleLogout}
          title={isCollapsed ? 'Log Out' : undefined}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className={`w-full flex items-center ${
            isCollapsed ? 'justify-center py-2.5' : 'gap-3 px-3 py-2.5'
          } rounded-xl text-xs font-bold ${logoutClass}`}
        >
          <LogOut className="w-4 h-4 flex-shrink-0 transition-transform duration-200 group-hover:-translate-x-0.5 group-hover:scale-110" />
          {!isCollapsed && <span>Log Out</span>}
        </motion.button>

        {!isCollapsed && (
          <p className="text-[10px] text-[#64748B] mt-3 px-1 leading-tight text-center">
            © 2026 AI Product Manager Copilot<br />All rights reserved.
          </p>
        )}
      </div>
    </aside>
  );
};

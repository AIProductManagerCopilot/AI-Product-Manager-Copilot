import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Settings as SettingsIcon,
  User,
  Users,
  CreditCard,
  Key,
  Shield,
  Plus,
  Eye,
  EyeOff,
  Copy,
  MoreVertical,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  ChevronRight,
  ShieldAlert,
  Loader2,
  Database,
  Flame,
  Lock,
  Edit2,
  Trash2,
} from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

import { Sidebar } from '../components/Sidebar';
import { TopNavbar } from '../components/TopNavbar';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import {
  settingsService,
  type TeamMember,
  type ApiKeyItem,
  type CoreIntegration,
} from '../services/settingsService';

import { InviteMemberModal } from '../components/modals/InviteMemberModal';
import { AddConnectorModal } from '../components/modals/AddConnectorModal';
import { EditApiKeyModal } from '../components/modals/EditApiKeyModal';
import { SecurityPolicyModal } from '../components/modals/SecurityPolicyModal';

export const SettingsPage: React.FC = () => {
  const { user } = useAuth();
  const { isDark } = useTheme();

  // Active sub-tab state
  const [activeTab, setActiveTab] = useState<'rbac' | 'profile' | 'billing' | 'apikeys'>('rbac');

  // Data states
  const [connectedProject, setConnectedProject] = useState('BankApp Pro');
  const [deploymentEnv, setDeploymentEnv] = useState('Local Cluster');
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [apiKeys, setApiKeys] = useState<ApiKeyItem[]>([]);
  const [integrations, setIntegrations] = useState<CoreIntegration[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Masked/Revealed API key state map
  const [revealedKeys, setRevealedKeys] = useState<Record<string, boolean>>({});

  // Active action dropdown user ID
  const [activeUserMenu, setActiveUserMenu] = useState<string | null>(null);

  // Testing connection spinner map
  const [testingInteg, setTestingInteg] = useState<Record<string, boolean>>({});

  // Modals state
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showConnectorModal, setShowConnectorModal] = useState(false);
  const [editingKey, setEditingKey] = useState<ApiKeyItem | null>(null);
  const [showSecurityModal, setShowSecurityModal] = useState(false);

  const getInitials = (nameStr: string) => {
    if (!nameStr) return 'U';
    const parts = nameStr.trim().split(' ').filter(Boolean);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return nameStr.slice(0, 2).toUpperCase();
  };

  // Load initial settings data
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const rbacData = await settingsService.getRbacMatrix();
        setConnectedProject(rbacData.connectedProject);
        setDeploymentEnv(rbacData.deploymentEnvironment);

        const formattedMembers = rbacData.members.map((m) => {
          if (m.isCurrentUser && user) {
            return {
              ...m,
              name: user.name || m.name,
              email: user.email || m.email,
              avatarInitials: getInitials(user.name || m.name),
            };
          }
          return m;
        });
        setMembers(formattedMembers);

        const keyData = await settingsService.getApiKeys();
        setApiKeys(keyData);

        const integData = await settingsService.getIntegrations();
        setIntegrations(integData);
      } catch (error) {
        toast.error('Failed to load settings configuration matrix.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [user]);

  // Sync user object updates whenever auth context resolves
  useEffect(() => {
    if (user) {
      setMembers((prevMembers) =>
        prevMembers.map((m) => {
          if (m.isCurrentUser) {
            return {
              ...m,
              name: user.name || m.name,
              email: user.email || m.email,
              avatarInitials: getInitials(user.name || m.name),
            };
          }
          return m;
        })
      );
    }
  }, [user]);

  // Handler: Toggle MFA for member
  const handleToggleMfa = async (member: TeamMember) => {
    const newMfa = !member.mfaEnabled;
    try {
      const updated = await settingsService.updateMember(member.id, { mfaEnabled: newMfa });
      setMembers((prev) => prev.map((m) => (m.id === member.id ? updated : m)));
      toast.success(`MFA ${newMfa ? 'enabled' : 'disabled'} for ${member.name}`);
    } catch {
      toast.error('Could not update MFA status');
    }
  };

  // Handler: Remove member
  const handleRemoveMember = async (member: TeamMember) => {
    if (member.isCurrentUser) {
      toast.error('Cannot remove master access owner account.');
      return;
    }
    if (!window.confirm(`Are you sure you want to remove ${member.name} from workspace?`)) return;

    try {
      await settingsService.deleteMember(member.id);
      setMembers((prev) => prev.filter((m) => m.id !== member.id));
      setActiveUserMenu(null);
      toast.success(`Removed ${member.name} from workspace.`);
    } catch (err: any) {
      toast.error(err?.message || 'Failed to remove member');
    }
  };

  // Handler: Invite Member submit
  const handleInviteSubmit = async (data: {
    name: string;
    email: string;
    role: string;
    roleCategory: string;
    permissions: string[];
  }) => {
    try {
      const newMember = await settingsService.inviteMember(data);
      setMembers((prev) => [...prev, newMember]);
      toast.success(`Invitation sent to ${data.email}`);
    } catch (err: any) {
      toast.error(err?.message || 'Failed to invite member');
    }
  };

  // Handler: Reveal/Hide Key
  const toggleKeyReveal = (keyId: string) => {
    setRevealedKeys((prev) => ({ ...prev, [keyId]: !prev[keyId] }));
  };

  // Handler: Copy Key
  const handleCopyKey = (key: ApiKeyItem) => {
    navigator.clipboard.writeText(key.secretValue);
    toast.success(`Copied ${key.keyName} to clipboard!`);
  };

  // Handler: Update API key
  const handleSaveApiKey = async (keyId: string, secretValue: string) => {
    try {
      const updated = await settingsService.updateApiKey(keyId, secretValue);
      setApiKeys((prev) => prev.map((k) => (k.id === keyId ? updated : k)));
      toast.success(`Updated ${updated.keyName}`);
    } catch {
      toast.error('Failed to update API key');
    }
  };

  // Handler: Add Connector
  const handleAddConnector = async (data: { name: string; type: string; endpointOrUrl: string }) => {
    try {
      const newInteg = await settingsService.addConnector(data);
      setIntegrations((prev) => [...prev, newInteg]);
      toast.success(`Added ${data.name} connector`);
    } catch {
      toast.error('Failed to add connector');
    }
  };

  // Handler: Test Connection
  const handleTestConnection = async (integrationId: string) => {
    setTestingInteg((prev) => ({ ...prev, [integrationId]: true }));
    try {
      const res = await settingsService.testIntegrationConnection(integrationId);
      toast.success(res.message, { duration: 4000 });
    } catch {
      toast.error('Connection test failed');
    } finally {
      setTestingInteg((prev) => ({ ...prev, [integrationId]: false }));
    }
  };

  // Theme-aware styles
  const pageBg = isDark ? 'bg-[#090D12] text-[#F8FAFC]' : 'bg-[#F8FAFC] text-[#0F172A]';
  const cardBg = isDark
    ? 'bg-[#121820]/90 border-[#1E2633] shadow-xl'
    : 'bg-white border-[#E2E8F0] shadow-sm';
  const headerBorder = isDark ? 'border-[#1E2633]' : 'border-[#E2E8F0]';
  const innerCardBg = isDark ? 'bg-[#0A0E14]/80 border-[#1E2633]' : 'bg-[#F8FAFC] border-[#E2E8F0]';

  return (
    <div className={`min-h-screen flex ${pageBg}`}>
      <Toaster position="top-right" />
      <Sidebar />

      <div className="flex-1 flex flex-col pl-60">
        <TopNavbar searchPlaceholder="Search settings..." />

        <main className="flex-1 mt-16 p-8 max-w-7xl w-full mx-auto space-y-8">
          {/* Header Title Section */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-6 border-[#1E2633]/60">
            <div className="space-y-1">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-gradient-to-br from-[#8B5CF6] via-[#6366F1] to-[#3B82F6] shadow-lg shadow-purple-500/20">
                  <SettingsIcon className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-black tracking-tight font-display text-white">
                    System Settings <span className="text-[#94A3B8] font-normal">— Platform Configuration Matrix</span>
                  </h1>
                  <div className="flex items-center gap-2 text-xs font-semibold text-[#94A3B8] mt-1">
                    <span>Connected Project: <strong className="text-[#38BDF8]">{connectedProject}</strong></span>
                    <span>•</span>
                    <span className="flex items-center gap-1.5">
                      Deployment Environment:
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/30">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-pulse" />
                        {deploymentEnv}
                      </span>
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Main Layout Grid: Inner Sidebar + Content Area */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left Inner Sidebar Tabs */}
            <div className="lg:col-span-3 space-y-2">
              {[
                { id: 'profile', label: 'Profile Settings', icon: User },
                { id: 'rbac', label: 'Team & RBAC Management', icon: Users },
                { id: 'billing', label: 'Billing & Usage', icon: CreditCard },
                { id: 'apikeys', label: 'API Keys & Connectors', icon: Key },
              ].map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-semibold transition-all duration-200 ${
                      isActive
                        ? 'bg-gradient-to-r from-[#8B5CF6]/20 via-[#6366F1]/15 to-transparent text-white border border-[#8B5CF6]/40 shadow-lg shadow-purple-500/10'
                        : isDark
                        ? 'text-[#94A3B8] hover:text-white hover:bg-[#161B22] border border-transparent'
                        : 'text-[#475569] hover:text-[#0F172A] hover:bg-white border border-transparent'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isActive ? 'text-[#A78BFA]' : 'text-[#64748B]'}`} />
                    <span className="flex-1 text-left">{tab.label}</span>
                    {isActive && <ChevronRight className="w-4 h-4 text-[#A78BFA]" />}
                  </button>
                );
              })}
            </div>

            {/* Right Main Content Area */}
            <div className="lg:col-span-9 space-y-8">
              {/* TAB 1: Team & RBAC Management (Also default matrices view matching screenshot) */}
              {(activeTab === 'rbac' || activeTab === 'apikeys') && (
                <>
                  {/* CARD A: Role-Based Access Control (RBAC) Matrix */}
                  <motion.div
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`p-6 rounded-3xl border ${cardBg}`}
                  >
                    {/* Header bar */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-[#1E2633]">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-[#8B5CF6]/15 border border-[#8B5CF6]/30 text-[#A78BFA]">
                          <Shield className="w-5 h-5" />
                        </div>
                        <div>
                          <h2 className="text-base font-bold text-white">
                            A. Role-Based Access Control (RBAC) Matrix
                          </h2>
                          <p className="text-xs text-[#94A3B8]">
                            Manage team members, roles, and workspace permissions.
                          </p>
                        </div>
                      </div>

                      <button
                        onClick={() => setShowInviteModal(true)}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-[#8B5CF6] to-[#3B82F6] hover:opacity-90 shadow-md shadow-purple-500/20 transition-all cursor-pointer self-start sm:self-auto"
                      >
                        <Plus className="w-4 h-4" />
                        Invite Member
                      </button>
                    </div>

                    {/* RBAC Table */}
                    <div className="mt-5 overflow-x-auto">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="border-b border-[#1E2633] text-[#64748B] uppercase tracking-wider font-semibold text-[11px]">
                            <th className="py-3 px-3">User</th>
                            <th className="py-3 px-3">Email Address</th>
                            <th className="py-3 px-3">Role</th>
                            <th className="py-3 px-3">Permissions</th>
                            <th className="py-3 px-3">Status</th>
                            <th className="py-3 px-3">MFA</th>
                            <th className="py-3 px-3 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#1E2633]/60">
                          {members.map((m) => {
                            const isProductLead = m.role === 'Product Lead';
                            const isAdmin = m.role === 'Admin';
                            const roleBadgeBg = isProductLead
                              ? 'bg-[#8B5CF6]/20 text-[#C084FC] border-[#8B5CF6]/40'
                              : isAdmin
                              ? 'bg-[#3B82F6]/20 text-[#60A5FA] border-[#3B82F6]/40'
                              : 'bg-[#10B981]/20 text-[#34D399] border-[#10B981]/40';

                            const avatarBg = isProductLead
                              ? 'from-[#EC4899] to-[#F43F5E]'
                              : isAdmin
                              ? 'from-[#3B82F6] to-[#2563EB]'
                              : 'from-[#10B981] to-[#059669]';

                            return (
                              <tr key={m.id} className="hover:bg-[#161D27]/60 transition-colors">
                                {/* User name */}
                                <td className="py-4 px-3">
                                  <div className="flex items-center gap-3">
                                    <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${avatarBg} text-white font-bold text-xs flex items-center justify-center shadow-md flex-shrink-0`}>
                                      {m.avatarInitials}
                                    </div>
                                    <div>
                                      <div className="font-bold text-white flex items-center gap-1.5">
                                        {m.name}
                                        {m.isCurrentUser && (
                                          <span className="text-[10px] font-normal text-[#94A3B8]">
                                            You
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                </td>

                                {/* Email */}
                                <td className="py-4 px-3 font-mono text-[#94A3B8]">
                                  {m.email}
                                </td>

                                {/* Role */}
                                <td className="py-4 px-3">
                                  <div className="inline-flex flex-col">
                                    <span className={`px-2.5 py-0.5 rounded-md text-[11px] font-bold border ${roleBadgeBg}`}>
                                      {m.role}
                                    </span>
                                    <span className="text-[10px] text-[#64748B] mt-0.5 font-medium">
                                      {m.roleCategory}
                                    </span>
                                  </div>
                                </td>

                                {/* Permissions checklist */}
                                <td className="py-4 px-3">
                                  <div className="flex flex-col gap-1 max-w-[200px]">
                                    {m.permissions.map((perm) => (
                                      <div key={perm} className="flex items-center gap-1 text-[11px] text-[#94A3B8]">
                                        <CheckCircle2 className="w-3 h-3 text-[#10B981] flex-shrink-0" />
                                        <span className="truncate">{perm}</span>
                                      </div>
                                    ))}
                                  </div>
                                </td>

                                {/* Status */}
                                <td className="py-4 px-3">
                                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/30">
                                    <span className="w-1.5 h-1.5 rounded-full bg-[#10B981]" />
                                    {m.status}
                                  </span>
                                </td>

                                {/* MFA Toggle */}
                                <td className="py-4 px-3">
                                  <button
                                    onClick={() => handleToggleMfa(m)}
                                    title="Toggle MFA"
                                    className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                                      m.mfaEnabled ? 'bg-[#8B5CF6]' : 'bg-[#334155]'
                                    }`}
                                  >
                                    <span
                                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                                        m.mfaEnabled ? 'translate-x-5' : 'translate-x-0'
                                      }`}
                                    />
                                  </button>
                                </td>

                                {/* Actions */}
                                <td className="py-4 px-3 text-right relative">
                                  <button
                                    onClick={() => setActiveUserMenu(activeUserMenu === m.id ? null : m.id)}
                                    className="p-1.5 rounded-lg text-[#64748B] hover:text-white hover:bg-[#1E2633] transition-all"
                                  >
                                    <MoreVertical className="w-4 h-4" />
                                  </button>

                                  <AnimatePresence>
                                    {activeUserMenu === m.id && (
                                      <>
                                        <div
                                          className="fixed inset-0 z-10"
                                          onClick={() => setActiveUserMenu(null)}
                                        />
                                        <motion.div
                                          initial={{ opacity: 0, scale: 0.95, y: 5 }}
                                          animate={{ opacity: 1, scale: 1, y: 0 }}
                                          exit={{ opacity: 0, scale: 0.95, y: 5 }}
                                          className="absolute right-3 top-12 z-20 w-44 rounded-xl border border-[#2D3748] bg-[#161B22] shadow-2xl p-1 text-left"
                                        >
                                          <button
                                            onClick={() => {
                                              setActiveUserMenu(null);
                                              toast.success(`Role settings opened for ${m.name}`);
                                            }}
                                            className="w-full flex items-center gap-2 px-3 py-2 text-xs text-[#94A3B8] hover:text-white hover:bg-[#1E2633] rounded-lg"
                                          >
                                            <Edit2 className="w-3.5 h-3.5" /> Edit Permissions
                                          </button>
                                          {!m.isCurrentUser && (
                                            <button
                                              onClick={() => handleRemoveMember(m)}
                                              className="w-full flex items-center gap-2 px-3 py-2 text-xs text-[#EF4444] hover:bg-[#EF4444]/15 rounded-lg"
                                            >
                                              <Trash2 className="w-3.5 h-3.5" /> Remove Member
                                            </button>
                                          )}
                                        </motion.div>
                                      </>
                                    )}
                                  </AnimatePresence>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </motion.div>

                  {/* CARD B: API Credentials & Core Integrations */}
                  <motion.div
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className={`p-6 rounded-3xl border ${cardBg}`}
                  >
                    {/* Header bar */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-[#1E2633]">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-[#8B5CF6]/15 border border-[#8B5CF6]/30 text-[#A78BFA]">
                          <Key className="w-5 h-5" />
                        </div>
                        <div>
                          <h2 className="text-base font-bold text-white">
                            B. API Credentials & Core Integrations
                          </h2>
                          <p className="text-xs text-[#94A3B8]">
                            Manage API keys and verify third-party service connections.
                          </p>
                        </div>
                      </div>

                      <button
                        onClick={() => setShowConnectorModal(true)}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-[#8B5CF6] to-[#3B82F6] hover:opacity-90 shadow-md shadow-purple-500/20 transition-all cursor-pointer self-start sm:self-auto"
                      >
                        <Plus className="w-4 h-4" />
                        Add Connector
                      </button>
                    </div>

                    {/* Split 2 Columns */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-6">
                      {/* Left Column: API Keys (5 cols) */}
                      <div className="lg:col-span-6 space-y-4 border-r-0 lg:border-r border-[#1E2633] pr-0 lg:pr-6">
                        <h3 className="text-xs font-bold uppercase tracking-wider text-[#94A3B8]">
                          API Keys
                        </h3>
                        <div className="space-y-3">
                          {apiKeys.map((key) => {
                            const isRevealed = revealedKeys[key.id];
                            return (
                              <div
                                key={key.id}
                                className={`p-3.5 rounded-2xl border ${innerCardBg} flex items-center justify-between gap-3`}
                              >
                                <div className="min-w-0 flex-1">
                                  <p className="text-xs font-bold font-mono text-white truncate">
                                    {key.keyName}
                                  </p>
                                  <p className="text-[11px] font-mono text-[#94A3B8] mt-0.5 truncate">
                                    {isRevealed ? key.secretValue : key.maskedValue}
                                  </p>
                                </div>

                                <div className="flex items-center gap-1.5 flex-shrink-0">
                                  <button
                                    onClick={() => toggleKeyReveal(key.id)}
                                    title={isRevealed ? 'Hide Secret' : 'Reveal Secret'}
                                    className="p-1.5 rounded-lg text-[#64748B] hover:text-white hover:bg-[#1E2633] transition-all"
                                  >
                                    {isRevealed ? (
                                      <EyeOff className="w-3.5 h-3.5 text-[#38BDF8]" />
                                    ) : (
                                      <Eye className="w-3.5 h-3.5" />
                                    )}
                                  </button>

                                  <button
                                    onClick={() => handleCopyKey(key)}
                                    title="Copy Key"
                                    className="p-1.5 rounded-lg text-[#64748B] hover:text-white hover:bg-[#1E2633] transition-all"
                                  >
                                    <Copy className="w-3.5 h-3.5" />
                                  </button>

                                  <button
                                    onClick={() => setEditingKey(key)}
                                    className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-[#8B5CF6]/15 text-[#A78BFA] border border-[#8B5CF6]/30 hover:bg-[#8B5CF6]/25 transition-all"
                                  >
                                    Reveal Key
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Right Column: Core Integrations (6 cols) */}
                      <div className="lg:col-span-6 space-y-4">
                        <h3 className="text-xs font-bold uppercase tracking-wider text-[#94A3B8]">
                          Core Integrations
                        </h3>
                        <div className="space-y-3">
                          {integrations.map((integ) => {
                            const isTesting = testingInteg[integ.id];
                            const isQdrant = integ.iconType === 'qdrant';

                            return (
                              <div
                                key={integ.id}
                                className={`p-4 rounded-2xl border ${innerCardBg} space-y-3`}
                              >
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-[#161B22] border border-[#2D3748] shadow-md">
                                      {isQdrant ? (
                                        <Database className="w-5 h-5 text-[#EC4899]" />
                                      ) : (
                                        <Flame className="w-5 h-5 text-[#F59E0B]" />
                                      )}
                                    </div>
                                    <div>
                                      <h4 className="text-xs font-bold text-white">
                                        {integ.name}
                                      </h4>
                                      <div className="flex items-center gap-1.5 text-[10px] text-[#10B981] mt-0.5 font-semibold">
                                        <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-pulse" />
                                        {integ.status}
                                      </div>
                                    </div>
                                  </div>

                                  <button
                                    onClick={() => handleTestConnection(integ.id)}
                                    disabled={isTesting}
                                    className="px-3 py-1.5 rounded-xl text-xs font-semibold text-[#38BDF8] bg-[#38BDF8]/10 border border-[#38BDF8]/30 hover:bg-[#38BDF8]/20 transition-all flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                                  >
                                    {isTesting ? (
                                      <>
                                        <Loader2 className="w-3 h-3 animate-spin" /> Ping...
                                      </>
                                    ) : (
                                      'Test Connection'
                                    )}
                                  </button>
                                </div>

                                <div className="p-2.5 rounded-xl bg-[#090D12] border border-[#1E2633] text-[11px] font-mono text-[#94A3B8] space-y-0.5">
                                  {Object.entries(integ.details).map(([k, v]) => (
                                    <div key={k}>{String(v)}</div>
                                  ))}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </motion.div>

                  {/* CARD C: Security & Compliance Banner */}
                  <motion.div
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="p-5 rounded-3xl border border-[#F59E0B]/40 bg-gradient-to-r from-[#F59E0B]/10 via-[#D97706]/5 to-transparent flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl shadow-amber-500/5"
                  >
                    <div className="flex items-start gap-4">
                      <div className="p-3 rounded-2xl bg-[#F59E0B]/20 border border-[#F59E0B]/40 text-[#F59E0B] flex-shrink-0">
                        <ShieldAlert className="w-6 h-6" />
                      </div>
                      <div className="space-y-1">
                        <h3 className="text-sm font-bold text-[#F59E0B]">
                          Security & Compliance
                        </h3>
                        <p className="text-xs text-[#E2E8F0] leading-relaxed max-w-3xl">
                          Compliance Enforced: Centralized environment parameters are parsed via secure configuration loaders. Access keys, authorization headers, and Firebase raw token strings are strictly obfuscated and filtered from system metrics pipelines to prevent cryptographic leakage.
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => setShowSecurityModal(true)}
                      className="px-4 py-2.5 rounded-xl text-xs font-bold text-[#F59E0B] bg-[#F59E0B]/15 border border-[#F59E0B]/30 hover:bg-[#F59E0B]/25 transition-all flex items-center gap-1.5 flex-shrink-0 self-start md:self-auto cursor-pointer"
                    >
                      View Security Policy <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </motion.div>
                </>
              )}

              {/* TAB 2: Profile Settings */}
              {activeTab === 'profile' && (
                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`p-6 rounded-3xl border ${cardBg} space-y-6`}
                >
                  <div className="flex items-center gap-3 pb-4 border-b border-[#1E2633]">
                    <User className="w-5 h-5 text-[#8B5CF6]" />
                    <div>
                      <h2 className="text-base font-bold text-white">Profile Settings</h2>
                      <p className="text-xs text-[#94A3B8]">Manage account details and password security.</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-[#94A3B8] mb-1">Full Name</label>
                      <input
                        type="text"
                        defaultValue={user?.name || 'Gagandeep G'}
                        className={`w-full px-3.5 py-2.5 border rounded-xl text-sm ${innerCardBg} text-white`}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-[#94A3B8] mb-1">Email Address</label>
                      <input
                        type="email"
                        defaultValue={user?.email || 'gagandeep.g@bankapppro.com'}
                        className={`w-full px-3.5 py-2.5 border rounded-xl text-sm ${innerCardBg} text-white`}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-[#94A3B8] mb-1">Role Title</label>
                      <input
                        type="text"
                        readOnly
                        defaultValue={user?.role || 'Product Lead'}
                        className={`w-full px-3.5 py-2.5 border rounded-xl text-sm ${innerCardBg} text-white opacity-70`}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-[#94A3B8] mb-1">Organization</label>
                      <input
                        type="text"
                        defaultValue={user?.organization || 'BankApp Pro'}
                        className={`w-full px-3.5 py-2.5 border rounded-xl text-sm ${innerCardBg} text-white`}
                      />
                    </div>
                  </div>

                  <button
                    onClick={() => toast.success('Profile preferences updated!')}
                    className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-[#8B5CF6] to-[#3B82F6] shadow-md shadow-purple-500/20"
                  >
                    Save Changes
                  </button>
                </motion.div>
              )}

              {/* TAB 3: Billing & Usage */}
              {activeTab === 'billing' && (
                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`p-6 rounded-3xl border ${cardBg} space-y-6`}
                >
                  <div className="flex items-center gap-3 pb-4 border-b border-[#1E2633]">
                    <CreditCard className="w-5 h-5 text-[#8B5CF6]" />
                    <div>
                      <h2 className="text-base font-bold text-white">Billing & Plan Usage</h2>
                      <p className="text-xs text-[#94A3B8]">Monitor workspace subscription plan and token meters.</p>
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl border border-[#8B5CF6]/30 bg-[#8B5CF6]/10 flex justify-between items-center">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#A78BFA]">Active Plan</span>
                      <h3 className="text-lg font-black text-white">Enterprise Pro Tier</h3>
                      <p className="text-xs text-[#94A3B8]">$299 / month • Renews September 2026</p>
                    </div>
                    <button
                      onClick={() => toast.success('Redirecting to Stripe Billing Customer Portal')}
                      className="px-4 py-2 rounded-xl text-xs font-bold bg-[#8B5CF6] text-white shadow-md shadow-purple-500/20"
                    >
                      Manage Subscription
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className={`p-4 rounded-2xl border ${innerCardBg} space-y-2`}>
                      <span className="text-xs font-semibold text-[#64748B]">AI Tokens Used</span>
                      <p className="text-xl font-bold text-white">142,500 <span className="text-xs font-normal text-[#64748B]">/ 500k</span></p>
                      <div className="w-full h-2 rounded-full bg-[#1E2633] overflow-hidden">
                        <div className="h-full bg-[#3B82F6] w-[28.5%]" />
                      </div>
                    </div>

                    <div className={`p-4 rounded-2xl border ${innerCardBg} space-y-2`}>
                      <span className="text-xs font-semibold text-[#64748B]">Feedback Vectors</span>
                      <p className="text-xl font-bold text-white">84,200 <span className="text-xs font-normal text-[#64748B]">/ 250k</span></p>
                      <div className="w-full h-2 rounded-full bg-[#1E2633] overflow-hidden">
                        <div className="h-full bg-[#EC4899] w-[33.6%]" />
                      </div>
                    </div>

                    <div className={`p-4 rounded-2xl border ${innerCardBg} space-y-2`}>
                      <span className="text-xs font-semibold text-[#64748B]">Team Seats</span>
                      <p className="text-xl font-bold text-white">3 <span className="text-xs font-normal text-[#64748B]">/ 10 seats</span></p>
                      <div className="w-full h-2 rounded-full bg-[#1E2633] overflow-hidden">
                        <div className="h-full bg-[#10B981] w-[30%]" />
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </div>
          </div>
        </main>
      </div>

      {/* Modals */}
      <InviteMemberModal
        isOpen={showInviteModal}
        onClose={() => setShowInviteModal(false)}
        onInvite={handleInviteSubmit}
      />

      <AddConnectorModal
        isOpen={showConnectorModal}
        onClose={() => setShowConnectorModal(false)}
        onAdd={handleAddConnector}
      />

      <EditApiKeyModal
        isOpen={!!editingKey}
        apiKey={editingKey}
        onClose={() => setEditingKey(null)}
        onSave={handleSaveApiKey}
      />

      <SecurityPolicyModal
        isOpen={showSecurityModal}
        onClose={() => setShowSecurityModal(false)}
      />
    </div>
  );
};

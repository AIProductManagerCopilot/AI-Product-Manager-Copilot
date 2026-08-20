import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, UserPlus, Shield, Check, Loader2 } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

interface InviteMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInvite: (data: {
    name: string;
    email: string;
    role: string;
    roleCategory: string;
    permissions: string[];
  }) => Promise<void>;
}

const AVAILABLE_PERMISSIONS = [
  'All Modules',
  'Settings',
  'Billing',
  'Team Mgmt',
  'Users (Read)',
  'Write',
  'Export (Limited)',
  'Assigned Modules',
];

export const InviteMemberModal: React.FC<InviteMemberModalProps> = ({
  isOpen,
  onClose,
  onInvite,
}) => {
  const { isDark } = useTheme();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('Engineer');
  const [roleCategory, setRoleCategory] = useState('Write Access');
  const [permissions, setPermissions] = useState<string[]>([
    'Assigned Modules',
    'Write',
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const modalBg = isDark ? 'bg-[#161B22] border-[#2D3748]' : 'bg-white border-[#E2E8F0]';
  const headerBg = isDark ? 'border-[#1e2530]' : 'border-[#F1F5F9]';
  const footerBg = isDark ? 'border-[#1e2530] bg-[#0D1117]/40' : 'border-[#F1F5F9] bg-[#F8FAFC]';
  const inputBg = isDark ? 'bg-[#0D1117]/80 border-[#2D3748] text-white' : 'bg-[#F8FAFC] border-[#E2E8F0] text-[#0F172A]';

  const handleRoleChange = (newRole: string) => {
    setRole(newRole);
    if (newRole === 'Product Lead') {
      setRoleCategory('Master Access');
      setPermissions(['All Modules', 'Settings', 'Billing', 'Team Mgmt']);
    } else if (newRole === 'Admin') {
      setRoleCategory('Admin Access');
      setPermissions(['All Modules', 'Settings', 'Users (Read)']);
    } else if (newRole === 'Engineer') {
      setRoleCategory('Write Access');
      setPermissions(['Assigned Modules', 'Write', 'Export (Limited)']);
    } else {
      setRoleCategory('Read Access');
      setPermissions(['Assigned Modules', 'Users (Read)']);
    }
  };

  const togglePermission = (perm: string) => {
    setPermissions((prev) =>
      prev.includes(perm) ? prev.filter((p) => p !== perm) : [...prev, perm]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) {
      setError('Please provide both full name and a valid email address.');
      return;
    }
    setError('');
    setIsSubmitting(true);
    try {
      await onInvite({ name, email, role, roleCategory, permissions });
      setName('');
      setEmail('');
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to invite member.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2 }}
            className={`relative w-full max-w-lg border rounded-2xl shadow-2xl overflow-hidden flex flex-col ${modalBg}`}
          >
            {/* Header */}
            <div className={`flex items-center justify-between px-6 py-4 border-b ${headerBg}`}>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-gradient-to-br from-[#8B5CF6] to-[#3B82F6] shadow-md shadow-purple-500/20">
                  <UserPlus className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h3 className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>
                    Invite Workspace Member
                  </h3>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    Add a new team member and configure role-based permissions
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg text-[#64748B] hover:text-white hover:bg-[#2D3748] transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {error && (
                <div className="p-3 rounded-xl bg-[#EF4444]/10 border border-[#EF4444]/30 text-xs text-[#EF4444]">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-muted)' }}>
                  Full Name <span className="text-[#EF4444]">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Alex Morgan"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={`w-full px-3.5 py-2.5 border rounded-xl text-sm focus:outline-none focus:border-[#8B5CF6] ${inputBg}`}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-muted)' }}>
                  Email Address <span className="text-[#EF4444]">*</span>
                </label>
                <input
                  type="email"
                  required
                  placeholder="alex.morgan@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={`w-full px-3.5 py-2.5 border rounded-xl text-sm focus:outline-none focus:border-[#8B5CF6] ${inputBg}`}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-muted)' }}>
                    Role Title
                  </label>
                  <select
                    value={role}
                    onChange={(e) => handleRoleChange(e.target.value)}
                    className={`w-full px-3.5 py-2.5 border rounded-xl text-sm focus:outline-none focus:border-[#8B5CF6] ${inputBg}`}
                  >
                    <option value="Product Lead">Product Lead</option>
                    <option value="Admin">Admin</option>
                    <option value="Engineer">Engineer</option>
                    <option value="Viewer">Viewer</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-muted)' }}>
                    Access Category
                  </label>
                  <input
                    type="text"
                    value={roleCategory}
                    readOnly
                    className={`w-full px-3.5 py-2.5 border rounded-xl text-sm opacity-80 ${inputBg}`}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--text-muted)' }}>
                  Permissions Checklist
                </label>
                <div className="grid grid-cols-2 gap-2 p-3 rounded-xl border border-[#2D3748]/50 bg-[#0D1117]/40 max-h-36 overflow-y-auto">
                  {AVAILABLE_PERMISSIONS.map((perm) => {
                    const isChecked = permissions.includes(perm);
                    return (
                      <button
                        type="button"
                        key={perm}
                        onClick={() => togglePermission(perm)}
                        className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all text-left ${
                          isChecked
                            ? 'bg-[#8B5CF6]/20 border border-[#8B5CF6]/40 text-[#A78BFA]'
                            : 'bg-[#161B22] border border-[#2D3748] text-[#94A3B8] hover:text-white'
                        }`}
                      >
                        <div className={`w-3.5 h-3.5 rounded flex items-center justify-center border ${isChecked ? 'bg-[#8B5CF6] border-[#8B5CF6] text-white' : 'border-[#475569]'}`}>
                          {isChecked && <Check className="w-2.5 h-2.5" />}
                        </div>
                        <span className="truncate">{perm}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Footer */}
              <div className={`flex items-center justify-end gap-3 pt-4 border-t ${footerBg}`}>
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-[#94A3B8] hover:text-white hover:bg-[#2D3748] transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-[#8B5CF6] to-[#3B82F6] hover:opacity-90 shadow-lg shadow-purple-500/20 disabled:opacity-60"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" /> Inviting...
                    </>
                  ) : (
                    <>
                      <Shield className="w-3.5 h-3.5" /> Send Invitation
                    </>
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

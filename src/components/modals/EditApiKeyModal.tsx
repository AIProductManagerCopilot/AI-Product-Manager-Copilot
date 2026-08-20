import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Key, Eye, EyeOff, Check, Loader2 } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import type { ApiKeyItem } from '../../services/settingsService';

interface EditApiKeyModalProps {
  isOpen: boolean;
  apiKey: ApiKeyItem | null;
  onClose: () => void;
  onSave: (keyId: string, secretValue: string) => Promise<void>;
}

export const EditApiKeyModal: React.FC<EditApiKeyModalProps> = ({
  isOpen,
  apiKey,
  onClose,
  onSave,
}) => {
  const { isDark } = useTheme();
  const [value, setValue] = useState('');
  const [showSecret, setShowSecret] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (apiKey) {
      setValue(apiKey.secretValue || '');
      setShowSecret(false);
    }
  }, [apiKey]);

  const modalBg = isDark ? 'bg-[#161B22] border-[#2D3748]' : 'bg-white border-[#E2E8F0]';
  const headerBg = isDark ? 'border-[#1e2530]' : 'border-[#F1F5F9]';
  const footerBg = isDark ? 'border-[#1e2530] bg-[#0D1117]/40' : 'border-[#F1F5F9] bg-[#F8FAFC]';
  const inputBg = isDark ? 'bg-[#0D1117]/80 border-[#2D3748] text-white' : 'bg-[#F8FAFC] border-[#E2E8F0] text-[#0F172A]';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!apiKey || !value.trim()) return;
    setIsSubmitting(true);
    try {
      await onSave(apiKey.id, value);
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && apiKey && (
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
            className={`relative w-full max-w-md border rounded-2xl shadow-2xl overflow-hidden flex flex-col ${modalBg}`}
          >
            {/* Header */}
            <div className={`flex items-center justify-between px-6 py-4 border-b ${headerBg}`}>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-gradient-to-br from-[#8B5CF6] to-[#EC4899] shadow-md shadow-purple-500/20">
                  <Key className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h3 className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>
                    Update API Key
                  </h3>
                  <p className="text-xs font-mono text-[#8B5CF6]">
                    {apiKey.keyName}
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
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-muted)' }}>
                  Associated Service
                </label>
                <input
                  type="text"
                  readOnly
                  value={apiKey.service}
                  className={`w-full px-3.5 py-2 border rounded-xl text-xs opacity-75 ${inputBg}`}
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                    Secret Key Value
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowSecret((v) => !v)}
                    className="flex items-center gap-1 text-[11px] font-semibold text-[#3B82F6] hover:underline"
                  >
                    {showSecret ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                    {showSecret ? 'Hide Plaintext' : 'Show Plaintext'}
                  </button>
                </div>
                <input
                  type={showSecret ? 'text' : 'password'}
                  required
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  className={`w-full px-3.5 py-2.5 border rounded-xl text-sm font-mono focus:outline-none focus:border-[#8B5CF6] ${inputBg}`}
                />
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
                  className="flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-[#8B5CF6] to-[#EC4899] hover:opacity-90 shadow-lg shadow-purple-500/20 disabled:opacity-60"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" /> Saving...
                    </>
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5" /> Save API Key
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

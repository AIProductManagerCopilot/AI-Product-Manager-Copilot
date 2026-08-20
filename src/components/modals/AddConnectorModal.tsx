import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plug, CheckCircle, Loader2 } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

interface AddConnectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (data: {
    name: string;
    type: string;
    endpointOrUrl: string;
  }) => Promise<void>;
}

export const AddConnectorModal: React.FC<AddConnectorModalProps> = ({
  isOpen,
  onClose,
  onAdd,
}) => {
  const { isDark } = useTheme();
  const [name, setName] = useState('');
  const [type, setType] = useState('Vector Database');
  const [endpointOrUrl, setEndpointOrUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const modalBg = isDark ? 'bg-[#161B22] border-[#2D3748]' : 'bg-white border-[#E2E8F0]';
  const headerBg = isDark ? 'border-[#1e2530]' : 'border-[#F1F5F9]';
  const footerBg = isDark ? 'border-[#1e2530] bg-[#0D1117]/40' : 'border-[#F1F5F9] bg-[#F8FAFC]';
  const inputBg = isDark ? 'bg-[#0D1117]/80 border-[#2D3748] text-white' : 'bg-[#F8FAFC] border-[#E2E8F0] text-[#0F172A]';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !endpointOrUrl.trim()) {
      setError('Please fill in both service name and connection endpoint.');
      return;
    }
    setError('');
    setIsSubmitting(true);
    try {
      await onAdd({ name, type, endpointOrUrl });
      setName('');
      setEndpointOrUrl('');
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to add connector.');
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
            className={`relative w-full max-w-md border rounded-2xl shadow-2xl overflow-hidden flex flex-col ${modalBg}`}
          >
            {/* Header */}
            <div className={`flex items-center justify-between px-6 py-4 border-b ${headerBg}`}>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-gradient-to-br from-[#3B82F6] to-[#8B5CF6] shadow-md shadow-blue-500/20">
                  <Plug className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h3 className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>
                    Add Core Connector
                  </h3>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    Connect a vector database, auth service, or API engine
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
                  Connector Name <span className="text-[#EF4444]">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Milvus Vector DB / Supabase Auth"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={`w-full px-3.5 py-2.5 border rounded-xl text-sm focus:outline-none focus:border-[#3B82F6] ${inputBg}`}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-muted)' }}>
                  Integration Category
                </label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className={`w-full px-3.5 py-2.5 border rounded-xl text-sm focus:outline-none focus:border-[#3B82F6] ${inputBg}`}
                >
                  <option value="Vector Database">Vector Database (Qdrant/Pinecone/Milvus)</option>
                  <option value="Auth Service">Authentication Provider (Firebase/Auth0)</option>
                  <option value="AI Engine">AI Model Service (Gemini/OpenAI)</option>
                  <option value="Payment Gateway">Payment Gateway (Stripe)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-muted)' }}>
                  Connection Endpoint / Host <span className="text-[#EF4444]">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. localhost:6333 or https://auth.company.local"
                  value={endpointOrUrl}
                  onChange={(e) => setEndpointOrUrl(e.target.value)}
                  className={`w-full px-3.5 py-2.5 border rounded-xl text-sm focus:outline-none focus:border-[#3B82F6] ${inputBg}`}
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
                  className="flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-[#3B82F6] to-[#8B5CF6] hover:opacity-90 shadow-lg shadow-blue-500/20 disabled:opacity-60"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" /> Adding...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-3.5 h-3.5" /> Add Connector
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

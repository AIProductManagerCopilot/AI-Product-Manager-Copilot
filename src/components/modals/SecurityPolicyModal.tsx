import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ShieldCheck, Lock, CheckCircle2, Server, Cpu, FileText } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { settingsService, type SecurityPolicy } from '../../services/settingsService';

interface SecurityPolicyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SecurityPolicyModal: React.FC<SecurityPolicyModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { isDark } = useTheme();
  const [policy, setPolicy] = useState<SecurityPolicy | null>(null);

  useEffect(() => {
    if (isOpen) {
      settingsService.getSecurityPolicy().then(setPolicy);
    }
  }, [isOpen]);

  const modalBg = isDark ? 'bg-[#161B22] border-[#2D3748]' : 'bg-white border-[#E2E8F0]';
  const headerBg = isDark ? 'border-[#1e2530]' : 'border-[#F1F5F9]';
  const footerBg = isDark ? 'border-[#1e2530] bg-[#0D1117]/40' : 'border-[#F1F5F9] bg-[#F8FAFC]';

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
            className={`relative w-full max-w-xl border rounded-2xl shadow-2xl overflow-hidden flex flex-col ${modalBg}`}
          >
            {/* Header */}
            <div className={`flex items-center justify-between px-6 py-4 border-b ${headerBg}`}>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-gradient-to-br from-[#F59E0B] to-[#D97706] shadow-md shadow-amber-500/20">
                  <ShieldCheck className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#F59E0B]">
                    Security & Compliance Policy
                  </h3>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    Cryptographic obfuscation & zero-leakage system metrics specs
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

            {/* Body */}
            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              <div className="p-4 rounded-xl border border-[#F59E0B]/30 bg-[#F59E0B]/5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#F59E0B] uppercase tracking-wider flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5" /> Enforcement Status
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#10B981]/20 text-[#10B981] border border-[#10B981]/30">
                    STRICT COMPLIANT
                  </span>
                </div>
                <p className="text-xs text-[#E2E8F0] leading-relaxed">
                  Centralized environment parameters are parsed via secure configuration loaders. Access keys, authorization headers, and Firebase raw token strings are strictly obfuscated and filtered from system metrics pipelines to prevent cryptographic leakage.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3.5 rounded-xl border border-[#2D3748] bg-[#0D1117]/60 space-y-1">
                  <div className="flex items-center gap-2 text-xs font-bold text-white">
                    <CheckCircle2 className="w-4 h-4 text-[#10B981]" /> SOC2 Type II
                  </div>
                  <p className="text-[11px] text-[#94A3B8]">Audit passed with zero findings in vector database & auth pipeline isolation.</p>
                </div>

                <div className="p-3.5 rounded-xl border border-[#2D3748] bg-[#0D1117]/60 space-y-1">
                  <div className="flex items-center gap-2 text-xs font-bold text-white">
                    <CheckCircle2 className="w-4 h-4 text-[#10B981]" /> GDPR & CCPA
                  </div>
                  <p className="text-[11px] text-[#94A3B8]">Strict data sanitization on feedback vectors and user token payloads.</p>
                </div>
              </div>

              {policy && (
                <div className="space-y-2 pt-2 border-t border-[#2D3748]">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#94A3B8] flex items-center gap-1.5">
                    <Server className="w-3.5 h-3.5 text-[#3B82F6]" /> Active Security Loaders & Audits
                  </h4>
                  <div className="space-y-1.5">
                    {policy.activeEnvironmentLoaders.map((loader) => (
                      <div key={loader} className="flex items-center justify-between text-xs px-3 py-1.5 rounded-lg bg-[#161B22] border border-[#2D3748]">
                        <span className="font-mono text-[#F8FAFC]">{loader}</span>
                        <span className="text-[10px] text-[#10B981] font-semibold">Active</span>
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-[#64748B] pt-2">
                    <span>Policy Version: <strong className="text-white">{policy.policyVersion}</strong></span>
                    <span>Last Audit: <strong className="text-white">{policy.lastAuditTimestamp}</strong></span>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className={`flex items-center justify-end px-6 py-4 border-t ${footerBg}`}>
              <button
                onClick={onClose}
                className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-[#F59E0B] to-[#D97706] hover:opacity-90 shadow-md shadow-amber-500/20"
              >
                Close Policy View
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

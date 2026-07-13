import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Loader2, Trash2 } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

interface DeleteConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  isDeleting?: boolean;
  workspaceName: string;
}

export const DeleteConfirmDialog: React.FC<DeleteConfirmDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  isDeleting = false,
  workspaceName,
}) => {
  const { isDark } = useTheme();

  const modalBg = isDark ? 'bg-[#161B22] border-[#EF4444]/30' : 'bg-white border-[#EF4444]/40';
  const titleColor = isDark ? 'text-white' : 'text-[#0F172A]';
  const descColor = isDark ? 'text-[#94A3B8]' : 'text-[#64748B]';
  const cancelBtnClass = isDark
    ? 'text-[#94A3B8] bg-[#1e2530] border-[#2D3748] hover:text-white hover:border-[#3D4752]'
    : 'text-[#64748B] bg-[#F1F5F9] border-[#E2E8F0] hover:text-[#0F172A] hover:border-[#CBD5E1]';

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={!isDeleting ? onClose : undefined}
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 12 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className={`relative w-full max-w-sm border rounded-2xl shadow-2xl overflow-hidden ${modalBg}`}
          >
            <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-[#EF4444]/70 to-transparent" />

            <div className="p-6 text-center">
              <div className="w-12 h-12 rounded-2xl bg-[#EF4444]/10 border border-[#EF4444]/20 flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="w-6 h-6 text-[#EF4444]" />
              </div>

              <h3 className={`text-base font-bold mb-2 ${titleColor}`}>Delete Workspace?</h3>
              <p className={`text-sm leading-relaxed mb-6 ${descColor}`}>
                Are you sure you want to permanently delete{' '}
                <span className={`font-semibold ${titleColor}`}>"{workspaceName}"</span>?
                This action cannot be undone.
              </p>

              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  disabled={isDeleting}
                  className={`flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold border transition-all ${cancelBtnClass}`}
                >
                  Cancel
                </button>
                <motion.button
                  onClick={onConfirm}
                  disabled={isDeleting}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-white bg-[#EF4444] hover:bg-[#DC2626] shadow-lg shadow-red-500/25 transition-all disabled:opacity-60"
                >
                  {isDeleting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4" />
                      Delete
                    </>
                  )}
                </motion.button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

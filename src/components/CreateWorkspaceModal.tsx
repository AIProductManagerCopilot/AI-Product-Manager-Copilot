import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, Loader2, ChevronDown } from 'lucide-react';
import type { Workspace, WorkspaceFormData } from '../services/workspaceService';
import { useTheme } from '../context/ThemeContext';

// ─── Zod Schema ───────────────────────────────────────────────────────────────

const workspaceSchema = z.object({
  workspaceName: z.string().min(3, 'Name must be at least 3 characters').max(60),
  description: z.string().min(10, 'Description must be at least 10 characters').max(300),
  productType: z.enum([
    'AI Product', 'Web Application', 'Mobile App', 'Healthcare',
    'Finance', 'Education', 'E-Commerce', 'Gaming', 'Travel',
  ]),
  stage: z.enum(['Idea', 'Research', 'Planning', 'Development', 'Testing', 'Production']),
  priority: z.enum(['Low', 'Medium', 'High', 'Critical']),
  businessGoal: z.string().max(150).optional(),
  targetAudience: z.string().max(150).optional(),
  teamSize: z.coerce.number().min(1).max(1000).optional(),
});

type FormValues = z.infer<typeof workspaceSchema>;

// ─── Props ────────────────────────────────────────────────────────────────────

interface CreateWorkspaceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: WorkspaceFormData) => Promise<void>;
  editingWorkspace?: Workspace | null;
  isSubmitting?: boolean;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const SelectField: React.FC<{
  label: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
  [key: string]: unknown;
}> = ({ label, error, required, children, ...rest }) => {
  const { isDark } = useTheme();
  const inputCls = isDark
    ? 'bg-[#0D1117]/80 border-[#2D3748] text-[#F8FAFC]'
    : 'bg-[#F8FAFC] border-[#E2E8F0] text-[#0F172A]';
  return (
  <div className="space-y-1.5">
    <label className="block text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
      {label} {required && <span className="text-[#EF4444]">*</span>}
    </label>
    <div className="relative">
      <select
        className={`w-full appearance-none px-3.5 py-2.5 border rounded-xl text-sm focus:outline-none focus:border-[#3B82F6]/60 focus:ring-2 focus:ring-[#3B82F6]/15 transition-all cursor-pointer ${inputCls}`}
        {...rest}
      >
        {children}
      </select>
      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" style={{ color: 'var(--text-muted)' }} />
    </div>
    {error && <p className="text-xs text-[#EF4444]">{error}</p>}
  </div>
);}

const InputField: React.FC<{
  label: string;
  error?: string;
  required?: boolean;
  multiline?: boolean;
  [key: string]: unknown;
}> = ({ label, error, required, multiline, ...rest }) => {
  const { isDark } = useTheme();
  const inputCls = isDark
    ? 'bg-[#0D1117]/80 border-[#2D3748] text-[#F8FAFC] placeholder-[#64748B]/60'
    : 'bg-[#F8FAFC] border-[#E2E8F0] text-[#0F172A] placeholder-[#94A3B8]';
  const base = `w-full px-3.5 py-2.5 border rounded-xl text-sm focus:outline-none focus:border-[#3B82F6]/60 focus:ring-2 focus:ring-[#3B82F6]/15 transition-all ${inputCls}`;
  return (
  <div className="space-y-1.5">
    <label className="block text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
      {label} {required && <span className="text-[#EF4444]">*</span>}
    </label>
    {multiline ? (
      <textarea rows={3} className={`${base} resize-none`} {...rest as React.TextareaHTMLAttributes<HTMLTextAreaElement>} />
    ) : (
      <input className={base} {...rest as React.InputHTMLAttributes<HTMLInputElement>} />
    )}
    {error && <p className="text-xs text-[#EF4444]">{error}</p>}
  </div>
);}

// ─── Component ────────────────────────────────────────────────────────────────

export const CreateWorkspaceModal: React.FC<CreateWorkspaceModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  editingWorkspace,
  isSubmitting = false,
}) => {
  const isEditing = !!editingWorkspace;
  const { isDark } = useTheme();

  const modalBg     = isDark ? 'bg-[#161B22] border-[#2D3748]' : 'bg-white border-[#E2E8F0]';
  const headerBg    = isDark ? 'border-[#1e2530]' : 'border-[#F1F5F9]';
  const footerBg    = isDark ? 'border-[#1e2530] bg-[#0D1117]/40' : 'border-[#F1F5F9] bg-[#F8FAFC]';
  const cancelClass = isDark
    ? 'text-[#94A3B8] bg-[#1e2530] border-[#2D3748] hover:text-white hover:border-[#3D4752]'
    : 'text-[#64748B] bg-[#F1F5F9] border-[#E2E8F0] hover:text-[#0F172A] hover:border-[#CBD5E1]';

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(workspaceSchema),
    defaultValues: {
      priority: 'Medium',
      stage: 'Idea',
      productType: 'AI Product',
    },
  });

  // Pre-populate form when editing
  useEffect(() => {
    if (editingWorkspace) {
      reset({
        workspaceName: editingWorkspace.workspaceName,
        description: editingWorkspace.description,
        productType: editingWorkspace.productType,
        stage: editingWorkspace.stage,
        priority: editingWorkspace.priority,
        businessGoal: editingWorkspace.businessGoal || '',
        targetAudience: editingWorkspace.targetAudience || '',
        teamSize: editingWorkspace.teamSize,
      });
    } else {
      reset({ priority: 'Medium', stage: 'Idea', productType: 'AI Product' });
    }
  }, [editingWorkspace, reset]);

  const handleFormSubmit = async (values: FormValues) => {
    await onSubmit(values as WorkspaceFormData);
    reset();
  };

  const handleClose = () => {
    if (!isSubmitting) {
      reset();
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className={`relative w-full max-w-2xl border rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col ${modalBg}`}
          >
            {/* Top accent */}
            <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-[#3B82F6] to-transparent" />

            {/* Header */}
            <div className={`flex items-center justify-between px-6 py-5 border-b flex-shrink-0 ${headerBg}`}>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-gradient-to-br from-[#3B82F6] to-[#8B5CF6] shadow-lg shadow-blue-500/20">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h2 className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>
                    {isEditing ? 'Edit Workspace' : 'Create Workspace'}
                  </h2>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    {isEditing
                      ? 'Update your workspace details'
                      : 'Set up your AI product management space'}
                  </p>
                </div>
              </div>
              <button
                onClick={handleClose}
                disabled={isSubmitting}
                className="p-2 rounded-xl text-[#64748B] hover:text-white hover:bg-[#2D3748] transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Form Body - Scrollable */}
            <div className="overflow-y-auto flex-1">
              <form id="workspace-form" onSubmit={handleSubmit(handleFormSubmit)} className="p-6 space-y-5">
                {/* Row 1: Name */}
                <InputField
                  label="Workspace Name"
                  required
                  placeholder="e.g. Project Nexus"
                  error={errors.workspaceName?.message}
                  {...register('workspaceName')}
                />

                {/* Row 2: Description */}
                <InputField
                  label="Description"
                  required
                  multiline
                  placeholder="What is this workspace about? What problem does it solve?"
                  error={errors.description?.message}
                  {...register('description')}
                />

                {/* Row 3: Product Type + Stage */}
                <div className="grid grid-cols-2 gap-4">
                  <SelectField
                    label="Product Type"
                    required
                    error={errors.productType?.message}
                    {...register('productType')}
                  >
                    {['AI Product', 'Web Application', 'Mobile App', 'Healthcare', 'Finance', 'Education', 'E-Commerce', 'Gaming', 'Travel'].map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </SelectField>

                  <SelectField
                    label="Product Stage"
                    required
                    error={errors.stage?.message}
                    {...register('stage')}
                  >
                    {['Idea', 'Research', 'Planning', 'Development', 'Testing', 'Production'].map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </SelectField>
                </div>

                {/* Row 4: Priority + Team Size */}
                <div className="grid grid-cols-2 gap-4">
                  <SelectField
                    label="Priority"
                    error={errors.priority?.message}
                    {...register('priority')}
                  >
                    {['Low', 'Medium', 'High', 'Critical'].map((p) => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </SelectField>

                  <InputField
                    label="Team Size"
                    type="number"
                    placeholder="e.g. 8"
                    min={1}
                    error={errors.teamSize?.message}
                    {...register('teamSize')}
                  />
                </div>

                {/* Row 5: Business Goal */}
                <InputField
                  label="Business Goal"
                  placeholder="e.g. Increase user retention by 20%"
                  error={errors.businessGoal?.message}
                  {...register('businessGoal')}
                />

                {/* Row 6: Target Audience */}
                <InputField
                  label="Target Audience"
                  placeholder="e.g. Enterprise B2B SaaS teams"
                  error={errors.targetAudience?.message}
                  {...register('targetAudience')}
                />
              </form>
            </div>

            {/* Footer */}
            <div className={`flex items-center justify-end gap-3 px-6 py-4 border-t flex-shrink-0 ${footerBg}`}>
              <button
                type="button"
                onClick={handleClose}
                disabled={isSubmitting}
                className={`px-4 py-2.5 rounded-xl text-sm font-semibold border transition-all ${cancelClass}`}
              >
                Cancel
              </button>
              <motion.button
                type="submit"
                form="workspace-form"
                disabled={isSubmitting}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-[#3B82F6] to-[#8B5CF6] hover:opacity-90 shadow-lg shadow-blue-500/25 transition-all disabled:opacity-60"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    {isEditing ? 'Saving...' : 'Creating...'}
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    {isEditing ? 'Save Changes' : 'Create Workspace'}
                  </>
                )}
              </motion.button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

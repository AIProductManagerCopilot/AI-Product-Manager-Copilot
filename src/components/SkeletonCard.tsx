import React from 'react';
import { motion } from 'framer-motion';

export const SkeletonCard: React.FC = () => (
  <div
    className="rounded-2xl p-5 space-y-4 overflow-hidden border"
    style={{
      backgroundColor: 'var(--bg-surface)',
      borderColor: 'var(--border-subtle)',
    }}
  >
    <div className="flex items-start gap-3">
      <div className="w-10 h-10 rounded-xl skeleton-shimmer flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="h-3.5 rounded-lg skeleton-shimmer w-2/3" />
        <div className="h-2.5 rounded-lg skeleton-shimmer w-1/3" />
      </div>
      <div className="w-6 h-6 rounded-lg skeleton-shimmer" />
    </div>
    <div className="space-y-2">
      <div className="h-2.5 rounded skeleton-shimmer" />
      <div className="h-2.5 rounded skeleton-shimmer w-4/5" />
    </div>
    <div className="flex gap-2">
      <div className="h-5 w-16 rounded-full skeleton-shimmer" />
      <div className="h-5 w-12 rounded-full skeleton-shimmer" />
    </div>
    <div className="h-1.5 rounded-full skeleton-shimmer" />
    <div
      className="flex items-center justify-between pt-2 border-t"
      style={{ borderColor: 'var(--border-subtle)' }}
    >
      <div className="w-5 h-5 rounded-full skeleton-shimmer" />
      <div className="flex gap-3">
        <div className="h-3 w-8 rounded skeleton-shimmer" />
        <div className="h-3 w-8 rounded skeleton-shimmer" />
        <div className="h-3 w-12 rounded skeleton-shimmer" />
      </div>
    </div>
  </div>
);

export const WorkspaceGridSkeleton: React.FC = () => (
  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
    {Array.from({ length: 6 }).map((_, i) => (
      <motion.div
        key={i}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: i * 0.05 }}
      >
        <SkeletonCard />
      </motion.div>
    ))}
  </div>
);

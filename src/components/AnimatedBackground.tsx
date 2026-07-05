import React from 'react';
import { motion } from 'framer-motion';

export const AnimatedBackground: React.FC = () => {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0 bg-[#0D1117]">
      {/* Grid Pattern */}
      <div className="absolute inset-0 bg-grid-pattern opacity-30" />

      {/* Top Left Primary Glowing Light Orb */}
      <motion.div
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.35, 0.5, 0.35],
          x: [0, 30, 0],
          y: [0, -20, 0],
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full bg-gradient-to-br from-[#3B82F6]/30 via-[#3B82F6]/10 to-transparent blur-[120px]"
      />

      {/* Bottom Right Secondary Glowing Purple Orb */}
      <motion.div
        animate={{
          scale: [1, 1.25, 1],
          opacity: [0.3, 0.55, 0.3],
          x: [0, -40, 0],
          y: [0, 30, 0],
        }}
        transition={{
          duration: 12,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 2,
        }}
        className="absolute -bottom-40 -right-40 w-[650px] h-[650px] rounded-full bg-gradient-to-tl from-[#8B5CF6]/30 via-[#8B5CF6]/10 to-transparent blur-[130px]"
      />

      {/* Center Ambient Glow */}
      <motion.div
        animate={{
          opacity: [0.15, 0.3, 0.15],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-radial-glow-primary blur-[150px]"
      />

      {/* Floating Micro Particles */}
      {[...Array(6)].map((_, i) => (
        <motion.div
          key={i}
          initial={{
            x: Math.random() * 100 + '%',
            y: Math.random() * 100 + '%',
            scale: Math.random() * 0.5 + 0.5,
          }}
          animate={{
            y: ['-10%', '110%'],
            x: [
              `${Math.random() * 90}%`,
              `${Math.random() * 90}%`,
            ],
          }}
          transition={{
            duration: 15 + i * 4,
            repeat: Infinity,
            ease: 'linear',
            delay: i * 2,
          }}
          className="absolute w-1.5 h-1.5 rounded-full bg-primary/40 blur-[1px]"
        />
      ))}
    </div>
  );
};

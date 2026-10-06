'use client';

import { motion } from 'framer-motion';

export function Brand({ compact = false, className = '' }: { compact?: boolean; className?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: -2 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.97 }}
      className={`relative inline-flex items-center select-none cursor-pointer group ${className}`}
    >
      {/* Soft Ambient Glow Effect */}
      <motion.div
        className="absolute -inset-2 rounded-xl bg-gradient-to-r from-blue-500/15 via-purple-500/15 to-indigo-500/15 opacity-0 blur-lg transition-opacity duration-300 group-hover:opacity-100"
        aria-hidden="true"
      />

      {/* High-Resolution Animated Readly Logo */}
      <motion.img
        src="/readly-logo.png"
        alt="Readly"
        className={`relative object-contain ${
          compact ? 'h-7 w-auto' : 'h-8 sm:h-9 w-auto'
        }`}
        animate={{
          filter: [
            'drop-shadow(0 1px 2px rgba(59, 130, 246, 0.05))',
            'drop-shadow(0 4px 12px rgba(99, 102, 241, 0.25))',
            'drop-shadow(0 1px 2px rgba(59, 130, 246, 0.05))',
          ],
        }}
        transition={{
          duration: 3.5,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />
    </motion.div>
  );
}


import { motion } from "motion/react";

export function PuppyAvatar() {
  return (
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0, opacity: 0 }}
      className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 pointer-events-none"
    >
      <motion.div
        animate={{ y: [0, -10, 0] }}
        transition={{ duration: 0.6, ease: "easeInOut" }}
        className="relative"
      >
        {/* Glow effect */}
        <div className="absolute inset-0 bg-emerald-400 rounded-full blur-3xl opacity-50"></div>
        
        {/* Puppy */}
        <div className="relative bg-white rounded-full p-6 shadow-2xl">
          <div className="text-7xl">🐕</div>
        </div>

        {/* Success message */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="absolute -bottom-12 left-1/2 -translate-x-1/2 whitespace-nowrap bg-gray-900 text-white px-4 py-2 rounded-full text-sm font-medium"
        >
          Great job! 🎉
        </motion.div>
      </motion.div>
    </motion.div>
  );
}

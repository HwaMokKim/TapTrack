import React from 'react';
import { motion } from 'motion/react';
import { X, Sparkles, TrendingUp } from 'lucide-react';
import { UserSettings } from '../types';

interface SavingsMilestoneProps {
  settings: UserSettings;
  type: 'monthly' | 'weekly';
  rolloverAmount: number;
  onClose: () => void;
}

export const SavingsMilestone: React.FC<SavingsMilestoneProps> = ({
  settings, type, rolloverAmount, onClose
}) => {
  const savings = settings.income * settings.savingsRatio;
  const goalName = settings.savingsGoalName;
  const goalAmount = settings.savingsGoalAmount;
  const isWeekly = type === 'weekly';

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-end justify-center"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: '100%', opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: '100%', opacity: 0 }}
        transition={{ type: 'spring', damping: 30, stiffness: 350 }}
        onClick={e => e.stopPropagation()}
        className="w-full bg-white rounded-t-3xl px-6 pt-6 pb-10 relative overflow-hidden"
      >
        {/* Rainbow top bar */}
        <div className={`absolute top-0 left-0 right-0 h-1.5 ${isWeekly
          ? 'bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400'
          : 'bg-gradient-to-r from-orange-400 via-pink-400 to-violet-400'
        }`} />

        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center"
        >
          <X className="w-4 h-4 text-slate-500" />
        </button>

        <div className="flex flex-col items-center text-center space-y-5 pt-2">
          {/* Animated mascot */}
          <motion.div
            animate={{ rotate: [0, -12, 12, -8, 8, 0], scale: [1, 1.12, 1.12, 1, 1] }}
            transition={{ duration: 1.4, repeat: isWeekly ? 1 : 3, repeatDelay: 0.4 }}
            className="text-7xl select-none"
          >
            {isWeekly ? '🐶' : '🎉'}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="space-y-2"
          >
            <div className="flex items-center justify-center gap-2">
              <Sparkles className={`w-4 h-4 ${isWeekly ? 'text-emerald-500' : 'text-orange-400'}`} />
              <span className={`text-xs font-bold uppercase tracking-widest ${isWeekly ? 'text-emerald-600' : 'text-orange-500'}`}>
                {isWeekly ? 'Weekly Win! 🙌' : 'Payday Milestone!'}
              </span>
              <Sparkles className={`w-4 h-4 ${isWeekly ? 'text-emerald-500' : 'text-orange-400'}`} />
            </div>

            {isWeekly ? (
              <>
                <h2 className="text-2xl font-black text-slate-800">
                  You rolled over ${rolloverAmount.toFixed(2)}!
                </h2>
                <p className="text-slate-500 text-sm leading-relaxed max-w-xs">
                  You spent <strong>less</strong> than your daily budget this week. That $
                  {rolloverAmount.toFixed(2)} is now stacked into your savings rollover! 🏦
                </p>
              </>
            ) : (
              <>
                <h2 className="text-2xl font-black text-slate-800">
                  ${savings.toFixed(0)} Saved This Month! 🎉
                </h2>
                <p className="text-slate-500 text-sm leading-relaxed max-w-xs">
                  Your 20% savings just arrived. Plus your weekly rollovers added an extra{' '}
                  <strong className="text-orange-600">${rolloverAmount.toFixed(2)}</strong>!
                </p>

                {/* Running total */}
                <div className="mt-1 flex items-center justify-center gap-2">
                  <TrendingUp className="w-4 h-4 text-emerald-500" />
                  <span className="text-sm font-bold text-emerald-600">
                    Total saved to date: ${(settings.totalSaved).toFixed(2)}
                  </span>
                </div>
              </>
            )}
          </motion.div>

          {/* Savings Goal Progress (only on monthly) */}
          {!isWeekly && goalName && goalAmount > 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.55 }}
              className="w-full bg-orange-50 border border-orange-100 rounded-2xl p-4"
            >
              <p className="text-xs font-semibold text-orange-500 uppercase tracking-wider mb-1">Goal Progress</p>
              <p className="font-bold text-slate-800">{goalName}</p>
              <p className="text-sm text-slate-500 mt-1">
                Only{' '}
                <strong className="text-orange-600">
                  {Math.max(0, Math.ceil((goalAmount - settings.totalSaved) / savings))} more months
                </strong>{' '}
                to go!
              </p>
              <div className="h-2 bg-orange-100 rounded-full mt-3 overflow-hidden">
                <motion.div
                  className="h-full bg-orange-400 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(100, (settings.totalSaved / goalAmount) * 100)}%` }}
                  transition={{ delay: 0.9, type: 'spring', damping: 22 }}
                />
              </div>
              <p className="text-xs text-slate-400 mt-1 text-right">
                ${Math.min(settings.totalSaved, goalAmount).toFixed(0)} / ${goalAmount.toFixed(0)}
              </p>
            </motion.div>
          )}

          <motion.button
            whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
            onClick={onClose}
            className={`w-full font-bold py-4 rounded-2xl text-sm text-white ${
              isWeekly ? 'bg-emerald-500' : 'bg-slate-900'
            }`}
          >
            {isWeekly ? 'Keep Rolling! 🐾' : "I've Got This! Let's keep going! 🐾"}
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
};

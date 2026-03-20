import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Info, Utensils, Coffee, Zap, Car, Bus, Home, ShoppingBag, Flame } from 'lucide-react';
import { Transaction, UserSettings, FIXED_CATEGORIES } from '../types';
import { format, differenceInDays } from 'date-fns';

interface BudgetInfo {
  dailyLimit: number;
  spentToday: number;
  monthlyPool: number;
  monthlyFixed: number;
  monthlySpent: number;
  daysLeftInMonth: number;
}

interface DashboardTabProps {
  settings: UserSettings;
  transactions: Transaction[];
  budgetInfo: BudgetInfo;
  onQuickEntry: () => void;
  onSelectTransaction: (t: Transaction) => void;
  puppyCelebration: boolean;
}

const CATEGORY_ICONS: Record<string, React.ElementType> = {
  Food: Utensils, Coffee, Utility: Zap, Transport: Bus,
  Ride: Car, Shopping: ShoppingBag, Rent: Home, Other: Info,
};
const CATEGORY_COLORS: Record<string, string> = {
  Food: '#f97316', Coffee: '#92400e', Utility: '#8b5cf6', Transport: '#3b82f6',
  Ride: '#06b6d4', Shopping: '#ec4899', Rent: '#14b8a6', Other: '#94a3b8',
};

export const DashboardTab: React.FC<DashboardTabProps> = ({
  settings, transactions, budgetInfo, onQuickEntry, onSelectTransaction, puppyCelebration
}) => {
  const { dailyLimit, spentToday } = budgetInfo;
  const safeToSpendNow = dailyLimit - spentToday;
  const isOverBudget = safeToSpendNow < 0;
  const gaugePercent = Math.max(0, Math.min(100, (safeToSpendNow / Math.max(1, dailyLimit)) * 100));

  // --- Streak / Tracking Days ---
  const trackingDays = settings.trackingStartDate
    ? Math.max(1, differenceInDays(new Date(), new Date(settings.trackingStartDate)) + 1)
    : 0;
  const streak = settings.streakCount || 0;

  const getPuppyMessage = () => {
    if (puppyCelebration) return "Logged! You're on a roll! 🎾";
    if (isOverBudget) return "We'll roll it forward and adjust tomorrow's budget. You've got this! 🐾";
    if (safeToSpendNow < dailyLimit * 0.15) return "Almost at your daily limit — so close to a perfect day! 🦴";
    if (transactions.length === 0) return "Today's a blank canvas. Tap Quick Log and let's start! 🐶";
    if (settings.weeklyRollover > 0) return `You've stashed an extra $${settings.weeklyRollover.toFixed(0)} in savings this week! 🏆`;
    // Show first savings goal if available
    const primaryGoal = settings.savingsGoals?.[0];
    return primaryGoal
      ? `Keep it up! "${primaryGoal.name}" is getting closer. 🎯`
      : settings.savingsGoalName
        ? `Keep it up! "${settings.savingsGoalName}" is getting closer. 🎯`
        : 'Great job staying on track today! 🎾';
  };

  const todayStr = new Date().toISOString().split('T')[0];
  const todaysLogs = transactions.filter(t => t.date.startsWith(todayStr));

  return (
    // Outer wrapper: full screen, flex col
    <div className="flex flex-col bg-white h-full overflow-hidden">

      {/* ── Sticky Header ── */}
      <header className="flex-shrink-0 px-5 pt-5 pb-2 flex justify-between items-center">
        <div className="font-black text-lg tracking-tight text-slate-800">
          Tap<span className="text-orange-500">Track</span>
        </div>
        {/* Streak / Tracking Days Pill */}
        <div className="flex items-center gap-2">
          {streak > 0 && (
            <div className="flex items-center gap-1 bg-orange-50 border border-orange-100 px-2.5 py-1 rounded-full">
              <Flame className="w-3.5 h-3.5 text-orange-500" />
              <span className="text-xs font-bold text-orange-500">{streak}d</span>
            </div>
          )}
          {trackingDays > 0 && (
            <div className="text-[10px] font-semibold text-slate-400 bg-slate-50 border border-slate-100 px-2.5 py-1 rounded-full whitespace-nowrap">
              {trackingDays} {trackingDays === 1 ? 'day' : 'days'} tracked
            </div>
          )}
        </div>
      </header>

      {/* ── Scrollable body ── */}
      <div className="flex-1 overflow-y-auto">

        {/* ════ ABOVE-FOLD HERO ════ */}
        <div className="flex flex-col items-center px-6 text-center"
          style={{ minHeight: 'calc(100dvh - 200px)' }}
        >
          {/* Safe to Spend — vertically centered in upper 2/3 */}
          <div className="flex flex-col items-center justify-center flex-1">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400 mb-3">
              Safe to Spend Today
            </p>

            {/* Big Number */}
            <AnimatePresence mode="wait">
              <motion.p
                key={safeToSpendNow.toFixed(0)}
                initial={{ opacity: 0, scale: 0.88, y: 8 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 1.04 }}
                transition={{ type: 'spring', damping: 20, stiffness: 200 }}
                className={`font-black tabular-nums leading-none ${
                  isOverBudget ? 'text-slate-300' : 'text-slate-900'
                }`}
                style={{ fontSize: 'clamp(64px, 18vw, 96px)' }}
              >
                ${Math.abs(safeToSpendNow).toFixed(2)}
              </motion.p>
            </AnimatePresence>

            {isOverBudget && (
              <p className="text-xs text-slate-400 mt-2">
                Overspent by ${Math.abs(safeToSpendNow).toFixed(2)} — adjusts tomorrow
              </p>
            )}

            {/* Thin gauge line */}
            <div className="w-40 h-1 bg-slate-100 rounded-full overflow-hidden mt-5">
              <motion.div
                className={`h-full rounded-full ${isOverBudget ? 'bg-slate-200' : 'bg-orange-400'}`}
                initial={{ width: 0 }}
                animate={{ width: `${gaugePercent}%` }}
                transition={{ type: 'spring', damping: 22, stiffness: 80 }}
              />
            </div>
            <p className="text-[11px] text-slate-400 mt-2">
              ${spentToday.toFixed(2)} of ${dailyLimit.toFixed(2)} spent
            </p>
          </div>

          {/* ── BOTTOM STACK: Dog → Quick Log Button ── */}
          <div className="w-full flex flex-col items-center gap-3 pb-5">
            {/* Dog motivation */}
            <AnimatePresence mode="wait">
              <motion.div
                key={puppyCelebration ? 'celeb' : getPuppyMessage()}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.35 }}
                className="flex items-center gap-3 w-full max-w-xs bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3"
              >
                <motion.span
                  animate={puppyCelebration
                    ? { rotate: [0, -14, 14, -8, 8, 0], scale: [1, 1.18, 1] }
                    : {}}
                  transition={{ duration: 0.7 }}
                  className="text-3xl select-none flex-shrink-0"
                >
                  🐶
                </motion.span>
                <p className="text-sm text-slate-500 font-medium leading-snug text-left">
                  {getPuppyMessage()}
                </p>
              </motion.div>
            </AnimatePresence>

            {/* Big Quick Log Button */}
            <motion.button
              onClick={onQuickEntry}
              whileTap={{ scale: 0.95 }}
              whileHover={{ scale: 1.02 }}
              className="w-full max-w-xs flex items-center justify-center gap-2 bg-slate-900 text-white font-bold text-base py-4 rounded-2xl shadow-lg"
            >
              <Plus className="w-5 h-5" />
              Quick Log
            </motion.button>
          </div>
        </div>

        {/* ════ BELOW-FOLD: TODAY'S LOGS ════ */}
        <div className="px-5 pb-6 space-y-3">
          <div className="flex items-center gap-3 pt-2">
            <h3 className="text-[11px] font-bold uppercase tracking-widest text-slate-400 whitespace-nowrap">
              Today's Logs
            </h3>
            <div className="flex-1 h-px bg-slate-100" />
            {todaysLogs.length > 0 && (
              <span className="text-[11px] text-slate-400">{todaysLogs.length} entries</span>
            )}
          </div>

          {todaysLogs.length === 0 ? (
            <div className="text-center py-8 text-slate-300 text-sm rounded-2xl border border-dashed border-slate-100">
              <p className="text-2xl mb-1">📝</p>
              Nothing logged yet today!
            </div>
          ) : (
            <div className="space-y-2">
              {todaysLogs.map(t => {
                const Icon = CATEGORY_ICONS[t.category] || Info;
                const color = CATEGORY_COLORS[t.category] || '#94a3b8';
                const effectiveAmount = t.amount / t.splitBy;
                return (
                  <motion.div
                    key={t.id}
                    layout
                    onClick={() => onSelectTransaction(t)}
                    whileTap={{ scale: 0.98 }}
                    className="bg-white border border-slate-100 p-3.5 rounded-2xl shadow-sm flex items-center justify-between cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: color + '18' }}>
                        <Icon className="w-4 h-4" style={{ color }} />
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <p className="font-semibold text-slate-800 text-sm">{t.category}</p>
                          {(FIXED_CATEGORIES.has(t.category) || t.isFixed) && (
                            <span className="text-[9px] bg-violet-100 text-violet-600 font-bold px-1.5 py-0.5 rounded-full">FIXED</span>
                          )}
                        </div>
                        <p className="text-xs text-slate-400 line-clamp-1">
                          {t.description || format(new Date(t.date), 'h:mm a')}
                        </p>
                      </div>
                    </div>
                    <p className="font-bold text-sm text-slate-600 tabular-nums">
                      ${effectiveAmount.toFixed(2)}
                    </p>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

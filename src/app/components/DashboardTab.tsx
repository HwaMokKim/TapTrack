import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Info, Utensils, Coffee, Zap, Car, Bus, Home, ShoppingBag, Flame, ChevronUp, ChevronDown } from 'lucide-react';
import { Transaction, UserSettings, FIXED_CATEGORIES, formatCurrency, getCurrencySymbol } from '../types';
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

  // --- Spotlight Overlay ---
  // Show when there are no transactions and user hasn't dismissed it this session
  const [tourDismissed, setTourDismissed] = useState(false);
  const isTourActive = transactions.length === 0 && !tourDismissed;

  // Auto-dismiss tour once the user logs their first entry
  useEffect(() => {
    if (transactions.length > 0) setTourDismissed(true);
  }, [transactions.length]);

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

      {/* ── Spotlight Overlay ── */}
      <AnimatePresence>
        {isTourActive && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            onClick={() => setTourDismissed(true)}
            className="fixed inset-0 z-40 bg-slate-900/75 backdrop-blur-[2px] flex flex-col items-center justify-end pb-24 pointer-events-auto"
          >
            {/* Text callout above the button */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              onClick={e => e.stopPropagation()}
              className="flex flex-col items-center gap-2 mb-5 pointer-events-none"
            >
              <div className="bg-white rounded-2xl px-6 py-4 shadow-2xl max-w-xs text-center">
                <p className="text-base font-black text-slate-800 mb-1">Log your first expense! 👇</p>
                <p className="text-xs text-slate-500 leading-relaxed">
                  The faster you log, the better your budget stays on track.
                </p>
              </div>
              {/* Animated bouncing arrow */}
              <motion.div
                animate={{ y: [0, 8, 0] }}
                transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
                className="text-2xl select-none"
              >
                ↓
              </motion.div>
            </motion.div>

            {/* Spotlit Quick Log button — sits above the overlay via z-index */}
            <motion.button
              onClick={e => { e.stopPropagation(); onQuickEntry(); }}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: [0.95, 1.02, 1], opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.5, scale: { repeat: Infinity, repeatDelay: 2, duration: 0.9, ease: 'easeInOut' } }}
              className="relative z-50 w-72 flex items-center justify-center gap-2 bg-slate-900 text-white font-bold text-base py-4 rounded-2xl shadow-2xl ring-4 ring-orange-400 ring-offset-4 ring-offset-transparent"
            >
              <Plus className="w-5 h-5" />
              Quick Log
            </motion.button>

            {/* Skip hint */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.5 }}
              className="text-white/40 text-xs mt-5 font-medium pointer-events-none"
            >
              Tap anywhere to dismiss
            </motion.p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Sticky Header ── */}
      <header className="flex-shrink-0 px-5 pt-5 pb-2 flex justify-between items-center relative z-20">
        <div className="font-black text-lg tracking-tight text-slate-800">
          Tap<span className="text-orange-500">Track</span>
        </div>
        {/* Streak Pill */}
        <div className="flex items-center gap-2 relative">
          {streak > 0 && (
            <div className="flex items-center gap-1 bg-orange-50 border border-orange-100 px-2.5 py-1 rounded-full">
              <Flame className="w-3.5 h-3.5 text-orange-500" />
              <span className="text-xs font-bold text-orange-500">{streak}d</span>
            </div>
          )}
        </div>
      </header>

      {/* ── Scrollable body ── */}
      <div className="flex-1 overflow-y-auto">

        {/* ════ ABOVE-FOLD HERO ════ */}
        <div className="flex flex-col items-center px-6 text-center"
          style={{ minHeight: 'calc(100svh - 140px)' }}
        >
          {/* Safe to Spend — vertically centered in upper 2/3 */}
          <div className="flex flex-col items-center justify-center flex-1">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400 mb-3">
              Safe to Spend Today
            </p>

            {/* Big Number — clamp ranges widened for KRW/JPY multi-digit amounts */}
            <AnimatePresence mode="wait">
              <motion.p
                key={safeToSpendNow.toFixed(0)}
                initial={{ opacity: 0, scale: 0.88, y: 8 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 1.04 }}
                transition={{ type: 'spring', damping: 20, stiffness: 200 }}
                className={`font-black tabular-nums leading-none max-w-full overflow-hidden text-ellipsis whitespace-nowrap px-4 ${
                  isOverBudget ? 'text-slate-300' : 'text-slate-900'
                }`}
                style={(() => {
                  const len = formatCurrency(Math.abs(safeToSpendNow), settings.currency).length;
                  if (len > 14) return { fontSize: 'clamp(18px, 6vw, 36px)' };
                  if (len > 12) return { fontSize: 'clamp(22px, 8vw, 44px)' };
                  if (len > 9)  return { fontSize: 'clamp(28px, 10vw, 52px)' };
                  if (len > 6)  return { fontSize: 'clamp(34px, 12vw, 72px)' };
                  return { fontSize: 'clamp(40px, 15vw, 96px)' };
                })()}
              >
                {formatCurrency(Math.abs(safeToSpendNow), settings.currency)}
              </motion.p>
            </AnimatePresence>

            {isOverBudget && (
              <p className="text-xs text-slate-400 mt-2">
                Overspent by {formatCurrency(Math.abs(safeToSpendNow), settings.currency)} — adjusts tomorrow
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
              {formatCurrency(spentToday, settings.currency)} of {formatCurrency(dailyLimit, settings.currency)} spent
            </p>

            {/* ── Oopsie Card: shown when savings has gone negative from bill overages ── */}
            {(settings.totalSaved ?? 0) < 0 && (
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ type: 'spring', damping: 20, stiffness: 200, delay: 0.2 }}
                className="mt-4 w-full max-w-xs bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3 text-left"
              >
                <div className="flex items-start gap-2.5">
                  <span className="text-xl flex-shrink-0 mt-0.5">🐶</span>
                  <div>
                    <p className="text-xs font-bold text-amber-800 leading-snug">
                      Oopsie! Seems like there are some extras from last month. No worries, a little extra saving this month will sort it out!
                    </p>
                    <p className="text-[10px] text-amber-600 font-semibold mt-1.5">
                      Shortfall: {formatCurrency(Math.abs(settings.totalSaved), settings.currency)}
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
          </div>

          {/* ── BOTTOM STACK: Dog → Quick Log Button ── */}
          <div className="w-full flex flex-col items-center gap-3 pb-5 relative">
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
              id="quick-log-btn"
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
            <div className="relative overflow-hidden rounded-2xl">
              {/* Glassmorphism card */}
              <div
                className="rounded-2xl border border-white/60 bg-white/70 backdrop-blur-sm shadow-sm px-6 py-8 flex flex-col items-center text-center"
                style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.85) 0%, rgba(248,250,252,0.9) 100%)' }}
              >
                {/* Animated floating icon */}
                <motion.div
                  animate={{ y: [0, -6, 0] }}
                  transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut' }}
                  className="text-4xl mb-3 select-none"
                >
                  📋
                </motion.div>
                <p className="font-bold text-slate-700 text-sm mb-1">A fresh start.</p>
                <p className="text-xs text-slate-400 leading-relaxed mb-5">
                  Log your first expense to bring your budget to life.
                </p>
                {/* Pulsing CTA chip */}
                <motion.button
                  onClick={onQuickEntry}
                  animate={{ scale: [1, 1.04, 1] }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                  className="flex items-center gap-1.5 bg-slate-900 text-white text-xs font-bold px-4 py-2.5 rounded-full shadow-lg"
                >
                  <Plus className="w-3.5 h-3.5" /> Quick Log
                </motion.button>
              </div>
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
                    <p className={`font-bold text-sm tabular-nums ${t.isIncome ? 'text-emerald-500' : 'text-slate-600'}`}>
                      {t.isIncome ? '+' : ''}{formatCurrency(effectiveAmount, settings.currency)}
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


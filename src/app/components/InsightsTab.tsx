import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { PieChart, Pie, Cell, ResponsiveContainer, Sector } from 'recharts';
import { Coffee, Utensils, Zap, Car, Bus, Home, ShoppingBag, Info, Target, TrendingUp, Gift, X, ChevronRight } from 'lucide-react';
import { Transaction, UserSettings, formatCurrency } from '../types';
import { format, startOfMonth, endOfMonth, isWithinInterval, addMonths, differenceInMonths, parseISO } from 'date-fns';

interface InsightsTabProps {
  transactions: Transaction[];
  settings: UserSettings;
  budgetInfo?: {
    dailyLimit: number; spentToday: number; monthlyPool: number;
    monthlyFixed: number; monthlySpent: number; daysLeftInMonth: number;
  };
  onUpdateSettings: (s: Partial<UserSettings>) => void;
}

const PALETTE = ['#f97316', '#3b82f6', '#10b981', '#8b5cf6', '#ec4899', '#06b6d4', '#f59e0b', '#14b8a6'];
const CATEGORY_ICONS: Record<string, React.ElementType> = {
  Food: Utensils, Coffee, Utility: Zap, Transport: Bus,
  Ride: Car, Shopping: ShoppingBag, Rent: Home, Other: Info,
};
const CATEGORY_EMOJIS: Record<string, string> = {
  Food: '🍱', Coffee: '☕', Utility: '⚡', Transport: '🚌',
  Ride: '🚗', Shopping: '🛍️', Rent: '🏠', Other: '📦',
};

const renderActiveShape = (props: any) => {
  const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill } = props;
  return (
    <g>
      <Sector cx={cx} cy={cy} innerRadius={innerRadius} outerRadius={outerRadius + 10}
        startAngle={startAngle} endAngle={endAngle} fill={fill} />
    </g>
  );
};

function getAvailableMonths(transactions: Transaction[]): Date[] {
  const seen = new Set<string>();
  const months: Date[] = [];
  for (const t of transactions) {
    const d = startOfMonth(new Date(t.date));
    const key = d.toISOString();
    if (!seen.has(key)) { seen.add(key); months.push(d); }
  }
  return months.sort((a, b) => b.getTime() - a.getTime());
}

// ── Savings Goal Progress Card (multi-goal aware) ─────────────────────────────
function GoalProgressCard({ settings }: { settings: UserSettings }) {
  // Prefer the new multi-goal array; fall back to legacy single-goal fields
  let goals = settings.savingsGoals?.length
    ? [...settings.savingsGoals]
    : settings.savingsGoalAmount
      ? [{ id: 'legacy', name: settings.savingsGoalName || 'My Goal', amount: settings.savingsGoalAmount, targetDate: settings.savingsGoalDate, savedSoFar: settings.totalSaved || 0 }]
      : [];

  // Sort logic: Priority ⭐ first, then earliest TargetDate, then Name.
  goals.sort((a, b) => {
    if (a.id === settings.priorityGoalId) return -1;
    if (b.id === settings.priorityGoalId) return 1;
    if (a.targetDate && b.targetDate) {
      return parseISO(a.targetDate).getTime() - parseISO(b.targetDate).getTime();
    }
    if (a.targetDate) return -1;
    if (b.targetDate) return 1;
    return (a.name || '').localeCompare(b.name || '');
  });

  const weeklyRollover = settings.weeklyRollover || 0;
  const savingsMonthly = settings.income * settings.savingsRatio;
  const hasGoals = goals.length > 0;

  const [activeGoalIdx, setActiveGoalIdx] = useState(0);
  const goal = goals[activeGoalIdx] ?? null;

  const totalSaved = goal?.savedSoFar ?? settings.totalSaved ?? 0;
  const goalAmount = goal?.amount ?? 0;
  const goalDate = goal?.targetDate ? parseISO(goal.targetDate) : null;
  const progressPct = goalAmount > 0 ? Math.min(100, (totalSaved / goalAmount) * 100) : 0;

  let etaLine = '';
  if (hasGoals && savingsMonthly > 0 && goal) {
    if (goalDate) {
      const monthsLeft = Math.max(1, differenceInMonths(goalDate, new Date()));
      const needed = goalAmount / monthsLeft;
      etaLine = `Need ${formatCurrency(needed, settings.currency)}/mo to hit ${format(goalDate, 'MMM yyyy')}`;
    } else {
      const monthsNeeded = Math.ceil(Math.max(0, goalAmount - totalSaved) / savingsMonthly);
      etaLine = monthsNeeded <= 0 ? '🎉 Goal reached!' : `~${monthsNeeded} more months at ${formatCurrency(savingsMonthly, settings.currency)}/mo`;
    }
  }

  return (
    <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
      <div className="h-1 bg-gradient-to-r from-orange-400 via-pink-400 to-violet-400" />
      <div className="px-5 py-5">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="flex items-center gap-1.5 mb-0.5">
              {hasGoals ? <Target className="w-4 h-4 text-orange-500" /> : <Gift className="w-4 h-4 text-emerald-500" />}
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                {hasGoals ? 'Savings Goal' : 'Savings Stash'}
              </span>
            </div>
            <p className="font-black text-slate-800 text-lg leading-tight">
              {hasGoals ? (goal?.name || 'My Goal') : 'Extra Saved This Week!'}
            </p>
          </div>
          {goal && goalDate && (
            <span className="text-[11px] font-bold text-orange-500 bg-orange-50 px-2 py-1 rounded-full">
              {format(goalDate, 'MMM yyyy')}
            </span>
          )}
        </div>

        {/* Multi-goal tab pills */}
        {goals.length > 1 && (
          <div className="flex gap-2 mb-4 overflow-x-auto">
            {goals.map((g, i) => (
              <button key={g.id}
                onClick={() => setActiveGoalIdx(i)}
                className={`flex-shrink-0 text-xs font-semibold px-3 py-1 rounded-full transition-all ${
                  i === activeGoalIdx ? 'bg-orange-500 text-white' : 'bg-slate-100 text-slate-500'
                }`}>
                {g.name}
              </button>
            ))}
          </div>
        )}

        {/* Amount row */}
        <div className="flex items-baseline gap-2 mb-3">
          <span className="text-3xl font-black text-slate-800 tabular-nums">
            {formatCurrency(hasGoals ? totalSaved : weeklyRollover, settings.currency)}
          </span>
          {hasGoals && goalAmount > 0 && (
            <span className="text-sm text-slate-400 font-medium">of {formatCurrency(goalAmount, settings.currency)}</span>
          )}
        </div>

        {/* Progress bar or Celebration */}
        {hasGoals && goalAmount > 0 && (
          <div className="mb-3">
            {totalSaved >= goalAmount ? (
              <div className="bg-gradient-to-r from-orange-400 to-pink-500 rounded-xl p-3 text-center text-white shadow-sm mt-1">
                <p className="font-black text-lg">Goal Reached! 🎉</p>
                <p className="text-xs font-semibold opacity-90 block mt-0.5">You successfully saved {formatCurrency(goalAmount, settings.currency)}</p>
              </div>
            ) : (
              <>
                <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full rounded-full bg-gradient-to-r from-orange-400 to-pink-400"
                    initial={{ width: 0 }}
                    animate={{ width: `${progressPct}%` }}
                    transition={{ type: 'spring', damping: 22, stiffness: 80, delay: 0.2 }}
                  />
                </div>
                <div className="flex justify-between mt-1.5">
                  <span className="text-[11px] text-slate-400">{progressPct.toFixed(0)}% there</span>
                  <span className="text-[11px] text-slate-400">{formatCurrency(Math.max(0, goalAmount - totalSaved), settings.currency)} to go</span>
                </div>
              </>
            )}
          </div>
        )}

        {/* Weekly rollover highlight */}
        <AnimatePresence>
          {weeklyRollover > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-2 bg-emerald-50 border border-emerald-100 rounded-xl px-3 py-2.5 mt-2"
            >
              <TrendingUp className="w-4 h-4 text-emerald-500 flex-shrink-0" />
              <div>
                <p className="text-xs font-bold text-emerald-700">+{formatCurrency(weeklyRollover, settings.currency)} rolled in this week! 🐶</p>
                <p className="text-[10px] text-emerald-600">
                  {hasGoals ? 'Daily savings stacked toward your goal' : 'You spent under budget — these are yours to keep!'}
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {etaLine && <p className="text-xs text-slate-400 mt-3">{etaLine}</p>}
      </div>
    </div>
  );
}

// ── Category Bottom Sheet ─────────────────────────────────────────────────────
interface BottomSheetProps {
  category: string;
  color: string;
  total: number;
  pct: string;
  transactions: Transaction[];
  currency: string;
  onClose: () => void;
}
function CategoryBottomSheet({ category, color, total, pct, transactions, currency, onClose }: BottomSheetProps) {
  const Icon = CATEGORY_ICONS[category] || Info;
  const emoji = CATEGORY_EMOJIS[category] || '📦';

  return (
    <motion.div
      className="fixed inset-0 z-50 flex flex-col justify-end"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* backdrop */}
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />

      <motion.div
        className="relative bg-white rounded-t-3xl shadow-2xl max-h-[75vh] flex flex-col"
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
        drag="y"
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={0.4}
        onDragEnd={(e, info) => {
          if (info.offset.y > 100 || info.velocity.y > 500) {
            onClose();
          }
        }}
      >
        {/* drag handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 bg-slate-200 rounded-full" />
        </div>

        {/* Header */}
        <div className="px-5 py-4 flex items-center justify-between border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl flex items-center justify-center" style={{ backgroundColor: color + '22' }}>
              <Icon className="w-5 h-5" style={{ color }} />
            </div>
            <div>
              <p className="font-black text-slate-800 text-lg">{category}</p>
              <p className="text-xs text-slate-400">{pct}% of this month's spending</p>
            </div>
          </div>
          <div className="text-right">
            <p className="font-black text-slate-800 text-xl tabular-nums">{formatCurrency(total, currency)}</p>
            <button onClick={onClose} className="text-slate-300 hover:text-slate-500">
              <X className="w-5 h-5 mt-1" />
            </button>
          </div>
        </div>

        {/* Transaction list */}
        <div className="overflow-y-auto flex-1 px-4 py-3 space-y-2">
          {transactions.length === 0 && (
            <p className="text-center text-slate-400 text-sm py-8">No transactions</p>
          )}
          {transactions.map(t => (
            <div key={t.id} className="bg-slate-50 rounded-2xl px-4 py-3 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-700">{t.description || category}</p>
                <p className="text-xs text-slate-400">{format(new Date(t.date), 'EEE, d MMM · h:mm a')}</p>
              </div>
              <p className={`font-bold tabular-nums text-sm ${t.isIncome ? 'text-emerald-500' : 'text-slate-600'}`}>
                {t.isIncome ? '+' : ''}{formatCurrency(t.amount / t.splitBy, currency)}
              </p>
            </div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── Main Tab ──────────────────────────────────────────────────────────────────
export const InsightsTab: React.FC<InsightsTabProps> = ({ transactions, settings, onUpdateSettings }) => {
  const availableMonths = getAvailableMonths(transactions);
  const [selectedMonthIdx, setSelectedMonthIdx] = useState(0);
  const [activeSlice, setActiveSlice] = useState<number | null>(null);
  const [sheetCategory, setSheetCategory] = useState<string | null>(null);

  // Check for newly completed goals to celebrate globally!
  const celebratingGoal = settings.savingsGoals?.find(g => 
    g.amount > 0 && 
    g.savedSoFar >= g.amount && 
    !(settings.goalsCelebrated || []).includes(g.id)
  );

  const selectedMonth = availableMonths[selectedMonthIdx] ?? startOfMonth(new Date());
  const monthEnd = endOfMonth(selectedMonth);

  const monthlyTransactions = transactions.filter(t =>
    isWithinInterval(new Date(t.date), { start: selectedMonth, end: monthEnd })
  );

  const spendBudget = settings.income * settings.needsRatio;

  const categoryData = monthlyTransactions.reduce((acc, t) => {
    const cat = t.category;
    if (!acc[cat]) acc[cat] = 0;
    acc[cat] += t.amount / t.splitBy;
    return acc;
  }, {} as Record<string, number>);

  const chartData = Object.entries(categoryData)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  const totalSpent = chartData.reduce((s, d) => s + d.value, 0);
  const percentOfBudget = spendBudget > 0 ? (totalSpent / spendBudget) * 100 : 0;
  const activeItem = activeSlice !== null ? chartData[activeSlice] : null;

  const openSheet = (catName: string) => setSheetCategory(catName);
  const closeSheet = () => setSheetCategory(null);

  const sheetData = sheetCategory
    ? { cat: sheetCategory, items: monthlyTransactions.filter(t => t.category === sheetCategory), idx: chartData.findIndex(d => d.name === sheetCategory) }
    : null;

  return (
    <div className="flex flex-col bg-slate-50 min-h-full relative overflow-hidden">
      
      {/* Full-Screen One-Time Celebration Modal */}
      <AnimatePresence>
        {celebratingGoal && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center"
          >
            <motion.div initial={{ scale: 0.8, y: 20 }} animate={{ scale: 1, y: 0 }} transition={{ type: 'spring', damping: 15 }} className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-orange-400 via-pink-500 to-purple-500" />
              <div className="w-20 h-20 mx-auto bg-gradient-to-tr from-orange-100 to-pink-100 rounded-full flex items-center justify-center text-4xl mb-6 shadow-inner">
                🎉
              </div>
              <h2 className="text-2xl font-black text-slate-800 mb-2">Goal Reached!</h2>
              <p className="text-sm text-slate-500 mb-8 leading-relaxed font-medium">
                You successfully saved <strong className="text-slate-800">{formatCurrency(celebratingGoal.amount, settings.currency)}</strong> for your <strong className="text-orange-600">{celebratingGoal.name || 'goal'}</strong>. Incredible effort!
              </p>
              <button 
                onClick={() => {
                  onUpdateSettings({ goalsCelebrated: [...(settings.goalsCelebrated || []), celebratingGoal.id] });
                }} 
                className="w-full py-4 rounded-xl font-bold text-white bg-slate-800 hover:bg-slate-700 shadow-md transition-all active:scale-95"
              >
                Awesome!
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <header className="px-6 pt-6 pb-4 bg-white shadow-sm sticky top-0 z-10">
        <h1 className="font-black text-xl text-slate-800">Insights</h1>
        <p className="text-xs text-slate-400 mt-0.5">Your spending breakdown & savings progress</p>
      </header>

      <div className="px-4 py-5 space-y-5">
        {/* ── Savings Goal Card ── */}
        <GoalProgressCard settings={settings} />

        {/* ── Visual Divider ── */}
        <div className="-mx-4 h-4 bg-slate-100 border-y border-slate-200" />
        
        {/* MONTHLY SPENDING Header */}
        <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest px-1">Monthly Spending</h2>

        {/* Month Selector */}
        {availableMonths.length > 1 && (
          <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
            {availableMonths.map((m, i) => (
              <button key={m.toISOString()}
                onClick={() => { setSelectedMonthIdx(i); setActiveSlice(null); }}
                className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-semibold transition-all ${
                  i === selectedMonthIdx
                    ? 'bg-orange-500 text-white shadow-md'
                    : 'bg-white text-slate-500 border border-slate-200'
                }`}>
                {format(m, 'MMM yyyy')}
              </button>
            ))}
          </div>
        )}

        {chartData.length > 0 ? (
          <>
            {/* Budget Usage Banner */}
            <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Spent of {format(selectedMonth, 'MMMM')} Budget
                </span>
                <span className={`text-xs font-bold ${percentOfBudget > 100 ? 'text-slate-400' : 'text-orange-500'}`}>
                  {percentOfBudget.toFixed(0)}%
                </span>
              </div>
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                <motion.div
                  className={`h-full rounded-full ${percentOfBudget > 100 ? 'bg-slate-300' : 'bg-orange-400'}`}
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(100, percentOfBudget)}%` }}
                  transition={{ type: 'spring', damping: 20, delay: 0.3 }}
                />
              </div>
              <div className="flex justify-between mt-2 text-xs text-slate-400">
                <span>{formatCurrency(totalSpent, settings.currency)} spent</span>
                <span>{formatCurrency(spendBudget, settings.currency)} budget</span>
              </div>
            </div>

            {/* Pie Chart */}
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
              <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4 text-center">
                {format(selectedMonth, 'MMMM yyyy')} Breakdown
              </h3>
              <div className="relative">
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart style={{ outline: 'none' }}>
                    <Pie data={chartData} cx="50%" cy="50%"
                      innerRadius={68} outerRadius={98}
                      paddingAngle={3} dataKey="value"
                      style={{ outline: 'none' }}
                      onClick={(_: any, index: number) => {
                        // Toggle active state, but don't open bottom sheet
                        setActiveSlice(activeSlice === index ? null : index);
                      }}
                      activeIndex={activeSlice !== null ? activeSlice : undefined}
                      activeShape={renderActiveShape}
                      animationBegin={0} animationDuration={800}>
                      {chartData.map((_, index) => (
                        <Cell key={`cell-${index}`}
                          fill={PALETTE[index % PALETTE.length]}
                          style={{ outline: 'none' }}
                          opacity={activeSlice !== null && activeSlice !== index ? 0.4 : 1} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
                  {activeItem ? (
                    <>
                      <p className="text-xl font-black text-slate-800 tabular-nums">{formatCurrency(activeItem.value, settings.currency)}</p>
                      <p className="text-xs text-slate-400">{activeItem.name}</p>
                      <p className="text-xs font-bold text-orange-500">{((activeItem.value / totalSpent) * 100).toFixed(1)}%</p>
                    </>
                  ) : (
                    <>
                      <p className="text-2xl font-black text-slate-800 tabular-nums">{formatCurrency(totalSpent, settings.currency)}</p>
                      <p className="text-xs text-slate-400">Total spent</p>
                    </>
                  )}
                </div>
              </div>
              <p className="text-xs text-center text-slate-400 mt-2">Tap a slice for full details</p>
            </div>

            {/* Category Legend — tapping opens bottom sheet */}
            <div className="space-y-2 pb-6">
              {chartData.map((item, index) => {
                const Icon = CATEGORY_ICONS[item.name] || Info;
                const color = PALETTE[index % PALETTE.length];
                const isActive = activeSlice === index;
                const pct = ((item.value / totalSpent) * 100).toFixed(1);
                return (
                  <motion.button key={item.name}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => { setActiveSlice(isActive ? null : index); openSheet(item.name); }}
                    className={`w-full rounded-2xl px-4 py-3 flex items-center justify-between transition-all ${
                      isActive ? 'bg-slate-900 shadow-lg' : 'bg-white border border-slate-100 shadow-sm'
                    }`}>
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: color + (isActive ? 'ff' : '22') }}>
                        <Icon className="w-4 h-4" style={{ color: isActive ? '#fff' : color }} />
                      </div>
                      <span className={`font-semibold text-sm ${isActive ? 'text-white' : 'text-slate-700'}`}>{item.name}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className={`font-bold text-sm tabular-nums ${isActive ? 'text-white' : 'text-slate-600'}`}>{formatCurrency(item.value, settings.currency)}</p>
                        <p className={`text-xs ${isActive ? 'text-slate-300' : 'text-slate-400'}`}>{pct}%</p>
                      </div>
                      <ChevronRight className={`w-4 h-4 ${isActive ? 'text-slate-400' : 'text-slate-300'}`} />
                    </div>
                  </motion.button>
                );
              })}
            </div>
          </>
        ) : (
          <div className="text-center py-16">
            <div className="text-5xl mb-4">📊</div>
            <p className="font-semibold text-slate-700">No data for this month yet</p>
            <p className="text-sm text-slate-400 mt-1">Log some expenses to see your breakdown</p>
          </div>
        )}
      </div>

      {/* ── Category Bottom Sheet ── */}
      <AnimatePresence>
        {sheetData && (
          <CategoryBottomSheet
            category={sheetData.cat}
            color={PALETTE[sheetData.idx % PALETTE.length]}
            total={categoryData[sheetData.cat] ?? 0}
            pct={((categoryData[sheetData.cat] / totalSpent) * 100).toFixed(1)}
            transactions={sheetData.items}
            currency={settings.currency}
            onClose={closeSheet}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

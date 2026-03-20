import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { PieChart, Pie, Cell, ResponsiveContainer, Sector } from 'recharts';
import { Coffee, Utensils, Zap, Car, Bus, Home, ShoppingBag, Info, Target, TrendingUp, Gift } from 'lucide-react';
import { Transaction, UserSettings } from '../types';
import { format, startOfMonth, endOfMonth, isWithinInterval, addMonths, differenceInMonths, parseISO } from 'date-fns';

interface InsightsTabProps {
  transactions: Transaction[];
  settings: UserSettings;
  budgetInfo?: {
    dailyLimit: number; spentToday: number; monthlyPool: number;
    monthlyFixed: number; monthlySpent: number; daysLeftInMonth: number;
  };
}

const PALETTE = ['#f97316', '#3b82f6', '#10b981', '#8b5cf6', '#ec4899', '#06b6d4', '#f59e0b', '#14b8a6'];
const CATEGORY_ICONS: Record<string, React.ElementType> = {
  Food: Utensils, Coffee, Utility: Zap, Transport: Bus,
  Ride: Car, Shopping: ShoppingBag, Rent: Home, Other: Info,
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

// ── Savings Goal Progress Card ────────────────────────────────────────────────
function GoalProgressCard({ settings }: { settings: UserSettings }) {
  const goalAmount = settings.savingsGoalAmount || 0;
  const goalName = settings.savingsGoalName || '';
  const totalSaved = settings.totalSaved || 0;
  const weeklyRollover = settings.weeklyRollover || 0;
  const savingsMonthly = settings.income * settings.savingsRatio;
  const goalDate = settings.savingsGoalDate ? parseISO(settings.savingsGoalDate) : null;

  const hasGoal = goalAmount > 0;
  const progressPct = hasGoal ? Math.min(100, (totalSaved / goalAmount) * 100) : 0;

  let etaLine = '';
  if (hasGoal && savingsMonthly > 0) {
    if (goalDate) {
      const monthsLeft = Math.max(1, differenceInMonths(goalDate, new Date()));
      const needed = goalAmount / monthsLeft;
      etaLine = `Need $${needed.toFixed(0)}/mo to hit ${format(goalDate, 'MMM yyyy')}`;
    } else {
      const monthsNeeded = Math.ceil(Math.max(0, goalAmount - totalSaved) / savingsMonthly);
      if (monthsNeeded <= 0) {
        etaLine = "🎉 Goal reached!";
      } else {
        etaLine = `~${monthsNeeded} more months at $${savingsMonthly.toFixed(0)}/mo`;
      }
    }
  }

  return (
    <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
      {/* Top accent bar */}
      <div className="h-1 bg-gradient-to-r from-orange-400 via-pink-400 to-violet-400" />

      <div className="px-5 py-5">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="flex items-center gap-1.5 mb-0.5">
              {hasGoal ? <Target className="w-4 h-4 text-orange-500" /> : <Gift className="w-4 h-4 text-emerald-500" />}
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                {hasGoal ? 'Savings Goal' : 'Savings Stash'}
              </span>
            </div>
            <p className="font-black text-slate-800 text-lg leading-tight">
              {hasGoal ? (goalName || 'My Goal') : 'Extra Saved This Week!'}
            </p>
          </div>
          {hasGoal && goalDate && (
            <span className="text-[11px] font-bold text-orange-500 bg-orange-50 px-2 py-1 rounded-full">
              {format(goalDate, 'MMM yyyy')}
            </span>
          )}
        </div>

        {/* Saved amount row */}
        <div className="flex items-baseline gap-2 mb-3">
          <span className="text-3xl font-black text-slate-800 tabular-nums">
            ${(hasGoal ? totalSaved : weeklyRollover).toFixed(2)}
          </span>
          {hasGoal && (
            <span className="text-sm text-slate-400 font-medium">of ${goalAmount.toLocaleString()}</span>
          )}
        </div>

        {/* Progress bar */}
        {hasGoal && (
          <div className="mb-3">
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
              <span className="text-[11px] text-slate-400">${Math.max(0, goalAmount - totalSaved).toFixed(0)} to go</span>
            </div>
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
                <p className="text-xs font-bold text-emerald-700">
                  +${weeklyRollover.toFixed(2)} rolled in this week! 🐶
                </p>
                <p className="text-[10px] text-emerald-600">
                  {hasGoal
                    ? 'Daily savings stacked toward your goal'
                    : 'You spent under budget — these are yours to keep!'}
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ETA line */}
        {etaLine && (
          <p className="text-xs text-slate-400 mt-3">{etaLine}</p>
        )}
      </div>
    </div>
  );
}

// ── Main Tab ──────────────────────────────────────────────────────────────────
export const InsightsTab: React.FC<InsightsTabProps> = ({ transactions, settings }) => {
  const availableMonths = getAvailableMonths(transactions);
  const [selectedMonthIdx, setSelectedMonthIdx] = useState(0);
  const [activeSlice, setActiveSlice] = useState<number | null>(null);

  const selectedMonth = availableMonths[selectedMonthIdx] ?? startOfMonth(new Date());
  const monthEnd = endOfMonth(selectedMonth);

  const monthlyTransactions = transactions.filter(t =>
    isWithinInterval(new Date(t.date), { start: selectedMonth, end: monthEnd })
  );

  // Use the ratio from settings, not hardcoded 0.7
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

  return (
    <div className="flex flex-col bg-slate-50 min-h-full">
      <header className="px-6 pt-6 pb-4 bg-white shadow-sm sticky top-0 z-10">
        <h1 className="font-black text-xl text-slate-800">Insights</h1>
        <p className="text-xs text-slate-400 mt-0.5">Your spending breakdown & savings progress</p>
      </header>

      <div className="px-4 py-5 space-y-5">

        {/* ── Savings Goal Card (always at top) ── */}
        <GoalProgressCard settings={settings} />

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
                <span>${totalSpent.toFixed(2)} spent</span>
                <span>${spendBudget.toFixed(2)} budget</span>
              </div>
            </div>

            {/* Pie Chart */}
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
              <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4 text-center">
                {format(selectedMonth, 'MMMM yyyy')} Breakdown
              </h3>
              <div className="relative">
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie data={chartData} cx="50%" cy="50%"
                      innerRadius={68} outerRadius={98}
                      paddingAngle={3} dataKey="value"
                      onClick={(_: any, index: number) => setActiveSlice(activeSlice === index ? null : index)}
                      activeIndex={activeSlice !== null ? activeSlice : undefined}
                      activeShape={renderActiveShape}
                      animationBegin={0} animationDuration={800}>
                      {chartData.map((_, index) => (
                        <Cell key={`cell-${index}`}
                          fill={PALETTE[index % PALETTE.length]}
                          opacity={activeSlice !== null && activeSlice !== index ? 0.4 : 1} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
                  {activeItem ? (
                    <>
                      <p className="text-xl font-black text-slate-800">${activeItem.value.toFixed(2)}</p>
                      <p className="text-xs text-slate-400">{activeItem.name}</p>
                      <p className="text-xs font-bold text-orange-500">{((activeItem.value / totalSpent) * 100).toFixed(1)}%</p>
                    </>
                  ) : (
                    <>
                      <p className="text-2xl font-black text-slate-800">${totalSpent.toFixed(2)}</p>
                      <p className="text-xs text-slate-400">Total spent</p>
                    </>
                  )}
                </div>
              </div>
              <p className="text-xs text-center text-slate-400 mt-2">Tap a slice to see details</p>
            </div>

            {/* Category Legend */}
            <div className="space-y-2 pb-6">
              {chartData.map((item, index) => {
                const Icon = CATEGORY_ICONS[item.name] || Info;
                const color = PALETTE[index % PALETTE.length];
                const isActive = activeSlice === index;
                const pct = ((item.value / totalSpent) * 100).toFixed(1);
                return (
                  <motion.button key={item.name}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setActiveSlice(isActive ? null : index)}
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
                    <div className="text-right">
                      <p className={`font-bold text-sm tabular-nums ${isActive ? 'text-white' : 'text-slate-600'}`}>${item.value.toFixed(2)}</p>
                      <p className={`text-xs ${isActive ? 'text-slate-300' : 'text-slate-400'}`}>{pct}%</p>
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
    </div>
  );
};

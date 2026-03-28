import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { SetupWizard } from './components/SetupWizard';
import { DashboardTab } from './components/DashboardTab';
import { HistoryTab } from './components/HistoryTab';
import { InsightsTab } from './components/InsightsTab';
import { SettingsTab } from './components/SettingsTab';
import { QuickEntry } from './components/QuickEntry';
import { TransactionModal } from './components/TransactionModal';
import { SavingsMilestone } from './components/SavingsMilestone';
import { Transaction, UserSettings, SavingsGoal, FixedBill, FIXED_CATEGORIES } from './types';
import { LayoutDashboard, History, PieChart, Settings } from 'lucide-react';
import {
  startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  isWithinInterval, differenceInCalendarDays
} from 'date-fns';

type Tab = 'dashboard' | 'history' | 'insights' | 'settings';
type MilestoneType = 'monthly' | 'weekly';

const TABS: { id: Tab; label: string; Icon: React.ElementType }[] = [
  { id: 'dashboard', label: 'Dashboard', Icon: LayoutDashboard },
  { id: 'history',   label: 'History',   Icon: History },
  { id: 'insights',  label: 'Insights',  Icon: PieChart },
  { id: 'settings',  label: 'Settings',  Icon: Settings },
];

const DEFAULT_SETTINGS: UserSettings = {
  income: 0,
  isSavingsAutomated: false,
  isOnboarded: false,
  streakCount: 0,
  lastLogDate: null,
  trackingStartDate: null,
  savingsGoalName: '',
  savingsGoalAmount: 0,
  savingsGoalDate: null,
  savingsGoals: [],
  paydayDay: 1,
  needsRatio: 0.70,
  savingsRatio: 0.20,
  investmentsRatio: 0.10,
  weeklyRollover: 0,
  lastWeeklyReset: null,
  totalSaved: 0,
  currency: 'USD',
  priorityGoalId: null,
  goalsCelebrated: [],
  fixedBills: [],
};

export function distributeSavings(pool: number, goals: SavingsGoal[], priorityId: string | null): SavingsGoal[] {
  let remainingPool = pool;
  const newGoals = goals.map(g => ({ ...g }));

  if (priorityId) {
    const pGoal = newGoals.find(g => g.id === priorityId);
    if (pGoal) {
      const needed = Math.max(0, pGoal.amount - pGoal.savedSoFar);
      const applied = Math.min(remainingPool, needed > 0 ? needed : remainingPool);
      const actualApplied = pGoal.amount > 0 ? applied : remainingPool;
      pGoal.savedSoFar += actualApplied;
      remainingPool -= actualApplied;
    }
  }

  if (remainingPool > 0) {
    const sorted = [...newGoals].sort((a,b) => {
      if (!a.targetDate) return 1;
      if (!b.targetDate) return -1;
      return new Date(a.targetDate).getTime() - new Date(b.targetDate).getTime();
    });
    for (let g of sorted) {
      if (remainingPool <= 0) break;
      const needed = Math.max(0, g.amount - g.savedSoFar);
      if (g.amount > 0 && needed === 0) continue; // Goal is full
      const applied = g.amount > 0 ? Math.min(remainingPool, needed) : remainingPool;
      g.savedSoFar += applied;
      remainingPool -= applied;
      
      const orig = newGoals.find(x => x.id === g.id);
      if (orig) orig.savedSoFar = g.savedSoFar;
    }
  }
  return newGoals;
}

/** Calculates today's safe-to-spend limit, properly separating fixed bills from daily budget */
export function calcDailyBudget(transactions: Transaction[], settings: UserSettings): {
  dailyLimit: number;
  spentToday: number;
  monthlyPool: number;
  monthlyFixed: number;
  monthlySpent: number;
  daysLeftInMonth: number;
} {
  const now = new Date();
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);
  const thisMon = transactions.filter(t =>
    isWithinInterval(new Date(t.date), { start: monthStart, end: monthEnd })
  );

  // Fixed bills come out of the monthly pool but NOT from daily allowance
  const monthlyFixed = thisMon
    .filter(t => (FIXED_CATEGORIES.has(t.category) || t.isFixed) && !t.isIncome)
    .reduce((s, t) => s + t.amount / t.splitBy, 0);

  // Income adds to the monthly pool
  const monthlyIncomeLogs = thisMon
    .filter(t => t.isIncome)
    .reduce((s, t) => s + t.amount / t.splitBy, 0);

  // Pre-set fixed bills (from Settings) are deducted from Day 1
  const presetBillsTotal = (settings.fixedBills ?? []).reduce((s, b) => s + b.preset, 0);

  const monthlyPool = settings.income * settings.needsRatio + monthlyIncomeLogs;
  const daysInMonth = monthEnd.getDate();
  const daysLeft = Math.max(1, daysInMonth - now.getDate() + 1);
  // Subtract both logged fixed bills AND preset fixed bills (avoid double-counting logged ones)
  const totalFixed = Math.max(monthlyFixed, presetBillsTotal);
  const remainingPool = Math.max(0, monthlyPool - totalFixed);
  const dailyLimit = remainingPool / daysLeft;

  // Only daily (non-fixed) spending affects the daily counter
  const spentToday = thisMon
    .filter(t => {
      const d = new Date(t.date);
      return d.toDateString() === now.toDateString() &&
             !FIXED_CATEGORIES.has(t.category) &&
             !t.isFixed &&
             !t.isIncome;
    })
    .reduce((s, t) => s + t.amount / t.splitBy, 0);

  const monthlySpent = thisMon
    .filter(t => !FIXED_CATEGORIES.has(t.category) && !t.isFixed && !t.isIncome)
    .reduce((s, t) => s + t.amount / t.splitBy, 0);

  return { dailyLimit, spentToday, monthlyPool, monthlyFixed, monthlySpent, daysLeftInMonth: daysLeft };
}

export default function App() {
  const [settings, setSettings] = useState<UserSettings>(() => {
    try {
      const saved = localStorage.getItem('taptrack_settings');
      if (saved) return { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
    } catch {}
    return DEFAULT_SETTINGS;
  });

  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    try {
      const saved = localStorage.getItem('taptrack_transactions');
      if (saved) return JSON.parse(saved);
    } catch {}
    // Demo seed data
    const now = new Date();
    const d = (offset: number, h = 12, m = 0) => {
      const date = new Date(now);
      date.setDate(now.getDate() - offset);
      date.setHours(h, m, 0, 0);
      return date.toISOString();
    };
    return [
      { id: '1', amount: 12.50, category: 'Food',      description: 'Lunch at hawker centre', date: d(0, 13), splitBy: 1 },
      { id: '2', amount: 4.00,  category: 'Coffee',    description: 'Kopi from the kopitiam',  date: d(0, 9),  splitBy: 1 },
      { id: '3', amount: 45.00, category: 'Transport', description: 'Grab to office',          date: d(1, 8),  splitBy: 2 },
      { id: '4', amount: 28.00, category: 'Shopping',  description: 'New tee from UNIQLO',     date: d(2, 16), splitBy: 1 },
      { id: '5', amount: 80.00, category: 'Utility',   description: 'Monthly electricity',     date: d(3, 10), splitBy: 1, isFixed: true },
      { id: '6', amount: 15.00, category: 'Food',      description: 'Dinner with friends',     date: d(4, 19), splitBy: 3 },
      { id: '7', amount: 9.90,  category: 'Coffee',    description: 'Iced latte + croissant',  date: d(5, 11), splitBy: 1 },
      { id: '8', amount: 200,   category: 'Shopping',  description: 'Shoes sale haul',         date: d(35, 14), splitBy: 1 },
      { id: '9', amount: 60,    category: 'Food',      description: 'Family dinner',           date: d(38, 19), splitBy: 1 },
      { id: '10', amount: 120,  category: 'Utility',   description: 'Internet + phone bill',   date: d(40, 10), splitBy: 1, isFixed: true },
    ];
  });

  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [prevTab, setPrevTab] = useState<Tab>('dashboard');
  const [isQuickEntryOpen, setIsQuickEntryOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [showMilestone, setShowMilestone] = useState(false);
  const [milestoneType, setMilestoneType] = useState<MilestoneType>('monthly');
  const [milestoneRollover, setMilestoneRollover] = useState(0);
  const [puppyCelebration, setPuppyCelebration] = useState(false);

  // Auto-open Quick Log every time the user opens the app (if onboarded)
  // Also handles the legacy ?log=true URL parameter from shortcuts
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('log') === 'true') {
      window.history.replaceState({}, '', window.location.pathname);
    }
    if (settings.isOnboarded) {
      // Small delay so the dashboard has time to render first
      const t = setTimeout(() => setIsQuickEntryOpen(true), 400);
      return () => clearTimeout(t);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('taptrack_settings', JSON.stringify(settings));
  }, [settings]);
  useEffect(() => {
    localStorage.setItem('taptrack_transactions', JSON.stringify(transactions));
  }, [transactions]);

  // --- Dual-Reward Loop Checks ---
  useEffect(() => {
    if (!settings.isOnboarded) return;
    const now = new Date();
    const today = now.getDate();
    const thisMonthKey = `${now.getFullYear()}-${now.getMonth()}`;

    // 1. MONTHLY MACRO REWARD: trigger on Payday
    const lastMonthlyKey = localStorage.getItem('taptrack_last_celebration');
    if (today === settings.paydayDay && lastMonthlyKey !== thisMonthKey) {
      const savings = settings.income * settings.savingsRatio;
      setTimeout(() => {
        setMilestoneType('monthly');
        setMilestoneRollover(settings.weeklyRollover);
        setShowMilestone(true);
        setSettings(prev => {
          const totalToDistribute = savings + prev.weeklyRollover;
          const updatedGoals = distributeSavings(totalToDistribute, prev.savingsGoals, prev.priorityGoalId);
          return { 
            ...prev, 
            totalSaved: prev.totalSaved + savings, 
            weeklyRollover: 0,
            savingsGoals: updatedGoals 
          };
        });
        localStorage.setItem('taptrack_last_celebration', thisMonthKey);
      }, 800);
    }

    // 2. WEEKLY MICRO REWARD: every Sunday, compute rollover
    const weekStart = startOfWeek(now, { weekStartsOn: 1 });
    const weekKey = weekStart.toISOString().split('T')[0];
    const lastWeeklyReset = settings.lastWeeklyReset;
    if (lastWeeklyReset !== weekKey) {
      // Calculate last week's rollover
      const lastWeekStart = new Date(weekStart);
      lastWeekStart.setDate(lastWeekStart.getDate() - 7);
      const lastWeekEnd = new Date(weekStart);
      lastWeekEnd.setMilliseconds(-1);

      const budget = calcDailyBudget(transactions, settings);
      const weeklyAllowed = budget.dailyLimit * 7;
      const weeklySpent = transactions
        .filter(t => {
          const td = new Date(t.date);
          return td >= lastWeekStart && td < weekStart &&
                 !FIXED_CATEGORIES.has(t.category) && !t.isFixed;
        })
        .reduce((s, t) => s + t.amount / t.splitBy, 0);

      const rollover = Math.max(0, weeklyAllowed - weeklySpent);
      if (rollover > 0 && lastWeeklyReset !== null) {
        setTimeout(() => {
          setMilestoneType('weekly');
          setMilestoneRollover(rollover);
          setShowMilestone(true);
          setSettings(prev => {
            // Actively distribute the weekly rollover into the goals
            const updatedGoals = distributeSavings(rollover, prev.savingsGoals, prev.priorityGoalId);
            return { 
              ...prev, 
              weeklyRollover: prev.weeklyRollover + rollover, 
              lastWeeklyReset: weekKey,
              savingsGoals: updatedGoals
            };
          });
        }, 1200);
      } else {
        setSettings(prev => ({ ...prev, lastWeeklyReset: weekKey }));
      }
    }
  }, [settings.isOnboarded]);

  const handleSetupComplete = (newSettings: Partial<UserSettings>) => {
    const now = new Date().toISOString();
    setSettings(prev => ({ ...prev, ...newSettings, trackingStartDate: prev.trackingStartDate ?? now }));
    // Auto-open quick log after onboarding completes
    setTimeout(() => setIsQuickEntryOpen(true), 600);
  };

  const handleSaveEntry = useCallback((entry: Omit<Transaction, 'id' | 'date'>) => {
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    let newStreak = settings.streakCount;
    if (settings.lastLogDate !== todayStr) {
      if (!settings.lastLogDate) {
        newStreak = 1;
      } else {
        const lastDate = new Date(settings.lastLogDate);
        const diffDays = differenceInCalendarDays(now, lastDate);
        newStreak = diffDays === 1 ? newStreak + 1 : 1;
      }
    }
    setSettings(prev => {
      // Auto-stamp completedAt for goals newly crossing the threshold
      const updatedGoals = (prev.savingsGoals ?? []).map(g => {
        if (g.amount > 0 && g.savedSoFar >= g.amount && !g.completedAt) {
          return { ...g, completedAt: now.toISOString() };
        }
        return g;
      });
      return { ...prev, streakCount: newStreak, lastLogDate: todayStr, savingsGoals: updatedGoals };
    });
    const newTransaction: Transaction = {
      ...entry,
      id: Math.random().toString(36).substr(2, 9),
      date: now.toISOString(),
      isFixed: FIXED_CATEGORIES.has(entry.category),
    };
    setTransactions(prev => [newTransaction, ...prev]);
    setPuppyCelebration(true);
    setTimeout(() => setPuppyCelebration(false), 2200);
  }, [settings]);

  const handleUpdateTransaction = (updated: Transaction) => {
    setTransactions(prev => prev.map(t => t.id === updated.id ? updated : t));
    setSelectedTransaction(null);
  };

  const handleDeleteTransaction = (id: string) => {
    setTransactions(prev => prev.filter(t => t.id !== id));
    setSelectedTransaction(null);
  };

  const handleTabChange = (tab: Tab) => {
    setPrevTab(activeTab);
    setActiveTab(tab);
  };

  if (!settings.isOnboarded) {
    return (
      <div style={{ height: '100svh' }} className="w-full bg-slate-900 flex justify-center sm:py-8">
        <div className="w-full max-w-md bg-slate-50 sm:rounded-3xl sm:shadow-2xl overflow-hidden relative flex flex-col">
          <SetupWizard onComplete={handleSetupComplete} />
        </div>
      </div>
    );
  }

  const tabOrder: Tab[] = ['dashboard', 'history', 'insights', 'settings'];
  const currentIdx = tabOrder.indexOf(activeTab);
  const prevIdx = tabOrder.indexOf(prevTab);
  const direction = currentIdx >= prevIdx ? 1 : -1;

  const budgetInfo = calcDailyBudget(transactions, settings);

  return (
    <div style={{ height: '100svh' }} className="w-full bg-slate-900 flex justify-center sm:py-8">
      {/* Phone shell: strictly 100svh, flex-col, no overflow at this level */}
      <div className="w-full max-w-md bg-slate-50 sm:rounded-3xl sm:shadow-2xl relative flex flex-col overflow-hidden">

        {/* Tab Content — scrollable middle area only */}
        <div className="flex-1 overflow-hidden relative min-h-0">
          <AnimatePresence mode="popLayout" initial={false} custom={direction}>
            <motion.div
              key={activeTab}
              custom={direction}
              variants={{
                enter:  (d: number) => ({ x: d * 40, opacity: 0 }),
                center: { x: 0, opacity: 1 },
                exit:   (d: number) => ({ x: d * -40, opacity: 0 }),
              }}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="absolute inset-0 overflow-y-auto overscroll-contain"
            >
              {activeTab === 'dashboard' && (
                <DashboardTab
                  settings={settings}
                  transactions={transactions}
                  budgetInfo={budgetInfo}
                  onQuickEntry={() => setIsQuickEntryOpen(true)}
                  onSelectTransaction={setSelectedTransaction}
                  puppyCelebration={puppyCelebration}
                />
              )}
              {activeTab === 'history' && (
                <HistoryTab
                  transactions={transactions}
                  settings={settings}
                  onSelectTransaction={setSelectedTransaction}
                />
              )}
              {activeTab === 'insights' && (
                <InsightsTab
                  transactions={transactions}
                  settings={settings}
                  budgetInfo={budgetInfo}
                  onUpdateSettings={(s) => setSettings(prev => ({ ...prev, ...s }))}
                />
              )}
              {activeTab === 'settings' && (
                <SettingsTab
                  settings={settings}
                  transactions={transactions}
                  onUpdateSettings={(s) => setSettings(prev => ({ ...prev, ...s }))}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Bottom Navigation — always visible, safe-area aware */}
        <nav className="flex-shrink-0 relative z-30 bg-white border-t border-slate-100 shadow-lg"
          style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
        >
          <div className="flex items-center">
            {TABS.map(({ id, label, Icon }) => {
              const isActive = activeTab === id;
              return (
                <button
                  key={id}
                  onClick={() => handleTabChange(id)}
                  className="flex-1 flex flex-col items-center justify-center py-3 gap-1 relative transition-colors"
                >
                  {isActive && (
                    <motion.div
                      layoutId="tab-indicator"
                      className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-orange-500 rounded-full"
                      transition={{ type: 'spring', damping: 30, stiffness: 400 }}
                    />
                  )}
                  <motion.div animate={{ scale: isActive ? 1.1 : 1, y: isActive ? -1 : 0 }} transition={{ type: 'spring', stiffness: 400, damping: 25 }}>
                    <Icon className={`w-5 h-5 transition-colors ${isActive ? 'text-orange-500' : 'text-slate-400'}`} />
                  </motion.div>
                  <span className={`text-[10px] font-semibold tracking-wide transition-colors ${isActive ? 'text-orange-500' : 'text-slate-400'}`}>
                    {label}
                  </span>
                </button>
              );
            })}
          </div>
        </nav>

        {/* Quick Entry Overlay */}
        <QuickEntry
          isOpen={isQuickEntryOpen}
          onClose={() => setIsQuickEntryOpen(false)}
          onSave={handleSaveEntry}
          currency={settings.currency}
        />

        {/* Transaction Modal */}
        {selectedTransaction && (
          <TransactionModal
            transaction={selectedTransaction}
            onClose={() => setSelectedTransaction(null)}
            onUpdate={handleUpdateTransaction}
            onDelete={handleDeleteTransaction}
          />
        )}

        {/* Dual-Reward Milestone Overlay */}
        <AnimatePresence>
          {showMilestone && (
            <SavingsMilestone
              settings={settings}
              type={milestoneType}
              rolloverAmount={milestoneRollover}
              onClose={() => setShowMilestone(false)}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

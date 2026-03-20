import React from 'react';
import { motion } from 'motion/react';
import { Flame, Info, Coffee, Utensils, Zap, Car, Bus, Home, ShoppingBag, Plus } from 'lucide-react';
import { Transaction, UserSettings } from '../types';

interface DashboardProps {
  settings: UserSettings;
  transactions: Transaction[];
  onQuickEntry: () => void;
  onSelectTransaction: (t: Transaction) => void;
}

const CATEGORY_ICONS: Record<string, React.ElementType> = {
  Food: Utensils,
  Coffee: Coffee,
  Utility: Zap,
  Transport: Bus,
  Ride: Car,
  Shopping: ShoppingBag,
  Rent: Home,
  Other: Info,
};

export const Dashboard: React.FC<DashboardProps> = ({ settings, transactions, onQuickEntry, onSelectTransaction }) => {
  // Monthly Safe-to-Spend: 70% of income
  const safeMonthly = settings.income * 0.7;
  // Let's assume 30 days a month for simpler division
  const safeDaily = safeMonthly / 30;

  // Filter transactions for today
  const today = new Date().toISOString().split('T')[0];
  const todaysTransactions = transactions.filter(t => t.date.startsWith(today));

  // Spent today (factor in split)
  const spentToday = todaysTransactions.reduce((acc, curr) => acc + (curr.amount / curr.splitBy), 0);
  const safeToSpendNow = safeDaily - spentToday;
  
  const isOverBudget = safeToSpendNow < 0;

  const getPuppyMessage = () => {
    if (isOverBudget) {
      return "We'll adjust tomorrow's budget to reach our goal together! 🐾";
    }
    if (safeToSpendNow < safeDaily * 0.2) {
      return "Getting close to your daily limit! You've got this! 🦴";
    }
    if (transactions.length === 0) {
      return "Ready to log today's wins! Tap the + below. 🐶";
    }
    return "Great job staying on track! 🎾";
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 relative pb-24 text-slate-900">
      {/* Header */}
      <header className="px-6 py-4 flex justify-between items-center bg-white shadow-sm z-10 sticky top-0">
        <div className="font-bold text-xl tracking-tight text-slate-800">TapTrack</div>
        <div className="flex items-center gap-2 bg-orange-100 px-3 py-1.5 rounded-full text-orange-600 font-bold text-sm">
          <Flame className="w-4 h-4" />
          {settings.streakCount} Day Streak
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto px-6 py-8 space-y-8">
        {/* Safe to Spend Hero */}
        <section className="text-center space-y-2">
          <h2 className="text-sm font-medium uppercase tracking-wider text-slate-500">Safe to Spend Today</h2>
          <motion.div 
            key={safeToSpendNow}
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className={`text-6xl font-black tabular-nums transition-colors duration-500 ${isOverBudget ? 'text-slate-400' : 'text-slate-800'}`}
          >
            ${Math.abs(safeToSpendNow).toFixed(2)}
          </motion.div>
          {isOverBudget && (
            <p className="text-sm font-medium text-slate-400">Over spent today</p>
          )}
        </section>

        {/* Puppy Mascot */}
        <motion.section 
          whileHover={{ scale: 1.02 }}
          className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm flex items-start gap-4"
        >
          <div className="text-4xl">🐶</div>
          <div className="bg-slate-100 rounded-2xl rounded-tl-none p-4 flex-1 text-slate-700 text-sm font-medium leading-relaxed">
            {getPuppyMessage()}
          </div>
        </motion.section>

        {/* Recent Transactions */}
        <section className="space-y-4">
          <h3 className="text-lg font-bold text-slate-800 flex items-center justify-between">
            Recent Logs
            <span className="text-sm font-normal text-slate-500">Tap to edit or split</span>
          </h3>
          
          <div className="space-y-3">
            {transactions.length === 0 ? (
              <div className="text-center py-8 text-slate-400 text-sm bg-white rounded-2xl border border-dashed border-slate-200">
                No logs yet. You're doing great!
              </div>
            ) : (
              transactions.map(t => {
                const Icon = CATEGORY_ICONS[t.category] || Info;
                const effectiveAmount = t.amount / t.splitBy;
                return (
                  <motion.div
                    key={t.id}
                    layout
                    onClick={() => onSelectTransaction(t)}
                    className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between cursor-pointer active:scale-95 transition-transform"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center text-slate-600">
                        <Icon className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="font-bold text-slate-800">{t.category}</p>
                        <p className="text-xs text-slate-500 line-clamp-1">
                          {t.description || (t.splitBy > 1 ? `Split by ${t.splitBy}` : new Date(t.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}))}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`font-bold tabular-nums ${isOverBudget ? 'text-slate-500' : 'text-slate-800'}`}>
                        ${effectiveAmount.toFixed(2)}
                      </p>
                      {t.splitBy > 1 && (
                        <p className="text-[10px] text-slate-400">Total: ${t.amount.toFixed(2)}</p>
                      )}
                    </div>
                  </motion.div>
                );
              })
            )}
          </div>
        </section>
      </main>

      {/* FAB Quick Entry */}
      <div className="fixed bottom-8 left-0 right-0 px-6 max-w-md mx-auto z-20">
        <button
          onClick={onQuickEntry}
          className="w-full bg-slate-900 hover:bg-slate-800 text-white rounded-2xl py-4 flex items-center justify-center gap-3 font-bold text-lg shadow-xl shadow-slate-900/20 transition-transform active:scale-95"
        >
          <Plus className="w-6 h-6" />
          Quick Log
        </button>
      </div>
    </div>
  );
};

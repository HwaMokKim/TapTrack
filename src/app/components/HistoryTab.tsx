import React from 'react';
import { motion } from 'motion/react';
import { format, isToday, isYesterday, isSameDay } from 'date-fns';
import { Coffee, Utensils, Zap, Car, Bus, Home, ShoppingBag, Info } from 'lucide-react';
import { Transaction } from '../types';

interface HistoryTabProps {
  transactions: Transaction[];
  onSelectTransaction: (t: Transaction) => void;
}

const CATEGORY_ICONS: Record<string, React.ElementType> = {
  Food: Utensils, Coffee: Coffee, Utility: Zap, Transport: Bus,
  Ride: Car, Shopping: ShoppingBag, Rent: Home, Other: Info,
};

const CATEGORY_COLORS: Record<string, string> = {
  Food: '#f97316', Coffee: '#92400e', Utility: '#8b5cf6', Transport: '#3b82f6',
  Ride: '#06b6d4', Shopping: '#ec4899', Rent: '#14b8a6', Other: '#94a3b8',
};

function getDayLabel(dateStr: string): string {
  const date = new Date(dateStr);
  if (isToday(date)) return 'Today';
  if (isYesterday(date)) return 'Yesterday';
  return format(date, 'EEEE, d MMM');
}

interface DayGroup { label: string; date: Date; transactions: Transaction[]; }
interface MonthGroup { monthLabel: string; days: DayGroup[]; total: number; }

function groupTransactions(transactions: Transaction[]): MonthGroup[] {
  const monthMap = new Map<string, MonthGroup>();
  const sorted = [...transactions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  for (const t of sorted) {
    const date = new Date(t.date);
    const monthKey = format(date, 'MMMM yyyy');
    if (!monthMap.has(monthKey)) {
      monthMap.set(monthKey, { monthLabel: monthKey, days: [], total: 0 });
    }
    const monthGroup = monthMap.get(monthKey)!;
    monthGroup.total += t.amount / t.splitBy;

    let dayGroup = monthGroup.days.find(d => isSameDay(d.date, date));
    if (!dayGroup) {
      dayGroup = { label: getDayLabel(t.date), date, transactions: [] };
      monthGroup.days.push(dayGroup);
    }
    dayGroup.transactions.push(t);
  }

  return Array.from(monthMap.values());
}

export const HistoryTab: React.FC<HistoryTabProps> = ({ transactions, onSelectTransaction }) => {
  const grouped = groupTransactions(transactions);

  return (
    <div className="flex flex-col bg-slate-50 min-h-full">
      <header className="px-6 pt-6 pb-4 bg-white shadow-sm sticky top-0 z-10">
        <h1 className="font-black text-xl text-slate-800">History</h1>
        <p className="text-xs text-slate-400 mt-0.5">All your expense logs</p>
      </header>

      <div className="px-4 py-4 space-y-8">
        {grouped.length === 0 && (
          <div className="text-center py-20 text-slate-400">
            <div className="text-5xl mb-4">📋</div>
            <p className="font-medium">No expenses yet</p>
            <p className="text-sm mt-1">Start logging to see your history</p>
          </div>
        )}

        {grouped.map((monthGroup, mi) => (
          <motion.div
            key={monthGroup.monthLabel}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: mi * 0.05 }}
          >
            {/* Month Header — Hard grouping */}
            <div className="flex items-center justify-between mb-3 px-2">
              <h2 className="text-base font-black text-slate-800">{monthGroup.monthLabel}</h2>
              <span className="text-sm font-semibold text-slate-400">${monthGroup.total.toFixed(2)}</span>
            </div>

            <div className="space-y-4">
              {monthGroup.days.map((dayGroup, di) => (
                <div key={dayGroup.label + di}>
                  {/* Day label — Soft grouping */}
                  <div className="flex items-center gap-3 mb-2 px-1">
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">
                      {dayGroup.label}
                    </span>
                    <div className="flex-1 h-px bg-slate-200/80" />
                  </div>

                  <div className="space-y-2">
                    {dayGroup.transactions.map(t => {
                      const Icon = CATEGORY_ICONS[t.category] || Info;
                      const color = CATEGORY_COLORS[t.category] || '#94a3b8';
                      const effectiveAmount = t.amount / t.splitBy;
                      return (
                        <motion.div
                          key={t.id}
                          whileHover={{ scale: 1.01, x: 2 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => onSelectTransaction(t)}
                          className="bg-white rounded-2xl px-4 py-3.5 flex items-center justify-between cursor-pointer shadow-sm border border-slate-100"
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                              style={{ backgroundColor: color + '22' }}
                            >
                              <Icon className="w-5 h-5" style={{ color }} />
                            </div>
                            <div>
                              <p className="font-semibold text-slate-800 text-sm">{t.category}</p>
                              <p className="text-xs text-slate-400 line-clamp-1">
                                {t.description || format(new Date(t.date), 'h:mm a')}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-slate-600 tabular-nums text-sm">
                              ${effectiveAmount.toFixed(2)}
                            </p>
                            {t.splitBy > 1 && (
                              <p className="text-[10px] text-slate-400">Total ${t.amount.toFixed(2)}</p>
                            )}
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

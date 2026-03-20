import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'motion/react';
import { Download, Target, Lock, ChevronRight, TrendingUp } from 'lucide-react';
import { Transaction, UserSettings } from '../types';
import { format, addMonths, differenceInMonths, parseISO } from 'date-fns';

interface SettingsTabProps {
  settings: UserSettings;
  transactions: Transaction[];
  onUpdateSettings: (s: Partial<UserSettings>) => void;
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function ordinal(n: number): string {
  if (n >= 11 && n <= 13) return `${n}th`;
  switch (n % 10) {
    case 1: return `${n}st`;
    case 2: return `${n}nd`;
    case 3: return `${n}rd`;
    default: return `${n}th`;
  }
}

// ── iOS Scroll Wheel (generic) ────────────────────────────────────────────────
const ITEM_H = 48;
function ScrollWheel({ items, value, onChange }: {
  items: { value: number | string; label: string }[];
  value: number | string;
  onChange: (v: number | string) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<any>(null);
  const idx = items.findIndex(i => i.value === value);

  useEffect(() => {
    const el = containerRef.current;
    if (el) el.scrollTop = Math.max(0, idx) * ITEM_H;
  }, []); // only on mount

  const handleScroll = () => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      const el = containerRef.current;
      if (!el) return;
      const i = Math.round(el.scrollTop / ITEM_H);
      const clamped = Math.min(items.length - 1, Math.max(0, i));
      el.scrollTo({ top: clamped * ITEM_H, behavior: 'smooth' });
      onChange(items[clamped].value);
    }, 120);
  };

  return (
    <div className="relative rounded-2xl overflow-hidden bg-slate-50 border border-slate-200" style={{ width: 80, height: ITEM_H * 3 }}>
      {/* Highlight for selected row (middle row) */}
      <div className="absolute left-0 right-0 bg-orange-50 bg-opacity-50 border-y-2 border-orange-200 pointer-events-none"
        style={{ top: ITEM_H, height: ITEM_H, zIndex: 0 }} />
      {/* Fades */}
      <div className="absolute top-0 left-0 right-0 z-20 pointer-events-none" style={{ height: ITEM_H, background: 'linear-gradient(to bottom, rgb(248,250,252), transparent)' }} />
      <div className="absolute bottom-0 left-0 right-0 z-20 pointer-events-none" style={{ height: ITEM_H, background: 'linear-gradient(to top, rgb(248,250,252), transparent)' }} />
      <div ref={containerRef} onScroll={handleScroll}
        className="h-full overflow-y-scroll" style={{ scrollSnapType: 'y mandatory', WebkitOverflowScrolling: 'touch' }}>
        <div style={{ height: ITEM_H }} />
        {items.map(item => (
          <div key={item.value}
            className={`flex items-center justify-center font-black text-xl z-30 relative transition-colors`}
            style={{ height: ITEM_H, scrollSnapAlign: 'center', color: item.value === value ? '#ea580c' : '#94a3b8' }}>
            {item.label}
          </div>
        ))}
        <div style={{ height: ITEM_H }} />
      </div>
    </div>
  );
}

// ── Apple-Style Goal Date Picker (Month + Year scroll wheels) ─────────────────
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

function GoalDatePicker({ value, onChange }: {
  value: string | null; // ISO date string YYYY-MM-DD or null
  onChange: (v: string | null) => void;
}) {
  const now = new Date();
  const [selMonth, setSelMonth] = useState(() => value ? parseISO(value).getMonth() : now.getMonth());
  const [selYear, setSelYear] = useState(() => value ? parseISO(value).getFullYear() : now.getFullYear());

  const years = Array.from({ length: 10 }, (_, i) => now.getFullYear() + i);
  const monthItems = MONTHS.map((m, i) => ({ value: i, label: m }));
  const yearItems = years.map(y => ({ value: y, label: `${y}` }));

  const handleChange = (month: number, year: number) => {
    const d = new Date(year, month, 1);
    onChange(format(d, 'yyyy-MM-dd'));
  };

  return (
    <div className="flex flex-col gap-2">
      <label className="text-xs font-medium text-slate-500">Target Date <span className="text-slate-300">(optional)</span></label>
      <div className="flex gap-3 items-center">
        <ScrollWheel
          items={monthItems}
          value={selMonth}
          onChange={v => { const m = v as number; setSelMonth(m); handleChange(m, selYear); }}
        />
        <ScrollWheel
          items={yearItems}
          value={selYear}
          onChange={v => { const y = v as number; setSelYear(y); handleChange(selMonth, y); }}
        />
        {value && (
          <button onClick={() => onChange(null)} className="text-xs text-slate-400 hover:text-red-400 transition-colors ml-1">Clear</button>
        )}
      </div>
      {value && (
        <p className="text-xs text-orange-500 font-semibold">Target: {format(parseISO(value), 'MMMM yyyy')}</p>
      )}
    </div>
  );
}

// ── 3-Slider Locking Logic ────────────────────────────────────────────────────
type RatioKey = 'needsRatio' | 'savingsRatio' | 'investmentsRatio';

function clamp(v: number, min = 0, max = 1) { return Math.max(min, Math.min(max, v)); }
function round2(v: number) { return Math.round(v * 100) / 100; }

function RatioSliders({ settings, onUpdateSettings }: {
  settings: UserSettings; onUpdateSettings: (s: Partial<UserSettings>) => void;
}) {
  const [lockOrder, setLockOrder] = useState<RatioKey[]>([]);

  const rows: { key: RatioKey; label: string; emoji: string; accentClass: string; color: string }[] = [
    { key: 'needsRatio',       label: 'Spending',    emoji: '💳', accentClass: 'accent-orange-500', color: 'bg-orange-400' },
    { key: 'savingsRatio',     label: 'Savings',     emoji: '🏦', accentClass: 'accent-emerald-500', color: 'bg-emerald-400' },
    { key: 'investmentsRatio', label: 'Investments', emoji: '📈', accentClass: 'accent-violet-500', color: 'bg-violet-400' },
  ];

  const allKeys: RatioKey[] = ['needsRatio', 'savingsRatio', 'investmentsRatio'];
  const autoKey = lockOrder.length >= 2 ? allKeys.find(k => !lockOrder.includes(k)) : null;

  const handleChange = (key: RatioKey, pct: number) => {
    let newVal = clamp(pct / 100);
    let newLock = [...lockOrder];

    // Touching the 3rd (AUTO) slider resets the batch
    if (newLock.length === 2 && !newLock.includes(key)) {
      newLock = [key];
    } else if (!newLock.includes(key)) {
      newLock.push(key);
    }
    setLockOrder(newLock);

    const otherKeys = allKeys.filter(k => k !== key);

    if (newLock.length >= 2) {
      // 2+ locks: Strongly lock the First lock, adjust the active slider, and throw remaining to the Auto slider.
      const strictlyLockedKey = newLock.find(k => k !== key) || otherKeys[0];
      const autoAdjustKey = allKeys.find(k => k !== key && k !== strictlyLockedKey)!;

      const strictlyLockedVal = settings[strictlyLockedKey];
      
      // Cap newVal so we never exceed 100% total
      newVal = Math.min(newVal, 1 - strictlyLockedVal);
      const remaining = Math.max(0, 1 - newVal - strictlyLockedVal);
      
      onUpdateSettings({ 
        [key]: round2(newVal), 
        [autoAdjustKey]: round2(remaining) 
      });
    } else {
      // 1 lock (first touch): Proportionally split the remaining space between the other two
      const currentRemaining = settings[otherKeys[0]] + settings[otherKeys[1]];
      const targetRemaining = Math.max(0, 1 - newVal);
      
      let val1 = 0, val2 = 0;
      if (currentRemaining === 0) {
         val1 = targetRemaining / 2;
         val2 = targetRemaining / 2;
      } else {
         val1 = (settings[otherKeys[0]] / currentRemaining) * targetRemaining;
         val2 = targetRemaining - val1;
      }
      
      onUpdateSettings({
         [key]: round2(newVal),
         [otherKeys[0]]: round2(val1),
         [otherKeys[1]]: round2(val2)
      });
    }
  };

  return (
    <div className="space-y-5">
      <p className="text-xs text-slate-400 leading-relaxed">
        Slide any two — the third auto-balances. Tap any slider to start a fresh combo.
      </p>
      {rows.map(({ key, label, emoji, accentClass }) => {
        const pct = Math.round(settings[key] * 100);
        const isAuto = key === autoKey;
        const isFirstLock = lockOrder[0] === key;
        const isSecondLock = lockOrder[1] === key;
        
        return (
          <div key={key}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-base">{emoji}</span>
                <span className="text-sm font-semibold text-slate-700">{label}</span>
                {(isFirstLock || isSecondLock) && <Lock className="w-3 h-3 text-slate-400" />}
                {isAuto && (
                  <span className="text-[10px] font-bold bg-violet-100 text-violet-600 px-1.5 py-0.5 rounded-full">AUTO</span>
                )}
              </div>
              <span className="text-sm font-black text-slate-700">{pct}%</span>
            </div>
            <input
              type="range" min={0} max={100} value={pct}
              onChange={e => handleChange(key, parseInt(e.target.value))}
              className={`w-full h-2.5 rounded-full appearance-none disabled:opacity-40 disabled:cursor-default cursor-pointer ${accentClass}`}
              style={{
                background: `linear-gradient(to right, var(--tailwind-${key}-color, ${key === 'needsRatio' ? '#f97316' : key === 'savingsRatio' ? '#10b981' : '#8b5cf6'}) ${pct}%, #f1f5f9 ${pct}%)`
              }}
            />
          </div>
        );
      })}
      {lockOrder.length > 0 && (
        <button onClick={() => setLockOrder([])}
          className="text-[11px] font-semibold text-slate-400 hover:text-orange-400 transition-colors">
          Release Locks
        </button>
      )}
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export const SettingsTab: React.FC<SettingsTabProps> = ({ settings, transactions, onUpdateSettings }) => {
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [isEditingPayday, setIsEditingPayday] = useState(false);
  const [editingGoalId, setEditingGoalId] = useState<string | null>(null);

  const handleExport = () => {
    const headers = ['Date', 'Time', 'Category', 'Amount', 'Split By', 'Effective Amount', 'Is Fixed Bill', 'Description'];
    const rows = transactions.map(t => {
      const d = new Date(t.date);
      return [
        format(d, 'yyyy-MM-dd'), format(d, 'HH:mm:ss'), t.category,
        t.amount.toFixed(2), t.splitBy.toString(),
        (t.amount / t.splitBy).toFixed(2),
        t.isFixed ? 'Yes' : 'No',
        `"${(t.description || '').replace(/"/g, '""')}"`,
      ];
    });
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url;
    a.download = `taptrack_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click(); URL.revokeObjectURL(url);
  };

  const savingsMonthly = settings.income * settings.savingsRatio;
  const goalAmount = settings.savingsGoalAmount || 0;
  const goalDate = settings.savingsGoalDate ? parseISO(settings.savingsGoalDate) : null;

  let goalSummary = '';
  if (goalAmount > 0 && savingsMonthly > 0) {
    if (goalDate) {
      const monthsLeft = Math.max(1, differenceInMonths(goalDate, new Date()));
      const perMonth = goalAmount / monthsLeft;
      goalSummary = `Save $${perMonth.toFixed(0)}/mo to reach "${settings.savingsGoalName || 'goal'}" by ${format(goalDate, 'MMM yyyy')}`;
    } else {
      const months = Math.ceil(goalAmount / savingsMonthly);
      const reachDate = addMonths(new Date(), months);
      goalSummary = `At $${savingsMonthly.toFixed(0)}/mo, you'll reach your goal by ${format(reachDate, 'MMM yyyy')} (${months} months)`;
    }
  }

  return (
    <div className="flex flex-col bg-slate-50 min-h-full">
      <header className="px-6 pt-6 pb-4 bg-white shadow-sm sticky top-0 z-10">
        <h1 className="font-black text-xl text-slate-800">Settings</h1>
        <p className="text-xs text-slate-400 mt-0.5">Manage your TapTrack preferences</p>
      </header>

      <div className="px-4 py-6 space-y-5 pb-12">

        {/* Budget Rules */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
          <div className="px-5 pt-4 pb-3 border-b border-slate-50">
            <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Budget Rules</h2>
          </div>
          <div className="px-5 py-4">
            <RatioSliders settings={settings} onUpdateSettings={onUpdateSettings} />
          </div>
        </div>

        {/* Budget Summary */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
          <div className="px-5 pt-4 pb-3 border-b border-slate-50">
            <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Budget Summary</h2>
          </div>
          <div className="divide-y divide-slate-50">
            {[
              { label: 'Monthly Income', value: `$${settings.income.toLocaleString()}` },
              { label: `Spending (${Math.round(settings.needsRatio * 100)}%)`, value: `$${(settings.income * settings.needsRatio).toFixed(0)}`, sub: `~$${(settings.income * settings.needsRatio / 30).toFixed(2)}/day` },
              { label: `Savings (${Math.round(settings.savingsRatio * 100)}%)`, value: `$${savingsMonthly.toFixed(0)}`, sub: settings.isSavingsAutomated ? 'Auto-saved ✓' : 'Manual' },
              { label: `Investments (${Math.round(settings.investmentsRatio * 100)}%)`, value: `$${(settings.income * settings.investmentsRatio).toFixed(0)}`, sub: 'Long-term' },
            ].map(row => (
              <div key={row.label} className="px-5 py-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-700">{row.label}</p>
                  {row.sub && <p className="text-xs text-slate-400">{row.sub}</p>}
                </div>
                <span className="text-sm font-bold text-slate-800 tabular-nums">{row.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Savings Goals — up to 3 */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
          <div className="px-5 pt-4 pb-3 border-b border-slate-50 flex items-center justify-between">
            <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Savings Goals</h2>
            {(settings.savingsGoals?.length ?? 0) < 3 && (
              <button
                onClick={() => {
                  const newId = Date.now().toString();
                  setEditingGoalId(newId);
                  const newGoal = { id: newId, name: '', amount: 0, targetDate: null, savedSoFar: 0 };
                  onUpdateSettings({ savingsGoals: [...(settings.savingsGoals ?? []), newGoal] });
                }}
                className="text-xs font-bold text-orange-500 bg-orange-50 px-3 py-1 rounded-full"
              >
                + Add Goal
              </button>
            )}
          </div>
          <div className="px-5 py-4 space-y-4">
            {(settings.savingsGoals?.length ?? 0) === 0 && (
              <p className="text-xs text-slate-400 text-center py-2">
                No goals yet. Tap "+ Add Goal" to save for something you love! 🎯
              </p>
            )}
            {(settings.savingsGoals ?? []).map((goal, gi) => {
              const goalDate = goal.targetDate ? parseISO(goal.targetDate) : null;
              const savingsMonthly = settings.income * settings.savingsRatio;
              let goalSummary = '';
              if (goal.amount > 0 && savingsMonthly > 0) {
                if (goalDate) {
                  const monthsLeft = Math.max(1, differenceInMonths(goalDate, new Date()));
                  goalSummary = `Save $${(goal.amount / monthsLeft).toFixed(0)}/mo to reach by ${format(goalDate, 'MMM yyyy')}`;
                } else {
                  const months = Math.ceil(goal.amount / savingsMonthly);
                  goalSummary = `~${months} months at $${savingsMonthly.toFixed(0)}/mo`;
                }
              }

              const isEditing = editingGoalId === goal.id;

              if (!isEditing) {
                return (
                  <div key={goal.id} className="flex items-center justify-between bg-white border border-slate-100 rounded-2xl p-4 shadow-sm">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center text-orange-500">
                        <Target className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="font-bold text-slate-800 text-sm">{goal.name || 'Unnamed Goal'}</p>
                        <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mt-0.5">
                          ${goal.amount.toLocaleString()} {goalDate ? `• ${format(goalDate, 'MMM yyyy')}` : ''}
                        </p>
                      </div>
                    </div>
                    <button onClick={() => setEditingGoalId(goal.id)} className="text-xs font-semibold text-slate-400 hover:text-orange-500 px-2 py-1">
                      Edit
                    </button>
                  </div>
                );
              }

              return (
                <div key={goal.id} className="border border-orange-200 bg-orange-50/30 rounded-2xl p-4 space-y-4 relative">
                  <div className="flex justify-between items-center mb-1">
                    <h3 className="text-xs font-bold text-orange-600 uppercase tracking-wider">Editing Goal</h3>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          onUpdateSettings({ savingsGoals: (settings.savingsGoals ?? []).filter((_, i) => i !== gi) });
                          setEditingGoalId(null);
                        }}
                        className="text-xs font-semibold text-slate-400 hover:text-red-500 bg-white px-2 py-1 rounded-lg border border-slate-100"
                      >Remove</button>
                      <button
                        onClick={() => setEditingGoalId(null)}
                        className="text-xs font-bold text-white bg-orange-500 px-3 py-1 rounded-lg shadow-sm"
                      >Save</button>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-500 block mb-1.5">Goal Name</label>
                    <input type="text" placeholder="e.g. Japan Trip, New MacBook..."
                      value={goal.name}
                      onChange={e => {
                        const updated = [...(settings.savingsGoals ?? [])];
                        updated[gi] = { ...updated[gi], name: e.target.value };
                        onUpdateSettings({ savingsGoals: updated });
                      }}
                      className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 placeholder:text-slate-300 outline-none focus:border-orange-400 shadow-sm" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-500 block mb-1.5">Goal Amount ($)</label>
                    <input type="number" placeholder="0.00"
                      value={goal.amount || ''}
                      onChange={e => {
                        const updated = [...(settings.savingsGoals ?? [])];
                        updated[gi] = { ...updated[gi], amount: parseFloat(e.target.value) || 0 };
                        onUpdateSettings({ savingsGoals: updated });
                      }}
                      className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 placeholder:text-slate-300 outline-none focus:border-orange-400 shadow-sm" />
                  </div>
                  <div className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm">
                    <GoalDatePicker
                      value={goal.targetDate}
                      onChange={v => {
                        const updated = [...(settings.savingsGoals ?? [])];
                        updated[gi] = { ...updated[gi], targetDate: v };
                        onUpdateSettings({ savingsGoals: updated });
                      }}
                    />
                  </div>
                  {goalSummary && (
                    <div className="bg-white rounded-xl p-3 flex items-start gap-2 border border-slate-100">
                      <Target className="w-4 h-4 text-orange-500 flex-shrink-0 mt-0.5" />
                      <p className="text-xs text-slate-600 leading-relaxed font-medium">{goalSummary}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>


        {/* Payday */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
          <div className="px-5 pt-4 pb-3 border-b border-slate-50 flex justify-between items-center">
            <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Payday & Celebrations</h2>
            {isEditingPayday ? (
              <button onClick={() => setIsEditingPayday(false)} className="text-xs font-bold text-orange-500 bg-orange-50 px-3 py-1 rounded-full">Save</button>
            ) : (
              <button onClick={() => setIsEditingPayday(true)} className="text-xs font-semibold text-slate-400 hover:text-slate-600">Edit</button>
            )}
          </div>
          <div className="px-5 py-5">
            {isEditingPayday ? (
              <>
                <p className="text-xs font-medium text-slate-500 mb-4">
                  Drag to select your payday date — we'll celebrate your savings then!
                </p>
                <div className="flex items-center gap-5">
                  <ScrollWheel
                    items={Array.from({ length: 31 }, (_, i) => ({ value: i + 1, label: `${i + 1}` }))}
                    value={settings.paydayDay || 1}
                    onChange={v => onUpdateSettings({ paydayDay: v as number })}
                  />
                  <div>
                    <p className="text-sm text-slate-500">Your payday is the</p>
                    <p className="text-3xl font-black text-orange-500 leading-tight mt-0.5">
                      {ordinal(settings.paydayDay || 1)}
                    </p>
                    <p className="text-xs text-slate-400">of every month</p>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex justify-between items-center bg-orange-50 p-4 rounded-2xl border border-orange-100">
                <div>
                  <p className="text-sm font-semibold text-orange-800">Your payday is the {ordinal(settings.paydayDay || 1)}</p>
                  <p className="text-xs text-orange-600/80">of every month</p>
                </div>
                <div className="text-3xl">🎉</div>
              </div>
            )}
          </div>
        </div>

        {/* Export */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
          <div className="px-5 pt-4 pb-3 border-b border-slate-50">
            <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Data</h2>
          </div>
          <motion.button whileHover={{ x: 2 }} onClick={handleExport}
            className="w-full px-5 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center">
                <Download className="w-4 h-4 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-700">Export to CSV</p>
                <p className="text-xs text-slate-400">Excel-ready format</p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-300" />
          </motion.button>
        </div>

        {/* Reset */}
        {!showResetConfirm ? (
          <button onClick={() => setShowResetConfirm(true)}
            className="w-full text-center text-xs text-slate-300 py-2 hover:text-red-400 transition-colors">
            Reset all data &amp; settings
          </button>
        ) : (
          <div className="bg-red-50 border border-red-100 rounded-2xl p-4 space-y-3">
            <p className="text-sm font-medium text-red-700 text-center">Are you sure? This cannot be undone.</p>
            <div className="flex gap-3">
              <button onClick={() => setShowResetConfirm(false)}
                className="flex-1 bg-white border border-slate-200 rounded-xl py-2 text-sm font-semibold text-slate-600">Cancel</button>
              <button onClick={() => { localStorage.clear(); window.location.reload(); }}
                className="flex-1 bg-red-500 text-white rounded-xl py-2 text-sm font-semibold">Reset</button>
            </div>
          </div>
        )}

        <p className="text-center text-[10px] text-slate-200 pb-2">TapTrack v2.1 🐶</p>
      </div>
    </div>
  );
};

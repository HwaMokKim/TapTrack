import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Download, Target, Lock, ChevronRight, TrendingUp, Archive, RotateCcw, CheckCircle2, Plus, Trash2 } from 'lucide-react';
import { Transaction, UserSettings, FixedBill, formatCurrency } from '../types';
import { format, addMonths, differenceInMonths, parseISO, formatISO } from 'date-fns';

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

// ── Hybrid Slider + Tappable % Input ─────────────────────────────────────────────
function BudgetInputs({ settings, onUpdateSettings, setHasError }: {
  settings: UserSettings; 
  onUpdateSettings: (s: Partial<UserSettings>) => void;
  setHasError: (err: boolean) => void;
}) {
  const [localNeeds, setLocalNeeds] = useState(Math.round(settings.needsRatio * 100));
  const [localSavings, setLocalSavings] = useState(Math.round(settings.savingsRatio * 100));
  const [localInvest, setLocalInvest] = useState(Math.round(settings.investmentsRatio * 100));
  const [editingField, setEditingField] = useState<'needs' | 'savings' | 'invest' | null>(null);
  const [editingVal, setEditingVal] = useState('');
  const editRef = useRef<HTMLInputElement>(null);

  const sum = localNeeds + localSavings + localInvest;
  const hasError = sum !== 100;

  // Auto-adjust: when one slider changes, try to auto-fix the others proportionally
  const handleSlider = (field: 'needs' | 'savings' | 'invest', newVal: number) => {
    const clamp = (v: number) => Math.max(0, Math.min(100, v));
    if (field === 'needs') {
      const diff = newVal - localNeeds;
      const remaining = 100 - newVal;
      const otherSum = localSavings + localInvest;
      if (otherSum > 0) {
        const s = clamp(Math.round(localSavings / otherSum * remaining));
        setLocalSavings(s);
        setLocalInvest(clamp(remaining - s));
      }
      setLocalNeeds(newVal);
    } else if (field === 'savings') {
      const remaining = 100 - newVal;
      const otherSum = localNeeds + localInvest;
      if (otherSum > 0) {
        const n = clamp(Math.round(localNeeds / otherSum * remaining));
        setLocalNeeds(n);
        setLocalInvest(clamp(remaining - n));
      }
      setLocalSavings(newVal);
    } else {
      const remaining = 100 - newVal;
      const otherSum = localNeeds + localSavings;
      if (otherSum > 0) {
        const n = clamp(Math.round(localNeeds / otherSum * remaining));
        setLocalNeeds(n);
        setLocalSavings(clamp(remaining - n));
      }
      setLocalInvest(newVal);
    }
  };

  useEffect(() => {
    const err = sum !== 100;
    setHasError(err);
    if (!err) onUpdateSettings({ needsRatio: localNeeds/100, savingsRatio: localSavings/100, investmentsRatio: localInvest/100 });
  }, [localNeeds, localSavings, localInvest]);

  const startEdit = (field: 'needs' | 'savings' | 'invest', current: number) => {
    setEditingField(field);
    setEditingVal(current.toString());
    setTimeout(() => editRef.current?.select(), 80);
  };

  const commitEdit = () => {
    const val = Math.min(100, Math.max(0, parseInt(editingVal) || 0));
    if (editingField === 'needs') setLocalNeeds(val);
    else if (editingField === 'savings') setLocalSavings(val);
    else if (editingField === 'invest') setLocalInvest(val);
    setEditingField(null);
  };

  const rows: { key: 'needs' | 'savings' | 'invest'; label: string; emoji: string; val: number; color: string; accent: string }[] = [
    { key: 'needs',   label: 'Spending',    emoji: '💳', val: localNeeds,   color: '#f97316', accent: 'accent-orange-500' },
    { key: 'savings', label: 'Savings',     emoji: '🏦', val: localSavings, color: '#10b981', accent: 'accent-emerald-500' },
    { key: 'invest',  label: 'Investments', emoji: '📈', val: localInvest,  color: '#8b5cf6', accent: 'accent-violet-500' },
  ];

  return (
    <div className="space-y-5">
      <p className="text-xs text-slate-400 leading-relaxed">Drag the slider or tap the % to type a value. The others auto-balance.</p>

      {rows.map(row => (
        <div key={row.key}>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="text-base">{row.emoji}</span>
              <span className="text-sm font-semibold text-slate-700">{row.label}</span>
            </div>
            {editingField === row.key ? (
              <div className="flex items-center gap-1">
                <input
                  ref={editRef}
                  type="number"
                  value={editingVal}
                  onChange={e => setEditingVal(e.target.value)}
                  onBlur={commitEdit}
                  onKeyDown={e => { if (e.key === 'Enter') commitEdit(); if (e.key === 'Escape') setEditingField(null); }}
                  className={`w-14 text-right bg-slate-50 border ${hasError ? 'border-red-300' : 'border-orange-300'} rounded-lg px-2 py-1 text-sm font-black outline-none`}
                />
                <span className="text-sm font-bold text-slate-400">%</span>
              </div>
            ) : (
              <button onClick={() => startEdit(row.key, row.val)} className={`text-sm font-black px-2 py-0.5 rounded-lg ${hasError ? 'text-red-500 bg-red-50' : 'text-slate-700 hover:bg-orange-50 hover:text-orange-600'} transition-colors`}>
                {row.val}%
              </button>
            )}
          </div>
          <input
            type="range" min={0} max={100} value={row.val}
            onChange={e => handleSlider(row.key, parseInt(e.target.value))}
            className={`w-full h-2.5 rounded-full appearance-none cursor-pointer ${row.accent}`}
            style={{ background: `linear-gradient(to right, ${row.color} ${row.val}%, #f1f5f9 ${row.val}%)` }}
          />
        </div>
      ))}

      <AnimatePresence>
        {hasError && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
            <p className="text-xs font-bold text-red-500 bg-red-50 px-3 py-2 rounded-lg flex items-center gap-2">
              <span className="text-base">⚠️</span> Total is {sum}% — must equal exactly 100%
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export const SettingsTab: React.FC<SettingsTabProps> = ({ settings, transactions, onUpdateSettings }) => {
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [isEditingPayday, setIsEditingPayday] = useState(false);
  const [isEditingBudget, setIsEditingBudget] = useState(false);
  const [isBudgetInvalid, setIsBudgetInvalid] = useState(false);
  const [editingGoalId, setEditingGoalId] = useState<string | null>(null);
  
  // Prompt State
  const [transferPromptGoalId, setTransferPromptGoalId] = useState<string | null>(null);

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

  const handlePriorityToggle = (goalId: string) => {
    if (settings.priorityGoalId === goalId) {
      // Disable priority
      onUpdateSettings({ priorityGoalId: null });
    } else {
      // Enable priority and conditionally prompt
      onUpdateSettings({ priorityGoalId: goalId });
      if ((settings.totalSaved || 0) > 0) {
        setTransferPromptGoalId(goalId);
      }
    }
  };

  const confirmTransfer = () => {
    if (transferPromptGoalId) {
      const goals = [...(settings.savingsGoals || [])];
      const unallocated = settings.totalSaved; // In TapTrack, totalSaved floats globally for some designs, but we'll add it straight in.
      const targetIdx = goals.findIndex(g => g.id === transferPromptGoalId);
      if (targetIdx >= 0) {
        goals[targetIdx].savedSoFar += unallocated;
        onUpdateSettings({ savingsGoals: goals, totalSaved: 0 });
      }
    }
    setTransferPromptGoalId(null);
  };

  const rejectTransfer = () => {
    setTransferPromptGoalId(null);
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

        {/* Income & Budget Rules */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm relative overflow-hidden">
          <div className="px-5 pt-4 pb-3 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
            <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Income & Budget</h2>
            <button 
              onClick={() => setIsEditingBudget(!isEditingBudget)}
              disabled={isEditingBudget && isBudgetInvalid}
              className={`text-xs font-bold px-3 py-1 rounded-full transition-colors ${
                isEditingBudget && isBudgetInvalid ? 'bg-slate-200 text-slate-400 cursor-not-allowed' :
                isEditingBudget ? 'bg-orange-500 text-white shadow-sm' : 'bg-orange-50 text-orange-500 hover:bg-orange-100'
              }`}
            >
              {isEditingBudget ? 'Save' : 'Edit'}
            </button>
          </div>
          
          {isEditingBudget ? (
            <div className="px-5 py-5 space-y-6">
              {/* Income and Currency Edit */}
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="text-xs font-medium text-slate-500 block mb-1.5">Monthly Income</label>
                  <input type="text" 
                    value={settings.income ? settings.income.toLocaleString() : ''}
                    onChange={e => {
                      const raw = parseFloat(e.target.value.replace(/,/g, ''));
                      onUpdateSettings({ income: isNaN(raw) ? 0 : raw });
                    }}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-800 outline-none focus:border-orange-400 focus:bg-white transition-all" />
                </div>
                <div className="w-28 flex-shrink-0">
                  <label className="text-xs font-medium text-slate-500 block mb-1.5">Currency</label>
                  <select 
                    value={settings.currency || 'USD'}
                    onChange={e => onUpdateSettings({ currency: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-3 text-sm font-bold text-slate-800 outline-none focus:border-orange-400 focus:bg-white transition-all appearance-none cursor-pointer"
                  >
                    <option value="USD">USD ($)</option>
                    <option value="SGD">SGD ($)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="GBP">GBP (£)</option>
                    <option value="KRW">KRW (₩)</option>
                    <option value="JPY">JPY (¥)</option>
                  </select>
                </div>
              </div>

              {/* Budget Rules */}
              <div>
                <BudgetInputs settings={settings} onUpdateSettings={onUpdateSettings} setHasError={setIsBudgetInvalid} />
              </div>
            </div>
          ) : (
            <div className="divide-y divide-slate-50">
              {[
                { label: 'Monthly Income', value: formatCurrency(settings.income, settings.currency) },
                { label: `Spending (${Math.round(settings.needsRatio * 100)}%)`, value: formatCurrency(settings.income * settings.needsRatio, settings.currency), sub: `~${formatCurrency(settings.income * settings.needsRatio / 30, settings.currency)}/day` },
                { label: `Savings (${Math.round(settings.savingsRatio * 100)}%)`, value: formatCurrency(savingsMonthly, settings.currency), sub: settings.isSavingsAutomated ? 'Auto-saved ✓' : 'Manual' },
                { label: `Investments (${Math.round(settings.investmentsRatio * 100)}%)`, value: formatCurrency(settings.income * settings.investmentsRatio, settings.currency), sub: 'Long-term' },
              ].map(row => (
                <div key={row.label} className="px-5 py-3 flex items-center justify-between hover:bg-slate-50/50 transition-colors">
                  <div>
                    <p className="text-sm font-medium text-slate-700">{row.label}</p>
                    {row.sub && <p className="text-xs text-slate-400">{row.sub}</p>}
                  </div>
                  <span className="text-sm font-bold text-slate-800 tabular-nums">{row.value}</span>
                </div>
              ))}
            </div>
          )}
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
                  const newGoal = { id: newId, name: '', amount: 0, targetDate: null, savedSoFar: 0, completedAt: null, archivedAt: null };
                  onUpdateSettings({ savingsGoals: [...(settings.savingsGoals ?? []), newGoal] });
                }}
                className="text-xs font-bold text-orange-500 bg-orange-50 px-3 py-1 rounded-full"
              >
                + Add Goal
              </button>
            )}
          </div>
          <div className="px-5 py-4 space-y-4">
            {/* Only show non-archived active goals here */}
            {(settings.savingsGoals?.length ?? 0) === 0 && (
              <p className="text-xs text-slate-400 text-center py-2">
                No goals yet. Tap "+ Add Goal" to save for something you love! 🎯
              </p>
            )}
            {(settings.savingsGoals ?? [])
              .map((goal, index) => ({ goal, originalIndex: index }))
              .sort((a, b) => {
                if (a.goal.id === settings.priorityGoalId) return -1;
                if (b.goal.id === settings.priorityGoalId) return 1;
                if (a.goal.targetDate && b.goal.targetDate) {
                  return parseISO(a.goal.targetDate).getTime() - parseISO(b.goal.targetDate).getTime();
                }
                if (a.goal.targetDate) return -1;
                if (b.goal.targetDate) return 1;
                return (a.goal.name || '').localeCompare(b.goal.name || '');
              })
              .map(({ goal, originalIndex: gi }) => {
              const goalDate = goal.targetDate ? parseISO(goal.targetDate) : null;
              const savingsMonthly = settings.income * settings.savingsRatio;
              let goalSummary = '';
              if (goal.amount > 0 && savingsMonthly > 0) {
                if (goalDate) {
                  const monthsLeft = Math.max(1, differenceInMonths(goalDate, new Date()));
                  goalSummary = `Save ${formatCurrency(goal.amount / monthsLeft, settings.currency)}/mo to reach by ${format(goalDate, 'MMM yyyy')}`;
                } else {
                  const months = Math.ceil(goal.amount / savingsMonthly);
                  goalSummary = `~${months} months at ${formatCurrency(savingsMonthly, settings.currency)}/mo`;
                }
              }

              const isEditing = editingGoalId === goal.id;
              const isCompleted = goal.amount > 0 && goal.savedSoFar >= goal.amount;
              const isArchived = !!goal.archivedAt;

              if (isArchived) return null; // archived goals hidden from main list

              if (!isEditing) {
                const isPriority = settings.priorityGoalId === goal.id;
                return (
                  <div key={goal.id} className={`bg-white border rounded-2xl p-4 transition-all relative ${
                    isCompleted ? 'border-emerald-300 shadow-md ring-2 ring-emerald-50' :
                    isPriority ? 'border-orange-400 shadow-md ring-2 ring-orange-50' :
                    'border-slate-100 shadow-sm'
                  }`}>
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                          isCompleted ? 'bg-emerald-500 text-white shadow-sm' :
                          isPriority ? 'bg-orange-500 text-white shadow-sm' : 'bg-orange-50 text-orange-500'
                        }`}>
                          {isCompleted ? <CheckCircle2 className="w-5 h-5" /> : <Target className="w-5 h-5" />}
                        </div>
                        <div className="flex-1 mt-0.5">
                          <div className="flex items-center gap-2">
                            <p className="font-bold text-slate-800 text-sm">{goal.name || 'Unnamed Goal'}</p>
                            {isCompleted && (
                              <span className="text-[10px] font-black text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded-full">✅ Completed</span>
                            )}
                          </div>
                          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide mt-1">
                            {formatCurrency(goal.savedSoFar, settings.currency)} / {formatCurrency(goal.amount, settings.currency)}
                            {goalDate ? ` • ${format(goalDate, 'MMM yyyy')}` : ''}
                          </p>
                          {isCompleted && goal.completedAt && (
                            <p className="text-[10px] text-emerald-500 font-semibold mt-0.5">Reached {format(parseISO(goal.completedAt), 'MMM d, yyyy')} 🎉</p>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                        {!isCompleted && (
                          <button onClick={() => setEditingGoalId(goal.id)} className="text-xs font-semibold text-slate-400 hover:text-orange-500 px-3 py-1.5 bg-slate-50 hover:bg-orange-50 rounded-lg transition-colors">
                            Edit
                          </button>
                        )}
                        {isCompleted ? (
                          <>
                            <button
                              onClick={() => {
                                const updated = [...(settings.savingsGoals ?? [])];
                                updated[gi] = { ...updated[gi], savedSoFar: 0, completedAt: null };
                                onUpdateSettings({ savingsGoals: updated });
                              }}
                              className="flex items-center gap-1 text-[10px] px-2 py-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 transition-colors"
                            >
                              <RotateCcw className="w-3 h-3" /> Restart
                            </button>
                            <button
                              onClick={() => {
                                const updated = [...(settings.savingsGoals ?? [])];
                                updated[gi] = { ...updated[gi], archivedAt: formatISO(new Date()) };
                                onUpdateSettings({ savingsGoals: updated });
                              }}
                              className="flex items-center gap-1 text-[10px] px-2 py-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 transition-colors"
                            >
                              <Archive className="w-3 h-3" /> Archive
                            </button>
                          </>
                        ) : (
                          <button 
                            onClick={() => handlePriorityToggle(goal.id)}
                            className={`text-[10px] px-2 py-1.5 rounded-lg transition-colors border ${
                              isPriority ? 'border-orange-200 text-orange-600 bg-orange-50 font-bold' : 'border-transparent text-slate-400 hover:bg-slate-50'
                            }`}
                          >
                            {isPriority ? '⭐ Priority' : '☆ Make Priority'}
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Mini progress bar */}
                    {!isCompleted && goal.amount > 0 && (
                      <div className="mt-3">
                        <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-orange-400 to-pink-400 rounded-full transition-all"
                            style={{ width: `${Math.min(100, (goal.savedSoFar / goal.amount) * 100).toFixed(1)}%` }}
                          />
                        </div>
                        <p className="text-[10px] text-slate-400 mt-1 text-right">{Math.min(100, (goal.savedSoFar / goal.amount) * 100).toFixed(0)}%</p>
                      </div>
                    )}
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
                    <label className="text-xs font-medium text-slate-500 block mb-1.5">Goal Amount</label>
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
            {/* Archived Goals Toggle */}
            {(settings.savingsGoals ?? []).some(g => g.archivedAt) && (
              <button
                onClick={() => onUpdateSettings({ _showArchived: !((settings as any)._showArchived) } as any)}
                className="w-full text-xs text-slate-400 hover:text-slate-600 py-1 text-left flex items-center gap-1"
              >
                <Archive className="w-3 h-3" />
                {(settings as any)._showArchived ? 'Hide' : 'Show'} archived goals
              </button>
            )}
            {(settings as any)._showArchived && (settings.savingsGoals ?? []).filter(g => g.archivedAt).map(goal => (
              <div key={goal.id} className="flex items-center justify-between px-4 py-3 bg-slate-50 rounded-xl border border-slate-100 opacity-60">
                <div>
                  <p className="text-sm font-semibold text-slate-600">{goal.name || 'Unnamed Goal'}</p>
                  <p className="text-xs text-slate-400">{formatCurrency(goal.amount, settings.currency)} • Archived {goal.archivedAt ? format(parseISO(goal.archivedAt), 'MMM yyyy') : ''}</p>
                </div>
                <button
                  onClick={() => {
                    const updated = (settings.savingsGoals ?? []).filter(g => g.id !== goal.id);
                    onUpdateSettings({ savingsGoals: updated });
                  }}
                  className="p-1.5 text-slate-300 hover:text-red-400 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Monthly Fixed Bills */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
          <div className="px-5 pt-4 pb-3 border-b border-slate-50 flex items-center justify-between">
            <div>
              <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Monthly Fixed Bills</h2>
              <p className="text-[10px] text-slate-300 mt-0.5">Pre-set bills are deducted from Day 1 of each month</p>
            </div>
            <button
              onClick={() => {
                const newBill: FixedBill = { id: Date.now().toString(), name: '', emoji: '💸', preset: 0 };
                onUpdateSettings({ fixedBills: [...(settings.fixedBills ?? []), newBill] });
              }}
              className="text-xs font-bold text-orange-500 bg-orange-50 px-3 py-1 rounded-full"
            >
              + Add Bill
            </button>
          </div>
          <div className="px-5 py-4 space-y-3">
            {(settings.fixedBills?.length ?? 0) === 0 && (
              <p className="text-xs text-slate-400 text-center py-2">No preset bills yet. Add recurring expenses like rent or utilities.</p>
            )}
            {(settings.fixedBills ?? []).map((bill, bi) => (
              <div key={bill.id} className="flex items-center gap-3 bg-slate-50 rounded-xl p-3 border border-slate-100">
                <input
                  type="text"
                  value={bill.emoji}
                  onChange={e => {
                    const updated = [...(settings.fixedBills ?? [])];
                    updated[bi] = { ...updated[bi], emoji: e.target.value };
                    onUpdateSettings({ fixedBills: updated });
                  }}
                  className="w-10 h-10 text-center text-xl bg-white rounded-xl border border-slate-200 outline-none flex-shrink-0"
                  maxLength={2}
                />
                <input
                  type="text"
                  placeholder="Bill name (e.g. Rent)"
                  value={bill.name}
                  onChange={e => {
                    const updated = [...(settings.fixedBills ?? [])];
                    updated[bi] = { ...updated[bi], name: e.target.value };
                    onUpdateSettings({ fixedBills: updated });
                  }}
                  className="flex-1 bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm font-semibold text-slate-800 outline-none focus:border-orange-400"
                />
                <div className="relative w-28 flex-shrink-0">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">{settings.currency}</span>
                  <input
                    type="number"
                    placeholder="0"
                    value={bill.preset || ''}
                    onChange={e => {
                      const updated = [...(settings.fixedBills ?? [])];
                      updated[bi] = { ...updated[bi], preset: parseFloat(e.target.value) || 0 };
                      onUpdateSettings({ fixedBills: updated });
                    }}
                    className="w-full bg-white border border-slate-200 rounded-xl pl-10 pr-3 py-2 text-sm font-bold text-slate-800 outline-none focus:border-orange-400 text-right"
                  />
                </div>
                <button
                  onClick={() => {
                    onUpdateSettings({ fixedBills: (settings.fixedBills ?? []).filter((_, i) => i !== bi) });
                  }}
                  className="p-1.5 text-slate-300 hover:text-red-400 transition-colors flex-shrink-0"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
            {(settings.fixedBills?.length ?? 0) > 0 && (
              <div className="bg-orange-50 rounded-xl px-4 py-3 border border-orange-100">
                <p className="text-xs font-bold text-orange-700">Total preset: {formatCurrency((settings.fixedBills ?? []).reduce((s, b) => s + b.preset, 0), settings.currency)}/mo</p>
                <p className="text-[10px] text-orange-500 mt-0.5">This is deducted before your daily budget is calculated each month.</p>
              </div>
            )}
          </div>
        </div>
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

        <p className="text-center text-[10px] text-slate-200 pb-2">TapTrack v2.5 🐶</p>
      </div>

      {/* Priority Transfer Modal */}
      <AnimatePresence>
        {transferPromptGoalId && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl p-6 shadow-2xl max-w-sm w-full"
            >
              <div className="w-12 h-12 bg-orange-100 rounded-2xl flex items-center justify-center mb-4 text-2xl text-orange-500">⭐</div>
              <h3 className="text-xl font-black text-slate-800 mb-2">Priority Goal Set!</h3>
              <p className="text-sm text-slate-500 mb-6 leading-relaxed">
                You currently have <strong className="text-orange-600">{formatCurrency(settings.totalSaved, settings.currency)}</strong> in generic savings. Would you like to transfer this directly into your new priority goal?
              </p>
              <div className="flex gap-3">
                <button onClick={rejectTransfer} className="flex-1 py-3 rounded-xl font-bold text-slate-500 bg-slate-50 hover:bg-slate-100 transition-colors">
                  Keep separate
                </button>
                <button onClick={confirmTransfer} className="flex-1 py-3 rounded-xl font-bold text-white bg-orange-500 hover:bg-orange-600 shadow-sm transition-colors">
                  Transfer it
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

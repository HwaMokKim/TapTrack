import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Wallet, PieChart, ChevronRight, Plus, Trash2,
  Smartphone, Apple, Zap
} from 'lucide-react';
import { UserSettings, FixedBill, formatCurrency } from '../types';

interface SetupWizardProps {
  onComplete: (settings: Partial<UserSettings>, initialBills: FixedBill[]) => void;
}

// ── Detect iOS vs Android ──────────────────────────────────────────────────────
function detectOS(): 'ios' | 'android' | 'other' {
  const ua = navigator.userAgent;
  if (/iphone|ipad|ipod/i.test(ua)) return 'ios';
  if (/android/i.test(ua)) return 'android';
  return 'other';
}

// ── Currency list ──────────────────────────────────────────────────────────────
const CURRENCIES = [
  { code: 'USD', label: 'USD ($)' },
  { code: 'SGD', label: 'SGD ($)' },
  { code: 'EUR', label: 'EUR (€)' },
  { code: 'GBP', label: 'GBP (£)' },
  { code: 'KRW', label: 'KRW (₩)' },
  { code: 'JPY', label: 'JPY (¥)' },
  { code: 'MYR', label: 'MYR (RM)' },
  { code: 'THB', label: 'THB (฿)' },
];

// ── Bill emoji suggestions ────────────────────────────────────────────────────
const BILL_PRESETS = [
  { emoji: '🏠', name: 'Rent' },
  { emoji: '⚡', name: 'Electricity' },
  { emoji: '💧', name: 'Water' },
  { emoji: '📱', name: 'Phone' },
  { emoji: '🌐', name: 'Internet' },
  { emoji: '🛡️', name: 'Insurance' },
];

// ── Step indicator ─────────────────────────────────────────────────────────────
const STEP_LABELS = ['Income', 'Split', 'Bills', 'Quick Access', 'Done'];

const StepDots: React.FC<{ current: number; total: number }> = ({ current, total }) => (
  <div className="flex gap-1.5 justify-center mb-6">
    {Array.from({ length: total }).map((_, i) => (
      <motion.div
        key={i}
        animate={{ width: i === current - 1 ? 24 : 8, opacity: i < current ? 1 : 0.3 }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        className={`h-2 rounded-full ${i < current ? 'bg-orange-500' : 'bg-slate-200'}`}
      />
    ))}
  </div>
);

// ── Main Component ─────────────────────────────────────────────────────────────
export const SetupWizard: React.FC<SetupWizardProps> = ({ onComplete }) => {
  const [step, setStep] = useState(1);
  const [direction, setDirection] = useState(1);

  // Step 1
  const [income, setIncome] = useState('');
  const [currency, setCurrency] = useState('USD');

  // Step 2
  const [useRecommended, setUseRecommended] = useState<boolean | null>(null);
  const [needsRatio, setNeedsRatio] = useState(0.70);
  const [savingsRatio, setSavingsRatio] = useState(0.20);
  const [investRatio, setInvestRatio] = useState(0.10);

  // Step 3
  const [bills, setBills] = useState<FixedBill[]>([]);
  const [editingBillIdx, setEditingBillIdx] = useState<number | null>(null);

  // OS detection for Step 4
  const os = detectOS();

  const incomeNum = parseFloat(income.replace(/,/g, '')) || 0;
  const spendingPool = incomeNum * needsRatio;
  const billsTotal = bills.reduce((s, b) => s + b.preset, 0);
  const dailyLimit = Math.max(0, (spendingPool - billsTotal) / 30);

  const goNext = (n: number) => { setDirection(1); setStep(n); };
  const goBack = (n: number) => { setDirection(-1); setStep(n); };

  const handleFinish = () => {
    onComplete(
      {
        income: incomeNum,
        currency,
        needsRatio,
        savingsRatio,
        investmentsRatio: investRatio,
        isOnboarded: true,
        isSavingsAutomated: false,
        fixedBills: bills,
      },
      bills
    );
  };

  // ── Variants ──────────────────────────────────────────────────────────────
  const variants = {
    enter:  (d: number) => ({ opacity: 0, x: d * 40 }),
    center: { opacity: 1, x: 0 },
    exit:   (d: number) => ({ opacity: 0, x: d * -40 }),
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 overflow-hidden">
      {/* Progress */}
      <div className="pt-10 px-6 flex-shrink-0">
        <StepDots current={step} total={5} />
      </div>

      {/* Sliding content */}
      <div className="flex-1 overflow-y-auto px-6 pb-6">
        <AnimatePresence mode="popLayout" initial={false} custom={direction}>
          <motion.div
            key={step}
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ type: 'spring', damping: 28, stiffness: 280 }}
            className="w-full space-y-6"
          >

            {/* ── STEP 1: Income & Currency ── */}
            {step === 1 && (
              <div className="space-y-6">
                <div className="text-center space-y-2 pt-2">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-orange-100 text-orange-500 mb-2">
                    <Wallet className="w-8 h-8" />
                  </div>
                  <h1 className="text-2xl font-black tracking-tight text-slate-800">Welcome to TapTrack</h1>
                  <p className="text-slate-500 text-sm">Let's find out how much you earn so we can calculate your safe-to-spend limit.</p>
                </div>

                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Monthly Income</label>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={income}
                      onChange={e => {
                        const raw = e.target.value.replace(/[^0-9.]/g, '');
                        setIncome(raw);
                      }}
                      placeholder="e.g. 5,000"
                      className="w-full text-4xl font-black text-center border-b-2 border-slate-200 focus:border-orange-500 focus:outline-none py-3 bg-transparent transition-colors text-slate-800"
                      autoFocus
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Currency</label>
                    <div className="grid grid-cols-4 gap-2">
                      {CURRENCIES.map(c => (
                        <button
                          key={c.code}
                          onClick={() => setCurrency(c.code)}
                          className={`py-2 px-1 rounded-xl text-xs font-bold transition-all ${
                            currency === c.code
                              ? 'bg-orange-500 text-white shadow-md scale-105'
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }`}
                        >
                          {c.code}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {incomeNum > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-orange-50 border border-orange-100 rounded-2xl p-4 text-center"
                  >
                    <p className="text-xs text-orange-600 font-semibold">Your monthly income</p>
                    <p className="text-2xl font-black text-orange-500">{formatCurrency(incomeNum, currency)}</p>
                  </motion.div>
                )}

                <button
                  onClick={() => goNext(2)}
                  disabled={!incomeNum}
                  className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-orange-200"
                >
                  Next <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            )}

            {/* ── STEP 2: The Split ── */}
            {step === 2 && (
              <div className="space-y-5">
                <div className="text-center space-y-2 pt-2">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 text-blue-500 mb-2">
                    <PieChart className="w-8 h-8" />
                  </div>
                  <h2 className="text-2xl font-black tracking-tight text-slate-800">Split Your Income</h2>
                  <p className="text-slate-500 text-sm">How do you want to divide your {formatCurrency(incomeNum, currency)} / month?</p>
                </div>

                {/* Option A: Recommended 70/20/10 */}
                <motion.button
                  whileTap={{ scale: 0.98 }}
                  onClick={() => { setUseRecommended(true); setNeedsRatio(0.70); setSavingsRatio(0.20); setInvestRatio(0.10); }}
                  className={`w-full text-left rounded-2xl border-2 p-5 transition-all ${
                    useRecommended === true
                      ? 'border-orange-400 bg-orange-50 shadow-md'
                      : 'border-slate-200 bg-white'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <span className="text-2xl mt-0.5">⭐</span>
                    <div className="flex-1">
                      <p className="font-black text-slate-800">Recommended: 70 / 20 / 10</p>
                      <p className="text-xs text-slate-500 mt-1">The classic rule. Proven to build wealth without feeling restricted.</p>
                      <div className="mt-3 space-y-1.5">
                        {[
                          { label: '💳 Spending & Needs', pct: 0.70, color: 'bg-orange-400' },
                          { label: '🏦 Savings', pct: 0.20, color: 'bg-emerald-400' },
                          { label: '📈 Investments', pct: 0.10, color: 'bg-violet-400' },
                        ].map(row => (
                          <div key={row.label} className="flex items-center gap-2">
                            <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                              <div className={`h-full ${row.color} rounded-full`} style={{ width: `${row.pct * 100}%` }} />
                            </div>
                            <span className="text-xs font-bold text-slate-600 w-28 text-right">{row.label}</span>
                            <span className="text-xs font-black text-slate-800 w-16 text-right">{formatCurrency(incomeNum * row.pct, currency)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </motion.button>

                {/* Option B: All into Spending */}
                <motion.button
                  whileTap={{ scale: 0.98 }}
                  onClick={() => { setUseRecommended(false); setNeedsRatio(1.0); setSavingsRatio(0); setInvestRatio(0); }}
                  className={`w-full text-left rounded-2xl border-2 p-5 transition-all ${
                    useRecommended === false
                      ? 'border-slate-700 bg-slate-800 shadow-md'
                      : 'border-slate-200 bg-white'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <span className="text-2xl mt-0.5">💸</span>
                    <div>
                      <p className={`font-black ${useRecommended === false ? 'text-white' : 'text-slate-800'}`}>All into Spending (100%)</p>
                      <p className={`text-xs mt-1 ${useRecommended === false ? 'text-slate-300' : 'text-slate-500'}`}>
                        I manage my own savings. Track everything I spend.
                      </p>
                    </div>
                  </div>
                </motion.button>

                <div className="flex gap-3">
                  <button
                    onClick={() => goBack(1)}
                    className="flex-shrink-0 bg-slate-100 text-slate-600 font-semibold px-5 py-4 rounded-2xl text-sm"
                  >
                    Back
                  </button>
                  <button
                    onClick={() => goNext(3)}
                    disabled={useRecommended === null}
                    className="flex-1 bg-orange-500 hover:bg-orange-600 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-orange-200"
                  >
                    Next <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
            )}

            {/* ── STEP 3: Fixed Bills ── */}
            {step === 3 && (
              <div className="space-y-5">
                <div className="text-center space-y-2 pt-2">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-violet-100 text-violet-500 mb-2">
                    <Zap className="w-8 h-8" />
                  </div>
                  <h2 className="text-2xl font-black tracking-tight text-slate-800">Fixed Bills</h2>
                  <p className="text-slate-500 text-sm">These will be deducted immediately from your spending pool. Skip if you have none.</p>
                </div>

                {/* Live deduction visual */}
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Spending Pool</span>
                    <span className="text-xs font-bold text-slate-500">{formatCurrency(spendingPool, currency)}</span>
                  </div>
                  {/* Visual bar */}
                  <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden mb-3">
                    <motion.div
                      animate={{ width: `${Math.max(0, Math.min(100, ((spendingPool - billsTotal) / spendingPool) * 100))}%` }}
                      transition={{ type: 'spring', damping: 20, stiffness: 120 }}
                      className="h-full bg-orange-400 rounded-full"
                    />
                  </div>
                  {bills.length > 0 && (
                    <div className="flex justify-between items-center text-xs mb-1">
                      <span className="text-violet-500 font-semibold">− Bills: {formatCurrency(billsTotal, currency)}</span>
                      <span className="text-orange-600 font-black">Left: {formatCurrency(Math.max(0, spendingPool - billsTotal), currency)}</span>
                    </div>
                  )}
                  <div className="text-center mt-2 pt-2 border-t border-slate-50">
                    <p className="text-[11px] text-slate-400 font-medium">Estimated daily limit</p>
                    <motion.p
                      key={dailyLimit.toFixed(0)}
                      initial={{ scale: 0.85, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="text-2xl font-black text-slate-800"
                    >
                      {formatCurrency(dailyLimit, currency)}<span className="text-sm font-semibold text-slate-400">/day</span>
                    </motion.p>
                  </div>
                </div>

                {/* Quick-add preset bill chips */}
                <div className="flex flex-wrap gap-2">
                  {BILL_PRESETS.map(p => (
                    <button
                      key={p.name}
                      onClick={() => {
                        const newBill: FixedBill = { id: Date.now().toString(), name: p.name, emoji: p.emoji, preset: 0 };
                        setBills(prev => [...prev, newBill]);
                        setEditingBillIdx(bills.length);
                      }}
                      className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-full px-3 py-1.5 text-xs font-semibold text-slate-600 hover:border-orange-300 hover:text-orange-600 transition-colors"
                    >
                      <span>{p.emoji}</span> {p.name}
                    </button>
                  ))}
                </div>

                {/* Bill list */}
                <div className="space-y-2">
                  {bills.map((bill, bi) => (
                    <motion.div
                      key={bill.id}
                      layout
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`bg-white border rounded-2xl p-4 transition-all ${
                        editingBillIdx === bi ? 'border-orange-300 shadow-md' : 'border-slate-100 shadow-sm'
                      }`}
                    >
                      {editingBillIdx === bi ? (
                        <div className="space-y-3">
                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={bill.emoji}
                              maxLength={2}
                              onChange={e => {
                                const updated = [...bills];
                                updated[bi] = { ...updated[bi], emoji: e.target.value };
                                setBills(updated);
                              }}
                              className="w-12 text-center text-xl bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-orange-400"
                            />
                            <input
                              type="text"
                              placeholder="Bill name (e.g. Rent)"
                              value={bill.name}
                              onChange={e => {
                                const updated = [...bills];
                                updated[bi] = { ...updated[bi], name: e.target.value };
                                setBills(updated);
                              }}
                              className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm font-semibold text-slate-800 outline-none focus:border-orange-400"
                              autoFocus
                            />
                          </div>
                          <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl overflow-hidden focus-within:border-orange-400">
                            <span className="pl-3 pr-2 text-sm font-bold text-slate-400">{currency}</span>
                            <input
                              type="text"
                              inputMode="numeric"
                              placeholder="0"
                              value={bill.preset ? bill.preset.toLocaleString('en-US') : ''}
                              onChange={e => {
                                const raw = parseFloat(e.target.value.replace(/,/g, '')) || 0;
                                const updated = [...bills];
                                updated[bi] = { ...updated[bi], preset: raw };
                                setBills(updated);
                              }}
                              className="flex-1 bg-transparent py-2.5 pr-3 text-sm font-bold text-slate-800 outline-none"
                            />
                          </div>
                          <div className="flex gap-2 justify-end">
                            <button
                              onClick={() => {
                                setBills(prev => prev.filter((_, i) => i !== bi));
                                setEditingBillIdx(null);
                              }}
                              className="flex items-center gap-1 text-xs text-slate-400 hover:text-red-500 px-3 py-1.5 bg-slate-50 rounded-xl border border-slate-100"
                            >
                              <Trash2 className="w-3 h-3" /> Remove
                            </button>
                            <button
                              onClick={() => setEditingBillIdx(null)}
                              className="text-xs font-bold text-white bg-orange-500 px-4 py-1.5 rounded-xl shadow-sm"
                            >
                              Done
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-violet-100 text-xl">{bill.emoji}</div>
                            <div>
                              <p className="font-bold text-slate-800 text-sm">{bill.name || 'Unnamed Bill'}</p>
                              <p className="text-xs text-violet-600 font-semibold">{formatCurrency(bill.preset, currency)} / mo</p>
                            </div>
                          </div>
                          <button
                            onClick={() => setEditingBillIdx(bi)}
                            className="text-xs text-slate-400 hover:text-orange-500 px-3 py-1.5 bg-slate-50 rounded-xl"
                          >
                            Edit
                          </button>
                        </div>
                      )}
                    </motion.div>
                  ))}

                  <button
                    onClick={() => {
                      const newBill: FixedBill = { id: Date.now().toString(), name: '', emoji: '💸', preset: 0 };
                      setBills(prev => [...prev, newBill]);
                      setEditingBillIdx(bills.length);
                    }}
                    className="w-full flex items-center gap-2 px-4 py-3.5 rounded-2xl border-2 border-dashed border-slate-200 text-slate-400 hover:border-orange-300 hover:text-orange-500 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    <span className="text-sm font-semibold">Add another bill</span>
                  </button>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => goBack(2)}
                    className="flex-shrink-0 bg-slate-100 text-slate-600 font-semibold px-5 py-4 rounded-2xl text-sm"
                  >
                    Back
                  </button>
                  <button
                    onClick={() => goNext(4)}
                    className="flex-1 bg-orange-500 hover:bg-orange-600 text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-orange-200"
                  >
                    {bills.length === 0 ? 'Skip' : 'Next'} <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
            )}

            {/* ── STEP 4: Quick Access Guide ── */}
            {step === 4 && (
              <div className="space-y-5">
                <div className="text-center space-y-2 pt-2">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-100 text-emerald-500 mb-2">
                    <Smartphone className="w-8 h-8" />
                  </div>
                  <h2 className="text-2xl font-black tracking-tight text-slate-800">Open in 1 Second</h2>
                  <p className="text-slate-500 text-sm">The magic of TapTrack is logging instantly — before you forget. Set it up now.</p>
                </div>

                {/* Step A: Add to Home Screen */}
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-slate-800 rounded-xl flex items-center justify-center text-white font-black text-sm flex-shrink-0">1</div>
                    <div>
                      <p className="font-bold text-slate-800 text-sm">Add to Home Screen</p>
                      <p className="text-xs text-slate-500 mt-0.5">This makes TapTrack feel like a real app on your phone.</p>
                    </div>
                  </div>
                  {os === 'ios' ? (
                    <div className="bg-slate-50 rounded-xl p-3 text-xs text-slate-600 space-y-1 leading-relaxed">
                      <p>📲 Tap the <strong>Share button</strong> at the bottom of Safari</p>
                      <p>📌 Scroll down and tap <strong>"Add to Home Screen"</strong></p>
                      <p>✅ Tap <strong>Add</strong> — done!</p>
                    </div>
                  ) : os === 'android' ? (
                    <div className="bg-slate-50 rounded-xl p-3 text-xs text-slate-600 space-y-1 leading-relaxed">
                      <p>⋮ Tap the <strong>three-dot menu</strong> in Chrome</p>
                      <p>📌 Tap <strong>"Add to Home Screen"</strong></p>
                      <p>✅ Tap <strong>Add</strong> — done!</p>
                    </div>
                  ) : (
                    <div className="bg-slate-50 rounded-xl p-3 text-xs text-slate-600 leading-relaxed">
                      Open TapTrack on your phone's browser, then add it to your home screen from the browser menu.
                    </div>
                  )}
                </div>

                {/* Step B: Device-specific quick trigger */}
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-orange-500 rounded-xl flex items-center justify-center text-white font-black text-sm flex-shrink-0">2</div>
                    <div>
                      <p className="font-bold text-slate-800 text-sm">
                        {os === 'ios' ? '⚡ Set Up Back Tap (iPhone)' : os === 'android' ? '⚡ Set Up Power Button Shortcut' : '⚡ Phone Shortcut Trick'}
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5">Open TapTrack without even finding the icon.</p>
                    </div>
                  </div>
                  {os === 'ios' ? (
                    <div className="bg-orange-50 border border-orange-100 rounded-xl p-3 text-xs text-slate-600 space-y-1 leading-relaxed">
                      <p>1. Open <strong>Settings → Accessibility → Touch → Back Tap</strong></p>
                      <p>2. Tap <strong>"Double Tap"</strong></p>
                      <p>3. Choose your TapTrack Shortcut <em>(see below)</em></p>
                      <div className="pt-2 border-t border-orange-100 mt-2">
                        <p className="font-semibold text-orange-600">To create the shortcut:</p>
                        <p>• Open the <strong>Shortcuts</strong> app → tap <strong>+</strong></p>
                        <p>• Add action: <strong>Open URLs</strong></p>
                        <p>• Paste your TapTrack link and save</p>
                      </div>
                      <div className="flex items-center gap-1.5 pt-2">
                        <Apple className="w-3.5 h-3.5 text-slate-500" />
                        <span className="text-slate-500">iPhone 15 Pro / 16: also works with the <strong>Action Button</strong></span>
                      </div>
                    </div>
                  ) : os === 'android' ? (
                    <div className="bg-orange-50 border border-orange-100 rounded-xl p-3 text-xs text-slate-600 space-y-1 leading-relaxed">
                      <p className="font-semibold text-orange-600">Samsung users:</p>
                      <p>1. Open <strong>Settings → Advanced Features → Side Button</strong></p>
                      <p>2. Under <strong>"Double Press"</strong>, choose <strong>"Open App"</strong></p>
                      <p>3. Select TapTrack from your home screen</p>
                      <p className="pt-2 font-semibold text-orange-600">Other Android:</p>
                      <p>Most launchers let you assign a gesture. Try <strong>double-tapping the home screen</strong> or use a shortcut widget.</p>
                    </div>
                  ) : (
                    <div className="bg-orange-50 border border-orange-100 rounded-xl p-3 text-xs text-slate-600 leading-relaxed">
                      On mobile, set up a double-tap on the back of your phone or a side button shortcut to open TapTrack instantly.
                    </div>
                  )}
                </div>

                <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4 text-center">
                  <p className="text-sm font-bold text-emerald-700">💡 The goal: Log expenses in under 3 seconds.</p>
                  <p className="text-xs text-emerald-600 mt-1">The faster you can log, the better your data — and the more you'll actually use it!</p>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => goBack(3)}
                    className="flex-shrink-0 bg-slate-100 text-slate-600 font-semibold px-5 py-4 rounded-2xl text-sm"
                  >
                    Back
                  </button>
                  <button
                    onClick={() => goNext(5)}
                    className="flex-1 bg-orange-500 hover:bg-orange-600 text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-orange-200"
                  >
                    Done! Show me my limit <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
            )}

            {/* ── STEP 5: Grand Reveal ── */}
            {step === 5 && (
              <div className="space-y-5">
                <div className="text-center space-y-2 pt-2">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1, rotate: [0, -10, 10, -5, 5, 0] }}
                    transition={{ type: 'spring', stiffness: 200, delay: 0.1 }}
                    className="text-6xl mb-2"
                  >
                    🎉
                  </motion.div>
                  <h2 className="text-2xl font-black tracking-tight text-slate-800">You're all set!</h2>
                  <p className="text-slate-500 text-sm">Here's your personalised daily spending limit:</p>
                </div>

                {/* The big number */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.2, type: 'spring', stiffness: 180 }}
                  className="bg-gradient-to-br from-orange-500 to-pink-500 rounded-3xl p-8 text-center shadow-2xl shadow-orange-200"
                >
                  <p className="text-white/80 text-sm font-semibold uppercase tracking-widest">Safe to Spend Per Day</p>
                  <p className="text-white font-black text-5xl mt-2">{formatCurrency(dailyLimit, currency)}</p>
                  <p className="text-white/70 text-xs mt-2">
                    Based on {formatCurrency(incomeNum * needsRatio, currency)} spending pool
                    {bills.length > 0 ? ` − ${formatCurrency(billsTotal, currency)} in bills` : ''}
                  </p>
                </motion.div>

                {/* Summary breakdown */}
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm divide-y divide-slate-50">
                  {[
                    { label: 'Monthly Income', value: formatCurrency(incomeNum, currency) },
                    { label: `Spending (${Math.round(needsRatio * 100)}%)`, value: formatCurrency(incomeNum * needsRatio, currency) },
                    ...(bills.length > 0 ? [{ label: '− Fixed Bills', value: `−${formatCurrency(billsTotal, currency)}` }] : []),
                    { label: 'Spendable Pool', value: formatCurrency(Math.max(0, incomeNum * needsRatio - billsTotal), currency) },
                    ...(savingsRatio > 0 ? [{ label: `Savings (${Math.round(savingsRatio * 100)}%)`, value: formatCurrency(incomeNum * savingsRatio, currency) }] : []),
                  ].map(row => (
                    <div key={row.label} className="px-5 py-3 flex items-center justify-between">
                      <p className="text-sm text-slate-600">{row.label}</p>
                      <p className="text-sm font-bold text-slate-800">{row.value}</p>
                    </div>
                  ))}
                </div>

                {bills.length > 0 && (
                  <div className="bg-violet-50 border border-violet-100 rounded-2xl p-4">
                    <p className="text-xs font-bold text-violet-700 mb-1">✅ Bills Applied Immediately</p>
                    <p className="text-xs text-violet-600">
                      Your {bills.length} fixed bill{bills.length > 1 ? 's' : ''} ({formatCurrency(billsTotal, currency)}) have been logged and deducted from this month's spending pool.
                    </p>
                  </div>
                )}

                <button
                  onClick={handleFinish}
                  className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-5 rounded-2xl flex items-center justify-center gap-2 transition-all shadow-2xl shadow-slate-300 text-lg"
                >
                  Start Tracking! 🚀
                </button>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

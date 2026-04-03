import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Check, ChevronDown, Search, Plus, Users, FileText } from 'lucide-react';
import { Transaction, FIXED_CATEGORIES, getCurrencySymbol } from '../types';

interface QuickEntryProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (entry: Omit<Transaction, 'id' | 'date'>) => void;
  currency: string;
}

interface Category {
  id: string;
  emoji: string;
  label: string;
}

const DEFAULT_CATEGORIES: Category[] = [
  { id: 'Food',      emoji: '🍔', label: 'Food'      },
  { id: 'Coffee',    emoji: '☕', label: 'Coffee'    },
  { id: 'Transport', emoji: '🚌', label: 'Transport' },
  { id: 'Ride',      emoji: '🚗', label: 'Ride'      },
  { id: 'Shopping',  emoji: '🛍️', label: 'Shopping'  },
  { id: 'Utility',   emoji: '⚡', label: 'Utility'   },
  { id: 'Rent',      emoji: '🏠', label: 'Rent'      },
  { id: 'Insurance', emoji: '🛡️', label: 'Insurance' },
  { id: 'Health',    emoji: '💊', label: 'Health'    },
  { id: 'Other',     emoji: 'ℹ️', label: 'Other'     },
];

function loadCategories(): Category[] {
  try {
    const saved = localStorage.getItem('taptrack_categories');
    if (saved) return JSON.parse(saved);
  } catch {}
  return DEFAULT_CATEGORIES;
}

function saveCategories(cats: Category[]) {
  localStorage.setItem('taptrack_categories', JSON.stringify(cats));
}

function getLastCategory(): string {
  return localStorage.getItem('taptrack_last_category') || 'Food';
}

function setLastCategory(cat: string) {
  localStorage.setItem('taptrack_last_category', cat);
}

/** Returns true for currencies that never use decimals and benefit from 00 key */
function isHighDenominationCurrency(currency: string): boolean {
  return currency === 'KRW' || currency === 'JPY';
}

/**
 * Formats a raw number string into a Korean/Japanese human-readable unit label.
 * e.g. 150000 (KRW) → "15만 원"    450000 (JPY) → "45万 円"
 */
function getUnitHelperText(rawStr: string, currency: string): string {
  const num = parseInt(rawStr.replace(/,/g, ''), 10);
  if (!num || num < 10000) return '';

  if (currency === 'KRW') {
    const man = Math.floor(num / 10000);
    const remainder = num % 10000;
    const cheon = Math.floor(remainder / 1000);
    let label = `${man}만`;
    if (cheon > 0) label += ` ${cheon}천`;
    return `${label} 원`;
  }
  if (currency === 'JPY') {
    const man = Math.floor(num / 10000);
    const remainder = num % 10000;
    const sen = Math.floor(remainder / 1000);
    let label = `${man}万`;
    if (sen > 0) label += ` ${sen}千`;
    return `${label} 円`;
  }
  return '';
}

/** Quick-add chip definitions per currency group */
function getQuickChips(currency: string): { label: string; value: number }[] {
  if (currency === 'KRW') {
    return [
      { label: '+1만', value: 10000 },
      { label: '+5만', value: 50000 },
      { label: '+10만', value: 100000 },
    ];
  }
  if (currency === 'JPY') {
    return [
      { label: '+1万', value: 10000 },
      { label: '+5万', value: 50000 },
      { label: '+10万', value: 100000 },
    ];
  }
  // Low-denomination currencies
  const sym = getCurrencySymbol(currency);
  return [
    { label: `+${sym}10`,  value: 10  },
    { label: `+${sym}50`,  value: 50  },
    { label: `+${sym}100`, value: 100 },
  ];
}

export const QuickEntry: React.FC<QuickEntryProps> = ({ isOpen, onClose, onSave, currency }) => {
  const [step, setStep] = useState<1 | 2>(1);
  const [amountStr, setAmountStr] = useState('0');
  const [categories, setCategories] = useState<Category[]>(loadCategories);
  const [category, setCategory] = useState(getLastCategory());
  const [splitBy, setSplitBy] = useState(1);
  const [description, setDescription] = useState('');
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [catSearch, setCatSearch] = useState('');
  const [newCatLabel, setNewCatLabel] = useState('');
  const [showAddCat, setShowAddCat] = useState(false);
  const [isIncome, setIsIncome] = useState(false);
  const [incomeAllocation, setIncomeAllocation] = useState<'Spending' | 'Savings' | 'Investment'>('Spending');
  const searchRef = useRef<HTMLInputElement>(null);

  const isHighDenom = isHighDenominationCurrency(currency);
  const quickChips = getQuickChips(currency);

  // Reset overlay state each time it opens
  useEffect(() => {
    if (isOpen) {
      setAmountStr('0');
      setStep(1);
      setSplitBy(1);
      setDescription('');
      setShowCategoryPicker(false);
      setCatSearch('');
      setNewCatLabel('');
      setShowAddCat(false);
      setIsIncome(false);
      setIncomeAllocation('Spending');
      setCategory(getLastCategory());
    }
  }, [isOpen]);

  useEffect(() => {
    if (showCategoryPicker) setTimeout(() => searchRef.current?.focus(), 150);
  }, [showCategoryPicker]);

  if (!isOpen) return null;

  const handleNumpad = (val: string) => {
    if (val === 'DEL') {
      setAmountStr(prev => (prev.length > 1 ? prev.slice(0, -1) : '0'));
    } else if (val === '.') {
      // Decimal only for non-high-denom currencies
      if (!isHighDenom && !amountStr.includes('.')) {
        setAmountStr(prev => prev + '.');
      }
    } else if (val === '00') {
      // Double-zero shortcut
      if (amountStr === '0') return;
      setAmountStr(prev => prev + '00');
    } else {
      // Regular digit — limit decimals to 2 places
      if (amountStr.includes('.') && amountStr.split('.')[1].length >= 2) return;
      setAmountStr(prev => prev === '0' ? val : prev + val);
    }
  };

  /** Add a fixed chip amount to the current value */
  const handleChipAdd = (chipValue: number) => {
    const current = parseInt(amountStr.replace(/,/g, ''), 10) || 0;
    setAmountStr(String(current + chipValue));
  };

  // Format amountStr with commas for display
  const displayAmount = (() => {
    if (amountStr.includes('.')) {
      const [whole, dec] = amountStr.split('.');
      const wholeNum = parseInt(whole.replace(/,/g, ''), 10) || 0;
      return `${wholeNum.toLocaleString('en-US')}.${dec}`;
    }
    const num = parseInt(amountStr, 10) || 0;
    return num.toLocaleString('en-US');
  })();

  // KRW/JPY helper unit text shown below the amount
  const unitHelperText = isHighDenom ? getUnitHelperText(amountStr, currency) : '';

  // Dynamic font size thresholds — wider for high-denom currencies
  const amountFontClass = (() => {
    const len = displayAmount.length;
    if (len > 12) return 'text-2xl';
    if (len > 8)  return 'text-3xl';
    if (len > 6)  return 'text-4xl';
    return 'text-5xl';
  })();

  const handleSave = () => {
    const amount = parseFloat(amountStr);
    if (amount <= 0) return;
    if (!isIncome) setLastCategory(category);
    const cat = isIncome ? `Income:${incomeAllocation}` : category;
    onSave({ amount, category: cat, splitBy, description, isIncome });
    onClose();
  };

  const handleCategorySelect = (cat: string) => {
    setCategory(cat);
    setShowCategoryPicker(false);
    setCatSearch('');
  };

  const handleAddCategory = () => {
    if (!newCatLabel.trim()) return;
    const newCat: Category = { id: newCatLabel.trim(), emoji: '✨', label: newCatLabel.trim() };
    const updated = [...categories, newCat];
    setCategories(updated);
    saveCategories(updated);
    handleCategorySelect(newCat.id);
    setNewCatLabel('');
    setShowAddCat(false);
  };

  const currentCat = categories.find(c => c.id === category) || categories[0];
  const filteredCats = categories.filter(c =>
    c.label.toLowerCase().includes(catSearch.toLowerCase())
  );
  const isFixed = FIXED_CATEGORIES.has(category);
  const effectiveAmount = splitBy > 1 ? parseFloat(amountStr) / splitBy : parseFloat(amountStr);

  // Numpad keys — swap . for 00 on high-denomination currencies
  const numpadKeys = [1, 2, 3, 4, 5, 6, 7, 8, 9, isHighDenom ? '00' : '.', 0, 'DEL'];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 28, stiffness: 280 }}
        className="absolute inset-0 z-50 bg-white flex flex-col overflow-hidden"
      >
        {/* ── Header ── */}
        <header className="flex justify-between items-center px-5 pt-5 pb-3 flex-shrink-0">
          <button onClick={onClose} className="p-2 -ml-2 rounded-full hover:bg-slate-100 text-slate-400">
            <X className="w-5 h-5" />
          </button>
          
          <div className="flex bg-slate-100/80 rounded-lg p-1 shadow-inner">
            <button
              onClick={() => setIsIncome(false)}
              className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all ${
                !isIncome ? 'bg-white shadow text-slate-800 scale-100' : 'text-slate-400 scale-95 hover:text-slate-600'
              }`}
            >
              Expense
            </button>
            <button
              onClick={() => setIsIncome(true)}
              className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all ${
                isIncome ? 'bg-emerald-500 shadow-sm text-white scale-100' : 'text-slate-400 scale-95 hover:text-emerald-600'
              }`}
            >
              Income
            </button>
          </div>

          <div className="w-9" />
        </header>

        {step === 1 && (
          <>
            {/* ── Spacer ── */}
            <div className="flex-1" />

            {/* ── Category + Amount Row (overflow-safe) ── */}
            <div className="flex items-center justify-between px-5 pb-2 flex-shrink-0 gap-2">
              {/* Left: category selector — truncates gracefully */}
              <div className="min-w-0 flex-shrink">
                {!isIncome ? (
                  <button
                    onClick={() => setShowCategoryPicker(true)}
                    className={`flex items-center gap-2 rounded-2xl px-4 py-2.5 transition-colors max-w-full ${
                      isFixed ? 'bg-violet-100' : 'bg-slate-100 hover:bg-slate-200'
                    }`}
                  >
                    <span className="text-xl flex-shrink-0">{currentCat.emoji}</span>
                    <span className={`font-bold text-sm truncate ${isFixed ? 'text-violet-700' : 'text-slate-800'}`}>
                      {currentCat.label}
                    </span>
                    {isFixed && (
                      <span className="text-[10px] font-bold text-violet-500 bg-violet-200 px-1.5 py-0.5 rounded-full flex-shrink-0">FIXED</span>
                    )}
                    <ChevronDown className={`w-4 h-4 flex-shrink-0 ${isFixed ? 'text-violet-400' : 'text-slate-400'}`} />
                  </button>
                ) : (
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {(['Spending', 'Savings', 'Investment'] as const).map(bucket => (
                      <button
                        key={bucket}
                        onClick={() => setIncomeAllocation(bucket)}
                        className={`px-3 py-2 rounded-xl text-[11px] font-black transition-all ${
                          incomeAllocation === bucket
                            ? 'bg-emerald-500 text-white shadow-sm scale-105'
                            : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                        }`}
                      >
                        {bucket === 'Spending' ? '💳' : bucket === 'Savings' ? '🏦' : '📈'} {bucket}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Right: amount display — never shrinks, always readable */}
              <div className="flex-shrink-0 pl-2 text-right">
                <div className="flex items-baseline gap-1 justify-end">
                  <span className={`text-lg font-semibold ${isIncome ? 'text-emerald-400' : 'text-slate-400'}`}>
                    {getCurrencySymbol(currency)}
                  </span>
                  <span className={`font-black tabular-nums tracking-tighter leading-none ${
                    isIncome ? 'text-emerald-500' : 'text-slate-800'
                  } ${amountFontClass}`}>
                    {displayAmount}
                  </span>
                </div>
                {/* KRW/JPY unit helper — softly formatted */}
                <AnimatePresence>
                  {unitHelperText && (
                    <motion.p
                      key={unitHelperText}
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="text-xs text-slate-400 font-semibold mt-0.5"
                    >
                      {unitHelperText}
                    </motion.p>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* ── Quick-Add Chips ── */}
            <div className="px-4 pb-2 flex gap-2 flex-shrink-0">
              {quickChips.map(chip => (
                <motion.button
                  key={chip.label}
                  whileTap={{ scale: 0.92 }}
                  onClick={() => handleChipAdd(chip.value)}
                  className={`flex-1 py-2 rounded-xl text-sm font-black transition-colors ${
                    isIncome
                      ? 'bg-emerald-50 text-emerald-600 active:bg-emerald-100'
                      : 'bg-orange-50 text-orange-600 active:bg-orange-100'
                  }`}
                >
                  {chip.label}
                </motion.button>
              ))}
            </div>

            {/* ── Numpad ── */}
            <div className="px-4 flex-shrink-0">
              <div className="grid grid-cols-3 gap-2.5">
                {numpadKeys.map((btn, idx) => (
                  <motion.button
                    key={`${btn}-${idx}`}
                    whileTap={{ scale: 0.9, backgroundColor: isIncome ? '#d1fae5' : '#e2e8f0' }}
                    onClick={() => handleNumpad(btn.toString())}
                    className={`h-14 text-2xl font-bold bg-slate-50 rounded-2xl transition-colors select-none flex items-center justify-center ${
                      isIncome ? 'text-emerald-700 active:bg-emerald-100' : 'text-slate-800 active:bg-slate-200'
                    } ${btn === '00' ? 'text-xl' : ''}`}
                  >
                    {btn === 'DEL' ? '⌫' : btn}
                  </motion.button>
                ))}
              </div>
            </div>

            {/* ── Action Row ── */}
            <div className="flex gap-3 px-4 pt-4 pb-6 flex-shrink-0">
              <button
                onClick={() => { if (parseFloat(amountStr) > 0) setStep(2); }}
                disabled={parseFloat(amountStr) === 0}
                className="flex-shrink-0 bg-slate-100 disabled:opacity-40 text-slate-600 font-semibold px-5 py-4 rounded-2xl text-sm whitespace-nowrap"
              >
                + More options
              </button>
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={handleSave}
                disabled={parseFloat(amountStr) === 0}
                className={`flex-1 text-white font-bold py-4 rounded-2xl shadow-xl flex items-center justify-center gap-2 ${
                  isIncome ? 'bg-emerald-500 disabled:bg-emerald-300' : 'bg-slate-900 disabled:bg-slate-300'
                }`}
              >
                {isIncome ? 'Receive' : 'Save'} <Check className="w-4 h-4" />
              </motion.button>
            </div>
          </>
        )}

        {step === 2 && (
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex flex-col flex-1 px-5 pb-6 overflow-y-auto"
          >
            <div className="text-center py-5">
              <p className="text-base font-bold text-slate-400">
                Total: <span className="text-slate-800 text-2xl font-black">{getCurrencySymbol(currency)}{parseInt(amountStr).toLocaleString('en-US')}{amountStr.includes('.') ? '.' + amountStr.split('.')[1] : ''}</span>
              </p>
              {isFixed && (
                <p className="text-xs text-violet-500 font-semibold mt-1">
                  ⚡ Fixed bill — won't affect your daily spending limit
                </p>
              )}
            </div>

            <div className="space-y-4 flex-1">
              {/* Split Bill */}
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-slate-600">
                    <Users className="w-4 h-4" />
                    <span className="font-semibold text-sm">Split Bill</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <button onClick={() => setSplitBy(Math.max(1, splitBy - 1))}
                      className="w-9 h-9 rounded-full bg-slate-200 text-slate-600 font-bold flex items-center justify-center text-lg">−</button>
                    <span className="font-bold w-5 text-center text-slate-800 text-lg">{splitBy}</span>
                    <button onClick={() => setSplitBy(splitBy + 1)}
                      className="w-9 h-9 rounded-full bg-slate-200 text-slate-600 font-bold flex items-center justify-center text-lg">+</button>
                  </div>
                </div>
                {splitBy > 1 && (
                  <p className="text-xs text-orange-500 font-semibold mt-2 text-right">
                    Your share: ${effectiveAmount.toFixed(2)}
                  </p>
                )}
              </div>

              {/* Description */}
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 focus-within:border-orange-300 focus-within:bg-white transition-colors">
                <div className="flex items-start gap-2">
                  <FileText className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
                  <textarea
                    placeholder="Add a note (optional)..."
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    className="flex-1 bg-transparent outline-none text-slate-700 text-sm resize-none h-16"
                    autoFocus
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-4 flex-shrink-0">
              <button onClick={() => setStep(1)}
                className="flex-shrink-0 bg-slate-100 text-slate-600 font-semibold px-5 py-4 rounded-2xl text-sm">
                Back
              </button>
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={handleSave}
                className="flex-1 bg-slate-900 text-white font-bold py-4 rounded-2xl shadow-xl flex items-center justify-center gap-2"
              >
                Save Log <Check className="w-4 h-4" />
              </motion.button>
            </div>
          </motion.div>
        )}

        {/* ── Category Picker Sheet ── */}
        <AnimatePresence>
          {showCategoryPicker && (
            <>
              <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="absolute inset-0 bg-slate-900/40 z-10"
                onClick={() => { setShowCategoryPicker(false); setCatSearch(''); setShowAddCat(false); }}
              />
              <motion.div
                initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
                transition={{ type: 'spring', damping: 30, stiffness: 350 }}
                className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl z-20 max-h-[80%] flex flex-col shadow-2xl"
              >
                <div className="px-5 pt-5 pb-3 flex-shrink-0">
                  <div className="w-10 h-1 bg-slate-200 rounded-full mx-auto mb-4" />
                  <h3 className="font-black text-slate-800 text-base mb-3">Select Category</h3>
                  <div className="flex items-center gap-2 bg-slate-100 rounded-xl px-3 py-2.5">
                    <Search className="w-4 h-4 text-slate-400 flex-shrink-0" />
                    <input
                      ref={searchRef}
                      type="text"
                      placeholder="Search or add category..."
                      value={catSearch}
                      onChange={e => setCatSearch(e.target.value)}
                      className="flex-1 bg-transparent outline-none text-slate-700 text-sm"
                    />
                  </div>
                </div>

                <div className="overflow-y-auto px-5 pb-8 space-y-1.5">
                  {filteredCats.map(cat => {
                    const isFixedCat = FIXED_CATEGORIES.has(cat.id);
                    return (
                      <motion.button
                        key={cat.id}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleCategorySelect(cat.id)}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all ${
                          category === cat.id
                            ? 'bg-orange-500 text-white shadow-md'
                            : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        <span className="text-xl">{cat.emoji}</span>
                        <span className="font-semibold text-sm flex-1 text-left">{cat.label}</span>
                        {isFixedCat && (
                          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                            category === cat.id ? 'bg-white/20 text-white' : 'bg-violet-100 text-violet-600'
                          }`}>FIXED</span>
                        )}
                        {category === cat.id && <Check className="w-4 h-4 flex-shrink-0" />}
                      </motion.button>
                    );
                  })}

                  {!showAddCat ? (
                    <button
                      onClick={() => setShowAddCat(true)}
                      className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl border-2 border-dashed border-slate-200 text-slate-400 hover:border-orange-300 hover:text-orange-500 transition-colors mt-2"
                    >
                      <Plus className="w-4 h-4" />
                      <span className="text-sm font-semibold">Add custom category</span>
                    </button>
                  ) : (
                    <div className="flex items-center gap-2 mt-2">
                      <input
                        type="text"
                        placeholder="Category name..."
                        value={newCatLabel}
                        onChange={e => setNewCatLabel(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleAddCategory()}
                        className="flex-1 bg-slate-100 rounded-xl px-4 py-2.5 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-orange-400"
                        autoFocus
                      />
                      <button onClick={handleAddCategory}
                        className="bg-orange-500 text-white px-4 py-2.5 rounded-xl text-sm font-bold">Add</button>
                    </div>
                  )}
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </motion.div>
    </AnimatePresence>
  );
};

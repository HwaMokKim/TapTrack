export interface Transaction {
  id: string;
  amount: number;
  category: string;
  description: string;
  date: string; // ISO string
  splitBy: number;
  isFixed?: boolean; // If true, subtracts from monthly pool only (not daily limit)
  isIncome?: boolean; // If true, adds to the monthly pool and daily limit instead of subtracting
}

export interface SavingsGoal {
  id: string;
  name: string;
  amount: number;
  targetDate: string | null; // ISO date string (YYYY-MM-DD) or null
  savedSoFar: number; // manually tracked or computed
  completedAt: string | null; // ISO date when goal was first completed
  archivedAt: string | null;  // ISO date when goal was archived
}

export interface FixedBill {
  id: string;
  name: string;        // e.g. 'Rent', 'Electricity'
  emoji: string;       // e.g. '🏠', '⚡'
  preset: number;      // expected monthly amount
}

export interface UserSettings {
  income: number;
  currency: string; // e.g., 'USD', 'KRW', 'EUR'
  isSavingsAutomated: boolean;
  isOnboarded: boolean;
  streakCount: number;
  lastLogDate: string | null;
  trackingStartDate: string | null; // ISO date when the user first completed onboarding
  // Legacy single-goal fields (kept for backward-compat, but UI uses savingsGoals[])
  savingsGoalName: string;
  savingsGoalAmount: number;
  savingsGoalDate: string | null;
  // Multi-goal array (up to 3)
  savingsGoals: SavingsGoal[];
  priorityGoalId: string | null; // ID of the goal to fund first during rollovers
  paydayDay: number;
  // Customizable ratios (must sum to 1.0)
  needsRatio: number;       // default 0.70
  savingsRatio: number;     // default 0.20
  investmentsRatio: number; // default 0.10
  // Dual-Reward Loop
  // Dual-Reward Loop
  weeklyRollover: number;   // accumulated unspent daily budget this week
  lastWeeklyReset: string | null; // ISO date string of last weekly reset
  totalSaved: number;       // running total accumulated savings
  // Monthly Fixed Bills Preset
  fixedBills: FixedBill[]; // Monthly recurring bills pre-set by user
  // Bill Savings Rollover: tracks net over/under-spend on fixed bills this month.
  // Negative = spent less than preset (money goes into savings). Positive = overspent (money owed from savings).
  billSavingsDebt: number;
  // Tracking Celebrations
  goalsCelebrated: string[]; // List of goal IDs that have triggered a one-time celebration
}

// Categories that should subtract from the monthly pool only, not the daily limit
export const FIXED_CATEGORIES = new Set(['Rent', 'Utility', 'Insurance', 'Mortgage', 'Subscription']);

// Currencies that never use fractional amounts (no cents)
const ZERO_DECIMAL_CURRENCIES = new Set(['KRW', 'JPY', 'VND', 'IDR', 'CLP', 'HUF', 'TWD', 'BIF', 'GNF', 'ISK', 'KMF', 'MGA', 'PYG', 'RWF', 'UGX', 'XAF', 'XOF', 'XPF']);

// Global formatting helpers
export function formatCurrency(amount: number, currencyCode: string): string {
  const isZeroDecimal = ZERO_DECIMAL_CURRENCIES.has(currencyCode.toUpperCase());
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currencyCode,
    minimumFractionDigits: 0,
    maximumFractionDigits: isZeroDecimal ? 0 : 2,
  }).format(isZeroDecimal ? Math.round(amount) : amount);
}

/** Format a plain number with commas, e.g. 1234567 → "1,234,567" */
export function formatNumber(value: number | string): string {
  const num = typeof value === 'string' ? parseFloat(value.replace(/,/g, '')) : value;
  if (isNaN(num)) return '';
  return num.toLocaleString('en-US');
}

/** Parse a comma-formatted string back to a number */
export function parseNumber(value: string): number {
  return parseFloat(value.replace(/,/g, '')) || 0;
}

export function getCurrencySymbol(currencyCode: string): string {
  const parts = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currencyCode,
  }).formatToParts(0);
  return parts.find(p => p.type === 'currency')?.value || currencyCode;
}

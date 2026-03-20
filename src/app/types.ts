export interface Transaction {
  id: string;
  amount: number;
  category: string;
  description: string;
  date: string; // ISO string
  splitBy: number;
  isFixed?: boolean; // If true, subtracts from monthly pool only (not daily limit)
}

export interface UserSettings {
  income: number;
  isSavingsAutomated: boolean;
  isOnboarded: boolean;
  streakCount: number;
  lastLogDate: string | null;
  savingsGoalName: string;
  savingsGoalAmount: number;
  savingsGoalDate: string | null; // target date to reach goal
  paydayDay: number;
  // Customizable ratios (must sum to 1.0)
  needsRatio: number;       // default 0.70
  savingsRatio: number;     // default 0.20
  investmentsRatio: number; // default 0.10
  // Dual-Reward Loop
  weeklyRollover: number;   // accumulated unspent daily budget this week
  lastWeeklyReset: string | null; // ISO date string of last weekly reset
  totalSaved: number;       // running total accumulated savings
}

// Categories that should subtract from the monthly pool only, not the daily limit
export const FIXED_CATEGORIES = new Set(['Rent', 'Utility', 'Insurance', 'Mortgage', 'Subscription']);

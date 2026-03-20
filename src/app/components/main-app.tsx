import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { Plus, Settings as SettingsIcon } from "lucide-react";
import { QuickEntryOverlay } from "./quick-entry-overlay";
import { TransactionList } from "./transaction-list";
import { AnalyticsView } from "./analytics-view";
import { PuppyAvatar } from "./puppy-avatar";

export interface Transaction {
  id: string;
  amount: number;
  category: string;
  date: Date;
}

// Mock data
const mockTransactions: Transaction[] = [
  { id: "1", amount: 5.0, category: "Food", date: new Date(2026, 2, 18) },
  { id: "2", amount: 45.0, category: "Transportation", date: new Date(2026, 2, 17) },
  { id: "3", amount: 12.5, category: "Food", date: new Date(2026, 2, 17) },
  { id: "4", amount: 150.0, category: "Shopping", date: new Date(2026, 2, 15) },
  { id: "5", amount: 80.0, category: "Utilities", date: new Date(2026, 2, 14) },
  { id: "6", amount: 25.0, category: "Entertainment", date: new Date(2026, 2, 13) },
  { id: "7", amount: 60.0, category: "Food", date: new Date(2026, 2, 12) },
  { id: "8", amount: 200.0, category: "Healthcare", date: new Date(2026, 2, 10) },
  { id: "9", amount: 15.0, category: "Transportation", date: new Date(2026, 2, 9) },
  { id: "10", amount: 95.0, category: "Shopping", date: new Date(2026, 2, 8) },
];

export function MainApp() {
  const [view, setView] = useState<"list" | "chart">("list");
  const [showOverlay, setShowOverlay] = useState(false);
  const [transactions, setTransactions] = useState<Transaction[]>(mockTransactions);
  const [showPuppy, setShowPuppy] = useState(false);
  const navigate = useNavigate();

  const totalSpent = transactions.reduce((sum, t) => sum + t.amount, 0);

  const handleAddTransaction = (transaction: Omit<Transaction, "id">) => {
    const newTransaction: Transaction = {
      ...transaction,
      id: Date.now().toString(),
    };
    setTransactions([newTransaction, ...transactions]);
    setShowOverlay(false);
    
    // Show puppy celebration
    setShowPuppy(true);
    setTimeout(() => setShowPuppy(false), 1500);
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm text-gray-500 mb-1">Total Spent This Month</p>
              <p className="text-3xl text-gray-400">
                ${totalSpent.toFixed(2)}
              </p>
            </div>
            <button
              onClick={() => navigate("/settings")}
              className="p-3 hover:bg-gray-50 rounded-xl transition-colors"
            >
              <SettingsIcon className="w-5 h-5 text-gray-600" />
            </button>
          </div>

          {/* Toggle Tabs */}
          <div className="flex bg-gray-100 rounded-xl p-1">
            <button
              onClick={() => setView("list")}
              className={`flex-1 py-2.5 rounded-lg font-medium transition-all ${
                view === "list"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-600"
              }`}
            >
              List
            </button>
            <button
              onClick={() => setView("chart")}
              className={`flex-1 py-2.5 rounded-lg font-medium transition-all ${
                view === "chart"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-600"
              }`}
            >
              Pie Chart
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-2xl mx-auto px-4 py-6">
        {view === "list" ? (
          <TransactionList transactions={transactions} />
        ) : (
          <AnalyticsView transactions={transactions} />
        )}
      </div>

      {/* Floating Add Button */}
      <button
        onClick={() => setShowOverlay(true)}
        className="fixed bottom-6 right-6 w-16 h-16 bg-emerald-500 text-white rounded-full shadow-lg hover:bg-emerald-600 transition-all hover:scale-110 flex items-center justify-center"
      >
        <Plus className="w-7 h-7" />
      </button>

      {/* Quick Entry Overlay */}
      {showOverlay && (
        <QuickEntryOverlay
          onClose={() => setShowOverlay(false)}
          onSave={handleAddTransaction}
        />
      )}

      {/* Puppy Avatar */}
      {showPuppy && <PuppyAvatar />}
    </div>
  );
}

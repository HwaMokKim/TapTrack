import { format, isSameMonth } from "date-fns";
import { 
  UtensilsCrossed, 
  Car, 
  ShoppingBag, 
  Zap, 
  Gamepad2, 
  Heart, 
  Scissors,
  GraduationCap 
} from "lucide-react";
import type { Transaction } from "./main-app";

interface TransactionListProps {
  transactions: Transaction[];
}

const categoryIcons: Record<string, any> = {
  Food: UtensilsCrossed,
  Transportation: Car,
  Shopping: ShoppingBag,
  Utilities: Zap,
  Entertainment: Gamepad2,
  Healthcare: Heart,
  "Personal Care": Scissors,
  Education: GraduationCap,
};

const categoryColors: Record<string, string> = {
  Food: "#10b981",
  Transportation: "#3b82f6",
  Shopping: "#f59e0b",
  Utilities: "#8b5cf6",
  Entertainment: "#ec4899",
  Healthcare: "#06b6d4",
  "Personal Care": "#f97316",
  Education: "#14b8a6",
};

export function TransactionList({ transactions }: TransactionListProps) {
  // Group transactions by month
  const groupedTransactions = transactions.reduce((groups, transaction) => {
    const monthYear = format(transaction.date, "MMMM yyyy");
    if (!groups[monthYear]) {
      groups[monthYear] = [];
    }
    groups[monthYear].push(transaction);
    return groups;
  }, {} as Record<string, Transaction[]>);

  const sortedMonths = Object.keys(groupedTransactions).sort((a, b) => {
    return new Date(b).getTime() - new Date(a).getTime();
  });

  return (
    <div className="space-y-8">
      {sortedMonths.map((monthYear) => {
        const monthTransactions = groupedTransactions[monthYear];
        const monthTotal = monthTransactions.reduce(
          (sum, t) => sum + t.amount,
          0
        );

        return (
          <div key={monthYear}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg text-gray-900">{monthYear}</h2>
              <span className="text-sm text-gray-400">
                ${monthTotal.toFixed(2)}
              </span>
            </div>

            <div className="space-y-2">
              {monthTransactions.map((transaction) => {
                const Icon = categoryIcons[transaction.category] || ShoppingBag;
                const color = categoryColors[transaction.category] || "#10b981";
                
                return (
                  <div
                    key={transaction.id}
                    className="bg-gray-50 rounded-xl px-4 py-3.5 flex items-center justify-between hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: color }}
                      >
                        <Icon className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">
                          {transaction.category}
                        </div>
                        <div className="text-xs text-gray-500 mt-0.5">
                          {format(transaction.date, "MMM d")}
                        </div>
                      </div>
                    </div>
                    <div className="text-gray-400">
                      ${transaction.amount.toFixed(2)}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      {transactions.length === 0 && (
        <div className="text-center py-16">
          <div className="text-5xl mb-4">📊</div>
          <h3 className="text-lg text-gray-900 mb-2">No expenses yet</h3>
          <p className="text-gray-500 text-sm">
            Tap the + button to log your first expense
          </p>
        </div>
      )}
    </div>
  );
}
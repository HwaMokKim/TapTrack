import { useState } from "react";
import { 
  X, 
  ChevronDown,
  UtensilsCrossed, 
  Car, 
  ShoppingBag, 
  Zap, 
  Gamepad2, 
  Heart, 
  Scissors,
  GraduationCap 
} from "lucide-react";
import { motion } from "motion/react";

interface QuickEntryOverlayProps {
  onClose: () => void;
  onSave: (transaction: { amount: number; category: string; date: Date }) => void;
}

const categories = [
  "Food",
  "Transportation",
  "Shopping",
  "Utilities",
  "Entertainment",
  "Healthcare",
  "Personal Care",
  "Education",
];

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

export function QuickEntryOverlay({ onClose, onSave }: QuickEntryOverlayProps) {
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("Food"); // Auto-guessed
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);

  const handleNumberClick = (num: string) => {
    if (num === "." && amount.includes(".")) return;
    if (amount === "0" && num !== ".") {
      setAmount(num);
    } else {
      setAmount(amount + num);
    }
  };

  const handleDelete = () => {
    setAmount(amount.slice(0, -1));
  };

  const handleSave = () => {
    if (amount && parseFloat(amount) > 0) {
      onSave({
        amount: parseFloat(amount),
        category,
        date: new Date(),
      });
    }
  };

  const Icon = categoryIcons[category] || ShoppingBag;
  const color = categoryColors[category] || "#10b981";

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className="bg-white rounded-3xl w-full max-w-sm shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h3 className="font-medium text-gray-900">Add Expense</h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* Amount Display */}
        <div className="px-5 py-6 text-center">
          <div className="text-4xl font-light text-gray-900 mb-2">
            ${amount || "0"}
          </div>
          <div className="text-xs text-gray-500">Enter amount</div>
        </div>

        {/* Category Selector */}
        <div className="px-5 mb-4">
          <button
            onClick={() => setShowCategoryPicker(!showCategoryPicker)}
            className="w-full bg-gray-50 text-gray-900 py-3 px-4 rounded-xl flex items-center justify-between hover:bg-gray-100 transition-colors"
          >
            <div className="flex items-center gap-2">
              <div
                className="w-6 h-6 rounded-full flex items-center justify-center"
                style={{ backgroundColor: color }}
              >
                <Icon className="w-3.5 h-3.5 text-white" />
              </div>
              <span className="font-medium text-sm">{category}</span>
            </div>
            <ChevronDown className="w-4 h-4 text-gray-600" />
          </button>

          {showCategoryPicker && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-2 bg-white border border-gray-200 rounded-xl shadow-lg max-h-48 overflow-y-auto"
            >
              {categories.map((cat) => {
                const CatIcon = categoryIcons[cat] || ShoppingBag;
                const catColor = categoryColors[cat] || "#10b981";
                
                return (
                  <button
                    key={cat}
                    onClick={() => {
                      setCategory(cat);
                      setShowCategoryPicker(false);
                    }}
                    className={`w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-0 flex items-center gap-3 ${
                      category === cat ? "bg-emerald-50" : ""
                    }`}
                  >
                    <div
                      className="w-6 h-6 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: catColor }}
                    >
                      <CatIcon className="w-3.5 h-3.5 text-white" />
                    </div>
                    <span className={category === cat ? "text-emerald-700 font-medium" : ""}>
                      {cat}
                    </span>
                  </button>
                );
              })}
            </motion.div>
          )}
        </div>

        {/* Numpad - Positioned for thumb reach */}
        <div className="px-5 pb-5">
          <div className="grid grid-cols-3 gap-2 mb-3">
            {["1", "2", "3", "4", "5", "6", "7", "8", "9", ".", "0", "⌫"].map(
              (btn) => (
                <button
                  key={btn}
                  onClick={() =>
                    btn === "⌫" ? handleDelete() : handleNumberClick(btn)
                  }
                  className="aspect-square bg-gray-50 hover:bg-gray-100 rounded-xl text-xl font-light text-gray-900 transition-colors active:scale-95"
                >
                  {btn}
                </button>
              )
            )}
          </div>

          {/* Save Button */}
          <button
            onClick={handleSave}
            disabled={!amount || parseFloat(amount) === 0}
            className="w-full bg-emerald-500 text-white py-3.5 rounded-xl font-medium hover:bg-emerald-600 transition-all disabled:opacity-40 disabled:cursor-not-allowed active:scale-98"
          >
            Save
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
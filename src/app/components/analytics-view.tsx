import { useState } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Sector } from "recharts";
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

interface AnalyticsViewProps {
  transactions: Transaction[];
}

const COLORS = [
  "#10b981", // emerald-500
  "#3b82f6", // blue-500
  "#f59e0b", // amber-500
  "#8b5cf6", // violet-500
  "#ec4899", // pink-500
  "#06b6d4", // cyan-500
  "#f97316", // orange-500
  "#14b8a6", // teal-500
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

const renderActiveShape = (props: any) => {
  const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill } = props;

  return (
    <g>
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius}
        outerRadius={outerRadius + 10}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
      />
    </g>
  );
};

export function AnalyticsView({ transactions }: AnalyticsViewProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  // Calculate spending by category
  const categoryData = transactions.reduce((acc, transaction) => {
    if (!acc[transaction.category]) {
      acc[transaction.category] = 0;
    }
    acc[transaction.category] += transaction.amount;
    return acc;
  }, {} as Record<string, number>);

  const chartData = Object.entries(categoryData)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  const total = chartData.reduce((sum, item) => sum + item.value, 0);

  const handlePieClick = (data: any, index: number) => {
    setActiveIndex(activeIndex === index ? null : index);
  };

  const activeItem = activeIndex !== null ? chartData[activeIndex] : null;

  return (
    <div className="space-y-8">
      {chartData.length > 0 ? (
        <>
          {/* Pie Chart */}
          <div className="bg-gray-50 rounded-3xl p-8">
            <h3 className="text-lg text-gray-900 mb-6 text-center">
              Spending by Category
            </h3>
            <div className="relative">
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={100}
                    paddingAngle={3}
                    dataKey="value"
                    onClick={handlePieClick}
                    activeIndex={activeIndex !== null ? activeIndex : undefined}
                    activeShape={renderActiveShape}
                  >
                    {chartData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                        className="cursor-pointer hover:opacity-80 transition-opacity"
                      />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              
              {/* Center Display */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
                {activeItem ? (
                  <>
                    <div className="text-2xl mb-1 text-gray-900">
                      ${activeItem.value.toFixed(2)}
                    </div>
                    <div className="text-sm text-gray-500">{activeItem.name}</div>
                    <div className="text-xs text-gray-400 mt-1">
                      {((activeItem.value / total) * 100).toFixed(1)}%
                    </div>
                  </>
                ) : (
                  <>
                    <div className="text-3xl mb-1 text-gray-900">
                      ${total.toFixed(2)}
                    </div>
                    <div className="text-sm text-gray-500">Total</div>
                  </>
                )}
              </div>
            </div>
            <p className="text-xs text-center text-gray-400 mt-4">
              Tap a slice to view details
            </p>
          </div>

          {/* Legend */}
          <div className="space-y-3">
            {chartData.map((item, index) => {
              const percentage = ((item.value / total) * 100).toFixed(1);
              const Icon = categoryIcons[item.name] || ShoppingBag;
              const isActive = activeIndex === index;
              
              return (
                <button
                  key={item.name}
                  onClick={() => handlePieClick(item, index)}
                  className={`w-full rounded-xl px-4 py-3.5 flex items-center justify-between transition-all ${
                    isActive 
                      ? "bg-gray-900 shadow-lg scale-105" 
                      : "bg-gray-50 hover:bg-gray-100"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    >
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                    <span className={`font-medium ${isActive ? "text-white" : "text-gray-900"}`}>
                      {item.name}
                    </span>
                  </div>
                  <div className="text-right">
                    <div className={isActive ? "text-white" : "text-gray-400"}>
                      ${item.value.toFixed(2)}
                    </div>
                    <div className={`text-xs ${isActive ? "text-gray-300" : "text-gray-500"}`}>
                      {percentage}%
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </>
      ) : (
        <div className="text-center py-16">
          <div className="text-5xl mb-4">📊</div>
          <h3 className="text-lg text-gray-900 mb-2">No data to display</h3>
          <p className="text-gray-500 text-sm">
            Add some expenses to see your spending breakdown
          </p>
        </div>
      )}
    </div>
  );
}
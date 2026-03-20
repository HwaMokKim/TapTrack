import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Wallet, PieChart, CheckCircle2, ChevronRight } from 'lucide-react';
import { UserSettings } from '../types';

interface SetupWizardProps {
  onComplete: (settings: Partial<UserSettings>) => void;
}

export const SetupWizard: React.FC<SetupWizardProps> = ({ onComplete }) => {
  const [step, setStep] = useState(1);
  const [income, setIncome] = useState<string>('');
  const [isAutomated, setIsAutomated] = useState(false);

  const handleNext = () => {
    if (step === 1 && income) setStep(2);
    else if (step === 2) onComplete({ income: parseFloat(income), isSavingsAutomated: isAutomated, isOnboarded: true });
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 justify-center px-6 py-12 text-slate-900 overflow-y-auto">
      <motion.div
        key={step}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        className="max-w-md mx-auto w-full space-y-8"
      >
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-orange-100 text-orange-500 mb-4">
            <Wallet className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Welcome to TapTrack</h1>
          <p className="text-slate-500">
            {step === 1 ? "Let's set up your monthly income to calculate your Safe-to-Spend." : "The 70/20/10 Rule"}
          </p>
        </div>

        {step === 1 && (
          <div className="space-y-6 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Monthly Income ($)</label>
              <input
                type="number"
                value={income}
                onChange={(e) => setIncome(e.target.value)}
                placeholder="e.g. 5000"
                className="w-full text-3xl font-bold text-center border-b-2 border-slate-200 focus:border-orange-500 focus:outline-none py-2 bg-transparent transition-colors"
                autoFocus
              />
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 space-y-4">
              <div className="flex items-start gap-4">
                <div className="bg-blue-50 p-2 rounded-lg text-blue-500 mt-1">
                  <PieChart className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-800">We use the 70/20/10 Budget</h3>
                  <ul className="text-sm text-slate-600 mt-2 space-y-1">
                    <li><strong className="text-slate-800">70%</strong> Safe to Spend & Needs</li>
                    <li><strong className="text-slate-800">20%</strong> Savings & Investments</li>
                    <li><strong className="text-slate-800">10%</strong> Debt & Buffer</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4 cursor-pointer" onClick={() => setIsAutomated(!isAutomated)}>
              <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${isAutomated ? 'bg-orange-500 border-orange-500' : 'border-slate-300'}`}>
                {isAutomated && <CheckCircle2 className="w-4 h-4 text-white" />}
              </div>
              <div className="flex-1">
                <p className="font-medium text-slate-800">I have automated my savings</p>
                <p className="text-xs text-slate-500">We'll assume your 20% is safely tucked away.</p>
              </div>
            </div>
          </div>
        )}

        <button
          onClick={handleNext}
          disabled={step === 1 && !income}
          className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-4 rounded-xl flex items-center justify-center gap-2 transition-all"
        >
          {step === 1 ? 'Next Step' : 'Get Started'}
          <ChevronRight className="w-5 h-5" />
        </button>
      </motion.div>
    </div>
  );
};

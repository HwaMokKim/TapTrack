import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Users, FileText, Trash2, Save } from 'lucide-react';
import { Transaction } from '../types';

interface TransactionModalProps {
  transaction: Transaction | null;
  onClose: () => void;
  onUpdate: (updated: Transaction) => void;
  onDelete: (id: string) => void;
}

export const TransactionModal: React.FC<TransactionModalProps> = ({ transaction, onClose, onUpdate, onDelete }) => {
  const [splitBy, setSplitBy] = useState(1);
  const [description, setDescription] = useState('');

  useEffect(() => {
    if (transaction) {
      setSplitBy(transaction.splitBy);
      setDescription(transaction.description);
    }
  }, [transaction]);

  if (!transaction) return null;

  const effectiveAmount = transaction.amount / splitBy;

  const handleSave = () => {
    onUpdate({
      ...transaction,
      splitBy,
      description,
    });
    onClose();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="bg-white rounded-3xl w-full max-w-sm p-6 space-y-6 shadow-2xl relative"
        >
          <button onClick={onClose} className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>

          <div className="text-center space-y-1 pt-2">
            <div className="text-sm font-medium text-slate-500 uppercase tracking-widest">{transaction.category}</div>
            <div className="text-4xl font-black text-slate-800">${effectiveAmount.toFixed(2)}</div>
            {splitBy > 1 && (
              <div className="text-xs text-slate-400">Total: ${transaction.amount.toFixed(2)} split {splitBy} ways</div>
            )}
            <div className="text-xs text-slate-400 mt-1">
              {new Date(transaction.date).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 focus-within:border-orange-500 focus-within:bg-white transition-colors">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-2">
                <Users className="w-4 h-4" /> Split Bill With
              </label>
              <div className="flex items-center justify-between">
                <span className="text-slate-700 font-medium text-sm">{splitBy === 1 ? 'Just me' : `${splitBy} people`}</span>
                <div className="flex items-center gap-3">
                  <button onClick={() => setSplitBy(Math.max(1, splitBy - 1))} className="w-8 h-8 rounded-full bg-slate-200 text-slate-600 font-bold">-</button>
                  <span className="font-bold w-4 text-center">{splitBy}</span>
                  <button onClick={() => setSplitBy(splitBy + 1)} className="w-8 h-8 rounded-full bg-slate-200 text-slate-600 font-bold">+</button>
                </div>
              </div>
            </div>

            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 focus-within:border-orange-500 focus-within:bg-white transition-colors">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-2">
                <FileText className="w-4 h-4" /> Description
              </label>
              <textarea
                placeholder="What was this for?"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full bg-transparent outline-none text-slate-700 text-sm resize-none h-16"
              />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              onClick={() => onDelete(transaction.id)}
              className="p-4 bg-red-50 text-red-500 rounded-2xl hover:bg-red-100 transition-colors"
            >
              <Trash2 className="w-5 h-5" />
            </button>
            <button
              onClick={handleSave}
              className="flex-1 bg-slate-900 text-white font-bold py-4 rounded-2xl shadow-xl transition-colors active:scale-95 flex items-center justify-center gap-2"
            >
              <Save className="w-5 h-5" /> Save Changes
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

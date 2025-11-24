import React, { useState, useEffect } from 'react';
import { TransactionType, Category, Transaction } from '../types';
import { ALL_CATEGORIES } from '../constants';
import { Plus, X } from 'lucide-react';

interface TransactionFormProps {
  onSave: (transaction: Transaction) => void;
  onClose: () => void;
  initialType?: TransactionType;
  initialCategory?: string;
  allowedCategories?: string[]; // If provided, limits the dropdown
  defaultDate?: string;
}

export const TransactionForm: React.FC<TransactionFormProps> = ({ 
  onSave, 
  onClose, 
  initialType = TransactionType.EXPENSE,
  initialCategory,
  allowedCategories,
  defaultDate
}) => {
  const [type, setType] = useState<TransactionType>(initialType);
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<string>(initialCategory || (allowedCategories ? allowedCategories[0] : ALL_CATEGORIES[0]));
  const [date, setDate] = useState(defaultDate || new Date().toISOString().split('T')[0]);

  // Update allowed categories list based on props or defaults
  const categoriesToShow = allowedCategories || ALL_CATEGORIES;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !description) return;

    const newTransaction: Transaction = {
      id: crypto.randomUUID(),
      date,
      amount: parseFloat(amount),
      description,
      category,
      type,
    };

    onSave(newTransaction);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 animate-fade-in">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
        <div className="flex justify-between items-center p-6 border-b border-slate-100">
          <h2 className="text-xl font-bold text-slate-800">Nueva Operación</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X size={24} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Type Toggle */}
          <div className="flex bg-slate-100 p-1 rounded-lg">
            <button
              type="button"
              onClick={() => setType(TransactionType.INCOME)}
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${
                type === TransactionType.INCOME
                  ? 'bg-emerald-500 text-white shadow-md'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              Ingreso
            </button>
            <button
              type="button"
              onClick={() => setType(TransactionType.EXPENSE)}
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${
                type === TransactionType.EXPENSE
                  ? 'bg-rose-500 text-white shadow-md'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              Gasto
            </button>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Monto</label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-slate-400">$</span>
              <input
                type="number"
                step="0.01"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full pl-8 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                placeholder="0.00"
                autoFocus
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Descripción</label>
            <input
              type="text"
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
              placeholder="Ej: Pago de nómina"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Categoría</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
              >
                {categoriesToShow.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Fecha</label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full mt-6 bg-slate-900 hover:bg-slate-800 text-white font-semibold py-3 rounded-lg flex items-center justify-center space-x-2 transition-all"
          >
            <Plus size={20} />
            <span>Guardar Operación</span>
          </button>
        </form>
      </div>
    </div>
  );
};
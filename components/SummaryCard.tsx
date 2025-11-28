import React from 'react';
import { LucideIcon } from 'lucide-react';

interface SummaryCardProps {
  title: string;
  amount: number;
  icon: LucideIcon;
  variant: 'income' | 'expense' | 'balance';
  subtitle?: string;
}

export const SummaryCard: React.FC<SummaryCardProps> = ({ title, amount, icon: Icon, variant, subtitle }) => {
  const getStyles = () => {
    switch (variant) {
      case 'income':
        return {
          bgIcon: 'bg-green-100',
          textIcon: 'text-green-500',
          amountColor: 'text-green-600'
        };
      case 'expense':
        return {
          bgIcon: 'bg-red-100',
          textIcon: 'text-red-500',
          amountColor: 'text-red-600'
        };
      case 'balance':
        return {
          bgIcon: 'bg-green-100', // Usando verde claro para balance positivo visual
          textIcon: 'text-green-600',
          amountColor: 'text-green-600'
        };
      default:
        return { bgIcon: 'bg-slate-100', textIcon: 'text-slate-500', amountColor: 'text-slate-900' };
    }
  };

  const styles = getStyles();

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between h-full relative overflow-hidden">
      <div className="flex justify-between items-start mb-2">
        <div>
          <p className="text-sm font-medium text-slate-500 mb-1">{title}</p>
          <h3 className={`text-3xl font-bold ${styles.amountColor}`}>
            {amount.toLocaleString('es-ES', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} €
          </h3>
        </div>
        <div className={`p-3 rounded-full ${styles.bgIcon} flex items-center justify-center`}>
          <Icon className={`w-6 h-6 ${styles.textIcon}`} />
        </div>
      </div>
      {subtitle && (
        <p className="text-xs text-slate-400 mt-2 font-medium">
          {subtitle}
        </p>
      )}
    </div>
  );
};
import React, { useState } from 'react';
import { Transaction } from '../types';
import { getFinancialAdvice } from '../services/geminiService';
import { Sparkles, Loader2, MessageSquareQuote } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface AIAdvisorProps {
  transactions: Transaction[];
}

export const AIAdvisor: React.FC<AIAdvisorProps> = ({ transactions }) => {
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleAnalyze = async () => {
    setLoading(true);
    const result = await getFinancialAdvice(transactions);
    setAnalysis(result);
    setLoading(false);
  };

  return (
    <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl p-6 border border-indigo-100 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-indigo-600 rounded-lg text-white">
            <Sparkles size={24} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-800">Analista Financiero IA</h3>
            <p className="text-sm text-slate-500">Impulsado por Gemini 2.5</p>
          </div>
        </div>
        {!analysis && (
          <button
            onClick={handleAnalyze}
            disabled={loading}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
          >
            {loading ? <Loader2 className="animate-spin" size={18} /> : <Sparkles size={18} />}
            <span>{loading ? 'Analizando...' : 'Generar Reporte'}</span>
          </button>
        )}
      </div>

      {analysis && (
        <div className="bg-white p-5 rounded-lg border border-indigo-100 shadow-sm animate-fade-in">
           <div className="prose prose-indigo prose-sm max-w-none text-slate-700">
             <ReactMarkdown>{analysis}</ReactMarkdown>
           </div>
           <div className="mt-4 flex justify-end">
             <button 
                onClick={() => setAnalysis(null)}
                className="text-xs text-slate-400 hover:text-indigo-600 underline"
             >
                Cerrar reporte
             </button>
           </div>
        </div>
      )}
      
      {!analysis && !loading && (
        <p className="text-slate-500 text-sm mt-2 flex items-start space-x-2">
            <MessageSquareQuote size={16} className="mt-1 flex-shrink-0" />
            <span>Solicita a la IA que revise tus transacciones recientes para detectar tendencias de gastos y oportunidades de ahorro.</span>
        </p>
      )}
    </div>
  );
};

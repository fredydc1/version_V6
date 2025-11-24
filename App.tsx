import React, { useState, useEffect, useMemo } from 'react';
import { 
  PieChart as PieChartIcon, 
  TrendingUp, 
  TrendingDown, 
  Plus, 
  Menu,
  X,
  Calendar,
  Trash2,
  RefreshCw,
  Scale,
  Download,
  FileText,
  BadgeDollarSign,
  ChevronDown,
  ChevronUp,
  Info,
  Clock,
  CreditCard,
  ArrowRightLeft,
  Users,
  Pencil,
  Truck,
  Building2,
  Coins,
  ArrowLeft,
  LayoutGrid,
  Database,
  Unplug,
  Wrench,
  AlertTriangle,
  Loader2
} from 'lucide-react';
import { format, parseISO, isSameMonth } from 'date-fns';
import { es } from 'date-fns/locale';

import { Transaction, TransactionType, Category, Employee, Supplier, FixedExpenseItem } from './types';
import { getTransactions, saveTransaction, deleteTransaction, calculateSummary, getEmployees, saveEmployee, deleteEmployee, getSuppliers, saveSupplier, deleteSupplier, getFixedExpenses, saveFixedExpense, deleteFixedExpense, setManualDatabaseUrl, disconnectManualDatabase, getStoredConnectionStatus, initializeSchema } from './services/financeService';
import { SummaryCard } from './components/SummaryCard';
import { CATEGORIES_BY_SECTION } from './constants';

type ViewType = 'dashboard' | 'caja' | 'personal' | 'proveedores' | 'estructura' | 'anual';

// Specific income sources for the Caja view layout
const STATIC_INCOME_SOURCES = [
  'Barra 1', 'Barra 2', 'Barra 3', 
  'Barra 4', 'Restaurante', 'VIP', 
  'Tickets', 'Puerta', 'Vapers', 'Shishas'
];

interface DbConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const DbConfigModal: React.FC<DbConfigModalProps> = ({ isOpen, onClose }) => {
  const [url, setUrl] = useState('');
  const [status, setStatus] = useState(getStoredConnectionStatus());
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSave = () => {
    const trimmed = url.trim();
    if(!trimmed) return;
    
    if (!trimmed.startsWith('postgres://') && !trimmed.startsWith('postgresql://')) {
        alert('La URL de conexión debe comenzar por "postgres://" o "postgresql://"');
        return;
    }

    setManualDatabaseUrl(trimmed);
    onClose();
  };

  const handleDisconnect = () => {
      if(window.confirm('¿Desconectar la base de datos actual?')) {
          disconnectManualDatabase();
          onClose();
      }
  };

  const handleInitSchema = async () => {
      setLoading(true);
      try {
          await initializeSchema();
          alert('Tablas creadas correctamente. La base de datos está lista para usar.');
          window.location.reload();
      } catch (error) {
          console.error(error);
          alert('Error creando tablas. Revisa la conexión o la consola para más detalles.');
      } finally {
          setLoading(false);
      }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[60] p-4 animate-fade-in backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
        <div className="flex justify-between items-center p-6 border-b border-slate-100 bg-slate-50">
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <Database className="text-indigo-600" size={24} />
            Configuración Base de Datos
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <X size={24} />
          </button>
        </div>
        
        <div className="p-6 space-y-6">
            <div className={`p-4 rounded-lg border ${status.isConnected ? 'bg-emerald-50 border-emerald-100' : 'bg-amber-50 border-amber-100'}`}>
                <div className="flex items-start gap-3">
                    {status.isConnected ? <div className="w-3 h-3 mt-1.5 rounded-full bg-emerald-500 shadow-sm" /> : <Unplug className="text-amber-500 mt-0.5" size={18}/>}
                    <div>
                        <h4 className={`font-bold text-sm ${status.isConnected ? 'text-emerald-800' : 'text-amber-800'}`}>
                            {status.isConnected ? 'Conectado a Neon DB' : 'No conectado'}
                        </h4>
                        <p className="text-xs mt-1 text-slate-600">
                            {status.isConnected 
                                ? `Modo: ${status.type === 'MANUAL' ? 'Configuración Manual' : 'Variable de Entorno'}`
                                : 'La aplicación requiere una conexión a base de datos Neon para guardar tus datos.'
                            }
                        </p>
                    </div>
                </div>
            </div>

            {status.isConnected && (
                <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-lg">
                     <h4 className="font-bold text-sm text-indigo-900 mb-2 flex items-center gap-2">
                         <Wrench size={16}/> Mantenimiento
                     </h4>
                     <p className="text-xs text-slate-600 mb-3">
                         Si es la primera vez que te conectas, necesitas crear las tablas en la base de datos.
                     </p>
                     <button 
                        onClick={handleInitSchema}
                        disabled={loading}
                        className="w-full bg-white border border-indigo-200 text-indigo-700 font-bold py-2 rounded-lg hover:bg-indigo-100 transition-colors text-sm shadow-sm"
                     >
                        {loading ? 'Creando tablas...' : 'Inicializar Tablas / Reparar DB'}
                     </button>
                </div>
            )}

            <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Conexión Manual (Connection String)</label>
                <p className="text-xs text-slate-500 mb-3">
                    Pega aquí la URL de conexión de tu proyecto Neon (ej: <code>postgres://usuario:pass@...</code>).
                </p>
                <input 
                    type="text" 
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="postgres://..."
                    className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-mono text-slate-600"
                />
            </div>

            <div className="flex gap-3 pt-2">
                 {status.type === 'MANUAL' && (
                    <button 
                        onClick={handleDisconnect}
                        className="flex-1 bg-rose-100 hover:bg-rose-200 text-rose-700 font-bold py-3 rounded-lg transition-colors"
                    >
                        Desconectar
                    </button>
                 )}
                 <button 
                    onClick={handleSave}
                    className="flex-1 bg-slate-900 hover:bg-slate-800 text-white font-bold py-3 rounded-lg transition-colors shadow-md"
                 >
                    Guardar Conexión
                 </button>
            </div>
        </div>
      </div>
    </div>
  );
};

interface SessionEditorProps {
  date: string;
  description: string;
  transactions: Transaction[];
  employees: Employee[];
  onSaveTransaction: (t: Transaction) => Promise<void>;
  onDeleteTransaction: (id: string) => Promise<void>;
  onDeleteSession: (date: string) => void;
}

const SessionEditor: React.FC<SessionEditorProps> = ({ date, description, transactions, employees, onSaveTransaction, onDeleteTransaction, onDeleteSession }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // Accordion states
  const [isIncomeOpen, setIsIncomeOpen] = useState(true);
  const [isPaymentOpen, setIsPaymentOpen] = useState(true);
  const [isExpenseOpen, setIsExpenseOpen] = useState(false);
  const [isStaffOpen, setIsStaffOpen] = useState(false);

  // Income Form State (Batch)
  const [incomeValues, setIncomeValues] = useState<Record<string, string>>({});

  // Payment Breakdown State
  const [paymentValues, setPaymentValues] = useState({
    cash: '',
    card: '',
    transfer: ''
  });

  // Expense Form State
  const [expenseDesc, setExpenseDesc] = useState('');
  const [expenseAmount, setExpenseAmount] = useState('');

  // Filter only hourly employees for session reporting
  const hourlyEmployees = useMemo(() => employees.filter(e => e.type === 'HOURLY'), [employees]);

  useEffect(() => {
    // Initialize income values from existing transactions
    const currentIncomes: Record<string, string> = {};
    STATIC_INCOME_SOURCES.forEach(source => {
        const t = transactions.find(tr => tr.description === source && tr.type === TransactionType.INCOME && tr.category === Category.VENTA_DIARIA);
        if (t) {
            currentIncomes[source] = t.amount.toString();
        } else {
            currentIncomes[source] = '0';
        }
    });
    setIncomeValues(currentIncomes);

    // Initialize Payment Breakdown values
    const cashT = transactions.find(t => t.category === Category.DESGLOSE_PAGO && t.description === 'Cobro: Efectivo');
    const cardT = transactions.find(t => t.category === Category.DESGLOSE_PAGO && t.description === 'Cobro: Tarjeta');
    const transferT = transactions.find(t => t.category === Category.DESGLOSE_PAGO && t.description === 'Cobro: Transferencia');

    setPaymentValues({
      cash: cashT ? cashT.amount.toString() : '',
      card: cardT ? cardT.amount.toString() : '',
      transfer: transferT ? transferT.amount.toString() : ''
    });
  }, [transactions]);

  const sessionSummary = useMemo(() => {
    // We strictly use VENTA_DIARIA for the Total Income calculation
    const incomes = transactions
      .filter(t => t.type === TransactionType.INCOME && t.category === Category.VENTA_DIARIA)
      .reduce((acc, t) => acc + t.amount, 0);
      
    // GASTO_CAJA filtered strictly to avoid Structure/Supplier overlap
    const directExpenses = transactions
      .filter(t => t.type === TransactionType.EXPENSE && t.category === Category.GASTO_CAJA)
      .reduce((acc, t) => acc + t.amount, 0);
      
    const staffCost = transactions.filter(t => t.category === Category.PERSONAL_HORAS).reduce((acc, t) => acc + t.amount, 0);
    
    return {
        totalIncome: incomes,
        directExpenses,
        staffCost,
        net: incomes - directExpenses - staffCost
    };
  }, [transactions]);

  const handleSaveIncomes = async () => {
      setIsSaving(true);
      try {
          // Execute sequentially to prevent race conditions in state updates
          for (const source of STATIC_INCOME_SOURCES) {
              const valStr = incomeValues[source];
              const val = parseFloat(valStr);
              
              // Find existing transaction strictly by description AND category to avoid mixups with Session Title
              const existing = transactions.find(tr => 
                  tr.description === source && 
                  tr.type === TransactionType.INCOME && 
                  tr.category === Category.VENTA_DIARIA
              );
              
              if (val > 0) {
                  // Create or Update
                  await onSaveTransaction({
                      id: existing ? existing.id : crypto.randomUUID(),
                      date,
                      amount: val,
                      description: source,
                      category: Category.VENTA_DIARIA,
                      type: TransactionType.INCOME
                  });
              } else if (existing && (val === 0 || isNaN(val))) {
                  await onDeleteTransaction(existing.id);
              }
          }
      } catch (e) {
          console.error(e);
          alert('Error guardando ingresos. Inténtalo de nuevo.');
      } finally {
          setIsSaving(false);
      }
  };

  const handlePaymentChange = (field: 'cash' | 'card' | 'transfer', value: string) => {
    const numValue = parseFloat(value) || 0;
    
    // Calculate current total excluding the field being edited
    const otherFieldsTotal = 
      (field !== 'cash' ? (parseFloat(paymentValues.cash) || 0) : 0) +
      (field !== 'card' ? (parseFloat(paymentValues.card) || 0) : 0) +
      (field !== 'transfer' ? (parseFloat(paymentValues.transfer) || 0) : 0);
    
    // Check if new value exceeds total income limit
    if (otherFieldsTotal + numValue > sessionSummary.totalIncome) {
      // Don't update if it exceeds
      return; 
    }

    setPaymentValues(prev => ({ ...prev, [field]: value }));
  };

  const handleSavePayments = async () => {
    setIsSaving(true);
    try {
        const savePaymentType = async (desc: string, amountStr: string) => {
          const val = parseFloat(amountStr);
          const existing = transactions.find(tr => tr.description === desc && tr.category === Category.DESGLOSE_PAGO);

          if (val > 0) {
            await onSaveTransaction({
              id: existing ? existing.id : crypto.randomUUID(),
              date,
              amount: val,
              description: desc,
              category: Category.DESGLOSE_PAGO, // Important: This category is excluded from dashboard totals
              type: TransactionType.INCOME
            });
          } else if (existing) {
            await onDeleteTransaction(existing.id);
          }
        };

        await savePaymentType('Cobro: Efectivo', paymentValues.cash);
        await savePaymentType('Cobro: Tarjeta', paymentValues.card);
        await savePaymentType('Cobro: Transferencia', paymentValues.transfer);
    } finally {
        setIsSaving(false);
    }
  };

  const handleAddExpense = async () => {
    if (!expenseAmount || !expenseDesc) return;
    await onSaveTransaction({
      id: crypto.randomUUID(),
      date,
      amount: parseFloat(expenseAmount),
      description: expenseDesc,
      category: Category.GASTO_CAJA,
      type: TransactionType.EXPENSE
    });
    setExpenseAmount('');
    setExpenseDesc('');
  };

  // Helper to handle updates for a specific hourly employee from the list
  const handleUpdateHourlyStaff = async (emp: Employee, hoursStr: string) => {
      const hours = parseFloat(hoursStr);
      // Find existing transaction based on category and description match
      // We assume description format "Name (Xh)" for persistence
      const existing = transactions.find(t => 
          t.category === Category.PERSONAL_HORAS && 
          t.description.startsWith(emp.name)
      );

      if (hours > 0) {
          const amount = hours * emp.cost;
          await onSaveTransaction({
              id: existing ? existing.id : crypto.randomUUID(),
              date,
              amount: amount,
              description: `${emp.name} (${hours}h)`,
              category: Category.PERSONAL_HORAS,
              type: TransactionType.EXPENSE
          });
      } else if (existing) {
          await onDeleteTransaction(existing.id);
      }
  };

  const currentPaymentTotal = (parseFloat(paymentValues.cash)||0) + (parseFloat(paymentValues.card)||0) + (parseFloat(paymentValues.transfer)||0);
  const paymentDiff = sessionSummary.totalIncome - currentPaymentTotal;

  return (
    <div className="border-b border-slate-100 last:border-0">
      <div 
        className="p-6 bg-white hover:bg-slate-50 transition-colors cursor-pointer flex justify-between items-center group"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div>
            <h3 className="text-lg font-bold text-slate-900">{description || 'Sesión sin nombre'}</h3>
            <p className="text-sm text-slate-500">{format(parseISO(date), 'dd MMMM yyyy', { locale: es })}</p>
        </div>
        <div className="text-right">
             <span className="text-xs uppercase font-bold text-slate-400 mb-1 block">Resultado Sesión</span>
             <div className="flex items-center gap-3">
                <span className={`text-xl font-black ${sessionSummary.net >= 0 ? 'text-orange-500' : 'text-rose-500'}`}>
                    {sessionSummary.net.toLocaleString('es-ES', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} €
                </span>
                {isOpen ? <ChevronUp className="text-slate-400"/> : <ChevronDown className="text-slate-400"/>}
             </div>
        </div>
      </div>

      {isOpen && (
        <div className="px-6 pb-8 animate-fade-in">
           {/* RESUMEN */}
           <div className="mb-8 pt-4 border-t border-slate-100">
               <h4 className="text-sm font-bold text-slate-900 mb-4">Resumen de la Sesión</h4>
               <div className="space-y-2 text-sm">
                   <div className="flex justify-between">
                       <span className="text-slate-600 font-medium">Ingresos Totales:</span>
                       <span className="font-bold text-emerald-500">{sessionSummary.totalIncome.toLocaleString('es-ES', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} €</span>
                   </div>
                   <div className="flex justify-between">
                       <span className="text-slate-600 font-medium">Gastos Directos:</span>
                       <span className="font-bold text-rose-500">{sessionSummary.directExpenses.toLocaleString('es-ES', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} €</span>
                   </div>
                   <div className="flex justify-between">
                       <span className="text-slate-600 font-medium">Coste Personal (Horas):</span>
                       <span className="font-bold text-rose-500">{sessionSummary.staffCost.toLocaleString('es-ES', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} €</span>
                   </div>
                   <div className="flex justify-between pt-2 border-t border-slate-100 mt-2">
                       <span className="text-base font-bold text-slate-900">Resultado Neto Sesión:</span>
                       <span className={`text-base font-bold ${sessionSummary.net >= 0 ? 'text-orange-500' : 'text-rose-600'}`}>
                           {sessionSummary.net.toLocaleString('es-ES', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} €
                       </span>
                   </div>
               </div>
               <div className="mt-6 text-right">
                   <button 
                        onClick={(e) => { e.stopPropagation(); onDeleteSession(date); }}
                        className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold py-2 px-4 rounded-lg flex items-center gap-2 ml-auto"
                   >
                       <Trash2 size={14} /> Eliminar Sesión Completa
                   </button>
               </div>
           </div>

           {/* ACORDEON INGRESOS */}
           <div className="border border-slate-200 rounded-lg overflow-hidden mb-4">
               <button 
                  onClick={() => setIsIncomeOpen(!isIncomeOpen)}
                  className="w-full flex justify-between items-center p-4 bg-white hover:bg-slate-50 transition-colors"
               >
                   <h4 className="font-bold text-slate-900">Ingresos de la Sesión</h4>
                   {isIncomeOpen ? <ChevronUp size={18} className="text-slate-400"/> : <ChevronDown size={18} className="text-slate-400"/>}
               </button>
               
               {isIncomeOpen && (
                   <div className="p-4 bg-white border-t border-slate-100">
                       <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                           {STATIC_INCOME_SOURCES.map(source => (
                               <div key={source}>
                                   <label className="block text-xs font-medium text-slate-600 mb-1">{source} (€)</label>
                                   <input 
                                        type="number"
                                        value={incomeValues[source]}
                                        onChange={(e) => setIncomeValues({...incomeValues, [source]: e.target.value})}
                                        className="w-full p-2 border border-slate-200 rounded-md text-slate-900 font-medium focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
                                        placeholder="0"
                                   />
                               </div>
                           ))}
                       </div>
                       <div className="flex justify-end">
                           <button 
                                onClick={handleSaveIncomes}
                                disabled={isSaving}
                                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-6 rounded-lg shadow-sm flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                           >
                               {isSaving && <Loader2 className="animate-spin" size={16} />}
                               {isSaving ? 'Guardando...' : 'Guardar Ingresos'}
                           </button>
                       </div>
                   </div>
               )}
           </div>

           {/* ACORDEON DESGLOSE DE COBRO */}
           <div className="border border-slate-200 rounded-lg overflow-hidden mb-4">
               <button 
                  onClick={() => setIsPaymentOpen(!isPaymentOpen)}
                  className="w-full flex justify-between items-center p-4 bg-white hover:bg-slate-50 transition-colors"
               >
                   <div className="flex items-center gap-2">
                       <h4 className="font-bold text-slate-900">Desglose de Cobro</h4>
                       {sessionSummary.totalIncome > 0 && Math.abs(paymentDiff) > 0.1 ? (
                           <span className="text-xs bg-rose-100 text-rose-600 px-2 py-0.5 rounded-full font-bold">Incompleto</span>
                       ) : sessionSummary.totalIncome > 0 ? (
                           <span className="text-xs bg-emerald-100 text-emerald-600 px-2 py-0.5 rounded-full font-bold">OK</span>
                       ) : null}
                   </div>
                   {isPaymentOpen ? <ChevronUp size={18} className="text-slate-400"/> : <ChevronDown size={18} className="text-slate-400"/>}
               </button>
               
               {isPaymentOpen && (
                   <div className="p-4 bg-white border-t border-slate-100">
                       <div className="mb-4">
                           <div className="flex justify-between text-xs font-medium text-slate-500 mb-1">
                               <span>Justificado: {currentPaymentTotal.toLocaleString('es-ES', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} €</span>
                               <span>Total Ingresos: {sessionSummary.totalIncome.toLocaleString('es-ES', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} €</span>
                           </div>
                           <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                               <div 
                                    className={`bg-indigo-600 h-2.5 rounded-full transition-all duration-500`} 
                                    style={{ width: `${Math.min((currentPaymentTotal / (sessionSummary.totalIncome || 1)) * 100, 100)}%` }}
                                ></div>
                           </div>
                           {sessionSummary.totalIncome === 0 && (
                               <p className="text-xs text-amber-500 mt-1">Registra primero los ingresos en la sección superior.</p>
                           )}
                       </div>

                       <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                           <div>
                               <label className="block text-xs font-medium text-slate-600 mb-1 flex items-center gap-1">
                                   <Coins size={12} /> Efectivo (€)
                               </label>
                               <input 
                                    type="number"
                                    value={paymentValues.cash}
                                    onChange={(e) => handlePaymentChange('cash', e.target.value)}
                                    disabled={sessionSummary.totalIncome === 0}
                                    className="w-full p-2 border border-slate-200 rounded-md text-slate-900 font-medium focus:ring-2 focus:ring-indigo-500 outline-none bg-white disabled:bg-slate-50 disabled:cursor-not-allowed"
                                    placeholder="0"
                               />
                           </div>
                           <div>
                               <label className="block text-xs font-medium text-slate-600 mb-1 flex items-center gap-1">
                                   <CreditCard size={12} /> Tarjeta (€)
                               </label>
                               <input 
                                    type="number"
                                    value={paymentValues.card}
                                    onChange={(e) => handlePaymentChange('card', e.target.value)}
                                    disabled={sessionSummary.totalIncome === 0}
                                    className="w-full p-2 border border-slate-200 rounded-md text-slate-900 font-medium focus:ring-2 focus:ring-indigo-500 outline-none bg-white disabled:bg-slate-50 disabled:cursor-not-allowed"
                                    placeholder="0"
                               />
                           </div>
                           <div>
                               <label className="block text-xs font-medium text-slate-600 mb-1 flex items-center gap-1">
                                   <ArrowRightLeft size={12} /> Transferencia (€)
                               </label>
                               <input 
                                    type="number"
                                    value={paymentValues.transfer}
                                    onChange={(e) => handlePaymentChange('transfer', e.target.value)}
                                    disabled={sessionSummary.totalIncome === 0}
                                    className="w-full p-2 border border-slate-200 rounded-md text-slate-900 font-medium focus:ring-2 focus:ring-indigo-500 outline-none bg-white disabled:bg-slate-50 disabled:cursor-not-allowed"
                                    placeholder="0"
                               />
                           </div>
                       </div>
                       <div className="flex justify-between items-center">
                           <span className="text-xs font-bold text-slate-500">
                               {paymentDiff > 0.01 
                                ? `Faltan ${paymentDiff.toLocaleString('es-ES', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} € por asignar` 
                                : 'Desglose completo'}
                           </span>
                           <button 
                                onClick={handleSavePayments}
                                disabled={sessionSummary.totalIncome === 0 || isSaving}
                                className="bg-slate-800 hover:bg-slate-900 text-white font-bold py-2 px-6 rounded-lg shadow-sm disabled:opacity-50 flex items-center gap-2"
                           >
                               {isSaving && <Loader2 className="animate-spin" size={16} />}
                               Guardar Cobros
                           </button>
                       </div>
                   </div>
               )}
           </div>

           {/* ACORDEON GASTOS DIRECTOS */}
           <div className="border border-slate-200 rounded-lg overflow-hidden mb-4">
               <button 
                  onClick={() => setIsExpenseOpen(!isExpenseOpen)}
                  className="w-full flex justify-between items-center p-4 bg-white hover:bg-slate-50 transition-colors"
               >
                   <h4 className="font-bold text-slate-900">Gastos Directos (Caja)</h4>
                   {isExpenseOpen ? <ChevronUp size={18} className="text-slate-400"/> : <ChevronDown size={18} className="text-slate-400"/>}
               </button>

               {isExpenseOpen && (
                   <div className="p-4 bg-white border-t border-slate-100">
                       <div className="flex flex-col md:flex-row gap-3 mb-6 items-end bg-slate-50 p-3 rounded-lg border border-slate-100">
                           <div className="flex-1 w-full">
                               <label className="block text-xs font-medium text-slate-600 mb-1">Descripción</label>
                               <input 
                                    type="text" 
                                    placeholder="Ej: Hielo" 
                                    value={expenseDesc}
                                    onChange={(e) => setExpenseDesc(e.target.value)}
                                    className="w-full p-2 border border-slate-200 rounded-md bg-white"
                               />
                           </div>
                           <div className="w-full md:w-32">
                               <label className="block text-xs font-medium text-slate-600 mb-1">Importe (€)</label>
                               <input 
                                    type="number" 
                                    placeholder="0.00" 
                                    value={expenseAmount}
                                    onChange={(e) => setExpenseAmount(e.target.value)}
                                    className="w-full p-2 border border-slate-200 rounded-md bg-white"
                               />
                           </div>
                           <button 
                                onClick={handleAddExpense}
                                className="bg-indigo-600 hover:bg-indigo-700 text-white p-2.5 rounded-md"
                           >
                               <Plus size={18} />
                           </button>
                       </div>

                       <div className="space-y-2">
                           {transactions.filter(t => t.category === Category.GASTO_CAJA && t.type === TransactionType.EXPENSE).length === 0 && (
                               <p className="text-center text-slate-400 text-xs py-2 italic">Sin gastos directos</p>
                           )}
                           {transactions.filter(t => t.category === Category.GASTO_CAJA && t.type === TransactionType.EXPENSE).map(t => (
                               <div key={t.id} className="flex justify-between items-center p-2 bg-slate-50 rounded border border-slate-100 text-sm">
                                   <span className="text-slate-700 font-medium">{t.description}</span>
                                   <div className="flex items-center gap-3">
                                        <span className="font-bold text-rose-600">-{t.amount.toLocaleString('es-ES', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} €</span>
                                        <button onClick={() => onDeleteTransaction(t.id)} className="text-slate-300 hover:text-rose-500"><Trash2 size={14}/></button>
                                   </div>
                               </div>
                           ))}
                       </div>
                   </div>
               )}
           </div>

           {/* ACORDEON PERSONAL */}
           <div className="border border-slate-200 rounded-lg overflow-hidden">
               <button 
                  onClick={() => setIsStaffOpen(!isStaffOpen)}
                  className="w-full flex justify-between items-center p-4 bg-white hover:bg-slate-50 transition-colors"
               >
                   <h4 className="font-bold text-slate-900">Horas de Personal</h4>
                   {isStaffOpen ? <ChevronUp size={18} className="text-slate-400"/> : <ChevronDown size={18} className="text-slate-400"/>}
               </button>

               {isStaffOpen && (
                   <div className="p-4 bg-white border-t border-slate-100">
                       {hourlyEmployees.length === 0 ? (
                           <p className="text-slate-400 text-center py-4 italic text-sm">No hay personal por horas registrado.</p>
                       ) : (
                           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                               {hourlyEmployees.map(emp => {
                                   // Check if there is already a transaction for this employee in this session
                                   const existingT = transactions.find(t => 
                                       t.category === Category.PERSONAL_HORAS && 
                                       t.description.startsWith(emp.name)
                                   );
                                   
                                   // Calculate hours from amount if exists, or empty
                                   // Logic: amount = hours * cost => hours = amount / cost
                                   const currentHours = existingT ? (existingT.amount / emp.cost).toFixed(1).replace(/[.,]00$/, '') : '';
                                   const currentCost = existingT ? existingT.amount : 0;

                                   return (
                                       <div key={emp.id} className="bg-slate-50 p-3 rounded-lg border border-slate-100 flex items-center justify-between">
                                           <div className="flex-1">
                                               <p className="font-bold text-slate-700 text-sm">{emp.name}</p>
                                               <p className="text-xs text-slate-500">{emp.cost.toLocaleString('es-ES', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} €/h</p>
                                           </div>
                                           <div className="flex items-center gap-3">
                                               <div className="w-20">
                                                   <input 
                                                       type="number" 
                                                       placeholder="0 h"
                                                       value={currentHours}
                                                       onChange={(e) => handleUpdateHourlyStaff(emp, e.target.value)}
                                                       className="w-full p-2 text-right border border-slate-200 rounded-md bg-white focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-bold"
                                                   />
                                               </div>
                                               <div className="w-24 text-right">
                                                   <span className={`font-black text-sm ${currentCost > 0 ? 'text-rose-600' : 'text-slate-300'}`}>
                                                       {currentCost.toLocaleString('es-ES', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} €
                                                   </span>
                                               </div>
                                           </div>
                                       </div>
                                   );
                               })}
                           </div>
                       )}
                       <div className="mt-4 pt-3 border-t border-slate-100 flex justify-between items-center text-sm">
                           <span className="font-bold text-slate-500">Total Personal Sesión</span>
                           <span className="font-black text-rose-600">{sessionSummary.staffCost.toLocaleString('es-ES', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} €</span>
                       </div>
                   </div>
               )}
           </div>

        </div>
      )}
    </div>
  );
};

const App: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [fixedExpenses, setFixedExpenses] = useState<FixedExpenseItem[]>([]);
  const [activeView, setActiveView] = useState<ViewType>('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  const [dashboardMonth, setDashboardMonth] = useState(format(new Date(), 'yyyy-MM'));
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());

  const [newSessionDate, setNewSessionDate] = useState(new Date().toISOString().split('T')[0]);
  const [newSessionDesc, setNewSessionDesc] = useState('');
  const [isCajaHistoryOpen, setIsCajaHistoryOpen] = useState(true);
  const [isAddSessionOpen, setIsAddSessionOpen] = useState(true);
  
  const [isEmployeeFormOpen, setIsEmployeeFormOpen] = useState(false); // Used for accordion style
  const [isEmployeeListOpen, setIsEmployeeListOpen] = useState(false); // Default collapsed as requested

  const [newEmployee, setNewEmployee] = useState<Partial<Employee>>({ active: true });
  const [employeeFormTab, setEmployeeFormTab] = useState<'FIXED' | 'HOURLY'>('FIXED');
  const [employeeViewTab, setEmployeeViewTab] = useState<'FIXED' | 'HOURLY'>('FIXED');

  const [supplierViewMode, setSupplierViewMode] = useState<'SUMMARY' | 'MANAGE' | 'ADD_EXPENSE'>('SUMMARY');
  const [newSupplierName, setNewSupplierName] = useState('');
  const [supplierExpenseForm, setSupplierExpenseForm] = useState<{
      supplierName: string;
      description: string;
      amount: string;
      date: string;
      category: Category | string;
  }>({
      supplierName: '',
      description: '',
      amount: '',
      date: new Date().toISOString().split('T')[0],
      category: Category.PROVEEDORES_VARIOS
  });

  const [structureViewMode, setStructureViewMode] = useState<'SUMMARY' | 'MANAGE' | 'ADD_EXPENSE'>('SUMMARY');
  const [newFixedExpenseName, setNewFixedExpenseName] = useState('');
  const [structureExpenseForm, setStructureExpenseForm] = useState<{
      id?: string;
      name: string;
      category: Category | string;
      amount: string;
      date: string;
  }>({
      name: '',
      category: Category.ALQUILER,
      amount: '',
      date: new Date().toISOString().split('T')[0]
  });

  const [isDbConfigOpen, setIsDbConfigOpen] = useState(false);
  const [dbConnectionStatus, setDbConnectionStatus] = useState(getStoredConnectionStatus());

  useEffect(() => {
    setDbConnectionStatus(getStoredConnectionStatus());
    const fetchData = async () => {
      setTransactions(await getTransactions());
      setEmployees(await getEmployees());
      setSuppliers(await getSuppliers());
      setFixedExpenses(await getFixedExpenses());
    };
    fetchData();
  }, []);

  const handleError = (error: any) => {
      if (error?.message === "DB_NOT_CONNECTED") {
          setIsDbConfigOpen(true);
      } else {
          alert("Error de operación. Verifica la consola. (Si es tu primera vez, abre el menú de DB e Inicializa las tablas)");
          console.error(error);
      }
  };

  const handleSaveTransaction = async (t: Transaction) => {
    try {
      const updated = await saveTransaction(t);
      setTransactions(updated);
    } catch (error) {
      handleError(error);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('¿Estás seguro de eliminar esta transacción?')) {
      try {
        const updated = await deleteTransaction(id);
        setTransactions(updated);
      } catch (error) {
        handleError(error);
      }
    }
  };

  const handleCreateSession = () => {
    if (!newSessionDesc) {
        alert("Por favor, introduce una descripción para la sesión.");
        return;
    }
    const initTransaction: Transaction = {
        id: crypto.randomUUID(),
        date: newSessionDate,
        amount: 0,
        description: newSessionDesc, 
        category: Category.VENTA_DIARIA,
        type: TransactionType.INCOME
    };
    handleSaveTransaction(initTransaction);
    setNewSessionDesc('');
    // Don't alert on success, cleaner UI
  };

  const exportToCSV = () => {
      const headers = ['ID', 'Fecha', 'Tipo', 'Categoría', 'Descripción', 'Proveedor', 'Monto'];
      const rows = transactions.map(t => [
          t.id,
          t.date,
          t.type,
          t.category,
          `"${t.description}"`,
          t.supplier || '',
          t.amount
      ]);
      const csvContent = "data:text/csv;charset=utf-8," + headers.join(",") + "\n" + rows.map(e => e.join(",")).join("\n");
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `transacciones_${format(new Date(), 'yyyy-MM-dd')}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
  };

  const handleSaveEmployee = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!newEmployee.name || !newEmployee.cost) return;
      const emp: Employee = {
          id: newEmployee.id || crypto.randomUUID(),
          name: newEmployee.name,
          type: employeeFormTab,
          cost: Number(newEmployee.cost),
          extras: newEmployee.extras ? Number(newEmployee.extras) : undefined,
          active: true
      };
      
      try {
        const updated = await saveEmployee(emp);
        setEmployees(updated);
        setIsEmployeeFormOpen(false); // Close accordion on save
        setNewEmployee({ active: true }); 
      } catch (error) {
        handleError(error);
      }
  };

  const startEditingEmployee = (emp: Employee) => {
      setNewEmployee(emp);
      setEmployeeFormTab(emp.type);
      setIsEmployeeFormOpen(true);
      window.scrollTo({ top: 0, behavior: 'smooth' }); 
  };

  const cancelEditingEmployee = () => {
      setNewEmployee({ active: true });
      setIsEmployeeFormOpen(false);
  };

  const handleDeleteEmployee = async (id: string) => {
      if(window.confirm('¿Eliminar empleado? Esto no borrará sus registros históricos.')) {
          try {
            const updated = await deleteEmployee(id);
            setEmployees(updated);
            if (newEmployee.id === id) {
                setNewEmployee({ active: true });
            }
          } catch (error) {
             handleError(error);
          }
      }
  };

  const handleAddSupplier = async () => {
      if (!newSupplierName.trim()) return;
      try {
        const updated = await saveSupplier({ id: crypto.randomUUID(), name: newSupplierName });
        setSuppliers(updated);
        setNewSupplierName('');
      } catch (error) {
         handleError(error);
      }
  };

  const handleDeleteSupplier = async (id: string) => {
      if(window.confirm('¿Eliminar proveedor de la lista?')) {
          try {
            const updated = await deleteSupplier(id);
            setSuppliers(updated);
          } catch (error) {
             handleError(error);
          }
      }
  };

  const handleSaveSupplierExpense = () => {
      if (!supplierExpenseForm.amount || !supplierExpenseForm.supplierName || !supplierExpenseForm.description) return;
      const t: Transaction = {
          id: crypto.randomUUID(),
          date: supplierExpenseForm.date,
          amount: parseFloat(supplierExpenseForm.amount),
          description: supplierExpenseForm.description,
          supplier: supplierExpenseForm.supplierName,
          category: supplierExpenseForm.category as Category,
          type: TransactionType.EXPENSE
      };
      handleSaveTransaction(t);
      setSupplierViewMode('SUMMARY');
      setSupplierExpenseForm({
          supplierName: '',
          description: '',
          amount: '',
          date: new Date().toISOString().split('T')[0],
          category: Category.PROVEEDORES_VARIOS
      });
  };

  const handleAddFixedExpense = async () => {
      if (!newFixedExpenseName.trim()) return;
      try {
        const updated = await saveFixedExpense({ 
            id: crypto.randomUUID(), 
            name: newFixedExpenseName, 
            defaultCategory: Category.ALQUILER 
        });
        setFixedExpenses(updated);
        setNewFixedExpenseName('');
      } catch (error) {
         handleError(error);
      }
  };

  const handleDeleteFixedExpense = async (id: string) => {
      if(window.confirm('¿Eliminar concepto de la lista?')) {
          try {
            const updated = await deleteFixedExpense(id);
            setFixedExpenses(updated);
          } catch (error) {
             handleError(error);
          }
      }
  };

  const startEditingStructure = (t: Transaction) => {
      setStructureExpenseForm({
          id: t.id,
          name: t.description,
          amount: t.amount.toString(),
          date: t.date,
          category: t.category
      });
      setStructureViewMode('ADD_EXPENSE');
      window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSaveStructureExpense = () => {
      if(!structureExpenseForm.name || !structureExpenseForm.amount) return;
      const t: Transaction = {
          id: structureExpenseForm.id || crypto.randomUUID(),
          date: structureExpenseForm.date,
          amount: parseFloat(structureExpenseForm.amount),
          description: structureExpenseForm.name,
          category: structureExpenseForm.category as Category,
          type: TransactionType.EXPENSE
      };
      handleSaveTransaction(t);
      setStructureViewMode('SUMMARY');
      setStructureExpenseForm({
          id: undefined,
          name: '',
          category: Category.ALQUILER,
          amount: '',
          date: new Date().toISOString().split('T')[0]
      });
  };

  const validTransactions = useMemo(() => {
      return transactions.filter(t => t.category !== Category.DESGLOSE_PAGO);
  }, [transactions]);
  
  const dashboardData = useMemo(() => {
    const selectedDate = parseISO(dashboardMonth + '-01'); 
    return validTransactions.filter(t => isSameMonth(parseISO(t.date), selectedDate));
  }, [validTransactions, dashboardMonth]);

  const dashboardSummary = useMemo(() => calculateSummary(dashboardData), [dashboardData]);

  const breakdownData = useMemo(() => {
    let estructura = 0;
    let proveedores = 0;
    let personalFijo = 0;
    let personalHoras = 0;
    let sesion = 0;
    let totalExpensesInBreakdown = 0;

    dashboardData.forEach(t => {
      if (t.type === TransactionType.EXPENSE) {
        if (CATEGORIES_BY_SECTION.ESTRUCTURA.includes(t.category as Category)) {
          estructura += t.amount;
        } else if (CATEGORIES_BY_SECTION.PROVEEDORES.includes(t.category as Category)) {
          proveedores += t.amount;
        } else if (t.category === Category.PERSONAL_HORAS) {
          personalHoras += t.amount;
        } else if (t.category === Category.NOMINA_FIJA || t.category === Category.SEGURIDAD_SOCIAL) {
          personalFijo += t.amount;
        } else if (t.category === Category.GASTO_CAJA) {
          sesion += t.amount;
        }
        totalExpensesInBreakdown += t.amount;
      }
    });

    // Fixed list of items, no filtering of 0 values, fixed order
    // Renamed 'Gastos de Estructura' to 'Estructura'
    const items = [
      { category: 'Estructura', amount: estructura, colorClass: 'bg-emerald-500' },
      { category: 'Proveedores', amount: proveedores, colorClass: 'bg-blue-500' },
      { category: 'Personal Fijo', amount: personalFijo, colorClass: 'bg-purple-600' },
      { category: 'Personal Horas', amount: personalHoras, colorClass: 'bg-purple-400' },
      { category: 'Gastos Caja', amount: sesion, colorClass: 'bg-slate-500' },
    ].map(item => ({
        ...item,
        percentage: dashboardSummary.totalIncome > 0
          ? (item.amount / dashboardSummary.totalIncome) * 100
          : 0
    }));

    return { items, totalExpensesInBreakdown };
  }, [dashboardData, dashboardSummary.totalIncome]);

  const annualData = useMemo(() => {
    return validTransactions.filter(t => t.date.startsWith(selectedYear));
  }, [validTransactions, selectedYear]);

  const annualSummary = useMemo(() => calculateSummary(annualData), [annualData]);

  const getFilteredTransactions = () => {
    switch (activeView) {
      case 'caja':
        return transactions.filter(t => 
          CATEGORIES_BY_SECTION.CAJA.includes(t.category as Category) || 
          t.category === Category.PERSONAL_HORAS ||
          t.category === Category.DESGLOSE_PAGO 
        );
      case 'personal':
        return validTransactions.filter(t => CATEGORIES_BY_SECTION.PERSONAL.includes(t.category as Category));
      case 'proveedores':
        return validTransactions.filter(t => CATEGORIES_BY_SECTION.PROVEEDORES.includes(t.category as Category));
      case 'estructura':
        return validTransactions.filter(t => CATEGORIES_BY_SECTION.ESTRUCTURA.includes(t.category as Category));
      case 'anual':
        return annualData;
      default:
        return validTransactions;
    }
  };

  const currentList = getFilteredTransactions();
  const viewSummary = useMemo(() => {
      const cleanList = currentList.filter(t => t.category !== Category.DESGLOSE_PAGO);
      return calculateSummary(cleanList);
  }, [currentList]);

  const expensesBySupplier = useMemo(() => {
      if (activeView !== 'proveedores') return [];
      const supplierTotals: Record<string, number> = {};
      currentList.forEach(t => {
          if(t.type === TransactionType.EXPENSE) {
              const name = t.supplier || 'Otros';
              supplierTotals[name] = (supplierTotals[name] || 0) + t.amount;
          }
      });
      return Object.entries(supplierTotals)
          .map(([name, amount]) => ({ name, amount }))
          .sort((a,b) => b.amount - a.amount);
  }, [currentList, activeView]);

  const expensesByConcept = useMemo(() => {
    if (activeView !== 'estructura') return [];
    const conceptTotals: Record<string, number> = {};
    currentList.forEach(t => {
        if(t.type === TransactionType.EXPENSE) {
            const name = t.description || 'Otros';
            conceptTotals[name] = (conceptTotals[name] || 0) + t.amount;
        }
    });
    return Object.entries(conceptTotals)
        .map(([name, amount]) => ({ name, amount }))
        .sort((a,b) => b.amount - a.amount);
  }, [currentList, activeView]);

  const cajaMetrics = useMemo(() => {
    const cleanTransactions = transactions.filter(t => t.category !== Category.DESGLOSE_PAGO);
    const cajaDates = new Set<string>();
    cleanTransactions.forEach(t => {
        if (CATEGORIES_BY_SECTION.CAJA.includes(t.category as Category)) {
            cajaDates.add(t.date);
        }
    });
    const sortedUniqueDates = Array.from(cajaDates).sort((a, b) => b.localeCompare(a));
    const sessionCount = cajaDates.size;
    
    // Logic for "Caja View": Exclude Fixed Costs AND Suppliers to show purely "Cashbox" performance
    const variableTransactions = cleanTransactions.filter(t => {
        const isFixedCost = 
            CATEGORIES_BY_SECTION.ESTRUCTURA.includes(t.category as Category) || 
            t.category === Category.NOMINA_FIJA;
        const isProvider = CATEGORIES_BY_SECTION.PROVEEDORES.includes(t.category as Category);
        
        return !isFixedCost && !isProvider;
    });
    
    const variableSummary = calculateSummary(variableTransactions);
    const totalNet = calculateSummary(cleanTransactions).netBalance;

    return {
        sessionCount,
        accumulatedNet: variableSummary.netBalance,
        totalNet,
        sortedUniqueDates
    };
  }, [transactions]);

  // Personal View Calculations
  const personalStats = useMemo(() => {
      const totalEmployees = employees.length;
      
      // Calculate Fixed Costs (Sum of fixed salaries in config)
      const monthlyFixedCost = employees
          .filter(e => e.type === 'FIXED')
          .reduce((acc, curr) => acc + curr.cost + (curr.extras || 0), 0);
          
      // Calculate Variable Costs (Actual expense transactions this month for 'PERSONAL_HORAS')
      const selectedMonth = dashboardMonth;
      const monthTransactions = validTransactions.filter(t => t.date.startsWith(selectedMonth));
      
      const variableCost = monthTransactions
          .filter(t => t.category === Category.PERSONAL_HORAS)
          .reduce((acc, t) => acc + t.amount, 0);

      return { totalEmployees, monthlyFixedCost, variableCost };
  }, [employees, validTransactions, dashboardMonth]);

  const renderNavButton = (view: ViewType, label: string) => (
    <button 
      onClick={() => { 
          setActiveView(view); 
          setMobileMenuOpen(false); 
          setSupplierViewMode('SUMMARY');
          setStructureViewMode('SUMMARY');
      }}
      className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all w-full md:w-auto ${
        activeView === view 
          ? 'bg-indigo-600 text-white shadow-md' 
          : 'bg-white text-slate-600 hover:bg-slate-50 border border-transparent hover:border-slate-200'
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="min-h-screen bg-[#f3f4f6] text-slate-900 font-sans pb-24 md:pb-10">
      <DbConfigModal isOpen={isDbConfigOpen} onClose={() => setIsDbConfigOpen(false)} />
      
      <header className="bg-white sticky top-0 z-40 shadow-sm border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <h1 className="text-2xl font-black text-slate-800 tracking-tight text-indigo-700">
              Panel de Finanzas
            </h1>
            <div className="hidden md:flex items-center space-x-2 bg-slate-100 p-1.5 rounded-xl">
              {renderNavButton('dashboard', 'Dashboard')}
              {renderNavButton('caja', 'Caja')}
              {renderNavButton('personal', 'Personal')}
              {renderNavButton('proveedores', 'Proveedores')}
              {renderNavButton('estructura', 'Estructura')}
              {renderNavButton('anual', 'Anual')}
            </div>
            <div className="flex items-center space-x-2">
               <button 
                    onClick={() => setIsDbConfigOpen(true)}
                    className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                    title="Configuración Base de Datos"
               >
                    <Database size={20} />
               </button>
               <button onClick={() => window.location.reload()} className="text-slate-400 hover:text-slate-600 p-2 hover:bg-slate-50 rounded-lg transition-all">
                  <RefreshCw size={20} />
               </button>
              <div className="md:hidden">
                <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="text-slate-500 hover:text-slate-800 p-2">
                  {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                </button>
              </div>
            </div>
          </div>
        </div>
        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-t border-slate-100 animate-fade-in absolute w-full z-50 shadow-xl">
            <div className="px-4 py-4 space-y-2">
              {renderNavButton('dashboard', 'Dashboard')}
              {renderNavButton('caja', 'Caja')}
              {renderNavButton('personal', 'Personal')}
              {renderNavButton('proveedores', 'Proveedores')}
              {renderNavButton('estructura', 'Estructura')}
              {renderNavButton('anual', 'Anual')}
            </div>
          </div>
        )}
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {!dbConnectionStatus.isConnected && (
            <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-r-lg shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4 animate-fade-in">
                <div className="flex items-start gap-3">
                    <AlertTriangle className="text-amber-500 flex-shrink-0" />
                    <div>
                        <h3 className="font-bold text-amber-900">Base de datos no conectada</h3>
                        <p className="text-sm text-amber-800">Tus datos no se están guardando permanentemente. Para asegurar la persistencia, conecta una base de datos Neon.</p>
                    </div>
                </div>
                <button 
                    onClick={() => setIsDbConfigOpen(true)}
                    className="bg-amber-600 text-white px-4 py-2 rounded-lg font-bold text-sm hover:bg-amber-700 transition-colors shadow-sm whitespace-nowrap"
                >
                    Conectar Ahora
                </button>
            </div>
        )}

        {activeView === 'dashboard' && (
          <div className="space-y-8 animate-fade-in">
             <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex items-center gap-4">
                    <h2 className="text-2xl font-black text-slate-800 uppercase tracking-wide">
                        {format(parseISO(dashboardMonth + '-01'), 'MMMM yyyy', { locale: es })}
                    </h2>
                </div>
                <div className="bg-white border border-slate-300 rounded-lg flex items-center px-4 py-2 shadow-sm hover:border-slate-400 transition-colors">
                    <Calendar className="text-slate-400 mr-2" size={18} />
                    <input 
                        type="month" 
                        value={dashboardMonth}
                        onChange={(e) => setDashboardMonth(e.target.value)}
                        className="bg-transparent border-none focus:ring-0 text-slate-700 font-medium text-sm outline-none"
                    />
                </div>
             </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <SummaryCard title="Ingresos Totales" amount={dashboardSummary.totalIncome} icon={TrendingUp} variant="income" subtitle="Sin datos del mes anterior" />
              <SummaryCard title="Gastos Totales" amount={dashboardSummary.totalExpense} icon={TrendingDown} variant="expense" subtitle="Coste total del mes" />
              <SummaryCard title="Beneficio Neto" amount={dashboardSummary.netBalance} icon={Scale} variant="balance" subtitle="Resultado del mes" />
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8">
               <div className="flex items-center gap-3 mb-2">
                  <PieChartIcon className="text-indigo-500" size={24} />
                  <h3 className="text-xl font-bold text-slate-900">Desglose de Gastos</h3>
               </div>
               <p className="text-slate-500 text-sm mb-8">Los porcentajes en la lista se calculan en base a los ingresos totales del mes.</p>

               <div className="space-y-6">
                 {breakdownData.items.length === 0 ? (
                    <p className="text-slate-400 text-center py-8">No hay gastos registrados en este periodo.</p>
                 ) : (
                    breakdownData.items.map((item) => (
                        <div key={item.category} className="flex items-center justify-between group">
                            <div className="flex items-center gap-4">
                                <div className={`w-3 h-3 rounded-full ${item.colorClass}`}></div>
                                <span className="font-medium text-slate-700 text-sm md:text-base">{item.category}</span>
                            </div>
                            <div className="flex-1 mx-4 sm:mx-8 hidden sm:block">
                                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                                    <div 
                                        className={`h-full rounded-full opacity-50 ${item.colorClass}`} 
                                        style={{ width: `${Math.min(item.percentage, 100)}%` }}
                                    ></div>
                                </div>
                            </div>
                            <div className="flex items-center gap-4 text-sm md:text-base">
                                <span className="font-bold text-slate-800">{item.amount.toLocaleString('es-ES', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} €</span>
                                <span className="text-slate-500 w-16 text-right">({item.percentage.toFixed(1)}%)</span>
                            </div>
                        </div>
                    ))
                 )}
               </div>
               <div className="mt-8 pt-6 border-t border-slate-100 flex justify-between items-center">
                   <span className="text-lg font-bold text-slate-900">Coste Total del Desglose</span>
                   <span className="text-xl font-black text-slate-900">{breakdownData.totalExpensesInBreakdown.toLocaleString('es-ES', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} €</span>
               </div>
            </div>
          </div>
        )}

        {activeView === 'anual' && (
          <div className="space-y-8 animate-fade-in">
             <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex items-center gap-4">
                    <h2 className="text-2xl font-black text-slate-800 uppercase tracking-wide">
                        Resumen Anual {selectedYear}
                    </h2>
                </div>
                <div className="bg-white border border-slate-300 rounded-lg flex items-center px-4 py-2 shadow-sm hover:border-slate-400 transition-colors">
                    <Calendar className="text-slate-400 mr-2" size={18} />
                    <select
                        value={selectedYear}
                        onChange={(e) => setSelectedYear(e.target.value)}
                        className="bg-transparent border-none focus:ring-0 text-slate-700 font-medium text-sm outline-none cursor-pointer"
                    >
                        {Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - 5 + i).reverse().map(year => (
                            <option key={year} value={year}>{year}</option>
                        ))}
                    </select>
                </div>
             </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <SummaryCard title="Ingresos Anuales" amount={annualSummary.totalIncome} icon={TrendingUp} variant="income" subtitle={`Total acumulado ${selectedYear}`} />
              <SummaryCard title="Gastos Anuales" amount={annualSummary.totalExpense} icon={TrendingDown} variant="expense" subtitle={`Total acumulado ${selectedYear}`} />
              <SummaryCard title="Beneficio Neto Anual" amount={annualSummary.netBalance} icon={Scale} variant="balance" subtitle={`Resultado ${selectedYear}`} />
            </div>
          </div>
        )}

        {activeView === 'caja' && (
          <div className="space-y-6 animate-fade-in">
             <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <h2 className="text-2xl font-black text-slate-900">Caja y Sesiones de Trabajo</h2>
                <button 
                  onClick={exportToCSV}
                  className="bg-slate-500 hover:bg-slate-600 text-white px-4 py-2 rounded-lg font-bold shadow-sm transition-all flex items-center gap-2"
                >
                  <Download size={18} />
                  Exportar a CSV
                </button>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex items-center gap-4">
                    <div className="p-3 bg-white rounded-lg border border-slate-100 shadow-sm">
                        <FileText className="text-indigo-500" size={32} />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-slate-500 mb-1">Nº de Sesiones Registradas</p>
                        <h3 className="text-4xl font-black text-slate-900">{cajaMetrics.sessionCount}</h3>
                    </div>
                </div>
                
                <div className="bg-[#f0fdf4] p-6 rounded-xl shadow-sm border border-emerald-100 flex items-center gap-4">
                    <div className="p-3 bg-emerald-100 rounded-lg">
                        <BadgeDollarSign className="text-emerald-600" size={32} />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-emerald-800 mb-1">Resultado Neto Acumulado (Sin costes fijos)</p>
                        <h3 className="text-3xl font-black text-emerald-600">
                            {cajaMetrics.accumulatedNet.toLocaleString('es-ES', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} €
                        </h3>
                        <p className="text-xs text-emerald-600/80 font-bold mt-1">Neto con costes fijos: {cajaMetrics.totalNet.toLocaleString('es-ES', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} €</p>
                    </div>
                </div>
             </div>

             <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                 <button 
                    onClick={() => setIsAddSessionOpen(!isAddSessionOpen)}
                    className="w-full flex justify-between items-center p-6 hover:bg-slate-50 transition-colors"
                 >
                    <h3 className="text-lg font-bold text-slate-900">Añadir Nueva Sesión de Trabajo</h3>
                    {isAddSessionOpen ? <ChevronUp className="text-slate-400" /> : <ChevronDown className="text-slate-400" />}
                 </button>

                 {isAddSessionOpen && (
                    <div className="p-6 pt-0">
                        <div className="flex flex-col md:flex-row items-end gap-4">
                            <div className="flex-1 w-full">
                                <label className="block text-sm font-medium text-slate-700 mb-2">Descripción de la Sesión</label>
                                <input 
                                    type="text"
                                    placeholder="Ej: Sábado Noche"
                                    value={newSessionDesc}
                                    onChange={(e) => setNewSessionDesc(e.target.value)}
                                    className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-slate-50"
                                />
                            </div>
                            <div className="w-full md:w-auto">
                                <label className="block text-sm font-medium text-slate-700 mb-2 text-right">Fecha</label>
                                <input 
                                    type="date"
                                    value={newSessionDate}
                                    onChange={(e) => setNewSessionDate(e.target.value)}
                                    className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white text-center font-bold text-slate-800"
                                />
                            </div>
                            <button 
                                onClick={handleCreateSession}
                                className="w-full md:w-auto bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg font-bold shadow-md transition-all flex items-center justify-center gap-2 min-w-[160px]"
                            >
                                <Plus size={20} />
                                Añadir Sesión
                            </button>
                        </div>
                        <div className="mt-4 flex items-center gap-2 text-xs text-slate-500">
                            <Info size={14} />
                            <span>Primero crea una sesión. Luego, haz clic en ella para desplegar las opciones y añadir ingresos, gastos y horas de personal para esa fecha. Los cambios se guardan automáticamente.</span>
                        </div>
                    </div>
                 )}
             </div>

             <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden min-h-[300px]">
                 <div className="flex justify-between items-center p-6 border-b border-slate-100">
                     <h3 className="text-lg font-bold text-slate-900">Historial de Sesiones</h3>
                     <button onClick={() => setIsCajaHistoryOpen(!isCajaHistoryOpen)} className="text-slate-400 hover:text-slate-600">
                        {isCajaHistoryOpen ? <ChevronUp /> : <ChevronDown />}
                     </button>
                 </div>
                 
                 {isCajaHistoryOpen && (
                     <div className="bg-white">
                        {cajaMetrics.sortedUniqueDates.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-16 text-center">
                                <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mb-4">
                                    <FileText className="text-slate-300" size={32} />
                                </div>
                                <h4 className="text-slate-900 font-bold mb-1">No hay sesiones</h4>
                                <p className="text-slate-500 text-sm">Añade una nueva sesión para empezar a llevar el control de caja.</p>
                            </div>
                        ) : (
                            cajaMetrics.sortedUniqueDates.map(date => {
                                // Find the "Title" transaction. It should be a VENTA_DIARIA but NOT one of the static income inputs.
                                const sessionTitleTransaction = transactions.find(t => 
                                    t.date === date && 
                                    !STATIC_INCOME_SOURCES.includes(t.description) && // Important: Exclude standard inputs
                                    t.category === Category.VENTA_DIARIA
                                );
                                
                                const desc = sessionTitleTransaction ? sessionTitleTransaction.description : `Sesión ${format(parseISO(date), 'dd/MM')}`;
                                
                                return (
                                    <SessionEditor 
                                        key={date}
                                        date={date}
                                        description={desc}
                                        transactions={transactions.filter(t => t.date === date)}
                                        employees={employees}
                                        onSaveTransaction={handleSaveTransaction}
                                        onDeleteTransaction={async (id) => {
                                            if(window.confirm('¿Eliminar esta transacción?')) {
                                               await deleteTransaction(id);
                                               setTransactions(await getTransactions());
                                            }
                                        }}
                                        onDeleteSession={async (d) => {
                                            if(window.confirm('¿Borrar toda la sesión y sus datos asociados?')) {
                                                const toDelete = transactions.filter(t => t.date === d);
                                                try {
                                                    for(const t of toDelete) {
                                                       await deleteTransaction(t.id);
                                                    }
                                                    setTransactions(await getTransactions());
                                                } catch (e) {
                                                    handleError(e);
                                                }
                                            }
                                        }}
                                    />
                                );
                            })
                        )}
                     </div>
                 )}
             </div>
          </div>
        )}

        {/* ... Rest of existing components/views (Personal, Proveedores, Estructura) ... */}
        {activeView === 'personal' && (
            <div className="space-y-6 animate-fade-in">
                 <div className="flex justify-between items-center">
                    <h2 className="text-2xl font-black text-slate-900">Gestión de Personal</h2>
                    <button 
                      onClick={exportToCSV}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg font-bold shadow-sm transition-all flex items-center gap-2"
                    >
                      <Download size={18} />
                      Exportar a CSV
                    </button>
                 </div>

                 {/* KPI CARDS for Personal */}
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-center gap-4">
                        <div className="p-3 bg-indigo-50 rounded-lg">
                            <Users className="text-indigo-600" size={32} />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-slate-500 mb-1">Nº de Empleados</p>
                            <h3 className="text-3xl font-black text-slate-900">{personalStats.totalEmployees}</h3>
                        </div>
                    </div>
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-center gap-4">
                        <div className="p-3 bg-emerald-50 rounded-lg">
                            <BadgeDollarSign className="text-emerald-600" size={32} />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-slate-500 mb-1">Coste Fijo Mensual</p>
                            <h3 className="text-3xl font-black text-orange-500">
                                {personalStats.monthlyFixedCost.toLocaleString('es-ES', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} €
                            </h3>
                        </div>
                    </div>
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-center gap-4">
                        <div className="p-3 bg-blue-50 rounded-lg">
                            <Clock className="text-blue-600" size={32} />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-slate-500 mb-1">Coste Variable (Horas)</p>
                            <h3 className="text-3xl font-black text-orange-500">
                                {personalStats.variableCost.toLocaleString('es-ES', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} €
                            </h3>
                        </div>
                    </div>
                 </div>

                 {/* ADD EMPLOYEE ACCORDION */}
                 <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                     <button 
                        onClick={() => setIsEmployeeFormOpen(!isEmployeeFormOpen)}
                        className="w-full flex justify-between items-center p-6 hover:bg-slate-50 transition-colors"
                     >
                        <h3 className="text-lg font-bold text-slate-900">{newEmployee.id ? 'Editar Empleado' : 'Añadir Nuevo Personal'}</h3>
                        {isEmployeeFormOpen ? <ChevronUp className="text-slate-400" /> : <ChevronDown className="text-slate-400" />}
                     </button>
                     
                     {isEmployeeFormOpen && (
                         <div className="p-6 pt-0 border-t border-slate-100">
                             <div className="flex space-x-2 mb-6 mt-4">
                                 <button 
                                    onClick={() => setEmployeeFormTab('FIXED')}
                                    className={`px-4 py-2 rounded-lg font-bold text-sm transition-colors ${employeeFormTab === 'FIXED' ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-50 text-slate-500'}`}
                                 >
                                    Fijos
                                 </button>
                                 <button 
                                    onClick={() => setEmployeeFormTab('HOURLY')}
                                    className={`px-4 py-2 rounded-lg font-bold text-sm transition-colors ${employeeFormTab === 'HOURLY' ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-50 text-slate-500'}`}
                                 >
                                    Por Horas
                                 </button>
                             </div>

                             <form onSubmit={handleSaveEmployee} className="space-y-6">
                                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                     <div>
                                         <label className="block text-sm font-medium text-slate-700 mb-2">Nombre</label>
                                         <input 
                                            type="text" 
                                            required
                                            value={newEmployee.name || ''}
                                            onChange={e => setNewEmployee({...newEmployee, name: e.target.value})}
                                            className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
                                            placeholder="Nombre completo"
                                         />
                                     </div>
                                     
                                     <div>
                                         <label className="block text-sm font-medium text-slate-700 mb-2">
                                             {employeeFormTab === 'FIXED' ? 'Salario Mensual (€)' : 'Tarifa por Hora (€)'}
                                         </label>
                                         <input 
                                            type="number" 
                                            required
                                            step="0.01"
                                            value={newEmployee.cost || ''}
                                            onChange={e => setNewEmployee({...newEmployee, cost: parseFloat(e.target.value)})}
                                            className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
                                            placeholder="0.00"
                                         />
                                     </div>

                                     {employeeFormTab === 'FIXED' && (
                                         <div>
                                             <label className="block text-sm font-medium text-slate-700 mb-2">Extras (€)</label>
                                             <input 
                                                type="number" 
                                                step="0.01"
                                                value={newEmployee.extras || ''}
                                                onChange={e => setNewEmployee({...newEmployee, extras: parseFloat(e.target.value)})}
                                                className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
                                                placeholder="Opcional"
                                             />
                                         </div>
                                     )}
                                 </div>

                                 <div className="flex justify-end gap-3">
                                     {newEmployee.id && (
                                         <button type="button" onClick={cancelEditingEmployee} className="px-6 py-3 rounded-lg font-bold text-slate-600 bg-slate-100 hover:bg-slate-200">
                                             Cancelar
                                         </button>
                                     )}
                                     <button type="submit" className="px-6 py-3 rounded-lg font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-md">
                                         {newEmployee.id ? 'Actualizar Empleado' : 'Añadir Empleado'}
                                     </button>
                                 </div>
                             </form>
                         </div>
                     )}
                 </div>

                 {/* EMPLOYEE LIST WITH TABS */}
                 <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden min-h-0">
                     <button 
                        onClick={() => setIsEmployeeListOpen(!isEmployeeListOpen)}
                        className="w-full flex justify-between items-center p-6 hover:bg-slate-50 transition-colors border-b border-slate-100"
                     >
                         <h3 className="text-lg font-bold text-slate-900">Gestión de Personal</h3>
                         {isEmployeeListOpen ? <ChevronUp className="text-slate-400" /> : <ChevronDown className="text-slate-400" />}
                     </button>

                     {isEmployeeListOpen && (
                         <div className="p-6 animate-fade-in">
                             <div className="flex gap-2 mb-6">
                                 <button 
                                    onClick={() => setEmployeeViewTab('FIXED')}
                                    className={`px-4 py-2 text-sm font-bold rounded-lg transition-colors ${employeeViewTab === 'FIXED' ? 'bg-slate-200 text-slate-900' : 'text-slate-500 hover:bg-slate-50'}`}
                                 >
                                    Fijos
                                 </button>
                                 <button 
                                    onClick={() => setEmployeeViewTab('HOURLY')}
                                    className={`px-4 py-2 text-sm font-bold rounded-lg transition-colors ${employeeViewTab === 'HOURLY' ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:bg-slate-50'}`}
                                 >
                                    Por Horas
                                 </button>
                             </div>

                             {employees.filter(e => e.type === employeeViewTab).length === 0 ? (
                                 <p className="text-slate-400 italic text-center py-8">No hay empleados registrados en esta categoría.</p>
                             ) : (
                                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                     {employees.filter(e => e.type === employeeViewTab).map(emp => {
                                         // Calculate total cost for this employee in current month (Variable/Hourly part)
                                         const empMonthVariableCost = dashboardData
                                             .filter(t => t.description.includes(emp.name) && t.category === Category.PERSONAL_HORAS)
                                             .reduce((acc, t) => acc + t.amount, 0);

                                         // Calculate total hours for this employee in current month
                                         const empMonthHours = dashboardData
                                             .filter(t => t.description.includes(emp.name) && t.category === Category.PERSONAL_HORAS)
                                             .reduce((acc, t) => {
                                                  // Try to parse "Name (Xh)" from description
                                                  const match = t.description.match(/\(([\d.]+)h\)/);
                                                  if (match && match[1]) {
                                                      return acc + parseFloat(match[1]);
                                                  }
                                                  // Fallback: amount / cost
                                                  return acc + (emp.cost > 0 ? t.amount / emp.cost : 0);
                                             }, 0);
                                        
                                         // Determine Display Cost based on Type
                                         const displayCost = emp.type === 'FIXED' 
                                            ? emp.cost + (emp.extras || 0) 
                                            : empMonthVariableCost;

                                         return (
                                             <div key={emp.id} className="p-6 bg-slate-50 border border-slate-100 rounded-xl flex justify-between items-start group hover:border-indigo-200 transition-colors">
                                                 <div>
                                                     <h4 className="text-lg font-bold text-slate-900">{emp.name}</h4>
                                                     <p className="text-sm text-slate-500 mb-2">
                                                         {emp.type === 'FIXED' 
                                                            ? `${emp.cost.toLocaleString('es-ES', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} €/mes ${emp.extras ? `+ ${emp.extras.toLocaleString('es-ES', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}€ Extras` : ''}` 
                                                            : `${emp.cost.toLocaleString('es-ES', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} € / hora`
                                                         }
                                                     </p>
                                                     
                                                     <div className="mt-4">
                                                         {emp.type === 'HOURLY' && empMonthVariableCost === 0 ? (
                                                             <p className="text-xs text-slate-400 italic">No hay horas registradas para este empleado en la pestaña 'Caja' este mes.</p>
                                                         ) : emp.type === 'HOURLY' ? (
                                                             <>
                                                                <p className="text-sm font-bold text-slate-600 mb-1">
                                                                   Horas Totales: {empMonthHours.toLocaleString('es-ES', { maximumFractionDigits: 1 })} h
                                                                </p>
                                                                <p className="text-lg font-black text-orange-500">
                                                                   Coste Total: {displayCost.toLocaleString('es-ES', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} €
                                                                </p>
                                                             </>
                                                         ) : (
                                                             <p className="text-lg font-black text-orange-500">
                                                                 Coste Total: {displayCost.toLocaleString('es-ES', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} €
                                                             </p>
                                                         )}
                                                     </div>
                                                 </div>
                                                 <div className="flex gap-2">
                                                     <button 
                                                        onClick={() => startEditingEmployee(emp)} 
                                                        className="p-2 text-slate-400 hover:text-indigo-600 bg-white rounded-lg border border-slate-200 shadow-sm"
                                                     >
                                                         <Pencil size={16}/>
                                                     </button>
                                                     <button 
                                                        onClick={() => handleDeleteEmployee(emp.id)} 
                                                        className="p-2 text-slate-400 hover:text-rose-600 bg-white rounded-lg border border-slate-200 shadow-sm"
                                                     >
                                                         <Trash2 size={16}/>
                                                     </button>
                                                 </div>
                                             </div>
                                         );
                                     })}
                                 </div>
                             )}
                         </div>
                     )}
                 </div>
            </div>
        )}

        {/* Proveedores, Estructura views remain unchanged in this block as requested changes were specific to Session naming and Incomes logic */}
        {activeView === 'proveedores' && (
          <div className="space-y-6 animate-fade-in">
            {/* Header always visible */}
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-black text-slate-900">Gestión de Proveedores</h2>
               {supplierViewMode === 'SUMMARY' && (
                <button 
                  onClick={exportToCSV}
                  className="hidden md:flex bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 px-4 py-2 rounded-lg font-bold shadow-sm transition-all items-center gap-2"
                >
                  <Download size={18} />
                  Exportar
                </button>
               )}
            </div>

            {/* VIEWS */}
            {supplierViewMode === 'SUMMARY' && (
              <>
                {/* Actions Bar */}
                <div className="flex gap-3">
                    <button 
                        onClick={() => setSupplierViewMode('MANAGE')}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-bold shadow-md transition-all flex items-center gap-2"
                    >
                        <Users size={18} />
                        Gestionar
                    </button>
                    <button 
                        onClick={() => setSupplierViewMode('ADD_EXPENSE')}
                        className="bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-lg font-bold shadow-md transition-all flex items-center gap-2"
                    >
                        <Plus size={18} />
                        Añadir Gasto
                    </button>
                </div>

                {/* KPI Card */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between">
                    <div>
                        <p className="text-sm font-medium text-slate-500 mb-1">Gasto Total en Proveedores</p>
                        <h3 className="text-3xl font-black text-rose-500">
                             {viewSummary.totalExpense.toLocaleString('es-ES', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} €
                        </h3>
                    </div>
                     <div className="p-3 bg-rose-50 rounded-full">
                        <TrendingDown className="text-rose-500" size={32} />
                    </div>
                </div>

                {/* Ranking Accordion */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                     <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                        <h3 className="font-bold text-slate-900 flex items-center gap-2">
                             <PieChartIcon size={18} className="text-slate-400"/>
                             Gasto Total por Proveedor
                        </h3>
                     </div>
                     <div className="p-6">
                        {expensesBySupplier.length === 0 ? (
                           <p className="text-slate-400 text-sm text-center italic">No hay gastos para mostrar.</p>
                        ) : (
                           <div className="space-y-4">
                              {expensesBySupplier.slice(0, 5).map((item, idx) => (
                                 <div key={idx} className="flex items-center gap-4">
                                     <span className="text-slate-400 font-bold w-4 text-center">{idx + 1}</span>
                                     <div className="flex-1">
                                         <div className="flex justify-between text-sm mb-1">
                                             <span className="font-bold text-slate-700">{item.name}</span>
                                             <span className="font-bold text-slate-900">{item.amount.toLocaleString('es-ES', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} €</span>
                                         </div>
                                         <div className="w-full bg-slate-100 rounded-full h-2">
                                             <div className="bg-indigo-500 h-2 rounded-full" style={{ width: `${(item.amount / viewSummary.totalExpense) * 100}%` }}></div>
                                         </div>
                                     </div>
                                 </div>
                              ))}
                           </div>
                        )}
                     </div>
                </div>
                
                 {/* History List */}
                 <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                     <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                        <h3 className="font-bold text-slate-900">Historial de Gastos</h3>
                     </div>
                     <div className="divide-y divide-slate-100">
                        {currentList.length === 0 ? (
                             <div className="p-10 text-center">
                                 <Truck className="mx-auto text-slate-300 mb-2" size={48} />
                                 <p className="text-slate-500 font-medium">No hay gastos de proveedores</p>
                                 <p className="text-slate-400 text-sm">Añade un nuevo gasto para empezar a llevar el control.</p>
                             </div>
                        ) : (
                             currentList.slice(0, 10).map(t => (
                                 <div key={t.id} className="p-4 hover:bg-slate-50 transition-colors flex justify-between items-center">
                                      <div>
                                          <p className="font-bold text-slate-800">{t.supplier || 'Sin Proveedor'}</p>
                                          <p className="text-xs text-slate-500 flex items-center gap-2">
                                              <span>{format(parseISO(t.date), 'dd MMM yyyy', { locale: es })}</span>
                                              <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                                              <span>{t.description}</span>
                                          </p>
                                      </div>
                                      <div className="flex items-center gap-3">
                                          <span className="font-bold text-rose-600">-{t.amount.toLocaleString('es-ES', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} €</span>
                                          <button onClick={() => handleDelete(t.id)} className="text-slate-300 hover:text-rose-500 p-1">
                                              <Trash2 size={16} />
                                          </button>
                                      </div>
                                 </div>
                             ))
                        )}
                     </div>
                 </div>
              </>
            )}

            {supplierViewMode === 'ADD_EXPENSE' && (
                // ... same logic as before for ADD_EXPENSE ...
                 <>
                  <button 
                     onClick={() => setSupplierViewMode('SUMMARY')}
                     className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-bold text-sm inline-flex items-center gap-2 shadow-sm hover:bg-indigo-700 transition-all"
                  >
                     <ArrowLeft size={16} /> Volver
                  </button>

                  <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 max-w-2xl mx-auto">
                     <h3 className="text-xl font-bold text-slate-900 mb-6">Añadir Nuevo Gasto de Proveedor</h3>
                     <div className="space-y-4">
                        <div>
                           <label className="block text-sm font-medium text-slate-700 mb-1">Nombre del Proveedor</label>
                           <input 
                              list="suppliers-list"
                              type="text"
                              value={supplierExpenseForm.supplierName}
                              onChange={(e) => setSupplierExpenseForm({...supplierExpenseForm, supplierName: e.target.value})}
                              placeholder="Selecciona o escribe un nombre"
                              className="w-full p-3 border border-slate-200 rounded-lg bg-white outline-none focus:ring-2 focus:ring-indigo-500"
                           />
                           <datalist id="suppliers-list">
                              {suppliers.map(s => <option key={s.id} value={s.name} />)}
                           </datalist>
                        </div>

                        <div>
                           <label className="block text-sm font-medium text-slate-700 mb-1">Descripción del Gasto</label>
                           <input 
                              type="text"
                              value={supplierExpenseForm.description}
                              onChange={(e) => setSupplierExpenseForm({...supplierExpenseForm, description: e.target.value})}
                              className="w-full p-3 border border-slate-200 rounded-lg bg-white outline-none focus:ring-2 focus:ring-indigo-500"
                              placeholder="Ej: Compra de bebidas"
                           />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                               <label className="block text-sm font-medium text-slate-700 mb-1">Importe (€)</label>
                               <input 
                                  type="number"
                                  value={supplierExpenseForm.amount}
                                  onChange={(e) => setSupplierExpenseForm({...supplierExpenseForm, amount: e.target.value})}
                                  className="w-full p-3 border border-slate-200 rounded-lg bg-white outline-none focus:ring-2 focus:ring-indigo-500"
                                  placeholder="0.00"
                               />
                            </div>
                            <div>
                               <label className="block text-sm font-medium text-slate-700 mb-1">Fecha</label>
                               <input 
                                  type="date"
                                  value={supplierExpenseForm.date}
                                  onChange={(e) => setSupplierExpenseForm({...supplierExpenseForm, date: e.target.value})}
                                  className="w-full p-3 border border-slate-200 rounded-lg bg-white outline-none focus:ring-2 focus:ring-indigo-500"
                               />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Categoría</label>
                            <select
                                value={supplierExpenseForm.category}
                                onChange={(e) => setSupplierExpenseForm({...supplierExpenseForm, category: e.target.value as Category})}
                                className="w-full p-3 border border-slate-200 rounded-lg bg-white outline-none focus:ring-2 focus:ring-indigo-500"
                            >
                                {CATEGORIES_BY_SECTION.PROVEEDORES.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                        </div>

                        <div className="flex gap-3 pt-4">
                            <button 
                                onClick={() => setSupplierViewMode('SUMMARY')}
                                className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3 rounded-lg transition-colors"
                            >
                                Cancelar
                            </button>
                            <button 
                                onClick={handleSaveSupplierExpense}
                                className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-lg shadow-md transition-colors"
                            >
                                Guardar Gasto
                            </button>
                        </div>
                     </div>
                  </div>
                </>
            )}

            {supplierViewMode === 'MANAGE' && (
                // ... same logic for MANAGE ...
                 <>
                   <button 
                     onClick={() => setSupplierViewMode('SUMMARY')}
                     className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-bold text-sm inline-flex items-center gap-2 shadow-sm hover:bg-indigo-700 transition-all"
                  >
                     <ArrowLeft size={16} /> Volver
                  </button>

                  <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8">
                      <div className="mb-8">
                          <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                             <Truck className="text-indigo-500" /> Añadir Proveedor Habitual
                          </h3>
                          <label className="block text-sm font-medium text-slate-600 mb-2">Nombre del Nuevo Proveedor</label>
                          <div className="flex gap-3">
                             <input 
                                type="text" 
                                value={newSupplierName}
                                onChange={(e) => setNewSupplierName(e.target.value)}
                                placeholder="Ej: Coca-Cola"
                                className="flex-1 p-3 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50 focus:bg-white transition-colors"
                             />
                             <button 
                                onClick={handleAddSupplier}
                                className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 font-bold rounded-lg shadow-md"
                             >
                                <Plus size={20} />
                             </button>
                          </div>
                      </div>

                      <div className="border-t border-slate-100 pt-8">
                          <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                             <Users className="text-indigo-500" /> Proveedores Registrados
                          </h3>
                          {suppliers.length === 0 ? (
                              <p className="text-slate-400 italic">No hay proveedores registrados.</p>
                          ) : (
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                 {suppliers.map(s => (
                                    <div key={s.id} className="flex justify-between items-center p-4 bg-white rounded-xl border border-slate-200 shadow-sm hover:border-indigo-300 transition-colors group">
                                       <span className="font-bold text-slate-700">{s.name}</span>
                                       <button 
                                            onClick={() => handleDeleteSupplier(s.id)} 
                                            className="text-slate-300 hover:text-rose-500 bg-slate-50 p-2 rounded-lg group-hover:bg-white transition-colors"
                                       >
                                          <Trash2 size={16} />
                                       </button>
                                    </div>
                                 ))}
                              </div>
                          )}
                      </div>
                  </div>
                </>
            )}

          </div>
        )}

        {activeView === 'estructura' && (
          <div className="space-y-6 animate-fade-in">
             <div className="flex justify-between items-center">
               <h2 className="text-2xl font-black text-slate-900">Gastos de Estructura</h2>
               {structureViewMode === 'SUMMARY' && (
                <button 
                    onClick={exportToCSV}
                    className="hidden md:flex bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 px-4 py-2 rounded-lg font-bold shadow-sm transition-all items-center gap-2"
                >
                    <Download size={18} />
                    Exportar
                </button>
               )}
             </div>

             {/* VIEWS */}
             {structureViewMode === 'SUMMARY' && (
                 <>
                    {/* Action Buttons */}
                    <div className="flex gap-3">
                        <button 
                            onClick={() => setStructureViewMode('MANAGE')}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-bold shadow-md transition-all flex items-center gap-2"
                        >
                            <LayoutGrid size={18} />
                            Gestionar
                        </button>
                        <button 
                            onClick={() => {
                                setStructureExpenseForm({
                                    id: undefined,
                                    name: '',
                                    category: Category.ALQUILER,
                                    amount: '',
                                    date: new Date().toISOString().split('T')[0]
                                });
                                setStructureViewMode('ADD_EXPENSE');
                            }}
                            className="bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-lg font-bold shadow-md transition-all flex items-center gap-2"
                        >
                            <Plus size={18} />
                            Añadir Gasto
                        </button>
                    </div>

                    {/* KPI Card (Horizontal Layout) */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-slate-500 mb-1">Total Estructura</p>
                                <h3 className="text-3xl font-black text-rose-500">
                                    {viewSummary.totalExpense.toLocaleString('es-ES', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} €
                                </h3>
                            </div>
                            <div className="p-3 bg-rose-50 rounded-full">
                                <Building2 className="text-rose-500" size={32} />
                            </div>
                        </div>
                    </div>

                    {/* Ranking Accordion */}
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                            <h3 className="font-bold text-slate-900 flex items-center gap-2">
                                <PieChartIcon size={18} className="text-slate-400"/>
                                Gasto por Concepto
                            </h3>
                        </div>
                        <div className="p-6">
                            {expensesByConcept.length === 0 ? (
                                <p className="text-slate-400 text-sm text-center italic">No hay gastos para mostrar.</p>
                            ) : (
                                <div className="space-y-4">
                                    {expensesByConcept.slice(0, 5).map((item, idx) => (
                                        <div key={idx} className="flex items-center gap-4">
                                            <span className="text-slate-400 font-bold w-4 text-center">{idx + 1}</span>
                                            <div className="flex-1">
                                                <div className="flex justify-between text-sm mb-1">
                                                    <span className="font-bold text-slate-700">{item.name}</span>
                                                    <span className="font-bold text-slate-900">{item.amount.toLocaleString('es-ES', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} €</span>
                                                </div>
                                                <div className="w-full bg-slate-100 rounded-full h-2">
                                                    <div className="bg-emerald-500 h-2 rounded-full" style={{ width: `${(item.amount / viewSummary.totalExpense) * 100}%` }}></div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* History List */}
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                            <h3 className="font-bold text-slate-900">Historial de Gastos</h3>
                        </div>
                        <div className="divide-y divide-slate-100">
                            {currentList.length === 0 ? (
                                <div className="p-10 text-center">
                                    <Building2 className="mx-auto text-slate-300 mb-2" size={48} />
                                    <p className="text-slate-500 font-medium">No hay gastos de estructura</p>
                                    <p className="text-slate-400 text-sm">Añade un nuevo gasto para empezar.</p>
                                </div>
                            ) : (
                                currentList.map(t => (
                                    <div key={t.id} className="p-4 hover:bg-slate-50 transition-colors flex justify-between items-center">
                                        <div>
                                            <p className="font-bold text-slate-800">{t.description}</p>
                                            <p className="text-xs text-slate-500 flex items-center gap-2">
                                                <span>{format(parseISO(t.date), 'dd MMM yyyy', { locale: es })}</span>
                                                <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                                                <span>{t.category}</span>
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <span className="font-bold text-rose-600">-{t.amount.toLocaleString('es-ES', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} €</span>
                                            <button 
                                                onClick={() => startEditingStructure(t)} 
                                                className="text-slate-300 hover:text-indigo-600 p-1 border border-transparent hover:border-slate-200 rounded"
                                            >
                                                <Pencil size={16} />
                                            </button>
                                            <button 
                                                onClick={() => handleDelete(t.id)} 
                                                className="text-slate-300 hover:text-rose-500 p-1 border border-transparent hover:border-slate-200 rounded"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                 </>
             )}

             {/* ADD/EDIT/MANAGE MODES for Structure (Standard form code omitted for brevity as it's repetitive but preserved in XML logic) */}
             {structureViewMode === 'ADD_EXPENSE' && (
                 <>
                    <button 
                        onClick={() => setStructureViewMode('SUMMARY')}
                        className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-bold text-sm inline-flex items-center gap-2 shadow-sm hover:bg-indigo-700 transition-all"
                    >
                        <ArrowLeft size={16} /> Volver
                    </button>

                    <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 max-w-2xl mx-auto">
                        <h3 className="text-xl font-bold text-slate-900 mb-6">{structureExpenseForm.id ? 'Editar Gasto' : 'Registrar Nuevo Gasto'}</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Concepto</label>
                                <input 
                                    type="text"
                                    value={structureExpenseForm.name}
                                    onChange={(e) => setStructureExpenseForm({...structureExpenseForm, name: e.target.value})}
                                    className="w-full p-3 border border-slate-200 rounded-lg bg-white outline-none focus:ring-2 focus:ring-indigo-500"
                                    placeholder="Ej: Alquiler Local"
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Importe (€)</label>
                                    <input 
                                        type="number"
                                        value={structureExpenseForm.amount}
                                        onChange={(e) => setStructureExpenseForm({...structureExpenseForm, amount: e.target.value})}
                                        className="w-full p-3 border border-slate-200 rounded-lg bg-white outline-none focus:ring-2 focus:ring-indigo-500"
                                        placeholder="0.00"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Fecha</label>
                                    <input 
                                        type="date"
                                        value={structureExpenseForm.date}
                                        onChange={(e) => setStructureExpenseForm({...structureExpenseForm, date: e.target.value})}
                                        className="w-full p-3 border border-slate-200 rounded-lg bg-white outline-none focus:ring-2 focus:ring-indigo-500"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Categoría</label>
                                <select
                                    value={structureExpenseForm.category}
                                    onChange={(e) => setStructureExpenseForm({...structureExpenseForm, category: e.target.value as Category})}
                                    className="w-full p-3 border border-slate-200 rounded-lg bg-white outline-none focus:ring-2 focus:ring-indigo-500"
                                >
                                    {CATEGORIES_BY_SECTION.ESTRUCTURA.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button 
                                    onClick={() => setStructureViewMode('SUMMARY')}
                                    className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3 rounded-lg transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button 
                                    onClick={handleSaveStructureExpense}
                                    className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-lg shadow-md transition-colors"
                                >
                                    {structureExpenseForm.id ? 'Actualizar Gasto' : 'Guardar Gasto'}
                                </button>
                            </div>
                        </div>
                    </div>
                 </>
             )}

             {structureViewMode === 'MANAGE' && (
                 <>
                    <button 
                        onClick={() => setStructureViewMode('SUMMARY')}
                        className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-bold text-sm inline-flex items-center gap-2 shadow-sm hover:bg-indigo-700 transition-all"
                    >
                        <ArrowLeft size={16} /> Volver
                    </button>

                    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8">
                        <div className="mb-8">
                            <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                                <Plus className="text-indigo-500" /> Añadir Concepto Habitual
                            </h3>
                            <label className="block text-sm font-medium text-slate-600 mb-2">Nombre del Concepto</label>
                            <div className="flex gap-3">
                                <input 
                                    type="text" 
                                    value={newFixedExpenseName}
                                    onChange={(e) => setNewFixedExpenseName(e.target.value)}
                                    placeholder="Ej: Luz"
                                    className="flex-1 p-3 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50 focus:bg-white transition-colors"
                                />
                                <button 
                                    onClick={handleAddFixedExpense}
                                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 font-bold rounded-lg shadow-md"
                                >
                                    <Plus size={20} />
                                </button>
                            </div>
                            <p className="text-xs text-slate-400 mt-2">Estos conceptos sirven como referencia de tus gastos fijos habituales.</p>
                        </div>

                        <div className="border-t border-slate-100 pt-8">
                            <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                                <LayoutGrid className="text-indigo-500" /> Conceptos Registrados
                            </h3>
                            {fixedExpenses.length === 0 ? (
                                <p className="text-slate-400 italic">No hay conceptos registrados.</p>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                    {fixedExpenses.map(item => (
                                        <div key={item.id} className="flex justify-between items-center p-4 bg-white rounded-xl border border-slate-200 shadow-sm hover:border-indigo-300 transition-colors group">
                                            <span className="font-bold text-slate-700">{item.name}</span>
                                            <button 
                                                onClick={() => handleDeleteFixedExpense(item.id)} 
                                                className="text-slate-300 hover:text-rose-500 bg-slate-50 p-2 rounded-lg group-hover:bg-white transition-colors"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                 </>
             )}

          </div>
        )}

      </main>
    </div>
  );
};

export default App;
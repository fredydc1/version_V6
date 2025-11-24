import { Transaction, TransactionType, Employee, Supplier, FixedExpenseItem, Category } from '../types';
import { MOCK_TRANSACTIONS } from '../constants';

const STORAGE_KEY = 'neonflow_transactions';
const EMPLOYEES_KEY = 'neonflow_employees';
const SUPPLIERS_KEY = 'neonflow_suppliers';
const FIXED_EXPENSES_KEY = 'neonflow_fixed_expenses';

// --- TRANSACTIONS ---

export const getTransactions = async (): Promise<Transaction[]> => {
  // Simular latencia de red
  await new Promise(resolve => setTimeout(resolve, 50));
  
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(MOCK_TRANSACTIONS));
    return MOCK_TRANSACTIONS;
  }
  try {
    return JSON.parse(stored);
  } catch (e) {
    console.error("Error parsing transactions", e);
    return [];
  }
};

export const saveTransaction = async (transaction: Transaction): Promise<Transaction[]> => {
  await new Promise(resolve => setTimeout(resolve, 50));
  const current = await getTransactions();
  // Check if update or new
  const index = current.findIndex(t => t.id === transaction.id);
  let updated;
  if (index >= 0) {
      updated = [...current];
      updated[index] = transaction;
  } else {
      updated = [transaction, ...current];
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  return updated;
};

export const deleteTransaction = async (id: string): Promise<Transaction[]> => {
  await new Promise(resolve => setTimeout(resolve, 50));
  const current = await getTransactions();
  const updated = current.filter(t => t.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  return updated;
};

export const calculateSummary = (transactions: Transaction[]) => {
  return transactions.reduce(
    (acc, curr) => {
      if (curr.type === TransactionType.INCOME) {
        acc.totalIncome += curr.amount;
        acc.netBalance += curr.amount;
      } else {
        acc.totalExpense += curr.amount;
        acc.netBalance -= curr.amount;
      }
      return acc;
    },
    { totalIncome: 0, totalExpense: 0, netBalance: 0 }
  );
};

// --- EMPLOYEES ---

const MOCK_EMPLOYEES: Employee[] = [
    { id: '1', name: 'Juan Encargado', type: 'FIXED', cost: 1500, active: true },
    { id: '2', name: 'Emma Gracia', type: 'HOURLY', cost: 12.50, active: true },
    { id: '3', name: 'Liam López', type: 'HOURLY', cost: 10.00, active: true },
];

export const getEmployees = async (): Promise<Employee[]> => {
    await new Promise(resolve => setTimeout(resolve, 50));
    const stored = localStorage.getItem(EMPLOYEES_KEY);
    if (!stored) {
        localStorage.setItem(EMPLOYEES_KEY, JSON.stringify(MOCK_EMPLOYEES));
        return MOCK_EMPLOYEES;
    }
    try {
        return JSON.parse(stored);
    } catch (e) {
        return [];
    }
};

export const saveEmployee = async (employee: Employee): Promise<Employee[]> => {
    await new Promise(resolve => setTimeout(resolve, 50));
    const current = await getEmployees();
    const index = current.findIndex(e => e.id === employee.id);
    let updated;
    if (index >= 0) {
        updated = [...current];
        updated[index] = employee;
    } else {
        updated = [...current, employee];
    }
    localStorage.setItem(EMPLOYEES_KEY, JSON.stringify(updated));
    return updated;
};

export const deleteEmployee = async (id: string): Promise<Employee[]> => {
    await new Promise(resolve => setTimeout(resolve, 50));
    const current = await getEmployees();
    const updated = current.filter(e => e.id !== id);
    localStorage.setItem(EMPLOYEES_KEY, JSON.stringify(updated));
    return updated;
};

// --- SUPPLIERS ---

const MOCK_SUPPLIERS: Supplier[] = [
  { id: '1', name: 'Coca-Cola' },
  { id: '2', name: 'Makro' },
  { id: '3', name: 'Distribuciones Locales' },
];

export const getSuppliers = async (): Promise<Supplier[]> => {
  await new Promise(resolve => setTimeout(resolve, 50));
  const stored = localStorage.getItem(SUPPLIERS_KEY);
  if (!stored) {
    localStorage.setItem(SUPPLIERS_KEY, JSON.stringify(MOCK_SUPPLIERS));
    return MOCK_SUPPLIERS;
  }
  try {
    return JSON.parse(stored);
  } catch (e) {
    return [];
  }
};

export const saveSupplier = async (supplier: Supplier): Promise<Supplier[]> => {
  await new Promise(resolve => setTimeout(resolve, 50));
  const current = await getSuppliers();
  const index = current.findIndex(s => s.id === supplier.id);
  let updated;
  if (index >= 0) {
    updated = [...current];
    updated[index] = supplier;
  } else {
    updated = [...current, supplier];
  }
  localStorage.setItem(SUPPLIERS_KEY, JSON.stringify(updated));
  return updated;
};

export const deleteSupplier = async (id: string): Promise<Supplier[]> => {
  await new Promise(resolve => setTimeout(resolve, 50));
  const current = await getSuppliers();
  const updated = current.filter(s => s.id !== id);
  localStorage.setItem(SUPPLIERS_KEY, JSON.stringify(updated));
  return updated;
};

// --- FIXED EXPENSES (STRUCTURE) ---

const MOCK_FIXED_EXPENSES: FixedExpenseItem[] = [
  { id: '1', name: 'Alquiler Local', defaultCategory: Category.ALQUILER, defaultAmount: 1200 },
  { id: '2', name: 'Iberdrola (Luz)', defaultCategory: Category.SUMINISTROS },
  { id: '3', name: 'Movistar (Internet)', defaultCategory: Category.SUMINISTROS, defaultAmount: 55 },
  { id: '4', name: 'Gestoría', defaultCategory: Category.MANTENIMIENTO, defaultAmount: 150 },
];

export const getFixedExpenses = async (): Promise<FixedExpenseItem[]> => {
  await new Promise(resolve => setTimeout(resolve, 50));
  const stored = localStorage.getItem(FIXED_EXPENSES_KEY);
  if (!stored) {
    localStorage.setItem(FIXED_EXPENSES_KEY, JSON.stringify(MOCK_FIXED_EXPENSES));
    return MOCK_FIXED_EXPENSES;
  }
  try {
    return JSON.parse(stored);
  } catch (e) {
    return [];
  }
};

export const saveFixedExpense = async (item: FixedExpenseItem): Promise<FixedExpenseItem[]> => {
  await new Promise(resolve => setTimeout(resolve, 50));
  const current = await getFixedExpenses();
  const index = current.findIndex(i => i.id === item.id);
  let updated;
  if (index >= 0) {
    updated = [...current];
    updated[index] = item;
  } else {
    updated = [...current, item];
  }
  localStorage.setItem(FIXED_EXPENSES_KEY, JSON.stringify(updated));
  return updated;
};

export const deleteFixedExpense = async (id: string): Promise<FixedExpenseItem[]> => {
  await new Promise(resolve => setTimeout(resolve, 50));
  const current = await getFixedExpenses();
  const updated = current.filter(i => i.id !== id);
  localStorage.setItem(FIXED_EXPENSES_KEY, JSON.stringify(updated));
  return updated;
};
import { neon } from '@netlify/neon';
import { Transaction, TransactionType, Employee, Supplier, FixedExpenseItem, Category } from '../types';

// --- DATABASE CONNECTION ---

// Helper para obtener variables de entorno tanto en Vite (navegador) como en Node (servidor)
const getEnvVar = (key: string): string | undefined => {
  // @ts-ignore - Vite uses import.meta.env
  if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env[key]) {
    // @ts-ignore
    return import.meta.env[key];
  }
  if (typeof process !== 'undefined' && process.env && process.env[key]) { // @ts-ignore
    return process.env[key];
  }
  return undefined;
};

const getSqlClient = () => {
  try {
    // 1. Intentamos obtener la URL explícita para frontend (VITE_DATABASE_URL)
    //    IMPORTANTE: El usuario debe configurar esta variable en Netlify/Environment
    const connectionString = getEnvVar('VITE_DATABASE_URL') || getEnvVar('NETLIFY_DATABASE_URL');
    
    if (connectionString) {
      console.log("✅ Conectando a Neon DB...");
      return neon(connectionString);
    }
    
    console.warn("⚠️ No se encontró VITE_DATABASE_URL ni NETLIFY_DATABASE_URL. La base de datos no funcionará.");
    return null;
  } catch (error) {
    console.error("❌ Error crítico inicializando cliente Neon:", error);
    return null;
  }
};

const sql = getSqlClient();

// --- UTILS ---
const mapTransaction = (row: any): Transaction => ({
  ...row,
  amount: row.amount ? parseFloat(row.amount) : 0,
});

const mapEmployee = (row: any): Employee => ({
  ...row,
  cost: row.cost ? parseFloat(row.cost) : 0,
  extras: row.extras ? parseFloat(row.extras) : undefined,
});

const mapFixedExpense = (row: any): FixedExpenseItem => ({
  ...row,
  defaultCategory: row.default_category, 
  defaultAmount: row.default_amount ? parseFloat(row.default_amount) : undefined
});

// Helper para validar conexión antes de operaciones de escritura
const ensureDbConnection = () => {
    if (!sql) throw new Error("Base de datos no conectada. Configura VITE_DATABASE_URL.");
};

// --- TRANSACTIONS ---

export const getTransactions = async (): Promise<Transaction[]> => {
  if (!sql) return [];
  try {
    const rows = await sql`SELECT * FROM transactions ORDER BY date DESC`;
    return rows.map(mapTransaction);
  } catch (error) {
    console.error("Error fetching transactions:", error);
    return [];
  }
};

export const saveTransaction = async (transaction: Transaction): Promise<Transaction[]> => {
  ensureDbConnection();
  try {
    // @ts-ignore
    await sql`
      INSERT INTO transactions (id, date, amount, description, category, type, supplier)
      VALUES (${transaction.id}, ${transaction.date}, ${transaction.amount}, ${transaction.description}, ${transaction.category}, ${transaction.type}, ${transaction.supplier || null})
      ON CONFLICT (id) DO UPDATE SET
        date = EXCLUDED.date,
        amount = EXCLUDED.amount,
        description = EXCLUDED.description,
        category = EXCLUDED.category,
        type = EXCLUDED.type,
        supplier = EXCLUDED.supplier
    `;
    return getTransactions();
  } catch (error) {
    console.error("Error saving transaction:", error);
    throw error;
  }
};

export const deleteTransaction = async (id: string): Promise<Transaction[]> => {
  ensureDbConnection();
  try {
    // @ts-ignore
    await sql`DELETE FROM transactions WHERE id = ${id}`;
    return getTransactions();
  } catch (error) {
    console.error("Error deleting transaction:", error);
    throw error;
  }
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

export const getEmployees = async (): Promise<Employee[]> => {
  if (!sql) return [];
  try {
    const rows = await sql`SELECT * FROM employees`;
    return rows.map(mapEmployee);
  } catch (error) {
    console.error("Error fetching employees:", error);
    return [];
  }
};

export const saveEmployee = async (employee: Employee): Promise<Employee[]> => {
  ensureDbConnection();
  try {
    // @ts-ignore
    await sql`
      INSERT INTO employees (id, name, type, cost, extras, active)
      VALUES (${employee.id}, ${employee.name}, ${employee.type}, ${employee.cost}, ${employee.extras || null}, ${employee.active})
      ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        type = EXCLUDED.type,
        cost = EXCLUDED.cost,
        extras = EXCLUDED.extras,
        active = EXCLUDED.active
    `;
    return getEmployees();
  } catch (error) {
    console.error("Error saving employee:", error);
    throw error;
  }
};

export const deleteEmployee = async (id: string): Promise<Employee[]> => {
  ensureDbConnection();
  try {
    // @ts-ignore
    await sql`DELETE FROM employees WHERE id = ${id}`;
    return getEmployees();
  } catch (error) {
     console.error("Error deleting employee:", error);
     throw error;
  }
};

// --- SUPPLIERS ---

export const getSuppliers = async (): Promise<Supplier[]> => {
  if (!sql) return [];
  try {
    const rows = await sql`SELECT * FROM suppliers`;
    return rows.map((r: any) => ({ id: r.id, name: r.name }));
  } catch (error) {
    console.error("Error fetching suppliers:", error);
    return [];
  }
};

export const saveSupplier = async (supplier: Supplier): Promise<Supplier[]> => {
  ensureDbConnection();
  try {
    // @ts-ignore
    await sql`
      INSERT INTO suppliers (id, name)
      VALUES (${supplier.id}, ${supplier.name})
      ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name
    `;
    return getSuppliers();
  } catch (error) {
    console.error("Error saving supplier:", error);
    throw error;
  }
};

export const deleteSupplier = async (id: string): Promise<Supplier[]> => {
  ensureDbConnection();
  try {
    // @ts-ignore
    await sql`DELETE FROM suppliers WHERE id = ${id}`;
    return getSuppliers();
  } catch (error) {
    console.error("Error deleting supplier:", error);
    throw error;
  }
};

// --- FIXED EXPENSES (STRUCTURE) ---

export const getFixedExpenses = async (): Promise<FixedExpenseItem[]> => {
  if (!sql) return [];
  try {
    const rows = await sql`SELECT * FROM fixed_expenses`;
    return rows.map(mapFixedExpense);
  } catch (error) {
    console.error("Error fetching fixed expenses:", error);
    return [];
  }
};

export const saveFixedExpense = async (item: FixedExpenseItem): Promise<FixedExpenseItem[]> => {
  ensureDbConnection();
  try {
    // @ts-ignore
    await sql`
      INSERT INTO fixed_expenses (id, name, default_category, default_amount)
      VALUES (${item.id}, ${item.name}, ${item.defaultCategory}, ${item.defaultAmount || null})
      ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        default_category = EXCLUDED.default_category,
        default_amount = EXCLUDED.default_amount
    `;
    return getFixedExpenses();
  } catch (error) {
    console.error("Error saving fixed expense:", error);
    throw error;
  }
};

export const deleteFixedExpense = async (id: string): Promise<FixedExpenseItem[]> => {
  ensureDbConnection();
  try {
    // @ts-ignore
    await sql`DELETE FROM fixed_expenses WHERE id = ${id}`;
    return getFixedExpenses();
  } catch (error) {
    console.error("Error deleting fixed expense:", error);
    throw error;
  }
};
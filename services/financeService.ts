
import { neon } from '@neondatabase/serverless';
import { Transaction, TransactionType, Employee, Supplier, FixedExpenseItem, Category } from '../types';

// --- DATABASE CONNECTION ---

const STORAGE_KEY_DB = 'neon_db_connection_string';

const getConnectionString = (): string | null => {
  // 1. Intentar obtener variable explícita de Vite (Reemplazo estático en build time)
  // @ts-ignore
  if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_DATABASE_URL) {
    // @ts-ignore
    return import.meta.env.VITE_DATABASE_URL;
  }

  // 2. Intentar configuración manual del usuario (LocalStorage)
  if (typeof localStorage !== 'undefined') {
    const stored = localStorage.getItem(STORAGE_KEY_DB);
    if (stored) return stored;
  }

  return null;
};

let sqlInstance: any = null;

const getSql = () => {
  if (sqlInstance) return sqlInstance;
  
  const connectionString = getConnectionString();
  
  if (connectionString) {
    try {
      // console.log("🔌 Conectando a Neon DB...");
      // @neondatabase/serverless maneja automáticamente la conexión HTTP
      sqlInstance = neon(connectionString);
      return sqlInstance;
    } catch (error) {
      console.error("Error inicializando cliente Neon:", error);
      return null;
    }
  }
  
  return null;
};

// API para configurar la conexión desde la UI
export const setManualDatabaseUrl = (url: string) => {
  if (!url) return;
  localStorage.setItem(STORAGE_KEY_DB, url);
  sqlInstance = null; // Reiniciar instancia
  window.location.reload(); // Recargar para asegurar estado limpio
};

export const disconnectManualDatabase = () => {
  localStorage.removeItem(STORAGE_KEY_DB);
  sqlInstance = null;
  window.location.reload();
};

export const getStoredConnectionStatus = () => {
    return {
        type: typeof localStorage !== 'undefined' && localStorage.getItem(STORAGE_KEY_DB) ? 'MANUAL' : 'ENV',
        isConnected: !!getConnectionString()
    };
};

// --- SCHEMA INITIALIZATION ---

export const initializeSchema = async () => {
  ensureDbConnection();
  const sql = getSql();
  try {
    // Crear tabla Transacciones
    // @ts-ignore
    await sql`
      CREATE TABLE IF NOT EXISTS transactions (
        id TEXT PRIMARY KEY,
        date TEXT NOT NULL,
        amount DECIMAL NOT NULL,
        description TEXT NOT NULL,
        category TEXT NOT NULL,
        type TEXT NOT NULL,
        supplier TEXT
      );
    `;

    // Crear tabla Empleados
    // @ts-ignore
    await sql`
      CREATE TABLE IF NOT EXISTS employees (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        type TEXT NOT NULL,
        cost DECIMAL NOT NULL,
        extras DECIMAL,
        active BOOLEAN DEFAULT TRUE
      );
    `;

    // Crear tabla Proveedores
    // @ts-ignore
    await sql`
      CREATE TABLE IF NOT EXISTS suppliers (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL
      );
    `;

    // Crear tabla Gastos Fijos (Estructura)
    // @ts-ignore
    await sql`
      CREATE TABLE IF NOT EXISTS fixed_expenses (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        default_category TEXT NOT NULL,
        default_amount DECIMAL,
        is_recurring BOOLEAN DEFAULT FALSE
      );
    `;

    // MIGRACIÓN MANUAL: Intentar añadir columna is_recurring si la tabla ya existía sin ella
    try {
        // @ts-ignore
        await sql`ALTER TABLE fixed_expenses ADD COLUMN IF NOT EXISTS is_recurring BOOLEAN DEFAULT FALSE`;
    } catch (e) {
        // Ignorar error si ya existe o si la DB no soporta IF NOT EXISTS en alter (Postgres antiguos, aunque Neon es moderno)
        console.log("Columna is_recurring ya existe o error en alter:", e);
    }

    return true;
  } catch (error) {
    console.error("Error inicializando esquema:", error);
    throw error;
  }
};

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
  defaultAmount: row.default_amount ? parseFloat(row.default_amount) : undefined,
  isRecurring: row.is_recurring
});

// Helper para validar conexión antes de operaciones de escritura
const ensureDbConnection = () => {
    if (!getSql()) throw new Error("DB_NOT_CONNECTED");
};

// --- TRANSACTIONS ---

export const getTransactions = async (): Promise<Transaction[]> => {
  const sql = getSql();
  if (!sql) return [];
  try {
    const rows = await sql`SELECT * FROM transactions ORDER BY date DESC`;
    // @ts-ignore
    return rows.map(mapTransaction);
  } catch (error) {
    console.error("Error fetching transactions:", error);
    return [];
  }
};

export const saveTransaction = async (transaction: Transaction): Promise<Transaction[]> => {
  ensureDbConnection();
  const sql = getSql();
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
  const sql = getSql();
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
  const sql = getSql();
  if (!sql) return [];
  try {
    const rows = await sql`SELECT * FROM employees`;
    // @ts-ignore
    return rows.map(mapEmployee);
  } catch (error) {
    console.error("Error fetching employees:", error);
    return [];
  }
};

export const saveEmployee = async (employee: Employee): Promise<Employee[]> => {
  ensureDbConnection();
  const sql = getSql();
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
  const sql = getSql();
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
  const sql = getSql();
  if (!sql) return [];
  try {
    const rows = await sql`SELECT * FROM suppliers`;
    // @ts-ignore
    return rows.map((r: any) => ({ id: r.id, name: r.name }));
  } catch (error) {
    console.error("Error fetching suppliers:", error);
    return [];
  }
};

export const saveSupplier = async (supplier: Supplier): Promise<Supplier[]> => {
  ensureDbConnection();
  const sql = getSql();
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
  const sql = getSql();
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
  const sql = getSql();
  if (!sql) return [];
  try {
    const rows = await sql`SELECT * FROM fixed_expenses`;
    // @ts-ignore
    return rows.map(mapFixedExpense);
  } catch (error) {
    console.error("Error fetching fixed expenses:", error);
    return [];
  }
};

export const saveFixedExpense = async (item: FixedExpenseItem): Promise<FixedExpenseItem[]> => {
  ensureDbConnection();
  const sql = getSql();
  try {
    // @ts-ignore
    await sql`
      INSERT INTO fixed_expenses (id, name, default_category, default_amount, is_recurring)
      VALUES (${item.id}, ${item.name}, ${item.defaultCategory}, ${item.defaultAmount || null}, ${item.isRecurring || false})
      ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        default_category = EXCLUDED.default_category,
        default_amount = EXCLUDED.default_amount,
        is_recurring = EXCLUDED.is_recurring
    `;
    return getFixedExpenses();
  } catch (error) {
    console.error("Error saving fixed expense:", error);
    throw error;
  }
};

export const deleteFixedExpense = async (id: string): Promise<FixedExpenseItem[]> => {
  ensureDbConnection();
  const sql = getSql();
  try {
    // @ts-ignore
    await sql`DELETE FROM fixed_expenses WHERE id = ${id}`;
    return getFixedExpenses();
  } catch (error) {
    console.error("Error deleting fixed expense:", error);
    throw error;
  }
};

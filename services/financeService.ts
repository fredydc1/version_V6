import { neon } from '@netlify/neon';
import { Transaction, TransactionType, Employee, Supplier, FixedExpenseItem, Category } from '../types';

// --- DATABASE CONNECTION ---
// Inicialización segura del cliente SQL para evitar "pantalla blanca" si falla la configuración
const getSqlClient = () => {
  try {
    // Verificamos si process y process.env existen (entorno seguro)
    if (typeof process !== 'undefined' && process.env && process.env.NETLIFY_DATABASE_URL) {
      return neon(process.env.NETLIFY_DATABASE_URL);
    }
    
    // Si estamos en un entorno donde neon() puede autodetectar la variable (algunos entornos de Edge)
    // intentamos inicializarlo sin argumentos, pero dentro del try/catch por si explota.
    try {
        // @ts-ignore - Intentamos inicialización automática si la librería lo soporta
        return neon();
    } catch (innerError) {
        // Ignoramos este error y procedemos al fallback
    }

    console.warn("⚠️ NETLIFY_DATABASE_URL no detectada. La base de datos no está conectada.");
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
  if (!sql) return [];
  try {
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
  if (!sql) return [];
  try {
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
  if (!sql) return [];
  try {
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
  if (!sql) return [];
  try {
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
  if (!sql) return [];
  try {
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
  if (!sql) return [];
  try {
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
  if (!sql) return [];
  try {
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
  if (!sql) return [];
  try {
    await sql`DELETE FROM fixed_expenses WHERE id = ${id}`;
    return getFixedExpenses();
  } catch (error) {
    console.error("Error deleting fixed expense:", error);
    throw error;
  }
};
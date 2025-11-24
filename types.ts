
export enum TransactionType {
  INCOME = 'INCOME',
  EXPENSE = 'EXPENSE',
}

export enum Category {
  // Caja (Ingresos diarios)
  VENTA_DIARIA = 'Venta Diaria',
  OTROS_INGRESOS = 'Otros Ingresos',
  
  // Caja (Gastos menudos)
  GASTO_CAJA = 'Gasto de Caja',

  // Personal
  NOMINA_FIJA = 'Nómina Fija',
  PERSONAL_HORAS = 'Personal por Horas',
  SEGURIDAD_SOCIAL = 'Seguridad Social',

  // Proveedores
  MATERIAS_PRIMAS = 'Materias Primas',
  PROVEEDORES_VARIOS = 'Proveedores Varios',
  MERCADERIA = 'Mercadería',

  // Estructura
  ALQUILER = 'Alquiler',
  SUMINISTROS = 'Suministros (Luz/Agua/Net)',
  MARKETING = 'Marketing',
  IMPUESTOS = 'Impuestos',
  MANTENIMIENTO = 'Mantenimiento',
  SOFTWARE = 'Software/Suscripciones',
  AMORTIZACIONES = 'Amortizaciones',
  LEASING = 'Leasings',
  COMISIONES = 'Comisiones',
  PROFESIONALES = 'Profesionales',
  
  // Técnica (No contable para totales globales, solo informativo)
  DESGLOSE_PAGO = 'Desglose Pago (Info)',

  OTHER = 'Otros',
}

export interface Transaction {
  id: string;
  date: string; // ISO string YYYY-MM-DD
  amount: number;
  description: string;
  category: Category | string;
  type: TransactionType;
  supplier?: string; // Nombre del proveedor asociado
}

export interface FinancialSummary {
  totalIncome: number;
  totalExpense: number;
  netBalance: number;
}

export interface ChartDataPoint {
  date: string;
  income: number;
  expense: number;
}

// Nuevos tipos para Empleados
export type EmployeeType = 'FIXED' | 'HOURLY';

export interface Employee {
  id: string;
  name: string;
  type: EmployeeType;
  cost: number; // Salario mensual para FIJOS, Coste hora para POR HORAS
  extras?: number; // Coste extra fijo mensual (solo para FIXED)
  active: boolean;
}

// Tipos para Proveedores
export interface Supplier {
  id: string;
  name: string;
}

// Tipos para Estructura (Gastos Fijos)
export interface FixedExpenseItem {
  id: string;
  name: string; // Ej: Alquiler, Iberdrola, Movistar
  defaultCategory: Category | string;
  defaultAmount?: number; // Opcional, para autocompletar
}

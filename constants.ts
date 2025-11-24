
import { Category, TransactionType } from './types';

export const APP_NAME = "NeonFlow Finanzas";

export const CATEGORIES_BY_SECTION = {
  CAJA: [Category.VENTA_DIARIA, Category.OTROS_INGRESOS, Category.GASTO_CAJA],
  PERSONAL: [Category.NOMINA_FIJA, Category.PERSONAL_HORAS, Category.SEGURIDAD_SOCIAL],
  PROVEEDORES: [Category.MATERIAS_PRIMAS, Category.MERCADERIA, Category.PROVEEDORES_VARIOS],
  ESTRUCTURA: [
    Category.ALQUILER, 
    Category.SUMINISTROS, 
    Category.MARKETING, 
    Category.IMPUESTOS, 
    Category.MANTENIMIENTO, 
    Category.SOFTWARE,
    Category.AMORTIZACIONES,
    Category.LEASING,
    Category.COMISIONES,
    Category.PROFESIONALES
  ],
};

// Excluímos DESGLOSE_PAGO de la lista general para que no salga en formularios manuales
export const ALL_CATEGORIES = [
  ...CATEGORIES_BY_SECTION.CAJA,
  ...CATEGORIES_BY_SECTION.PERSONAL,
  ...CATEGORIES_BY_SECTION.PROVEEDORES,
  ...CATEGORIES_BY_SECTION.ESTRUCTURA,
  Category.OTHER
];

export const MOCK_TRANSACTIONS = [
  { id: '1', date: '2023-10-01', amount: 1500, description: 'Cierre Caja Día 1', category: Category.VENTA_DIARIA, type: TransactionType.INCOME },
  { id: '2', date: '2023-10-01', amount: 50, description: 'Compra hielo urgencia', category: Category.GASTO_CAJA, type: TransactionType.EXPENSE },
  { id: '3', date: '2023-10-02', amount: 1200, description: 'Alquiler Local', category: Category.ALQUILER, type: TransactionType.EXPENSE },
  { id: '4', date: '2023-10-05', amount: 300, description: 'Factura Bebidas', category: Category.MATERIAS_PRIMAS, type: TransactionType.EXPENSE },
  { id: '5', date: '2023-10-05', amount: 1800, description: 'Cierre Caja Día 5', category: Category.VENTA_DIARIA, type: TransactionType.INCOME },
  { id: '6', date: '2023-10-15', amount: 1500, description: 'Nómina Juan (Encargado)', category: Category.NOMINA_FIJA, type: TransactionType.EXPENSE },
  { id: '7', date: '2023-10-15', amount: 400, description: 'Extras Fin de Semana', category: Category.PERSONAL_HORAS, type: TransactionType.EXPENSE },
];

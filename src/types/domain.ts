/**
 * Local DTO types — replaces `@nuqtaplus/core` entity imports.
 *
 * These are plain TypeScript interfaces matching the shapes returned by the
 * backend API.  No Zod schemas, no runtime validation — the backend is
 * authoritative for all business rules.
 */

// ── Category ────────────────────────────────────────────────────────────────
export interface Category {
  id?: number;
  name: string;
  description?: string | null;
  isActive?: boolean;
  createdAt?: string;
  createdBy?: number;
}

// ── Customer ────────────────────────────────────────────────────────────────
export interface Customer {
  id?: number;
  name: string;
  phone?: string | null;
  address?: string | null;
  city?: string | null;
  notes?: string | null;
  totalPurchases?: number;
  totalDebt?: number;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
  createdBy?: number;
}

// ── Payment ─────────────────────────────────────────────────────────────────
export type PaymentMethod = 'cash' | 'card' | 'bank_transfer' | 'credit';

export interface Payment {
  id?: number;
  saleId?: number | null;
  purchaseId?: number | null;
  customerId?: number | null;
  supplierId?: number | null;
  amount: number;
  currency?: string;
  exchangeRate?: number;
  paymentMethod: PaymentMethod;
  referenceNumber?: string | null;
  idempotencyKey?: string | null;
  status?: 'completed' | 'voided' | 'refunded';
  paymentDate?: string;
  notes?: string | null;
  createdAt?: string;
  createdBy?: number;
}

// ── Product ─────────────────────────────────────────────────────────────────
export interface Product {
  id?: number;
  name: string;
  sku?: string | null;
  barcode?: string | null;
  categoryId?: number | null;
  description?: string | null;
  costPrice: number;
  sellingPrice: number;
  currency?: string;
  stock?: number;
  minStock?: number;
  unit?: string;
  supplier?: string | null;
  supplierId?: number | null;
  expireDate?: string | null;
  isExpire?: boolean;
  status?: 'available' | 'discontinued' | 'inactive';
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
  createdBy?: number;
}

// ── Sale ────────────────────────────────────────────────────────────────────
export interface SaleItemDepletion {
  batchNumber?: string | null;
  expiryDate?: string | null;
  quantityBase: number;
  costPerUnit?: number;
  totalCost?: number;
}

export interface SaleItem {
  id?: number;
  saleId?: number;
  productId: number;
  productName: string;
  quantity: number;
  unitName?: string;
  unitFactor?: number;
  quantityBase?: number;
  batchId?: number;
  unitPrice: number;
  discount?: number;
  subtotal: number;
  cogs?: number;
  weightedAverageCost?: number;
  /** Cumulative base-units already returned to stock across partial refunds. */
  returnedQuantityBase?: number;
  createdAt?: string;
  depletions?: SaleItemDepletion[];
}

export interface Sale {
  id?: number;
  invoiceNumber: string;
  customerId?: number | null;
  subtotal: number;
  discount?: number;
  tax?: number;
  total: number;
  currency?: string;
  exchangeRate?: number;
  interestRate?: number;
  interestAmount?: number;
  paymentType?: 'cash' | 'credit' | 'mixed';
  paidAmount?: number;
  refundedAmount?: number;
  remainingAmount?: number;
  status?: 'pending' | 'completed' | 'cancelled' | 'refunded' | 'partial_refund';
  notes?: string | null;
  idempotencyKey?: string | null;
  createdAt?: string;
  updatedAt?: string;
  createdBy?: number;
  items?: SaleItem[];
  payments?: Payment[];
  paymentMethod?: PaymentMethod;
  referenceNumber?: string | null;
  cogs?: number;
  totalCogs?: number;
  profit?: number;
  marginBps?: number;
  journalEntryId?: number;
}

// ── Settings ────────────────────────────────────────────────────────────────
export interface Settings {
  id?: number;
  key: string;
  value: string;
  description?: string | null;
  updatedAt?: string;
  updatedBy?: number;
}

export interface CompanySettings {
  name: string;
  address?: string | null;
  phone?: string | null;
  phone2?: string | null;
  email?: string | null;
  taxId?: string | null;
  logo?: string | null;
  currency: string;
  lowStockThreshold?: number;
}

// ── User ────────────────────────────────────────────────────────────────────
export type UserRole = 'admin' | 'cashier' | 'manager' | 'viewer';

export interface User {
  id?: number;
  username: string;
  password: string;
  fullName: string;
  phone?: string | null;
  role?: UserRole;
  isActive?: boolean;
  lastLoginAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

// ── Supplier ────────────────────────────────────────────────────────────────
export interface Supplier {
  id?: number;
  name: string;
  phone?: string | null;
  phone2?: string | null;
  address?: string | null;
  city?: string | null;
  notes?: string | null;
  openingBalance?: number;
  currentBalance?: number;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
  createdBy?: number;
}

// ── Purchase ────────────────────────────────────────────────────────────────
export interface PurchaseItem {
  id?: number;
  purchaseId?: number;
  productId: number;
  productName: string;
  unitName?: string;
  unitFactor?: number;
  quantity: number;
  quantityBase: number;
  unitCost: number;
  lineSubtotal: number;
  discount?: number;
  batchId?: number;
  batchNumber?: string;
  expiryDate?: string | null;
  createdAt?: string;
}

export interface Purchase {
  id?: number;
  invoiceNumber: string;
  supplierId: number;
  subtotal: number;
  discount?: number;
  tax?: number;
  total: number;
  paidAmount?: number;
  remainingAmount?: number;
  paymentStatus?: 'unpaid' | 'partial' | 'paid';
  currency?: string;
  exchangeRate?: number;
  status?: 'pending' | 'completed' | 'cancelled' | 'received' | 'partial';
  notes?: string | null;
  receivedAt?: string | null;
  idempotencyKey?: string | null;
  createdAt?: string;
  updatedAt?: string;
  createdBy?: number;
  items?: PurchaseItem[];
  payments?: Payment[];
  movements?: any[];
}

// ── Inventory ───────────────────────────────────────────────────────────────
export interface InventoryMovement {
  id?: number;
  productId: number;
  batchId?: number;
  /** Physical direction of stock change: "in" = increase, "out" = decrease, "adjust" = correction */
  movementType: 'in' | 'out' | 'adjust';
  /** Semantic reason for the movement */
  reason:
    | 'sale'
    | 'purchase'
    | 'return'
    | 'refund'
    | 'damage'
    | 'manual'
    | 'opening'
    | 'cancellation'
    | string;
  quantityBase: number;
  unitName?: string;
  unitFactor?: number;
  stockBefore: number;
  stockAfter: number;
  costPerUnit?: number;
  totalCost?: number;
  sourceType?: 'sale' | 'purchase' | 'adjustment' | 'return' | 'sale_cancellation';
  sourceId?: number;
  notes?: string | null;
  createdAt?: string;
  createdBy?: number;
}

// ── Accounting ──────────────────────────────────────────────────────────────
export interface Account {
  id?: number;
  code: string;
  name: string;
  nameAr?: string | null;
  accountType: 'asset' | 'liability' | 'equity' | 'revenue' | 'expense';
  parentId?: number | null;
  isSystem?: boolean;
  isActive?: boolean;
  balance?: number;
  createdAt?: string;
}

export interface JournalLine {
  id?: number;
  journalEntryId?: number;
  accountId: number;
  debit?: number;
  credit?: number;
  description?: string | null;
  createdAt?: string;
}

export interface JournalEntry {
  id?: number;
  entryNumber: string;
  entryDate: string;
  description: string;
  sourceType?: 'sale' | 'purchase' | 'payment' | 'adjustment' | 'manual';
  sourceId?: number;
  isPosted?: boolean;
  isReversed?: boolean;
  reversalOfId?: number;
  postingBatchId?: number | null;
  totalAmount: number;
  currency?: string;
  notes?: string | null;
  createdAt?: string;
  createdBy?: number;
  lines?: JournalLine[];
}

// ── Ledger ──────────────────────────────────────────────────────────────────
export interface CustomerLedgerEntry {
  id?: number;
  customerId: number;
  transactionType: 'invoice' | 'payment' | 'return' | 'adjustment' | 'opening';
  amount: number;
  balanceAfter: number;
  saleId?: number;
  paymentId?: number;
  journalEntryId?: number;
  notes?: string | null;
  createdAt?: string;
  createdBy?: number;
}

export interface SupplierLedgerEntry {
  id?: number;
  supplierId: number;
  transactionType: 'invoice' | 'payment' | 'return' | 'adjustment' | 'opening';
  amount: number;
  balanceAfter: number;
  purchaseId?: number;
  paymentId?: number;
  journalEntryId?: number;
  notes?: string | null;
  createdAt?: string;
  createdBy?: number;
}

// ── Product Unit ────────────────────────────────────────────────────────────
export interface ProductUnit {
  id?: number;
  productId: number;
  unitName: string;
  factorToBase?: number;
  barcode?: string | null;
  sellingPrice?: number | null;
  isDefault?: boolean;
  isActive?: boolean;
  createdAt?: string;
}

// ── Barcode ─────────────────────────────────────────────────────────────────
export interface BarcodeTemplate {
  id?: number;
  name: string;
  width: number;
  height: number;
  barcodeType?: string;
  showPrice?: boolean;
  showName?: boolean;
  showBarcode?: boolean;
  showExpiry?: boolean;
  isDefault?: boolean;
  createdAt?: string;
}

export interface BarcodePrintJob {
  id?: number;
  templateId: number;
  productId: number;
  productName: string;
  barcode?: string | null;
  price?: number | null;
  quantity: number;
  status?: 'pending' | 'printed' | 'failed';
  createdAt?: string;
  createdBy?: number;
}

export type BarcodeTemplateInput = Pick<
  BarcodeTemplate,
  | 'name'
  | 'width'
  | 'height'
  | 'barcodeType'
  | 'showPrice'
  | 'showName'
  | 'showBarcode'
  | 'showExpiry'
  | 'isDefault'
>;

export type BarcodePrintJobInput = Pick<
  BarcodePrintJob,
  'templateId' | 'productId' | 'productName' | 'quantity'
>;

// ── Product Batch ───────────────────────────────────────────────────────────
export interface ProductBatch {
  id?: number;
  productId: number;
  batchNumber: string;
  expiryDate?: string | null;
  manufacturingDate?: string | null;
  quantityReceived: number;
  quantityOnHand: number;
  costPerUnit?: number;
  purchaseId?: number;
  status?: 'active' | 'expired' | 'depleted' | 'recalled';
  notes?: string | null;
  createdAt?: string;
}

export type UserPublic = Omit<User, 'password'>;

export type CustomerInput = Pick<Customer, 'name' | 'phone' | 'address' | 'city' | 'notes'>;

export type ProductInput = Pick<
  Product,
  | 'name'
  | 'sku'
  | 'barcode'
  | 'categoryId'
  | 'description'
  | 'costPrice'
  | 'sellingPrice'
  | 'stock'
  | 'minStock'
  | 'unit'
  | 'supplier'
  | 'supplierId'
  | 'status'
  | 'isActive'
  | 'isExpire'
  | 'expireDate'
>;

export type SaleInput = Omit<Sale, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'> & {
  paymentMethod?: PaymentMethod;
  referenceNumber?: string;
  idempotencyKey?: string;
};

/**
 * Narrowed input type for creating a new sale — only the fields accepted
 * by the backend `additionalProperties: false` schema.
 */
export interface SaleCreateInput {
  items: {
    productId: number;
    quantity: number;
    unitPrice: number;
    discount?: number;
    unitName?: string;
    unitFactor?: number;
    batchId?: number;
  }[];
  customerId?: number;
  discount?: number;
  tax?: number;
  paymentType: 'cash' | 'credit' | 'mixed';
  paidAmount?: number;
  currency?: string;
  notes?: string;
  interestRate?: number;
  interestRateBps?: number;
  paymentMethod?: PaymentMethod;
  referenceNumber?: string;
  idempotencyKey?: string;
}

export type FirstUserInput = {
  username: string;
  password: string;
  fullName: string;
  phone?: string | null;
};

export type UserInput = Pick<User, 'username' | 'fullName' | 'role' | 'isActive' | 'phone'> & {
  password?: string;
};

export type CategoryInput = Pick<Category, 'name' | 'description' | 'isActive'>;

/**
 * Backend GET /settings/currency response shape.
 * Matches CurrencySettingsSchema in the backend route.
 */
export interface SettingsCurrencyResponse {
  id?: number;
  currencyCode: string;
  currencyName?: string;
  symbol?: string;
  exchangeRate?: number;
  isBaseCurrency?: boolean;
  isActive?: boolean;
  updatedAt?: string | null;
}

export type CompanySettingsInput = Pick<
  CompanySettings,
  | 'name'
  | 'address'
  | 'phone'
  | 'phone2'
  | 'email'
  | 'taxId'
  | 'logo'
  | 'currency'
  | 'lowStockThreshold'
>;

// ── HR — Department ─────────────────────────────────────────────────────────
/**
 * Backend Department schema: { id, name, description, isActive, createdAt, updatedAt, createdBy }
 * Note: managerId is NOT in the backend schema.
 */
export interface Department {
  id?: number;
  name: string;
  description?: string | null;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string | null;
  createdBy?: number | null;
}

export type DepartmentInput = Pick<Department, 'name' | 'description' | 'isActive'>;

// ── HR — Employee ───────────────────────────────────────────────────────────
/**
 * Backend Employee schema uses flat string fields (not normalized FK-based):
 *   { id, name, salary, position, department, isActive, createdAt, updatedAt, createdBy }
 */
export interface Employee {
  id?: number;
  name: string;
  salary: number;
  position: string;
  department: string;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string | null;
  createdBy?: number | null;
}

export type EmployeeInput = Pick<
  Employee,
  'name' | 'salary' | 'position' | 'department' | 'isActive'
>;

// ── HR — Payroll Run ────────────────────────────────────────────────────────
/**
 * Backend PayrollRun schema uses integer year/month (not ISO date strings):
 *   { id, periodYear, periodMonth, paymentDate, status, totalGrossPay, totalDeductions, totalBonuses, totalNetPay }
 *
 * PayrollRunItem uses: { grossPay, deductions, bonuses, netPay } (not basicSalary/allowances)
 */
export type PayrollRunStatus = 'draft' | 'submitted' | 'approved' | 'disbursed' | 'cancelled';

export interface PayrollRunEntry {
  id?: number;
  payrollRunId?: number;
  employeeId: number;
  employeeName?: string;
  position?: string;
  department?: string;
  grossPay: number;
  deductions: number;
  bonuses: number;
  netPay: number;
  notes?: string | null;
  createdAt?: string;
}

export interface PayrollRun {
  id?: number;
  periodYear: number;
  periodMonth: number;
  paymentDate?: string | null;
  status?: PayrollRunStatus;
  totalGrossPay?: number;
  totalDeductions?: number;
  totalBonuses?: number;
  totalNetPay?: number;
  salaryExpenseAccountCode?: string;
  deductionsLiabilityAccountCode?: string;
  paymentAccountCode?: string;
  journalEntryId?: number | null;
  notes?: string | null;
  createdAt?: string;
  createdBy?: number | null;
  approvedAt?: string | null;
  approvedBy?: number | null;
  items?: PayrollRunEntry[];
}

export interface PayrollRunInput {
  periodYear: number;
  periodMonth: number;
  paymentDate?: string;
  salaryExpenseAccountCode?: string;
  deductionsLiabilityAccountCode?: string;
  paymentAccountCode?: string;
  notes?: string;
  items: {
    employeeId: number;
    deductions?: number;
    bonuses?: number;
    notes?: string;
  }[];
}

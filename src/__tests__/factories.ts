/**
 * Test data factories — reusable mock data builders for all test files.
 *
 * Usage:
 *   import { createMockProduct, createApiSuccess, createPagedResult } from './factories';
 */
import type {
  Product,
  Customer,
  Supplier,
  Sale,
  SaleItem,
  Purchase,
  PurchaseItem,
  User,
  Category,
  Payment,
  InventoryMovement,
  Account,
  JournalEntry,
  JournalLine,
  CustomerLedgerEntry,
  SupplierLedgerEntry,
  ProductUnit,
  ProductBatch,
  BarcodeTemplate,
  BarcodePrintJob,
  CompanySettings,
  Settings,
} from '@/types/domain';
import type { ApiResult, PagedResult } from '@/api/contracts';

// ── API Result Builders ─────────────────────────────────────────────────────

export const createApiSuccess = <T>(data: T): ApiResult<T> => ({
  ok: true,
  data,
});

export const createApiFailure = (
  code: string,
  message: string,
  status?: number
): ApiResult<never> => ({
  ok: false,
  error: { code, message, status },
});

export const createPagedResult = <T>(items: T[], total?: number): ApiResult<PagedResult<T>> => ({
  ok: true,
  data: { items, total: total ?? items.length },
});

export const createEmptyPage = <T>(): ApiResult<PagedResult<T>> => ({
  ok: true,
  data: { items: [], total: 0 },
});

// ── Entity Factories ────────────────────────────────────────────────────────

export const createMockProduct = (overrides?: Partial<Product>): Product => ({
  id: 1,
  name: 'Test Product',
  sku: 'SKU-001',
  barcode: '1234567890123',
  categoryId: 1,
  description: 'A test product',
  costPrice: 1000,
  sellingPrice: 1500,
  currency: 'IQD',
  stock: 50,
  minStock: 10,
  unit: 'piece',
  status: 'available',
  isActive: true,
  createdAt: '2025-01-01T00:00:00Z',
  updatedAt: '2025-01-01T00:00:00Z',
  createdBy: 1,
  ...overrides,
});

export const createMockCustomer = (overrides?: Partial<Customer>): Customer => ({
  id: 1,
  name: 'Test Customer',
  phone: '07700000000',
  address: 'Baghdad, Iraq',
  city: 'Baghdad',
  notes: null,
  totalPurchases: 0,
  totalDebt: 0,
  isActive: true,
  createdAt: '2025-01-01T00:00:00Z',
  updatedAt: '2025-01-01T00:00:00Z',
  createdBy: 1,
  ...overrides,
});

export const createMockSupplier = (overrides?: Partial<Supplier>): Supplier => ({
  id: 1,
  name: 'Test Supplier',
  phone: '07700000001',
  address: 'Erbil, Iraq',
  city: 'Erbil',
  notes: null,
  openingBalance: 0,
  currentBalance: 0,
  isActive: true,
  createdAt: '2025-01-01T00:00:00Z',
  updatedAt: '2025-01-01T00:00:00Z',
  createdBy: 1,
  ...overrides,
});

export const createMockSaleItem = (overrides?: Partial<SaleItem>): SaleItem => ({
  id: 1,
  saleId: 1,
  productId: 1,
  productName: 'Test Product',
  quantity: 2,
  unitPrice: 1500,
  discount: 0,
  subtotal: 3000,
  createdAt: '2025-01-01T00:00:00Z',
  ...overrides,
});

export const createMockSale = (overrides?: Partial<Sale>): Sale => ({
  id: 1,
  invoiceNumber: 'INV-001',
  customerId: 1,
  subtotal: 3000,
  discount: 0,
  tax: 0,
  total: 3000,
  currency: 'IQD',
  paymentType: 'cash',
  paidAmount: 3000,
  remainingAmount: 0,
  status: 'completed',
  notes: null,
  createdAt: '2025-01-01T00:00:00Z',
  updatedAt: '2025-01-01T00:00:00Z',
  createdBy: 1,
  items: [createMockSaleItem()],
  ...overrides,
});

export const createMockPurchaseItem = (overrides?: Partial<PurchaseItem>): PurchaseItem => ({
  id: 1,
  purchaseId: 1,
  productId: 1,
  productName: 'Test Product',
  quantity: 10,
  quantityBase: 10,
  unitCost: 1000,
  lineSubtotal: 10000,
  discount: 0,
  createdAt: '2025-01-01T00:00:00Z',
  ...overrides,
});

export const createMockPurchase = (overrides?: Partial<Purchase>): Purchase => ({
  id: 1,
  invoiceNumber: 'PUR-001',
  supplierId: 1,
  subtotal: 10000,
  discount: 0,
  tax: 0,
  total: 10000,
  paidAmount: 10000,
  remainingAmount: 0,
  currency: 'IQD',
  status: 'completed',
  notes: null,
  createdAt: '2025-01-01T00:00:00Z',
  updatedAt: '2025-01-01T00:00:00Z',
  createdBy: 1,
  items: [createMockPurchaseItem()],
  ...overrides,
});

export const createMockUser = (overrides?: Partial<User>): User => ({
  id: 1,
  username: 'admin',
  password: '',
  fullName: 'Admin User',
  phone: '07700000000',
  role: 'admin',
  isActive: true,
  createdAt: '2025-01-01T00:00:00Z',
  updatedAt: '2025-01-01T00:00:00Z',
  ...overrides,
});

/** UserPublic = User without the password field */
export const createMockUserPublic = (overrides?: Partial<Omit<User, 'password'>>) => ({
  id: 1,
  username: 'admin',
  fullName: 'Admin User',
  phone: '07700000000',
  role: 'admin' as const,
  isActive: true,
  createdAt: '2025-01-01T00:00:00Z',
  updatedAt: '2025-01-01T00:00:00Z',
  ...overrides,
});

export const createMockCategory = (overrides?: Partial<Category>): Category => ({
  id: 1,
  name: 'Electronics',
  description: 'Electronic devices',
  isActive: true,
  createdAt: '2025-01-01T00:00:00Z',
  createdBy: 1,
  ...overrides,
});

export const createMockPayment = (overrides?: Partial<Payment>): Payment => ({
  id: 1,
  saleId: 1,
  amount: 3000,
  currency: 'IQD',
  paymentMethod: 'cash',
  status: 'completed',
  paymentDate: '2025-01-01T00:00:00Z',
  createdAt: '2025-01-01T00:00:00Z',
  createdBy: 1,
  ...overrides,
});

export const createMockMovement = (overrides?: Partial<InventoryMovement>): InventoryMovement => ({
  id: 1,
  productId: 1,
  movementType: 'in',
  reason: 'purchase',
  quantityBase: 10,
  stockBefore: 40,
  stockAfter: 50,
  costPerUnit: 1000,
  totalCost: 10000,
  sourceType: 'purchase',
  sourceId: 1,
  createdAt: '2025-01-01T00:00:00Z',
  createdBy: 1,
  ...overrides,
});

export const createMockAccount = (overrides?: Partial<Account>): Account => ({
  id: 1,
  code: '1000',
  name: 'Cash',
  nameAr: 'نقد',
  accountType: 'asset',
  isSystem: true,
  isActive: true,
  balance: 100000,
  createdAt: '2025-01-01T00:00:00Z',
  ...overrides,
});

export const createMockJournalLine = (overrides?: Partial<JournalLine>): JournalLine => ({
  id: 1,
  journalEntryId: 1,
  accountId: 1,
  debit: 1000,
  credit: 0,
  description: 'Cash debit',
  createdAt: '2025-01-01T00:00:00Z',
  ...overrides,
});

export const createMockJournalEntry = (overrides?: Partial<JournalEntry>): JournalEntry => ({
  id: 1,
  entryNumber: 'JE-001',
  entryDate: '2025-01-01',
  description: 'Test journal entry',
  sourceType: 'sale',
  sourceId: 1,
  isPosted: false,
  isReversed: false,
  totalAmount: 1000,
  currency: 'IQD',
  createdAt: '2025-01-01T00:00:00Z',
  createdBy: 1,
  lines: [createMockJournalLine()],
  ...overrides,
});

export const createMockCustomerLedgerEntry = (
  overrides?: Partial<CustomerLedgerEntry>
): CustomerLedgerEntry => ({
  id: 1,
  customerId: 1,
  transactionType: 'invoice',
  amount: 3000,
  balanceAfter: 3000,
  saleId: 1,
  createdAt: '2025-01-01T00:00:00Z',
  createdBy: 1,
  ...overrides,
});

export const createMockSupplierLedgerEntry = (
  overrides?: Partial<SupplierLedgerEntry>
): SupplierLedgerEntry => ({
  id: 1,
  supplierId: 1,
  transactionType: 'invoice',
  amount: 10000,
  balanceAfter: 10000,
  purchaseId: 1,
  createdAt: '2025-01-01T00:00:00Z',
  createdBy: 1,
  ...overrides,
});

export const createMockProductUnit = (overrides?: Partial<ProductUnit>): ProductUnit => ({
  id: 1,
  productId: 1,
  unitName: 'box',
  factorToBase: 12,
  barcode: '9876543210123',
  sellingPrice: 15000,
  isDefault: false,
  isActive: true,
  createdAt: '2025-01-01T00:00:00Z',
  ...overrides,
});

export const createMockProductBatch = (overrides?: Partial<ProductBatch>): ProductBatch => ({
  id: 1,
  productId: 1,
  batchNumber: 'BATCH-001',
  expiryDate: '2026-01-01',
  quantityReceived: 100,
  quantityOnHand: 80,
  costPerUnit: 1000,
  status: 'active',
  createdAt: '2025-01-01T00:00:00Z',
  ...overrides,
});

export const createMockBarcodeTemplate = (
  overrides?: Partial<BarcodeTemplate>
): BarcodeTemplate => ({
  id: 1,
  name: 'Default Label',
  width: 50,
  height: 30,
  barcodeType: 'CODE128',
  showPrice: true,
  showName: true,
  showBarcode: true,
  showExpiry: false,
  isDefault: true,
  createdAt: '2025-01-01T00:00:00Z',
  ...overrides,
});

export const createMockBarcodePrintJob = (
  overrides?: Partial<BarcodePrintJob>
): BarcodePrintJob => ({
  id: 1,
  templateId: 1,
  productId: 1,
  productName: 'Test Product',
  barcode: '1234567890123',
  price: 1500,
  quantity: 10,
  status: 'pending',
  createdAt: '2025-01-01T00:00:00Z',
  createdBy: 1,
  ...overrides,
});

export const createMockCompanySettings = (
  overrides?: Partial<CompanySettings>
): CompanySettings => ({
  name: 'Nuqta Store',
  address: 'Baghdad, Iraq',
  phone: '07700000000',
  email: 'info@nuqta.com',
  currency: 'IQD',
  lowStockThreshold: 10,
  ...overrides,
});

export const createMockSettings = (overrides?: Partial<Settings>): Settings => ({
  id: 1,
  key: 'company.name',
  value: 'Nuqta Store',
  updatedAt: '2025-01-01T00:00:00Z',
  ...overrides,
});

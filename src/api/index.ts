/**
 * API client barrel — drop-in replacement for the old ipc/ barrel.
 *
 * Every module that previously imported from '@/ipc' or '../ipc' should
 * now import from '@/api' or '../api'.
 *
 * The exported names are intentionally identical to the old IPC clients
 * so that import-path changes are the ONLY edit needed at call sites.
 */
export { authClient } from './endpoints/auth';
export { customersClient } from './endpoints/customers';
export { productsClient } from './endpoints/products';
export { salesClient } from './endpoints/sales';
export { settingsClient } from './endpoints/settings';
export { usersClient } from './endpoints/users';
export { categoriesClient } from './endpoints/categories';
export { printersClient } from './endpoints/printers';
export { posClient } from './endpoints/pos';
export { suppliersClient } from './endpoints/suppliers';
export { purchasesClient } from './endpoints/purchases';
export { inventoryClient } from './endpoints/inventory';
export { accountingClient } from './endpoints/accounting';
export { customerLedgerClient } from './endpoints/customerLedger';
export { supplierLedgerClient } from './endpoints/supplierLedger';
export { postingClient } from './endpoints/posting';
export { auditClient } from './endpoints/audit';
export { backupClient } from './endpoints/backup';
export { employeesClient, departmentsClient, payrollClient } from './endpoints/hr';
export { dashboardClient } from './endpoints/dashboard';
export { setupClient } from './endpoints/setup';
export { registerUnauthorizedHandler, setAccessToken, getAccessToken } from './http';
export type { ApiResult, ApiError, PagedResult } from './contracts';

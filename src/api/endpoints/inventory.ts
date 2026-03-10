/**
 * Inventory API endpoints.
 *
 * Replaces: ipc/inventoryClient.ts
 */
import type { ApiResult, PagedResult } from '../contracts';
import type { InventoryMovement } from '../../types/domain';
import { apiGet, apiGetPaged, apiPost } from '../http';

export interface InventoryDashboard {
  totalValuation: number;
  lowStockCount: number;
  expiryAlertCount: number;
  topMovingProducts: { productId: number; productName: string; totalMoved: number }[];
}

export interface ExpiryAlert {
  productId: number;
  productName: string;
  batchNumber: string;
  expiryDate: string;
  quantityOnHand: number;
  daysUntilExpiry: number;
}

export interface StockDriftItem {
  productId: number;
  productName: string;
  cachedStock: number;
  ledgerStock: number;
  drift: number;
}

export interface StockReconciliationResult {
  driftItems: StockDriftItem[];
  totalProducts: number;
  totalDrift: number;
  repairedCount: number;
}

export interface StockAdjustmentInput {
  productId: number;
  reason: 'manual' | 'damage' | 'opening';
  quantityBase: number;
  unitName?: string;
  unitFactor?: number;
  notes?: string;
  batchId?: number;
  idempotencyKey?: string;
}

export const inventoryClient = {
  getDashboard: (): Promise<ApiResult<InventoryDashboard>> =>
    apiGet<InventoryDashboard>('/inventory/dashboard'),

  getMovements: (params?: {
    productId?: number;
    movementType?: string;
    dateFrom?: string;
    dateTo?: string;
    limit?: number;
    offset?: number;
  }): Promise<ApiResult<PagedResult<InventoryMovement>>> =>
    apiGetPaged<InventoryMovement>('/inventory/movements', params),

  getExpiryAlerts: (daysAhead?: number): Promise<ApiResult<ExpiryAlert[]>> =>
    apiGet<ExpiryAlert[]>('/inventory/expiry-alerts', { daysAhead: daysAhead ?? 30 }),

  reconcileStock: (repair = false): Promise<ApiResult<StockReconciliationResult>> =>
    apiPost<StockReconciliationResult>('/inventory/reconcile', { repair }),

  adjustStock: (data: StockAdjustmentInput): Promise<ApiResult<InventoryMovement>> =>
    apiPost<InventoryMovement>(`/products/${data.productId}/adjust-stock`, {
      quantityChange: data.quantityBase,
      reason: data.reason,
      notes: data.notes,
      unitName: data.unitName,
      unitFactor: data.unitFactor,
      batchId: data.batchId,
      idempotencyKey: data.idempotencyKey,
    }),
};

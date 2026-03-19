/**
 * Dashboard API endpoints.
 *
 * Replaces: ipc/dashboardClient.ts
 *
 * Backend response shape for /dashboard/stats:
 *   salesToday: { revenue, count, cash, card, transfer }
 *   lowStockCount: number
 *   topProducts: [{ productId, productName, quantity, revenue }]
 */
import type { ApiResult } from '../contracts';
import { apiGet } from '../http';

export interface SalesTodaySummary {
  revenue: number;
  count: number;
  cash: number;
  card: number;
  transfer: number;
}

export interface TopSellingProduct {
  productId: number;
  productName: string;
  quantity: number;
  revenue: number;
}

export interface DashboardStats {
  salesToday: SalesTodaySummary | null;
  lowStockCount: number;
  topProducts: TopSellingProduct[];
}

export const dashboardClient = {
  getStats: (): Promise<ApiResult<DashboardStats>> => apiGet<DashboardStats>('/dashboard/stats'),
};

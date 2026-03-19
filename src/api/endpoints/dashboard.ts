/**
 * Dashboard API endpoints.
 *
 * Replaces: ipc/dashboardClient.ts
 */
import type { ApiResult } from '../contracts';
import { apiGet } from '../http';

export interface DailySalesSummary {
  totalSales: number;
  totalRevenue: number;
  averageSaleAmount: number;
}

export interface TopSellingProduct {
  productId: number;
  productName: string;
  totalQuantity: number;
  totalRevenue: number;
}

export interface DashboardStats {
  salesToday: DailySalesSummary | null;
  lowStockCount: number;
  topProducts: TopSellingProduct[];
}

export const dashboardClient = {
  getStats: (): Promise<ApiResult<DashboardStats>> => apiGet<DashboardStats>('/dashboard/stats'),
};

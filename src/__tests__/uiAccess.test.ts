/**
 * Tests for apps/ui/src/auth/uiAccess.ts
 *
 * Pure function tests — no Pinia, no mocks needed.
 * Each function is tested for all four roles: admin, manager, cashier, viewer.
 */
import { describe, it, expect } from 'vitest';
import {
  canManageProducts,
  canManageCustomers,
  canCreateSales,
  canManageSettings,
  canManageUsers,
  canManagePurchases,
  canManageSuppliers,
  canViewInventory,
  canAdjustStock,
  canViewAccounting,
  canPrintBarcodes,
} from '@/auth/uiAccess';

describe('uiAccess — canManageProducts', () => {
  it('admin: true', () => expect(canManageProducts('admin')).toBe(true));
  it('manager: true', () => expect(canManageProducts('manager')).toBe(true));
  it('cashier: false', () => expect(canManageProducts('cashier')).toBe(false));
  it('viewer: false', () => expect(canManageProducts('viewer')).toBe(false));
});

describe('uiAccess — canManageCustomers', () => {
  it('admin: true', () => expect(canManageCustomers('admin')).toBe(true));
  it('manager: true', () => expect(canManageCustomers('manager')).toBe(true));
  it('cashier: true', () => expect(canManageCustomers('cashier')).toBe(true));
  it('viewer: false', () => expect(canManageCustomers('viewer')).toBe(false));
});

describe('uiAccess — canCreateSales', () => {
  it('admin: true', () => expect(canCreateSales('admin')).toBe(true));
  it('manager: true', () => expect(canCreateSales('manager')).toBe(true));
  it('cashier: true', () => expect(canCreateSales('cashier')).toBe(true));
  it('viewer: false', () => expect(canCreateSales('viewer')).toBe(false));
});

describe('uiAccess — canManageSettings (admin only)', () => {
  it('admin: true', () => expect(canManageSettings('admin')).toBe(true));
  it('manager: false', () => expect(canManageSettings('manager')).toBe(false));
  it('cashier: false', () => expect(canManageSettings('cashier')).toBe(false));
  it('viewer: false', () => expect(canManageSettings('viewer')).toBe(false));
});

describe('uiAccess — canManageUsers (admin only)', () => {
  it('admin: true', () => expect(canManageUsers('admin')).toBe(true));
  it('manager: false', () => expect(canManageUsers('manager')).toBe(false));
  it('cashier: false', () => expect(canManageUsers('cashier')).toBe(false));
  it('viewer: false', () => expect(canManageUsers('viewer')).toBe(false));
});

describe('uiAccess — canManagePurchases', () => {
  it('admin: true', () => expect(canManagePurchases('admin')).toBe(true));
  it('manager: true', () => expect(canManagePurchases('manager')).toBe(true));
  it('cashier: false', () => expect(canManagePurchases('cashier')).toBe(false));
  it('viewer: false', () => expect(canManagePurchases('viewer')).toBe(false));
});

describe('uiAccess — canManageSuppliers', () => {
  it('admin: true', () => expect(canManageSuppliers('admin')).toBe(true));
  it('manager: true', () => expect(canManageSuppliers('manager')).toBe(true));
  it('cashier: false', () => expect(canManageSuppliers('cashier')).toBe(false));
  it('viewer: false', () => expect(canManageSuppliers('viewer')).toBe(false));
});

describe('uiAccess — canViewInventory', () => {
  it('admin: true', () => expect(canViewInventory('admin')).toBe(true));
  it('manager: true', () => expect(canViewInventory('manager')).toBe(true));
  it('cashier: false', () => expect(canViewInventory('cashier')).toBe(false));
  it('viewer: false', () => expect(canViewInventory('viewer')).toBe(false));
});

describe('uiAccess — canAdjustStock', () => {
  it('admin: true', () => expect(canAdjustStock('admin')).toBe(true));
  it('manager: true', () => expect(canAdjustStock('manager')).toBe(true));
  it('cashier: false', () => expect(canAdjustStock('cashier')).toBe(false));
  it('viewer: false', () => expect(canAdjustStock('viewer')).toBe(false));
});

describe('uiAccess — canViewAccounting (admin only)', () => {
  it('admin: true', () => expect(canViewAccounting('admin')).toBe(true));
  it('manager: false', () => expect(canViewAccounting('manager')).toBe(false));
  it('cashier: false', () => expect(canViewAccounting('cashier')).toBe(false));
  it('viewer: false', () => expect(canViewAccounting('viewer')).toBe(false));
});

describe('uiAccess — canPrintBarcodes', () => {
  it('admin: true', () => expect(canPrintBarcodes('admin')).toBe(true));
  it('manager: true', () => expect(canPrintBarcodes('manager')).toBe(true));
  it('cashier: false', () => expect(canPrintBarcodes('cashier')).toBe(false));
  it('viewer: false', () => expect(canPrintBarcodes('viewer')).toBe(false));
});

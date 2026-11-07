'use client';
// ============================================================
// STORE â€” localStorage CRUD helpers
// ============================================================

import {
  Customer, Product, PricingPlan, Subscription,
  Invoice, Payment, SubscriptionHistoryEntry
} from './types';
import {
  generateId, generateInvoiceNumber, getNextBillingDate,
  addMonths, addYears, getMonthLabel
} from './utils';

// â”€â”€â”€ Keys â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const KEYS = {
  customers: 'billing_customers',
  products: 'billing_products',
  plans: 'billing_plans',
  subscriptions: 'billing_subscriptions',
  invoices: 'billing_invoices',
  payments: 'billing_payments',
  seeded: 'billing_seeded',
};

function getItem<T>(key: string): T[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function setItem<T>(key: string, data: T[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(key, JSON.stringify(data));
}

// â”€â”€â”€ Generic CRUD â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function getAll<T>(key: string): T[] { return getItem<T>(key); }
function getById<T extends { id: string }>(key: string, id: string): T | undefined {
  return getItem<T>(key).find(item => item.id === id);
}
function create<T extends { id: string }>(key: string, item: T): T {
  const items = getItem<T>(key);
  items.push(item);
  setItem(key, items);
  return item;
}
function update<T extends { id: string }>(key: string, id: string, updates: Partial<T>): T | undefined {
  const items = getItem<T>(key);
  const idx = items.findIndex(i => i.id === id);
  if (idx === -1) return undefined;
  items[idx] = { ...items[idx], ...updates, updatedAt: new Date().toISOString() };
  setItem(key, items);
  return items[idx];
}
function remove<T extends { id: string }>(key: string, id: string): boolean {
  const items = getItem<T>(key);
  const filtered = items.filter(i => i.id !== id);
  if (filtered.length === items.length) return false;
  setItem(key, filtered);
  return true;
}


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

// â”€â”€â”€ Customers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export const CustomerStore = {
  getAll: () => getAll<Customer>(KEYS.customers),
  getById: (id: string) => getById<Customer>(KEYS.customers, id),
  create: (data: Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>) => {
    const now = new Date().toISOString();
    return create<Customer>(KEYS.customers, { ...data, id: generateId(), createdAt: now, updatedAt: now });
  },
  update: (id: string, data: Partial<Customer>) => update<Customer>(KEYS.customers, id, data),
  delete: (id: string) => remove<Customer>(KEYS.customers, id),
};

// â”€â”€â”€ Products â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export const ProductStore = {
  getAll: () => getAll<Product>(KEYS.products),
  getById: (id: string) => getById<Product>(KEYS.products, id),
  create: (data: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => {
    const now = new Date().toISOString();
    return create<Product>(KEYS.products, { ...data, id: generateId(), createdAt: now, updatedAt: now });
  },
  update: (id: string, data: Partial<Product>) => update<Product>(KEYS.products, id, data),
  delete: (id: string) => remove<Product>(KEYS.products, id),
};

// â”€â”€â”€ Pricing Plans â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export const PlanStore = {
  getAll: () => getAll<PricingPlan>(KEYS.plans),
  getById: (id: string) => getById<PricingPlan>(KEYS.plans, id),
  getByProduct: (productId: string) => getAll<PricingPlan>(KEYS.plans).filter(p => p.productId === productId),
  create: (data: Omit<PricingPlan, 'id' | 'createdAt' | 'updatedAt'>) => {
    const now = new Date().toISOString();
    return create<PricingPlan>(KEYS.plans, { ...data, id: generateId(), createdAt: now, updatedAt: now });
  },
  update: (id: string, data: Partial<PricingPlan>) => update<PricingPlan>(KEYS.plans, id, data),
  delete: (id: string) => remove<PricingPlan>(KEYS.plans, id),
};

// â”€â”€â”€ Subscriptions â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export const SubscriptionStore = {
  getAll: () => getAll<Subscription>(KEYS.subscriptions),
  getById: (id: string) => getById<Subscription>(KEYS.subscriptions, id),
  getByCustomer: (customerId: string) => getAll<Subscription>(KEYS.subscriptions).filter(s => s.customerId === customerId),
  create: (data: Omit<Subscription, 'id' | 'createdAt' | 'updatedAt' | 'history'>) => {
    const now = new Date().toISOString();
    const history: SubscriptionHistoryEntry[] = [{
      id: generateId(), date: now, action: 'Created', note: 'Subscription created'
    }];
    return create<Subscription>(KEYS.subscriptions, {
      ...data, id: generateId(), history, createdAt: now, updatedAt: now
    });
  },
  update: (id: string, data: Partial<Subscription>) => update<Subscription>(KEYS.subscriptions, id, data),
  addHistory: (id: string, entry: Omit<SubscriptionHistoryEntry, 'id'>) => {
    const sub = getById<Subscription>(KEYS.subscriptions, id);
    if (!sub) return;
    const history = [...(sub.history || []), { ...entry, id: generateId() }];
    update<Subscription>(KEYS.subscriptions, id, { history });
  },
  pause: (id: string) => {
    const now = new Date().toISOString();
    update<Subscription>(KEYS.subscriptions, id, { status: 'paused', pausedAt: now });
    SubscriptionStore.addHistory(id, { date: now, action: 'Paused', note: 'Subscription paused' });
  },
  resume: (id: string) => {
    const now = new Date().toISOString();
    update<Subscription>(KEYS.subscriptions, id, { status: 'active', pausedAt: undefined });
    SubscriptionStore.addHistory(id, { date: now, action: 'Resumed', note: 'Subscription resumed' });
  },
  cancel: (id: string) => {
    const now = new Date().toISOString();
    update<Subscription>(KEYS.subscriptions, id, { status: 'cancelled', cancelledAt: now });
    SubscriptionStore.addHistory(id, { date: now, action: 'Cancelled', note: 'Subscription cancelled' });
  },
  changePlan: (id: string, newPlanId: string, newProductId: string) => {
    const sub = getById<Subscription>(KEYS.subscriptions, id);
    if (!sub) return;
    const now = new Date().toISOString();
    const plan = getById<PricingPlan>(KEYS.plans, newPlanId);
    const nextDate = plan ? getNextBillingDate(now, plan.interval) : now;
    update<Subscription>(KEYS.subscriptions, id, {
      planId: newPlanId,
      productId: newProductId,
      currentPeriodStart: now,
      currentPeriodEnd: nextDate,
    });
    SubscriptionStore.addHistory(id, {
      date: now, action: 'Plan Changed',
      fromPlanId: sub.planId,
      toPlanId: newPlanId,
      note: 'Plan upgraded/downgraded'
    });
  },
  delete: (id: string) => remove<Subscription>(KEYS.subscriptions, id),
};

// â”€â”€â”€ Invoices â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export const InvoiceStore = {
  getAll: () => getAll<Invoice>(KEYS.invoices),
  getById: (id: string) => getById<Invoice>(KEYS.invoices, id),
  getByCustomer: (customerId: string) => getAll<Invoice>(KEYS.invoices).filter(i => i.customerId === customerId),
  create: (data: Omit<Invoice, 'id' | 'invoiceNumber' | 'createdAt' | 'updatedAt'>) => {
    const now = new Date().toISOString();
    return create<Invoice>(KEYS.invoices, {
      ...data,
      id: generateId(),
      invoiceNumber: generateInvoiceNumber(),
      createdAt: now,
      updatedAt: now,
    });
  },
  update: (id: string, data: Partial<Invoice>) => update<Invoice>(KEYS.invoices, id, data),
  markPaid: (id: string) => {
    update<Invoice>(KEYS.invoices, id, { status: 'paid', paidDate: new Date().toISOString() });
  },
  delete: (id: string) => remove<Invoice>(KEYS.invoices, id),
};

// â”€â”€â”€ Payments â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export const PaymentStore = {
  getAll: () => getAll<Payment>(KEYS.payments),
  getById: (id: string) => getById<Payment>(KEYS.payments, id),
  getByCustomer: (customerId: string) => getAll<Payment>(KEYS.payments).filter(p => p.customerId === customerId),
  getByInvoice: (invoiceId: string) => getAll<Payment>(KEYS.payments).filter(p => p.invoiceId === invoiceId),
  create: (data: Omit<Payment, 'id' | 'createdAt' | 'updatedAt'>) => {
    const now = new Date().toISOString();
    const payment = create<Payment>(KEYS.payments, { ...data, id: generateId(), createdAt: now, updatedAt: now });
    if (data.status === 'successful') {
      InvoiceStore.markPaid(data.invoiceId);
    }
    return payment;
  },
  update: (id: string, data: Partial<Payment>) => update<Payment>(KEYS.payments, id, data),
  delete: (id: string) => remove<Payment>(KEYS.payments, id),
};

// â”€â”€â”€ Dashboard Stats â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export function getDashboardStats() {
  const subscriptions = SubscriptionStore.getAll();
  const invoices = InvoiceStore.getAll();
  const payments = PaymentStore.getAll();
  const customers = CustomerStore.getAll();
  const plans = PlanStore.getAll();

  const activeSubscriptions = subscriptions.filter(s => s.status === 'active');
  const mrr = activeSubscriptions.reduce((sum, sub) => {
    const plan = plans.find(p => p.id === sub.planId);
    if (!plan) return sum;
    if (plan.interval === 'monthly') return sum + plan.price * sub.quantity;
    if (plan.interval === 'yearly') return sum + (plan.price / 12) * sub.quantity;
    return sum;
  }, 0);

  const totalRevenue = payments
    .filter(p => p.status === 'successful')
    .reduce((sum, p) => sum + p.amount, 0);

  const pendingInvoices = invoices.filter(i => i.status === 'pending').length;
  const overdueInvoices = invoices.filter(i => i.status === 'overdue').length;

  // Monthly revenue trend (last 6 months)
  const monthlyRevenueTrend = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    const month = getMonthLabel(d);
    const monthStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const revenue = payments
      .filter(p => p.status === 'successful' && p.date.startsWith(monthStr))
      .reduce((sum, p) => sum + p.amount, 0);
    const subsCount = subscriptions.filter(
      s => s.createdAt.startsWith(monthStr) && s.status === 'active'
    ).length;
    monthlyRevenueTrend.push({ month, revenue, subscriptions: subsCount });
  }

  // Upcoming renewals (next 30 days)
  const now = new Date();
  const in30 = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  const upcomingRenewals = activeSubscriptions
    .filter(s => {
      const end = new Date(s.currentPeriodEnd);
      return end >= now && end <= in30;
    })
    .map(sub => {
      const customer = customers.find(c => c.id === sub.customerId);
      const plan = plans.find(p => p.id === sub.planId);
      return customer && plan ? { subscription: sub, customer, plan } : null;
    })
    .filter(Boolean) as { subscription: Subscription; customer: Customer; plan: PricingPlan }[];

  // Recent payments
  const recentPayments = payments
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 8)
    .map(p => {
      const customer = customers.find(c => c.id === p.customerId);
      const invoice = invoices.find(i => i.id === p.invoiceId);
      return {
        ...p,
        customerName: customer?.name || 'Unknown',
        invoiceNumber: invoice?.invoiceNumber || 'â€”',
      };
    });

  return {
    mrr,
    totalRevenue,
    activeSubscriptions: activeSubscriptions.length,
    pendingInvoices,
    overdueInvoices,
    totalCustomers: customers.length,
    monthlyRevenueTrend,
    upcomingRenewals,
    recentPayments,
  };
}

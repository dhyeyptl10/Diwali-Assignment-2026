'use client';
// ============================================================
// STORE — localStorage CRUD helpers
// ============================================================

import {
  Customer, Product, PricingPlan, Subscription,
  Invoice, Payment, SubscriptionHistoryEntry
} from './types';
import {
  generateId, generateInvoiceNumber, getNextBillingDate,
  addMonths, addYears, getMonthLabel
} from './utils';

// ─── Keys ───────────────────────────────────────────────────
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

// ─── Generic CRUD ───────────────────────────────────────────
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

// ─── Customers ──────────────────────────────────────────────
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

// ─── Products ───────────────────────────────────────────────
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

// ─── Pricing Plans ──────────────────────────────────────────
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

// ─── Subscriptions ──────────────────────────────────────────
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

// ─── Invoices ───────────────────────────────────────────────
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

// ─── Payments ───────────────────────────────────────────────
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

// ─── Dashboard Stats ─────────────────────────────────────────
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
        invoiceNumber: invoice?.invoiceNumber || '—',
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

// ─── Seed Data ───────────────────────────────────────────────
export function seedIfEmpty() {
  if (typeof window === 'undefined') return;
  if (localStorage.getItem(KEYS.seeded)) return;

  const now = new Date();

  // Customers
  const c1 = CustomerStore.create({
    name: 'Acme Corp', email: 'billing@acme.com', phone: '+1 555-0101', company: 'Acme Corporation',
    address: { street: '123 Main St', city: 'San Francisco', state: 'CA', zip: '94105', country: 'US' },
    notes: 'Enterprise client, priority support',
  });
  const c2 = CustomerStore.create({
    name: 'Sarah Johnson', email: 'sarah@startup.io', phone: '+1 555-0202', company: 'Startup.io',
    address: { street: '456 Tech Ave', city: 'Austin', state: 'TX', zip: '78701', country: 'US' },
  });
  const c3 = CustomerStore.create({
    name: 'Marcus Lee', email: 'marcus@freelance.dev', phone: '+1 555-0303',
    address: { street: '789 Creative Blvd', city: 'New York', state: 'NY', zip: '10001', country: 'US' },
  });
  const c4 = CustomerStore.create({
    name: 'TechVenture Ltd', email: 'accounts@techventure.com', phone: '+44 20 7946 0958', company: 'TechVenture Ltd',
    address: { street: '10 Downing St', city: 'London', state: 'ENG', zip: 'SW1A 2AA', country: 'UK' },
  });

  // Products
  const p1 = ProductStore.create({ name: 'BillingPro', description: 'Full-featured billing & subscription management', category: 'Software', active: true });
  const p2 = ProductStore.create({ name: 'Analytics Suite', description: 'Advanced analytics and reporting dashboard', category: 'Software', active: true });
  const p3 = ProductStore.create({ name: 'API Access', description: 'RESTful API with high rate limits', category: 'Service', active: true });

  // Plans
  const plan1 = PlanStore.create({
    productId: p1.id, name: 'Starter', description: 'For freelancers', price: 29,
    currency: 'USD', interval: 'monthly',
    features: ['5 Customers', '50 Invoices/mo', 'Basic Analytics', 'Email Support'],
    active: true,
  });
  const plan2 = PlanStore.create({
    productId: p1.id, name: 'Professional', description: 'For growing teams', price: 79,
    currency: 'USD', interval: 'monthly',
    features: ['Unlimited Customers', 'Unlimited Invoices', 'Advanced Analytics', 'Priority Support', 'API Access'],
    active: true,
  });
  const plan3 = PlanStore.create({
    productId: p1.id, name: 'Enterprise Annual', description: 'Best value for large teams', price: 699,
    currency: 'USD', interval: 'yearly',
    features: ['Everything in Pro', 'Custom Integrations', 'Dedicated Support', 'SLA Guarantee'],
    active: true,
  });
  const plan4 = PlanStore.create({
    productId: p2.id, name: 'Analytics Basic', description: 'Monthly analytics', price: 19,
    currency: 'USD', interval: 'monthly',
    features: ['30-day data retention', '5 Dashboards', 'CSV Export'],
    active: true,
  });
  const plan5 = PlanStore.create({
    productId: p3.id, name: 'API Starter', description: 'One-time API setup', price: 199,
    currency: 'USD', interval: 'one-time',
    features: ['10,000 requests/day', 'API Key Management', '99.9% Uptime'],
    active: true,
  });

  // Subscriptions
  const threeMonthsAgo = new Date(now); threeMonthsAgo.setMonth(now.getMonth() - 3);
  const twoMonthsAgo = new Date(now); twoMonthsAgo.setMonth(now.getMonth() - 2);
  const nextMonth = new Date(now); nextMonth.setMonth(now.getMonth() + 1);
  const nextWeek = new Date(now); nextWeek.setDate(now.getDate() + 7);
  const inTwoDays = new Date(now); inTwoDays.setDate(now.getDate() + 2);

  const sub1 = SubscriptionStore.create({
    customerId: c1.id, planId: plan2.id, productId: p1.id,
    status: 'active', quantity: 1, discount: 0,
    startDate: threeMonthsAgo.toISOString(),
    currentPeriodStart: twoMonthsAgo.toISOString(),
    currentPeriodEnd: nextMonth.toISOString(),
  });
  const sub2 = SubscriptionStore.create({
    customerId: c2.id, planId: plan1.id, productId: p1.id,
    status: 'active', quantity: 1, discount: 10,
    startDate: twoMonthsAgo.toISOString(),
    currentPeriodStart: new Date(now.getFullYear(), now.getMonth(), 1).toISOString(),
    currentPeriodEnd: inTwoDays.toISOString(),
  });
  const sub3 = SubscriptionStore.create({
    customerId: c3.id, planId: plan4.id, productId: p2.id,
    status: 'paused', quantity: 1, discount: 0,
    startDate: threeMonthsAgo.toISOString(),
    currentPeriodStart: twoMonthsAgo.toISOString(),
    currentPeriodEnd: nextWeek.toISOString(),
    pausedAt: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString(),
  });
  const sub4 = SubscriptionStore.create({
    customerId: c4.id, planId: plan3.id, productId: p1.id,
    status: 'active', quantity: 3, discount: 15,
    startDate: new Date(now.getFullYear() - 1, now.getMonth(), 1).toISOString(),
    currentPeriodStart: new Date(now.getFullYear(), 0, 1).toISOString(),
    currentPeriodEnd: new Date(now.getFullYear() + 1, 0, 1).toISOString(),
  });

  // Invoices
  const dueLastMonth = new Date(now); dueLastMonth.setMonth(now.getMonth() - 1);
  const dueSoon = new Date(now); dueSoon.setDate(now.getDate() + 14);

  const inv1 = InvoiceStore.create({
    customerId: c1.id, subscriptionId: sub1.id,
    status: 'paid',
    lineItems: [{ id: generateId(), description: 'Professional Plan — Monthly', quantity: 1, unitPrice: 79, total: 79 }],
    subtotal: 79, discountPercent: 0, discountAmount: 0, taxPercent: 8, taxAmount: 6.32, total: 85.32,
    issuedDate: twoMonthsAgo.toISOString(),
    dueDate: new Date(twoMonthsAgo.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    paidDate: new Date(twoMonthsAgo.getTime() + 5 * 24 * 60 * 60 * 1000).toISOString(),
    notes: 'Thank you for your business!',
  });
  const inv2 = InvoiceStore.create({
    customerId: c1.id, subscriptionId: sub1.id,
    status: 'pending',
    lineItems: [{ id: generateId(), description: 'Professional Plan — Monthly', quantity: 1, unitPrice: 79, total: 79 }],
    subtotal: 79, discountPercent: 0, discountAmount: 0, taxPercent: 8, taxAmount: 6.32, total: 85.32,
    issuedDate: now.toISOString(),
    dueDate: dueSoon.toISOString(),
    notes: 'Please pay within 14 days.',
  });
  const inv3 = InvoiceStore.create({
    customerId: c2.id, subscriptionId: sub2.id,
    status: 'overdue',
    lineItems: [{ id: generateId(), description: 'Starter Plan — Monthly (10% discount)', quantity: 1, unitPrice: 29, total: 29 }],
    subtotal: 29, discountPercent: 10, discountAmount: 2.90, taxPercent: 0, taxAmount: 0, total: 26.10,
    issuedDate: dueLastMonth.toISOString(),
    dueDate: new Date(dueLastMonth.getTime() + 15 * 24 * 60 * 60 * 1000).toISOString(),
    notes: 'Payment overdue. Please settle immediately.',
  });
  const inv4 = InvoiceStore.create({
    customerId: c4.id, subscriptionId: sub4.id,
    status: 'paid',
    lineItems: [
      { id: generateId(), description: 'Enterprise Annual Plan × 3 seats', quantity: 3, unitPrice: 699, total: 2097 },
      { id: generateId(), description: 'Setup & Onboarding', quantity: 1, unitPrice: 299, total: 299 },
    ],
    subtotal: 2396, discountPercent: 15, discountAmount: 359.40, taxPercent: 20, taxAmount: 407.32, total: 2443.92,
    issuedDate: new Date(now.getFullYear(), 0, 5).toISOString(),
    dueDate: new Date(now.getFullYear(), 0, 20).toISOString(),
    paidDate: new Date(now.getFullYear(), 0, 12).toISOString(),
    notes: 'Enterprise agreement — Annual renewal.',
  });
  InvoiceStore.create({
    customerId: c3.id,
    status: 'draft',
    lineItems: [{ id: generateId(), description: 'API Starter Pack', quantity: 1, unitPrice: 199, total: 199 }],
    subtotal: 199, discountPercent: 0, discountAmount: 0, taxPercent: 0, taxAmount: 0, total: 199,
    issuedDate: now.toISOString(),
    dueDate: dueSoon.toISOString(),
  });

  // Payments
  const monthsAgo = (n: number) => {
    const d = new Date(now);
    d.setMonth(d.getMonth() - n);
    return d.toISOString();
  };

  PaymentStore.create({
    invoiceId: inv1.id, customerId: c1.id, amount: 85.32, currency: 'USD',
    method: 'card', status: 'successful', date: monthsAgo(2),
    transactionId: 'TXN-' + Math.random().toString(36).substr(2, 9).toUpperCase(),
    notes: 'Auto-charge via saved card',
  });
  PaymentStore.create({
    invoiceId: inv4.id, customerId: c4.id, amount: 2443.92, currency: 'USD',
    method: 'bank_transfer', status: 'successful', date: new Date(now.getFullYear(), 0, 12).toISOString(),
    transactionId: 'TXN-' + Math.random().toString(36).substr(2, 9).toUpperCase(),
    notes: 'Wire transfer received',
  });
  PaymentStore.create({
    invoiceId: inv3.id, customerId: c2.id, amount: 26.10, currency: 'USD',
    method: 'card', status: 'failed', date: monthsAgo(1),
    notes: 'Card declined — insufficient funds',
  });
  PaymentStore.create({
    invoiceId: inv2.id, customerId: c1.id, amount: 85.32, currency: 'USD',
    method: 'card', status: 'pending', date: now.toISOString(),
    notes: 'Awaiting confirmation',
  });

  localStorage.setItem(KEYS.seeded, 'true');
}

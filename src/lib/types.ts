// ============================================================
// TYPES — Billing & Subscription Management SaaS
// ============================================================

export type BillingInterval = 'monthly' | 'yearly' | 'one-time';

export type SubscriptionStatus = 'active' | 'paused' | 'cancelled' | 'past_due';

export type InvoiceStatus = 'draft' | 'pending' | 'paid' | 'overdue';

export type PaymentStatus = 'successful' | 'pending' | 'failed';

export type PaymentMethod = 'card' | 'bank_transfer' | 'cash' | 'crypto' | 'check';

// ─────────────────────────── Customer ───────────────────────
export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  company?: string;
  address: {
    street: string;
    city: string;
    state: string;
    zip: string;
    country: string;
  };
  createdAt: string;
  updatedAt: string;
  notes?: string;
}

// ─────────────────────────── Product ────────────────────────
export interface Product {
  id: string;
  name: string;
  description: string;
  category: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

// ─────────────────────────── Pricing Plan ───────────────────
export interface PricingPlan {
  id: string;
  productId: string;
  name: string;
  description?: string;
  price: number;
  currency: string;
  interval: BillingInterval;
  features: string[];
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

// ─────────────────────────── Subscription ───────────────────
export interface Subscription {
  id: string;
  customerId: string;
  planId: string;
  productId: string;
  status: SubscriptionStatus;
  startDate: string;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelledAt?: string;
  pausedAt?: string;
  trialEndDate?: string;
  quantity: number;
  discount: number; // percentage
  notes?: string;
  history: SubscriptionHistoryEntry[];
  createdAt: string;
  updatedAt: string;
}

export interface SubscriptionHistoryEntry {
  id: string;
  date: string;
  action: string;
  fromPlanId?: string;
  toPlanId?: string;
  note?: string;
}

// ─────────────────────────── Invoice ────────────────────────
export interface InvoiceLineItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  customerId: string;
  subscriptionId?: string;
  status: InvoiceStatus;
  lineItems: InvoiceLineItem[];
  subtotal: number;
  discountPercent: number;
  discountAmount: number;
  taxPercent: number;
  taxAmount: number;
  total: number;
  dueDate: string;
  issuedDate: string;
  paidDate?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// ─────────────────────────── Payment ────────────────────────
export interface Payment {
  id: string;
  invoiceId: string;
  customerId: string;
  amount: number;
  currency: string;
  method: PaymentMethod;
  status: PaymentStatus;
  transactionId?: string;
  date: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// ─────────────────────────── Dashboard ──────────────────────
export interface DashboardStats {
  mrr: number;
  totalRevenue: number;
  activeSubscriptions: number;
  pendingInvoices: number;
  overdueInvoices: number;
  totalCustomers: number;
  monthlyRevenueTrend: { month: string; revenue: number; subscriptions: number }[];
  upcomingRenewals: { subscription: Subscription; customer: Customer; plan: PricingPlan }[];
  recentPayments: (Payment & { customerName: string; invoiceNumber: string })[];
}

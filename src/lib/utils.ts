// ============================================================
// UTILS — Billing & Subscription Management SaaS
// ============================================================

export function generateId(): string {
  return Math.random().toString(36).substring(2, 11) + Date.now().toString(36);
}

export function generateInvoiceNumber(): string {
  const year = new Date().getFullYear();
  const rand = Math.floor(Math.random() * 100000).toString().padStart(5, '0');
  return `INV-${year}-${rand}`;
}

export function formatCurrency(amount: number, currency = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(amount);
}

export function formatDate(dateString: string): string {
  if (!dateString) return '—';
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(date);
}

export function formatDateTime(dateString: string): string {
  if (!dateString) return '—';
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

export function addMonths(date: Date, months: number): Date {
  const result = new Date(date);
  result.setMonth(result.getMonth() + months);
  return result;
}

export function addYears(date: Date, years: number): Date {
  const result = new Date(date);
  result.setFullYear(result.getFullYear() + years);
  return result;
}

export function getNextBillingDate(startDate: string, interval: string): string {
  const start = new Date(startDate);
  const now = new Date();
  
  if (interval === 'one-time') return startDate;
  
  let next = new Date(start);
  while (next <= now) {
    if (interval === 'monthly') next = addMonths(next, 1);
    else if (interval === 'yearly') next = addYears(next, 1);
  }
  return next.toISOString();
}

export function truncate(str: string, length = 30): string {
  if (!str) return '';
  return str.length > length ? str.substring(0, length) + '…' : str;
}

export function getMonthLabel(date: Date): string {
  return new Intl.DateTimeFormat('en-US', { month: 'short', year: '2-digit' }).format(date);
}

export function daysUntil(dateString: string): number {
  const date = new Date(dateString);
  const now = new Date();
  const diff = date.getTime() - now.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export function isOverdue(dateString: string): boolean {
  return new Date(dateString) < new Date();
}

export function classNames(...classes: (string | boolean | undefined | null)[]): string {
  return classes.filter(Boolean).join(' ');
}

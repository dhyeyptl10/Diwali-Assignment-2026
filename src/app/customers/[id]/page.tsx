'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  CustomerStore, SubscriptionStore, InvoiceStore,
  PaymentStore, PlanStore, seedIfEmpty
} from '@/lib/store';
import { formatDate, formatCurrency } from '@/lib/utils';
import type { Customer, Subscription, Invoice, Payment, PricingPlan } from '@/lib/types';
import Badge from '@/components/Badge';
import {
  ArrowLeft, Building, Mail, Phone, MapPin,
  Calendar, Zap, FileText, CreditCard, Plus
} from 'lucide-react';
import Link from 'next/link';

export default function CustomerDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [customer, setCustomer] = useState<Customer | null>(null);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [plans, setPlans] = useState<PricingPlan[]>([]);
  const [tab, setTab] = useState<'overview' | 'subscriptions' | 'invoices' | 'payments'>('overview');

  useEffect(() => {
    seedIfEmpty();
    const c = CustomerStore.getById(id);
    if (!c) { router.push('/customers'); return; }
    setCustomer(c);
    setSubscriptions(SubscriptionStore.getByCustomer(id));
    setInvoices(InvoiceStore.getByCustomer(id));
    setPayments(PaymentStore.getByCustomer(id));
    setPlans(PlanStore.getAll());
  }, [id, router]);

  if (!customer) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '50vh' }}>
        <div className="spinner" />
      </div>
    );
  }

  const totalSpent = payments
    .filter(p => p.status === 'successful')
    .reduce((s, p) => s + p.amount, 0);

  const activeSub = subscriptions.filter(s => s.status === 'active').length;

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <Link href="/customers" className="btn btn-ghost btn-sm btn-icon">
            <ArrowLeft size={16} />
          </Link>
          <div>
            <h1 className="page-title">{customer.name}</h1>
            <p className="page-subtitle">{customer.company || customer.email}</p>
          </div>
        </div>
        <div className="page-header-actions">
          <Link href="/subscriptions" className="btn btn-primary btn-sm">
            <Plus size={14} /> Add Subscription
          </Link>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs">
        {(['overview', 'subscriptions', 'invoices', 'payments'] as const).map(t => (
          <button
            key={t}
            className={`tab ${tab === t ? 'active' : ''}`}
            onClick={() => setTab(t)}
          >
            {t.charAt(0).toUpperCase() + t.slice(1)}
            {t === 'subscriptions' && <span className="tab-count">{subscriptions.length}</span>}
            {t === 'invoices' && <span className="tab-count">{invoices.length}</span>}
            {t === 'payments' && <span className="tab-count">{payments.length}</span>}
          </button>
        ))}
      </div>

      {/* Tab: Overview */}
      {tab === 'overview' && (
        <div className="detail-grid">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div className="card">
              <div className="section-title">Customer Information</div>
              <div className="detail-info-row">
                <div className="detail-info-label">Full Name</div>
                <div className="detail-info-value">{customer.name}</div>
              </div>
              <div className="detail-info-row">
                <div className="detail-info-label">Email</div>
                <div className="detail-info-value" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Mail size={13} style={{ color: 'var(--text-muted)' }} />
                  {customer.email}
                </div>
              </div>
              <div className="detail-info-row">
                <div className="detail-info-label">Phone</div>
                <div className="detail-info-value" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Phone size={13} style={{ color: 'var(--text-muted)' }} />
                  {customer.phone || '—'}
                </div>
              </div>
              <div className="detail-info-row">
                <div className="detail-info-label">Company</div>
                <div className="detail-info-value" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Building size={13} style={{ color: 'var(--text-muted)' }} />
                  {customer.company || '—'}
                </div>
              </div>
              <div className="detail-info-row">
                <div className="detail-info-label">Address</div>
                <div className="detail-info-value" style={{ display: 'flex', alignItems: 'flex-start', gap: 6 }}>
                  <MapPin size={13} style={{ color: 'var(--text-muted)', marginTop: 2, flexShrink: 0 }} />
                  <span>
                    {customer.address.street}<br />
                    {customer.address.city}, {customer.address.state} {customer.address.zip}<br />
                    {customer.address.country}
                  </span>
                </div>
              </div>
              <div className="detail-info-row">
                <div className="detail-info-label">Customer Since</div>
                <div className="detail-info-value" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Calendar size={13} style={{ color: 'var(--text-muted)' }} />
                  {formatDate(customer.createdAt)}
                </div>
              </div>
              {customer.notes && (
                <div className="detail-info-row">
                  <div className="detail-info-label">Notes</div>
                  <div className="detail-info-value">{customer.notes}</div>
                </div>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="card">
              <div className="section-title">Billing Summary</div>
              <div className="detail-info-row">
                <div className="detail-info-label">Total Spend</div>
                <div className="detail-info-value" style={{ color: 'var(--success)', fontWeight: 700 }}>
                  {formatCurrency(totalSpent)}
                </div>
              </div>
              <div className="detail-info-row">
                <div className="detail-info-label">Active Subs</div>
                <div className="detail-info-value" style={{ color: 'var(--accent-light)', fontWeight: 700 }}>
                  {activeSub}
                </div>
              </div>
              <div className="detail-info-row">
                <div className="detail-info-label">Invoices</div>
                <div className="detail-info-value">{invoices.length}</div>
              </div>
              <div className="detail-info-row">
                <div className="detail-info-label">Payments</div>
                <div className="detail-info-value">{payments.length}</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Subscriptions */}
      {tab === 'subscriptions' && (
        <div className="table-wrapper">
          {subscriptions.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon"><Zap size={32} /></div>
              <div className="empty-state-title">No subscriptions</div>
              <div className="empty-state-desc">This customer has no active or past subscriptions.</div>
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Plan</th>
                  <th>Status</th>
                  <th>Quantity</th>
                  <th>Started</th>
                  <th>Next Billing</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {subscriptions.map(s => {
                  const plan = plans.find(p => p.id === s.planId);
                  return (
                    <tr key={s.id}>
                      <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{plan?.name || s.planId}</td>
                      <td><Badge status={s.status} dot /></td>
                      <td>{s.quantity}</td>
                      <td>{formatDate(s.startDate)}</td>
                      <td>{formatDate(s.currentPeriodEnd)}</td>
                      <td>
                        <Link href={`/subscriptions/${s.id}`} className="btn btn-ghost btn-sm">
                          Manage
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Tab: Invoices */}
      {tab === 'invoices' && (
        <div className="table-wrapper">
          {invoices.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon"><FileText size={32} /></div>
              <div className="empty-state-title">No invoices</div>
              <div className="empty-state-desc">No invoices have been generated for this customer yet.</div>
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Invoice #</th>
                  <th>Status</th>
                  <th>Issued</th>
                  <th>Due Date</th>
                  <th>Total</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map(i => (
                  <tr key={i.id}>
                    <td style={{ fontFamily: 'monospace', color: 'var(--text-accent)' }}>{i.invoiceNumber}</td>
                    <td><Badge status={i.status} dot /></td>
                    <td>{formatDate(i.issuedDate)}</td>
                    <td>{formatDate(i.dueDate)}</td>
                    <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{formatCurrency(i.total)}</td>
                    <td>
                      <Link href={`/invoices/${i.id}`} className="btn btn-ghost btn-sm">View</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Tab: Payments */}
      {tab === 'payments' && (
        <div className="table-wrapper">
          {payments.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon"><CreditCard size={32} /></div>
              <div className="empty-state-title">No payments</div>
              <div className="empty-state-desc">No payment transactions found for this customer.</div>
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Amount</th>
                  <th>Method</th>
                  <th>Status</th>
                  <th>Transaction ID</th>
                </tr>
              </thead>
              <tbody>
                {payments.map(p => (
                  <tr key={p.id}>
                    <td>{formatDate(p.date)}</td>
                    <td style={{ fontWeight: 600, color: p.status === 'successful' ? 'var(--success)' : 'var(--danger)' }}>
                      {formatCurrency(p.amount)}
                    </td>
                    <td><span className="method-badge">{p.method.replace('_', ' ')}</span></td>
                    <td><Badge status={p.status} dot /></td>
                    <td style={{ fontSize: 12, fontFamily: 'monospace', color: 'var(--text-muted)' }}>{p.transactionId || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}

'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  SubscriptionStore, CustomerStore, PlanStore,
  ProductStore, seedIfEmpty
} from '@/lib/store';
import { formatDate, formatCurrency, daysUntil } from '@/lib/utils';
import type { Subscription, Customer, PricingPlan, Product } from '@/lib/types';
import Modal from '@/components/Modal';
import Badge from '@/components/Badge';
import {
  ArrowLeft, Pause, Play, XCircle, RefreshCw,
  Clock, Check, User, Package, Calendar
} from 'lucide-react';
import Link from 'next/link';

export default function SubscriptionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [sub, setSub] = useState<Subscription | null>(null);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [plan, setPlan] = useState<PricingPlan | null>(null);
  const [product, setProduct] = useState<Product | null>(null);
  const [allPlans, setAllPlans] = useState<PricingPlan[]>([]);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [showChangePlan, setShowChangePlan] = useState(false);
  const [showCancel, setShowCancel] = useState(false);
  const [newPlanId, setNewPlanId] = useState('');

  function reload() {
    seedIfEmpty();
    const s = SubscriptionStore.getById(id);
    if (!s) { router.push('/subscriptions'); return; }
    setSub(s);
    setCustomer(CustomerStore.getById(s.customerId) || null);
    setPlan(PlanStore.getById(s.planId) || null);
    setProduct(ProductStore.getById(s.productId) || null);
    setAllPlans(PlanStore.getAll().filter(p => p.active));
    setAllProducts(ProductStore.getAll());
  }

  useEffect(() => { reload(); }, [id]);

  if (!sub || !customer) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '50vh' }}>
      <div className="spinner" />
    </div>
  );

  const amount = plan ? plan.price * sub.quantity * (1 - sub.discount / 100) : 0;
  const daysLeft = sub.status === 'active' ? daysUntil(sub.currentPeriodEnd) : 0;
  const totalDays = (() => {
    if (!plan || sub.status !== 'active') return 30;
    if (plan.interval === 'yearly') return 365;
    return 30;
  })();
  const progress = Math.max(0, Math.min(100, ((totalDays - daysLeft) / totalDays) * 100));

  function handleChangePlan() {
    if (!newPlanId) return;
    const np = allPlans.find(p => p.id === newPlanId);
    if (!np) return;
    SubscriptionStore.changePlan(id, newPlanId, np.productId);
    setShowChangePlan(false);
    reload();
  }

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <Link href="/subscriptions" className="btn btn-ghost btn-sm btn-icon">
            <ArrowLeft size={16} />
          </Link>
          <div>
            <h1 className="page-title">
              Subscription <span style={{ color: 'var(--text-muted)', fontSize: 18 }}>#{sub.id.slice(0, 8)}</span>
            </h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 4 }}>
              <Badge status={sub.status} dot />
              <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>{customer.name}</span>
            </div>
          </div>
        </div>
        <div className="page-header-actions">
          {sub.status === 'active' && (
            <button className="btn btn-warning btn-sm" onClick={() => { SubscriptionStore.pause(id); reload(); }}>
              <Pause size={14} /> Pause
            </button>
          )}
          {sub.status === 'paused' && (
            <button className="btn btn-success btn-sm" onClick={() => { SubscriptionStore.resume(id); reload(); }}>
              <Play size={14} /> Resume
            </button>
          )}
          {(sub.status === 'active' || sub.status === 'paused') && (
            <>
              <button className="btn btn-secondary btn-sm" onClick={() => setShowChangePlan(true)}>
                <RefreshCw size={14} /> Change Plan
              </button>
              <button className="btn btn-danger btn-sm" onClick={() => setShowCancel(true)}>
                <XCircle size={14} /> Cancel
              </button>
            </>
          )}
        </div>
      </div>

      <div className="detail-grid">
        {/* Main Info */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div className="card">
            <div className="section-title">Subscription Details</div>
            {[
              { label: 'Customer', value: <Link href={`/customers/${customer.id}`} style={{ color: 'var(--text-accent)' }}>{customer.name}</Link>, icon: <User size={14} /> },
              { label: 'Product', value: product?.name || '—', icon: <Package size={14} /> },
              { label: 'Plan', value: plan?.name || '—', icon: null },
              { label: 'Billing Interval', value: plan ? <Badge status={plan.interval} /> : '—', icon: null },
              { label: 'Quantity', value: sub.quantity, icon: null },
              { label: 'Discount', value: sub.discount > 0 ? `${sub.discount}%` : 'None', icon: null },
              {
                label: 'Amount',
                value: <span style={{ color: 'var(--text-accent)', fontWeight: 700, fontSize: 15 }}>{formatCurrency(amount)}</span>,
                icon: null,
              },
              { label: 'Started', value: formatDate(sub.startDate), icon: <Calendar size={14} /> },
              {
                label: 'Current Period',
                value: `${formatDate(sub.currentPeriodStart)} → ${formatDate(sub.currentPeriodEnd)}`,
                icon: null,
              },
              ...(sub.cancelledAt ? [{ label: 'Cancelled', value: formatDate(sub.cancelledAt), icon: null }] : []),
              ...(sub.pausedAt ? [{ label: 'Paused', value: formatDate(sub.pausedAt), icon: null }] : []),
              ...(sub.notes ? [{ label: 'Notes', value: sub.notes, icon: null }] : []),
            ].map((row, i) => (
              <div key={i} className="detail-info-row">
                <div className="detail-info-label">{row.label}</div>
                <div className="detail-info-value" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  {row.icon && <span style={{ color: 'var(--text-muted)' }}>{row.icon}</span>}
                  {row.value as React.ReactNode}
                </div>
              </div>
            ))}
          </div>

          {/* Features */}
          {plan && plan.features.length > 0 && (
            <div className="card">
              <div className="section-title">Plan Features</div>
              <ul className="feature-list">
                {plan.features.map((f, i) => (
                  <li key={i}>
                    <Check size={14} className="feature-check" />
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* History */}
          {sub.history && sub.history.length > 0 && (
            <div className="card">
              <div className="section-title">Activity History</div>
              <div className="timeline">
                {[...sub.history].reverse().map((entry) => (
                  <div key={entry.id} className="timeline-item">
                    <div className="timeline-dot">📋</div>
                    <div className="timeline-content">
                      <div className="timeline-action">{entry.action}</div>
                      {entry.note && (
                        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{entry.note}</div>
                      )}
                      <div className="timeline-date">{formatDate(entry.date)}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Renewal Progress */}
          {sub.status === 'active' && (
            <div className="card">
              <div className="section-title" style={{ marginBottom: 8 }}>
                <Clock size={15} /> Billing Period
              </div>
              <div style={{ fontSize: 24, fontWeight: 800, color: daysLeft <= 3 ? 'var(--danger)' : 'var(--text-primary)', marginBottom: 4 }}>
                {daysLeft}
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 12 }}>
                days until renewal on {formatDate(sub.currentPeriodEnd)}
              </div>
              <div className="renewal-progress">
                <div className="renewal-bar-track">
                  <div className="renewal-bar-fill" style={{ width: `${progress}%` }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, fontSize: 11, color: 'var(--text-muted)' }}>
                  <span>Period start</span>
                  <span>Renewal</span>
                </div>
              </div>
            </div>
          )}

          {/* Billing Summary */}
          <div className="card">
            <div className="section-title">Billing</div>
            <div className="detail-info-row">
              <div className="detail-info-label">Amount</div>
              <div className="detail-info-value" style={{ color: 'var(--text-accent)', fontWeight: 700 }}>
                {formatCurrency(amount)}
              </div>
            </div>
            {sub.discount > 0 && (
              <div className="detail-info-row">
                <div className="detail-info-label">Discount</div>
                <div className="detail-info-value" style={{ color: 'var(--success)' }}>{sub.discount}%</div>
              </div>
            )}
            <div className="detail-info-row">
              <div className="detail-info-label">Interval</div>
              <div className="detail-info-value">{plan?.interval || '—'}</div>
            </div>
            <div className="detail-info-row">
              <div className="detail-info-label">Quantity</div>
              <div className="detail-info-value">{sub.quantity} seat{sub.quantity > 1 ? 's' : ''}</div>
            </div>
          </div>

          {/* Quick links */}
          <div className="card">
            <div className="section-title">Quick Links</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <Link href={`/customers/${customer.id}`} className="btn btn-secondary btn-sm" style={{ justifyContent: 'center' }}>
                <User size={13} /> View Customer
              </Link>
              <Link href="/invoices" className="btn btn-secondary btn-sm" style={{ justifyContent: 'center' }}>
                View Invoices
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Change Plan Modal */}
      <Modal
        isOpen={showChangePlan}
        onClose={() => setShowChangePlan(false)}
        title="Change Plan"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setShowChangePlan(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={handleChangePlan}>Confirm Change</button>
          </>
        }
      >
        <p style={{ color: 'var(--text-secondary)', marginBottom: 16 }}>
          Current plan: <strong style={{ color: 'var(--text-primary)' }}>{plan?.name}</strong>
        </p>
        <div className="form-group">
          <label className="form-label">New Plan</label>
          <select className="form-select" value={newPlanId} onChange={e => setNewPlanId(e.target.value)}>
            <option value="">Select a plan…</option>
            {allPlans.filter(p => p.id !== sub.planId).map(p => {
              const prod = allProducts.find(pr => pr.id === p.productId);
              return (
                <option key={p.id} value={p.id}>
                  {prod?.name} — {p.name} ({formatCurrency(p.price)}/{p.interval})
                </option>
              );
            })}
          </select>
        </div>
      </Modal>

      {/* Cancel Modal */}
      <Modal
        isOpen={showCancel}
        onClose={() => setShowCancel(false)}
        title="Cancel Subscription"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setShowCancel(false)}>Keep Subscription</button>
            <button className="btn btn-danger" onClick={() => { SubscriptionStore.cancel(id); setShowCancel(false); reload(); }}>
              Cancel Subscription
            </button>
          </>
        }
      >
        <p style={{ color: 'var(--text-secondary)' }}>
          Are you sure you want to cancel this subscription for{' '}
          <strong style={{ color: 'var(--text-primary)' }}>{customer.name}</strong>?
          The subscription will be marked as cancelled immediately.
        </p>
      </Modal>
    </div>
  );
}

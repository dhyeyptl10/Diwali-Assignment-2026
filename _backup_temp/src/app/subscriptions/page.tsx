'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  SubscriptionStore, CustomerStore, PlanStore,
  ProductStore, seedIfEmpty
} from '@/lib/store';
import { formatDate, formatCurrency } from '@/lib/utils';
import type { Subscription, Customer, PricingPlan, Product } from '@/lib/types';
import Modal from '@/components/Modal';
import Badge from '@/components/Badge';
import { Plus, Search, Eye, Zap } from 'lucide-react';
import Link from 'next/link';

export default function SubscriptionsPage() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [plans, setPlans] = useState<PricingPlan[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    customerId: '', planId: '', productId: '',
    quantity: 1, discount: 0, notes: '',
  });

  const load = useCallback(() => {
    seedIfEmpty();
    setSubscriptions(SubscriptionStore.getAll());
    setCustomers(CustomerStore.getAll());
    setPlans(PlanStore.getAll());
    setProducts(ProductStore.getAll());
  }, []);

  useEffect(() => { load(); }, [load]);

  const getCustomer = (id: string) => customers.find(c => c.id === id);
  const getPlan = (id: string) => plans.find(p => p.id === id);
  const getProduct = (id: string) => products.find(p => p.id === id);

  const activePlans = plans.filter(p => p.active);

  const filtered = subscriptions.filter(sub => {
    const customer = getCustomer(sub.customerId);
    const plan = getPlan(sub.planId);
    const matchSearch = !search ||
      (customer?.name || '').toLowerCase().includes(search.toLowerCase()) ||
      (plan?.name || '').toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || sub.status === statusFilter;
    return matchSearch && matchStatus;
  });

  function handleCreate() {
    if (!form.customerId || !form.planId) return;
    const plan = getPlan(form.planId);
    if (!plan) return;
    const now = new Date();
    let periodEnd = new Date(now);
    if (plan.interval === 'monthly') periodEnd.setMonth(now.getMonth() + 1);
    else if (plan.interval === 'yearly') periodEnd.setFullYear(now.getFullYear() + 1);

    SubscriptionStore.create({
      customerId: form.customerId,
      planId: form.planId,
      productId: form.productId,
      status: 'active',
      quantity: form.quantity,
      discount: form.discount,
      notes: form.notes,
      startDate: now.toISOString(),
      currentPeriodStart: now.toISOString(),
      currentPeriodEnd: periodEnd.toISOString(),
    });
    setShowModal(false);
    load();
  }

  const stats = {
    active: subscriptions.filter(s => s.status === 'active').length,
    paused: subscriptions.filter(s => s.status === 'paused').length,
    cancelled: subscriptions.filter(s => s.status === 'cancelled').length,
    past_due: subscriptions.filter(s => s.status === 'past_due').length,
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Subscriptions</h1>
          <p className="page-subtitle">{subscriptions.length} total subscriptions</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)} id="btn-create-subscription">
          <Plus size={16} />
          New Subscription
        </button>
      </div>

      {/* Quick Stats */}
      <div className="stat-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)', marginBottom: 24 }}>
        {[
          { label: 'Active', value: stats.active, color: 'var(--success)', bg: 'var(--success-muted)' },
          { label: 'Paused', value: stats.paused, color: 'var(--warning)', bg: 'var(--warning-muted)' },
          { label: 'Cancelled', value: stats.cancelled, color: 'var(--danger)', bg: 'var(--danger-muted)' },
          { label: 'Past Due', value: stats.past_due, color: '#ff6b6b', bg: 'rgba(239,68,68,0.15)' },
        ].map(s => (
          <div key={s.label} className="stat-card">
            <div className="stat-card-label">{s.label}</div>
            <div className="stat-card-value" style={{ color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      <div className="table-wrapper">
        <div className="table-header-row">
          <div className="table-title">All Subscriptions</div>
          <div className="table-controls">
            <div className="search-input-wrapper">
              <span className="search-input-icon"><Search size={14} /></span>
              <input className="search-input" placeholder="Search…" value={search}
                onChange={e => setSearch(e.target.value)} />
            </div>
            <select className="filter-select" value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}>
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="paused">Paused</option>
              <option value="cancelled">Cancelled</option>
              <option value="past_due">Past Due</option>
            </select>
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon"><Zap size={32} /></div>
            <div className="empty-state-title">No subscriptions found</div>
            <div className="empty-state-desc">
              {search || statusFilter !== 'all' ? 'No subscriptions match your filters.' : 'Create your first subscription.'}
            </div>
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Customer</th>
                <th>Plan</th>
                <th>Product</th>
                <th>Status</th>
                <th>Started</th>
                <th>Next Billing</th>
                <th>Amount</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(sub => {
                const customer = getCustomer(sub.customerId);
                const plan = getPlan(sub.planId);
                const product = getProduct(sub.productId);
                const amount = plan ? plan.price * sub.quantity * (1 - sub.discount / 100) : 0;
                return (
                  <tr key={sub.id}>
                    <td>
                      <Link href={`/customers/${sub.customerId}`} style={{ color: 'inherit', textDecoration: 'none' }}>
                        {customer?.name || '—'}
                      </Link>
                    </td>
                    <td>{plan?.name || '—'}</td>
                    <td style={{ color: 'var(--text-muted)', fontSize: 12 }}>{product?.name || '—'}</td>
                    <td><Badge status={sub.status} dot /></td>
                    <td>{formatDate(sub.startDate)}</td>
                    <td>{sub.status === 'active' ? formatDate(sub.currentPeriodEnd) : '—'}</td>
                    <td style={{ color: 'var(--text-accent)', fontWeight: 600 }}>
                      {plan ? formatCurrency(amount) : '—'}
                      {sub.discount > 0 && (
                        <span style={{ fontSize: 11, color: 'var(--success)', marginLeft: 4 }}>-{sub.discount}%</span>
                      )}
                    </td>
                    <td>
                      <Link href={`/subscriptions/${sub.id}`} className="btn btn-ghost btn-sm">
                        <Eye size={13} /> View
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Create Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Create Subscription"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={handleCreate}>Create Subscription</button>
          </>
        }
      >
        <div className="form-group">
          <label className="form-label">Customer *</label>
          <select className="form-select" value={form.customerId}
            onChange={e => setForm(f => ({ ...f, customerId: e.target.value }))}>
            <option value="">Select a customer…</option>
            {customers.map(c => <option key={c.id} value={c.id}>{c.name} — {c.email}</option>)}
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">Pricing Plan *</label>
          <select className="form-select" value={form.planId}
            onChange={e => {
              const plan = plans.find(p => p.id === e.target.value);
              setForm(f => ({ ...f, planId: e.target.value, productId: plan?.productId || '' }));
            }}>
            <option value="">Select a plan…</option>
            {activePlans.map(p => {
              const product = getProduct(p.productId);
              return <option key={p.id} value={p.id}>{product?.name} — {p.name} ({formatCurrency(p.price)}/{p.interval})</option>;
            })}
          </select>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Quantity</label>
            <input className="form-input" type="number" min="1" value={form.quantity}
              onChange={e => setForm(f => ({ ...f, quantity: parseInt(e.target.value) || 1 }))} />
          </div>
          <div className="form-group">
            <label className="form-label">Discount (%)</label>
            <input className="form-input" type="number" min="0" max="100" value={form.discount}
              onChange={e => setForm(f => ({ ...f, discount: parseFloat(e.target.value) || 0 }))} />
          </div>
        </div>
        <div className="form-group">
          <label className="form-label">Notes</label>
          <textarea className="form-textarea" value={form.notes}
            onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
            placeholder="Optional notes about this subscription…" />
        </div>
      </Modal>
    </div>
  );
}

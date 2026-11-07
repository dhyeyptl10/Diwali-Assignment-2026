'use client';

import { useEffect, useState, useCallback } from 'react';
import { InvoiceStore, CustomerStore, SubscriptionStore, PlanStore, seedIfEmpty } from '@/lib/store';
import { formatDate, formatCurrency, generateId, isOverdue } from '@/lib/utils';
import type { Invoice, InvoiceLineItem, Customer, Subscription, PricingPlan } from '@/lib/types';
import Modal from '@/components/Modal';
import Badge from '@/components/Badge';
import { Plus, Search, Eye, FileText, Trash2 } from 'lucide-react';
import Link from 'next/link';

const EMPTY_ITEM = (): InvoiceLineItem => ({
  id: generateId(), description: '', quantity: 1, unitPrice: 0, total: 0
});

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [plans, setPlans] = useState<PricingPlan[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    customerId: '',
    subscriptionId: '',
    lineItems: [EMPTY_ITEM()],
    discountPercent: 0,
    taxPercent: 0,
    dueDate: '',
    issuedDate: new Date().toISOString().slice(0, 10),
    notes: '',
    status: 'draft' as const,
  });

  const load = useCallback(() => {
    seedIfEmpty();
    // Auto mark overdue
    const all = InvoiceStore.getAll();
    all.forEach(inv => {
      if (inv.status === 'pending' && isOverdue(inv.dueDate)) {
        InvoiceStore.update(inv.id, { status: 'overdue' });
      }
    });
    setInvoices(InvoiceStore.getAll());
    setCustomers(CustomerStore.getAll());
    setSubscriptions(SubscriptionStore.getAll());
    setPlans(PlanStore.getAll());
  }, []);

  useEffect(() => { load(); }, [load]);

  const getCustomer = (id: string) => customers.find(c => c.id === id);

  const filtered = invoices.filter(inv => {
    const customer = getCustomer(inv.customerId);
    const matchSearch = !search ||
      inv.invoiceNumber.toLowerCase().includes(search.toLowerCase()) ||
      (customer?.name || '').toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || inv.status === statusFilter;
    return matchSearch && matchStatus;
  });

  // Compute totals
  const subtotal = form.lineItems.reduce((s, item) => s + item.total, 0);
  const discountAmount = subtotal * (form.discountPercent / 100);
  const afterDiscount = subtotal - discountAmount;
  const taxAmount = afterDiscount * (form.taxPercent / 100);
  const total = afterDiscount + taxAmount;

  function updateItem(idx: number, field: keyof InvoiceLineItem, value: string | number) {
    setForm(f => {
      const items = [...f.lineItems];
      items[idx] = { ...items[idx], [field]: value };
      if (field === 'quantity' || field === 'unitPrice') {
        items[idx].total = items[idx].quantity * items[idx].unitPrice;
      }
      return { ...f, lineItems: items };
    });
  }

  function handleCreate() {
    if (!form.customerId || form.lineItems.some(i => !i.description.trim())) return;
    InvoiceStore.create({
      customerId: form.customerId,
      subscriptionId: form.subscriptionId || undefined,
      status: form.status,
      lineItems: form.lineItems,
      subtotal,
      discountPercent: form.discountPercent,
      discountAmount,
      taxPercent: form.taxPercent,
      taxAmount,
      total,
      issuedDate: new Date(form.issuedDate).toISOString(),
      dueDate: form.dueDate ? new Date(form.dueDate).toISOString() : new Date(Date.now() + 30 * 86400000).toISOString(),
      notes: form.notes,
    });
    setShowModal(false);
    setForm({
      customerId: '', subscriptionId: '', lineItems: [EMPTY_ITEM()],
      discountPercent: 0, taxPercent: 0, dueDate: '', issuedDate: new Date().toISOString().slice(0, 10), notes: '', status: 'draft',
    });
    load();
  }

  const customerSubs = form.customerId
    ? subscriptions.filter(s => s.customerId === form.customerId)
    : [];

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Invoices</h1>
          <p className="page-subtitle">{invoices.length} total invoices</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)} id="btn-create-invoice">
          <Plus size={16} />
          New Invoice
        </button>
      </div>

      {/* Quick Stats */}
      <div className="stat-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)', marginBottom: 24 }}>
        {[
          { label: 'Draft', count: invoices.filter(i => i.status === 'draft').length, color: 'var(--text-secondary)' },
          { label: 'Pending', count: invoices.filter(i => i.status === 'pending').length, color: 'var(--warning)' },
          { label: 'Paid', count: invoices.filter(i => i.status === 'paid').length, color: 'var(--success)' },
          { label: 'Overdue', count: invoices.filter(i => i.status === 'overdue').length, color: 'var(--danger)' },
        ].map(s => (
          <div key={s.label} className="stat-card">
            <div className="stat-card-label">{s.label}</div>
            <div className="stat-card-value" style={{ color: s.color }}>{s.count}</div>
          </div>
        ))}
      </div>

      <div className="table-wrapper">
        <div className="table-header-row">
          <div className="table-title">All Invoices</div>
          <div className="table-controls">
            <div className="search-input-wrapper">
              <span className="search-input-icon"><Search size={14} /></span>
              <input className="search-input" placeholder="Search invoices…" value={search}
                onChange={e => setSearch(e.target.value)} />
            </div>
            <select className="filter-select" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
              <option value="all">All Status</option>
              <option value="draft">Draft</option>
              <option value="pending">Pending</option>
              <option value="paid">Paid</option>
              <option value="overdue">Overdue</option>
            </select>
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon"><FileText size={32} /></div>
            <div className="empty-state-title">No invoices found</div>
            <div className="empty-state-desc">
              {search || statusFilter !== 'all' ? 'No invoices match your filters.' : 'Create your first invoice.'}
            </div>
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Invoice #</th>
                <th>Customer</th>
                <th>Status</th>
                <th>Issued</th>
                <th>Due</th>
                <th>Total</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).map(inv => {
                const customer = getCustomer(inv.customerId);
                return (
                  <tr key={inv.id}>
                    <td style={{ fontFamily: 'monospace', fontSize: 13 }}>{inv.invoiceNumber}</td>
                    <td>{customer?.name || '—'}</td>
                    <td><Badge status={inv.status} dot /></td>
                    <td>{formatDate(inv.issuedDate)}</td>
                    <td style={{ color: inv.status === 'overdue' ? 'var(--danger)' : 'var(--text-secondary)' }}>
                      {formatDate(inv.dueDate)}
                    </td>
                    <td style={{ color: 'var(--text-accent)', fontWeight: 600 }}>{formatCurrency(inv.total)}</td>
                    <td>
                      <div className="action-menu">
                        <Link href={`/invoices/${inv.id}`} className="btn btn-ghost btn-sm">
                          <Eye size={13} /> View
                        </Link>
                        <button className="btn btn-ghost btn-sm btn-icon"
                          onClick={() => { InvoiceStore.delete(inv.id); load(); }}
                          style={{ color: 'var(--danger)' }} title="Delete">
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Create Invoice Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Create Invoice"
        size="xl"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
            <button className="btn btn-secondary" onClick={() => { setForm(f => ({ ...f, status: 'draft' })); setTimeout(handleCreate, 0); }}>
              Save as Draft
            </button>
            <button className="btn btn-primary" onClick={() => { setForm(f => ({ ...f, status: 'pending' as const })); setTimeout(handleCreate, 0); }}>
              Send Invoice
            </button>
          </>
        }
      >
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Customer *</label>
            <select className="form-select" value={form.customerId}
              onChange={e => setForm(f => ({ ...f, customerId: e.target.value, subscriptionId: '' }))}>
              <option value="">Select customer…</option>
              {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Linked Subscription (optional)</label>
            <select className="form-select" value={form.subscriptionId}
              onChange={e => setForm(f => ({ ...f, subscriptionId: e.target.value }))}
              disabled={!form.customerId}>
              <option value="">None</option>
              {customerSubs.map(s => {
                const plan = plans.find(p => p.id === s.planId);
                return <option key={s.id} value={s.id}>{plan?.name || s.id.slice(0, 8)} — {s.status}</option>;
              })}
            </select>
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Issue Date</label>
            <input className="form-input" type="date" value={form.issuedDate}
              onChange={e => setForm(f => ({ ...f, issuedDate: e.target.value }))} />
          </div>
          <div className="form-group">
            <label className="form-label">Due Date</label>
            <input className="form-input" type="date" value={form.dueDate}
              onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))} />
          </div>
        </div>

        <hr className="divider" />
        <div className="section-title">Line Items</div>

        <table className="line-items-table">
          <thead>
            <tr>
              <th style={{ width: '40%' }}>Description</th>
              <th style={{ width: '12%' }}>Qty</th>
              <th style={{ width: '18%' }}>Unit Price</th>
              <th style={{ width: '18%' }}>Total</th>
              <th style={{ width: '12%' }}></th>
            </tr>
          </thead>
          <tbody>
            {form.lineItems.map((item, idx) => (
              <tr key={item.id}>
                <td>
                  <input value={item.description} onChange={e => updateItem(idx, 'description', e.target.value)}
                    placeholder="Item description…" />
                </td>
                <td>
                  <input type="number" min="1" value={item.quantity}
                    onChange={e => updateItem(idx, 'quantity', parseFloat(e.target.value) || 1)} />
                </td>
                <td>
                  <input type="number" min="0" step="0.01" value={item.unitPrice}
                    onChange={e => updateItem(idx, 'unitPrice', parseFloat(e.target.value) || 0)} />
                </td>
                <td style={{ color: 'var(--text-accent)', fontWeight: 600 }}>{formatCurrency(item.total)}</td>
                <td>
                  <button className="btn btn-ghost btn-sm btn-icon" onClick={() =>
                    setForm(f => ({ ...f, lineItems: f.lineItems.filter((_, i) => i !== idx) }))}
                    disabled={form.lineItems.length === 1} style={{ color: 'var(--danger)' }}>
                    <Trash2 size={13} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <button className="btn btn-secondary btn-sm" onClick={() =>
          setForm(f => ({ ...f, lineItems: [...f.lineItems, EMPTY_ITEM()] }))}>
          <Plus size={13} /> Add Line Item
        </button>

        <hr className="divider" />

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 20 }}>
          <div>
            <div className="form-group">
              <label className="form-label">Notes</label>
              <textarea className="form-textarea" value={form.notes}
                onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                placeholder="Thank you for your business!" />
            </div>
          </div>
          <div className="summary-box">
            <div className="summary-row">
              <span className="summary-row-label">Subtotal</span>
              <span className="summary-row-value">{formatCurrency(subtotal)}</span>
            </div>
            <div className="summary-row">
              <span className="summary-row-label">
                Discount (
                <input type="number" min="0" max="100" value={form.discountPercent}
                  onChange={e => setForm(f => ({ ...f, discountPercent: parseFloat(e.target.value) || 0 }))}
                  style={{ width: 36, background: 'transparent', border: 'none', color: 'var(--text-secondary)', fontSize: 13, outline: 'none' }} />
                %)
              </span>
              <span className="summary-row-value" style={{ color: 'var(--success)' }}>-{formatCurrency(discountAmount)}</span>
            </div>
            <div className="summary-row">
              <span className="summary-row-label">
                Tax (
                <input type="number" min="0" max="100" value={form.taxPercent}
                  onChange={e => setForm(f => ({ ...f, taxPercent: parseFloat(e.target.value) || 0 }))}
                  style={{ width: 36, background: 'transparent', border: 'none', color: 'var(--text-secondary)', fontSize: 13, outline: 'none' }} />
                %)
              </span>
              <span className="summary-row-value">{formatCurrency(taxAmount)}</span>
            </div>
            <div className="summary-total summary-row">
              <span className="summary-row-label">Total</span>
              <span className="summary-row-value">{formatCurrency(total)}</span>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}

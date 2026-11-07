'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  PaymentStore, CustomerStore, InvoiceStore, seedIfEmpty
} from '@/lib/store';
import { formatDate, formatCurrency } from '@/lib/utils';
import type { Payment, Customer, Invoice } from '@/lib/types';
import Modal from '@/components/Modal';
import Badge from '@/components/Badge';
import { Plus, Search, CreditCard, TrendingUp, AlertTriangle, Clock, RefreshCw } from 'lucide-react';
import Link from 'next/link';

export default function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [updateTarget, setUpdateTarget] = useState<Payment | null>(null);
  const [updateStatus, setUpdateStatus] = useState<'successful' | 'pending' | 'failed'>('successful');
  const [form, setForm] = useState({
    invoiceId: '',
    customerId: '',
    amount: 0,
    method: 'card' as const,
    status: 'successful' as const,
    notes: '',
    date: new Date().toISOString().slice(0, 10),
  });

  const load = useCallback(() => {
    seedIfEmpty();
    setPayments(PaymentStore.getAll());
    setCustomers(CustomerStore.getAll());
    setInvoices(InvoiceStore.getAll());
  }, []);

  useEffect(() => { load(); }, [load]);

  const getCustomer = (id: string) => customers.find(c => c.id === id);
  const getInvoice = (id: string) => invoices.find(i => i.id === id);

  const customerInvoices = form.customerId
    ? invoices.filter(i => i.customerId === form.customerId && i.status !== 'paid')
    : [];

  const filtered = payments.filter(p => {
    const customer = getCustomer(p.customerId);
    const invoice = getInvoice(p.invoiceId);
    const matchSearch = !search ||
      (customer?.name || '').toLowerCase().includes(search.toLowerCase()) ||
      (invoice?.invoiceNumber || '').toLowerCase().includes(search.toLowerCase()) ||
      (p.transactionId || '').toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || p.status === statusFilter;
    return matchSearch && matchStatus;
  }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  function handleCreate() {
    if (!form.invoiceId || !form.customerId) return;
    PaymentStore.create({
      invoiceId: form.invoiceId,
      customerId: form.customerId,
      amount: form.amount,
      currency: 'USD',
      method: form.method,
      status: form.status,
      date: new Date(form.date).toISOString(),
      notes: form.notes,
      transactionId: 'TXN-' + Math.random().toString(36).substr(2, 9).toUpperCase(),
    });
    setShowModal(false);
    load();
  }

  function handleUpdateStatus() {
    if (!updateTarget) return;
    PaymentStore.update(updateTarget.id, { status: updateStatus });
    if (updateStatus === 'successful') {
      InvoiceStore.update(updateTarget.invoiceId, { status: 'paid', paidDate: new Date().toISOString() });
    }
    setShowUpdateModal(false);
    setUpdateTarget(null);
    load();
  }

  // Revenue stats
  const totalRevenue = payments.filter(p => p.status === 'successful').reduce((s, p) => s + p.amount, 0);
  const pendingAmount = payments.filter(p => p.status === 'pending').reduce((s, p) => s + p.amount, 0);
  const failedCount = payments.filter(p => p.status === 'failed').length;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Payments</h1>
          <p className="page-subtitle">{payments.length} payment records</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)} id="btn-record-payment">
          <Plus size={16} />
          Record Payment
        </button>
      </div>

      {/* Stats */}
      <div className="stat-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)', marginBottom: 24 }}>
        {[
          { label: 'Total Collected', value: formatCurrency(totalRevenue), icon: TrendingUp, color: 'var(--success)', bg: 'var(--success-muted)' },
          { label: 'Pending', value: formatCurrency(pendingAmount), icon: Clock, color: 'var(--warning)', bg: 'var(--warning-muted)' },
          { label: 'Failed Payments', value: failedCount.toString(), icon: AlertTriangle, color: 'var(--danger)', bg: 'var(--danger-muted)' },
          { label: 'Total Records', value: payments.length.toString(), icon: CreditCard, color: 'var(--info)', bg: 'var(--info-muted)' },
        ].map(s => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="stat-card">
              <div className="stat-card-header">
                <div className="stat-card-label">{s.label}</div>
                <div className="stat-card-icon" style={{ background: s.bg }}>
                  <Icon size={16} style={{ color: s.color }} />
                </div>
              </div>
              <div className="stat-card-value" style={{ color: s.color }}>{s.value}</div>
            </div>
          );
        })}
      </div>

      <div className="table-wrapper">
        <div className="table-header-row">
          <div className="table-title">All Payments</div>
          <div className="table-controls">
            <div className="search-input-wrapper">
              <span className="search-input-icon"><Search size={14} /></span>
              <input className="search-input" placeholder="Search payments…" value={search}
                onChange={e => setSearch(e.target.value)} />
            </div>
            <select className="filter-select" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
              <option value="all">All Status</option>
              <option value="successful">Successful</option>
              <option value="pending">Pending</option>
              <option value="failed">Failed</option>
            </select>
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon"><CreditCard size={32} /></div>
            <div className="empty-state-title">No payments found</div>
            <div className="empty-state-desc">
              {search || statusFilter !== 'all' ? 'No payments match your filters.' : 'Record your first payment.'}
            </div>
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Customer</th>
                <th>Invoice</th>
                <th>Date</th>
                <th>Amount</th>
                <th>Method</th>
                <th>Status</th>
                <th>Transaction ID</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(p => {
                const customer = getCustomer(p.customerId);
                const invoice = getInvoice(p.invoiceId);
                return (
                  <tr key={p.id}>
                    <td>
                      <Link href={`/customers/${p.customerId}`} style={{ color: 'inherit', textDecoration: 'none' }}>
                        {customer?.name || '—'}
                      </Link>
                    </td>
                    <td>
                      <Link href={`/invoices/${p.invoiceId}`} style={{ color: 'var(--text-accent)', fontSize: 12, fontFamily: 'monospace' }}>
                        {invoice?.invoiceNumber || '—'}
                      </Link>
                    </td>
                    <td>{formatDate(p.date)}</td>
                    <td style={{
                      color: p.status === 'successful' ? 'var(--success)' : p.status === 'failed' ? 'var(--danger)' : 'var(--warning)',
                      fontWeight: 600
                    }}>
                      {formatCurrency(p.amount)}
                    </td>
                    <td><span className="method-badge">{p.method.replace('_', ' ')}</span></td>
                    <td><Badge status={p.status} dot /></td>
                    <td style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                      {p.transactionId || '—'}
                    </td>
                    <td>
                      <button className="btn btn-ghost btn-sm"
                        onClick={() => { setUpdateTarget(p); setUpdateStatus(p.status); setShowUpdateModal(true); }}>
                        <RefreshCw size={12} /> Update
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Record Payment Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Record Payment"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={handleCreate}>Record Payment</button>
          </>
        }
      >
        <div className="form-group">
          <label className="form-label">Customer *</label>
          <select className="form-select" value={form.customerId}
            onChange={e => setForm(f => ({ ...f, customerId: e.target.value, invoiceId: '' }))}>
            <option value="">Select customer…</option>
            {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">Invoice *</label>
          <select className="form-select" value={form.invoiceId}
            onChange={e => {
              const inv = invoices.find(i => i.id === e.target.value);
              setForm(f => ({ ...f, invoiceId: e.target.value, amount: inv?.total || f.amount }));
            }}
            disabled={!form.customerId}>
            <option value="">Select invoice…</option>
            {customerInvoices.map(i => (
              <option key={i.id} value={i.id}>{i.invoiceNumber} — {formatCurrency(i.total)} ({i.status})</option>
            ))}
          </select>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Amount</label>
            <input className="form-input" type="number" min="0" step="0.01" value={form.amount}
              onChange={e => setForm(f => ({ ...f, amount: parseFloat(e.target.value) || 0 }))} />
          </div>
          <div className="form-group">
            <label className="form-label">Date</label>
            <input className="form-input" type="date" value={form.date}
              onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Method</label>
            <select className="form-select" value={form.method}
              onChange={e => setForm(f => ({ ...f, method: e.target.value as typeof form.method }))}>
              <option value="card">Credit / Debit Card</option>
              <option value="bank_transfer">Bank Transfer</option>
              <option value="cash">Cash</option>
              <option value="crypto">Crypto</option>
              <option value="check">Check</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Status</label>
            <select className="form-select" value={form.status}
              onChange={e => setForm(f => ({ ...f, status: e.target.value as typeof form.status }))}>
              <option value="successful">Successful</option>
              <option value="pending">Pending</option>
              <option value="failed">Failed</option>
            </select>
          </div>
        </div>
        <div className="form-group">
          <label className="form-label">Notes</label>
          <textarea className="form-textarea" value={form.notes}
            onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
        </div>
      </Modal>

      {/* Update Status Modal */}
      <Modal
        isOpen={showUpdateModal}
        onClose={() => { setShowUpdateModal(false); setUpdateTarget(null); }}
        title="Update Payment Status"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => { setShowUpdateModal(false); setUpdateTarget(null); }}>
              Cancel
            </button>
            <button className="btn btn-primary" onClick={handleUpdateStatus}>Update Status</button>
          </>
        }
      >
        {updateTarget && (
          <>
            <div style={{ marginBottom: 16, padding: '12px 16px', background: 'var(--bg-elevated)', borderRadius: 10 }}>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Payment</div>
              <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{formatCurrency(updateTarget.amount)}</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>Current: <Badge status={updateTarget.status} /></div>
            </div>
            <div className="form-group">
              <label className="form-label">New Status</label>
              <select className="form-select" value={updateStatus}
                onChange={e => setUpdateStatus(e.target.value as typeof updateStatus)}>
                <option value="successful">Successful</option>
                <option value="pending">Pending</option>
                <option value="failed">Failed</option>
              </select>
            </div>
            <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              Note: Marking as "Successful" will also mark the linked invoice as Paid.
            </p>
          </>
        )}
      </Modal>
    </div>
  );
}

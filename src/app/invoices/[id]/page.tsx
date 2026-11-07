'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  InvoiceStore, CustomerStore, PaymentStore, seedIfEmpty
} from '@/lib/store';
import { formatDate, formatCurrency } from '@/lib/utils';
import type { Invoice, Customer, Payment } from '@/lib/types';
import Modal from '@/components/Modal';
import Badge from '@/components/Badge';
import {
  ArrowLeft, Download, CheckCircle, Send, Trash2,
  FileText, CreditCard
} from 'lucide-react';
import Link from 'next/link';

export default function InvoiceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  function reload() {
    seedIfEmpty();
    const inv = InvoiceStore.getById(id);
    if (!inv) { router.push('/invoices'); return; }
    setInvoice(inv);
    setCustomer(CustomerStore.getById(inv.customerId) || null);
    setPayments(PaymentStore.getByInvoice(id));
  }

  useEffect(() => { reload(); }, [id]);

  if (!invoice || !customer) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '50vh' }}>
        <div className="spinner" />
      </div>
    );
  }

  function markPaid() {
    InvoiceStore.markPaid(id);
    reload();
  }

  function handleDelete() {
    InvoiceStore.delete(id);
    router.push('/invoices');
  }

  function downloadPDF() {
    const lines = invoice!.lineItems.map(item =>
      `${item.description}   Qty: ${item.quantity}   Unit: ${formatCurrency(item.unitPrice)}   Total: ${formatCurrency(item.total)}`
    ).join('\n');

    const content = `
INVOICE
=======
Invoice #: ${invoice!.invoiceNumber}
Issued: ${formatDate(invoice!.issuedDate)}
Due Date: ${formatDate(invoice!.dueDate)}
Status: ${invoice!.status.toUpperCase()}

BILL TO:
${customer!.name}
${customer!.company || ''}
${customer!.email}

LINE ITEMS:
-----------
${lines}

Subtotal: ${formatCurrency(invoice!.subtotal)}
${invoice!.discountPercent > 0 ? `Discount (${invoice!.discountPercent}%): -${formatCurrency(invoice!.discountAmount)}` : ''}
${invoice!.taxPercent > 0 ? `Tax (${invoice!.taxPercent}%): ${formatCurrency(invoice!.taxAmount)}` : ''}
TOTAL: ${formatCurrency(invoice!.total)}

${invoice!.notes ? `Notes: ${invoice!.notes}` : ''}
    `.trim();

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${invoice!.invoiceNumber}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <Link href="/invoices" className="btn btn-ghost btn-sm btn-icon">
            <ArrowLeft size={16} />
          </Link>
          <div>
            <h1 className="page-title" style={{ fontFamily: 'monospace' }}>
              {invoice.invoiceNumber}
            </h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 4 }}>
              <Badge status={invoice.status} dot />
              <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>
                Due {formatDate(invoice.dueDate)}
              </span>
            </div>
          </div>
        </div>
        <div className="page-header-actions">
          {(invoice.status === 'pending' || invoice.status === 'overdue') && (
            <button className="btn btn-success btn-sm" onClick={markPaid}>
              <CheckCircle size={14} /> Mark Paid
            </button>
          )}
          <button className="btn btn-secondary btn-sm" onClick={downloadPDF}>
            <Download size={14} /> Download
          </button>
          <button
            className="btn btn-ghost btn-sm"
            style={{ color: 'var(--danger)' }}
            onClick={() => setShowDeleteModal(true)}
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      <div className="detail-grid">
        {/* Main Invoice */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Invoice Preview */}
          <div className="card">
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24 }}>
              <div>
                <div style={{
                  width: 44, height: 44,
                  background: 'linear-gradient(135deg, var(--accent), var(--accent-light))',
                  borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'center',
                  justifyContent: 'center', fontSize: 24, marginBottom: 12,
                }}>💳</div>
                <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-primary)' }}>BillingPro</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Subscription Platform</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'monospace' }}>
                  {invoice.invoiceNumber}
                </div>
                <div style={{ marginTop: 8 }}>
                  <Badge status={invoice.status} />
                </div>
              </div>
            </div>

            <div className="grid-2" style={{ marginBottom: 24 }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6 }}>Bill To</div>
                <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{customer.name}</div>
                {customer.company && <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{customer.company}</div>}
                <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{customer.email}</div>
                {customer.address.city && (
                  <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                    {customer.address.city}, {customer.address.country}
                  </div>
                )}
              </div>
              <div>
                <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6 }}>Dates</div>
                <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 4 }}>
                  <span style={{ color: 'var(--text-muted)' }}>Issued:</span> {formatDate(invoice.issuedDate)}
                </div>
                <div style={{ fontSize: 13, color: invoice.status === 'overdue' ? 'var(--danger)' : 'var(--text-secondary)' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Due:</span> {formatDate(invoice.dueDate)}
                </div>
                {invoice.paidDate && (
                  <div style={{ fontSize: 13, color: 'var(--success)', marginTop: 4 }}>
                    <span style={{ color: 'var(--text-muted)' }}>Paid:</span> {formatDate(invoice.paidDate)}
                  </div>
                )}
              </div>
            </div>

            {/* Line Items */}
            <table className="line-items-table">
              <thead>
                <tr>
                  <th style={{ width: '50%' }}>Description</th>
                  <th>Qty</th>
                  <th>Unit Price</th>
                  <th style={{ textAlign: 'right' }}>Total</th>
                </tr>
              </thead>
              <tbody>
                {invoice.lineItems.map(item => (
                  <tr key={item.id}>
                    <td style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{item.description}</td>
                    <td>{item.quantity}</td>
                    <td>{formatCurrency(item.unitPrice)}</td>
                    <td style={{ textAlign: 'right', fontWeight: 600, color: 'var(--text-primary)' }}>
                      {formatCurrency(item.total)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Totals */}
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <div className="summary-box" style={{ width: 280 }}>
                <div className="summary-row">
                  <span className="summary-row-label">Subtotal</span>
                  <span className="summary-row-value">{formatCurrency(invoice.subtotal)}</span>
                </div>
                {invoice.discountPercent > 0 && (
                  <div className="summary-row">
                    <span className="summary-row-label">Discount ({invoice.discountPercent}%)</span>
                    <span className="summary-row-value" style={{ color: 'var(--success)' }}>
                      -{formatCurrency(invoice.discountAmount)}
                    </span>
                  </div>
                )}
                {invoice.taxPercent > 0 && (
                  <div className="summary-row">
                    <span className="summary-row-label">Tax ({invoice.taxPercent}%)</span>
                    <span className="summary-row-value">{formatCurrency(invoice.taxAmount)}</span>
                  </div>
                )}
                <div className="summary-row summary-total">
                  <span className="summary-row-label">Total</span>
                  <span className="summary-row-value">{formatCurrency(invoice.total)}</span>
                </div>
              </div>
            </div>

            {invoice.notes && (
              <div style={{
                marginTop: 20, padding: '12px 16px',
                background: 'var(--bg-elevated)', borderRadius: 'var(--radius-sm)',
                borderLeft: '3px solid var(--border-accent)',
              }}>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Notes</div>
                <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{invoice.notes}</div>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Customer Info */}
          <div className="card">
            <div className="section-title">
              <FileText size={15} /> Customer
            </div>
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{customer.name}</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{customer.email}</div>
            </div>
            <Link href={`/customers/${customer.id}`} className="btn btn-secondary btn-sm" style={{ width: '100%', justifyContent: 'center' }}>
              View Customer
            </Link>
          </div>

          {/* Payments */}
          <div className="card">
            <div className="section-title">
              <CreditCard size={15} /> Payments
            </div>
            {payments.length === 0 ? (
              <div style={{ color: 'var(--text-muted)', fontSize: 13, textAlign: 'center', padding: '12px 0' }}>
                No payments yet
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {payments.map(p => (
                  <div key={p.id} style={{
                    padding: '10px 12px',
                    background: 'var(--bg-elevated)',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border)',
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{
                        fontWeight: 600,
                        color: p.status === 'successful' ? 'var(--success)' : p.status === 'failed' ? 'var(--danger)' : 'var(--warning)'
                      }}>
                        {formatCurrency(p.amount)}
                      </span>
                      <Badge status={p.status} />
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                      {formatDate(p.date)} · {p.method.replace('_', ' ')}
                    </div>
                    {p.transactionId && (
                      <div style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'monospace', marginTop: 2 }}>
                        {p.transactionId}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Delete Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Delete Invoice"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setShowDeleteModal(false)}>Cancel</button>
            <button className="btn btn-danger" onClick={handleDelete}>Delete Invoice</button>
          </>
        }
      >
        <p style={{ color: 'var(--text-secondary)' }}>
          Are you sure you want to delete invoice{' '}
          <strong style={{ color: 'var(--text-primary)', fontFamily: 'monospace' }}>{invoice.invoiceNumber}</strong>?
          This cannot be undone.
        </p>
      </Modal>
    </div>
  );
}

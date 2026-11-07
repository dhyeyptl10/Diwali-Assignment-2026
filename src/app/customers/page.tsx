'use client';

import { useEffect, useState, useCallback } from 'react';
import { CustomerStore, seedIfEmpty } from '@/lib/store';
import { formatDate } from '@/lib/utils';
import type { Customer } from '@/lib/types';
import Modal from '@/components/Modal';
import { Plus, Search, Pencil, Trash2, Eye, Users } from 'lucide-react';
import Link from 'next/link';

const EMPTY_FORM = {
  name: '', email: '', phone: '', company: '',
  address: { street: '', city: '', state: '', zip: '', country: 'US' },
  notes: '',
};

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Customer | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [deleteTarget, setDeleteTarget] = useState<Customer | null>(null);

  const load = useCallback(() => {
    seedIfEmpty();
    setCustomers(CustomerStore.getAll());
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = customers.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.email.toLowerCase().includes(search.toLowerCase()) ||
    (c.company || '').toLowerCase().includes(search.toLowerCase())
  );

  function openCreate() {
    setEditing(null);
    setForm(EMPTY_FORM);
    setShowModal(true);
  }

  function openEdit(c: Customer) {
    setEditing(c);
    setForm({
      name: c.name, email: c.email, phone: c.phone, company: c.company || '',
      address: { ...c.address }, notes: c.notes || '',
    });
    setShowModal(true);
  }

  function handleSave() {
    if (!form.name.trim() || !form.email.trim()) return;
    if (editing) {
      CustomerStore.update(editing.id, form);
    } else {
      CustomerStore.create(form);
    }
    setShowModal(false);
    load();
  }

  function handleDelete() {
    if (!deleteTarget) return;
    CustomerStore.delete(deleteTarget.id);
    setDeleteTarget(null);
    load();
  }

  function setAddr(field: string, value: string) {
    setForm(f => ({ ...f, address: { ...f.address, [field]: value } }));
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Customers</h1>
          <p className="page-subtitle">{customers.length} total customers</p>
        </div>
        <button className="btn btn-primary" onClick={openCreate} id="btn-create-customer">
          <Plus size={16} />
          Add Customer
        </button>
      </div>

      <div className="table-wrapper">
        <div className="table-header-row">
          <div className="table-title">All Customers</div>
          <div className="table-controls">
            <div className="search-input-wrapper">
              <span className="search-input-icon"><Search size={14} /></span>
              <input
                className="search-input"
                placeholder="Search customers…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                id="customer-search"
              />
            </div>
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon"><Users size={32} /></div>
            <div className="empty-state-title">No customers found</div>
            <div className="empty-state-desc">
              {search ? 'No customers match your search.' : 'Add your first customer to get started.'}
            </div>
            {!search && (
              <button className="btn btn-primary" onClick={openCreate}>
                <Plus size={16} /> Add Customer
              </button>
            )}
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Company</th>
                <th>Location</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(c => (
                <tr key={c.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{
                        width: 32, height: 32, borderRadius: '50%',
                        background: 'linear-gradient(135deg, var(--accent), var(--accent-light))',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 13, fontWeight: 700, color: 'white', flexShrink: 0,
                      }}>
                        {c.name[0].toUpperCase()}
                      </div>
                      {c.name}
                    </div>
                  </td>
                  <td>{c.email}</td>
                  <td>{c.phone}</td>
                  <td>{c.company || <span style={{ color: 'var(--text-muted)' }}>—</span>}</td>
                  <td>{c.address.city}, {c.address.country}</td>
                  <td>{formatDate(c.createdAt)}</td>
                  <td>
                    <div className="action-menu">
                      <Link href={`/customers/${c.id}`} className="btn btn-ghost btn-sm btn-icon" title="View">
                        <Eye size={14} />
                      </Link>
                      <button className="btn btn-ghost btn-sm btn-icon" onClick={() => openEdit(c)} title="Edit">
                        <Pencil size={14} />
                      </button>
                      <button className="btn btn-ghost btn-sm btn-icon" onClick={() => setDeleteTarget(c)} title="Delete"
                        style={{ color: 'var(--danger)' }}>
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Create / Edit Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editing ? 'Edit Customer' : 'Add New Customer'}
        size="lg"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={handleSave} id="btn-save-customer">
              {editing ? 'Save Changes' : 'Create Customer'}
            </button>
          </>
        }
      >
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Full Name *</label>
            <input className="form-input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="John Doe" />
          </div>
          <div className="form-group">
            <label className="form-label">Email Address *</label>
            <input className="form-input" type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="john@company.com" />
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Phone Number</label>
            <input className="form-input" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="+1 555-0100" />
          </div>
          <div className="form-group">
            <label className="form-label">Company</label>
            <input className="form-input" value={form.company} onChange={e => setForm(f => ({ ...f, company: e.target.value }))} placeholder="Acme Corp" />
          </div>
        </div>

        <hr className="divider" />
        <div className="section-title">Billing Address</div>

        <div className="form-group">
          <label className="form-label">Street</label>
          <input className="form-input" value={form.address.street} onChange={e => setAddr('street', e.target.value)} placeholder="123 Main St" />
        </div>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">City</label>
            <input className="form-input" value={form.address.city} onChange={e => setAddr('city', e.target.value)} placeholder="San Francisco" />
          </div>
          <div className="form-group">
            <label className="form-label">State / Province</label>
            <input className="form-input" value={form.address.state} onChange={e => setAddr('state', e.target.value)} placeholder="CA" />
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">ZIP / Postal Code</label>
            <input className="form-input" value={form.address.zip} onChange={e => setAddr('zip', e.target.value)} placeholder="94105" />
          </div>
          <div className="form-group">
            <label className="form-label">Country</label>
            <input className="form-input" value={form.address.country} onChange={e => setAddr('country', e.target.value)} placeholder="US" />
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Notes</label>
          <textarea className="form-textarea" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Any notes about this customer…" />
        </div>
      </Modal>

      {/* Delete Confirmation */}
      <Modal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Delete Customer"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setDeleteTarget(null)}>Cancel</button>
            <button className="btn btn-danger" onClick={handleDelete}>Delete Customer</button>
          </>
        }
      >
        <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}>
          Are you sure you want to delete <strong style={{ color: 'var(--text-primary)' }}>{deleteTarget?.name}</strong>?
          This action cannot be undone.
        </p>
      </Modal>
    </div>
  );
}

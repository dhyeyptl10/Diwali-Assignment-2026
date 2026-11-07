'use client';

import { useEffect, useState, useCallback } from 'react';
import { ProductStore, PlanStore, seedIfEmpty } from '@/lib/store';
import { generateId, formatCurrency } from '@/lib/utils';
import type { Product, PricingPlan } from '@/lib/types';
import Modal from '@/components/Modal';
import Badge from '@/components/Badge';
import { Plus, Pencil, Trash2, Package, Check, Power } from 'lucide-react';

const EMPTY_PRODUCT = { name: '', description: '', category: '', active: true };
const EMPTY_PLAN = {
  productId: '', name: '', description: '', price: 0, currency: 'USD',
  interval: 'monthly' as const, features: [''], active: true,
};

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [plans, setPlans] = useState<PricingPlan[]>([]);
  const [showProductModal, setShowProductModal] = useState(false);
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editingPlan, setEditingPlan] = useState<PricingPlan | null>(null);
  const [productForm, setProductForm] = useState(EMPTY_PRODUCT);
  const [planForm, setPlanForm] = useState({ ...EMPTY_PLAN });
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [deleteProduct, setDeleteProduct] = useState<Product | null>(null);
  const [deletePlan, setDeletePlan] = useState<PricingPlan | null>(null);

  const load = useCallback(() => {
    seedIfEmpty();
    setProducts(ProductStore.getAll());
    setPlans(PlanStore.getAll());
  }, []);

  useEffect(() => { load(); }, [load]);

  // Product handlers
  function openCreateProduct() {
    setEditingProduct(null);
    setProductForm(EMPTY_PRODUCT);
    setShowProductModal(true);
  }
  function openEditProduct(p: Product) {
    setEditingProduct(p);
    setProductForm({ name: p.name, description: p.description, category: p.category, active: p.active });
    setShowProductModal(true);
  }
  function handleSaveProduct() {
    if (!productForm.name.trim()) return;
    if (editingProduct) ProductStore.update(editingProduct.id, productForm);
    else ProductStore.create(productForm);
    setShowProductModal(false);
    load();
  }
  function toggleProduct(p: Product) {
    ProductStore.update(p.id, { active: !p.active });
    load();
  }

  // Plan handlers
  function openCreatePlan(productId: string) {
    setEditingPlan(null);
    setSelectedProductId(productId);
    setPlanForm({ ...EMPTY_PLAN, productId, features: [''] });
    setShowPlanModal(true);
  }
  function openEditPlan(plan: PricingPlan) {
    setEditingPlan(plan);
    setSelectedProductId(plan.productId);
    setPlanForm({
      productId: plan.productId, name: plan.name, description: plan.description || '',
      price: plan.price, currency: plan.currency,
      interval: plan.interval as typeof EMPTY_PLAN.interval,
      features: [...plan.features], active: plan.active,
    });
    setShowPlanModal(true);
  }
  function handleSavePlan() {
    if (!planForm.name.trim() || planForm.price < 0) return;
    const data = { ...planForm, features: planForm.features.filter(f => f.trim()) };
    if (editingPlan) PlanStore.update(editingPlan.id, data);
    else PlanStore.create(data);
    setShowPlanModal(false);
    load();
  }
  function togglePlan(plan: PricingPlan) {
    PlanStore.update(plan.id, { active: !plan.active });
    load();
  }
  function setFeature(idx: number, value: string) {
    setPlanForm(f => {
      const features = [...f.features];
      features[idx] = value;
      return { ...f, features };
    });
  }
  function addFeature() { setPlanForm(f => ({ ...f, features: [...f.features, ''] })); }
  function removeFeature(idx: number) {
    setPlanForm(f => ({ ...f, features: f.features.filter((_, i) => i !== idx) }));
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Products & Pricing</h1>
          <p className="page-subtitle">{products.length} products, {plans.length} pricing plans</p>
        </div>
        <button className="btn btn-primary" onClick={openCreateProduct} id="btn-create-product">
          <Plus size={16} />
          Add Product
        </button>
      </div>

      {products.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon"><Package size={32} /></div>
          <div className="empty-state-title">No products yet</div>
          <div className="empty-state-desc">Create your first product to start defining pricing plans.</div>
          <button className="btn btn-primary" onClick={openCreateProduct}>
            <Plus size={16} /> Add Product
          </button>
        </div>
      ) : (
        <div className="product-grid">
          {products.map(product => {
            const productPlans = plans.filter(p => p.productId === product.id);
            return (
              <div key={product.id} className="product-card">
                <div className="product-card-header">
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                      <div style={{
                        width: 36, height: 36, background: 'linear-gradient(135deg, var(--accent), var(--accent-light))',
                        borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 18, flexShrink: 0,
                      }}>
                        📦
                      </div>
                      <div>
                        <div className="product-card-name">{product.name}</div>
                        <div className="product-card-desc">{product.category}</div>
                      </div>
                    </div>
                    <div className="product-card-desc" style={{ marginTop: 6 }}>{product.description}</div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
                    <Badge status={product.active ? 'active' : 'cancelled'} />
                    <div style={{ display: 'flex', gap: 4 }}>
                      <button className="btn btn-ghost btn-sm btn-icon" onClick={() => openEditProduct(product)} title="Edit">
                        <Pencil size={13} />
                      </button>
                      <button className="btn btn-ghost btn-sm btn-icon" onClick={() => toggleProduct(product)} title={product.active ? 'Disable' : 'Enable'}>
                        <Power size={13} style={{ color: product.active ? 'var(--success)' : 'var(--text-muted)' }} />
                      </button>
                      <button className="btn btn-ghost btn-sm btn-icon" onClick={() => setDeleteProduct(product)} title="Delete"
                        style={{ color: 'var(--danger)' }}>
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                </div>

                <div className="product-card-plans">
                  <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Pricing Plans ({productPlans.length})
                  </div>

                  {productPlans.length === 0 && (
                    <div style={{ color: 'var(--text-muted)', fontSize: 13, textAlign: 'center', padding: '12px 0' }}>
                      No plans yet
                    </div>
                  )}

                  {productPlans.map(plan => (
                    <div key={plan.id} className="plan-item" style={{ opacity: plan.active ? 1 : 0.5 }}>
                      <div>
                        <div className="plan-item-name">{plan.name}</div>
                        <div className="plan-item-interval">
                          <Badge status={plan.interval} />
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div className="plan-item-price">{formatCurrency(plan.price)}</div>
                        <div className="plan-item-actions">
                          <button className="btn btn-ghost btn-sm btn-icon" onClick={() => openEditPlan(plan)} title="Edit">
                            <Pencil size={12} />
                          </button>
                          <button className="btn btn-ghost btn-sm btn-icon" onClick={() => togglePlan(plan)} title={plan.active ? 'Disable' : 'Enable'}>
                            <Power size={12} style={{ color: plan.active ? 'var(--success)' : 'var(--text-muted)' }} />
                          </button>
                          <button className="btn btn-ghost btn-sm btn-icon" onClick={() => setDeletePlan(plan)}
                            style={{ color: 'var(--danger)' }} title="Delete">
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}

                  <button className="btn btn-secondary btn-sm" style={{ width: '100%', marginTop: 10 }}
                    onClick={() => openCreatePlan(product.id)}>
                    <Plus size={13} /> Add Pricing Plan
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Product Modal */}
      <Modal
        isOpen={showProductModal}
        onClose={() => setShowProductModal(false)}
        title={editingProduct ? 'Edit Product' : 'Create Product'}
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setShowProductModal(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={handleSaveProduct}>
              {editingProduct ? 'Save Changes' : 'Create Product'}
            </button>
          </>
        }
      >
        <div className="form-group">
          <label className="form-label">Product Name *</label>
          <input className="form-input" value={productForm.name}
            onChange={e => setProductForm(f => ({ ...f, name: e.target.value }))} placeholder="BillingPro Suite" />
        </div>
        <div className="form-group">
          <label className="form-label">Description</label>
          <textarea className="form-textarea" value={productForm.description}
            onChange={e => setProductForm(f => ({ ...f, description: e.target.value }))}
            placeholder="Describe what this product offers…" />
        </div>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Category</label>
            <input className="form-input" value={productForm.category}
              onChange={e => setProductForm(f => ({ ...f, category: e.target.value }))} placeholder="Software, Service…" />
          </div>
          <div className="form-group">
            <label className="form-label">Status</label>
            <select className="form-select" value={productForm.active ? 'active' : 'inactive'}
              onChange={e => setProductForm(f => ({ ...f, active: e.target.value === 'active' }))}>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>
      </Modal>

      {/* Plan Modal */}
      <Modal
        isOpen={showPlanModal}
        onClose={() => setShowPlanModal(false)}
        title={editingPlan ? 'Edit Pricing Plan' : 'Create Pricing Plan'}
        size="lg"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setShowPlanModal(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={handleSavePlan}>
              {editingPlan ? 'Save Changes' : 'Create Plan'}
            </button>
          </>
        }
      >
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Plan Name *</label>
            <input className="form-input" value={planForm.name}
              onChange={e => setPlanForm(f => ({ ...f, name: e.target.value }))} placeholder="Starter, Pro, Enterprise…" />
          </div>
          <div className="form-group">
            <label className="form-label">Billing Interval</label>
            <select className="form-select" value={planForm.interval}
              onChange={e => setPlanForm(f => ({ ...f, interval: e.target.value as typeof EMPTY_PLAN.interval }))}>
              <option value="monthly">Monthly</option>
              <option value="yearly">Yearly</option>
              <option value="one-time">One-time</option>
            </select>
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Price *</label>
            <input className="form-input" type="number" min="0" step="0.01" value={planForm.price}
              onChange={e => setPlanForm(f => ({ ...f, price: parseFloat(e.target.value) || 0 }))} />
          </div>
          <div className="form-group">
            <label className="form-label">Currency</label>
            <select className="form-select" value={planForm.currency}
              onChange={e => setPlanForm(f => ({ ...f, currency: e.target.value }))}>
              <option value="USD">USD — US Dollar</option>
              <option value="EUR">EUR — Euro</option>
              <option value="GBP">GBP — British Pound</option>
              <option value="INR">INR — Indian Rupee</option>
            </select>
          </div>
        </div>
        <div className="form-group">
          <label className="form-label">Description</label>
          <input className="form-input" value={planForm.description}
            onChange={e => setPlanForm(f => ({ ...f, description: e.target.value }))} placeholder="Short plan description" />
        </div>

        <div className="form-group">
          <label className="form-label">Features</label>
          {planForm.features.map((feat, idx) => (
            <div key={idx} style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 1 }}>
                <Check size={14} style={{ color: 'var(--success)', flexShrink: 0 }} />
                <input className="form-input" value={feat}
                  onChange={e => setFeature(idx, e.target.value)}
                  placeholder={`Feature ${idx + 1}`} />
              </div>
              <button className="btn btn-ghost btn-sm btn-icon" onClick={() => removeFeature(idx)}
                style={{ color: 'var(--danger)' }}>
                <Trash2 size={13} />
              </button>
            </div>
          ))}
          <button className="btn btn-secondary btn-sm" onClick={addFeature}>
            <Plus size={13} /> Add Feature
          </button>
        </div>
      </Modal>

      {/* Delete Product */}
      <Modal isOpen={!!deleteProduct} onClose={() => setDeleteProduct(null)} title="Delete Product"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setDeleteProduct(null)}>Cancel</button>
            <button className="btn btn-danger" onClick={() => { ProductStore.delete(deleteProduct!.id); setDeleteProduct(null); load(); }}>
              Delete
            </button>
          </>
        }>
        <p style={{ color: 'var(--text-secondary)' }}>
          Delete <strong style={{ color: 'var(--text-primary)' }}>{deleteProduct?.name}</strong>? All pricing plans will also be removed.
        </p>
      </Modal>

      {/* Delete Plan */}
      <Modal isOpen={!!deletePlan} onClose={() => setDeletePlan(null)} title="Delete Pricing Plan"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setDeletePlan(null)}>Cancel</button>
            <button className="btn btn-danger" onClick={() => { PlanStore.delete(deletePlan!.id); setDeletePlan(null); load(); }}>
              Delete Plan
            </button>
          </>
        }>
        <p style={{ color: 'var(--text-secondary)' }}>
          Delete the <strong style={{ color: 'var(--text-primary)' }}>{deletePlan?.name}</strong> plan?
        </p>
      </Modal>
    </div>
  );
}

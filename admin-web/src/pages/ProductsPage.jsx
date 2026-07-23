import React, { useCallback, useEffect, useState } from 'react';
import { api } from '../api/client';

const emptyForm = { id: null, name: '', price: '', description: '', category: '', status: 'available', imageUrl: '' };

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [form, setForm] = useState(emptyForm);
  const [formOpen, setFormOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setProducts(await api.get('/products', { auth: false }));
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const openNew = () => { setForm(emptyForm); setFormOpen(true); };
  const openEdit = (p) => { setForm({ ...p, price: String(p.price) }); setFormOpen(true); };

  const handleImagePick = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const dataUrl = await fileToDataUrl(file);
    setForm((f) => ({ ...f, imageUrl: dataUrl }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const body = {
        name: form.name.trim(),
        price: Number(form.price),
        description: form.description.trim(),
        category: form.category.trim(),
        status: form.status,
        imageUrl: form.imageUrl || undefined,
      };
      if (form.id) {
        await api.put(`/products/${form.id}`, body);
      } else {
        await api.post('/products', body);
      }
      setFormOpen(false);
      await load();
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (p) => {
    if (!confirm(`Delete "${p.name}"? This can't be undone.`)) return;
    try {
      await api.del(`/products/${p.id}`);
      await load();
    } catch (e) {
      setError(e.message);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h1 style={{ margin: 0 }}>Products</h1>
          <p className="muted" style={{ margin: '4px 0 0' }}>{products.length} item{products.length !== 1 ? 's' : ''} on the menu</p>
        </div>
        <button className="btn btn-primary" onClick={openNew}>+ Add product</button>
      </div>

      {error ? <p className="error-text" style={{ marginBottom: 14 }}>{error}</p> : null}

      {formOpen && (
        <form className="card" style={{ marginBottom: 20, maxWidth: 480 }} onSubmit={handleSave}>
          <h3 style={{ margin: '0 0 4px' }}>{form.id ? 'Edit product' : 'New product'}</h3>

          <label className="field-label">Name</label>
          <input className="input" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />

          <label className="field-label">Price (₹)</label>
          <input className="input" type="number" min="0" step="0.01" required value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />

          <label className="field-label">Category</label>
          <input className="input" placeholder="e.g. Flatbreads" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />

          <label className="field-label">Description</label>
          <textarea className="input" rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />

          <label className="field-label">Status</label>
          <select className="input" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
            <option value="available">Available</option>
            <option value="out_of_stock">Out of stock</option>
          </select>

          <label className="field-label">Photo (optional)</label>
          <input className="input" type="file" accept="image/*" onChange={handleImagePick} />
          {form.imageUrl ? (
            <img src={form.imageUrl} alt="" style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 10, marginTop: 10 }} />
          ) : null}

          <div style={{ display: 'flex', gap: 10, marginTop: 18 }}>
            <button type="submit" className="btn btn-primary" disabled={saving || !form.name.trim() || !form.price}>
              {saving ? 'Saving…' : 'Save'}
            </button>
            <button type="button" className="btn btn-outline" onClick={() => setFormOpen(false)}>Cancel</button>
          </div>
        </form>
      )}

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <p style={{ padding: 20 }} className="muted">Loading…</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th></th><th>Name</th><th>Category</th><th>Price</th><th>Status</th><th></th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id}>
                  <td>
                    {p.imageUrl ? (
                      <img src={p.imageUrl} alt="" style={{ width: 36, height: 36, objectFit: 'cover', borderRadius: 8 }} />
                    ) : (
                      <div style={{ width: 36, height: 36, borderRadius: 8, background: 'var(--primary-light)' }} />
                    )}
                  </td>
                  <td>{p.name}</td>
                  <td className="muted">{p.category || '—'}</td>
                  <td>₹{p.price}</td>
                  <td>
                    <span className="pill" style={{
                      background: p.status === 'available' ? '#1b7a3c22' : '#c6432b22',
                      color: p.status === 'available' ? '#1b7a3c' : '#c6432b',
                    }}>
                      {p.status === 'available' ? 'Available' : 'Out of stock'}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                    <button className="btn btn-outline btn-sm" onClick={() => openEdit(p)} style={{ marginRight: 8 }}>Edit</button>
                    <button className="btn btn-danger btn-sm" onClick={() => handleDelete(p)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

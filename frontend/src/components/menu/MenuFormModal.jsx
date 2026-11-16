import { useEffect, useState } from 'react';
import Modal from '../ui/Modal';
import { Field, Spinner, Switch } from '../ui/misc';
import { CATEGORIES } from '../../data/menu';
import { useData } from '../../context/DataContext';

const EMPTY = { name: '', description: '', category: 'Starters', price: '', veg: true, available: true, emoji: '🍽️', branches: [], image: '' };

export default function MenuFormModal({ open, item, onClose, onSave }) {
  const { branches } = useData();
  const operating = branches.filter((b) => b.status !== 'Inactive');
  const [f, setF] = useState(EMPTY);
  const [er, setEr] = useState({});
  const [saving, setSaving] = useState(false);
  useEffect(() => { if (open) { setF(item ? { ...EMPTY, ...item } : { ...EMPTY, branches: operating.filter((b) => b.status === 'Active').map((b) => b.id) }); setEr({}); setSaving(false); } }, [open, item]); // eslint-disable-line
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const toggleBranch = (id) => setF({ ...f, branches: f.branches.includes(id) ? f.branches.filter((x) => x !== id) : [...f.branches, id] });

  const submit = () => {
    const e = {};
    if (!f.name.trim()) e.name = 'Item name is required';
    if (!f.description.trim()) e.description = 'Add a short description';
    if (!(Number(f.price) > 0)) e.price = 'Enter a price greater than 0';
    if (f.branches.length === 0) e.branches = 'Select at least one branch';
    setEr(e);
    if (Object.keys(e).length) return;
    setSaving(true);
    setTimeout(() => onSave({ ...f, name: f.name.trim(), price: Number(f.price) }), 500);
  };

  return (
    <Modal open={open} onClose={onClose} title={item ? 'Edit food item' : 'Add food item'} subtitle="Item details and branch-wise availability"
      footer={<><button className="btn-ghost" onClick={onClose}>Cancel</button><button className="btn-primary" disabled={saving} onClick={submit}>{saving && <Spinner />}{item ? 'Save changes' : 'Add item'}</button></>}>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Food name *" error={er.name}><input className="input" value={f.name} onChange={set('name')} placeholder="e.g. Masala Dosa" /></Field>
        <Field label="Category"><select className="input" value={f.category} onChange={set('category')}>{CATEGORIES.map((c) => <option key={c}>{c}</option>)}</select></Field>
        <Field label="Description *" error={er.description} className="sm:col-span-2"><textarea rows={2} className="input" value={f.description} onChange={set('description')} placeholder="What makes this dish special?" /></Field>
        <Field label="Price (₹) *" error={er.price}><input className="input" type="number" min="0" value={f.price} onChange={set('price')} placeholder="199" /></Field>
        <Field label="Emoji / icon"><input className="input" maxLength={4} value={f.emoji} onChange={set('emoji')} /></Field>
        <Field label="Image URL (optional)" className="sm:col-span-2"><input className="input" value={f.image} onChange={set('image')} placeholder="https://… (leave blank to use emoji placeholder)" /></Field>
        <div className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2"><span className="text-sm">Vegetarian</span><Switch checked={f.veg} onChange={(v) => setF({ ...f, veg: v })} /></div>
        <div className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2"><span className="text-sm">Available</span><Switch checked={f.available} onChange={(v) => setF({ ...f, available: v })} /></div>
        <Field label="Available at branches *" error={er.branches} className="sm:col-span-2">
          <div className="grid gap-2 sm:grid-cols-2">{operating.map((b) => (
            <label key={b.id} className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm ${f.branches.includes(b.id) ? 'border-brand-300 bg-brand-50' : 'border-slate-200'}`}>
              <input type="checkbox" className="accent-brand-600" checked={f.branches.includes(b.id)} onChange={() => toggleBranch(b.id)} />{b.name}</label>))}</div>
        </Field>
      </div>
    </Modal>
  );
}

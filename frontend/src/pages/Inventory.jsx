import { useMemo, useState } from 'react';
import { Boxes, Building2, CircleAlert, PackageCheck, Pencil, Plus, Search } from 'lucide-react';
import { useData } from '../context/DataContext';
import { useOperationsPreview } from '../context/OperationsPreviewContext';
import { useToast } from '../context/ToastContext';
import { usePagination, useScope } from '../hooks';
import { stockStatus } from '../data/operations';
import StatCard from '../components/ui/StatCard';
import StatusBadge from '../components/ui/StatusBadge';
import Modal from '../components/ui/Modal';
import Pagination from '../components/ui/Pagination';
import { EmptyState, Field, PageHeader } from '../components/ui/misc';

const EMPTY_ITEM = { name: '', category: 'Produce', quantity: '0', unit: 'kg', minimum: '5', branchId: '' };
const CATEGORIES = ['Produce', 'Dairy', 'Protein', 'Grains', 'Pantry', 'Beverages', 'Packaging'];

export default function Inventory() {
  const { branches } = useData();
  const { scopeBranches, ids } = useScope();
  const { inventoryItems: items, setInventoryItems: setItems } = useOperationsPreview();
  const toast = useToast();
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('All');
  const [branch, setBranch] = useState('All');
  const [form, setForm] = useState(null);

  const scopedItems = useMemo(() => items.filter((item) => ids.includes(item.branchId)), [items, ids]);
  const categories = [...new Set(scopedItems.map((item) => item.category))];
  const filtered = scopedItems.filter((item) => (
    (category === 'All' || item.category === category)
    && (branch === 'All' || item.branchId === branch)
    && `${item.name} ${item.category} ${item.unit}`.toLowerCase().includes(query.toLowerCase())
  ));
  const page = usePagination(filtered, 8);
  const low = scopedItems.filter((item) => stockStatus(item) === 'Low stock');
  const out = scopedItems.filter((item) => stockStatus(item) === 'Out of stock');
  const branchName = (id) => branches.find((item) => item.id === id)?.name || '—';

  const saveItem = () => {
    if (!form?.name.trim() || !form.unit.trim() || Number(form.quantity) < 0 || Number(form.minimum) < 0 || !form.branchId) {
      toast.error('Enter an item, valid quantities, unit and branch.');
      return;
    }
    const saved = { ...form, quantity: Number(form.quantity), minimum: Number(form.minimum) };
    if (form.id) setItems((current) => current.map((item) => item.id === form.id ? saved : item));
    else setItems((current) => [{ ...saved, id: `preview-${Date.now()}` }, ...current]);
    toast.info('Inventory preview updated. Changes are temporary and are not saved to the server.');
    setForm(null);
  };

  return (
    <>
      <PageHeader title="Inventory" subtitle="Track ingredient and supply levels by outlet"
        actions={<button className="btn-primary" onClick={() => setForm({ ...EMPTY_ITEM, branchId: scopeBranches[0]?.id || '' })}><Plus size={16} /> Add inventory item</button>} />

      <div className="mb-5 rounded-xl border border-brand-100 bg-brand-50/70 px-4 py-3 text-sm text-brand-900">Sample inventory preview · updates are temporary and no inventory API is connected yet.</div>

      {(low.length > 0 || out.length > 0) && <div className="mb-5 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50/70 px-4 py-3">
        <CircleAlert size={18} className="mt-0.5 shrink-0 text-amber-700" />
        <div><p className="text-sm font-semibold text-amber-900">Stock needs attention</p><p className="mt-0.5 text-xs text-amber-800">{out.length ? `${out.length} out of stock` : ''}{out.length && low.length ? ' · ' : ''}{low.length ? `${low.length} below minimum` : ''}{(out.length || low.length) ? ` across ${new Set([...out, ...low].map((item) => item.branchId)).size} outlet(s)` : ''}.</p></div>
      </div>}

      <div className="mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={Boxes} label="Items tracked" value={scopedItems.length} tone="brand" />
        <StatCard icon={PackageCheck} label="In stock" value={scopedItems.length - low.length - out.length} tone="emerald" />
        <StatCard icon={CircleAlert} label="Low stock" value={low.length} tone="amber" />
        <StatCard icon={Building2} label="Out of stock" value={out.length} tone="sky" />
      </div>

      <div className="card">
        <div className="grid gap-3 border-b border-slate-100 p-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="relative"><Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /><input className="input pl-9" placeholder="Search inventory items" value={query} onChange={(event) => setQuery(event.target.value)} /></div>
          <select className="input" value={category} onChange={(event) => setCategory(event.target.value)}><option value="All">All categories</option>{categories.map((name) => <option key={name}>{name}</option>)}</select>
          <select className="input" value={branch} onChange={(event) => setBranch(event.target.value)}><option value="All">All branches</option>{scopeBranches.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select>
          <div className="flex items-center justify-end text-xs text-slate-500">{filtered.length} inventory items</div>
        </div>
        {filtered.length ? <div className="overflow-x-auto"><table className="w-full min-w-[880px]"><thead><tr><th className="th">Item</th><th className="th">Category</th><th className="th">Available</th><th className="th">Minimum level</th><th className="th">Stock status</th><th className="th">Branch</th><th className="th">Action</th></tr></thead>
          <tbody className="divide-y divide-slate-100">{page.slice.map((item) => <tr key={item.id} className="hover:bg-slate-50/70">
            <td className="td font-semibold text-slate-900">{item.name}</td><td className="td"><span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-700">{item.category}</span></td>
            <td className="td font-medium">{item.quantity} <span className="text-xs font-normal text-slate-500">{item.unit}</span></td>
            <td className="td text-slate-600">{item.minimum} {item.unit}</td><td className="td"><StatusBadge status={stockStatus(item)} /></td><td className="td text-slate-600">{branchName(item.branchId)}</td>
            <td className="td"><button className="btn-ghost px-2.5 py-1.5 text-xs" onClick={() => setForm({ ...item, quantity: String(item.quantity), minimum: String(item.minimum) })}><Pencil size={14} /> Update stock</button></td>
          </tr>)}</tbody></table></div> : <EmptyState title="No inventory items found" text="Try changing your search or filters." />}
        <Pagination {...page} onChange={page.setPage} />
      </div>

      <Modal open={!!form} onClose={() => setForm(null)} size="md" title={form?.id ? 'Update inventory item' : 'Add inventory item'} subtitle="Preview only — stock changes are not persisted"
        footer={<><button className="btn-ghost" onClick={() => setForm(null)}>Cancel</button><button className="btn-primary" onClick={saveItem}>{form?.id ? 'Save stock update' : 'Add item'}</button></>}>
        {form && <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Item name"><input className="input" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="e.g. Fresh coriander" /></Field>
          <Field label="Category"><select className="input" value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })}>{CATEGORIES.map((name) => <option key={name}>{name}</option>)}</select></Field>
          <Field label="Available quantity"><input className="input" type="number" min="0" step="0.1" value={form.quantity} onChange={(event) => setForm({ ...form, quantity: event.target.value })} /></Field>
          <Field label="Unit"><input className="input" value={form.unit} onChange={(event) => setForm({ ...form, unit: event.target.value })} placeholder="kg, L, pcs" /></Field>
          <Field label="Minimum stock level"><input className="input" type="number" min="0" step="0.1" value={form.minimum} onChange={(event) => setForm({ ...form, minimum: event.target.value })} /></Field>
          <Field label="Branch"><select className="input" value={form.branchId} onChange={(event) => setForm({ ...form, branchId: event.target.value })}>{scopeBranches.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></Field>
        </div>}
      </Modal>
    </>
  );
}

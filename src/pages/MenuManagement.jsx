import { useState } from 'react';
import { Pencil, Plus, Search, Trash2, Leaf, Store } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { useToast } from '../context/ToastContext';
import { useFakeLoad, usePagination } from '../hooks';
import { CATEGORIES, CATEGORY_STYLE } from '../data/menu';
import { fmtINR } from '../utils/format';
import MenuFormModal from '../components/menu/MenuFormModal';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import Pagination from '../components/ui/Pagination';
import { CardSkeleton, EmptyState, PageHeader, Switch } from '../components/ui/misc';

function FoodImage({ item }) {
  const [bad, setBad] = useState(false);
  if (item.image && !bad) return <img src={item.image} alt={item.name} onError={() => setBad(true)} className="h-full w-full object-cover" />;
  return <div className={`flex h-full w-full items-center justify-center bg-gradient-to-br text-6xl ${CATEGORY_STYLE[item.category]}`}>{item.emoji}</div>;
}

export default function MenuManagement() {
  const { role } = useAuth();
  const { menu, branches, addMenuItem, updateMenuItem, deleteMenuItem } = useData();
  const toast = useToast();
  const loading = useFakeLoad();
  const can = role.canEditMenu;
  const myBranches = role.scope === 'all' ? branches : branches.filter((b) => role.scope.includes(b.id));
  const [q, setQ] = useState(''); const [cat, setCat] = useState('All'); const [branch, setBranch] = useState('All');
  const [form, setForm] = useState({ open: false, item: null });
  const [del, setDel] = useState(null);

  const list = menu.filter((m) => (cat === 'All' || m.category === cat) && (branch === 'All' || m.branches.includes(branch)) && `${m.name} ${m.description}`.toLowerCase().includes(q.toLowerCase()));
  const pg = usePagination(list, 8);

  const save = (data) => {
    if (form.item) { updateMenuItem(form.item.id, data); toast.success(`${data.name} updated.`); }
    else { addMenuItem(data); toast.success(`${data.name} added to the menu.`); }
    setForm({ open: false, item: null });
  };
  const toggle = (m, v) => { updateMenuItem(m.id, { available: v }); toast.success(`${m.name} marked ${v ? 'available' : 'unavailable'}.`); };

  return (
    <>
      <PageHeader title="Menu Management" subtitle={`${menu.length} items across ${CATEGORIES.length} categories${can ? '' : ' · view only'}`} actions={can && <button className="btn-primary" onClick={() => setForm({ open: true, item: null })}><Plus size={16} /> Add food item</button>} />
      <div className="card mb-6 p-4">
        <div className="flex flex-col gap-3 md:flex-row">
          <div className="relative flex-1"><Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /><input className="input pl-9" placeholder="Search food items…" value={q} onChange={(e) => setQ(e.target.value)} /></div>
          <select className="input md:w-64" value={branch} onChange={(e) => setBranch(e.target.value)}><option value="All">All branches</option>{myBranches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}</select>
        </div>
        <div className="mt-3 flex gap-2 overflow-x-auto pb-1">{['All', ...CATEGORIES].map((c) => <button key={c} onClick={() => setCat(c)} className={`shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition ${cat === c ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>{c}</button>)}</div>
      </div>

      {loading ? <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">{Array.from({ length: 8 }, (_, i) => <CardSkeleton key={i} className="h-72" />)}</div>
        : list.length === 0 ? <div className="card"><EmptyState /></div> : (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">{pg.slice.map((m) => (
          <div key={m.id} className={`card group overflow-hidden transition hover:shadow-lg ${m.available ? '' : 'opacity-75'}`}>
            <div className="relative h-36 overflow-hidden"><FoodImage item={m} />
              <span className={`absolute left-3 top-3 flex h-5 w-5 items-center justify-center rounded border-2 bg-white ${m.veg ? 'border-emerald-600' : 'border-red-600'}`}><span className={`h-2 w-2 rounded-full ${m.veg ? 'bg-emerald-600' : 'bg-red-600'}`} /></span>
              <span className="absolute right-3 top-3 rounded-full bg-white/90 px-2 py-0.5 text-[11px] font-semibold text-slate-700">{m.category}</span>
            </div>
            <div className="p-4">
              <div className="flex items-start justify-between gap-2"><h3 className="font-semibold leading-tight">{m.name}</h3><span className="font-bold text-brand-700">{fmtINR(m.price)}</span></div>
              <p className="mt-1 line-clamp-2 h-10 text-xs text-slate-500">{m.description}</p>
              <p className="mt-2 flex items-center gap-1 text-xs text-slate-500"><Store size={12} /> {m.branches.length} branch{m.branches.length !== 1 && 'es'}</p>
              <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3">
                <label className="flex items-center gap-2 text-xs font-medium text-slate-600"><Switch checked={m.available} onChange={(v) => toggle(m, v)} disabled={!can} />{m.available ? 'Available' : 'Sold out'}</label>
                {can && <div className="flex"><button className="icon-btn" onClick={() => setForm({ open: true, item: m })}><Pencil size={15} /></button><button className="icon-btn hover:!bg-red-50 hover:!text-red-600" onClick={() => setDel(m)}><Trash2 size={15} /></button></div>}
              </div>
            </div>
          </div>))}</div>)}
      {!loading && list.length > 0 && <div className="card mt-6"><Pagination {...pg} onChange={pg.setPage} /></div>}

      <MenuFormModal open={form.open} item={form.item} onClose={() => setForm({ open: false, item: null })} onSave={save} />
      <ConfirmDialog open={!!del} title="Delete food item?" message={`“${del?.name}” will be removed from every branch menu.`} onCancel={() => setDel(null)} onConfirm={() => { deleteMenuItem(del.id); toast.success(`${del.name} deleted.`); setDel(null); }} />
    </>
  );
}

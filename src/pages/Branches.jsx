import { useState } from 'react';
import { Eye, LayoutGrid, List, MapPin, Pencil, Phone, Plus, Search, Star, Trash2, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { useToast } from '../context/ToastContext';
import { useFakeLoad, usePagination, useScope } from '../hooks';
import { fmtINR, fmtShort } from '../utils/format';
import BranchFormModal, { CITIES } from '../components/branches/BranchFormModal';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import Modal from '../components/ui/Modal';
import Pagination from '../components/ui/Pagination';
import StatusBadge from '../components/ui/StatusBadge';
import { EmptyState, PageHeader, TableSkeleton } from '../components/ui/misc';

export default function Branches() {
  const { role } = useAuth();
  const { addBranch, updateBranch, deleteBranch } = useData();
  const { scopeBranches } = useScope();
  const toast = useToast();
  const loading = useFakeLoad();
  const [q, setQ] = useState(''); const [city, setCity] = useState('All'); const [status, setStatus] = useState('All');
  const [view, setView] = useState('table');
  const [form, setForm] = useState({ open: false, branch: null });
  const [detail, setDetail] = useState(null);
  const [del, setDel] = useState(null);

  const list = scopeBranches.filter((b) => (city === 'All' || b.city === city) && (status === 'All' || b.status === status) && `${b.name} ${b.code} ${b.manager} ${b.city}`.toLowerCase().includes(q.toLowerCase()));
  const pg = usePagination(list, view === 'table' ? 6 : 6);
  const can = role.canManageBranches;

  const save = (data) => {
    if (form.branch) { updateBranch(form.branch.id, data); toast.success(`${data.name} updated successfully.`); }
    else { addBranch(data); toast.success(`${data.name} added successfully.`); }
    setForm({ open: false, branch: null });
  };
  const confirmDelete = () => { deleteBranch(del.id); toast.success(`${del.name} deleted.`); setDel(null); };
  const Actions = ({ b }) => (
    <div className="flex items-center gap-1">
      <button className="icon-btn" title="View" onClick={() => setDetail(b)}><Eye size={16} /></button>
      {can && <><button className="icon-btn" title="Edit" onClick={() => setForm({ open: true, branch: b })}><Pencil size={16} /></button>
        <button className="icon-btn hover:!bg-red-50 hover:!text-red-600" title="Delete" onClick={() => setDel(b)}><Trash2 size={16} /></button></>}
    </div>
  );

  return (
    <>
      <PageHeader title="Branch Management" subtitle={`${scopeBranches.length} outlets across Karnataka`} actions={can && <button className="btn-primary" onClick={() => setForm({ open: true, branch: null })}><Plus size={16} /> Add branch</button>} />
      <div className="card">
        <div className="flex flex-col gap-3 border-b border-slate-100 p-4 lg:flex-row lg:items-center">
          <div className="relative flex-1"><Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /><input className="input pl-9" placeholder="Search by name, code, manager…" value={q} onChange={(e) => setQ(e.target.value)} /></div>
          <select className="input lg:w-40" value={city} onChange={(e) => setCity(e.target.value)}><option>All</option>{CITIES.map((c) => <option key={c}>{c}</option>)}</select>
          <select className="input lg:w-40" value={status} onChange={(e) => setStatus(e.target.value)}><option>All</option><option>Active</option><option>Inactive</option><option>Maintenance</option></select>
          <div className="flex rounded-lg bg-slate-100 p-1">{[['table', List], ['grid', LayoutGrid]].map(([k, I]) => <button key={k} onClick={() => setView(k)} className={`rounded-md p-1.5 ${view === k ? 'bg-white text-brand-700 shadow-sm' : 'text-slate-500'}`}><I size={16} /></button>)}</div>
        </div>

        {loading ? <TableSkeleton /> : list.length === 0 ? <EmptyState /> : view === 'table' ? (
          <div className="overflow-x-auto"><table className="w-full min-w-[820px]">
            <thead className="bg-slate-50"><tr><th className="th">Branch</th><th className="th">Code</th><th className="th">City</th><th className="th">Manager</th><th className="th">Contact</th><th className="th">Status</th><th className="th">Actions</th></tr></thead>
            <tbody className="divide-y divide-slate-100">{pg.slice.map((b) => (
              <tr key={b.id} className="hover:bg-slate-50">
                <td className="td"><p className="font-semibold text-slate-900">{b.name}</p><p className="max-w-[240px] truncate text-xs text-slate-500">{b.address}</p></td>
                <td className="td font-mono text-xs">{b.code}</td><td className="td">{b.city}</td><td className="td">{b.manager}</td><td className="td">{b.phone}</td>
                <td className="td"><StatusBadge status={b.status} /></td><td className="td"><Actions b={b} /></td>
              </tr>))}</tbody></table></div>
        ) : (
          <div className="grid gap-4 p-4 sm:grid-cols-2 xl:grid-cols-3">{pg.slice.map((b) => (
            <div key={b.id} className="rounded-xl border border-slate-200 p-4 transition hover:shadow-md">
              <div className="flex items-start justify-between"><div><p className="font-semibold">{b.name}</p><p className="font-mono text-xs text-slate-500">{b.code}</p></div><StatusBadge status={b.status} /></div>
              <div className="mt-3 space-y-1.5 text-sm text-slate-600"><p className="flex gap-2"><MapPin size={15} className="mt-0.5 shrink-0 text-slate-400" />{b.city}</p><p className="flex gap-2"><User size={15} className="text-slate-400" />{b.manager}</p><p className="flex gap-2"><Phone size={15} className="text-slate-400" />{b.phone}</p></div>
              <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3"><span className="text-sm font-semibold text-brand-700">{b.revenue ? fmtShort(b.revenue) : '—'}</span><Actions b={b} /></div>
            </div>))}</div>
        )}
        {!loading && <Pagination {...pg} onChange={pg.setPage} />}
      </div>

      <BranchFormModal open={form.open} branch={form.branch} onClose={() => setForm({ open: false, branch: null })} onSave={save} />
      <ConfirmDialog open={!!del} title="Delete branch?" message={`“${del?.name}” and its configuration will be removed. This cannot be undone.`} onCancel={() => setDel(null)} onConfirm={confirmDelete} />
      <Modal open={!!detail} onClose={() => setDetail(null)} title={detail?.name} subtitle={detail?.code}
        footer={<>{can && <button className="btn-ghost" onClick={() => { setForm({ open: true, branch: detail }); setDetail(null); }}><Pencil size={15} /> Edit</button>}<button className="btn-primary" onClick={() => setDetail(null)}>Close</button></>}>
        {detail && (
          <div className="space-y-5">
            <div className="grid grid-cols-3 gap-3">
              {[['Revenue (Nov)', detail.revenue ? fmtINR(detail.revenue) : '—'], ['Orders', detail.orders.toLocaleString('en-IN')], ['Rating', detail.rating ? `${detail.rating} ★` : '—']].map(([l, v]) => <div key={l} className="rounded-lg bg-slate-50 p-3 text-center"><p className="text-base font-bold sm:text-lg">{v}</p><p className="text-[11px] text-slate-500">{l}</p></div>)}
            </div>
            <dl className="grid gap-3 text-sm sm:grid-cols-2">
              {[['City', detail.city], ['Manager', detail.manager], ['Contact', detail.phone], ['Opened', new Date(detail.opened).toLocaleDateString('en-IN', { dateStyle: 'medium' })]].map(([k, v]) => <div key={k}><dt className="text-xs text-slate-500">{k}</dt><dd className="font-medium">{v}</dd></div>)}
              <div className="sm:col-span-2"><dt className="text-xs text-slate-500">Address</dt><dd className="font-medium">{detail.address}</dd></div>
              <div><dt className="text-xs text-slate-500">Status</dt><dd className="mt-1"><StatusBadge status={detail.status} /></dd></div>
            </dl>
          </div>
        )}
      </Modal>
    </>
  );
}

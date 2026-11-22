import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Eye, Plus, Search } from 'lucide-react';
import { useData } from '../context/DataContext';
import { useToast } from '../context/ToastContext';
import { useFakeLoad, usePagination, useScope } from '../hooks';
import { fmtDate, fmtINR } from '../utils/format';
import OrderFormModal from '../components/orders/OrderFormModal';
import OrderDetailModal from '../components/orders/OrderDetailModal';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import Pagination from '../components/ui/Pagination';
import { EmptyState, PageHeader, TableSkeleton } from '../components/ui/misc';

const STATUSES = [{ value: 'Placed', label: 'Pending' }, { value: 'Preparing', label: 'Preparing' }, { value: 'Ready', label: 'Ready' }, { value: 'Completed', label: 'Completed' }, { value: 'Cancelled', label: 'Cancelled' }];
const SELECT = { Placed: 'bg-sky-50 text-sky-700', Preparing: 'bg-amber-50 text-amber-700', Ready: 'bg-violet-50 text-violet-700', Completed: 'bg-emerald-50 text-emerald-700', Cancelled: 'bg-red-50 text-red-700' };

export default function Orders() {
  const { orders, branches, addOrder, setOrderStatus } = useData();
  const { scopeBranches, ids } = useScope();
  const toast = useToast();
  const loading = useFakeLoad();
  const [params] = useSearchParams();
  const [q, setQ] = useState(params.get('q') || '');
  useEffect(() => setQ(params.get('q') || ''), [params]);
  const [status, setStatus] = useState('All'); const [branch, setBranch] = useState('All');
  const [creating, setCreating] = useState(false);
  const [viewId, setViewId] = useState(null);
  const [cancel, setCancel] = useState(null);

  const list = orders.filter((o) => ids.includes(o.branchId) && (status === 'All' || o.status === status) && (branch === 'All' || o.branchId === branch) && `${o.id} ${o.customer} ${o.phone}`.toLowerCase().includes(q.toLowerCase()));
  const pg = usePagination(list, 8);
  const viewing = orders.find((o) => o.id === viewId);
  const bName = (id) => branches.find((b) => b.id === id)?.short;

  const change = (o, s) => {
    if (s === 'Cancelled') { setCancel(o); return; }
    setOrderStatus(o.id, s); toast.success(`${o.id} marked as ${s}.`);
  };
  const create = (data) => { const o = addOrder(data); setCreating(false); toast.success(`Order ${o.id} placed successfully.`); };

  return (
    <>
      <PageHeader title="Order Management" subtitle="Track and manage orders across your outlets" actions={<button className="btn-primary" onClick={() => setCreating(true)}><Plus size={16} /> Create new order</button>} />
      <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-5">
        {STATUSES.map(({ value, label }) => { const c = orders.filter((o) => ids.includes(o.branchId) && o.status === value).length; return (
          <button key={value} onClick={() => setStatus(status === value ? 'All' : value)} className={`card p-3 text-left transition hover:shadow-md ${status === value ? 'ring-2 ring-brand-500' : ''}`}><p className="text-xl font-bold">{c}</p><p className="text-xs text-slate-500">{label}</p></button>); })}
      </div>
      <div className="card">
        <div className="flex flex-col gap-3 border-b border-slate-100 p-4 lg:flex-row">
          <div className="relative flex-1"><Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /><input className="input pl-9" placeholder="Search by order ID, customer or phone…" value={q} onChange={(e) => setQ(e.target.value)} /></div>
          <select className="input lg:w-44" value={status} onChange={(e) => setStatus(e.target.value)}><option value="All">All statuses</option>{STATUSES.map(({ value, label }) => <option key={value} value={value}>{label}</option>)}</select>
          {scopeBranches.length > 1 && <select className="input lg:w-52" value={branch} onChange={(e) => setBranch(e.target.value)}><option value="All">All branches</option>{scopeBranches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}</select>}
        </div>
        {loading ? <TableSkeleton rows={8} /> : list.length === 0 ? <EmptyState title="No orders found" /> : (
          <div className="overflow-x-auto"><table className="w-full min-w-[900px]">
            <thead className="bg-slate-50"><tr><th className="th">Order ID</th><th className="th">Customer</th><th className="th">Branch</th><th className="th">Items</th><th className="th">Total</th><th className="th">Status</th><th className="th">Placed</th><th className="th"></th></tr></thead>
            <tbody className="divide-y divide-slate-100">{pg.slice.map((o) => (
              <tr key={o.id} className="hover:bg-slate-50">
                <td className="td font-semibold text-slate-900">{o.id}</td>
                <td className="td"><p>{o.customer}</p><p className="text-xs text-slate-400">{o.type} · {o.payment}</p></td>
                <td className="td text-slate-600">{bName(o.branchId)}</td>
                <td className="td text-slate-600"><p className="max-w-[220px] truncate">{o.lines.map((line) => `${line.qty}× ${line.name}`).join(', ')}</p><p className="text-xs text-slate-400">{o.lines.reduce((s, l) => s + l.qty, 0)} items</p></td>
                <td className="td font-semibold">{fmtINR(o.total)}</td>
                <td className="td"><select value={o.status} onChange={(e) => change(o, e.target.value)} className={`cursor-pointer rounded-full border-0 py-1 pl-3 pr-7 text-xs font-semibold outline-none ${SELECT[o.status]}`}>{STATUSES.map(({ value, label }) => <option key={value} value={value}>{label}</option>)}</select></td>
                <td className="td text-xs text-slate-500"><p>{fmtDate(o.date)}</p><p className="mt-0.5 text-[11px] text-slate-400">{new Date(o.date).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</p></td>
                <td className="td"><button className="icon-btn" title="View details" onClick={() => setViewId(o.id)}><Eye size={16} /></button></td>
              </tr>))}</tbody></table></div>)}
        {!loading && <Pagination {...pg} onChange={pg.setPage} />}
      </div>

      <OrderFormModal open={creating} onClose={() => setCreating(false)} onSave={create} />
      <OrderDetailModal order={viewing} onClose={() => setViewId(null)} onStatus={(s) => (s === 'Cancelled' ? setCancel(viewing) : (setOrderStatus(viewing.id, s), toast.success(`${viewing.id} marked as ${s}.`)))} />
      <ConfirmDialog open={!!cancel} title="Cancel this order?" confirmText="Yes, cancel order" message={`Order ${cancel?.id} for ${cancel?.customer} will be marked as cancelled.`} onCancel={() => setCancel(null)}
        onConfirm={() => { setOrderStatus(cancel.id, 'Cancelled'); toast.error(`${cancel.id} was cancelled.`); setCancel(null); }} />
    </>
  );
}

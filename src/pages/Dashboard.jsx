import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Activity, Building2, CheckCheck, ChefHat, IndianRupee, ShoppingBag, Store, Star, UtensilsCrossed, Users, Zap, ArrowRight, Clock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { useToast } from '../context/ToastContext';
import { useFakeLoad, useScope } from '../hooks';
import { salesSeries, activities } from '../data/dashboard';
import { fmtINR, fmtShort, timeAgo } from '../utils/format';
import StatCard from '../components/ui/StatCard';
import StatusBadge from '../components/ui/StatusBadge';
import { CardSkeleton, PageHeader } from '../components/ui/misc';

const ACT_ICON = { order: ShoppingBag, menu: UtensilsCrossed, branch: Store, user: Users };
const PIE = { Placed: '#0ea5e9', Preparing: '#f59e0b', Ready: '#8b5cf6', Completed: '#10b981', Cancelled: '#ef4444' };
const tip = { borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 12 };

function StaffDashboard() {
  const { user } = useAuth();
  const { orders, setOrderStatus } = useData();
  const { ids } = useScope();
  const toast = useToast();
  const mine = orders.filter((o) => ids.includes(o.branchId));
  const count = (s) => mine.filter((o) => o.status === s).length;
  const queue = mine.filter((o) => ['Placed', 'Preparing', 'Ready'].includes(o.status));
  const next = { Placed: 'Preparing', Preparing: 'Ready', Ready: 'Completed' };
  const [tasks, setTasks] = useState([['Sanitise counters & POS', true], ['Check fridge temperature log', true], ['Restock paper cups & takeaway boxes', false], ['Verify paneer & chicken stock', false], ['Update “sold out” items on menu', false]]);
  return (
    <>
      <PageHeader title={`Good day, ${user.name.split(' ')[0]} 👋`} subtitle="Hubballi Gokul Road · Today’s order queue and shift checklist" actions={<Link to="/orders" className="btn-primary"><ShoppingBag size={16} /> New order</Link>} />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard icon={ShoppingBag} tone="sky" label="New orders" value={count('Placed')} />
        <StatCard icon={ChefHat} tone="amber" label="In kitchen" value={count('Preparing')} />
        <StatCard icon={Zap} tone="violet" label="Ready to serve" value={count('Ready')} />
        <StatCard icon={CheckCheck} tone="emerald" label="Completed today" value={count('Completed')} />
      </div>
      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="card lg:col-span-2">
          <div className="border-b border-slate-100 px-5 py-4"><h3 className="font-semibold">Live order queue</h3></div>
          <ul className="divide-y divide-slate-100">
            {queue.length === 0 && <li className="p-8 text-center text-sm text-slate-500">All caught up — no active orders.</li>}
            {queue.map((o) => (
              <li key={o.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-3">
                <div><p className="text-sm font-semibold">{o.id} · {o.customer}</p><p className="text-xs text-slate-500">{o.lines.map((l) => `${l.qty}× ${l.name}`).join(', ')}</p></div>
                <div className="flex items-center gap-3"><StatusBadge status={o.status} />
                  <button className="btn-ghost px-3 py-1.5 text-xs" onClick={() => { setOrderStatus(o.id, next[o.status]); toast.success(`${o.id} → ${next[o.status]}`); }}>Mark {next[o.status]}</button></div>
              </li>
            ))}
          </ul>
        </div>
        <div className="card">
          <div className="border-b border-slate-100 px-5 py-4"><h3 className="font-semibold">Shift checklist</h3><p className="text-xs text-slate-500">{tasks.filter((t) => t[1]).length}/{tasks.length} done</p></div>
          <ul className="space-y-1 p-3">
            {tasks.map(([t, d], i) => (
              <li key={t}><label className="flex cursor-pointer items-center gap-3 rounded-lg p-2 hover:bg-slate-50"><input type="checkbox" checked={d} onChange={() => setTasks(tasks.map((x, j) => (j === i ? [x[0], !x[1]] : x)))} className="h-4 w-4 accent-brand-600" /><span className={`text-sm ${d ? 'text-slate-400 line-through' : ''}`}>{t}</span></label></li>
            ))}
          </ul>
        </div>
      </div>
    </>
  );
}

export default function Dashboard() {
  const { role, roleKey, user } = useAuth();
  const { branches, orders, menu } = useData();
  const { scopeBranches, ids } = useScope();
  const loading = useFakeLoad(700);
  const [range, setRange] = useState('daily');
  if (roleKey === 'staff') return <StaffDashboard />;

  const totalAll = branches.reduce((s, b) => s + b.revenue, 0) || 1;
  const revenue = scopeBranches.reduce((s, b) => s + b.revenue, 0);
  const factor = revenue / totalAll;
  const totalOrders = scopeBranches.reduce((s, b) => s + b.orders, 0);
  const active = scopeBranches.filter((b) => b.status === 'Active').length;
  const sOrders = orders.filter((o) => ids.includes(o.branchId));
  const recent = sOrders.slice(0, 6);
  const sales = salesSeries[range].map((p) => ({ ...p, sales: Math.round(p.sales * factor) }));
  const top = [...menu].sort((a, b) => b.sold - a.sold).slice(0, 5).map((m) => ({ ...m, units: Math.round(m.sold * factor) }));
  const rating = (scopeBranches.filter((b) => b.rating).reduce((s, b) => s + b.rating, 0) / (scopeBranches.filter((b) => b.rating).length || 1)).toFixed(1);
  const cancelRate = sOrders.length ? ((sOrders.filter((o) => o.status === 'Cancelled').length / sOrders.length) * 100).toFixed(1) : '0.0';
  const done = sOrders.length ? Math.round((sOrders.filter((o) => o.status === 'Completed').length / sOrders.length) * 100) : 0;
  const single = scopeBranches.length === 1;
  const statusData = Object.keys(PIE).map((s) => ({ name: s, value: sOrders.filter((o) => o.status === s).length })).filter((d) => d.value);
  const branchData = scopeBranches.filter((b) => b.revenue).map((b) => ({ name: b.short, revenue: b.revenue }));

  if (loading) return <div className="space-y-6"><CardSkeleton className="h-10 w-72" /><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{[1, 2, 3, 4].map((i) => <CardSkeleton key={i} />)}</div><div className="grid gap-6 lg:grid-cols-2"><CardSkeleton className="h-80" /><CardSkeleton className="h-80" /></div></div>;

  const perf = [
    { label: 'Avg. order value', value: fmtINR(revenue / (totalOrders || 1)), pct: 72, bar: 'bg-brand-500' },
    { label: 'Order fulfilment', value: `${done}%`, pct: done, bar: 'bg-emerald-500' },
    { label: 'Customer rating', value: `${rating} / 5`, pct: (rating / 5) * 100, bar: 'bg-amber-500' },
    { label: 'Cancellation rate', value: `${cancelRate}%`, pct: Number(cancelRate) * 5, bar: 'bg-red-500' }
  ];

  return (
    <>
      <PageHeader title={`Welcome, ${user.name.split(' ')[0]}`} subtitle={`${role.label} dashboard · ${single ? scopeBranches[0].name : `${scopeBranches.length} outlets in scope`} · November 2026`}
        actions={<Link to="/orders" className="btn-primary"><ShoppingBag size={16} /> Manage orders</Link>} />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={Building2} tone="brand" label={single ? 'My outlet' : 'Total outlets / branches'} value={scopeBranches.length} delta={single ? undefined : 8.3} hint={`${scopeBranches.length - active} not operating`} />
        <StatCard icon={IndianRupee} tone="emerald" label="Total revenue (Nov)" value={fmtShort(revenue)} delta={12.4} hint="vs last month" />
        <StatCard icon={ShoppingBag} tone="sky" label="Total orders" value={totalOrders.toLocaleString('en-IN')} delta={9.1} hint="vs last month" />
        <StatCard icon={Activity} tone="violet" label="Active outlets" value={`${active}/${scopeBranches.length}`} hint="Currently open for business" />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-3">
        <div className="card p-5 xl:col-span-2">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div><h3 className="font-semibold">Sales overview</h3><p className="text-xs text-slate-500">Revenue trend ({range})</p></div>
            <div className="flex rounded-lg bg-slate-100 p-1">{['daily', 'weekly', 'monthly'].map((r) => <button key={r} onClick={() => setRange(r)} className={`rounded-md px-3 py-1 text-xs font-medium capitalize transition ${range === r ? 'bg-white text-brand-700 shadow-sm' : 'text-slate-500'}`}>{r}</button>)}</div>
          </div>
          <div className="h-72"><ResponsiveContainer>
            <AreaChart data={sales} margin={{ left: -10, right: 8 }}>
              <defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#f25a14" stopOpacity={0.35} /><stop offset="95%" stopColor="#f25a14" stopOpacity={0} /></linearGradient></defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tickFormatter={fmtShort} tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
              <Tooltip formatter={(v) => [fmtINR(v), 'Sales']} contentStyle={tip} />
              <Area type="monotone" dataKey="sales" stroke="#e34409" strokeWidth={2.5} fill="url(#g)" />
            </AreaChart></ResponsiveContainer></div>
        </div>

        <div className="card p-5">
          <h3 className="font-semibold">{single ? 'Orders by status' : 'Branch-wise revenue'}</h3>
          <p className="mb-2 text-xs text-slate-500">{single ? 'Current order pipeline' : 'This month, by outlet'}</p>
          <div className="h-72"><ResponsiveContainer>
            {single ? (
              <PieChart><Pie data={statusData} dataKey="value" nameKey="name" innerRadius={55} outerRadius={90} paddingAngle={3}>{statusData.map((d) => <Cell key={d.name} fill={PIE[d.name]} />)}</Pie><Tooltip contentStyle={tip} /></PieChart>
            ) : (
              <BarChart data={branchData} layout="vertical" margin={{ left: 8, right: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
                <XAxis type="number" tickFormatter={fmtShort} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="name" width={86} tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip formatter={(v) => [fmtINR(v), 'Revenue']} contentStyle={tip} cursor={{ fill: '#fff4ed' }} />
                <Bar dataKey="revenue" fill="#f25a14" radius={[0, 6, 6, 0]} barSize={18} />
              </BarChart>
            )}
          </ResponsiveContainer></div>
        </div>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {perf.map((p) => (
          <div key={p.label} className="card p-4"><p className="text-xs font-medium text-slate-500">{p.label}</p><p className="mt-1 text-xl font-bold">{p.value}</p>
            <div className="mt-3 h-1.5 rounded-full bg-slate-100"><div className={`h-1.5 rounded-full ${p.bar}`} style={{ width: `${Math.min(100, p.pct)}%` }} /></div></div>
        ))}
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-3">
        <div className="card xl:col-span-2">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4"><h3 className="font-semibold">Recent orders</h3><Link to="/orders" className="flex items-center gap-1 text-xs font-medium text-brand-600">View all <ArrowRight size={14} /></Link></div>
          <div className="overflow-x-auto"><table className="w-full min-w-[620px]">
            <thead className="bg-slate-50"><tr><th className="th">Order</th><th className="th">Customer</th><th className="th">Branch</th><th className="th">Total</th><th className="th">Status</th><th className="th">Time</th></tr></thead>
            <tbody className="divide-y divide-slate-100">{recent.map((o) => (
              <tr key={o.id} className="hover:bg-slate-50"><td className="td font-semibold text-slate-900">{o.id}</td><td className="td">{o.customer}</td><td className="td text-slate-500">{branches.find((b) => b.id === o.branchId)?.short}</td><td className="td font-medium">{fmtINR(o.total)}</td><td className="td"><StatusBadge status={o.status} /></td><td className="td text-xs text-slate-500">{timeAgo(o.date)}</td></tr>
            ))}</tbody></table></div>
        </div>

        <div className="card p-5">
          <h3 className="font-semibold">Top-selling items</h3><p className="mb-4 text-xs text-slate-500">Units sold this month</p>
          <ul className="space-y-4">{top.map((t, i) => (
            <li key={t.id} className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-50 text-xl">{t.emoji}</span>
              <div className="min-w-0 flex-1"><div className="flex justify-between text-sm"><span className="truncate font-medium">{i + 1}. {t.name}</span><span className="text-slate-500">{t.units.toLocaleString('en-IN')}</span></div>
                <div className="mt-1.5 h-1.5 rounded-full bg-slate-100"><div className="h-1.5 rounded-full bg-brand-500" style={{ width: `${(t.units / top[0].units) * 100}%` }} /></div></div>
            </li>))}</ul>
        </div>
      </div>

      <div className="card mt-6 p-5">
        <h3 className="mb-4 flex items-center gap-2 font-semibold"><Clock size={16} className="text-brand-600" /> Recent activities</h3>
        <ul className="grid gap-x-8 gap-y-3 md:grid-cols-2">{activities.map((a) => { const I = ACT_ICON[a.type]; return (
          <li key={a.id} className="flex items-start gap-3"><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600"><I size={15} /></span><div><p className="text-sm">{a.text}</p><p className="text-xs text-slate-400">{a.time}</p></div></li>); })}</ul>
      </div>
    </>
  );
}

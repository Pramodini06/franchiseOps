import { useMemo, useState } from 'react';
import { Activity, ArrowDownRight, ArrowUpRight, BarChart3, CalendarRange, ClipboardList, PackageSearch, Users } from 'lucide-react';
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { useOperationsPreview } from '../context/OperationsPreviewContext';
import { useScope } from '../hooks';
import { attendanceForDate, buildStaffRoster, stockStatus } from '../data/operations';
import { fmtINR, fmtShort } from '../utils/format';
import StatCard from '../components/ui/StatCard';
import { EmptyState, PageHeader } from '../components/ui/misc';

const localDate = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
const parseDate = (value) => new Date(`${value}T00:00:00`);
const orderDay = (order) => {
  const date = new Date(order.date);
  return Number.isNaN(date.getTime()) ? '' : localDate(date);
};
const revenueOf = (orders) => orders.filter((order) => order.status !== 'Cancelled').reduce((sum, order) => sum + Number(order.total || 0), 0);
const chartTip = { borderRadius: 12, border: '1px solid #e5e9e1', fontSize: 12 };

function daySpan(from, to) {
  return Math.max(1, Math.round((parseDate(to) - parseDate(from)) / 86400000) + 1);
}

function summarizeAttendance(records) {
  const count = (status) => records.filter((record) => record.status === status).length;
  const eligible = records.length - count('On leave');
  const attended = count('Present') + count('Late') + count('Half-day') * 0.5;
  return {
    total: records.length,
    present: count('Present'),
    late: count('Late'),
    absent: count('Absent'),
    leave: count('On leave'),
    rate: eligible ? Math.round(attended / eligible * 100) : 0
  };
}

function makeBuckets(from, to, orders) {
  const span = daySpan(from, to);
  const step = span > 45 ? 7 : 1;
  const start = parseDate(from);
  const buckets = [];
  for (let offset = 0; offset < span; offset += step) {
    const bucketStart = new Date(start);
    bucketStart.setDate(start.getDate() + offset);
    const bucketEnd = new Date(start);
    bucketEnd.setDate(start.getDate() + Math.min(span - 1, offset + step - 1));
    const startKey = localDate(bucketStart);
    const endKey = localDate(bucketEnd);
    const bucketOrders = orders.filter((order) => orderDay(order) >= startKey && orderDay(order) <= endKey);
    buckets.push({
      label: step === 1 ? bucketStart.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : `${bucketStart.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}–${bucketEnd.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}`,
      revenue: Math.round(revenueOf(bucketOrders)),
      orders: bucketOrders.length
    });
  }
  return buckets;
}

export default function Analytics() {
  const { user, roleKey } = useAuth();
  const { branches, menu, orders, users, ready, hasLiveData } = useData();
  const { scopeBranches, ids } = useScope();
  const {
    shifts, staffProfiles, employeeUpdates, previewEmployees, hiddenEmployeeIds,
    attendanceOverrides, inventoryItems
  } = useOperationsPreview();
  const today = localDate(new Date());
  const [range, setRange] = useState('week');
  const [customFrom, setCustomFrom] = useState(today);
  const [customTo, setCustomTo] = useState(today);
  const invalidCustomRange = range === 'custom' && (!customFrom || !customTo || customFrom > customTo);

  const { from, to } = useMemo(() => {
    if (range === 'custom') return invalidCustomRange ? { from: today, to: today } : { from: customFrom, to: customTo };
    const end = parseDate(today);
    const start = new Date(end);
    if (range === 'today') start.setDate(end.getDate());
    else if (range === 'week') start.setDate(end.getDate() - ((end.getDay() + 6) % 7));
    else start.setDate(1);
    return { from: localDate(start), to: today };
  }, [range, customFrom, customTo, invalidCustomRange, today]);

  const allScopedOrders = orders.filter((order) => ids.includes(order.branchId));
  const periodOrders = invalidCustomRange ? [] : allScopedOrders.filter((order) => orderDay(order) >= from && orderDay(order) <= to);
  const previousSpan = daySpan(from, to);
  const previousEndDate = parseDate(from);
  previousEndDate.setDate(previousEndDate.getDate() - 1);
  const previousStartDate = new Date(previousEndDate);
  previousStartDate.setDate(previousStartDate.getDate() - previousSpan + 1);
  const previousFrom = localDate(previousStartDate);
  const previousTo = localDate(previousEndDate);
  const previousOrders = allScopedOrders.filter((order) => orderDay(order) >= previousFrom && orderDay(order) <= previousTo);
  const revenue = revenueOf(periodOrders);
  const previousRevenue = revenueOf(previousOrders);
  const revenueChange = previousRevenue ? Math.round((revenue - previousRevenue) / previousRevenue * 100) : null;
  const cancelled = periodOrders.filter((order) => order.status === 'Cancelled').length;
  const buckets = invalidCustomRange ? [] : makeBuckets(from, to, periodOrders);

  const branchPerformance = scopeBranches.map((branch) => {
    const branchOrders = periodOrders.filter((order) => order.branchId === branch.id);
    return { id: branch.id, name: branch.short || branch.name, revenue: Math.round(revenueOf(branchOrders)), orders: branchOrders.length };
  }).sort((a, b) => b.revenue - a.revenue);

  const itemMovement = menu.filter((item) => item.branches.some((branchId) => ids.includes(branchId))).map((item) => {
    const units = periodOrders.filter((order) => order.status !== 'Cancelled')
      .flatMap((order) => order.lines)
      .filter((line) => line.itemId === item.id)
      .reduce((sum, line) => sum + Number(line.qty || 0), 0);
    return { id: item.id, name: item.name, units };
  });
  const bestItems = [...itemMovement].filter((item) => item.units > 0).sort((a, b) => b.units - a.units).slice(0, 5);
  const lowItems = [...itemMovement].filter((item) => item.units > 0).sort((a, b) => a.units - b.units).slice(0, 5);

  const roster = [
    ...buildStaffRoster(users, branches).map((employee) => ({ ...employee, ...staffProfiles[employee.id], ...employeeUpdates[employee.id] })),
    ...previewEmployees
  ].filter((employee) => ids.includes(employee.branchId) && !hiddenEmployeeIds.includes(employee.id))
    .filter((employee) => roleKey !== 'staff' || employee.email === user.email);
  const inventory = inventoryItems.filter((item) => ids.includes(item.branchId));
  const inventorySummary = {
    inStock: inventory.filter((item) => stockStatus(item) === 'In stock').length,
    low: inventory.filter((item) => stockStatus(item) === 'Low stock').length,
    empty: inventory.filter((item) => stockStatus(item) === 'Out of stock').length
  };
  const trendDays = (() => {
    const count = Math.min(14, daySpan(from, to));
    const span = daySpan(from, to);
    return Array.from({ length: count }, (_, index) => {
      const date = parseDate(from);
      date.setDate(date.getDate() + (count === 1 ? 0 : Math.round(index * (span - 1) / (count - 1))));
      return localDate(date);
    });
  })();
  const attendanceTrend = trendDays.map((date) => {
    const overrides = Object.fromEntries(roster.map((employee) => [employee.id, attendanceOverrides[`${date}:${employee.id}`]?.status]));
    const summary = summarizeAttendance(attendanceForDate(roster, date, overrides, shifts));
    return { label: parseDate(date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }), rate: summary.rate };
  });
  const selectedAttendanceDate = to || today;
  const selectedOverrides = Object.fromEntries(roster.map((employee) => [employee.id, attendanceOverrides[`${selectedAttendanceDate}:${employee.id}`]?.status]));
  const selectedAttendance = attendanceForDate(roster, selectedAttendanceDate, selectedOverrides, shifts);
  const attendanceByBranch = scopeBranches.map((branch) => ({
    name: branch.short || branch.name,
    rate: summarizeAttendance(selectedAttendance.filter((record) => record.branchId === branch.id)).rate
  }));
  const inventoryChart = [
    { name: 'In stock', value: inventorySummary.inStock, color: '#477656' },
    { name: 'Low stock', value: inventorySummary.low, color: '#bd9144' },
    { name: 'Out of stock', value: inventorySummary.empty, color: '#a6675d' }
  ];
  const rangeLabel = range === 'today' ? 'Today' : range === 'week' ? 'This week' : range === 'month' ? 'This month' : `${from} to ${to}`;

  return (
    <>
      <PageHeader title="Business Analytics" subtitle="Performance and operational signals within your authorized outlets"
        actions={<div className="flex items-center gap-2"><CalendarRange size={16} className="text-brand-700" /><select aria-label="Analytics date range" className="input min-w-40" value={range} onChange={(event) => setRange(event.target.value)}><option value="today">Today</option><option value="week">This week</option><option value="month">This month</option><option value="custom">Custom range</option></select></div>} />

      <div className={`mb-5 rounded-xl border px-4 py-3 text-sm ${hasLiveData ? 'border-brand-100 bg-brand-50/60 text-brand-900' : 'border-amber-200 bg-amber-50 text-amber-900'}`}>
        {!ready ? 'Loading analytics data…' : hasLiveData ? 'Revenue, orders, outlets, and menu movement use authorized saved records. Attendance and inventory remain sample previews.' : 'The backend is unavailable. Revenue, order, outlet, and menu metrics use the built-in sample dataset; attendance and inventory are preview-only.'}
      </div>
      {range === 'custom' && <div className="mb-5 flex flex-wrap items-end gap-3 rounded-xl border border-slate-200 bg-white p-4">
        <label className="min-w-40 flex-1 text-xs font-medium text-slate-600">From<input aria-label="Custom range start" className="input mt-1" type="date" value={customFrom} onChange={(event) => setCustomFrom(event.target.value)} /></label>
        <label className="min-w-40 flex-1 text-xs font-medium text-slate-600">To<input aria-label="Custom range end" className="input mt-1" type="date" value={customTo} onChange={(event) => setCustomTo(event.target.value)} /></label>
        {invalidCustomRange && <p className="w-full text-xs text-red-600">Choose both dates and ensure the start date is on or before the end date.</p>}
      </div>}

      <div className="mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={BarChart3} tone="brand" label={`Revenue · ${rangeLabel}`} value={fmtINR(revenue)} hint={revenueChange === null ? `Compared with ${previousFrom}–${previousTo} · no baseline` : `Compared with prior period · ${Math.abs(revenueChange)}% ${revenueChange < 0 ? 'lower' : 'higher'}`} />
        <StatCard icon={ClipboardList} tone="sky" label="Orders in range" value={periodOrders.length} hint={`${cancelled} cancelled in this period`} />
        <StatCard icon={Activity} tone={revenueChange !== null && revenueChange < 0 ? 'amber' : 'emerald'} label="Revenue vs prior period" value={revenueChange === null ? '—' : `${revenueChange > 0 ? '+' : ''}${revenueChange}%`} hint={revenueChange === null ? 'Not enough prior-period data' : `${fmtINR(previousRevenue)} in the comparison period`} />
        <StatCard icon={Users} tone="violet" label="Attendance · preview" value={`${summarizeAttendance(selectedAttendance).rate}%`} hint={`${summarizeAttendance(selectedAttendance).total} staff in scope · not saved attendance`} />
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <section className="card p-5">
          <div className="mb-3"><h2 className="font-semibold">Revenue comparison</h2><p className="text-xs text-slate-500">{rangeLabel} against the previous {previousSpan} day{previousSpan === 1 ? '' : 's'} · cancelled orders excluded</p></div>
          {buckets.some((bucket) => bucket.revenue > 0) ? <div className="h-64"><ResponsiveContainer><AreaChart data={buckets} margin={{ left: -12, right: 8 }}><defs><linearGradient id="analyticsRevenue" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#3f7353" stopOpacity={0.25} /><stop offset="95%" stopColor="#3f7353" stopOpacity={0} /></linearGradient></defs><CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} /><XAxis dataKey="label" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} /><YAxis tickFormatter={fmtShort} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} /><Tooltip formatter={(value) => [fmtINR(value), 'Revenue']} contentStyle={chartTip} /><Area type="monotone" dataKey="revenue" name="Revenue" stroke="#2f6243" strokeWidth={2.5} fill="url(#analyticsRevenue)" /></AreaChart></ResponsiveContainer></div> : <EmptyState title="No revenue in this range" text="Try another date range or check whether orders are available." /> }
        </section>

        <section className="card p-5">
          <div className="mb-3"><h2 className="font-semibold">Order trends</h2><p className="text-xs text-slate-500">Order count from saved records, including cancelled orders</p></div>
          {buckets.some((bucket) => bucket.orders > 0) ? <div className="h-64"><ResponsiveContainer><BarChart data={buckets} margin={{ left: -12, right: 8 }}><CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} /><XAxis dataKey="label" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} /><YAxis allowDecimals={false} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} /><Tooltip formatter={(value) => [value, 'Orders']} contentStyle={chartTip} /><Bar dataKey="orders" name="Orders" fill="#6c8a75" radius={[5, 5, 0, 0]} maxBarSize={28} /></BarChart></ResponsiveContainer></div> : <EmptyState title="No orders in this range" text="Try another date range or check whether orders are available." /> }
        </section>

        <section className="card p-5">
          <div className="mb-3"><h2 className="font-semibold">Outlet performance</h2><p className="text-xs text-slate-500">Non-cancelled revenue · {rangeLabel}</p></div>
          {branchPerformance.length ? <div className="h-64"><ResponsiveContainer><BarChart data={branchPerformance} layout="vertical" margin={{ left: 8, right: 10 }}><CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} /><XAxis type="number" tickFormatter={fmtShort} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} /><YAxis type="category" dataKey="name" width={90} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} /><Tooltip formatter={(value, name, item) => name === 'Revenue' ? [fmtINR(value), name] : [value, name]} contentStyle={chartTip} cursor={{ fill: '#eff4ef' }} /><Bar dataKey="revenue" name="Revenue" fill="#3f7353" radius={[0, 5, 5, 0]} maxBarSize={22} /></BarChart></ResponsiveContainer></div> : <EmptyState title="No outlets in scope" />}</section>

        <section className="card p-5">
          <div className="mb-3"><h2 className="font-semibold">Menu movement</h2><p className="text-xs text-slate-500">Units on non-cancelled orders · {rangeLabel}</p></div>
          <div className="grid gap-5 sm:grid-cols-2">
            <div><h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Best-selling items</h3>{bestItems.length ? <ol className="space-y-2">{bestItems.map((item, index) => <li key={item.id} className="flex items-center justify-between gap-2 rounded-lg bg-brand-50/60 px-3 py-2 text-sm"><span className="truncate">{index + 1}. {item.name}</span><span className="font-semibold text-brand-800">{item.units}</span></li>)}</ol> : <p className="text-sm text-slate-500">No item sales in this range.</p>}</div>
            <div><h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Lowest units recorded</h3>{lowItems.length ? <ol className="space-y-2">{lowItems.map((item) => <li key={item.id} className="flex items-center justify-between gap-2 rounded-lg bg-slate-50 px-3 py-2 text-sm"><span className="truncate">{item.name}</span><span className="font-medium text-slate-600">{item.units}</span></li>)}</ol> : <p className="text-sm text-slate-500">No item sales in this range.</p>}</div>
          </div>
          <p className="mt-4 text-[11px] text-slate-400">Low movement is relative to this selected period; it does not indicate an item should be removed.</p>
        </section>
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-2">
        <section className="card p-5">
          <div className="mb-3 flex items-start justify-between gap-3"><div><h2 className="font-semibold">Attendance trend · sample preview</h2><p className="text-xs text-slate-500">Generated from sample statuses; no attendance history API is connected</p></div><Users size={17} className="text-brand-700" /></div>
          <div className="h-52"><ResponsiveContainer><LineChart data={attendanceTrend} margin={{ left: -12, right: 8, top: 8 }}><CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} /><XAxis dataKey="label" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} /><YAxis domain={[0, 100]} unit="%" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} /><Tooltip formatter={(value) => [`${value}%`, 'Attendance']} contentStyle={chartTip} /><Line type="monotone" dataKey="rate" name="Attendance" stroke="#3f7353" strokeWidth={2.5} dot={{ r: 3, fill: '#3f7353' }} /></LineChart></ResponsiveContainer></div>
          {attendanceByBranch.length > 1 && <div className="mt-3 grid gap-2 sm:grid-cols-2">{attendanceByBranch.map((branch) => <div key={branch.name} className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 text-xs"><span>{branch.name}</span><span className="font-semibold">{branch.rate}%</span></div>)}</div>}
        </section>

        <section className="card p-5">
          <div className="mb-3 flex items-start justify-between gap-3"><div><h2 className="font-semibold">Inventory status · current preview</h2><p className="text-xs text-slate-500">Current sample levels only; no inventory history API is connected</p></div><PackageSearch size={17} className="text-brand-700" /></div>
          {inventory.length ? <div className="h-52"><ResponsiveContainer><BarChart data={inventoryChart} margin={{ left: -12, right: 8 }}><CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} /><XAxis dataKey="name" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} /><YAxis allowDecimals={false} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} /><Tooltip formatter={(value) => [value, 'Items']} contentStyle={chartTip} /><Bar dataKey="value" name="Items" radius={[5, 5, 0, 0]} maxBarSize={36}>{inventoryChart.map((entry) => <Cell key={entry.name} fill={entry.color} />)}</Bar></BarChart></ResponsiveContainer></div> : <EmptyState title="No inventory preview for your outlets" />}
          <div className="mt-2 flex flex-wrap gap-3 text-xs text-slate-500"><span>In stock: {inventorySummary.inStock}</span><span>Low: {inventorySummary.low}</span><span>Out: {inventorySummary.empty}</span></div>
        </section>
      </div>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-brand-100 bg-brand-50/50 px-4 py-3 text-xs text-brand-900">
        <span className="flex items-center gap-2"><Activity size={15} />{branchPerformance[0] ? `${branchPerformance[0].name} leads recorded revenue in this range.` : 'No outlet comparison is available for this range.'} Inventory flags {inventorySummary.low + inventorySummary.empty} items for review.</span>
        <span className="flex items-center gap-1">{revenueChange !== null && revenueChange < 0 ? <ArrowDownRight size={14} /> : <ArrowUpRight size={14} />}{revenueChange === null ? 'Prior comparison unavailable' : `Revenue ${revenueChange < 0 ? 'down' : 'up'} ${Math.abs(revenueChange)}% vs prior range`}</span>
      </div>
    </>
  );
}

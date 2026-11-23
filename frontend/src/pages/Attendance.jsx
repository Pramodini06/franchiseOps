import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { CalendarDays, ChevronLeft, ChevronRight, Clock3, ClipboardList, Search, UserCheck, UserRoundX, Users } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { useToast } from '../context/ToastContext';
import { useOperationsPreview } from '../context/OperationsPreviewContext';
import { useScope } from '../hooks';
import { attendanceForDate, buildStaffRoster } from '../data/operations';
import StatusBadge from '../components/ui/StatusBadge';
import StatCard from '../components/ui/StatCard';
import Modal from '../components/ui/Modal';
import { EmptyState, Field, PageHeader } from '../components/ui/misc';

const STATUSES = ['Present', 'Absent', 'Late', 'Half-day', 'On leave'];
const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const localDate = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
const shortDate = (value) => new Date(`${value}T00:00:00`).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });

function summarize(records) {
  const total = records.length;
  const count = (status) => records.filter((record) => record.status === status).length;
  const attended = count('Present') + count('Late') + count('Half-day') * 0.5;
  const denominator = total - count('On leave');
  return {
    total,
    present: count('Present'),
    absent: count('Absent'),
    late: count('Late'),
    leave: count('On leave'),
    halfDay: count('Half-day'),
    percentage: denominator ? Math.round((attended / denominator) * 100) : 0
  };
}

function getWeek(date) {
  const start = new Date(`${date}T00:00:00`);
  start.setDate(start.getDate() - (start.getDay() + 6) % 7);
  return Array.from({ length: 7 }, (_, index) => {
    const day = new Date(start);
    day.setDate(start.getDate() + index);
    return localDate(day);
  });
}

export default function Attendance() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { user, roleKey, role } = useAuth();
  const { users, branches } = useData();
  const { scopeBranches, ids } = useScope();
  const { shifts, staffProfiles, employeeUpdates, previewEmployees, hiddenEmployeeIds, attendanceOverrides, setAttendanceOverrides } = useOperationsPreview();
  const toast = useToast();
  const [selectedDate, setSelectedDate] = useState(localDate(new Date()));
  const [view, setView] = useState('daily');
  const [query, setQuery] = useState('');
  const [branchFilter, setBranchFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [editing, setEditing] = useState(null);
  const [reportOpen, setReportOpen] = useState(false);
  const handledMarkParam = useRef(false);

  const roster = useMemo(() => [
    ...buildStaffRoster(users, branches).map((employee) => ({ ...employee, ...staffProfiles[employee.id], ...employeeUpdates[employee.id] })),
    ...previewEmployees
  ].filter((employee) => ids.includes(employee.branchId) && !hiddenEmployeeIds.includes(employee.id))
    .filter((employee) => roleKey !== 'staff' || employee.email === user.email), [users, branches, ids, roleKey, user.email, staffProfiles, employeeUpdates, previewEmployees, hiddenEmployeeIds]);

  const recordsFor = (date) => {
    const branchRoster = roster.filter((employee) => (branchFilter === 'All' || employee.branchId === branchFilter)
      && `${employee.name} ${employee.employeeId}`.toLowerCase().includes(query.toLowerCase()));
    const overrides = {};
    branchRoster.forEach((employee) => { overrides[employee.id] = attendanceOverrides[`${date}:${employee.id}`]?.status; });
    return attendanceForDate(branchRoster, date, overrides, shifts);
  };
  const records = recordsFor(selectedDate);
  const summary = summarize(records);
  const visibleRecords = records.filter((record) => (
    (branchFilter === 'All' || record.branchId === branchFilter)
    && (statusFilter === 'All' || record.status === statusFilter)
    && `${record.name} ${record.employeeId}`.toLowerCase().includes(query.toLowerCase())
  ));
  const week = getWeek(selectedDate).map((date) => ({ date, ...summarize(recordsFor(date)) }));
  const monthStart = new Date(`${selectedDate.slice(0, 7)}-01T00:00:00`);
  const monthLength = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 0).getDate();
  const monthOffset = (monthStart.getDay() + 6) % 7;
  const monthCells = [
    ...Array.from({ length: monthOffset }, (_, index) => ({ id: `blank-${index}` })),
    ...Array.from({ length: monthLength }, (_, index) => {
      const date = new Date(monthStart.getFullYear(), monthStart.getMonth(), index + 1);
      const value = localDate(date);
      return { id: value, date: value, ...summarize(recordsFor(value)) };
    })
  ];

  const saveStatus = () => {
    if (!editing) return;
    setAttendanceOverrides((current) => ({ ...current, [`${selectedDate}:${editing.id}`]: { status: editing.status } }));
    toast.info('Attendance updated in this preview; it is not saved to the server.');
    setEditing(null);
  };
  const changeDate = (offset) => {
    const date = new Date(`${selectedDate}T00:00:00`);
    date.setDate(date.getDate() + offset);
    setSelectedDate(localDate(date));
  };
  const reportRows = view === 'weekly' ? week : monthCells.filter((cell) => cell.date);
  const reportSummary = summarize(reportRows.flatMap((row) => recordsFor(row.date)));
  const canEdit = role.canManageAttendance;
  const isSelectedDayToday = selectedDate === localDate(new Date());

  useEffect(() => {
    if (searchParams.get('mark') !== '1') {
      handledMarkParam.current = false;
      return;
    }
    if (!canEdit || !records.length || handledMarkParam.current) return;
    handledMarkParam.current = true;
    setEditing({ ...records[0] });
    const next = new URLSearchParams(searchParams);
    next.delete('mark');
    setSearchParams(next, { replace: true });
  }, [searchParams, setSearchParams, canEdit, records]);

  return (
    <>
      <PageHeader title={roleKey === 'staff' ? 'My Attendance' : 'Attendance'} subtitle={roleKey === 'staff' ? 'Your attendance preview for the assigned branch' : 'Monitor daily attendance and workforce coverage'}
        actions={<button className="btn-ghost" onClick={() => setReportOpen(true)}><ClipboardList size={15} /> Attendance report</button>} />

      <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-brand-100 bg-brand-50/70 px-4 py-3">
        <p className="text-sm text-brand-900">Sample attendance preview. Updates are temporary and are not saved to the backend.</p>
        <div className="flex items-center gap-2">
          <button className="icon-btn" aria-label="Previous date" onClick={() => changeDate(view === 'monthly' ? -30 : view === 'weekly' ? -7 : -1)}><ChevronLeft size={17} /></button>
          <input aria-label="Attendance date" className="input w-40 bg-white" type="date" value={selectedDate} onChange={(event) => setSelectedDate(event.target.value)} />
          <button className="icon-btn" aria-label="Next date" onClick={() => changeDate(view === 'monthly' ? 30 : view === 'weekly' ? 7 : 1)}><ChevronRight size={17} /></button>
        </div>
      </div>

      <div className="mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard icon={Users} label="Total staff" value={summary.total} tone="brand" />
        <StatCard icon={UserCheck} label={isSelectedDayToday ? 'Present today' : 'Present · selected day'} value={summary.present} tone="emerald" />
        <StatCard icon={UserRoundX} label={isSelectedDayToday ? 'Absent today' : 'Absent · selected day'} value={summary.absent} tone="amber" />
        <StatCard icon={Clock3} label="Late arrivals" value={summary.late} tone="sky" />
        <div className="card p-5"><p className="text-sm text-slate-500">On leave</p><p className="mt-2 text-2xl font-semibold text-slate-900">{summary.leave}</p><p className="mt-1 text-xs text-slate-500">Attendance rate <span className="font-semibold text-brand-800">{summary.percentage}%</span></p><div className="mt-3 h-1.5 rounded-full bg-slate-100"><div className="h-full rounded-full bg-brand-600" style={{ width: `${summary.percentage}%` }} /></div></div>
      </div>

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex rounded-xl border border-slate-200 bg-white p-1">{[['daily', 'Daily'], ['weekly', 'Weekly'], ['monthly', 'Monthly']].map(([key, label]) => <button key={key} onClick={() => setView(key)} className={`rounded-lg px-3 py-2 text-sm font-medium ${view === key ? 'bg-brand-700 text-white' : 'text-slate-600 hover:bg-slate-50'}`}>{label}</button>)}</div>
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
          <div className="relative"><Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /><input className="input pl-9 sm:w-56" placeholder="Search employee or ID" value={query} onChange={(event) => setQuery(event.target.value)} /></div>
          {roleKey !== 'staff' && <select aria-label="Filter by branch" className="input sm:w-48" value={branchFilter} onChange={(event) => setBranchFilter(event.target.value)}><option value="All">All branches</option>{scopeBranches.map((branch) => <option key={branch.id} value={branch.id}>{branch.name}</option>)}</select>}
          {view === 'daily' && <select className="input sm:w-40" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}><option value="All">All statuses</option>{STATUSES.map((status) => <option key={status}>{status}</option>)}</select>}
        </div>
      </div>

      {view === 'daily' && (
        <div className="card overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 px-5 py-4"><div><h2 className="font-semibold">Daily attendance</h2><p className="mt-0.5 text-xs text-slate-500">{new Date(`${selectedDate}T00:00:00`).toLocaleDateString('en-IN', { dateStyle: 'full' })} · {summary.percentage}% attendance</p></div><CalendarDays size={18} className="text-brand-700" /></div>
          {visibleRecords.length ? <div className="overflow-x-auto"><table className="w-full min-w-[1050px]"><thead><tr><th className="th">Employee</th><th className="th">Employee ID</th><th className="th">Branch</th><th className="th">Shift</th><th className="th">Scheduled</th><th className="th">Check-in</th><th className="th">Check-out</th><th className="th">Hours</th><th className="th">Status</th>{canEdit && <th className="th">Action</th>}</tr></thead>
            <tbody className="divide-y divide-slate-100">{visibleRecords.map((record) => <tr key={record.id} className="hover:bg-slate-50/70">
              <td className="td"><div className="flex items-center gap-2.5"><span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-50 text-[11px] font-semibold text-brand-800">{record.name.split(' ').map((part) => part[0]).join('').slice(0, 2)}</span><span className="font-medium">{record.name}</span></div></td>
              <td className="td font-mono text-xs">{record.employeeId}</td><td className="td text-slate-600">{record.branchName}</td><td className="td">{record.shiftName}</td><td className="td text-xs">{record.scheduledStart}</td>
              <td className="td">{record.status === 'Late' ? <span className="font-semibold text-amber-700">{record.checkIn} · Late</span> : record.checkIn}</td><td className="td">{record.checkOut}</td><td className="td">{record.workingHours}</td><td className="td"><StatusBadge status={record.status} /></td>
              {canEdit && <td className="td"><button className="btn-ghost px-2.5 py-1.5 text-xs" onClick={() => setEditing({ ...record })}>Update</button></td>}
            </tr>)}</tbody></table></div> : <EmptyState title="No attendance records" text="Try changing your search or filters." />}
        </div>
      )}

      {view === 'weekly' && (
        <div className="card overflow-hidden">
          <div className="border-b border-slate-100 px-5 py-4"><h2 className="font-semibold">Weekly attendance</h2><p className="mt-0.5 text-xs text-slate-500">Week of {shortDate(week[0].date)}</p></div>
          <div className="overflow-x-auto"><table className="w-full min-w-[780px]"><thead><tr><th className="th">Day</th><th className="th">Present</th><th className="th">Late</th><th className="th">Half-day</th><th className="th">Absent</th><th className="th">On leave</th><th className="th">Attendance</th></tr></thead><tbody className="divide-y divide-slate-100">{week.map((day) => <tr key={day.date} className={day.date === selectedDate ? 'bg-brand-50/50' : ''}><td className="td font-medium">{new Date(`${day.date}T00:00:00`).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short' })}</td><td className="td">{day.present}</td><td className="td">{day.late}</td><td className="td">{day.halfDay}</td><td className="td">{day.absent}</td><td className="td">{day.leave}</td><td className="td"><div className="flex items-center gap-2"><div className="h-1.5 w-20 rounded-full bg-slate-100"><div className="h-full rounded-full bg-brand-600" style={{ width: `${day.percentage}%` }} /></div><span className="text-xs font-medium">{day.percentage}%</span></div></td></tr>)}</tbody></table></div>
        </div>
      )}

      {view === 'monthly' && (
        <div className="card p-4 sm:p-5">
          <div className="mb-4 flex items-center justify-between"><div><h2 className="font-semibold">Attendance calendar</h2><p className="mt-0.5 text-xs text-slate-500">{monthStart.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })} · select a date to view daily records</p></div><CalendarDays size={18} className="text-brand-700" /></div>
          <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
            {WEEKDAYS.map((day) => <div key={day} className="py-2 text-center text-xs font-semibold text-slate-500">{day}</div>)}
            {monthCells.map((cell) => cell.date ? <button key={cell.id} onClick={() => { setSelectedDate(cell.date); setView('daily'); }} className={`min-h-20 rounded-lg border p-2 text-left transition hover:border-brand-300 sm:min-h-24 ${cell.date === selectedDate ? 'border-brand-500 bg-brand-50' : 'border-slate-100 bg-white'}`}>
              <span className="text-xs font-semibold">{Number(cell.date.slice(-2))}</span><span className="mt-1 block text-[9px] text-slate-500 sm:text-[10px]">{cell.present} P · {cell.late} L · {cell.absent} A</span><span className="mt-1 block"><StatusBadge status={cell.absent ? 'Absent' : cell.late ? 'Late' : cell.leave ? 'On leave' : cell.halfDay ? 'Half-day' : 'Present'} /></span>
            </button> : <div key={cell.id} />)}
          </div>
        </div>
      )}

      <Modal open={!!editing} onClose={() => setEditing(null)} size="sm" title={`Update ${editing?.name || 'attendance'}`} subtitle={`${editing?.employeeId || ''} · ${shortDate(selectedDate)} · preview only`}
        footer={<><button className="btn-ghost" onClick={() => setEditing(null)}>Cancel</button><button className="btn-primary" onClick={saveStatus}>Save preview</button></>}>
        {editing && <div className="space-y-4"><Field label="Attendance status"><select className="input" value={editing.status} onChange={(event) => setEditing({ ...editing, status: event.target.value })}>{STATUSES.map((status) => <option key={status}>{status}</option>)}</select></Field><p className="text-xs text-slate-500">The sample record is updated for this view only. It will reset when the page is refreshed.</p></div>}
      </Modal>

      <Modal open={reportOpen} onClose={() => setReportOpen(false)} size="md" title="Attendance report" subtitle={`${view[0].toUpperCase()}${view.slice(1)} view · preview data`}>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {[['Staff records', reportSummary.total], ['Present', reportSummary.present], ['Late', reportSummary.late], ['Half-day', reportSummary.halfDay], ['Absent', reportSummary.absent], ['On leave', reportSummary.leave], ['Attendance rate', `${reportSummary.percentage}%`]].map(([label, value]) => <div key={label} className="rounded-xl bg-slate-50 p-4"><p className="text-xs text-slate-500">{label}</p><p className="mt-1 text-lg font-semibold text-slate-900">{value}</p></div>)}
        </div>
        <p className="mt-4 text-xs text-slate-500">Report values are computed from the current sample preview and are not an exported or stored attendance record.</p>
      </Modal>
    </>
  );
}

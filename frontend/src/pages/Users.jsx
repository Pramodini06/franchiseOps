import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ArrowLeftRight, Building2, CalendarClock, Clock3, Eye, Pencil, Plus, Search, Trash2, UserCheck, Users as UsersIcon } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { useToast } from '../context/ToastContext';
import { useOperationsPreview } from '../context/OperationsPreviewContext';
import { usePagination, useScope } from '../hooks';
import { USER_ROLES } from '../data/users';
import { buildStaffRoster } from '../data/operations';
import UserFormModal from '../components/users/UserFormModal';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import Modal from '../components/ui/Modal';
import Pagination from '../components/ui/Pagination';
import StatusBadge from '../components/ui/StatusBadge';
import StatCard from '../components/ui/StatCard';
import { EmptyState, Field, PageHeader } from '../components/ui/misc';

const INITIAL_SHIFT = { id: '', name: '', start: '09:00', end: '17:00' };

function initials(name) {
  return name.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase();
}

export default function Users() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { user, role, roleKey } = useAuth();
  const { users, branches, addUser, updateUser, deleteUser } = useData();
  const { shifts: shiftOptions, setShifts: setShiftOptions, staffProfiles: profileFields, setStaffProfiles: setProfileFields, employeeUpdates: localUpdates, setEmployeeUpdates: setLocalUpdates, previewEmployees: localAdded, setPreviewEmployees: setLocalAdded, hiddenEmployeeIds: localRemoved, setHiddenEmployeeIds: setLocalRemoved } = useOperationsPreview();
  const { scopeBranches, ids } = useScope();
  const toast = useToast();
  const [tab, setTab] = useState('team');
  const [query, setQuery] = useState('');
  const [branchFilter, setBranchFilter] = useState('All');
  const [designationFilter, setDesignationFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [accountRole, setAccountRole] = useState('All');
  const [form, setForm] = useState({ open: false, employee: null });
  const [profile, setProfile] = useState(null);
  const [removeTarget, setRemoveTarget] = useState(null);
  const [shiftForm, setShiftForm] = useState(null);

  const canEditStaff = role.canManageStaff;
  const previewOnly = !role.canManageUsers;

  useEffect(() => {
    if (searchParams.get('new') !== '1' || !canEditStaff) return;
    setTab('team');
    setForm({ open: true, employee: null });
    setSearchParams((current) => {
      const next = new URLSearchParams(current);
      next.delete('new');
      return next;
    }, { replace: true });
  }, [searchParams, setSearchParams, canEditStaff]);
  const roster = useMemo(() => {
    const base = buildStaffRoster(users, branches)
      .filter((employee) => ids.includes(employee.branchId))
      .filter((employee) => roleKey !== 'branch_manager' || employee.role === 'Staff')
      .map((employee) => ({ ...employee, ...profileFields[employee.id], ...localUpdates[employee.id] }));
    return [...base, ...localAdded].filter((employee) => !localRemoved.includes(employee.id));
  }, [users, branches, ids, roleKey, profileFields, localUpdates, localAdded, localRemoved]);

  const designations = [...new Set(roster.map((employee) => employee.designation))];
  const filteredRoster = roster.filter((employee) => (
    (branchFilter === 'All' || employee.branchId === branchFilter)
    && (designationFilter === 'All' || employee.designation === designationFilter)
    && (statusFilter === 'All' || employee.status === statusFilter)
    && `${employee.name} ${employee.employeeId} ${employee.email} ${employee.phone}`.toLowerCase().includes(query.toLowerCase())
  ));
  const page = usePagination(filteredRoster, 8);
  const activeCount = roster.filter((employee) => employee.status === 'Active').length;
  const leaveCount = roster.filter((employee) => employee.status === 'On leave').length;
  const branchCount = new Set(roster.map((employee) => employee.branchId)).size;

  const accountRows = users.filter((account) => (
    (accountRole === 'All' || account.role === accountRole)
    && (branchFilter === 'All' || account.branchId === branchFilter || account.branchId === 'all')
    && `${account.name} ${account.email}`.toLowerCase().includes(query.toLowerCase())
  ));
  const accountPage = usePagination(accountRows, 8);

  const saveEmployee = async (data) => {
    try {
      if (previewOnly) {
        const id = form.employee?.id || `preview-${Date.now()}`;
        const employee = { ...form.employee, ...data, id, employeeId: form.employee?.employeeId || `FO-P${String(localAdded.length + 1).padStart(3, '0')}`, branchName: scopeBranches.find((branch) => branch.id === data.branchId)?.name || 'Assigned branch' };
        if (form.employee) setLocalUpdates((current) => ({ ...current, [id]: { ...current[id], ...data } }));
        else setLocalAdded((current) => [employee, ...current]);
        toast.info('Preview updated for this session; it is not saved to the server.');
      } else {
        const saved = form.employee ? await updateUser(form.employee.id, data) : await addUser(data);
        setProfileFields((current) => ({ ...current, [saved.id]: { designation: data.designation, shift: data.shift } }));
        toast.success(`${data.name} ${form.employee ? 'updated' : 'added'}.`);
      }
      setForm({ open: false, employee: null });
    } catch (error) {
      toast.error(error.message || 'Could not save employee.');
    }
  };

  const saveShift = () => {
    if (!shiftForm?.name.trim() || !shiftForm.start || !shiftForm.end || shiftForm.start === shiftForm.end) {
      toast.error('Enter a shift name and valid start and end times.');
      return;
    }
    setShiftOptions((current) => shiftForm.id
      ? current.map((shift) => shift.id === shiftForm.id ? shiftForm : shift)
      : [...current, { ...shiftForm, id: `custom-${Date.now()}` }]);
    toast.info('Shift updated in this preview; it is not saved to the server.');
    setShiftForm(null);
  };

  const confirmRemove = async () => {
    try {
      if (previewOnly) {
        setLocalRemoved((current) => [...current, removeTarget.id]);
        toast.info('Employee removed from this preview only.');
      } else {
        await deleteUser(removeTarget.id);
        toast.success(`${removeTarget.name} removed.`);
      }
    } catch (error) {
      toast.error(error.message || 'Could not remove employee.');
    } finally {
      setRemoveTarget(null);
    }
  };

  const openEmployeeForm = (employee = null) => setForm({ open: true, employee });
  const shiftName = (id) => shiftOptions.find((shift) => shift.id === id)?.name || 'Unassigned';
  const branchName = (id) => (id === 'all' ? 'All branches' : branches.find((branch) => branch.id === id)?.name || '—');

  return (
    <>
      <PageHeader title="Staff Management" subtitle="Employee roster, branch assignments and shift planning"
        actions={tab === 'shifts' && canEditStaff
          ? <button className="btn-primary" onClick={() => setShiftForm({ ...INITIAL_SHIFT })}><Plus size={16} /> Add custom shift</button>
          : tab === 'team' && canEditStaff
            ? <button className="btn-primary" onClick={() => openEmployeeForm()}><Plus size={16} /> Add employee</button>
            : tab === 'accounts' && role.canManageUsers
              ? <button className="btn-primary" onClick={() => setForm({ open: true, employee: null })}><Plus size={16} /> Add user</button>
              : null} />

      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex rounded-xl border border-slate-200 bg-white p-1">
          {[['team', 'Team roster', UsersIcon], ['shifts', 'Shifts', CalendarClock], ...(role.canManageUsers ? [['accounts', 'User accounts', ArrowLeftRight]] : [])].map(([key, label, Icon]) => (
            <button key={key} onClick={() => setTab(key)} className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition ${tab === key ? 'bg-brand-700 text-white' : 'text-slate-600 hover:bg-slate-50'}`}><Icon size={15} />{label}</button>
          ))}
        </div>
        {previewOnly && <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-800">Branch preview · edits are not saved</span>}
      </div>

      {tab === 'team' && (
        <>
          {!previewOnly && <div className="mb-4 rounded-xl border border-slate-200 bg-white px-4 py-3 text-xs text-slate-600">Employee account fields sync through the existing API. Designation and shift assignments are shared in this session preview only.</div>}
          <div className="mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard icon={UsersIcon} label="Total employees" value={roster.length} tone="brand" />
            <StatCard icon={UserCheck} label="Active staff" value={activeCount} tone="emerald" />
            <StatCard icon={Clock3} label="On leave" value={leaveCount} tone="amber" />
            <StatCard icon={Building2} label="Branches covered" value={branchCount} tone="sky" />
          </div>

          <div className="card">
            <div className="grid gap-3 border-b border-slate-100 p-4 md:grid-cols-2 xl:grid-cols-4">
              <div className="relative"><Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /><input className="input pl-9" placeholder="Search name, ID, email or phone" value={query} onChange={(event) => setQuery(event.target.value)} /></div>
              <select className="input" value={branchFilter} onChange={(event) => setBranchFilter(event.target.value)}><option value="All">All branches</option>{scopeBranches.map((branch) => <option key={branch.id} value={branch.id}>{branch.name}</option>)}</select>
              <select className="input" value={designationFilter} onChange={(event) => setDesignationFilter(event.target.value)}><option value="All">All designations</option>{designations.map((designation) => <option key={designation}>{designation}</option>)}</select>
              <select className="input" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}><option value="All">All employment statuses</option><option>Active</option><option>On leave</option><option>Inactive</option></select>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1080px]">
                <thead><tr><th className="th">Employee</th><th className="th">Employee ID</th><th className="th">Designation</th><th className="th">Branch</th><th className="th">Shift</th><th className="th">Contact</th><th className="th">Status</th><th className="th">Actions</th></tr></thead>
                <tbody className="divide-y divide-slate-100">
                  {page.slice.map((employee) => (
                    <tr key={employee.id} className="transition hover:bg-slate-50/70">
                      <td className="td"><div className="flex items-center gap-3"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-50 text-xs font-semibold text-brand-800">{initials(employee.name)}</span><div><p className="font-semibold text-slate-900">{employee.name}</p><p className="text-xs text-slate-500">{employee.email}</p></div></div></td>
                      <td className="td font-mono text-xs text-slate-600">{employee.employeeId}</td>
                      <td className="td">{employee.designation}</td>
                      <td className="td text-slate-600">{employee.branchName || branchName(employee.branchId)}</td>
                      <td className="td"><span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">{shiftName(employee.shift)}</span></td>
                      <td className="td"><a className="text-sm text-brand-800 hover:underline" href={`tel:${employee.phone}`}>{employee.phone}</a></td>
                      <td className="td"><StatusBadge status={employee.status} /></td>
                      <td className="td"><div className="flex items-center gap-1"><button className="icon-btn" title="View employee profile" onClick={() => setProfile(employee)}><Eye size={16} /></button>{canEditStaff && <><button className="icon-btn" title="Edit employee" onClick={() => openEmployeeForm(employee)}><Pencil size={15} /></button><button className="icon-btn hover:!bg-red-50 hover:!text-red-600" title="Remove employee" onClick={() => setRemoveTarget(employee)}><Trash2 size={15} /></button></>}</div></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {!page.total && <EmptyState title="No employees found" text="Try changing your search or filters." />}
            <Pagination {...page} onChange={page.setPage} />
          </div>
        </>
      )}

      {tab === 'shifts' && (
        <div className="space-y-4">
          <div className="rounded-xl border border-brand-100 bg-brand-50/70 px-4 py-3 text-sm text-brand-900">Shift schedules are a frontend preview until a scheduling API is connected.</div>
          <div className="grid gap-4 xl:grid-cols-3">
            {shiftOptions.map((shift) => {
              const assigned = roster.filter((employee) => employee.shift === shift.id);
              const assignedBranches = [...new Set(assigned.map((employee) => employee.branchName || branchName(employee.branchId)))];
              return (
                <div key={shift.id} className="card p-5">
                  <div className="flex items-start justify-between"><div><p className="text-sm font-semibold text-slate-500">{shift.name} shift</p><p className="mt-1 text-xl font-semibold text-slate-900">{shift.start} <span className="text-slate-400">→</span> {shift.end}</p></div>{canEditStaff && <button className="icon-btn" title="Edit shift timing" onClick={() => setShiftForm(shift)}><Pencil size={15} /></button>}</div>
                  <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-4"><span className="text-sm text-slate-500">Assigned staff</span><span className="rounded-full bg-brand-50 px-2.5 py-1 text-xs font-semibold text-brand-800">{assigned.length}</span></div>
                  <p className="mt-2 text-xs text-slate-500">{assignedBranches.length ? assignedBranches.join(', ') : 'No branch assigned'}</p>
                  <div className="mt-3 flex flex-wrap gap-1.5">{assigned.slice(0, 5).map((employee) => <span key={employee.id} className="rounded-md bg-slate-50 px-2 py-1 text-xs text-slate-700">{employee.name}</span>)}</div>
                </div>
              );
            })}
          </div>
          <p className="text-xs text-slate-500">Assign an employee to a shift from their profile. Custom shift changes are kept only for this preview session.</p>
        </div>
      )}

      {tab === 'accounts' && role.canManageUsers && (
        <div className="card">
          <div className="grid gap-3 border-b border-slate-100 p-4 md:grid-cols-3">
            <div className="relative"><Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /><input className="input pl-9" placeholder="Search user accounts" value={query} onChange={(event) => setQuery(event.target.value)} /></div>
            <select className="input" value={branchFilter} onChange={(event) => setBranchFilter(event.target.value)}><option value="All">All branches</option>{scopeBranches.map((branch) => <option key={branch.id} value={branch.id}>{branch.name}</option>)}</select>
            <select className="input" value={accountRole} onChange={(event) => setAccountRole(event.target.value)}><option value="All">All roles</option>{USER_ROLES.map((name) => <option key={name}>{name}</option>)}</select>
          </div>
          <div className="overflow-x-auto"><table className="w-full min-w-[760px]"><thead><tr><th className="th">Account</th><th className="th">Role</th><th className="th">Branch</th><th className="th">Last login</th><th className="th">Status</th><th className="th">Actions</th></tr></thead>
            <tbody className="divide-y divide-slate-100">{accountPage.slice.map((account) => <tr key={account.id} className="hover:bg-slate-50/70"><td className="td"><p className="font-semibold">{account.name}</p><p className="text-xs text-slate-500">{account.email}</p></td><td className="td">{account.role}</td><td className="td">{branchName(account.branchId)}</td><td className="td text-xs text-slate-500">{account.lastLogin}</td><td className="td"><StatusBadge status={account.status} /></td><td className="td"><div className="flex"><button className="icon-btn" title="Edit account" onClick={() => setForm({ open: true, employee: account })}><Pencil size={15} /></button><button className="icon-btn hover:!bg-red-50 hover:!text-red-600" title="Delete account" onClick={() => setRemoveTarget(account)}><Trash2 size={15} /></button></div></td></tr>)}</tbody>
          </table></div>
          {!accountPage.total && <EmptyState title="No accounts found" />}
          <Pagination {...accountPage} onChange={accountPage.setPage} />
        </div>
      )}

      <UserFormModal open={form.open} user={form.employee} onClose={() => setForm({ open: false, employee: null })} onSave={saveEmployee}
        allowedRoles={tab === 'team' ? ['Branch Manager', 'Staff'] : USER_ROLES}
        fixedBranchId={roleKey === 'branch_manager' ? user.branchId : undefined} shiftOptions={shiftOptions}
        entityLabel={tab === 'accounts' ? 'user account' : 'employee'} previewOnly={previewOnly} />

      <Modal open={!!profile} onClose={() => setProfile(null)} size="sm" title={profile?.name || 'Employee profile'} subtitle={profile?.designation}>
        {profile && <div className="space-y-5">
          <div className="flex items-center gap-3 rounded-xl bg-slate-50 p-4"><span className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-100 font-semibold text-brand-800">{initials(profile.name)}</span><div><p className="font-semibold">{profile.name}</p><p className="text-sm text-slate-500">{profile.employeeId}</p></div></div>
          <dl className="grid grid-cols-2 gap-4 text-sm">
            <div><dt className="text-xs text-slate-500">Branch</dt><dd className="mt-1 font-medium">{profile.branchName || branchName(profile.branchId)}</dd></div>
            <div><dt className="text-xs text-slate-500">Shift</dt><dd className="mt-1 font-medium">{shiftName(profile.shift)}</dd></div>
            <div><dt className="text-xs text-slate-500">Phone</dt><dd className="mt-1 font-medium">{profile.phone || '—'}</dd></div>
            <div><dt className="text-xs text-slate-500">Employment</dt><dd className="mt-1"><StatusBadge status={profile.status} /></dd></div>
            <div className="col-span-2"><dt className="text-xs text-slate-500">Email</dt><dd className="mt-1 font-medium">{profile.email}</dd></div>
          </dl>
          {canEditStaff && <button className="btn-primary w-full" onClick={() => { setProfile(null); openEmployeeForm(profile); }}><Pencil size={15} /> Edit employee</button>}
        </div>}
      </Modal>

      <Modal open={!!shiftForm} onClose={() => setShiftForm(null)} size="sm" title={shiftForm?.id ? 'Edit shift' : 'Add custom shift'} subtitle="Preview only — shift timing is not synced to the server"
        footer={<><button className="btn-ghost" onClick={() => setShiftForm(null)}>Cancel</button><button className="btn-primary" onClick={saveShift}>Save shift</button></>}>
        {shiftForm && <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Shift name"><input className="input" value={shiftForm.name} onChange={(event) => setShiftForm({ ...shiftForm, name: event.target.value })} placeholder="e.g. Weekend" /></Field>
          <div />
          <Field label="Start time"><input className="input" type="time" value={shiftForm.start} onChange={(event) => setShiftForm({ ...shiftForm, start: event.target.value })} /></Field>
          <Field label="End time"><input className="input" type="time" value={shiftForm.end} onChange={(event) => setShiftForm({ ...shiftForm, end: event.target.value })} /></Field>
        </div>}
      </Modal>

      <ConfirmDialog open={!!removeTarget} title={tab === 'accounts' ? 'Delete account?' : 'Remove employee?'}
        message={`${removeTarget?.name} ${tab === 'accounts' ? 'will lose FoodOps access' : 'will be removed from this roster preview'}.`}
        onCancel={() => setRemoveTarget(null)} onConfirm={confirmRemove} />
    </>
  );
}

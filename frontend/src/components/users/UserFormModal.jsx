import { useEffect, useState } from 'react';
import Modal from '../ui/Modal';
import { Field, Spinner } from '../ui/misc';
import { USER_ROLES } from '../../data/users';
import { useData } from '../../context/DataContext';
import { SHIFTS } from '../../data/operations';

const EMPTY = { name: '', email: '', phone: '', role: 'Staff', branchId: '', status: 'Active', designation: 'Service Associate', shift: 'morning' };

export default function UserFormModal({ open, user, onClose, onSave, allowedRoles = USER_ROLES, fixedBranchId, shiftOptions = SHIFTS, entityLabel = 'employee', previewOnly = false }) {
  const { branches, users } = useData();
  const [f, setF] = useState(EMPTY);
  const [er, setEr] = useState({});
  const [saving, setSaving] = useState(false);
  useEffect(() => { if (open) { setF(user ? { ...EMPTY, ...user, branchId: fixedBranchId || user.branchId, designation: user.designation || user.role, shift: user.shift || shiftOptions[0]?.id || 'morning' } : { ...EMPTY, branchId: fixedBranchId || branches[0]?.id || '', shift: shiftOptions[0]?.id || 'morning' }); setEr({}); setSaving(false); } }, [open, user, fixedBranchId, branches, shiftOptions]);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const global = f.role === 'Super Admin' || f.role === 'Franchise Owner';

  const submit = async () => {
    const e = {};
    if (!f.name.trim()) e.name = 'Full name is required';
    if (!/^\S+@\S+\.\S+$/.test(f.email)) e.email = 'Enter a valid email';
    else if (users.some((u) => u.email.toLowerCase() === f.email.toLowerCase() && u.id !== user?.id)) e.email = 'Email already exists';
    if (!/^\d{10}$/.test(f.phone)) e.phone = 'Enter a 10-digit phone number';
    setEr(e);
    if (Object.keys(e).length) return;
    setSaving(true);
    await onSave({ ...f, branchId: fixedBranchId || (global ? 'all' : f.branchId) });
    setSaving(false);
  };
  return (
    <Modal open={open} onClose={onClose} size="md" title={`${user ? 'Edit' : 'Add'} ${entityLabel}`} subtitle={previewOnly ? 'Branch staff changes are temporary and are not saved to the server.' : 'Account details use the existing API; designation and shifts are preview-only.'}
      footer={<><button className="btn-ghost" onClick={onClose}>Cancel</button><button className="btn-primary" disabled={saving} onClick={submit}>{saving && <Spinner />}{user ? 'Save changes' : 'Create user'}</button></>}>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Full name *" error={er.name}><input className="input" value={f.name} onChange={set('name')} /></Field>
        <Field label="Email *" error={er.email}><input className="input" type="email" value={f.email} onChange={set('email')} /></Field>
        <Field label="Phone *" error={er.phone}><input className="input" maxLength={10} value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value.replace(/\D/g, '') })} /></Field>
        <Field label="Designation"><input className="input" value={f.designation} onChange={set('designation')} /></Field>
        <Field label="Role"><select className="input" value={f.role} onChange={set('role')}>{allowedRoles.map((r) => <option key={r}>{r}</option>)}</select></Field>
        <Field label="Assigned branch"><select className="input" disabled={global || !!fixedBranchId} value={fixedBranchId || (global ? 'all' : f.branchId)} onChange={set('branchId')}>{global && !fixedBranchId && <option value="all">All branches</option>}{branches.filter((b) => !fixedBranchId || b.id === fixedBranchId).map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}</select></Field>
        <Field label="Shift"><select className="input" value={f.shift} onChange={set('shift')}>{shiftOptions.map((shift) => <option key={shift.id} value={shift.id}>{shift.name} · {shift.start}–{shift.end}</option>)}</select></Field>
        <Field label="Employment status"><select className="input" value={f.status} onChange={set('status')}><option>Active</option><option>On leave</option><option>Inactive</option></select></Field>
      </div>
    </Modal>
  );
}

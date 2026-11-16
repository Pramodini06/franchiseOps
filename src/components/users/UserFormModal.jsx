import { useEffect, useState } from 'react';
import Modal from '../ui/Modal';
import { Field, Spinner } from '../ui/misc';
import { USER_ROLES } from '../../data/users';
import { useData } from '../../context/DataContext';

const EMPTY = { name: '', email: '', phone: '', role: 'Staff', branchId: '', status: 'Active' };

export default function UserFormModal({ open, user, onClose, onSave }) {
  const { branches, users } = useData();
  const [f, setF] = useState(EMPTY);
  const [er, setEr] = useState({});
  const [saving, setSaving] = useState(false);
  useEffect(() => { if (open) { setF(user ? { ...EMPTY, ...user } : { ...EMPTY, branchId: branches[0]?.id || '' }); setEr({}); setSaving(false); } }, [open, user]); // eslint-disable-line
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const global = f.role === 'Super Admin' || f.role === 'Franchise Owner';

  const submit = () => {
    const e = {};
    if (!f.name.trim()) e.name = 'Full name is required';
    if (!/^\S+@\S+\.\S+$/.test(f.email)) e.email = 'Enter a valid email';
    else if (users.some((u) => u.email.toLowerCase() === f.email.toLowerCase() && u.id !== user?.id)) e.email = 'Email already exists';
    if (!/^\d{10}$/.test(f.phone)) e.phone = 'Enter a 10-digit phone number';
    setEr(e);
    if (Object.keys(e).length) return;
    setSaving(true);
    setTimeout(() => onSave({ ...f, branchId: global ? 'all' : f.branchId }), 500);
  };
  return (
    <Modal open={open} onClose={onClose} size="md" title={user ? 'Edit user' : 'Add new user'} subtitle="Frontend demo — no real accounts are created"
      footer={<><button className="btn-ghost" onClick={onClose}>Cancel</button><button className="btn-primary" disabled={saving} onClick={submit}>{saving && <Spinner />}{user ? 'Save changes' : 'Create user'}</button></>}>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Full name *" error={er.name}><input className="input" value={f.name} onChange={set('name')} /></Field>
        <Field label="Email *" error={er.email}><input className="input" type="email" value={f.email} onChange={set('email')} /></Field>
        <Field label="Phone *" error={er.phone}><input className="input" maxLength={10} value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value.replace(/\D/g, '') })} /></Field>
        <Field label="Role"><select className="input" value={f.role} onChange={set('role')}>{USER_ROLES.map((r) => <option key={r}>{r}</option>)}</select></Field>
        <Field label="Assigned branch"><select className="input" disabled={global} value={global ? 'all' : f.branchId} onChange={set('branchId')}>{global && <option value="all">All branches</option>}{branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}</select></Field>
        <Field label="Status"><select className="input" value={f.status} onChange={set('status')}><option>Active</option><option>Inactive</option></select></Field>
      </div>
    </Modal>
  );
}

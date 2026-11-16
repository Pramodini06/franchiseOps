import { useEffect, useState } from 'react';
import Modal from '../ui/Modal';
import { Field, Spinner } from '../ui/misc';
import { useData } from '../../context/DataContext';

const EMPTY = { name: '', code: '', city: 'Bengaluru', address: '', phone: '', manager: '', status: 'Active' };
export const CITIES = ['Bengaluru', 'Tumakuru', 'Mysuru', 'Hubballi', 'Mangaluru'];

export default function BranchFormModal({ open, branch, onClose, onSave }) {
  const { branches } = useData();
  const [f, setF] = useState(EMPTY);
  const [er, setEr] = useState({});
  const [saving, setSaving] = useState(false);
  useEffect(() => { if (open) { setF(branch ? { ...EMPTY, ...branch } : EMPTY); setEr({}); setSaving(false); } }, [open, branch]);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  const submit = () => {
    const e = {};
    if (!f.name.trim()) e.name = 'Branch name is required';
    if (!f.code.trim()) e.code = 'Branch code is required';
    else if (branches.some((b) => b.code.toLowerCase() === f.code.trim().toLowerCase() && b.id !== branch?.id)) e.code = 'This code is already in use';
    if (!f.address.trim()) e.address = 'Address is required';
    if (!/^\d{10}$/.test(f.phone)) e.phone = 'Enter a 10-digit contact number';
    if (!f.manager.trim()) e.manager = 'Manager name is required';
    setEr(e);
    if (Object.keys(e).length) return;
    setSaving(true);
    setTimeout(() => onSave({ ...f, name: f.name.trim(), code: f.code.trim().toUpperCase() }), 600);
  };

  return (
    <Modal open={open} onClose={onClose} title={branch ? 'Edit branch' : 'Add new branch'} subtitle="Branch details and manager assignment"
      footer={<><button className="btn-ghost" onClick={onClose}>Cancel</button><button className="btn-primary" disabled={saving} onClick={submit}>{saving && <Spinner />}{branch ? 'Save changes' : 'Create branch'}</button></>}>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Branch name *" error={er.name}><input className="input" value={f.name} onChange={set('name')} placeholder="e.g. Hubballi Vidyanagar" /></Field>
        <Field label="Branch code *" error={er.code}><input className="input uppercase" value={f.code} onChange={set('code')} placeholder="HBL-VID-02" /></Field>
        <Field label="City"><select className="input" value={f.city} onChange={set('city')}>{CITIES.map((c) => <option key={c}>{c}</option>)}</select></Field>
        <Field label="Status"><select className="input" value={f.status} onChange={set('status')}>{['Active', 'Inactive', 'Maintenance'].map((c) => <option key={c}>{c}</option>)}</select></Field>
        <Field label="Address *" error={er.address} className="sm:col-span-2"><textarea rows={2} className="input" value={f.address} onChange={set('address')} placeholder="Street, area, pincode" /></Field>
        <Field label="Contact number *" error={er.phone}><input className="input" inputMode="numeric" maxLength={10} value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value.replace(/\D/g, '') })} placeholder="10-digit mobile" /></Field>
        <Field label="Branch manager *" error={er.manager}><input className="input" value={f.manager} onChange={set('manager')} placeholder="Manager full name" /></Field>
      </div>
    </Modal>
  );
}

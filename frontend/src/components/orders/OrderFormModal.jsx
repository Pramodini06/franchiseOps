import { useEffect, useMemo, useState } from 'react';
import { Minus, Plus, Trash2 } from 'lucide-react';
import Modal from '../ui/Modal';
import { Field, Spinner } from '../ui/misc';
import { useData } from '../../context/DataContext';
import { useScope } from '../../hooks';
import { TAX_RATE, calcTotals, fmtINR } from '../../utils/format';

const EMPTY = { customer: '', phone: '', branchId: '', type: 'Dine-in', payment: 'UPI', lines: [] };

export default function OrderFormModal({ open, onClose, onSave }) {
  const { menu } = useData();
  const { scopeBranches } = useScope();
  const branches = scopeBranches.filter((b) => b.status === 'Active');
  const [f, setF] = useState(EMPTY);
  const [er, setEr] = useState({});
  const [saving, setSaving] = useState(false);
  useEffect(() => { if (open) { setF({ ...EMPTY, branchId: branches[0]?.id || '', lines: [{ itemId: '', qty: 1 }] }); setEr({}); setSaving(false); } }, [open]); // eslint-disable-line

  const options = useMemo(() => menu.filter((m) => m.available && m.branches.includes(f.branchId)), [menu, f.branchId]);
  const resolved = f.lines.filter((l) => l.itemId).map((l) => { const m = menu.find((x) => x.id === l.itemId); return { itemId: m.id, name: m.name, price: m.price, qty: l.qty }; });
  const totals = calcTotals(resolved);
  const setLine = (i, patch) => setF({ ...f, lines: f.lines.map((l, j) => (j === i ? { ...l, ...patch } : l)) });

  const submit = () => {
    const e = {};
    if (!f.customer.trim()) e.customer = 'Customer name is required';
    if (!/^\d{10}$/.test(f.phone)) e.phone = 'Enter a 10-digit phone number';
    if (!f.branchId) e.branchId = 'Select a branch';
    if (resolved.length === 0) e.lines = 'Add at least one food item';
    setEr(e);
    if (Object.keys(e).length) return;
    setSaving(true);
    setTimeout(() => onSave({ customer: f.customer.trim(), phone: f.phone, branchId: f.branchId, type: f.type, payment: f.payment, lines: resolved }), 700);
  };

  return (
    <Modal open={open} onClose={onClose} size="lg" title="Create new order" subtitle="Order ID is generated automatically"
      footer={<><button className="btn-ghost" onClick={onClose}>Cancel</button><button className="btn-primary" disabled={saving} onClick={submit}>{saving && <Spinner />}Place order · {fmtINR(totals.total)}</button></>}>
      <div className="grid gap-6 lg:grid-cols-5">
        <div className="space-y-4 lg:col-span-3">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Customer name *" error={er.customer}><input className="input" value={f.customer} onChange={(e) => setF({ ...f, customer: e.target.value })} placeholder="Customer full name" /></Field>
            <Field label="Phone *" error={er.phone}><input className="input" inputMode="numeric" maxLength={10} value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value.replace(/\D/g, '') })} placeholder="10-digit mobile" /></Field>
            <Field label="Branch *" error={er.branchId}><select className="input" value={f.branchId} onChange={(e) => setF({ ...f, branchId: e.target.value, lines: [{ itemId: '', qty: 1 }] })}>{branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}</select></Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Order type"><select className="input" value={f.type} onChange={(e) => setF({ ...f, type: e.target.value })}>{['Dine-in', 'Takeaway', 'Delivery'].map((t) => <option key={t}>{t}</option>)}</select></Field>
              <Field label="Payment"><select className="input" value={f.payment} onChange={(e) => setF({ ...f, payment: e.target.value })}>{['UPI', 'Card', 'Cash'].map((t) => <option key={t}>{t}</option>)}</select></Field>
            </div>
          </div>
          <div>
            <div className="mb-2 flex items-center justify-between"><p className="label !mb-0">Food items *</p><button type="button" className="flex items-center gap-1 text-xs font-semibold text-brand-600" onClick={() => setF({ ...f, lines: [...f.lines, { itemId: '', qty: 1 }] })}><Plus size={14} /> Add item</button></div>
            <div className="space-y-2">{f.lines.map((l, i) => (
              <div key={i} className="flex items-center gap-2">
                <select className="input flex-1" value={l.itemId} onChange={(e) => setLine(i, { itemId: e.target.value })}>
                  <option value="">Select item…</option>{options.map((m) => <option key={m.id} value={m.id}>{m.emoji} {m.name} — {fmtINR(m.price)}</option>)}
                </select>
                <div className="flex items-center rounded-lg border border-slate-200">
                  <button type="button" className="icon-btn" onClick={() => setLine(i, { qty: Math.max(1, l.qty - 1) })}><Minus size={14} /></button>
                  <span className="w-7 text-center text-sm font-semibold">{l.qty}</span>
                  <button type="button" className="icon-btn" onClick={() => setLine(i, { qty: Math.min(20, l.qty + 1) })}><Plus size={14} /></button>
                </div>
                <button type="button" className="icon-btn hover:!text-red-600" disabled={f.lines.length === 1} onClick={() => setF({ ...f, lines: f.lines.filter((_, j) => j !== i) })}><Trash2 size={15} /></button>
              </div>))}</div>
            {er.lines && <p className="mt-1 text-xs text-red-600">{er.lines}</p>}
          </div>
        </div>
        <div className="h-fit rounded-xl bg-slate-50 p-4 lg:col-span-2">
          <h4 className="text-sm font-semibold">Order summary</h4>
          <ul className="mt-3 space-y-2 text-sm">{resolved.length === 0 && <li className="text-slate-400">No items added yet.</li>}{resolved.map((l) => <li key={l.itemId} className="flex justify-between gap-2"><span className="text-slate-600">{l.qty}× {l.name}</span><span className="font-medium">{fmtINR(l.qty * l.price)}</span></li>)}</ul>
          <div className="mt-4 space-y-1.5 border-t border-dashed border-slate-300 pt-3 text-sm">
            <p className="flex justify-between text-slate-600"><span>Subtotal</span><span>{fmtINR(totals.subtotal)}</span></p>
            <p className="flex justify-between text-slate-600"><span>GST ({TAX_RATE * 100}%)</span><span>{fmtINR(totals.tax)}</span></p>
            <p className="flex justify-between border-t border-slate-200 pt-2 text-base font-bold"><span>Total</span><span className="text-brand-700">{fmtINR(totals.total)}</span></p>
          </div>
        </div>
      </div>
    </Modal>
  );
}

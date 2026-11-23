import { Check } from 'lucide-react';
import Modal from '../ui/Modal';
import StatusBadge from '../ui/StatusBadge';
import { useData } from '../../context/DataContext';
import { TAX_RATE, fmtDate, fmtINR } from '../../utils/format';

const FLOW = ['Placed', 'Preparing', 'Ready', 'Completed'];

export default function OrderDetailModal({ order, onClose, onStatus }) {
  const { branches } = useData();
  if (!order) return null;
  const idx = FLOW.indexOf(order.status);
  const next = FLOW[idx + 1];
  const closed = order.status === 'Cancelled' || order.status === 'Completed';
  return (
    <Modal open onClose={onClose} size="md" title={`Order ${order.id}`} subtitle={fmtDate(order.date)}
      footer={<>{!closed && <button className="btn-ghost !text-red-600" onClick={() => onStatus('Cancelled')}>Cancel order</button>}{next && order.status !== 'Cancelled' && <button className="btn-primary" onClick={() => onStatus(next)}>Mark as {next}</button>}<button className="btn-ghost" onClick={onClose}>Close</button></>}>
      <div className="space-y-5">
        {order.status === 'Cancelled' ? <div className="rounded-lg bg-red-50 px-4 py-3 text-sm font-medium text-red-700">This order was cancelled.</div> : (
          <div className="flex items-center">{FLOW.map((s, i) => (
            <div key={s} className="flex flex-1 items-center last:flex-none">
            <div className="flex flex-col items-center gap-1"><span className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${i <= idx ? 'bg-brand-600 text-white' : 'bg-slate-200 text-slate-500'}`}>{i < idx ? <Check size={14} /> : i + 1}</span><span className="text-[10px] font-medium text-slate-500 sm:text-xs">{s === 'Placed' ? 'Pending' : s}</span></div>
              {i < FLOW.length - 1 && <div className={`mx-1 mb-4 h-0.5 flex-1 ${i < idx ? 'bg-brand-600' : 'bg-slate-200'}`} />}
            </div>))}</div>)}
        <dl className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-3">
          {[['Customer', order.customer], ['Phone', order.phone], ['Branch', branches.find((b) => b.id === order.branchId)?.name], ['Order type', order.type], ['Payment', order.payment]].map(([k, v]) => <div key={k}><dt className="text-xs text-slate-500">{k}</dt><dd className="font-medium">{v}</dd></div>)}
          <div><dt className="text-xs text-slate-500">Status</dt><dd className="mt-0.5"><StatusBadge status={order.status} /></dd></div>
        </dl>
        <div className="overflow-hidden rounded-lg border border-slate-200">
          <table className="w-full text-sm"><thead className="bg-slate-50"><tr><th className="th">Item</th><th className="th text-right">Qty</th><th className="th text-right">Price</th><th className="th text-right">Amount</th></tr></thead>
            <tbody className="divide-y divide-slate-100">{order.lines.map((l) => <tr key={l.itemId}><td className="td">{l.name}</td><td className="td text-right">{l.qty}</td><td className="td text-right">{fmtINR(l.price)}</td><td className="td text-right font-medium">{fmtINR(l.qty * l.price)}</td></tr>)}</tbody></table>
          <div className="space-y-1 border-t border-slate-200 bg-slate-50 px-4 py-3 text-sm">
            <p className="flex justify-between"><span className="text-slate-500">Subtotal</span>{fmtINR(order.subtotal)}</p>
            <p className="flex justify-between"><span className="text-slate-500">GST ({TAX_RATE * 100}%)</span>{fmtINR(order.tax)}</p>
            <p className="flex justify-between text-base font-bold"><span>Total</span><span className="text-brand-700">{fmtINR(order.total)}</span></p>
          </div>
        </div>
      </div>
    </Modal>
  );
}

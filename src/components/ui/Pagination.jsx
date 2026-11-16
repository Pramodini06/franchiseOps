import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function Pagination({ page, pages, total, size, onChange }) {
  if (total === 0) return null;
  const from = (page - 1) * size + 1, to = Math.min(page * size, total);
  return (
    <div className="flex flex-col items-center justify-between gap-3 border-t border-slate-100 px-4 py-3 sm:flex-row">
      <p className="text-xs text-slate-500">Showing <b>{from}–{to}</b> of <b>{total}</b></p>
      <div className="flex items-center gap-1">
        <button className="icon-btn disabled:opacity-40" disabled={page === 1} onClick={() => onChange(page - 1)}><ChevronLeft size={16} /></button>
        {Array.from({ length: pages }, (_, i) => i + 1).map((n) => (
          <button key={n} onClick={() => onChange(n)} className={`h-8 min-w-8 rounded-lg px-2 text-xs font-medium ${n === page ? 'bg-brand-600 text-white' : 'text-slate-600 hover:bg-slate-100'}`}>{n}</button>
        ))}
        <button className="icon-btn disabled:opacity-40" disabled={page === pages} onClick={() => onChange(page + 1)}><ChevronRight size={16} /></button>
      </div>
    </div>
  );
}

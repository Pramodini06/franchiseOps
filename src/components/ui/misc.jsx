import { SearchX } from 'lucide-react';

export function PageHeader({ title, subtitle, actions }) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div><h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">{title}</h1>{subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}</div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}
export function Field({ label, error, children, className = '' }) {
  return <div className={className}><label className="label">{label}</label>{children}{error && <p className="mt-1 text-xs text-red-600">{error}</p>}</div>;
}
export function Switch({ checked, onChange, disabled }) {
  return (
    <button type="button" role="switch" aria-checked={checked} disabled={disabled} onClick={() => onChange(!checked)}
      className={`relative h-6 w-11 shrink-0 rounded-full transition disabled:opacity-50 ${checked ? 'bg-emerald-500' : 'bg-slate-300'}`}>
      <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${checked ? 'left-[22px]' : 'left-0.5'}`} />
    </button>
  );
}
export function EmptyState({ title = 'No results found', text = 'Try adjusting your search or filters.' }) {
  return (
    <div className="flex flex-col items-center py-14 text-center">
      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400"><SearchX size={22} /></div>
      <p className="font-semibold text-slate-700">{title}</p><p className="mt-1 text-sm text-slate-500">{text}</p>
    </div>
  );
}
export function TableSkeleton({ rows = 6 }) {
  return (
    <div className="space-y-3 p-4">
      {Array.from({ length: rows }, (_, i) => <div key={i} className="h-10 animate-pulse rounded-lg bg-slate-100" />)}
    </div>
  );
}
export function CardSkeleton({ className = 'h-32' }) { return <div className={`animate-pulse rounded-xl bg-slate-200/70 ${className}`} />; }
export function Spinner() { return <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />; }

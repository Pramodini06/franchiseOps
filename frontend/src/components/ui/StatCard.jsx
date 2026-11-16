import { TrendingUp, TrendingDown } from 'lucide-react';

const TONES = { brand: 'bg-brand-50 text-brand-600', emerald: 'bg-emerald-50 text-emerald-600', sky: 'bg-sky-50 text-sky-600', violet: 'bg-violet-50 text-violet-600', amber: 'bg-amber-50 text-amber-600' };

export default function StatCard({ icon: Icon, label, value, delta, hint, tone = 'brand' }) {
  const up = delta >= 0;
  return (
    <div className="card p-5 transition hover:shadow-md">
      <div className="flex items-start justify-between">
        <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${TONES[tone]}`}><Icon size={22} /></div>
        {delta !== undefined && (
          <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${up ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
            {up ? <TrendingUp size={12} /> : <TrendingDown size={12} />}{Math.abs(delta)}%
          </span>
        )}
      </div>
      <p className="mt-4 text-2xl font-bold tracking-tight text-slate-900">{value}</p>
      <p className="mt-0.5 text-sm text-slate-500">{label}</p>
      {hint && <p className="mt-1 text-xs text-slate-400">{hint}</p>}
    </div>
  );
}

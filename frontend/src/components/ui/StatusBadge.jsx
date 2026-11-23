const MAP = {
  Placed: 'bg-sky-50 text-sky-700 ring-sky-200', Preparing: 'bg-amber-50 text-amber-700 ring-amber-200', Ready: 'bg-violet-50 text-violet-700 ring-violet-200',
  Completed: 'bg-emerald-50 text-emerald-700 ring-emerald-200', Cancelled: 'bg-red-50 text-red-700 ring-red-200',
  Active: 'bg-emerald-50 text-emerald-700 ring-emerald-200', Inactive: 'bg-slate-100 text-slate-600 ring-slate-200', Maintenance: 'bg-amber-50 text-amber-700 ring-amber-200',
  Available: 'bg-emerald-50 text-emerald-700 ring-emerald-200', 'Sold out': 'bg-red-50 text-red-700 ring-red-200',
  'On leave': 'bg-slate-100 text-slate-700 ring-slate-200', Present: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  Late: 'bg-amber-50 text-amber-700 ring-amber-200', Absent: 'bg-red-50 text-red-700 ring-red-200',
  'Half-day': 'bg-violet-50 text-violet-700 ring-violet-200',
  'In stock': 'bg-emerald-50 text-emerald-700 ring-emerald-200', 'Low stock': 'bg-amber-50 text-amber-700 ring-amber-200',
  'Out of stock': 'bg-red-50 text-red-700 ring-red-200'
};
export const STATUS_DOT = { Placed: 'bg-slate-500', Preparing: 'bg-amber-500', Ready: 'bg-violet-500', Completed: 'bg-emerald-500', Cancelled: 'bg-red-500', Present: 'bg-emerald-500', Late: 'bg-amber-500', Absent: 'bg-red-500', 'On leave': 'bg-slate-500', 'Half-day': 'bg-violet-500', 'In stock': 'bg-emerald-500', 'Low stock': 'bg-amber-500', 'Out of stock': 'bg-red-500' };

export default function StatusBadge({ status }) {
  return (
    <span className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${MAP[status] || MAP.Inactive}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${STATUS_DOT[status] || 'bg-current'}`} />{status === 'Placed' ? 'Pending' : status}
    </span>
  );
}

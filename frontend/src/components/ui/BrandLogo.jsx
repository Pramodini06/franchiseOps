export default function BrandLogo({ light = false, compact = false }) {
  return (
    <div className="flex items-center gap-3" aria-label="FoodOps">
      <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${light ? 'bg-white/10 text-brand-200' : 'bg-brand-50 text-brand-700'}`}>
        <svg viewBox="0 0 32 32" width="27" height="27" fill="none" aria-hidden="true">
          <circle cx="13" cy="15" r="10.5" stroke="currentColor" strokeWidth="1.5" />
          <circle cx="13" cy="15" r="6.8" stroke="currentColor" strokeWidth="1.2" opacity=".65" />
          <path d="M10.3 16.3c1.5-2.4 3.5-3.9 6.2-4.4-.3 3-1.8 5-4.6 5.8" fill="currentColor" opacity=".8" />
          <path d="m12 17.4 3.1-3.7" stroke={light ? '#173526' : '#eff4ef'} strokeWidth="1.2" strokeLinecap="round" />
          <path d="M22.5 23v-3m4 3v-6m4 6v-9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      </span>
      {!compact && (
        <span className="leading-tight">
          <span className={`block text-base font-semibold tracking-tight ${light ? 'text-white' : 'text-slate-900'}`}>Food<span className={light ? 'text-brand-200' : 'text-brand-700'}>Ops</span></span>
          <span className={`mt-0.5 block text-[9px] uppercase tracking-[.16em] ${light ? 'text-slate-400' : 'text-slate-500'}`}>Food business operations</span>
        </span>
      )}
    </div>
  );
}

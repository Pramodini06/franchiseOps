import { useMemo, useState } from 'react';
import { AlertTriangle, ArrowRight, Bell, CheckCircle2, CircleAlert, Search, ShieldAlert, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useOperationalAlerts } from '../hooks';
import { EmptyState, PageHeader } from '../components/ui/misc';

const SEVERITY = {
  critical: { label: 'Urgent', icon: ShieldAlert, style: 'border-l-red-600 bg-red-50/40', badge: 'bg-red-100 text-red-800' },
  warning: { label: 'Attention', icon: AlertTriangle, style: 'border-l-amber-500 bg-amber-50/40', badge: 'bg-amber-100 text-amber-800' },
  info: { label: 'Monitor', icon: CircleAlert, style: 'border-l-brand-600 bg-brand-50/30', badge: 'bg-brand-100 text-brand-800' }
};

const ACTION_LABELS = {
  '/inventory': 'Review inventory',
  '/attendance': 'Review attendance',
  '/orders': 'View orders',
  '/branches': 'View outlet',
  '/analytics': 'View analytics'
};

export default function Alerts() {
  const { alerts, unreadCount, dismissAlert, markAllRead } = useOperationalAlerts();
  const [severity, setSeverity] = useState('All');
  const [query, setQuery] = useState('');
  const visible = useMemo(() => alerts.filter((alert) => (
    (severity === 'All' || alert.severity === severity)
    && `${alert.title} ${alert.branch} ${alert.detail} ${alert.type}`.toLowerCase().includes(query.toLowerCase())
  )), [alerts, severity, query]);
  const previewCount = alerts.filter((alert) => alert.source === 'Preview only').length;

  return (
    <>
      <PageHeader title="Operational Alerts" subtitle="Actionable signals from your authorized outlets"
        actions={<button className="btn-ghost" onClick={markAllRead} disabled={!unreadCount}><CheckCircle2 size={15} /> Mark all read</button>} />

      <div className="mb-5 grid gap-3 sm:grid-cols-3">
        <div className="card flex items-center gap-3 p-4"><Bell size={18} className="text-brand-700" /><div><p className="text-xl font-semibold">{alerts.length}</p><p className="text-xs text-slate-500">Active alerts</p></div></div>
        <div className="card flex items-center gap-3 p-4"><CircleAlert size={18} className="text-amber-600" /><div><p className="text-xl font-semibold">{unreadCount}</p><p className="text-xs text-slate-500">Unread</p></div></div>
        <div className="card flex items-center gap-3 p-4"><AlertTriangle size={18} className="text-slate-500" /><div><p className="text-xl font-semibold">{previewCount}</p><p className="text-xs text-slate-500">Preview-only signals</p></div></div>
      </div>

      {previewCount > 0 && <div className="mb-5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">Attendance and inventory alerts use temporary sample previews; dismissals last only for this browser session. Saved order and outlet alerts are labeled individually.</div>}

      <div className="card mb-4 p-4">
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1"><Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /><input className="input pl-9" placeholder="Search alerts or outlets…" value={query} onChange={(event) => setQuery(event.target.value)} aria-label="Search alerts" /></div>
          <select className="input sm:w-48" aria-label="Filter by severity" value={severity} onChange={(event) => setSeverity(event.target.value)}><option value="All">All severities</option><option value="critical">Urgent</option><option value="warning">Attention</option><option value="info">Monitor</option></select>
        </div>
      </div>

      <div className="space-y-3">
        {visible.map((alert) => {
          const severityStyle = SEVERITY[alert.severity] || SEVERITY.info;
          const Icon = severityStyle.icon;
          return (
            <article key={alert.id} className={`card border-l-4 p-4 sm:p-5 ${severityStyle.style}`}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex min-w-0 flex-1 items-start gap-3">
                  <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-slate-700 shadow-sm"><Icon size={17} /></span>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2"><h2 className="font-semibold text-slate-900">{alert.title}</h2><span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${severityStyle.badge}`}>{severityStyle.label}</span>{alert.unread && <span className="h-2 w-2 rounded-full bg-brand-600" title="Unread" />}</div>
                    <p className="mt-1 text-sm leading-5 text-slate-600">{alert.detail}</p>
                    <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500"><span className="font-medium text-slate-700">{alert.branch}</span><span>{alert.time}</span><span>{alert.source}</span></div>
                  </div>
                </div>
                <div className="flex items-center gap-2 sm:pl-12">
                  {alert.to && <Link className="btn-ghost px-3 py-1.5 text-xs" to={alert.to}>{ACTION_LABELS[alert.to] || 'Review'} <ArrowRight size={13} /></Link>}
                  <button type="button" className="icon-btn" onClick={() => dismissAlert(alert.id)} aria-label={`Dismiss ${alert.title}`} title="Dismiss alert"><X size={16} /></button>
                </div>
              </div>
            </article>
          );
        })}
        {!visible.length && <div className="card"><EmptyState title={alerts.length ? 'No alerts match these filters' : 'You’re all caught up'} text={alerts.length ? 'Try a different search or severity.' : 'New operational signals in your scope will appear here.'} /></div>}
      </div>
    </>
  );
}

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, ChevronDown, Menu, PanelLeftClose, PanelLeftOpen, Search, Settings, LogOut, Repeat } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { useOperationalAlerts, useOutside } from '../../hooks';
import { ROLES } from '../../data/roles';

export default function Topbar({ collapsed, onToggleCollapse, onOpenMobile }) {
  const { user, role, roleKey, switchRole, logout } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const [q, setQ] = useState('');
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const { alerts, unreadCount, dismissAlert, markAlertRead, markAllRead } = useOperationalAlerts();
  const notifRef = useOutside(() => setNotifOpen(false));
  const profRef = useOutside(() => setProfileOpen(false));

  const search = (e) => { e.preventDefault(); if (!q.trim()) return; navigate(`/orders?q=${encodeURIComponent(q.trim())}`); toast.info(`Searching orders for “${q.trim()}”`); };
  const change = async (k) => { try { await switchRole(k); setProfileOpen(false); navigate('/dashboard'); toast.success(`Signed in as ${ROLES[k].label}`); } catch (e) { toast.error(e.message || 'Could not switch account'); } };

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-slate-200/80 bg-[#f7f7f2]/90 px-4 backdrop-blur md:px-6">
      <button className="icon-btn lg:hidden" onClick={onOpenMobile}><Menu size={20} /></button>
      <button className="icon-btn hidden lg:inline-flex" onClick={onToggleCollapse} title="Toggle sidebar">{collapsed ? <PanelLeftOpen size={20} /> : <PanelLeftClose size={20} />}</button>

      <form onSubmit={search} className="relative hidden max-w-md flex-1 sm:block">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input value={q} onChange={(e) => setQ(e.target.value)} className="input bg-slate-50 pl-9" placeholder="Search orders by ID or customer…" />
      </form>

      <div className="ml-auto flex items-center gap-2">
        <span className="hidden rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700 md:inline">{role.label}</span>

        <div className="relative" ref={notifRef}>
          <button aria-label={`Operational alerts${unreadCount ? `, ${unreadCount} unread` : ''}`} className="icon-btn relative" onClick={() => { setNotifOpen(!notifOpen); setProfileOpen(false); }}>
            <Bell size={20} />{unreadCount > 0 && <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-brand-600 text-[9px] font-bold text-white">{unreadCount}</span>}
          </button>
          {notifOpen && (
            <div className="absolute right-0 mt-2 w-80 max-w-[calc(100vw-2rem)] animate-pop overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl">
              <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
                <p className="text-sm font-semibold">Operational alerts</p>
                <button className="text-xs font-medium text-brand-600" onClick={() => { markAllRead(); toast.success('Alerts marked as read'); }}>Mark all read</button>
              </div>
              <ul className="max-h-80 divide-y divide-slate-100 overflow-y-auto">
                {alerts.slice(0, 5).map((alert) => (
                  <li key={alert.id} className={`relative px-4 py-3 ${alert.unread ? 'bg-brand-50/40' : ''}`}>
                    <button className="w-full pr-6 text-left" onClick={() => { markAlertRead(alert.id); setNotifOpen(false); navigate(alert.to || '/alerts'); }}>
                      <span className="flex items-center gap-2"><span className={`h-2 w-2 shrink-0 rounded-full ${alert.severity === 'critical' ? 'bg-red-600' : alert.severity === 'warning' ? 'bg-amber-500' : 'bg-brand-600'}`} /><span className="text-sm font-medium">{alert.title}</span></span>
                      <span className="mt-1 block pl-4 text-xs text-slate-500">{alert.branch} · {alert.time}</span>
                      <span className="mt-1 block pl-4 text-[11px] text-slate-400">{alert.source}</span>
                    </button>
                    <button aria-label={`Dismiss ${alert.title}`} title="Dismiss alert" className="absolute right-3 top-3 text-xs text-slate-400 hover:text-slate-700" onClick={() => dismissAlert(alert.id)}>×</button>
                  </li>
                ))}
                {!alerts.length && <li className="px-4 py-5 text-sm text-slate-500">No active alerts in your scope.</li>}
              </ul>
              <button className="w-full border-t border-slate-100 px-4 py-3 text-left text-xs font-semibold text-brand-700 hover:bg-slate-50" onClick={() => { setNotifOpen(false); navigate('/alerts'); }}>View all alerts</button>
            </div>
          )}
        </div>

        <div className="relative" ref={profRef}>
          <button className="flex items-center gap-2 rounded-lg p-1 pr-2 hover:bg-slate-100" onClick={() => { setProfileOpen(!profileOpen); setNotifOpen(false); }}>
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-700 text-xs font-semibold text-white">{user.name.split(' ').map((s) => s[0]).join('')}</div>
            <div className="hidden text-left md:block"><p className="text-sm font-semibold leading-tight">{user.name}</p><p className="text-[11px] text-slate-500">{role.label}</p></div>
            <ChevronDown size={14} className="hidden text-slate-400 md:block" />
          </button>
          {profileOpen && (
            <div className="absolute right-0 mt-2 w-72 max-w-[calc(100vw-2rem)] animate-pop overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl">
              <div className="border-b border-slate-100 px-4 py-3"><p className="text-sm font-semibold">{user.name}</p><p className="text-xs text-slate-500">{user.email}</p><p className="mt-0.5 text-xs text-slate-400">{user.title}</p></div>
              <div className="border-b border-slate-100 p-2">
                <p className="flex items-center gap-1.5 px-2 pb-1 pt-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400"><Repeat size={11} /> Switch demo account</p>
                {Object.entries(ROLES).map(([k, r]) => (
                  <button key={k} onClick={() => change(k)} className={`flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-left text-sm hover:bg-slate-50 ${k === roleKey ? 'font-semibold text-brand-700' : 'text-slate-700'}`}>{r.label}{k === roleKey && <span className="h-2 w-2 rounded-full bg-brand-600" />}</button>
                ))}
              </div>
              <div className="p-2">
                <button onClick={() => { setProfileOpen(false); navigate('/settings'); }} className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-sm text-slate-700 hover:bg-slate-50"><Settings size={16} /> Account settings</button>
                <button onClick={() => { logout(); navigate('/login'); }} className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-sm text-red-600 hover:bg-red-50"><LogOut size={16} /> Logout</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

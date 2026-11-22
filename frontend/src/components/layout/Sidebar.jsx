import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Store, Users, UtensilsCrossed, ShoppingBag, Settings, LogOut, X, MessageCircle, Boxes, CalendarDays, BarChart3, BellRing } from 'lucide-react';
import { NAV_ITEMS } from '../../data/roles';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import BrandLogo from '../ui/BrandLogo';

const ICONS = { LayoutDashboard, Store, Users, UtensilsCrossed, ShoppingBag, Settings, MessageCircle, Boxes, CalendarDays, BarChart3, BellRing };
const SECTIONS = ['Overview', 'Operations', 'People', 'Insights', 'System'];

export default function Sidebar({ collapsed, mobileOpen, onClose }) {
  const { role, user, logout } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const items = NAV_ITEMS.filter((n) => role.nav.includes(n.key));
  const hide = collapsed ? 'lg:hidden' : '';
  const initials = user.name.split(' ').map((s) => s[0]).join('');
  const handleLogout = () => { logout(); toast.info('You have been logged out.'); navigate('/login'); };

  return (
    <>
      {mobileOpen && <div className="fixed inset-0 z-40 bg-ink-900/40 backdrop-blur-[2px] lg:hidden" onClick={onClose} />}
      <aside className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-white/5 bg-ink-900 text-slate-300 transition-all duration-300 ${collapsed ? 'lg:w-20' : 'lg:w-64'} ${mobileOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}>
        <div className="flex h-[76px] items-center justify-between border-b border-white/10 px-4">
          <BrandLogo light compact={collapsed} />
          <button aria-label="Close navigation" className="icon-btn text-slate-400 hover:bg-white/10 hover:text-white lg:hidden" onClick={onClose}><X size={20} /></button>
        </div>

        <nav aria-label="Main navigation" className="flex-1 space-y-5 overflow-y-auto px-3 py-5">
          {SECTIONS.map((section) => {
            const sectionItems = items.filter((n) => n.section === section);
            if (!sectionItems.length) return null;
            return (
              <div key={section}>
                <p className={`mb-2 px-3 text-[10px] font-semibold uppercase tracking-[.16em] text-slate-500 ${hide}`}>{section}</p>
                <div className="space-y-1">
                  {sectionItems.map((n) => {
                    const Icon = ICONS[n.icon];
                    return (
                      <NavLink key={n.key} to={n.path} title={n.label} onClick={onClose}
                        className={({ isActive }) => `group flex items-center gap-3 rounded-lg px-3 py-2.5 text-[13px] font-medium transition ${collapsed ? 'lg:justify-center' : ''} ${isActive ? 'bg-white/10 text-white ring-1 ring-inset ring-white/10' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}>
                        <Icon size={18} className="shrink-0" /><span className={hide}>{n.label}</span>
                      </NavLink>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </nav>

        <div className="border-t border-white/10 p-3">
          <div className={`mb-2 flex items-center gap-3 rounded-lg bg-white/5 p-2.5 ${collapsed ? 'lg:justify-center' : ''}`}>
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-700 text-xs font-semibold text-white">{initials}</div>
            <div className={`min-w-0 ${hide}`}><p className="truncate text-sm font-semibold text-white">{user.name}</p><p className="truncate text-xs text-slate-400">{role.label}</p></div>
          </div>
          <button onClick={handleLogout} title="Logout" className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-400 transition hover:bg-red-500/10 hover:text-red-400 ${collapsed ? 'lg:justify-center' : ''}`}>
            <LogOut size={19} className="shrink-0" /><span className={hide}>Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
}

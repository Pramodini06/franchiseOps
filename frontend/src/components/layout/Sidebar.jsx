import { NavLink, useNavigate } from 'react-router-dom';
import { ChefHat, LayoutDashboard, Store, Users, UtensilsCrossed, ShoppingBag, Settings, LogOut, X, MessageCircle } from 'lucide-react';
import { NAV_ITEMS } from '../../data/roles';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

const ICONS = { LayoutDashboard, Store, Users, UtensilsCrossed, ShoppingBag, Settings, MessageCircle };

export default function Sidebar({ collapsed, mobileOpen, onClose }) {
  const { role, user, logout } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const items = NAV_ITEMS.filter((n) => role.nav.includes(n.key));
  const hide = collapsed ? 'lg:hidden' : '';
  const handleLogout = () => { logout(); toast.info('You have been logged out.'); navigate('/login'); };

  return (
    <>
      {mobileOpen && <div className="fixed inset-0 z-40 bg-slate-900/50 lg:hidden" onClick={onClose} />}
      <aside className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-ink-900 text-slate-300 transition-all duration-300 ${collapsed ? 'lg:w-20' : 'lg:w-64'} ${mobileOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}>
        <div className="flex h-16 items-center justify-between border-b border-white/10 px-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-brand-400 to-brand-600 text-white shadow-lg shadow-brand-600/30"><ChefHat size={22} /></div>
            <div className={hide}><p className="text-sm font-bold leading-tight text-white">FranchiseOps <span className="text-brand-400">AI</span></p><p className="text-[10px] uppercase tracking-widest text-slate-500">Franchise Suite</p></div>
          </div>
          <button className="text-slate-400 lg:hidden" onClick={onClose}><X size={20} /></button>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
          <p className={`px-3 pb-2 text-[10px] font-semibold uppercase tracking-widest text-slate-500 ${hide}`}>Main menu</p>
          {items.map((n) => {
            const Icon = ICONS[n.icon];
            return (
              <NavLink key={n.key} to={n.path} title={n.label} onClick={onClose}
                className={({ isActive }) => `group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${collapsed ? 'lg:justify-center' : ''} ${isActive ? 'bg-brand-600 text-white shadow-md shadow-brand-600/20' : 'hover:bg-white/5 hover:text-white'}`}>
                <Icon size={19} className="shrink-0" /><span className={hide}>{n.label}</span>
              </NavLink>
            );
          })}
        </nav>

        <div className="border-t border-white/10 p-3">
          <div className={`mb-2 flex items-center gap-3 rounded-lg bg-white/5 p-2.5 ${collapsed ? 'lg:justify-center' : ''}`}>
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-500 text-xs font-bold text-white">{user.name.split(' ').map((s) => s[0]).join('')}</div>
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

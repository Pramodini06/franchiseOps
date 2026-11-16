import { useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from '../components/layout/Sidebar';
import Topbar from '../components/layout/Topbar';

export default function DashboardLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { pathname } = useLocation();
  useEffect(() => setMobileOpen(false), [pathname]);
  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar collapsed={collapsed} mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} />
      <div className={`transition-all duration-300 ${collapsed ? 'lg:pl-20' : 'lg:pl-64'}`}>
        <Topbar collapsed={collapsed} onToggleCollapse={() => setCollapsed(!collapsed)} onOpenMobile={() => setMobileOpen(true)} />
        <main className="mx-auto max-w-[1500px] p-4 md:p-6"><Outlet /></main>
      </div>
    </div>
  );
}

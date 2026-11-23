import { Navigate, Route, Routes, useLocation, Link } from 'react-router-dom';
import { ShieldAlert } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import DashboardLayout from '../layouts/DashboardLayout';
import Login from '../pages/Login';
import Dashboard from '../pages/Dashboard';
import Branches from '../pages/Branches';
import Users from '../pages/Users';
import MenuManagement from '../pages/MenuManagement';
import Orders from '../pages/Orders';
import Settings from '../pages/Settings';
import Assistant from '../pages/Assistant';
import Attendance from '../pages/Attendance';
import Inventory from '../pages/Inventory';
import Analytics from '../pages/Analytics';
import Alerts from '../pages/Alerts';

function Protected({ children }) {
  const { isAuthed, checking } = useAuth();
  const loc = useLocation();
  return checking ? <div className="flex min-h-screen items-center justify-center text-sm text-slate-500">Restoring secure session…</div> : isAuthed ? children : <Navigate to="/login" replace state={{ from: loc }} />;
}
function Guard({ k, children }) {
  const { role } = useAuth();
  if (role.nav.includes(k)) return children;
  return (
    <div className="card mx-auto mt-10 max-w-md p-8 text-center">
      <ShieldAlert className="mx-auto text-brand-600" size={36} />
      <h2 className="mt-3 text-lg font-bold">Access restricted</h2>
      <p className="mt-1 text-sm text-slate-500">The {role.label} demo role cannot open this page.</p>
      <Link to="/dashboard" className="btn-primary mt-5">Back to dashboard</Link>
    </div>
  );
}
function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 text-center">
      <p className="text-6xl font-extrabold text-brand-600">404</p>
      <p className="mt-2 text-slate-600">This page doesn’t exist.</p>
      <Link to="/dashboard" className="btn-primary mt-5">Go to dashboard</Link>
    </div>
  );
}
export default function AppRoutes() {
  const { isAuthed, checking } = useAuth();
  if (checking) return <div className="flex min-h-screen items-center justify-center text-sm text-slate-500">Restoring secure session…</div>;
  return (
    <Routes>
      <Route path="/login" element={isAuthed ? <Navigate to="/dashboard" replace /> : <Login />} />
      <Route element={<Protected><DashboardLayout /></Protected>}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Guard k="dashboard"><Dashboard /></Guard>} />
        <Route path="branches" element={<Guard k="branches"><Branches /></Guard>} />
        <Route path="users" element={<Guard k="users"><Users /></Guard>} />
        <Route path="attendance" element={<Guard k="attendance"><Attendance /></Guard>} />
        <Route path="inventory" element={<Guard k="inventory"><Inventory /></Guard>} />
        <Route path="analytics" element={<Guard k="analytics"><Analytics /></Guard>} />
        <Route path="alerts" element={<Guard k="alerts"><Alerts /></Guard>} />
        <Route path="menu" element={<Guard k="menu"><MenuManagement /></Guard>} />
        <Route path="orders" element={<Guard k="orders"><Orders /></Guard>} />
        <Route path="assistant" element={<Guard k="assistant"><Assistant /></Guard>} />
        <Route path="settings" element={<Guard k="settings"><Settings /></Guard>} />
      </Route>
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

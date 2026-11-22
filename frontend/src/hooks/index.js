import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { useOperationsPreview } from '../context/OperationsPreviewContext';
import { attendanceForDate, buildStaffRoster } from '../data/operations';
import { buildOperationalAlerts } from '../data/alerts';

export function useFakeLoad(ms = 600) {
  const [loading, setLoading] = useState(true);
  useEffect(() => { const t = setTimeout(() => setLoading(false), ms); return () => clearTimeout(t); }, [ms]);
  return loading;
}
export function usePagination(list, size = 8) {
  const [page, setPage] = useState(1);
  const pages = Math.max(1, Math.ceil(list.length / size));
  const current = Math.min(page, pages);
  return { page: current, setPage, pages, total: list.length, size, slice: list.slice((current - 1) * size, current * size) };
}
export function useOutside(onClose) {
  const ref = useRef(null);
  useEffect(() => {
    const h = (e) => ref.current && !ref.current.contains(e.target) && onClose();
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [onClose]);
  return ref;
}
// Branches visible to the current demo role.
export function useScope() {
  const { role } = useAuth();
  const { branches } = useData();
  const scopeBranches = role.scope === 'all' ? branches : branches.filter((b) => role.scope.includes(b.id));
  return { scopeBranches, ids: scopeBranches.map((b) => b.id) };
}

export function useOperationalAlerts() {
  const { role, roleKey, user } = useAuth();
  const { branches, orders, users, hasLiveData } = useData();
  const { scopeBranches, ids } = useScope();
  const {
    shifts, staffProfiles, employeeUpdates, previewEmployees, hiddenEmployeeIds,
    attendanceOverrides, inventoryItems, dismissedAlerts, readAlertIds, dismissAlert, markAlertRead, markAlertsRead
  } = useOperationsPreview();
  const date = new Date();
  const dateKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  const employees = [
    ...buildStaffRoster(users, branches).map((employee) => ({ ...employee, ...staffProfiles[employee.id], ...employeeUpdates[employee.id] })),
    ...previewEmployees
  ].filter((employee) => ids.includes(employee.branchId) && !hiddenEmployeeIds.includes(employee.id))
    .filter((employee) => roleKey !== 'staff' || employee.email === user.email);
  const overrides = Object.fromEntries(employees.map((employee) => [
    employee.id,
    attendanceOverrides[`${dateKey}:${employee.id}`]?.status
  ]));
  const generated = buildOperationalAlerts({
    branches: scopeBranches,
    orders: orders.filter((order) => ids.includes(order.branchId)),
    attendance: attendanceForDate(employees, dateKey, overrides, shifts),
    inventory: role.canManageInventory ? inventoryItems.filter((item) => ids.includes(item.branchId)) : [],
    date,
    hasLiveData,
    includeBusinessAlerts: roleKey !== 'staff',
    includeInventoryAlerts: role.canManageInventory
  });
  const routeKeys = { '/inventory': 'inventory', '/attendance': 'attendance', '/orders': 'orders', '/branches': 'branches', '/analytics': 'analytics' };
  const alerts = generated.filter((alert) => !dismissedAlerts.includes(alert.id))
    .map((alert) => ({
      ...alert,
      to: alert.to && role.nav.includes(routeKeys[alert.to]) ? alert.to : null,
      unread: !readAlertIds.includes(alert.id)
    }));
  return {
    alerts,
    unreadCount: alerts.filter((alert) => alert.unread).length,
    dismissAlert,
    markAlertRead,
    markAllRead: () => markAlertsRead(alerts.map((alert) => alert.id))
  };
}

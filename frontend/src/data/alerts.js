import { stockStatus } from './operations';

const localDate = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
const orderDate = (order) => {
  const parsed = new Date(order.date);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};
const timeLabel = (value) => {
  const date = value instanceof Date ? value : orderDate({ date: value });
  if (!date) return 'Time unavailable';
  return date.toLocaleString('en-IN', { hour: 'numeric', minute: '2-digit' });
};

export function buildOperationalAlerts({
  branches = [],
  orders = [],
  attendance = [],
  inventory = [],
  date = new Date(),
  hasLiveData = false,
  includeBusinessAlerts = true,
  includeInventoryAlerts = true
}) {
  const alerts = [];
  const branchNames = new Map(branches.map((branch) => [branch.id, branch.name]));
  const orderSource = hasLiveData ? 'Saved order data' : 'Sample order data';
  const today = localDate(date);
  const yesterdayDate = new Date(date);
  yesterdayDate.setDate(yesterdayDate.getDate() - 1);
  const yesterday = localDate(yesterdayDate);

  if (includeInventoryAlerts) {
    inventory.forEach((item) => {
      const status = stockStatus(item);
      if (status === 'In stock') return;
      const empty = status === 'Out of stock';
      alerts.push({
        id: `stock:${item.id}`,
        type: status,
        severity: empty ? 'critical' : 'warning',
        title: `${item.name} ${empty ? 'is out of stock' : 'is below minimum'}`,
        branch: branchNames.get(item.branchId) || 'Unassigned outlet',
        branchId: item.branchId,
        time: 'Current preview',
        detail: `${item.quantity} ${item.unit} available · minimum ${item.minimum} ${item.unit}.`,
        source: 'Preview only',
        to: '/inventory'
      });
    });
  }

  attendance.forEach((record) => {
    if (!['Absent', 'Late'].includes(record.status)) return;
    const absent = record.status === 'Absent';
    alerts.push({
      id: `attendance:${record.status.toLowerCase()}:${today}:${record.id}`,
      type: absent ? 'Staff absent' : 'Late arrival',
      severity: absent ? 'warning' : 'info',
      title: absent ? `${record.name} is marked absent` : `${record.name} arrived late`,
      branch: record.branchName || branchNames.get(record.branchId) || 'Unassigned outlet',
      branchId: record.branchId,
      time: absent ? 'Today · attendance preview' : `${record.checkIn} · attendance preview`,
      detail: absent ? 'Review today’s attendance record and arrange shift coverage if needed.' : `Scheduled ${record.scheduledStart}; checked in at ${record.checkIn}.`,
      source: 'Preview only',
      to: '/attendance'
    });
  });

  if (!includeBusinessAlerts) {
    return alerts.sort((a, b) => ({ critical: 0, warning: 1, info: 2 }[a.severity] - { critical: 0, warning: 1, info: 2 }[b.severity]));
  }

  branches.forEach((branch) => {
    if (branch.status !== 'Active') {
      alerts.push({
        id: `branch:${branch.id}:${branch.status}`,
        type: 'Outlet attention',
        severity: 'warning',
        title: `${branch.name} is ${String(branch.status).toLowerCase()}`,
        branch: branch.name,
        branchId: branch.id,
        time: 'Current branch record',
        detail: 'Check the outlet status and confirm whether operations need follow-up.',
        source: hasLiveData ? 'Saved branch data' : 'Sample branch data',
        to: '/branches'
      });
    } else if (Number(branch.rating) > 0 && Number(branch.rating) <= 4.2) {
      alerts.push({
        id: `rating:${branch.id}`,
        type: 'Outlet performance',
        severity: 'info',
        title: `${branch.name} has a lower customer rating`,
        branch: branch.name,
        branchId: branch.id,
        time: 'Current branch record',
        detail: `Customer rating is ${Number(branch.rating).toFixed(1)} / 5. Review recent feedback with the branch team.`,
        source: hasLiveData ? 'Saved branch data' : 'Sample branch data',
        to: '/analytics'
      });
    }
  });

  branches.forEach((branch) => {
    const branchOrders = orders.filter((order) => order.branchId === branch.id);
    const cancelled = branchOrders.filter((order) => order.status === 'Cancelled').length;
    if (branchOrders.length >= 5 && cancelled >= 2 && cancelled / branchOrders.length >= 0.2) {
      alerts.push({
        id: `cancellations:${branch.id}`,
        type: 'Order cancellations',
        severity: 'warning',
        title: `${branch.name} has a high cancellation share`,
        branch: branch.name,
        branchId: branch.id,
        time: 'Current order set',
        detail: `${cancelled} of ${branchOrders.length} loaded orders are cancelled (${Math.round(cancelled / branchOrders.length * 100)}%).`,
        source: orderSource,
        to: '/orders'
      });
    }

    const branchDaySales = (day) => branchOrders.filter((order) => {
      const parsed = orderDate(order);
      return order.status !== 'Cancelled' && parsed && localDate(parsed) === day;
    });
    const currentDay = branchDaySales(today);
    const previousDay = branchDaySales(yesterday);
    const currentSales = currentDay.reduce((sum, order) => sum + Number(order.total || 0), 0);
    const previousSales = previousDay.reduce((sum, order) => sum + Number(order.total || 0), 0);
    if (currentDay.length >= 2 && previousDay.length >= 2 && previousSales > 0 && currentSales <= previousSales * 0.6) {
      alerts.push({
        id: `sales-dip:${branch.id}:${today}`,
        type: 'Unusually low sales',
        severity: 'warning',
        title: `${branch.name} sales are below yesterday`,
        branch: branch.name,
        branchId: branch.id,
        time: 'Today',
        detail: `Saved order revenue is down ${Math.round((1 - currentSales / previousSales) * 100)}% versus yesterday. Compare orders before taking action.`,
        source: orderSource,
        to: '/analytics'
      });
    }
  });

  return alerts.sort((a, b) => ({ critical: 0, warning: 1, info: 2 }[a.severity] - { critical: 0, warning: 1, info: 2 }[b.severity]));
}

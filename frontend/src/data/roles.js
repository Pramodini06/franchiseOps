export const NAV_ITEMS = [
  { key: 'dashboard', label: 'Dashboard', path: '/dashboard', icon: 'LayoutDashboard', section: 'Overview' },
  { key: 'branches', label: 'Branches', path: '/branches', icon: 'Store', section: 'Operations' },
  { key: 'menu', label: 'Menu Management', path: '/menu', icon: 'UtensilsCrossed', section: 'Operations' },
  { key: 'orders', label: 'Orders', path: '/orders', icon: 'ShoppingBag', section: 'Operations' },
  { key: 'inventory', label: 'Inventory', path: '/inventory', icon: 'Boxes', section: 'Operations' },
  { key: 'users', label: 'Staff Management', path: '/users', icon: 'Users', section: 'People' },
  { key: 'attendance', label: 'Attendance', path: '/attendance', icon: 'CalendarDays', section: 'People' },
  { key: 'analytics', label: 'Analytics', path: '/analytics', icon: 'BarChart3', section: 'Insights' },
  { key: 'assistant', label: 'AI Assistant', path: '/assistant', icon: 'MessageCircle', section: 'Insights' },
  { key: 'alerts', label: 'Operational Alerts', path: '/alerts', icon: 'BellRing', section: 'Insights' },
  { key: 'settings', label: 'Settings', path: '/settings', icon: 'Settings', section: 'System' }
];
const ALL = NAV_ITEMS.map((n) => n.key);
// Frontend-only role simulation. NOT real security.
export const ROLES = {
  super_admin: { label: 'Super Admin', tagline: 'All franchise outlets & platform control', user: { name: 'Rohan Mehta', email: 'admin@franchiseops.ai', title: 'Platform Super Admin' }, nav: ALL, scope: 'all', canManageBranches: true, canManageUsers: true, canManageStaff: true, canManageAttendance: true, canManageInventory: true, canEditMenu: true },
  franchise_owner: { label: 'Franchise Owner', tagline: 'Bengaluru, Tumakuru & Mysuru outlets', user: { name: 'Ananya Rao', email: 'owner@franchiseops.ai', title: 'Owner · South Karnataka Group' }, nav: ALL, scope: ['b1', 'b2', 'b3', 'b4'], canManageBranches: true, canManageUsers: true, canManageStaff: true, canManageAttendance: true, canManageInventory: true, canEditMenu: true },
  branch_manager: { label: 'Branch Manager', tagline: 'Hubballi Gokul Road outlet', user: { name: 'Suresh Kulkarni', email: 'manager@franchiseops.ai', title: 'Manager · Hubballi Gokul Road' }, nav: ['dashboard', 'menu', 'orders', 'users', 'attendance', 'inventory', 'analytics', 'assistant', 'alerts', 'settings'], scope: ['b5'], canManageBranches: false, canManageUsers: false, canManageStaff: true, canManageAttendance: true, canManageInventory: true, canEditMenu: true },
  staff: { label: 'Staff', tagline: 'Counter & kitchen operations', user: { name: 'Priya Naik', email: 'staff@franchiseops.ai', title: 'Counter Staff · Hubballi' }, nav: ['dashboard', 'menu', 'orders', 'attendance', 'assistant', 'alerts', 'settings'], scope: ['b5'], canManageBranches: false, canManageUsers: false, canManageStaff: false, canManageAttendance: false, canManageInventory: false, canEditMenu: false }
};

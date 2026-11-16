export const NAV_ITEMS = [
  { key: 'dashboard', label: 'Dashboard', path: '/dashboard', icon: 'LayoutDashboard' },
  { key: 'branches', label: 'Branch Management', path: '/branches', icon: 'Store' },
  { key: 'users', label: 'User Management', path: '/users', icon: 'Users' },
  { key: 'menu', label: 'Menu Management', path: '/menu', icon: 'UtensilsCrossed' },
  { key: 'orders', label: 'Order Management', path: '/orders', icon: 'ShoppingBag' },
  { key: 'settings', label: 'Settings', path: '/settings', icon: 'Settings' }
];
const ALL = NAV_ITEMS.map((n) => n.key);
// Frontend-only role simulation. NOT real security.
export const ROLES = {
  super_admin: { label: 'Super Admin', tagline: 'All franchise outlets & platform control', user: { name: 'Rohan Mehta', email: 'admin@franchiseops.ai', title: 'Platform Super Admin' }, nav: ALL, scope: 'all', canManageBranches: true, canManageUsers: true, canEditMenu: true },
  franchise_owner: { label: 'Franchise Owner', tagline: 'Bengaluru, Tumakuru & Mysuru outlets', user: { name: 'Ananya Rao', email: 'owner@franchiseops.ai', title: 'Owner · South Karnataka Group' }, nav: ALL, scope: ['b1', 'b2', 'b3', 'b4'], canManageBranches: true, canManageUsers: true, canEditMenu: true },
  branch_manager: { label: 'Branch Manager', tagline: 'Hubballi Gokul Road outlet', user: { name: 'Suresh Kulkarni', email: 'manager@franchiseops.ai', title: 'Manager · Hubballi Gokul Road' }, nav: ['dashboard', 'menu', 'orders', 'settings'], scope: ['b5'], canManageBranches: false, canManageUsers: false, canEditMenu: true },
  staff: { label: 'Staff', tagline: 'Counter & kitchen operations', user: { name: 'Priya Naik', email: 'staff@franchiseops.ai', title: 'Counter Staff · Hubballi' }, nav: ['dashboard', 'menu', 'orders', 'settings'], scope: ['b5'], canManageBranches: false, canManageUsers: false, canEditMenu: false }
};

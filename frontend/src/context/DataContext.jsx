import { createContext, useContext, useState } from 'react';
import { initialBranches } from '../data/branches';
import { initialMenu } from '../data/menu';
import { initialOrders } from '../data/orders';
import { initialUsers } from '../data/users';
import { calcTotals, uid } from '../utils/format';

const Ctx = createContext(null);

// In-memory store. In later modules, replace these helpers with API calls.
export function DataProvider({ children }) {
  const [branches, setBranches] = useState(initialBranches);
  const [menu, setMenu] = useState(initialMenu);
  const [orders, setOrders] = useState(initialOrders);
  const [users, setUsers] = useState(initialUsers);

  const value = {
    branches, menu, orders, users,
    addBranch: (b) => setBranches((p) => [{ ...b, id: 'b' + uid(), short: b.city, revenue: 0, orders: 0, rating: 0, opened: new Date().toISOString().slice(0, 10) }, ...p]),
    updateBranch: (id, b) => setBranches((p) => p.map((x) => (x.id === id ? { ...x, ...b } : x))),
    deleteBranch: (id) => setBranches((p) => p.filter((x) => x.id !== id)),

    addMenuItem: (i) => setMenu((p) => [{ ...i, id: 'm' + uid(), sold: 0 }, ...p]),
    updateMenuItem: (id, i) => setMenu((p) => p.map((x) => (x.id === id ? { ...x, ...i } : x))),
    deleteMenuItem: (id) => setMenu((p) => p.filter((x) => x.id !== id)),

    addOrder: (o) => {
      const max = orders.reduce((m, x) => Math.max(m, Number(x.id.split('-')[2])), 1000);
      const order = { ...o, ...calcTotals(o.lines), id: `FO-2611-${max + 1}`, status: 'Placed', date: new Date().toISOString() };
      setOrders((p) => [order, ...p]);
      return order;
    },
    setOrderStatus: (id, status) => setOrders((p) => p.map((x) => (x.id === id ? { ...x, status } : x))),

    addUser: (u) => setUsers((p) => [{ ...u, id: 'u' + uid(), lastLogin: 'Never' }, ...p]),
    updateUser: (id, u) => setUsers((p) => p.map((x) => (x.id === id ? { ...x, ...u } : x))),
    deleteUser: (id) => setUsers((p) => p.filter((x) => x.id !== id))
  };
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
export const useData = () => useContext(Ctx);

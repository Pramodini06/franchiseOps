import { initialMenu } from './menu';
import { calcTotals } from '../utils/format';

let seed = 11;
const rnd = () => (seed = (seed * 9301 + 49297) % 233280) / 233280;
const names = ['Aarav Patil', 'Sneha Hegde', 'Kiran Naik', 'Divya Bhat', 'Rahul Joshi', 'Pooja Shenoy', 'Mohammed Irfan', 'Anjali Desai', 'Karthik Murthy', 'Meghana Rao', 'Sandeep Kamath', 'Revathi Iyer', 'Harish Gowda', 'Nandini Pai'];
const types = ['Dine-in', 'Takeaway', 'Delivery'];
const pays = ['UPI', 'Card', 'Cash'];
const ids = ['b1', 'b2', 'b3', 'b4', 'b5', 'b6'];

export const initialOrders = Array.from({ length: 34 }, (_, i) => {
  const branchId = i % 3 === 0 ? 'b5' : ids[(i * 5 + Math.floor(rnd() * 3)) % 6];
  const pool = initialMenu.filter((x) => x.branches.includes(branchId) && x.available);
  const lines = Array.from({ length: 1 + Math.floor(rnd() * 3) }, () => {
    const it = pool[Math.floor(rnd() * pool.length)];
    return { itemId: it.id, name: it.name, price: it.price, qty: 1 + Math.floor(rnd() * 3) };
  }).filter((l, idx, a) => a.findIndex((x) => x.itemId === l.itemId) === idx);
  const status = i < 3 ? 'Placed' : i < 6 ? 'Preparing' : i < 8 ? 'Ready' : i % 9 === 0 ? 'Cancelled' : 'Completed';
  return {
    id: `FO-2611-${1034 - i}`, customer: names[(i * 3) % names.length], phone: `98${String(45000000 + i * 91731).slice(0, 8)}`,
    branchId, type: types[i % 3], payment: pays[(i + 1) % 3], status, lines, ...calcTotals(lines),
    date: new Date(Date.now() - i * 38 * 60000).toISOString()
  };
});

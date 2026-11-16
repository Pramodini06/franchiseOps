export const TAX_RATE = 0.05; // 5% GST (demo)
export const fmtINR = (n) => '₹' + Math.round(n).toLocaleString('en-IN');
export const fmtShort = (n) => n >= 1e7 ? `₹${(n / 1e7).toFixed(1)}Cr` : n >= 1e5 ? `₹${(n / 1e5).toFixed(1)}L` : n >= 1e3 ? `₹${(n / 1e3).toFixed(0)}K` : `₹${Math.round(n)}`;
export const fmtDate = (d) => new Date(d).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
export const timeAgo = (d) => {
  const m = Math.max(1, Math.round((Date.now() - new Date(d).getTime()) / 60000));
  return m < 60 ? `${m} min ago` : m < 1440 ? `${Math.floor(m / 60)} hr ago` : `${Math.floor(m / 1440)} d ago`;
};
export const uid = () => Math.random().toString(36).slice(2, 8);
export const calcTotals = (lines) => {
  const subtotal = lines.reduce((s, l) => s + l.price * l.qty, 0);
  const tax = subtotal * TAX_RATE;
  return { subtotal, tax, total: subtotal + tax };
};

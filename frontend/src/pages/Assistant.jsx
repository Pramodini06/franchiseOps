import { useEffect, useMemo, useRef, useState } from 'react';
import { Bot, CircleHelp, Eraser, Send, Sparkles, UserRound } from 'lucide-react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { useOperationsPreview } from '../context/OperationsPreviewContext';
import { useScope } from '../hooks';
import { attendanceForDate, buildStaffRoster, stockStatus } from '../data/operations';
import { PageHeader } from '../components/ui/misc';
import { fmtINR } from '../utils/format';

const SUGGESTIONS = [
  'Which outlet performed best this week?',
  'Which menu item is selling the most?',
  'Show me low-stock items.',
  'How is staff attendance today?',
  'Why did sales decrease?',
  "Summarize today's operations."
];

const localDate = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
const orderDay = (order) => {
  const date = new Date(order.date);
  return Number.isNaN(date.getTime()) ? '' : localDate(date);
};
const totalRevenue = (orders) => orders.filter((order) => order.status !== 'Cancelled').reduce((sum, order) => sum + Number(order.total || 0), 0);

function comparePeriods(orders, ids, today) {
  const end = new Date(`${today}T00:00:00`);
  const currentStart = new Date(end);
  currentStart.setDate(currentStart.getDate() - 6);
  const previousEnd = new Date(currentStart);
  previousEnd.setDate(previousEnd.getDate() - 1);
  const previousStart = new Date(previousEnd);
  previousStart.setDate(previousStart.getDate() - 6);
  const inRange = (order, start, finish) => {
    const date = orderDay(order);
    return ids.includes(order.branchId) && date >= localDate(start) && date <= localDate(finish);
  };
  const current = orders.filter((order) => inRange(order, currentStart, end));
  const previous = orders.filter((order) => inRange(order, previousStart, previousEnd));
  return { current, previous, currentStart, previousStart, end, previousEnd };
}

export default function Assistant() {
  const { role, roleKey, user } = useAuth();
  const { orders, branches, menu, users, hasLiveData } = useData();
  const { ids, scopeBranches } = useScope();
  const {
    shifts, staffProfiles, employeeUpdates, previewEmployees, hiddenEmployeeIds,
    attendanceOverrides, inventoryItems
  } = useOperationsPreview();
  const [messages, setMessages] = useState([]);
  const [question, setQuestion] = useState('');
  const [busy, setBusy] = useState(false);
  const endRef = useRef(null);
  const today = localDate(new Date());
  const scopedOrders = useMemo(() => orders.filter((order) => ids.includes(order.branchId)), [orders, ids]);
  const roster = useMemo(() => [
    ...buildStaffRoster(users, branches).map((employee) => ({ ...employee, ...staffProfiles[employee.id], ...employeeUpdates[employee.id] })),
    ...previewEmployees
  ].filter((employee) => ids.includes(employee.branchId) && !hiddenEmployeeIds.includes(employee.id))
    .filter((employee) => roleKey !== 'staff' || employee.email === user.email), [
    users, branches, ids, staffProfiles, employeeUpdates, previewEmployees, hiddenEmployeeIds, roleKey, user.email
  ]);
  const dailyAttendance = useMemo(() => {
    const overrides = Object.fromEntries(roster.map((employee) => [employee.id, attendanceOverrides[`${today}:${employee.id}`]?.status]));
    return attendanceForDate(roster, today, overrides, shifts);
  }, [roster, today, attendanceOverrides, shifts]);
  const scopedInventory = inventoryItems.filter((item) => ids.includes(item.branchId));

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' }); }, [messages, busy]);

  const previewAnswer = (text) => {
    const q = text.toLowerCase().replace(/[-_]/g, ' ');
    const source = hasLiveData ? 'Saved order data' : 'Sample order data';
    const window = comparePeriods(scopedOrders, ids, today);

    if (q.includes('low stock') || q.includes('stock level') || q.includes('out of stock')) {
      const items = scopedInventory.filter((item) => stockStatus(item) !== 'In stock');
      const details = items.length
        ? items.map((item) => `${item.name}: ${item.quantity} ${item.unit} at ${branches.find((branch) => branch.id === item.branchId)?.name || 'an outlet'} (${stockStatus(item).toLowerCase()})`).join('; ')
        : 'No low or out-of-stock items in this preview.';
      return { text: `${details}\n\nInventory is a frontend preview; these values are not connected to a live stock API.`, source: 'Preview only' };
    }

    if (q.includes('attendance') || q.includes('late staff') || q.includes('absent staff')) {
      const counts = ['Present', 'Late', 'Absent', 'Half-day', 'On leave'].map((status) => `${status}: ${dailyAttendance.filter((record) => record.status === status).length}`);
      return { text: `Today's sample attendance for your permitted scope — ${counts.join(' · ')}.\n\nAttendance is generated preview data, not a saved attendance record.`, source: 'Preview only' };
    }

    if (q.includes('selling the most') || q.includes('most popular') || q.includes('popular item')) {
      const units = new Map();
      scopedOrders.filter((order) => order.status !== 'Cancelled').forEach((order) => order.lines.forEach((line) => {
        units.set(line.itemId, (units.get(line.itemId) || 0) + Number(line.qty || 0));
      }));
      const top = [...units.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);
      const names = new Map(menu.map((item) => [item.id, item.name]));
      return {
        text: top.length
          ? `Top items by units in the available order set: ${top.map(([id, count]) => `${names.get(id) || id} (${count})`).join(', ')}.`
          : 'No item sales were found in the available order set.',
        source
      };
    }

    if (q.includes('selling poorly') || q.includes('poorly') || q.includes('low performing') || q.includes('least sold')) {
      const units = new Map();
      scopedOrders.filter((order) => order.status !== 'Cancelled').forEach((order) => order.lines.forEach((line) => {
        units.set(line.itemId, (units.get(line.itemId) || 0) + Number(line.qty || 0));
      }));
      const scopedMenu = menu.filter((item) => item.branches.some((branchId) => ids.includes(branchId)));
      const bottom = scopedMenu.map((item) => ({ name: item.name, units: units.get(item.id) || 0 })).sort((a, b) => a.units - b.units).slice(0, 5);
      const list = bottom.map((item) => `${item.name} (${item.units} units)`).join(', ');
      return { text: `Lowest units in the available order set: ${list || 'No menu item sales found.'}\n\nThis ranks saved orders when connected, or the sample order set otherwise; it is not a full-period demand forecast.`, source };
    }

    if ((q.includes('outlet') || q.includes('branch')) && q.includes('week') && (q.includes('best') || q.includes('perform'))) {
      const weekStart = new Date(`${today}T00:00:00`);
      weekStart.setDate(weekStart.getDate() - ((weekStart.getDay() + 6) % 7));
      const weekOrders = scopedOrders.filter((order) => {
        const day = orderDay(order);
        return day >= localDate(weekStart) && day <= today && order.status !== 'Cancelled';
      });
      const byBranch = scopeBranches.map((branch) => ({
        branch,
        revenue: totalRevenue(weekOrders.filter((order) => order.branchId === branch.id))
      })).sort((a, b) => b.revenue - a.revenue);
      return {
        text: weekOrders.length
          ? `${byBranch[0].branch.name} leads this week so far with ${fmtINR(byBranch[0].revenue)} in saved, non-cancelled orders (${weekOrders.length} orders across your scope).`
          : 'There are no non-cancelled orders in this week’s available records, so I can’t rank outlets yet.',
        source
      };
    }

    if ((q.includes('outlet') || q.includes('branch')) && (q.includes('drop') || q.includes('decrease') || q.includes('decline'))) {
      const comparisons = scopeBranches.map((branch) => {
        const inRange = (order, start, end) => order.branchId === branch.id && orderDay(order) >= localDate(start) && orderDay(order) <= localDate(end);
        const current = scopedOrders.filter((order) => inRange(order, window.currentStart, window.end));
        const previous = scopedOrders.filter((order) => inRange(order, window.previousStart, window.previousEnd));
        const currentRevenue = totalRevenue(current);
        const previousRevenue = totalRevenue(previous);
        return { branch, currentRevenue, previousRevenue, current, previous, change: previousRevenue ? (currentRevenue - previousRevenue) / previousRevenue : null };
      }).filter((entry) => entry.change !== null && entry.previous.length);
      const drops = comparisons.filter((entry) => entry.change < 0).sort((a, b) => a.change - b.change);
      return {
        text: drops.length
          ? `${drops[0].branch.name} has the largest measured seven-day decline (${Math.round(Math.abs(drops[0].change) * 100)}%): ${fmtINR(drops[0].currentRevenue)} in the latest window versus ${fmtINR(drops[0].previousRevenue)} in the prior one. This identifies a change, not its cause.`
          : 'No outlet has a measurable seven-day revenue drop in the available records. A comparison requires saved orders in both periods.',
        source
      };
    }

    if (q.includes('decrease') || q.includes('drop') || q.includes('decline')) {
      const currentRevenue = totalRevenue(window.current);
      const previousRevenue = totalRevenue(window.previous);
      if (!window.previous.length) {
        return { text: `I can't confirm a revenue decrease: there are no orders in the comparable previous seven-day window (${localDate(window.previousStart)}–${localDate(window.previousEnd)}).`, source };
      }
      const change = previousRevenue ? Math.round((currentRevenue - previousRevenue) / previousRevenue * 100) : null;
      const conclusion = change === null
        ? 'The previous window has no non-cancelled revenue baseline, so a percentage comparison is unavailable.'
        : change < 0
          ? `Revenue is ${Math.abs(change)}% lower in the latest seven days (${fmtINR(currentRevenue)}) than the preceding seven days (${fmtINR(previousRevenue)}).`
          : `Revenue is ${change}% higher in the latest seven days (${fmtINR(currentRevenue)}) than the preceding seven days (${fmtINR(previousRevenue)}).`;
      return { text: `${conclusion}\n\nOrder totals show the change, but they do not establish its cause. Compare outlet and order mix in Analytics.`, source };
    }

    if (q.includes('summarize') || q.includes('summary') || q.includes('today') && q.includes('operation')) {
      const todayOrders = scopedOrders.filter((order) => orderDay(order) === today);
      const lowStock = scopedInventory.filter((item) => stockStatus(item) !== 'In stock');
      const absent = dailyAttendance.filter((record) => record.status === 'Absent').length;
      const pending = todayOrders.filter((order) => order.status === 'Placed').length;
      return {
        text: `Orders for today: ${todayOrders.length} (${pending} pending). ${lowStock.length} low/out-of-stock items and ${absent} sample absences are visible in the preview modules. Attendance and inventory figures are not live backend data.`,
        source: `${source} + preview signals`
      };
    }
    return null;
  };

  const ask = async (text = question) => {
    const q = text.trim();
    if (!q || busy) return;
    setMessages((current) => [...current, { role: 'user', text: q }]);
    setQuestion('');
    setBusy(true);
    try {
      const preview = previewAnswer(q);
      if (preview) {
        setMessages((current) => [...current, { role: 'assistant', ...preview }]);
      } else {
        const result = await api('/assistant/ask', { method: 'POST', body: JSON.stringify({ question: q }) });
        setMessages((current) => [...current, {
          role: 'assistant',
          text: result.answer,
          source: `Saved backend data · ${result.scope || role.label}${result.asOf ? ` · as of ${new Date(result.asOf).toLocaleString('en-IN')}` : ''}`
        }]);
      }
    } catch (error) {
      setMessages((current) => [...current, { role: 'assistant', text: `I couldn't reach the business data service: ${error.message}. Check the backend connection and try again.`, source: 'Service unavailable' }]);
    } finally {
      setBusy(false);
    }
  };

  const clearConversation = () => {
    setMessages([]);
    setQuestion('');
  };

  return (
    <>
      <PageHeader title="AI Business Assistant" subtitle={`Explore operational questions · scoped to ${role.label.toLowerCase()}`}
        actions={<button type="button" className="btn-ghost" onClick={clearConversation} disabled={!messages.length && !question}><Eraser size={15} /> Clear conversation</button>} />
      <div className="mx-auto flex min-h-[65vh] max-w-5xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-4 py-4 sm:px-6">
          <div className="flex items-center gap-3"><div className="rounded-xl bg-brand-50 p-2 text-brand-700"><Sparkles size={20} /></div><div><h2 className="font-semibold">FoodOps Assistant</h2><p className="text-xs text-slate-500">Answers are based on authorized saved records or clearly labeled previews</p></div></div>
          <span className="hidden items-center gap-1.5 rounded-full bg-slate-50 px-3 py-1 text-[11px] text-slate-500 sm:inline-flex"><CircleHelp size={13} /> Rule-based business queries</span>
        </div>
        <div className="flex-1 space-y-4 overflow-y-auto bg-[#fafbf8] p-4 sm:p-6" aria-live="polite">
          {!messages.length ? (
            <div className="mx-auto max-w-3xl py-5">
              <div className="mb-6 text-center"><div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-50 text-brand-700"><Bot size={24} /></div><h3 className="text-lg font-semibold text-slate-900">What would you like to understand?</h3><p className="mt-1 text-sm text-slate-500">Ask a question or choose an insight. Preview-only answers are labeled.</p></div>
              <div className="grid gap-2 sm:grid-cols-2">{SUGGESTIONS.map((suggestion) => <button key={suggestion} type="button" onClick={() => ask(suggestion)} className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-left text-sm text-slate-700 transition hover:border-brand-300 hover:bg-brand-50/40"><span className="flex items-start gap-2"><Sparkles size={15} className="mt-0.5 shrink-0 text-brand-700" />{suggestion}</span></button>)}</div>
            </div>
          ) : messages.map((message, index) => (
            <div key={`${message.role}-${index}`} className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : ''}`}>
              <div className={`flex max-w-[88%] gap-3 ${message.role === 'user' ? 'flex-row-reverse' : ''}`}>
                <div className={`mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${message.role === 'user' ? 'bg-slate-200 text-slate-700' : 'bg-brand-100 text-brand-700'}`}>{message.role === 'user' ? <UserRound size={16} /> : <Bot size={17} />}</div>
                <div className={`min-w-0 rounded-2xl px-4 py-3 text-sm leading-relaxed ${message.role === 'user' ? 'bg-brand-700 text-white' : 'border border-slate-200 bg-white text-slate-800'}`}>
                  <p className="whitespace-pre-line">{message.text}</p>
                  {message.source && <p className={`mt-2 border-t pt-2 text-[10px] ${message.role === 'user' ? 'border-white/20 text-white/70' : 'border-slate-100 text-slate-400'}`}>{message.source}</p>}
                </div>
              </div>
            </div>
          ))}
          {busy && <div className="flex items-center gap-2 pl-11 text-xs text-slate-500"><span className="h-3 w-3 animate-spin rounded-full border-2 border-brand-200 border-t-brand-700" />Checking permitted data…</div>}
          <div ref={endRef} />
        </div>
        <form className="flex gap-2 border-t border-slate-100 bg-white p-3 sm:p-4" onSubmit={(event) => { event.preventDefault(); ask(); }}>
          <input className="input flex-1" value={question} onChange={(event) => setQuestion(event.target.value)} placeholder="Ask about outlets, sales, orders, stock, or attendance…" maxLength={500} disabled={busy} aria-label="Ask the FoodOps Assistant" />
          <button type="submit" className="btn-primary" disabled={busy || !question.trim()} aria-label="Send question"><Send size={16} /><span className="hidden sm:inline">Send</span></button>
        </form>
      </div>
      <p className="mx-auto mt-3 max-w-5xl text-xs text-slate-400">Saved order and branch questions use the authorized backend query service. Attendance and inventory questions use sample previews only. <Link className="font-medium text-brand-700 hover:underline" to="/analytics">Open analytics</Link> · <Link className="font-medium text-brand-700 hover:underline" to="/alerts">View alerts</Link></p>
    </>
  );
}

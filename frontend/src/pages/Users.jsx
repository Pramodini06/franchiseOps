import { useState } from 'react';
import { Pencil, Plus, Search, Trash2 } from 'lucide-react';
import { useData } from '../context/DataContext';
import { useToast } from '../context/ToastContext';
import { useFakeLoad, usePagination } from '../hooks';
import { USER_ROLES } from '../data/users';
import UserFormModal from '../components/users/UserFormModal';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import Pagination from '../components/ui/Pagination';
import StatusBadge from '../components/ui/StatusBadge';
import { EmptyState, PageHeader, TableSkeleton } from '../components/ui/misc';

const ROLE_STYLE = { 'Super Admin': 'bg-brand-50 text-brand-700', 'Franchise Owner': 'bg-violet-50 text-violet-700', 'Branch Manager': 'bg-sky-50 text-sky-700', Staff: 'bg-slate-100 text-slate-700' };

export default function Users() {
  const { users, branches, addUser, updateUser, deleteUser } = useData();
  const toast = useToast();
  const loading = useFakeLoad();
  const [q, setQ] = useState(''); const [role, setRole] = useState('All');
  const [form, setForm] = useState({ open: false, user: null }); const [del, setDel] = useState(null);
  const list = users.filter((u) => (role === 'All' || u.role === role) && `${u.name} ${u.email}`.toLowerCase().includes(q.toLowerCase()));
  const pg = usePagination(list, 7);
  const bName = (id) => (id === 'all' ? 'All branches' : branches.find((b) => b.id === id)?.name || '—');

  const save = (data) => {
    if (form.user) { updateUser(form.user.id, data); toast.success(`${data.name} updated.`); } else { addUser(data); toast.success(`${data.name} added.`); }
    setForm({ open: false, user: null });
  };
  return (
    <>
      <PageHeader title="User Management" subtitle="Manage owners, managers and staff accounts" actions={<button className="btn-primary" onClick={() => setForm({ open: true, user: null })}><Plus size={16} /> Add user</button>} />
      <div className="card">
        <div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row">
          <div className="relative flex-1"><Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /><input className="input pl-9" placeholder="Search by name or email…" value={q} onChange={(e) => setQ(e.target.value)} /></div>
          <select className="input sm:w-52" value={role} onChange={(e) => setRole(e.target.value)}><option value="All">All roles</option>{USER_ROLES.map((r) => <option key={r}>{r}</option>)}</select>
        </div>
        {loading ? <TableSkeleton /> : list.length === 0 ? <EmptyState /> : (
          <div className="overflow-x-auto"><table className="w-full min-w-[820px]">
            <thead className="bg-slate-50"><tr><th className="th">User</th><th className="th">Role</th><th className="th">Branch</th><th className="th">Last login</th><th className="th">Status</th><th className="th">Actions</th></tr></thead>
            <tbody className="divide-y divide-slate-100">{pg.slice.map((u) => (
              <tr key={u.id} className="hover:bg-slate-50">
                <td className="td"><div className="flex items-center gap-3"><span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-100 text-xs font-bold text-brand-700">{u.name.split(' ').map((s) => s[0]).join('').slice(0, 2)}</span><div><p className="font-semibold text-slate-900">{u.name}</p><p className="text-xs text-slate-500">{u.email}</p></div></div></td>
                <td className="td"><span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${ROLE_STYLE[u.role]}`}>{u.role}</span></td>
                <td className="td text-slate-600">{bName(u.branchId)}</td><td className="td text-xs text-slate-500">{u.lastLogin}</td>
                <td className="td"><StatusBadge status={u.status} /></td>
                <td className="td"><div className="flex"><button className="icon-btn" onClick={() => setForm({ open: true, user: u })}><Pencil size={16} /></button><button className="icon-btn hover:!bg-red-50 hover:!text-red-600" onClick={() => setDel(u)}><Trash2 size={16} /></button></div></td>
              </tr>))}</tbody></table></div>)}
        {!loading && <Pagination {...pg} onChange={pg.setPage} />}
      </div>
      <UserFormModal open={form.open} user={form.user} onClose={() => setForm({ open: false, user: null })} onSave={save} />
      <ConfirmDialog open={!!del} title="Delete user?" message={`${del?.name} will lose access to FranchiseOps AI.`} onCancel={() => setDel(null)} onConfirm={() => { deleteUser(del.id); toast.success(`${del.name} deleted.`); setDel(null); }} />
    </>
  );
}

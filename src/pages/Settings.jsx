import { useState } from 'react';
import { Bell, Building2, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Field, PageHeader, Spinner, Switch } from '../components/ui/misc';

const TABS = [['profile', 'Profile', User], ['business', 'Franchise', Building2], ['notifications', 'Notifications', Bell]];

export default function Settings() {
  const { user, role } = useAuth();
  const toast = useToast();
  const [tab, setTab] = useState('profile');
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState({ name: user.name, email: user.email, phone: '9900011100' });
  const [biz, setBiz] = useState({ brand: 'Spice Route Kitchens', gst: '29ABCDE1234F1Z5', tax: '5', currency: 'INR (₹)' });
  const [notif, setNotif] = useState({ orders: true, lowStock: true, weekly: true, sms: false });
  const save = (msg) => { setSaving(true); setTimeout(() => { setSaving(false); toast.success(msg); }, 700); };
  const Save = ({ msg }) => <button className="btn-primary" disabled={saving} onClick={() => save(msg)}>{saving && <Spinner />}Save changes</button>;

  return (
    <>
      <PageHeader title="Settings" subtitle="Manage your account and workspace preferences" />
      <div className="grid gap-6 lg:grid-cols-4">
        <div className="card h-fit p-2">{TABS.map(([k, l, I]) => <button key={k} onClick={() => setTab(k)} className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium ${tab === k ? 'bg-brand-50 text-brand-700' : 'text-slate-600 hover:bg-slate-50'}`}><I size={17} />{l}</button>)}</div>
        <div className="card p-6 lg:col-span-3">
          {tab === 'profile' && <div className="space-y-5">
            <div className="flex items-center gap-4"><span className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-brand-400 to-brand-600 text-xl font-bold text-white">{user.name.split(' ').map((s) => s[0]).join('')}</span><div><p className="font-semibold">{user.name}</p><p className="text-sm text-slate-500">{user.title}</p><span className="mt-1 inline-block rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-medium text-brand-700">{role.label}</span></div></div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Full name"><input className="input" value={profile.name} onChange={(e) => setProfile({ ...profile, name: e.target.value })} /></Field>
              <Field label="Email"><input className="input" value={profile.email} onChange={(e) => setProfile({ ...profile, email: e.target.value })} /></Field>
              <Field label="Phone"><input className="input" value={profile.phone} onChange={(e) => setProfile({ ...profile, phone: e.target.value })} /></Field>
            </div><Save msg="Profile updated successfully." /></div>}
          {tab === 'business' && <div className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Franchise brand name"><input className="input" value={biz.brand} onChange={(e) => setBiz({ ...biz, brand: e.target.value })} /></Field>
              <Field label="GSTIN"><input className="input" value={biz.gst} onChange={(e) => setBiz({ ...biz, gst: e.target.value })} /></Field>
              <Field label="Default tax rate (%)"><input className="input" value={biz.tax} onChange={(e) => setBiz({ ...biz, tax: e.target.value })} /></Field>
              <Field label="Currency"><select className="input" value={biz.currency} onChange={(e) => setBiz({ ...biz, currency: e.target.value })}><option>INR (₹)</option></select></Field>
            </div><Save msg="Franchise settings saved." /></div>}
          {tab === 'notifications' && <div className="space-y-5">
            {[['orders', 'New order alerts', 'Get notified when orders are placed'], ['lowStock', 'Low stock alerts', 'Ingredient stock below threshold'], ['weekly', 'Weekly performance report', 'Summary every Monday morning'], ['sms', 'SMS notifications', 'Receive critical alerts by SMS']].map(([k, t, d]) => (
              <div key={k} className="flex items-center justify-between gap-4 border-b border-slate-100 pb-4 last:border-0"><div><p className="text-sm font-semibold">{t}</p><p className="text-xs text-slate-500">{d}</p></div><Switch checked={notif[k]} onChange={(v) => setNotif({ ...notif, [k]: v })} /></div>))}
            <Save msg="Notification preferences saved." /></div>}
        </div>
      </div>
    </>
  );
}

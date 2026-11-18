import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ChefHat, Eye, EyeOff, Lock, Mail, ShieldCheck, TrendingUp, Store, BarChart3 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { ROLES } from '../data/roles';
import Modal from '../components/ui/Modal';
import { Field, Spinner } from '../components/ui/misc';

export default function Login() {
  const { login } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const loc = useLocation();
  const remembered = localStorage.getItem('fops_email');
  const rememberedRole = Object.entries(ROLES).find(([, r]) => r.user.email === remembered)?.[0] || 'super_admin';
  const [roleKey, setRoleKey] = useState(rememberedRole);
  const [email, setEmail] = useState(remembered || ROLES.super_admin.user.email);
  const [password, setPassword] = useState('demo1234');
  const [show, setShow] = useState(false);
  const [remember, setRemember] = useState(!!remembered);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [forgot, setForgot] = useState(false);
  const [resetEmail, setResetEmail] = useState('');

  const pickRole = (k) => { setRoleKey(k); setEmail(ROLES[k].user.email); setPassword('demo1234'); setErrors({}); };
  const submit = async (e) => {
    e.preventDefault();
    const er = {};
    if (!/^\S+@\S+\.\S+$/.test(email)) er.email = 'Enter a valid email address';
    if (password.length < 6) er.password = 'Password must be at least 6 characters';
    setErrors(er);
    if (Object.keys(er).length) { toast.error('Please fix the highlighted fields.'); return; }
    setLoading(true);
    try {
      remember ? localStorage.setItem('fops_email', email) : localStorage.removeItem('fops_email');
      const session = await login(email, password);
      toast.success(`Welcome back, ${session.user.name.split(' ')[0]}!`);
      navigate(loc.state?.from?.pathname || '/dashboard', { replace: true });
    } catch (err) { toast.error(err.message || 'Unable to sign in.'); }
    finally { setLoading(false); }
  };
  const sendReset = () => {
    if (!/^\S+@\S+\.\S+$/.test(resetEmail)) { toast.error('Enter a valid email address.'); return; }
    toast.success(`Password reset link sent to ${resetEmail} (demo).`); setForgot(false); setResetEmail('');
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="relative hidden flex-col justify-between overflow-hidden bg-ink-900 p-12 text-white lg:flex">
        <div className="absolute -right-24 -top-24 h-96 w-96 rounded-full bg-brand-600/30 blur-3xl" />
        <div className="absolute -bottom-32 -left-20 h-96 w-96 rounded-full bg-amber-500/20 blur-3xl" />
        <div className="relative flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-brand-400 to-brand-600"><ChefHat size={24} /></div>
          <span className="text-xl font-bold">FranchiseOps <span className="text-brand-400">AI</span></span>
        </div>
        <div className="relative">
          <h1 className="text-4xl font-extrabold leading-tight">Run every outlet <br />like it’s your <span className="text-brand-400">only one.</span></h1>
          <p className="mt-4 max-w-md text-slate-400">Agentic franchise operations intelligence for restaurant and food chains — branches, menus, orders and performance in one place.</p>
          <div className="mt-10 space-y-4">
            {[[Store, 'Multi-branch control', 'Bengaluru, Tumakuru, Mysuru, Hubballi, Mangaluru'], [BarChart3, 'Live revenue insights', 'Branch-wise sales and order analytics'], [ShieldCheck, 'Role-based workspaces', 'Owner, manager and staff views']].map(([I, t, d]) => (
              <div key={t} className="flex items-start gap-3"><div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/10 text-brand-300"><I size={18} /></div><div><p className="text-sm font-semibold">{t}</p><p className="text-xs text-slate-400">{d}</p></div></div>
            ))}
          </div>
        </div>
        <p className="relative flex items-center gap-2 text-xs text-slate-500"><TrendingUp size={14} /> Module 1 · Frontend prototype</p>
      </div>

      <div className="flex items-center justify-center bg-slate-50 p-5 sm:p-10">
        <div className="w-full max-w-md">
          <div className="mb-6 flex items-center gap-3 lg:hidden"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-600 text-white"><ChefHat size={22} /></div><span className="text-lg font-bold">FranchiseOps AI</span></div>
          <h2 className="text-2xl font-bold text-slate-900">Welcome back</h2>
          <p className="mt-1 text-sm text-slate-500">Sign in to your franchise workspace.</p>

          <p className="label mt-6">Choose a demo account</p>
          <div className="grid grid-cols-2 gap-2">
            {Object.entries(ROLES).map(([k, r]) => (
              <button key={k} type="button" onClick={() => pickRole(k)} className={`rounded-lg border px-3 py-2 text-left transition ${roleKey === k ? 'border-brand-500 bg-brand-50 ring-2 ring-brand-100' : 'border-slate-200 bg-white hover:border-slate-300'}`}>
                <p className={`text-sm font-semibold ${roleKey === k ? 'text-brand-700' : 'text-slate-800'}`}>{r.label}</p><p className="truncate text-[11px] text-slate-500">{r.tagline}</p>
              </button>
            ))}
          </div>

          <form onSubmit={submit} className="mt-5 space-y-4" noValidate>
            <Field label="Email address" error={errors.email}>
              <div className="relative"><Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /><input className="input pl-9" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@company.com" /></div>
            </Field>
            <Field label="Password" error={errors.password}>
              <div className="relative"><Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input className="input px-9" type={show ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
                <button type="button" onClick={() => setShow(!show)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">{show ? <EyeOff size={16} /> : <Eye size={16} />}</button>
              </div>
            </Field>
            <div className="flex items-center justify-between">
              <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-600"><input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} className="h-4 w-4 rounded border-slate-300 accent-brand-600" />Remember me</label>
              <button type="button" className="text-sm font-medium text-brand-600 hover:underline" onClick={() => setForgot(true)}>Forgot password?</button>
            </div>
            <button className="btn-primary w-full py-2.5" disabled={loading}>{loading ? <><Spinner /> Signing in…</> : 'Sign in'}</button>
          </form>
          <p className="mt-6 text-center text-xs text-slate-400">Demo password for the seeded accounts: demo1234</p>
        </div>
      </div>

      <Modal open={forgot} onClose={() => setForgot(false)} size="sm" title="Reset your password" subtitle="We’ll email you a reset link."
        footer={<><button className="btn-ghost" onClick={() => setForgot(false)}>Cancel</button><button className="btn-primary" onClick={sendReset}>Send reset link</button></>}>
        <Field label="Registered email"><input className="input" type="email" value={resetEmail} onChange={(e) => setResetEmail(e.target.value)} placeholder="you@company.com" /></Field>
      </Modal>
    </div>
  );
}

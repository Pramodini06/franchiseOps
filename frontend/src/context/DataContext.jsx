import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { initialBranches } from '../data/branches';
import { initialMenu } from '../data/menu';
import { initialOrders } from '../data/orders';
import { initialUsers } from '../data/users';
import { api } from '../api';

const Ctx = createContext(null);
export function DataProvider({ children }) {
  const [branches, setBranches] = useState(initialBranches), [menu, setMenu] = useState(initialMenu), [orders, setOrders] = useState(initialOrders), [users, setUsers] = useState(initialUsers);
  const [ready, setReady] = useState(false), [dashboardData,setDashboardData]=useState(null), [hasLiveData, setHasLiveData] = useState(false);
  const refresh = useCallback(async () => {
    if (!localStorage.getItem('fops_token')) { setHasLiveData(false); setReady(true); return; }
    try {
      const [b,m,o] = await Promise.all([api('/branches'),api('/menu'),api('/orders')]);
      setBranches(b); setMenu(m); setOrders(o);
      setHasLiveData(true);
      try { setUsers(await api('/users')); } catch (e) { if (!String(e.message).includes('cannot')) console.warn('User list unavailable:', e.message); }
    } catch (e) { setHasLiveData(false); console.error('Could not load application data:', e.message); }
    finally { setReady(true); }
  }, []);
  const loadDashboard=useCallback(async(range)=>{const result=await api(`/dashboard?range=${range}`);setDashboardData(result);return result},[]);
  useEffect(() => { refresh(); window.addEventListener('fops:login', refresh); return () => window.removeEventListener('fops:login', refresh); }, [refresh]);
  const value = {
    branches, menu, orders, users, ready, refresh, dashboardData, loadDashboard, hasLiveData,
    addBranch: async (b) => { const x=await api('/branches',{method:'POST',body:JSON.stringify(b)}); setBranches(p=>[x,...p]); return x; },
    updateBranch: async (id,b) => { const x=await api(`/branches/${id}`,{method:'PUT',body:JSON.stringify({...branches.find(y=>y.id===id),...b})}); setBranches(p=>p.map(y=>y.id===id?x:y)); return x; },
    deleteBranch: async (id) => { await api(`/branches/${id}`,{method:'DELETE'}); setBranches(p=>p.filter(x=>x.id!==id)); },
    addMenuItem: async (i) => { const x=await api('/menu',{method:'POST',body:JSON.stringify(i)}); setMenu(p=>[x,...p]); return x; },
    updateMenuItem: async (id,i) => { const x=await api(`/menu/${id}`,{method:'PUT',body:JSON.stringify({...menu.find(y=>y.id===id),...i})}); setMenu(p=>p.map(y=>y.id===id?x:y)); return x; },
    deleteMenuItem: async (id) => { await api(`/menu/${id}`,{method:'DELETE'}); setMenu(p=>p.filter(x=>x.id!==id)); },
    addOrder: async (o) => { const x=await api('/orders',{method:'POST',body:JSON.stringify(o)}); setOrders(p=>[x,...p]); return x; },
    setOrderStatus: async (id,status) => { await api(`/orders/${id}/status`,{method:'PATCH',body:JSON.stringify({status})}); setOrders(p=>p.map(x=>x.id===id?{...x,status}:x)); },
    addUser: async (u) => { const x=await api('/users',{method:'POST',body:JSON.stringify({...u,password:u.password||'demo1234'})}); setUsers(p=>[x,...p]); return x; },
    updateUser: async (id,u) => { const x=await api(`/users/${id}`,{method:'PUT',body:JSON.stringify({...users.find(y=>y.id===id),...u,password:u.password||'demo1234'})}); setUsers(p=>p.map(y=>y.id===id?x:y)); return x; },
    deleteUser: async (id) => { await api(`/users/${id}`,{method:'DELETE'}); setUsers(p=>p.filter(x=>x.id!==id)); }
  };
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
export const useData = () => useContext(Ctx);

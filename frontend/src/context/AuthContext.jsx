import { createContext, useContext, useEffect, useState } from 'react';
import { ROLES } from '../data/roles';
import { api, getToken, setToken } from '../api';
const Ctx = createContext(null);
const KEY = 'fops_session';
export function AuthProvider({ children }) {
  const [session,setSession]=useState(()=>{try{return getToken()?JSON.parse(localStorage.getItem(KEY)):null}catch{return null}});
  const [checking,setChecking]=useState(!!getToken());
  useEffect(()=>{if(!getToken()){setChecking(false);return} api('/auth/me').then(({user,roleKey})=>{setSession({user,roleKey});localStorage.setItem(KEY,JSON.stringify({user,roleKey}));window.dispatchEvent(new Event('fops:login'))}).catch(()=>{setToken(null);localStorage.removeItem(KEY);setSession(null)}).finally(()=>setChecking(false))},[]);
  const role=session?(ROLES[session.roleKey]||{}):null;
  const persist=(s)=>{setSession(s);s?localStorage.setItem(KEY,JSON.stringify(s)):localStorage.removeItem(KEY)};
  const value={isAuthed:!!session,checking,role,roleKey:session?.roleKey,user:session?.user?{...session.user,title:ROLES[session.roleKey]?.user?.title}:null,
    login:async(email,password)=>{const result=await api('/auth/login',{method:'POST',headers:{},body:JSON.stringify({email,password})});setToken(result.token);const s={user:result.user,roleKey:result.roleKey};persist(s);window.dispatchEvent(new Event('fops:login'));return s},
    switchRole:async(roleKey)=>{const account=ROLES[roleKey];if(!account)throw new Error('Unknown role');const result=await api('/auth/login',{method:'POST',body:JSON.stringify({email:account.user.email,password:'demo1234'})});setToken(result.token);const s={user:result.user,roleKey:result.roleKey};persist(s);window.dispatchEvent(new Event('fops:login'));return s}, logout:async()=>{try{await api('/auth/logout',{method:'POST'})}finally{setToken(null);persist(null)}}};
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
export const useAuth=()=>useContext(Ctx);

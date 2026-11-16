import { createContext, useContext, useState } from 'react';
import { ROLES } from '../data/roles';

const Ctx = createContext(null);
const KEY = 'fops_session';

// Frontend-only session simulation (no real authentication).
export function AuthProvider({ children }) {
  const [session, setSession] = useState(() => {
    try { const s = JSON.parse(localStorage.getItem(KEY)); return s && ROLES[s.roleKey] ? s : null; } catch { return null; }
  });
  const persist = (s) => { setSession(s); s ? localStorage.setItem(KEY, JSON.stringify(s)) : localStorage.removeItem(KEY); };
  const role = session ? ROLES[session.roleKey] : null;
  const value = {
    isAuthed: !!session, role, roleKey: session?.roleKey,
    user: role ? { ...role.user, email: session.email } : null,
    login: (roleKey, email) => persist({ roleKey, email }),
    switchRole: (roleKey) => persist({ roleKey, email: ROLES[roleKey].user.email }),
    logout: () => persist(null)
  };
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
export const useAuth = () => useContext(Ctx);

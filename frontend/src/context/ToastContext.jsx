import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

const Ctx = createContext(null);
const STYLES = {
  success: ['border-emerald-200 bg-emerald-50 text-emerald-800', CheckCircle2],
  error: ['border-red-200 bg-red-50 text-red-800', AlertCircle],
  info: ['border-sky-200 bg-sky-50 text-sky-800', Info]
};

export function ToastProvider({ children }) {
  const [items, setItems] = useState([]);
  const remove = (id) => setItems((p) => p.filter((t) => t.id !== id));
  const push = useCallback((type, message) => {
    const id = Date.now() + Math.random();
    setItems((p) => [...p, { id, type, message }]);
    setTimeout(() => setItems((p) => p.filter((t) => t.id !== id)), 3500);
  }, []);
  const api = useMemo(() => ({ success: (m) => push('success', m), error: (m) => push('error', m), info: (m) => push('info', m) }), [push]);
  return (
    <Ctx.Provider value={api}>
      {children}
      <div className="fixed right-4 top-4 z-[100] flex w-[calc(100%-2rem)] max-w-sm flex-col gap-2">
        {items.map((t) => {
          const [cls, Icon] = STYLES[t.type];
          return (
            <div key={t.id} className={`flex animate-slidein items-start gap-3 rounded-xl border px-4 py-3 text-sm shadow-lg ${cls}`}>
              <Icon size={18} className="mt-0.5 shrink-0" />
              <p className="flex-1 font-medium">{t.message}</p>
              <button onClick={() => remove(t.id)} className="opacity-60 hover:opacity-100"><X size={16} /></button>
            </div>
          );
        })}
      </div>
    </Ctx.Provider>
  );
}
export const useToast = () => useContext(Ctx);

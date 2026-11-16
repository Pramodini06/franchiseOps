import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';

export function useFakeLoad(ms = 600) {
  const [loading, setLoading] = useState(true);
  useEffect(() => { const t = setTimeout(() => setLoading(false), ms); return () => clearTimeout(t); }, [ms]);
  return loading;
}
export function usePagination(list, size = 8) {
  const [page, setPage] = useState(1);
  const pages = Math.max(1, Math.ceil(list.length / size));
  const current = Math.min(page, pages);
  return { page: current, setPage, pages, total: list.length, size, slice: list.slice((current - 1) * size, current * size) };
}
export function useOutside(onClose) {
  const ref = useRef(null);
  useEffect(() => {
    const h = (e) => ref.current && !ref.current.contains(e.target) && onClose();
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [onClose]);
  return ref;
}
// Branches visible to the current demo role.
export function useScope() {
  const { role } = useAuth();
  const { branches } = useData();
  const scopeBranches = role.scope === 'all' ? branches : branches.filter((b) => role.scope.includes(b.id));
  return { scopeBranches, ids: scopeBranches.map((b) => b.id) };
}

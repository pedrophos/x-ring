import { type DependencyList, useEffect, useState, useSyncExternalStore } from 'react';

/**
 * Invalidação simples: toda escrita em repo.ts chama invalidate(), e as telas
 * que usam useData() recarregam.
 */
let version = 0;
const listeners = new Set<() => void>();

export function invalidate(): void {
  version++;
  listeners.forEach((l) => l());
}

const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};

export const useDataVersion = () => useSyncExternalStore(subscribe, () => version);

export function useData<T>(load: () => Promise<T>, deps: DependencyList): { data: T | undefined; error: Error | null } {
  const v = useDataVersion();
  const [state, setState] = useState<{ data: T | undefined; error: Error | null }>({ data: undefined, error: null });
  useEffect(() => {
    let cancelled = false;
    load().then(
      (data) => !cancelled && setState({ data, error: null }),
      (error: Error) => !cancelled && setState((s) => ({ data: s.data, error })),
    );
    return () => {
      cancelled = true;
    };
    // load muda a cada render; quem decide quando recarregar são deps e a versão dos dados.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [v, ...deps]);

  return state;
}

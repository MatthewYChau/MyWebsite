/**
 * The order: a list of project ids the visitor has ticked.
 * Kept in sessionStorage so it survives reloads and page changes,
 * and shared by the React order slip and the plain card checkboxes.
 */
const STORAGE_KEY = 'cct-order';

type Listener = () => void;

interface Store {
  order: string[];
  listeners: Set<Listener>;
}

function read(): string[] {
  if (typeof sessionStorage === 'undefined') return [];
  try {
    const parsed: unknown = JSON.parse(sessionStorage.getItem(STORAGE_KEY) ?? '[]');
    return Array.isArray(parsed) ? parsed.filter((id): id is string => typeof id === 'string') : [];
  } catch {
    return [];
  }
}

// One store per browser tab, even if this file ends up in two script bundles.
const scope = globalThis as typeof globalThis & { __cctOrder?: Store };
const store: Store = (scope.__cctOrder ??= { order: read(), listeners: new Set() });

function commit(next: string[]) {
  store.order = next;
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Storage can be blocked (private mode). The order still works for this page.
  }
  store.listeners.forEach((listener) => listener());
}

export const getOrder = (): string[] => store.order;

export const hasItem = (id: string): boolean => store.order.includes(id);

export function setItem(id: string, ticked: boolean): void {
  if (ticked === hasItem(id)) return;
  commit(ticked ? [...store.order, id] : store.order.filter((item) => item !== id));
}

export function clearOrder(): void {
  if (store.order.length) commit([]);
}

export function subscribe(listener: Listener): () => void {
  store.listeners.add(listener);
  return () => store.listeners.delete(listener);
}

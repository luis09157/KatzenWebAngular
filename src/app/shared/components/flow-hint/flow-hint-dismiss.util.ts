/** Spec 072 / 054 #4 — ocultar hints por navegador (localStorage). */

export const FLOW_HINT_STORAGE_PREFIX = 'kz-flow-hint:';

export function flowHintStorageKey(hintId: string): string {
  return `${FLOW_HINT_STORAGE_PREFIX}${String(hintId || '').trim()}`;
}

export function isFlowHintDismissed(hintId: string, storage?: Storage | null): boolean {
  const id = String(hintId || '').trim();
  if (!id || !storage) return false;
  try {
    return storage.getItem(flowHintStorageKey(id)) === '1';
  } catch {
    return false;
  }
}

export function dismissFlowHint(hintId: string, storage?: Storage | null): void {
  const id = String(hintId || '').trim();
  if (!id || !storage) return;
  try {
    storage.setItem(flowHintStorageKey(id), '1');
  } catch {
    /* modo privado / cuota */
  }
}

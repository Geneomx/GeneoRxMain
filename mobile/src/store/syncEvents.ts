type SyncErrorListener = () => void;

const listeners = new Set<SyncErrorListener>();

export function onSyncError(listener: SyncErrorListener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function emitSyncError(): void {
  listeners.forEach((fn) => fn());
}

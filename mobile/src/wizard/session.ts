/** A cache belongs to one account on one backend, never the whole device. */
export function wizardStorageKey(apiBaseUrl: string, email?: string, guest = false): string {
  return `geneorx.wizard.v2:${encodeURIComponent(apiBaseUrl.replace(/\/$/, ''))}:${guest ? 'guest' : encodeURIComponent((email || 'signed-out').trim().toLowerCase())}`;
}

/** Serialize writes so a slow older autosave cannot overwrite a newer edit. */
export function createSaveQueue() {
  let pending: Promise<unknown> = Promise.resolve();
  return <T>(save: () => Promise<T>): Promise<T> => {
    const next = pending.catch(() => undefined).then(save);
    pending = next;
    return next;
  };
}

import { createSaveQueue } from './session';

export type DraftStorage = { setItem(key: string, value: string): Promise<void> };

/** Capture values now and serialize disk writes, including navigation updates. */
export function createDraftStore(storage: DraftStorage, key: string) {
  const enqueue = createSaveQueue();
  return (value: unknown): Promise<void> => {
    const serialized = JSON.stringify(value);
    return enqueue(() => storage.setItem(key, serialized));
  };
}

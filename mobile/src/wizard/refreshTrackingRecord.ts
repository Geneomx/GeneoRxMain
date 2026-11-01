/** Refresh must never replace an unsynced draft with an older server copy. */
export async function refreshTrackingRecord<T>(options: {
  pending: () => boolean;
  revision: () => number;
  active: () => boolean;
  sync: () => Promise<'synced' | 'device' | 'pending'>;
  load: () => Promise<T>;
  apply: (profile: T) => Promise<void>;
}): Promise<void> {
  if (options.pending()) {
    const outcome = await options.sync();
    if (outcome !== 'synced' || options.pending()) return;
  }
  const revision = options.revision();
  const profile = await options.load();
  // An edit made during the request must also survive a pull to refresh.
  if (!options.active() || options.pending() || revision !== options.revision()) return;
  await options.apply(profile);
}

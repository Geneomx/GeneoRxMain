/**
 * English text for newer screens, kept apart from the big language packs. Other languages fall back to this
 * English text until they are translated. Add new keys here rather than editing i18nPacks.json.
 */
export const EXTRA_EN: Record<string, string> = {
  'app.snapshot_title': 'Your doctor visit Snapshot',
  'app.snapshot_print': 'Print',
  // Results: what the coach box suggests before a first check-in (the website points to "Start plan", which the app does not offer).
  'app.coach_action_checkin': 'Add a check-in so this box can follow how you are doing.',
  // Progress: the weekly score comes only from the person's own answers.
  'app.score_note': 'This score comes from your own check-in answers. It is not a medical test.',
  // Progress charts: shown when a chart has no points yet.
  'app.trend_empty': 'Not enough check-ins yet',
};

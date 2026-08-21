import { apiRequest } from './client';

/**
 * Product analytics events, mirroring the web portal exactly so both platforms
 * land in the same funnel. Names must match the server allow-list in
 * app/Http/Controllers/Api/AnalyticsController.php — anything else is accepted
 * with a 200 and then silently dropped, so a typo shows up as missing data
 * rather than an error.
 */
export type AnalyticsEventName =
  | 'wizard_step_viewed'
  | 'wizard_completed'
  | 'medication_added'
  | 'symptom_selected'
  | 'results_viewed'
  | 'checkin_saved'
  | 'plan_started'
  | 'report_downloaded'
  | 'snapshot_shared'
  | 'insight_revealed'
  | 'language_changed'
  | 'screen_viewed';

type Properties = Record<string, string | number | boolean | null | undefined>;

/**
 * Fire-and-forget: analytics must never block a user action or surface an
 * error. Matches the web portal's `fetch(...).catch(() => {})`.
 *
 * Deliberately not awaited by callers — the returned promise always resolves.
 */
export function track(name: AnalyticsEventName, properties: Properties = {}): void {
  void apiRequest<{ ok: boolean }>('/analytics/track', {
    method: 'POST',
    body: { name, properties },
  }).catch(() => undefined);
}

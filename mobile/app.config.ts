import type { ConfigContext, ExpoConfig } from 'expo/config';

/**
 * app.config.ts   environment-driven Expo config
 *
 * Override API URL per environment by setting GENEORX_API_URL:
 *   - Local dev:    GENEORX_API_URL=http://192.168.x.x:8000/api  (your machine's LAN IP)
 *   - Staging:      GENEORX_API_URL=https://staging.geneorx.com/api
 *   - Production:   GENEORX_API_URL=https://geneorx.com/api       (default)
 *
 * In EAS builds, set this in eas.json under each profile's `env` block.
 */
export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,

  // Re-declare required top-level fields so TS is satisfied even without app.json
  name: config.name ?? 'GeneoRx',
  slug: config.slug ?? 'geneorx',

  extra: {
    ...config.extra,
    // Falls back to production API if env var is not set
    apiBaseUrl: process.env.GENEORX_API_URL ?? 'https://geneorx.com/api',

    // Google OAuth client IDs   set in eas.json env per build profile
    // iOS / Android clients are created separately in Google Cloud Console
    googleIosClientId:     process.env.GOOGLE_IOS_CLIENT_ID     ?? null,
    googleAndroidClientId: process.env.GOOGLE_ANDROID_CLIENT_ID ?? null,
    // Web client ID is needed for expo-auth-session on bare Android + web
    googleWebClientId:     process.env.GOOGLE_CLIENT_ID         ?? null,

    eas: {
      projectId: config.extra?.eas?.projectId,
    },
  },

  plugins: [
    ...(Array.isArray(config.plugins) ? config.plugins : []),
    [
      'expo-build-properties',
      {
        android: { minSdkVersion: 24 },
        ios: { deploymentTarget: '15.1' },
      },
    ],
  ],
});

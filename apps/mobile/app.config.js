/** @param {import('@expo/config').ConfigContext} _ctx */
module.exports = () => ({
  expo: {
    name: 'GeneoRx',
    slug: 'geneorx-mobile',
    version: '1.0.0',
    runtimeVersion: {
      policy: 'appVersion',
    },
    orientation: 'portrait',
    scheme: 'geneorx',
    icon: './assets/icon.png',
    userInterfaceStyle: 'automatic',
    splash: {
      image: './assets/splash.png',
      resizeMode: 'contain',
      backgroundColor: '#0f172a',
    },
    plugins: ['expo-notifications'],
    assetBundlePatterns: ['**/*'],
    ios: {
      supportsTablet: true,
      bundleIdentifier: 'com.geneorx.mobile',
      buildNumber: '1',
    },
    android: {
      adaptiveIcon: {
        foregroundImage: './assets/icon.png',
        backgroundColor: '#0f172a',
      },
      package: 'com.geneorx.mobile',
      versionCode: 1,
    },
  },
});

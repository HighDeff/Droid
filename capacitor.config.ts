import type { CapacitorConfig } from '@capacitor/cli';

/**
 * Droid — device-automation control app.
 *
 * The APK is a remote controller: the WebView UI talks to the Droid backend
 * (Node server on your PC / server) over HTTP. Set the server address either
 * at build time with VITE_API_BASE_URL or at runtime in the app via the
 * Backend control in the dashboard header.
 *
 * Build:  npm run mobile:sync   (builds web UI -> dist/spa, copies to android/)
 * Then open in Android Studio or run Gradle to produce the APK.
 */
const config: CapacitorConfig = {
  appId: 'com.highdeff.droid',
  appName: 'Droid',
  webDir: 'dist/spa',
  server: {
    // Allow the WebView to reach a LAN/dev backend over plain HTTP.
    // Production deployments should use HTTPS and can remove this.
    cleartext: true,
  },
  android: {
    // Keep the WebView viewport stable for coordinate mapping.
    allowMixedContent: true,
  },
};

export default config;

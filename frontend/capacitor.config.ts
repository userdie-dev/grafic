import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.grafic.app',
  appName: 'График смен',
  webDir: 'dist',
  plugins: {
    // обновлением управляет src/app/config/updater.ts (GitHub Releases), не облако Capgo
    CapacitorUpdater: { autoUpdate: false }
  }
};

export default config;

import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.r3play.app',
  appName: 'R3 Play',
  webDir: 'dist',
  server: {
    // Permite conexões HTTP locais (Wi-Fi da quadra/arena e IPs 192.168.x.x) sem bloqueio de SSL
    cleartext: true,
    androidScheme: 'https',
  },
  android: {
    allowMixedContent: true,
  },
};

export default config;

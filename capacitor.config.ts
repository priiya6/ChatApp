import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.convo.chatapp',
  appName: 'Convo',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
  },
};

export default config;

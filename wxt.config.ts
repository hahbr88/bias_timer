import { defineConfig } from 'wxt';

export default defineConfig({
  modules: ['@wxt-dev/module-react'],
  manifest: {
    name: '최애시 타이머',
    description: '내 최애의 특별한 시간을 놓치지 않도록 알려드려요.',
    version: '0.1.0',
    permissions: ['storage', 'alarms', 'notifications'],
  },
});

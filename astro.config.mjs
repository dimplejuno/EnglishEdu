// @ts-check
import { defineConfig } from 'astro/config';
import node from '@astrojs/node';

// SSR 모드로 동작시켜 서버에서 인증/세션을 처리합니다.
export default defineConfig({
  output: 'server',
  adapter: node({ mode: 'standalone' }),
  server: { port: 4321 },
});

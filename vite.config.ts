/**
 * Standalone Vite config for UI SPA mode.
 *
 * Used when running `pnpm dev` or `pnpm build` inside apps/ui.
 * The electron-vite renderer config in apps/electron/electron.vite.config.ts
 * mirrors these settings for the Electron wrapper build.
 */
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import tailwindcss from '@tailwindcss/vite';
import vuetify from 'vite-plugin-vuetify';
import path from 'node:path';
import vueDevTools from 'vite-plugin-vue-devtools';

export default defineConfig({
  plugins: [vue(), tailwindcss(), vuetify({ autoImport: true }), vueDevTools()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  server: {
    port: 5173,
    strictPort: true,
  },
  build: {
    outDir: 'dist',
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return;

          if (id.includes('vuetify')) {
            return 'vendor-vuetify';
          }

          if (id.includes('vue-router') || id.includes(`${path.sep}vue${path.sep}`) || id.includes('pinia')) {
            return 'vendor-vue';
          }

          if (id.includes('axios')) {
            return 'vendor-network';
          }

          if (id.includes('vue-toastflow')) {
            return 'vendor-toastflow';
          }
        },
      },
    },
  },
});

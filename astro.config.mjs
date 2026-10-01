import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://lgdesign.com.ar',
  output: 'static',
  trailingSlash: 'always',
  vite: {
    environments: {
      astro: {
        // Prebundle the glob loader's CommonJS dependency for content schemas.
        optimizeDeps: {
          include: ['picomatch', 'astro/content/runtime', 'astro/loaders', 'astro/logger/console', 'astro/zod'],
          noDiscovery: true,
        },
      },
    },
  },
  integrations: [
    sitemap({
      filter: (page) => !/\/(?:tablet(?:\/|$)|404(?:\.html|\/|$))/.test(new URL(page).pathname),
    }),
  ],
});

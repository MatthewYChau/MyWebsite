// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import { subsetFonts } from './scripts/subset-fonts.mjs';

/**
 * Keeps the small Chinese font files in step with the text on the site.
 * Runs when the dev server starts and when the site builds. While the dev
 * server is running it also runs again whenever a file in src/ changes.
 * @returns {import('astro').AstroIntegration}
 */
function chineseFontSubset() {
  return {
    name: 'chinese-font-subset',
    hooks: {
      'astro:config:setup': async ({ logger }) => {
        const result = await subsetFonts();
        if (result.changed) logger.info(`Rebuilt Chinese font subsets (${result.count} characters).`);
      },
      'astro:server:setup': ({ server, logger }) => {
        /** @type {ReturnType<typeof setTimeout> | undefined} */
        let timer;
        server.watcher.on('change', (file) => {
          const normal = file.replaceAll('\\', '/');
          if (!normal.includes('/src/') || normal.includes('/src/assets/fonts/')) return;
          clearTimeout(timer);
          timer = setTimeout(async () => {
            const result = await subsetFonts();
            if (!result.changed) return;
            logger.info(`Rebuilt Chinese font subsets (${result.count} characters).`);
            server.hot.send({ type: 'full-reload' });
          }, 300);
        });
      },
    },
  };
}

// https://astro.build/config
export default defineConfig({
  // The live address (Cloudflare Pages project "matthew-chau"). It is used for
  // Open Graph tags and canonical links. Change it if you add a custom domain
  // such as yourname.is-a.dev.
  site: 'https://matthew-chau.pages.dev',
  output: 'static',
  compressHTML: true,
  integrations: [react(), chineseFontSubset()],
});

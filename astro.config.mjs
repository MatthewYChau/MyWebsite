// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';

// https://astro.build/config
export default defineConfig({
  // TODO: change this to your real address once the site is live
  // (your-project.pages.dev or yourname.is-a.dev). It is used for
  // Open Graph tags and canonical links.
  site: 'https://matthew-chau.pages.dev',
  output: 'static',
  compressHTML: true,
  integrations: [react()],
});

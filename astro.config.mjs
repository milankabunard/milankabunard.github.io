import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://milankabunard.github.io',
  redirects: {
    '/statement': '/studio/about/#statement',
    '/about': '/studio/about/',
    '/exhibitions': '/studio/about/#exhibitions',
  },
});

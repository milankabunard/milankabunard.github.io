import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://milankabunard.com',
  // Addresses from the previous Jekyll site.
  redirects: {
    '/statement': '/about/#statement',
    '/exhibitions': '/about/#exhibitions',
    '/portfolio': '/',
  },
});

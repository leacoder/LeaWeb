import { defineMiddleware } from 'astro:middleware';
import { translateHTML } from './lib/i18n/render';

// Translate at render time, so both development and static builds serve complete HTML.
export const onRequest = defineMiddleware(async ({ url }, next) => {
  const response = await next();
  if (!url.pathname.startsWith('/en/') || !response.headers.get('content-type')?.includes('text/html')) return response;
  return new Response(translateHTML(await response.text()), {
    status: response.status,
    headers: response.headers,
  });
});

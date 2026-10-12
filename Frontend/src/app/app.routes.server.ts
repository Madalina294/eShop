import { RenderMode, ServerRoute } from '@angular/ssr';

/**
 * Every route is behind an auth guard and reads `localStorage`, so there is
 * nothing meaningful to prerender: the build used to fail on each route
 * (ng-zorro icons are not registered in the server bundle) and the guards had
 * to `return true` under SSR just to let prerendering proceed.
 *
 * Client rendering keeps SSR hydration for the shell while leaving the
 * authenticated content to the browser, where the token actually exists.
 */
export const serverRoutes: ServerRoute[] = [
  {
    path: '**',
    renderMode: RenderMode.Client,
  },
];

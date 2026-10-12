import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { Injector, inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { NotificationService } from '../../shared/notification/notification.service';
import { environment } from '../../../environments/environments';

/** Translation keys for the HTTP statuses we surface to the user. */
const STATUS_MESSAGE_KEYS: Record<number, string> = {
  0: 'errors.network',
  400: 'errors.badRequest',
  403: 'errors.forbidden',
  404: 'errors.notFound',
  409: 'errors.conflict',
  413: 'errors.payloadTooLarge',
  422: 'errors.validation',
  429: 'errors.tooManyRequests',
  500: 'errors.server',
  503: 'errors.unavailable',
};

/**
 * Turns an unhandled failure of one of OUR API calls into a single translated
 * toast, so components no longer need an `error:` branch just to show a message.
 *
 * Two deliberate constraints keep this off the dependency-injection critical
 * path:
 *
 * 1. It only looks at requests aimed at our own API. Translation bundles,
 *    Stripe and static assets pass straight through.
 * 2. `NotificationService` is resolved lazily, at the moment an error is
 *    actually reported — never while the interceptor runs.
 *
 * Both matter because `NotificationService` depends on `TranslateService`,
 * whose loader fetches `/assets/i18n/*.json` through this very chain. Injecting
 * it eagerly made that request construct a service that was itself still being
 * constructed, so Angular raised a circular-dependency error, the bundle never
 * loaded, and every page rendered raw translation keys.
 *
 * Opt out per request with the `X-Skip-Error-Toast` header when a component
 * renders the failure inline (e.g. an error state with a retry button).
 */
export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const injector = inject(Injector);

  const isOurApi = req.url.startsWith(environment.apiUrl) || req.url.startsWith('/api');
  const skipToast = req.headers.has('X-Skip-Error-Toast');

  const cleanReq = skipToast
    ? req.clone({ headers: req.headers.delete('X-Skip-Error-Toast') })
    : req;

  if (!isOurApi) return next(cleanReq);

  return next(cleanReq).pipe(
    catchError((error: unknown) => {
      // 401 is fully handled by authInterceptor (sign-out + redirect).
      const isUnauthorized = error instanceof HttpErrorResponse && error.status === 401;

      if (!skipToast && !isUnauthorized && error instanceof HttpErrorResponse) {
        injector
          .get(NotificationService)
          .error(resolveMessageKey(error), backendMessage(error));
      }

      return throwError(() => error);
    })
  );
};

function resolveMessageKey(error: HttpErrorResponse): string {
  return STATUS_MESSAGE_KEYS[error.status] ?? 'errors.unexpected';
}

/**
 * Prefers a human-readable message from the backend over our generic text.
 * Spring Boot returns either `{ message }` or `{ error }`.
 */
function backendMessage(error: HttpErrorResponse): string | undefined {
  const body = error.error;

  if (typeof body === 'string' && body.trim() && !body.trim().startsWith('<')) {
    return body;
  }

  if (body && typeof body === 'object') {
    const record = body as Record<string, unknown>;
    const candidate = record['message'] ?? record['error'];
    if (typeof candidate === 'string' && candidate.trim()) return candidate;
  }

  return undefined;
}

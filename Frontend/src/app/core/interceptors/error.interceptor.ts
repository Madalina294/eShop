import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { NotificationService } from '../../shared/notification/notification.service';

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
 * Turns every unhandled HTTP failure into one translated toast, so components
 * no longer need their own `error:` branch just to show a message.
 *
 * Opt out per request with the `X-Skip-Error-Toast` header when a component
 * renders the failure inline (e.g. an error state with a retry button).
 */
export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const notifications = inject(NotificationService);

  const skipToast = req.headers.has('X-Skip-Error-Toast');
  const cleanReq = skipToast
    ? req.clone({ headers: req.headers.delete('X-Skip-Error-Toast') })
    : req;

  return next(cleanReq).pipe(
    catchError((error: unknown) => {
      // 401 is fully handled by authInterceptor (sign-out + redirect).
      const isUnauthorized = error instanceof HttpErrorResponse && error.status === 401;

      if (!skipToast && !isUnauthorized && error instanceof HttpErrorResponse) {
        notifications.error(resolveMessageKey(error), backendMessage(error));
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
    const candidate = (body as Record<string, unknown>)['message'] ?? (body as Record<string, unknown>)['error'];
    if (typeof candidate === 'string' && candidate.trim()) return candidate;
  }
  return undefined;
}

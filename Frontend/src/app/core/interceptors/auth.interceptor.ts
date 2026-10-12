import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { StorageService } from '../../services/storage/storage.service';
import { environment } from '../../../environments/environments';

/**
 * Attaches the bearer token to every request aimed at our own API, and signs
 * the user out on a 401.
 *
 * This replaces the `createAuthorizationHeader()` helper that used to be
 * copy-pasted into admin/user/checkout services and called at ~40 call sites.
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);

  // Only our own API gets the token — never third parties (Stripe, i18n files).
  const isApiRequest =
    req.url.startsWith(environment.apiUrl) || req.url.startsWith('/api');

  const token = StorageService.getToken();

  const authorized =
    isApiRequest && token
      ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
      : req;

  return next(authorized).pipe(
    catchError((error: unknown) => {
      if (error instanceof HttpErrorResponse && error.status === 401 && isApiRequest) {
        StorageService.signout();
        router.navigate(['/login'], {
          queryParams: { reason: 'session-expired' },
        });
      }
      return throwError(() => error);
    })
  );
};

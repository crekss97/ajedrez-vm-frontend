import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { EditorAuthService } from '../../services/editor-auth.service';
import { API_URL } from '../config/api.config';

export const apiCredentialsInterceptor: HttpInterceptorFn = (request, next) => {
  if (!isApiRequest(request.url)) {
    return next(request);
  }

  const auth = inject(EditorAuthService);
  const router = inject(Router);

  return next(request.clone({ withCredentials: true })).pipe(
    catchError((error: unknown) => {
      if (error instanceof HttpErrorResponse && error.status === 401) {
        auth.clearSession();
        if (router.url.startsWith('/editor') && !request.url.includes('/auth/')) {
          void router.navigate(['/login'], {
            queryParams: { error: 'session_expired', returnUrl: router.url },
          });
        }
      }
      return throwError(() => error);
    }),
  );
};

function isApiRequest(url: string): boolean {
  const requestUrl = new URL(url, window.location.origin);
  const apiUrl = new URL(API_URL, window.location.origin);
  const apiPath = apiUrl.pathname.endsWith('/') ? apiUrl.pathname : `${apiUrl.pathname}/`;
  return requestUrl.origin === apiUrl.origin
    && (requestUrl.pathname === apiUrl.pathname || requestUrl.pathname.startsWith(apiPath));
}

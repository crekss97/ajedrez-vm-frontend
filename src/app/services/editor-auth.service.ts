import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { Observable, catchError, finalize, map, of, shareReplay, tap } from 'rxjs';
import { API_URL } from '../core/config/api.config';
import { EditorSession } from '../models/editor';

@Injectable({ providedIn: 'root' })
export class EditorAuthService {
  private readonly http = inject(HttpClient);
  private readonly sessionState = signal<EditorSession | null>(null);
  private sessionRequest?: Observable<EditorSession | null>;
  private sessionChecked = false;

  readonly session = this.sessionState.asReadonly();

  getSession(): EditorSession | null {
    return this.sessionState();
  }

  ensureSession(): Observable<EditorSession | null> {
    if (this.sessionChecked) {
      return of(this.sessionState());
    }
    if (this.sessionRequest) {
      return this.sessionRequest;
    }

    this.sessionRequest = this.http.get<EditorSession>(`${API_URL}/auth/me`).pipe(
      tap((session) => {
        this.sessionChecked = true;
        this.sessionState.set(session);
      }),
      map((session) => session as EditorSession | null),
      catchError((error: unknown) => {
        this.sessionChecked = error instanceof HttpErrorResponse && error.status === 401;
        this.sessionState.set(null);
        return of(null);
      }),
      finalize(() => (this.sessionRequest = undefined)),
      shareReplay({ bufferSize: 1, refCount: false }),
    );

    return this.sessionRequest;
  }

  startGoogleLogin(returnUrl?: string): void {
    window.location.assign(buildGoogleLoginUrl(returnUrl));
  }

  logout(): Observable<void> {
    return this.http.post<void>(`${API_URL}/auth/logout`, {}).pipe(
      tap({
        next: () => this.clearSession(),
        error: () => this.clearSession(),
      }),
    );
  }

  clearSession(): void {
    this.sessionChecked = true;
    this.sessionState.set(null);
  }
}

export function buildGoogleLoginUrl(returnUrl?: string): string {
  const query = returnUrl ? `?returnUrl=${encodeURIComponent(returnUrl)}` : '';
  return `${API_URL}/auth/google/start${query}`;
}

import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import {
  EditorCredentials,
  EditorSession,
  MOCK_EDITOR_EMAIL,
  MOCK_EDITOR_PASSWORD,
} from '../models/editor';

const SESSION_STORAGE_KEY = 'ajedrez-vm.editor.session';

@Injectable({
  providedIn: 'root',
})
export class EditorAuthService {
  private readonly sessionSubject = new BehaviorSubject<EditorSession | null>(this.readSession());

  readonly session$ = this.sessionSubject.asObservable();

  login(credentials: EditorCredentials): boolean {
    if (
      credentials.email.trim().toLowerCase() !== MOCK_EDITOR_EMAIL ||
      credentials.password !== MOCK_EDITOR_PASSWORD
    ) {
      return false;
    }

    const session: EditorSession = {
      email: MOCK_EDITOR_EMAIL,
      displayName: 'Editor principal',
      role: 'editor',
    };

    this.sessionSubject.next(session);
    this.persistSession(session);
    return true;
  }

  logout(): void {
    this.sessionSubject.next(null);
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(SESSION_STORAGE_KEY);
    }
  }

  isAuthenticated(): boolean {
    return this.sessionSubject.value !== null;
  }

  getSession(): EditorSession | null {
    return this.sessionSubject.value;
  }

  private readSession(): EditorSession | null {
    if (typeof localStorage === 'undefined') {
      return null;
    }

    const rawSession = localStorage.getItem(SESSION_STORAGE_KEY);

    if (!rawSession) {
      return null;
    }

    try {
      const session = JSON.parse(rawSession) as Partial<EditorSession>;

      if (!session.email || !session.displayName || session.role !== 'editor') {
        localStorage.removeItem(SESSION_STORAGE_KEY);
        return null;
      }

      return session as EditorSession;
    } catch {
      localStorage.removeItem(SESSION_STORAGE_KEY);
      return null;
    }
  }

  private persistSession(session: EditorSession): void {
    if (typeof localStorage === 'undefined') {
      return;
    }

    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
  }
}

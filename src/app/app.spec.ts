import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { App } from './app';
import { EditorSession } from './models/editor';
import { EditorAuthService } from './services/editor-auth.service';

class AuthStub {
  readonly sessionState = signal<EditorSession | null>(null);
  readonly session = this.sessionState.asReadonly();

  ensureSession() {
    return of(this.sessionState());
  }

  logout() {
    return of(undefined);
  }
}

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [
        provideRouter([]),
        { provide: EditorAuthService, useClass: AuthStub },
      ],
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('should render title', () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.site-brand__title')?.textContent).toContain('Ajedrez VM');
  });

  it('usa el email como nombre visible para un admin sin displayName', () => {
    const fixture = TestBed.createComponent(App);
    const auth = TestBed.inject(EditorAuthService) as unknown as AuthStub;
    auth.sessionState.set({
      id: 'admin-1',
      email: 'admin@example.com',
      displayName: null,
      role: 'admin',
    });
    fixture.detectChanges();
    (fixture.nativeElement.querySelector('.profile-menu__trigger') as HTMLButtonElement).click();
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.profile-menu__identity strong')?.textContent).toContain(
      'admin@example.com',
    );
  });
});

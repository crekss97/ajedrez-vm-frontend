import { signal } from '@angular/core';
import { fakeAsync, TestBed, tick } from '@angular/core/testing';
import { NavigationEnd, NavigationStart, provideRouter, Router } from '@angular/router';
import { of, Subject } from 'rxjs';
import { App } from './app';
import {
  AppLoadingService,
  MINIMO_VISIBLE_CARGADOR_MS,
  RETARDO_CARGADOR_MS,
} from './core/app-loading.service';
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

  it('muestra un unico tablero global de 3 por 3 durante la carga', fakeAsync(() => {
    const fixture = TestBed.createComponent(App);
    const loading = TestBed.inject(AppLoadingService);
    const finalizar = loading.iniciar();

    tick(RETARDO_CARGADOR_MS);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelectorAll('[role="status"]').length).toBe(1);
    expect(fixture.nativeElement.querySelectorAll('.chess-loader__square').length).toBe(9);
    expect(fixture.nativeElement.querySelector('.app-shell')?.getAttribute('aria-busy')).toBe('true');
    expect(fixture.nativeElement.querySelector('.app-shell')?.hasAttribute('inert')).toBeTrue();
    expect(fixture.nativeElement.querySelector('[role="status"]')?.closest('[aria-busy="true"]')).toBeNull();

    finalizar();
    tick(MINIMO_VISIBLE_CARGADOR_MS);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('[role="status"]')).toBeNull();
    expect(fixture.nativeElement.querySelector('.app-shell')?.hasAttribute('inert')).toBeFalse();
  }));

  it('bloquea el scroll y restaura el foco al terminar la carga', fakeAsync(() => {
    const fixture = TestBed.createComponent(App);
    const loading = TestBed.inject(AppLoadingService);
    fixture.detectChanges();
    const enlaceActivo = fixture.nativeElement.querySelector('.site-brand__title') as HTMLAnchorElement;
    enlaceActivo.focus();

    const finalizar = loading.iniciar();
    tick(RETARDO_CARGADOR_MS);
    fixture.detectChanges();

    expect(document.documentElement.style.overflow).toBe('hidden');

    finalizar();
    tick(MINIMO_VISIBLE_CARGADOR_MS);
    fixture.detectChanges();

    expect(document.documentElement.style.overflow).toBe('');
    expect(document.activeElement).toBe(enlaceActivo);
  }));

  it('muestra el tablero desde el inicio de una navegacion', fakeAsync(() => {
    const fixture = TestBed.createComponent(App);
    const router = TestBed.inject(Router);
    const eventosRouter = router.events as Subject<NavigationStart | NavigationEnd>;
    fixture.detectChanges();

    eventosRouter.next(new NavigationStart(1, '/eventos/torneo-apertura'));
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.app-loading-overlay')).not.toBeNull();

    eventosRouter.next(
      new NavigationEnd(
        1,
        '/eventos/torneo-apertura',
        '/eventos/torneo-apertura',
      ),
    );
    tick(MINIMO_VISIBLE_CARGADOR_MS);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.app-loading-overlay')).toBeNull();
  }));

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

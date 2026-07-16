import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router, convertToParamMap, provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { EditorSession } from '../../models/editor';
import { EditorAuthService } from '../../services/editor-auth.service';
import { EditorLogin } from './editor-login';

describe('EditorLogin', () => {
  const auth = jasmine.createSpyObj<EditorAuthService>('EditorAuthService', ['startGoogleLogin', 'ensureSession']);
  let fixture: ComponentFixture<EditorLogin>;
  let navigateByUrl: jasmine.Spy;

  afterEach(() => TestBed.resetTestingModule());

  it('espera una acción explícita antes de iniciar Google', async () => {
    await configure(null, '/editor/eventos?estado=draft');
    fixture.detectChanges();
    await fixture.whenStable();

    expect(auth.startGoogleLogin).not.toHaveBeenCalled();
    expect(fixture.nativeElement.textContent).toContain('Continuar con Google');
    (fixture.nativeElement.querySelector('.login-action') as HTMLButtonElement).click();
    expect(auth.startGoogleLogin).toHaveBeenCalledOnceWith('/editor/eventos?estado=draft');
  });

  it('redirige al editor cuando ya existe una sesión', async () => {
    const session: EditorSession = {
      id: '7',
      email: 'editor@example.com',
      displayName: 'Editor',
      role: 'editor',
    };
    await configure(null, undefined, session);
    fixture.detectChanges();
    await fixture.whenStable();

    expect(navigateByUrl).toHaveBeenCalledOnceWith('/editor');
    expect(fixture.nativeElement.querySelector('.login-action')).toBeNull();
  });

  it('mantiene returnUrl al reintentar después de un error OAuth', async () => {
    await configure('oauth_failed', '/editor/metricas');
    fixture.detectChanges();
    await fixture.whenStable();

    expect(auth.startGoogleLogin).not.toHaveBeenCalled();
    expect(fixture.nativeElement.querySelector('[role="alert"]')?.textContent).toContain('autenticación');
    (fixture.nativeElement.querySelector('.login-action') as HTMLButtonElement).click();
    expect(auth.startGoogleLogin).toHaveBeenCalledOnceWith('/editor/metricas');
  });

  [
    'https://attacker.example/editor',
    '//attacker.example/editor',
    '/editorial',
    '/editor/../../eventos',
    '/editor\\eventos',
  ].forEach((returnUrl) => {
    it(`descarta el returnUrl no seguro: ${returnUrl}`, async () => {
      await configure(null, returnUrl);
      fixture.detectChanges();
      await fixture.whenStable();

      expect(auth.startGoogleLogin).not.toHaveBeenCalled();
      (fixture.nativeElement.querySelector('.login-action') as HTMLButtonElement).click();
      expect(auth.startGoogleLogin).toHaveBeenCalledOnceWith(undefined);
    });
  });

  it('muestra el código de cualquier error informado por el backend', async () => {
    await configure('backend_custom_code');
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('[role="alert"]')?.textContent).toContain('backend_custom_code');
    expect(auth.startGoogleLogin).not.toHaveBeenCalled();
  });

  async function configure(
    error: string | null,
    returnUrl?: string,
    session: EditorSession | null = null,
  ): Promise<void> {
    auth.startGoogleLogin.calls.reset();
    auth.ensureSession.calls.reset();
    auth.ensureSession.and.returnValue(of(session));
    const queryParams = {
      ...(error ? { error } : {}),
      ...(returnUrl ? { returnUrl } : {}),
    };
    await TestBed.configureTestingModule({
      imports: [EditorLogin],
      providers: [
        provideRouter([]),
        { provide: EditorAuthService, useValue: auth },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { queryParamMap: convertToParamMap(queryParams) } },
        },
      ],
    }).compileComponents();
    navigateByUrl = spyOn(TestBed.inject(Router), 'navigateByUrl').and.resolveTo(true);
    fixture = TestBed.createComponent(EditorLogin);
  }
});

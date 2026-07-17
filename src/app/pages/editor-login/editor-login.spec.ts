import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router, convertToParamMap, provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { Observable, Subject, of } from 'rxjs';
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
    await configure(null, undefined, editorSession);
    fixture.detectChanges();
    await fixture.whenStable();

    expect(navigateByUrl).toHaveBeenCalledOnceWith('/editor');
    expect(fixture.nativeElement.querySelector('.login-action')).toBeNull();
  });

  it('redirige al returnUrl editorial completo cuando ya existe una sesión', async () => {
    await configure(null, '/editor/eventos?estado=draft#tabla', editorSession);
    fixture.detectChanges();
    await fixture.whenStable();

    expect(navigateByUrl).toHaveBeenCalledOnceWith('/editor/eventos?estado=draft#tabla');
    expect(auth.startGoogleLogin).not.toHaveBeenCalled();
  });

  it('redirige al editor cuando la sesión existe y el returnUrl no es seguro', async () => {
    await configure(null, 'https://attacker.example/editor', editorSession);
    fixture.detectChanges();
    await fixture.whenStable();

    expect(navigateByUrl).toHaveBeenCalledOnceWith('/editor');
  });

  it('oculta la acción de Google mientras verifica la sesión', async () => {
    const sessionResult = new Subject<EditorSession | null>();
    await configure(null, undefined, null, sessionResult);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('[role="status"]')?.textContent).toContain(
      'Verificando sesión',
    );
    expect(fixture.nativeElement.querySelector('.login-action')).toBeNull();
    expect(navigateByUrl).not.toHaveBeenCalled();

    sessionResult.next(null);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('[role="status"]')).toBeNull();
    expect(fixture.nativeElement.textContent).toContain('Continuar con Google');
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
    sessionResult: Observable<EditorSession | null> = of(session),
  ): Promise<void> {
    auth.startGoogleLogin.calls.reset();
    auth.ensureSession.calls.reset();
    auth.ensureSession.and.returnValue(sessionResult);
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

const editorSession: EditorSession = {
  id: '7',
  email: 'editor@example.com',
  displayName: 'Editor',
  role: 'editor',
};

@Component({ standalone: true, template: '' })
class EditorStub {}

describe('EditorLogin routing', () => {
  const auth = jasmine.createSpyObj<EditorAuthService>('EditorAuthService', [
    'startGoogleLogin',
    'ensureSession',
  ]);

  afterEach(() => TestBed.resetTestingModule());

  it('completa la navegación real desde /login hasta /editor con sesión activa', async () => {
    auth.ensureSession.and.returnValue(of(editorSession));
    await TestBed.configureTestingModule({
      imports: [EditorLogin, EditorStub],
      providers: [
        provideRouter([
          { path: 'login', component: EditorLogin },
          { path: 'editor', component: EditorStub },
        ]),
        { provide: EditorAuthService, useValue: auth },
      ],
    }).compileComponents();
    const harness = await RouterTestingHarness.create();

    await harness.navigateByUrl('/login');
    await harness.fixture.whenStable();

    expect(TestBed.inject(Router).url).toBe('/editor');
    expect(auth.startGoogleLogin).not.toHaveBeenCalled();
  });
});

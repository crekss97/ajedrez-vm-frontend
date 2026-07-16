import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { EditorAuthService, buildGoogleLoginUrl } from './editor-auth.service';

describe('EditorAuthService', () => {
  let service: EditorAuthService;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(EditorAuthService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpTesting.verify());

  it('codifica returnUrl en el endpoint de inicio de Google', () => {
    expect(buildGoogleLoginUrl('/editor/eventos?estado=draft&vista=tabla')).toBe(
      '/api/auth/google/start?returnUrl=%2Feditor%2Feventos%3Festado%3Ddraft%26vista%3Dtabla',
    );
  });

  it('obtiene y conserva la sesión desde el backend', () => {
    const session = {
      id: 'editor-1',
      email: 'editora@example.com',
      displayName: 'Editora',
      role: 'editor' as const,
    };
    let result = null;

    service.ensureSession().subscribe((value) => (result = value));
    const request = httpTesting.expectOne('/api/auth/me');
    expect(request.request.method).toBe('GET');
    request.flush(session);

    expect(result!).toEqual(session);
    expect(service.getSession()).toEqual(session);
    service.ensureSession().subscribe();
    httpTesting.expectNone('/api/auth/me');
  });

  it('acepta una sesión admin sin displayName', () => {
    const session = {
      id: 'admin-1',
      email: 'admin@example.com',
      displayName: null,
      role: 'admin' as const,
    };

    service.ensureSession().subscribe();
    httpTesting.expectOne('/api/auth/me').flush(session);

    expect(service.getSession()).toEqual(session);
  });

  it('trata un 401 como sesión ausente', () => {
    let result = undefined;
    service.ensureSession().subscribe((value) => (result = value as never));
    httpTesting.expectOne('/api/auth/me').flush({}, { status: 401, statusText: 'Unauthorized' });

    expect(result).toBeNull();
    expect(service.getSession()).toBeNull();
  });

  it('cierra la sesión en el backend y limpia el estado', () => {
    service.logout().subscribe();
    const request = httpTesting.expectOne('/api/auth/logout');
    expect(request.request.method).toBe('POST');
    request.flush(null);
    expect(service.getSession()).toBeNull();
  });

  it('propaga el error de logout y aun así limpia la sesión local', () => {
    service.ensureSession().subscribe();
    httpTesting.expectOne('/api/auth/me').flush({
      id: 'admin-1',
      email: 'admin@example.com',
      displayName: null,
      role: 'admin',
    });
    let logoutError: unknown;

    service.logout().subscribe({ error: (error) => (logoutError = error) });
    httpTesting.expectOne('/api/auth/logout').flush(
      { message: 'revocation failed' },
      { status: 500, statusText: 'Server Error' },
    );

    expect(logoutError).toBeTruthy();
    expect(service.getSession()).toBeNull();
  });
});

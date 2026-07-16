import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { EditorAuthService } from '../../services/editor-auth.service';
import { apiCredentialsInterceptor } from './api-credentials.interceptor';

describe('apiCredentialsInterceptor', () => {
  let http: HttpClient;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        provideHttpClient(withInterceptors([apiCredentialsInterceptor])),
        provideHttpClientTesting(),
        EditorAuthService,
      ],
    });
    http = TestBed.inject(HttpClient);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpTesting.verify());

  it('agrega withCredentials solo a requests de la API', () => {
    http.get('/api/editor/events').subscribe();
    expect(httpTesting.expectOne('/api/editor/events').request.withCredentials).toBeTrue();

    http.get('/assets/data.json').subscribe();
    expect(httpTesting.expectOne('/assets/data.json').request.withCredentials).toBeFalse();
  });

  it('conserva la ruta editorial al manejar un 401', () => {
    const router = TestBed.inject(Router);
    spyOnProperty(router, 'url', 'get').and.returnValue('/editor/eventos');
    const navigate = spyOn(router, 'navigate').and.resolveTo(true);

    http.get('/api/editor/events').subscribe({ error: () => undefined });
    httpTesting.expectOne('/api/editor/events').flush(
      {},
      { status: 401, statusText: 'Unauthorized' },
    );

    expect(navigate).toHaveBeenCalledWith(['/login'], {
      queryParams: { error: 'session_expired', returnUrl: '/editor/eventos' },
    });
  });
});

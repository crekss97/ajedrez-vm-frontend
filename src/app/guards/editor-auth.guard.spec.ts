import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { firstValueFrom, of } from 'rxjs';
import { EditorSession } from '../models/editor';
import { EditorAuthService } from '../services/editor-auth.service';
import { editorAuthGuard } from './editor-auth.guard';

describe('editorAuthGuard', () => {
  const auth = jasmine.createSpyObj<EditorAuthService>('EditorAuthService', ['ensureSession']);

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideRouter([]), { provide: EditorAuthService, useValue: auth }],
    });
    auth.ensureSession.calls.reset();
  });

  it('permite entrar cuando el backend valida la sesión', async () => {
    auth.ensureSession.and.returnValue(of({
      id: 'editor-1', email: 'editor@example.com', displayName: 'Editor', role: 'editor',
    } satisfies EditorSession));

    const result = await runGuard('/editor');
    expect(result).toBeTrue();
  });

  it('redirige a /login conservando el destino cuando no hay sesión', async () => {
    auth.ensureSession.and.returnValue(of(null));

    const result = await runGuard('/editor/eventos');
    expect(TestBed.inject(Router).serializeUrl(result as never)).toBe('/login?returnUrl=%2Feditor%2Feventos');
  });

  function runGuard(url: string): Promise<unknown> {
    return TestBed.runInInjectionContext(() => firstValueFrom(editorAuthGuard(
      {} as never,
      { url } as never,
    ) as never));
  }
});

import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { take } from 'rxjs';
import { EditorAuthService } from '../../services/editor-auth.service';

const LOGIN_ERRORS: Record<string, string> = {
  access_denied: 'Google no autorizó el acceso. Podés intentarlo nuevamente cuando quieras.',
  not_allowed: 'Esta cuenta no tiene permisos editoriales en Ajedrez VM.',
  oauth_failed: 'Google no pudo completar la autenticación. Intentá nuevamente en unos instantes.',
  session_expired: 'Tu sesión editorial venció. Volvé a ingresar para continuar.',
  logout_failed: 'La sesión local se cerró, pero el servidor no pudo confirmar la operación.',
};

@Component({
  selector: 'app-editor-login',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './editor-login.html',
  styleUrl: './editor-login.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EditorLogin {
  private readonly auth = inject(EditorAuthService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly errorCode = this.route.snapshot.queryParamMap.get('error');
  private readonly returnUrl = validEditorReturnUrl(
    this.route.snapshot.queryParamMap.get('returnUrl'),
  );

  protected readonly redirecting = signal(false);
  protected readonly checkingSession = signal(true);
  protected readonly errorMessage = this.errorCode
    ? LOGIN_ERRORS[this.errorCode]
      ?? `El servidor informó el error “${this.errorCode}”. Podés intentar el ingreso nuevamente.`
    : '';

  constructor() {
    this.auth.ensureSession().pipe(take(1)).subscribe((session) => {
      if (session) {
        void this.router.navigateByUrl(this.returnUrl ?? '/editor');
        return;
      }

      this.checkingSession.set(false);
    });
  }

  protected authenticate(): void {
    this.redirecting.set(true);
    this.auth.startGoogleLogin(this.returnUrl);
  }
}

function validEditorReturnUrl(value: string | null): string | undefined {
  if (!value || !value.startsWith('/') || value.startsWith('//') || value.includes('\\')) {
    return undefined;
  }

  try {
    const url = new URL(value, window.location.origin);
    if (
      url.origin !== window.location.origin
      || (url.pathname !== '/editor' && !url.pathname.startsWith('/editor/'))
    ) {
      return undefined;
    }
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return undefined;
  }
}

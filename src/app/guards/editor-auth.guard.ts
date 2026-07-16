import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { map } from 'rxjs';
import { EditorAuthService } from '../services/editor-auth.service';

export const editorAuthGuard: CanActivateFn = (_, state) => {
  const authService = inject(EditorAuthService);
  const router = inject(Router);

  return authService.ensureSession().pipe(
    map((session) => session ? true : router.createUrlTree(['/login'], {
      queryParams: { returnUrl: state.url },
    })),
  );
};

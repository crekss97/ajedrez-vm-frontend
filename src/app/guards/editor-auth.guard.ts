import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { EditorAuthService } from '../services/editor-auth.service';

export const editorAuthGuard: CanActivateFn = () => {
  const authService = inject(EditorAuthService);
  const router = inject(Router);

  return authService.isAuthenticated() ? true : router.createUrlTree(['/editor/login']);
};

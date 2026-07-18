import { HttpContextToken, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { defer, finalize } from 'rxjs';
import { AppLoadingService } from '../app-loading.service';

export const OMITIR_CARGADOR_GLOBAL = new HttpContextToken(() => false);

export const appLoadingInterceptor: HttpInterceptorFn = (request, next) => {
  if (request.context.get(OMITIR_CARGADOR_GLOBAL)) {
    return next(request);
  }

  const cargador = inject(AppLoadingService);

  return defer(() => {
    const finalizar = cargador.iniciar();
    return next(request).pipe(finalize(finalizar));
  });
};

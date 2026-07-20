import { DATE_PIPE_DEFAULT_OPTIONS, registerLocaleData } from '@angular/common';
import localeEsAr from '@angular/common/locales/es-AR';
import { ApplicationConfig, LOCALE_ID, provideBrowserGlobalErrorListeners, provideZoneChangeDetection } from '@angular/core';
import {
  PreloadAllModules,
  provideRouter,
  withPreloading,
} from '@angular/router';

import { routes } from './app.routes';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { apiCredentialsInterceptor } from './core/interceptors/api-credentials.interceptor';
import { appLoadingInterceptor } from './core/interceptors/app-loading.interceptor';

registerLocaleData(localeEsAr);

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    { provide: LOCALE_ID, useValue: 'es-AR' },
    { provide: DATE_PIPE_DEFAULT_OPTIONS, useValue: { timezone: '-0300' } },
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(
      routes,
      withPreloading(PreloadAllModules),
    ),
    provideHttpClient(withInterceptors([appLoadingInterceptor, apiCredentialsInterceptor])),
  ]
};

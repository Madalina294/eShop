import { ApplicationConfig, importProvidersFrom, provideZoneChangeDetection } from '@angular/core';
import { TitleStrategy, provideRouter, withComponentInputBinding, withInMemoryScrolling } from '@angular/router';
import { provideClientHydration, withEventReplay } from '@angular/platform-browser';
import { HttpClient, provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { registerLocaleData } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateLoader, TranslateModule, TranslationObject } from '@ngx-translate/core';
import en from '@angular/common/locales/en';
import ro from '@angular/common/locales/ro';

import { routes } from './app.routes';
import { TranslatedTitleStrategy } from './core/translated-title.strategy';
import { authInterceptor } from './core/interceptors/auth.interceptor';
import { errorInterceptor } from './core/interceptors/error.interceptor';

export function HttpLoaderFactory(http: HttpClient): TranslateLoader {
  return {
    getTranslation: (lang: string) => http.get<TranslationObject>(`/assets/i18n/${lang}.json`),
  };
}

// Both locales so dates, numbers and currency format correctly in either language.
registerLocaleData(en);
registerLocaleData(ro);

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),

    provideRouter(
      routes,
      // Restore the previous scroll position on back/forward, and start at the
      // top on a new navigation — the app used to keep the old scroll offset.
      withInMemoryScrolling({ scrollPositionRestoration: 'enabled', anchorScrolling: 'enabled' }),
      withComponentInputBinding()
    ),

    provideClientHydration(withEventReplay()),

    // One HttpClient registration (it used to be provided twice).
    // authInterceptor runs first so errorInterceptor sees an already
    // handled 401 and stays quiet about it.
    provideHttpClient(withFetch(), withInterceptors([authInterceptor, errorInterceptor])),

    provideAnimationsAsync(),

    // Resolves route `title` keys through ngx-translate and follows RO/EN.
    { provide: TitleStrategy, useClass: TranslatedTitleStrategy },

    importProvidersFrom(FormsModule),
    importProvidersFrom(
      TranslateModule.forRoot({
        fallbackLang: 'en',
        loader: {
          provide: TranslateLoader,
          useFactory: HttpLoaderFactory,
          deps: [HttpClient],
        },
      })
    ),
  ],
};

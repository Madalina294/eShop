import { DestroyRef, Injectable, Injector, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Title } from '@angular/platform-browser';
import { RouterStateSnapshot, TitleStrategy } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';

const APP_NAME_KEY = 'app.name';
const APP_NAME_FALLBACK = 'eShop';

/**
 * Resolves each route's `title` as a translation key and keeps the browser tab
 * in sync when the user switches language. Routes previously carried no titles
 * at all, so every page read "2faAngular".
 *
 * `TranslateService` is resolved lazily and only in the browser. Injecting it
 * eagerly makes ngx-translate fetch `/assets/i18n/*.json` while the strategy is
 * constructed; under SSR that relative request never settles, and because the
 * router builds this strategy during route extraction, the whole build hung
 * until it timed out.
 */
@Injectable({ providedIn: 'root' })
export class TranslatedTitleStrategy extends TitleStrategy {
  private readonly title = inject(Title);
  private readonly injector = inject(Injector);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  private readonly destroyRef = inject(DestroyRef);

  private translate?: TranslateService;
  private currentKey?: string;
  private listening = false;

  override updateTitle(snapshot: RouterStateSnapshot): void {
    this.currentKey = this.buildTitle(snapshot);

    if (!this.isBrowser) return;

    this.listenForLanguageChanges();
    this.apply(this.currentKey);
  }

  /** Subscribes on the first browser navigation, never on the server. */
  private listenForLanguageChanges(): void {
    if (this.listening) return;
    this.listening = true;

    this.translator()
      .onLangChange.pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.apply(this.currentKey));
  }

  private translator(): TranslateService {
    this.translate ??= this.injector.get(TranslateService);
    return this.translate;
  }

  private apply(key: string | undefined): void {
    const appName = this.safeTranslate(APP_NAME_KEY, APP_NAME_FALLBACK);
    this.title.setTitle(key ? `${this.safeTranslate(key, appName)} · ${appName}` : appName);
  }

  /** `instant()` echoes the key back while the bundle is still loading. */
  private safeTranslate(key: string, fallback: string): string {
    const value = this.translator().instant(key);
    return typeof value === 'string' && value !== key ? value : fallback;
  }
}

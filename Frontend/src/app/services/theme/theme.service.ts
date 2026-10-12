import { Injectable, Inject, signal } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { BehaviorSubject, Observable } from 'rxjs';

export type Theme = 'light' | 'dark';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  // Light is the default theme. Accounts that have `preferredTheme = 'dark'`
  // stored server-side are still honoured by `loadUserTheme()` — only the
  // fallback for guests and for accounts without a preference changed.
  private currentThemeSubject = new BehaviorSubject<Theme>('light');
  public currentTheme$ = this.currentThemeSubject.asObservable();

  public isDarkMode = signal(false);

  /**
   * `AppComponent.ngOnInit` calls `reinitializeTheme()`, which re-enters
   * `initializeTheme()`. Without this guard every call added another
   * `matchMedia` listener and they accumulated for the life of the tab.
   */
  private mediaListenerBound = false;

  constructor(@Inject(DOCUMENT) private document: Document) {
    this.initializeTheme();
  }

  private initializeTheme(): void {
    // Verifică dacă suntem în browser (nu pe server)
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
      this.currentThemeSubject.next('light');
      this.isDarkMode.set(false);
      return;
    }

    // Verifică dacă există o temă salvată în localStorage
    const savedTheme = localStorage.getItem('theme') as Theme;
    if (savedTheme) {
      this.currentThemeSubject.next(savedTheme);
      this.isDarkMode.set(savedTheme === 'dark');
      this.applyTheme(savedTheme);
    } else {
      // First launch: follow the OS. Deliberately NOT persisted — writing the
      // inferred value used to make the listener below dead code, because its
      // `!localStorage.getItem('theme')` guard could then never be true.
      this.setTheme(this.systemPreference(), { persist: false });
    }

    // Ascultă schimbările în preferința sistemului
    if (!this.mediaListenerBound) {
      this.mediaListenerBound = true;
      window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
        // Only while the visitor has made no explicit choice of their own.
        if (!localStorage.getItem('theme')) {
          this.setTheme(e.matches ? 'dark' : 'light', { persist: false });
        }
      });
    }
  }

  private systemPreference(): Theme {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return 'light';
    }
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  // Adaugă această metodă pentru a încărca preferința utilizatorului la login
  public loadUserTheme(userTheme?: string): void {
    if (userTheme && (userTheme === 'light' || userTheme === 'dark')) {
      this.setTheme(userTheme as Theme);
    } else {
      // Dacă nu există preferință, folosește light mode
      this.setTheme('light');
    }
  }

  public setTheme(theme: Theme, options: { persist?: boolean } = {}): void {
    const { persist = true } = options;

    this.currentThemeSubject.next(theme);
    this.isDarkMode.set(theme === 'dark');
    this.applyTheme(theme);

    // Salvează tema în localStorage doar dacă este disponibil
    if (persist && typeof localStorage !== 'undefined') {
      localStorage.setItem('theme', theme);
    }
  }

  public toggleTheme(): void {
    const newTheme: Theme = this.currentThemeSubject.value === 'light' ? 'dark' : 'light';
    this.setTheme(newTheme);
  }

  public getCurrentTheme(): Theme {
    return this.currentThemeSubject.value;
  }

  public reinitializeTheme(): void {
    this.initializeTheme();
  }

  private applyTheme(theme: Theme): void {
    // Verifică dacă document este disponibil (nu pe server)
    if (typeof document === 'undefined' || !this.document?.body) {
      return;
    }

    if (theme === 'light') {
      this.document.documentElement.classList.add('light-mode');
      this.document.documentElement.classList.remove('dark-mode');
      this.document.body.classList.add('light-mode');
      this.document.body.classList.remove('dark-mode');
    } else {
      this.document.documentElement.classList.add('dark-mode');
      this.document.documentElement.classList.remove('light-mode');
      this.document.body.classList.add('dark-mode');
      this.document.body.classList.remove('light-mode');
    }
  }

  /** Reset to the default theme on logout. */
  public resetToDefaultTheme(): void {
    // Șterge tema salvată din localStorage
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem('theme');
    }

    // Back to the guest default: follow the OS, without persisting it.
    this.setTheme(this.systemPreference(), { persist: false });
  }
}

import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TranslateModule } from '@ngx-translate/core';

import { AppHeaderComponent } from './shared/layout/app-header/app-header.component';
import { AppFooterComponent } from './shared/layout/app-footer/app-footer.component';
import { UserStateService } from './services/user-state/user-state.service';
import { ThemeService } from './services/theme/theme.service';
import { LanguageService } from './services/language/language.service';

/**
 * The application shell: skip link, header, routed content, footer.
 *
 * All chrome moved into `AppHeaderComponent` / `AppFooterComponent`; this
 * component only keeps the cross-navigation bookkeeping (re-reading the user
 * from storage and applying their theme/language preferences).
 */
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, AppHeaderComponent, AppFooterComponent, TranslateModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly userState = inject(UserStateService);
  private readonly themeService = inject(ThemeService);
  private readonly lang = inject(LanguageService);

  ngOnInit(): void {
    this.themeService.reinitializeTheme();
    this.lang.reinitializeLanguage();

    // The old version compared `event.constructor.name`, which breaks under
    // minification, and never unsubscribed.
    this.router.events
      .pipe(
        filter((event): event is NavigationEnd => event instanceof NavigationEnd),
        takeUntilDestroyed()
      )
      .subscribe(() => this.applyUserPreferences());
  }

  /** Storage can change outside Angular (another tab, OAuth callback). */
  private applyUserPreferences(): void {
    this.userState.loadUserFromStorage();
    const user = this.userState.user();

    if (user?.preferredTheme) {
      this.themeService.loadUserTheme(user.preferredTheme);
    } else {
      this.themeService.resetToDefaultTheme();
    }

    if (user?.preferredLanguage) {
      this.lang.loadUserLanguage(user.preferredLanguage);
    } else {
      this.lang.resetToDefaultLanguage();
    }
  }
}

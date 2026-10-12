import { ChangeDetectionStrategy, Component, OnInit, computed, inject } from '@angular/core';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter, map, startWith } from 'rxjs';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { TranslateModule } from '@ngx-translate/core';

import { AppHeaderComponent } from './shared/layout/app-header/app-header.component';
import { AppFooterComponent } from './shared/layout/app-footer/app-footer.component';
import { UserStateService } from './services/user-state/user-state.service';
import { ThemeService } from './services/theme/theme.service';
import { LanguageService } from './services/language/language.service';

/**
 * Routes that render without the application chrome. They are landing pages
 * for signed-out visitors, so an app header full of navigation the visitor
 * cannot use would only get in the way; they carry their own branding and
 * their own language/theme controls instead.
 */
const CHROMELESS_ROUTES = [
  '/login',
  '/register',
  '/enter-email',
  '/reset-password',
  '/oauth-callback',
];

/** The application shell: skip link, header, routed content, footer. */
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

  private readonly path = toSignal(
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd),
      startWith(null),
      map(() => this.router.url.split('?')[0])
    ),
    { initialValue: '' }
  );

  protected readonly showChrome = computed(() => !CHROMELESS_ROUTES.includes(this.path()));

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

  /**
   * Storage can change outside Angular (another tab, the OAuth callback), so
   * the signed-in user's saved theme and language are re-applied on every
   * navigation.
   *
   * A signed-out visitor is left alone: resetting here wiped their own choice
   * on each navigation, so a guest who picked light mode or Romanian on the
   * login screen was flipped back the moment they opened the register page.
   * Logging out still resets, via the header's own sign-out handler.
   */
  private applyUserPreferences(): void {
    this.userState.loadUserFromStorage();
    const user = this.userState.user();
    if (!user) return;

    if (user.preferredTheme) this.themeService.loadUserTheme(user.preferredTheme);
    if (user.preferredLanguage) this.lang.loadUserLanguage(user.preferredLanguage);
  }
}

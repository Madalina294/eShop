import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterLinkActive } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { filter, map, startWith } from 'rxjs';
import { MatBadgeModule } from '@angular/material/badge';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TranslateModule } from '@ngx-translate/core';

import { UserStateService } from '../../../services/user-state/user-state.service';
import { UserService } from '../../../services/user/user.service';
import { ThemeService } from '../../../services/theme/theme.service';
import { LanguageService } from '../../../services/language/language.service';
import { CartStateService } from '../../state/cart-state.service';
import { avatarUrl } from '../../../core/http/image-url';

interface NavItem {
  readonly label: string;
  readonly link: string;
  readonly icon: string;
}

const CUSTOMER_NAV: readonly NavItem[] = [
  { label: 'header.homePage', link: '/user/all-products', icon: 'storefront' },
  { label: 'cart.title', link: '/user/cart', icon: 'shopping_cart' },
  { label: 'wishlist.title', link: '/user/wishlist', icon: 'favorite_border' },
];

const ADMIN_NAV: readonly NavItem[] = [
  { label: 'header.dashboardAdmin', link: '/admin/dashboard', icon: 'dashboard' },
  { label: 'viewProducts.title', link: '/admin/view-products', icon: 'inventory_2' },
  { label: 'viewCategories.title', link: '/admin/view-categories', icon: 'category' },
  { label: 'header.manageUsers', link: '/admin/all-users', icon: 'supervisor_account' },
  { label: 'adminStatistics.title', link: '/admin/statistics', icon: 'insights' },
];

/**
 * The app chrome: brand, primary navigation, catalogue search, cart and
 * wishlist badges, language switch, theme toggle and the account menu.
 *
 * Replaces the toolbar that used to live inside `AppComponent`, which served
 * desktop and mobile from a single hamburger menu, had no search and no
 * badges, and used a `<div routerLink>` as the brand link.
 */
@Component({
  selector: 'app-header',
  standalone: true,
  imports: [
    RouterLink,
    RouterLinkActive,
    MatBadgeModule,
    MatButtonModule,
    MatButtonToggleModule,
    MatDividerModule,
    MatIconModule,
    MatMenuModule,
    MatToolbarModule,
    MatTooltipModule,
    TranslateModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './app-header.component.html',
  styleUrl: './app-header.component.scss',
})
export class AppHeaderComponent {
  private readonly router = inject(Router);
  private readonly userService = inject(UserService);
  private readonly themeService = inject(ThemeService);

  protected readonly userState = inject(UserStateService);
  protected readonly cartState = inject(CartStateService);
  protected readonly lang = inject(LanguageService);

  protected readonly isAdmin = this.userState.isAdmin;
  protected readonly isCustomer = this.userState.isCustomer;
  protected readonly isSignedIn = computed(() => this.isAdmin() || this.isCustomer());
  protected readonly userName = this.userState.userName;
  protected readonly isDarkMode = this.themeService.isDarkMode;

  /**
   * Language as a signal. `LanguageService.current` is a plain getter, which an
   * OnPush template has no reason to re-read when the language changes.
   */
  protected readonly currentLang = toSignal(this.lang.currentLanguage$, {
    initialValue: this.lang.current,
  });

  protected readonly avatar = computed(() => {
    const image = this.userState.userImage();
    return image ? avatarUrl(image) : null;
  });

  /** First letter of the user's name, shown when there is no avatar image. */
  protected readonly initial = computed(() => this.userName().trim().charAt(0).toUpperCase());

  protected readonly navItems = computed<readonly NavItem[]>(() =>
    this.isAdmin() ? ADMIN_NAV : this.isCustomer() ? CUSTOMER_NAV : []
  );

  /** Home target depends on the role, so the brand link is never a dead end. */
  protected readonly homeLink = computed(() =>
    this.isAdmin() ? '/admin/dashboard' : this.isCustomer() ? '/user/all-products' : '/login'
  );

  protected readonly mobileNavOpen = signal(false);
  protected readonly searchOpen = signal(false);
  /**
   * The active search term, read back from the URL so a reload or a shared
   * link shows what is actually being searched.
   */
  protected readonly searchTerm = toSignal(
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd),
      startWith(null),
      map(() => this.router.parseUrl(this.router.url).queryParams['q'] ?? '')
    ),
    { initialValue: '' }
  );

  protected toggleMobileNav(): void {
    this.mobileNavOpen.update(open => !open);
  }

  protected closeMobileNav(): void {
    this.mobileNavOpen.set(false);
  }

  protected toggleSearch(): void {
    this.searchOpen.update(open => !open);
  }

  protected onSearchSubmit(event: Event, term: string): void {
    event.preventDefault();
    this.submitSearch(term);
  }

  protected clearSearch(input: HTMLInputElement): void {
    input.value = '';
    this.submitSearch('');
    input.focus();
  }

  protected toggleTheme(): void {
    this.themeService.toggleTheme();
    this.persistTheme();
  }

  protected changeLanguage(language: 'en' | 'ro'): void {
    if (language === this.lang.current) return;

    // Apply immediately; persisting it is best-effort.
    this.lang.use(language);

    const user = this.userState.user();
    if (!user) return;

    this.userService.updatePreferredLanguage(user.id, language).subscribe({
      next: () => this.userState.updateUser({ preferredLanguage: language }),
      error: () => {
        /* The UI language stays changed even if the backend write fails. */
      },
    });
  }

  protected logout(): void {
    this.userState.clearUser();
    this.themeService.resetToDefaultTheme();
    this.lang.resetToDefaultLanguage();
    this.closeMobileNav();
    this.router.navigateByUrl('/login');
  }

  /** Search lives in the URL so results are shareable and survive a reload. */
  private submitSearch(term: string): void {
    const query = term.trim();
    this.closeMobileNav();

    this.router.navigate(['/user/all-products'], {
      queryParams: { q: query || null },
      queryParamsHandling: 'merge',
    });
  }

  private persistTheme(): void {
    const user = this.userState.user();
    if (!user) return;

    const theme = this.themeService.getCurrentTheme();
    this.userService.updatePreferredTheme(user.id, theme).subscribe({
      next: () => this.userState.updateUser({ preferredTheme: theme }),
      error: () => {
        /* Theme stays applied locally even if the backend write fails. */
      },
    });
  }
}

import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule } from '@ngx-translate/core';

import { UserStateService } from '../../services/user-state/user-state.service';
import { ThemeService } from '../../services/theme/theme.service';
import { LanguageService } from '../../services/language/language.service';
import { avatarUrl } from '../../core/http/image-url';
import { PageHeaderComponent } from '../../shared/ui/page-header/page-header.component';

/**
 * Post-login landing page.
 *
 * Reads the signed-in user from `UserStateService` instead of re-reading
 * `localStorage` on every init, and resolves the avatar through `avatarUrl()`
 * — the old `getFullImageUrl()` hardcoded `http://localhost:8080`.
 */
@Component({
  selector: 'app-welcome',
  standalone: true,
  imports: [RouterLink, MatButtonModule, MatIconModule, TranslateModule, PageHeaderComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './welcome.component.html',
  styleUrl: './welcome.component.scss',
})
export class WelcomeComponent {
  private readonly router = inject(Router);
  private readonly themeService = inject(ThemeService);
  private readonly lang = inject(LanguageService);

  protected readonly userState = inject(UserStateService);

  protected readonly user = this.userState.user;
  protected readonly isCustomer = this.userState.isCustomer;

  protected readonly avatar = computed(() => {
    const image = this.userState.userImage();
    return image ? avatarUrl(image) : null;
  });

  protected readonly initials = computed(() => {
    const user = this.user();
    if (!user) return '';
    return `${user.firstname?.charAt(0) ?? ''}${user.lastname?.charAt(0) ?? ''}`.toUpperCase();
  });

  protected logout(): void {
    this.userState.clearUser();
    this.themeService.resetToDefaultTheme();
    this.lang.resetToDefaultLanguage();
    this.router.navigateByUrl('/login');
  }
}

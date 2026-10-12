import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule } from '@ngx-translate/core';

import { UserStateService } from '../../services/user-state/user-state.service';
import { UserService } from '../../services/user/user.service';
import { Theme, ThemeService } from '../../services/theme/theme.service';
import { LanguageService, } from '../../services/language/language.service';
import { NotificationService } from '../../shared/notification/notification.service';
import { PageHeaderComponent } from '../../shared/ui/page-header/page-header.component';

type Language = 'en' | 'ro';

/**
 * Theme and language preferences.
 *
 * Both are applied optimistically and then persisted: the services are the
 * source of truth for what is currently active, so the controls stay correct
 * even when the theme or language is changed from the header instead.
 */
@Component({
  selector: 'app-edit-preferences',
  standalone: true,
  imports: [
    RouterLink,
    MatButtonModule,
    MatButtonToggleModule,
    MatIconModule,
    TranslateModule,
    PageHeaderComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './edit-preferences.component.html',
  styleUrl: './edit-preferences.component.scss',
})
export class EditPreferencesComponent {
  private readonly userState = inject(UserStateService);
  private readonly userService = inject(UserService);
  private readonly themeService = inject(ThemeService);
  private readonly languageService = inject(LanguageService);
  private readonly notifications = inject(NotificationService);

  protected readonly theme = signal<Theme>(this.themeService.getCurrentTheme());
  protected readonly language = signal<Language>(this.languageService.current as Language);
  protected readonly saving = signal(false);

  constructor() {
    // Keep in step with changes made elsewhere (the header has both controls).
    this.themeService.currentTheme$
      .pipe(takeUntilDestroyed())
      .subscribe(theme => this.theme.set(theme));

    this.languageService.currentLanguage$
      .pipe(takeUntilDestroyed())
      .subscribe(language => this.language.set(language as Language));
  }

  protected onThemeChange(theme: Theme): void {
    // Apply first: a preference the user cannot see take effect feels broken,
    // and a failed save only means the server keeps the previous value.
    this.themeService.setTheme(theme);
    this.persist('preferredTheme', theme, 'preferences.themeUpdated', 'preferences.themeUpdateError');
  }

  protected onLanguageChange(language: Language): void {
    this.languageService.use(language);
    this.persist(
      'preferredLanguage',
      language,
      'preferences.languageUpdated',
      'preferences.languageUpdateError'
    );
  }

  private persist(
    field: 'preferredTheme' | 'preferredLanguage',
    value: string,
    successKey: string,
    errorKey: string
  ): void {
    const user = this.userState.user();
    if (!user) return;

    this.saving.set(true);

    const request$ =
      field === 'preferredTheme'
        ? this.userService.updatePreferredTheme(user.id, value)
        : this.userService.updatePreferredLanguage(user.id, value);

    request$.subscribe({
      next: () => {
        this.saving.set(false);
        this.userState.updateUser({ [field]: value });
        this.notifications.success(successKey);
      },
      error: () => {
        this.saving.set(false);
        this.notifications.error(errorKey);
      },
    });
  }
}

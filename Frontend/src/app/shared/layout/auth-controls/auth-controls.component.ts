import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TranslateModule } from '@ngx-translate/core';

import { LanguageService } from '../../../services/language/language.service';
import { ThemeService } from '../../../services/theme/theme.service';

/**
 * Floating language and theme controls for the auth screens, which render
 * without the application header.
 *
 * A visitor who cannot read the interface must still be able to switch
 * language before signing in, so these cannot live only in the app chrome.
 */
@Component({
  selector: 'app-auth-controls',
  standalone: true,
  imports: [
    MatButtonModule,
    MatButtonToggleModule,
    MatIconModule,
    MatTooltipModule,
    TranslateModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './auth-controls.component.html',
  styleUrl: './auth-controls.component.scss',
})
export class AuthControlsComponent {
  private readonly themeService = inject(ThemeService);
  protected readonly lang = inject(LanguageService);

  protected readonly isDarkMode = this.themeService.isDarkMode;

  /** A plain getter would not re-render an OnPush template on change. */
  protected readonly currentLang = toSignal(this.lang.currentLanguage$, {
    initialValue: this.lang.current,
  });

  protected changeLanguage(language: 'en' | 'ro'): void {
    if (language !== this.lang.current) this.lang.use(language);
  }

  protected toggleTheme(): void {
    this.themeService.toggleTheme();
  }
}

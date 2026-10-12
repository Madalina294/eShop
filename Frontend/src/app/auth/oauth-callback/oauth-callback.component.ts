import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { TranslateModule } from '@ngx-translate/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { StorageService } from '../../services/storage/storage.service';
import { UserStateService } from '../../services/user-state/user-state.service';
import { ThemeService } from '../../services/theme/theme.service';
import { environment } from '../../../environments/environments';
import { AuthControlsComponent } from '../../shared/layout/auth-controls/auth-controls.component';

/** 1: redirected back, 2: fetching the profile, 3: leaving for the shop. */
type Step = 1 | 2 | 3;

/**
 * Landing page for the Google OAuth redirect: trades the token in the URL for
 * the user profile, stores the session and moves on.
 *
 * Reworked onto OnPush + signals. The old version hardcoded
 * `http://localhost:8080` (breaking every non-local build), logged the whole
 * user object to the console, and padded the flow with ~2s of artificial
 * `setTimeout` delays that existed only to let change detection catch up.
 */
@Component({
  selector: 'app-oauth-callback',
  standalone: true,
  imports: [
    TranslateModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    AuthControlsComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './oauth-callback.component.html',
})
export class OAuthCallbackComponent {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly userState = inject(UserStateService);
  private readonly themeService = inject(ThemeService);

  protected readonly step = signal<Step>(1);
  protected readonly failed = signal(false);

  constructor() {
    this.processCallback();
  }

  protected retry(): void {
    this.failed.set(false);
    this.step.set(1);
    this.router.navigateByUrl('/login');
  }

  private processCallback(): void {
    // SSR has no URL to read; the browser repeats this on hydration.
    if (typeof window === 'undefined') return;

    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    const userId = params.get('userId');
    const googleId = params.get('googleId') ?? '';

    if (!token || !userId) {
      this.failed.set(true);
      return;
    }

    StorageService.saveToken(token);
    this.step.set(2);

    const url = `${environment.apiUrl}/auth/oauth-user-data?userId=${userId}&googleId=${googleId}`;

    this.http.get<Record<string, any>>(url).subscribe({
      next: response => {
        const user = {
          id: response['userId'],
          firstname: response['userFirstName'],
          lastname: response['userLastName'],
          email: response['email'] ?? '',
          role: response['userRole'] ?? 'USER',
          image: response['image'] ?? null,
          preferredTheme: response['preferredTheme'] ?? 'light',
          preferredLanguage: response['preferredLanguage'] ?? 'en',
          mfaEnabled: response['mfaEnabled'] ?? false,
          googleId: response['googleId'] ?? googleId,
        };

        StorageService.saveUser(user);
        this.userState.setUser(user);
        this.themeService.loadUserTheme(user.preferredTheme);

        this.step.set(3);
        this.router.navigateByUrl('/user/all-products');
      },
      error: () => this.failed.set(true),
    });
  }
}

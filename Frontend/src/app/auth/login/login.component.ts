import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { TranslateModule } from '@ngx-translate/core';
import { AuthControlsComponent } from '../../shared/layout/auth-controls/auth-controls.component';

import { AuthenticationService } from '../../services/auth/authentication.service';
import { StorageService } from '../../services/storage/storage.service';
import { UserStateService } from '../../services/user-state/user-state.service';
import { NotificationService } from '../../shared/notification/notification.service';
import { AuthenticationResponse } from '../../models/authentication-response';
import { API_ORIGIN } from '../../core/http/image-url';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    MatButtonModule,
    MatCheckboxModule,
    MatDividerModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule,
    TranslateModule,
    AuthControlsComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './login.component.html',
})
export class LoginComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthenticationService);
  private readonly userState = inject(UserStateService);
  private readonly notifications = inject(NotificationService);
  private readonly router = inject(Router);

  protected readonly year = new Date().getFullYear();
  protected readonly submitting = signal(false);
  protected readonly passwordVisible = signal(false);

  /** Set once the backend asks for a second factor. */
  protected readonly mfaResponse = signal<AuthenticationResponse | null>(null);
  protected readonly inMfaStep = computed(() => this.mfaResponse() !== null);
  protected readonly qrCodeUrl = computed(() => this.mfaResponse()?.qrCodeUrl ?? '');

  /**
   * Only `required` on the password.
   *
   * The old form also applied the registration complexity pattern here and
   * disabled the submit button while the form was invalid — so anyone whose
   * existing password predated that policy could not sign in at all, and the
   * rules were advertised to anyone on the login screen.
   */
  protected readonly loginForm = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
  });

  protected readonly otpForm = this.fb.nonNullable.group({
    code: ['', [Validators.required, Validators.pattern(/^\d{6}$/)]],
  });

  protected login(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.submitting.set(true);
    const { email, password } = this.loginForm.getRawValue();

    this.authService.login({ email, password }).subscribe({
      next: response => {
        this.submitting.set(false);

        if (response.userId == null) {
          this.notifications.error('login.errors.badCredentials');
          return;
        }

        if (response.mfaEnabled) {
          this.mfaResponse.set(response);
          return;
        }

        this.completeSignIn(response, email);
      },
      error: error => {
        this.submitting.set(false);
        const invalidCredentials = error?.status === 401 || error?.status === 403;
        this.notifications.error(
          invalidCredentials ? 'login.errors.badCredentials' : 'login.errors.generic'
        );
      },
    });
  }

  protected verifyCode(): void {
    if (this.otpForm.invalid) {
      this.otpForm.markAllAsTouched();
      return;
    }

    this.submitting.set(true);
    const email = this.loginForm.getRawValue().email;

    this.authService.verifyCode({ email, code: this.otpForm.getRawValue().code }).subscribe({
      next: response => {
        this.submitting.set(false);
        this.completeSignIn({ ...response, mfaEnabled: true }, email);
      },
      error: () => {
        this.submitting.set(false);
        this.notifications.error('login.errors.invalidCode');
      },
    });
  }

  protected backToPassword(): void {
    this.mfaResponse.set(null);
    this.otpForm.reset();
  }

  protected loginWithGoogle(): void {
    if (typeof window === 'undefined') return;
    // Was hardcoded to localhost:8080, which broke every non-local build.
    window.location.href = `${API_ORIGIN}/oauth2/authorization/google`;
  }

  /** Stores the session and routes by role. */
  private completeSignIn(response: AuthenticationResponse, email: string): void {
    const user = {
      id: response.userId,
      role: response.userRole,
      firstname: response.userFirstName,
      lastname: response.userLastName,
      email,
      phoneNumber: response.phoneNumber ?? '',
      image: response.image ?? null,
      preferredTheme: response.preferredTheme ?? 'light',
      preferredLanguage: response.preferredLanguage ?? 'en',
      mfaEnabled: response.mfaEnabled ?? false,
      googleId: response.googleId ?? null,
    };

    StorageService.saveToken(response.accessToken as string);
    StorageService.saveUser(user);
    this.userState.setUser(user);

    // The two-factor path used to always land on `/welcome`, ignoring the role.
    this.router.navigateByUrl(user.role === 'ADMIN' ? '/admin/dashboard' : '/user/all-products');
  }
}

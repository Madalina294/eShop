import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { TranslateModule } from '@ngx-translate/core';
import { AuthControlsComponent } from '../../shared/layout/auth-controls/auth-controls.component';

import { AuthenticationService } from '../../services/auth/authentication.service';
import { StorageService } from '../../services/storage/storage.service';
import { UserStateService } from '../../services/user-state/user-state.service';
import { UserService } from '../../services/user/user.service';
import { ThemeService } from '../../services/theme/theme.service';
import { NotificationService } from '../../shared/notification/notification.service';
import { AuthenticationResponse } from '../../models/authentication-response';

/** At least 8 chars, one lower, one upper, one digit, one symbol. */
const PASSWORD_PATTERN = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;
const PHONE_PATTERN = /^[0-9+\-\s()]+$/;

/**
 * Account creation, with an optional two-factor setup step.
 *
 * Rewritten off ng-zorro onto the same Material + typed-forms structure as
 * `LoginComponent`. The old version used an untyped `FormGroup`, drove the OTP
 * field with `[(ngModel)]`, showed hardcoded English strings through
 * `NzMessageService`, had no OnPush, and silently dropped `phoneNumber` from
 * the payload it sent even though the form required it.
 */
@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    MatButtonModule,
    MatCheckboxModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule,
    TranslateModule,
    AuthControlsComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './register.component.html',
})
export class RegisterComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthenticationService);
  private readonly userService = inject(UserService);
  private readonly userState = inject(UserStateService);
  private readonly themeService = inject(ThemeService);
  private readonly notifications = inject(NotificationService);
  private readonly router = inject(Router);

  protected readonly year = new Date().getFullYear();
  protected readonly submitting = signal(false);
  protected readonly passwordVisible = signal(false);
  protected readonly confirmPasswordVisible = signal(false);

  /** Set once the account exists and the backend returned a 2FA secret. */
  protected readonly mfaResponse = signal<AuthenticationResponse | null>(null);
  protected readonly inMfaStep = computed(() => this.mfaResponse() !== null);
  protected readonly qrCodeUrl = computed(() => this.mfaResponse()?.qrCodeUrl ?? '');

  protected readonly registerForm = this.fb.nonNullable.group(
    {
      firstname: ['', [Validators.required, Validators.minLength(2)]],
      lastname: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      phoneNumber: ['', [Validators.required, Validators.pattern(PHONE_PATTERN)]],
      password: ['', [Validators.required, Validators.pattern(PASSWORD_PATTERN)]],
      confirmPassword: ['', Validators.required],
      mfaEnabled: [false],
    },
    { validators: passwordsMatchValidator }
  );

  protected readonly otpForm = this.fb.nonNullable.group({
    code: ['', [Validators.required, Validators.pattern(/^\d{6}$/)]],
  });

  protected register(): void {
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }

    this.submitting.set(true);
    const form = this.registerForm.getRawValue();

    this.authService
      .register({
        firstname: form.firstname,
        lastname: form.lastname,
        email: form.email,
        // The old code built this payload without `phoneNumber`, so the number
        // the form insisted on was never actually saved.
        phoneNumber: form.phoneNumber,
        password: form.password,
        role: 'USER',
        mfaEnabled: form.mfaEnabled,
      })
      .subscribe({
        next: response => {
          this.submitting.set(false);

          if (!response?.userId) {
            // Account created but the response is unusable — send them to login
            // rather than leaving them half signed in.
            this.notifications.error('register.errors.incompleteData');
            this.router.navigateByUrl('/login');
            return;
          }

          if (response.mfaEnabled) {
            this.mfaResponse.set(response);
            this.notifications.success('register.success.mfaReady');
            return;
          }

          this.completeSignUp(response, 'register.success.created');
        },
        error: error => {
          this.submitting.set(false);
          this.notifications.error(
            error?.status === 400 ? 'register.errors.emailExists' : 'register.errors.generic'
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
    const email = this.registerForm.getRawValue().email;

    this.authService.verifyCode({ email, code: this.otpForm.getRawValue().code }).subscribe({
      next: response => {
        this.submitting.set(false);
        this.completeSignUp({ ...response, mfaEnabled: true }, 'register.success.verified');
      },
      error: () => {
        this.submitting.set(false);
        this.otpForm.reset();
        this.notifications.error('register.errors.invalidCode');
      },
    });
  }

  /** Stores the session for the freshly created account and lands on the shop. */
  private completeSignUp(response: AuthenticationResponse, successKey: string): void {
    const form = this.registerForm.getRawValue();

    const user = {
      id: response.userId,
      role: response.userRole,
      firstname: response.userFirstName,
      lastname: response.userLastName,
      email: form.email,
      phoneNumber: response.phoneNumber ?? form.phoneNumber,
      image: response.image ?? null,
      // The frozen backend hardcodes `preferredTheme = "dark"` for every new
      // account, so a brand-new user would always land in dark mode even though
      // nobody chose it. Override here and persist the override through the
      // existing endpoint. Accounts that genuinely hold 'dark' are untouched —
      // this path only ever runs for an account created seconds ago.
      preferredTheme: 'light',
      preferredLanguage: response.preferredLanguage ?? 'en',
      mfaEnabled: response.mfaEnabled ?? false,
      googleId: response.googleId ?? null,
    };

    StorageService.saveToken(response.accessToken as string);
    StorageService.saveUser(user);
    this.userState.setUser(user);
    this.themeService.setTheme('light');

    // Best-effort: a failure here only means the server keeps its own default,
    // so it must not block the user from reaching the shop.
    this.userService.updatePreferredTheme(user.id, 'light').subscribe({ error: () => {} });

    this.notifications.success(successKey);
    this.router.navigateByUrl('/user/all-products');
  }
}

/** Cross-field check: `confirmPassword` must match `password`. */
function passwordsMatchValidator(group: AbstractControl): ValidationErrors | null {
  const password = group.get('password')?.value;
  const confirmPassword = group.get('confirmPassword')?.value;
  return password === confirmPassword ? null : { passwordsMismatch: true };
}

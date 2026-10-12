import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { TranslateModule } from '@ngx-translate/core';

import { AuthenticationService } from '../../services/auth/authentication.service';
import { UserStateService } from '../../services/user-state/user-state.service';
import { NotificationService } from '../../shared/notification/notification.service';
import { AuthControlsComponent } from '../../shared/layout/auth-controls/auth-controls.component';

/** At least 8 chars, one lower, one upper, one digit, one symbol. */
const PASSWORD_PATTERN = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;

/**
 * Step two of the password reset: the 6-digit code plus the new password.
 *
 * Rewritten off ng-zorro onto the shared `.auth` layout. The old version also
 * built `isUserLoggedIn` by OR-ing the two `isCustomer`/`isAdmin` signal
 * *functions* rather than calling them, so it was always truthy and the
 * "back" link never pointed at sign-in for an anonymous visitor.
 */
@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule,
    TranslateModule,
    AuthControlsComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './reset-password.component.html',
})
export class ResetPasswordComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthenticationService);
  private readonly userState = inject(UserStateService);
  private readonly notifications = inject(NotificationService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  protected readonly year = new Date().getFullYear();
  protected readonly submitting = signal(false);
  protected readonly newPasswordVisible = signal(false);
  protected readonly confirmPasswordVisible = signal(false);

  /** Carried over from `/enter-email` as a query param. */
  protected readonly email: string = this.route.snapshot.queryParams['email'] ?? '';

  protected readonly isSignedIn = computed(
    () => this.userState.isCustomer() || this.userState.isAdmin()
  );

  protected readonly resetForm = this.fb.nonNullable.group(
    {
      resetCode: ['', [Validators.required, Validators.pattern(/^\d{6}$/)]],
      newPassword: ['', [Validators.required, Validators.pattern(PASSWORD_PATTERN)]],
      confirmPassword: ['', Validators.required],
    },
    { validators: passwordsMatchValidator }
  );

  protected onSubmit(): void {
    if (this.resetForm.invalid) {
      this.resetForm.markAllAsTouched();
      return;
    }

    this.submitting.set(true);
    const { resetCode, newPassword } = this.resetForm.getRawValue();

    this.authService.resetPassword({ email: this.email, resetCode, newPassword }).subscribe({
      next: () => {
        this.submitting.set(false);
        this.notifications.success('resetPassword.successMessage');
        this.router.navigateByUrl('/login');
      },
      error: error => {
        this.submitting.set(false);
        // Prefer the backend's own wording when it sends one.
        this.notifications.error(
          'resetPassword.errorMessage',
          typeof error?.error === 'string' ? error.error : undefined
        );
      },
    });
  }
}

/** Cross-field check: `confirmPassword` must match `newPassword`. */
function passwordsMatchValidator(group: AbstractControl): ValidationErrors | null {
  const password = group.get('newPassword')?.value;
  const confirmPassword = group.get('confirmPassword')?.value;
  return password === confirmPassword ? null : { passwordsMismatch: true };
}

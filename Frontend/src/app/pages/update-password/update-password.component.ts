import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { TranslateModule } from '@ngx-translate/core';

import { UserService } from '../../services/user/user.service';
import { UserStateService } from '../../services/user-state/user-state.service';
import { AuthenticationService } from '../../services/auth/authentication.service';
import { NotificationService } from '../../shared/notification/notification.service';
import { PageHeaderComponent } from '../../shared/ui/page-header/page-header.component';

/** At least 8 chars, one lower, one upper, one digit, one symbol. */
const PASSWORD_PATTERN = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;

/**
 * Change the signed-in user's password, with a fallback to the emailed reset
 * code when they cannot remember the current one.
 */
@Component({
  selector: 'app-update-password',
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
    PageHeaderComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './update-password.component.html',
  styleUrl: './update-password.component.scss',
})
export class UpdatePasswordComponent {
  private readonly fb = inject(FormBuilder);
  private readonly userService = inject(UserService);
  private readonly userState = inject(UserStateService);
  private readonly authService = inject(AuthenticationService);
  private readonly notifications = inject(NotificationService);
  private readonly router = inject(Router);

  protected readonly submitting = signal(false);
  protected readonly currentPasswordVisible = signal(false);
  protected readonly newPasswordVisible = signal(false);
  protected readonly confirmPasswordVisible = signal(false);

  protected readonly form = this.fb.nonNullable.group(
    {
      // `required` only. The old form applied the complexity pattern to the
      // CURRENT password too, so anyone whose password predated that policy
      // could never change it — the same bug that was already fixed on login.
      currentPassword: ['', Validators.required],
      newPassword: ['', [Validators.required, Validators.pattern(PASSWORD_PATTERN)]],
      confirmPassword: ['', Validators.required],
    },
    { validators: passwordsMatchValidator }
  );

  protected updatePassword(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const user = this.userState.user();
    if (!user) return;

    this.submitting.set(true);
    const { currentPassword, newPassword } = this.form.getRawValue();

    this.userService.updatePassword({ userId: user.id, currentPassword, newPassword }).subscribe({
      next: updated => {
        this.submitting.set(false);

        // The endpoint returns the refreshed user; merge what it sends so the
        // header and profile do not go stale.
        if (updated) {
          this.userState.updateUser({
            firstname: updated.firstName ?? user.firstname,
            lastname: updated.lastName ?? user.lastname,
            email: updated.email ?? user.email,
            image: updated.image ?? user.image,
            mfaEnabled: updated.mfaEnabled ?? user.mfaEnabled,
          });
        }

        this.notifications.success('updatePassword.successMessage');
        this.router.navigateByUrl('/profile');
      },
      error: error => {
        this.submitting.set(false);
        this.notifications.error('updatePassword.errorMessage', readBackendMessage(error));
      },
    });
  }

  /** Falls back to the emailed reset code flow. */
  protected resetForgottenPassword(): void {
    const email = this.userState.user()?.email;
    if (!email) {
      this.notifications.error('updatePassword.emailNotFound');
      return;
    }

    this.submitting.set(true);

    this.authService.forgotPassword(email).subscribe({
      next: () => {
        this.submitting.set(false);
        this.notifications.success('updatePassword.resetCodeSent');
        this.router.navigate(['/reset-password'], { queryParams: { email } });
      },
      error: error => {
        this.submitting.set(false);
        this.notifications.error('updatePassword.resetCodeFailed', readBackendMessage(error));
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

/** The backend sends either `{ message }` or a bare string. */
function readBackendMessage(error: any): string | undefined {
  if (typeof error?.error === 'string') return error.error;
  if (typeof error?.error?.message === 'string') return error.error.message;
  return undefined;
}

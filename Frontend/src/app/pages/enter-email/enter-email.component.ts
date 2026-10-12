import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { TranslateModule } from '@ngx-translate/core';

import { AuthenticationService } from '../../services/auth/authentication.service';
import { NotificationService } from '../../shared/notification/notification.service';
import { AuthControlsComponent } from '../../shared/layout/auth-controls/auth-controls.component';

/**
 * Step one of the password reset: ask for the account email and have the
 * backend send a reset code.
 *
 * Rewritten off ng-zorro onto the shared `.auth` layout. Besides the stack
 * change, the old `onSubmit()` only gated the spinner on validity and then
 * called the API regardless — an empty or malformed email was still sent.
 */
@Component({
  selector: 'app-enter-email',
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
  templateUrl: './enter-email.component.html',
})
export class EnterEmailComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthenticationService);
  private readonly notifications = inject(NotificationService);
  private readonly router = inject(Router);

  protected readonly year = new Date().getFullYear();
  protected readonly submitting = signal(false);

  protected readonly emailForm = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
  });

  protected onSubmit(): void {
    if (this.emailForm.invalid) {
      this.emailForm.markAllAsTouched();
      return;
    }

    this.submitting.set(true);
    const email = this.emailForm.getRawValue().email;

    this.authService.forgotPassword(email).subscribe({
      next: () => {
        this.submitting.set(false);
        this.notifications.success('enterEmail.successMessage');
        this.router.navigate(['/reset-password'], { queryParams: { email } });
      },
      error: () => {
        this.submitting.set(false);
        this.notifications.error('enterEmail.errorMessage');
      },
    });
  }
}

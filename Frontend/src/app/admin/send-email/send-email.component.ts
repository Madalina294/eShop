import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { TranslateModule } from '@ngx-translate/core';

import { AdminService } from '../../services/admin/admin.service';
import { NotificationService } from '../../shared/notification/notification.service';
import { PageHeaderComponent } from '../../shared/ui/page-header/page-header.component';

/**
 * Compose an email to a user.
 *
 * The recipient arrives as an `email` query param from the user listing. Note
 * the endpoint takes query parameters rather than a body — see `AdminService`.
 */
@Component({
  selector: 'app-send-email',
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
  templateUrl: './send-email.component.html',
  styleUrl: './send-email.component.scss',
})
export class SendEmailComponent {
  private readonly fb = inject(FormBuilder);
  private readonly adminService = inject(AdminService);
  private readonly notifications = inject(NotificationService);
  private readonly route = inject(ActivatedRoute);

  protected readonly sending = signal(false);

  protected readonly form = this.fb.nonNullable.group({
    toEmail: [
      (this.route.snapshot.queryParams['email'] as string) ?? '',
      [Validators.required, Validators.email],
    ],
    subject: ['', Validators.required],
    content: ['', Validators.required],
  });

  protected submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.sending.set(true);

    this.adminService.sendEmail(this.form.getRawValue()).subscribe({
      next: () => {
        this.sending.set(false);
        this.notifications.success('sendEmail.successMessage');
        this.form.patchValue({ subject: '', content: '' });
        this.form.markAsUntouched();
      },
      error: () => {
        this.sending.set(false);
        this.notifications.error('sendEmail.errorMessage');
      },
    });
  }
}

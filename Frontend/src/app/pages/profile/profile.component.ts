import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

import { UserService } from '../../services/user/user.service';
import { UserStateService } from '../../services/user-state/user-state.service';
import { ThemeService } from '../../services/theme/theme.service';
import { LanguageService } from '../../services/language/language.service';
import { NotificationService } from '../../shared/notification/notification.service';
import { ConfirmDeleteComponent } from '../../shared/confirm-delete/confirm-delete.component';
import { PageHeaderComponent } from '../../shared/ui/page-header/page-header.component';
import { avatarUrl } from '../../core/http/image-url';

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

/**
 * Profile details, avatar, two-factor opt-in and the destructive account
 * actions for the signed-in user.
 *
 * The previous version created its `effect()` inside `ngOnInit` with a manually
 * passed `Injector` and sprinkled `cdr.markForCheck()` around to compensate,
 * typed its state as `any`, hardcoded `http://localhost:8080` for the avatar,
 * and logged the result of a `computed` to the console on every read.
 */
@Component({
  selector: 'app-profile',
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
    PageHeaderComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.scss',
})
export class ProfileComponent {
  private readonly fb = inject(FormBuilder);
  private readonly userService = inject(UserService);
  private readonly themeService = inject(ThemeService);
  private readonly lang = inject(LanguageService);
  private readonly notifications = inject(NotificationService);
  private readonly translate = inject(TranslateService);
  private readonly dialog = inject(MatDialog);
  private readonly router = inject(Router);

  protected readonly userState = inject(UserStateService);
  protected readonly user = this.userState.user;
  protected readonly isCustomer = this.userState.isCustomer;

  protected readonly saving = signal(false);
  protected readonly selectedFile = signal<File | null>(null);
  /** Local base64 preview, shown until the upload lands. */
  protected readonly preview = signal<string | null>(null);

  protected readonly avatar = computed(() => {
    const local = this.preview();
    if (local) return local;

    const image = this.userState.userImage();
    return image ? avatarUrl(image) : avatarUrl(null);
  });

  /** Google accounts manage their own email, password and 2FA. */
  protected readonly isGoogleUser = computed(() => !!this.user()?.googleId?.trim());

  protected readonly form = this.fb.nonNullable.group({
    firstName: ['', [Validators.required, Validators.minLength(2)]],
    lastName: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, Validators.email]],
    phoneNumber: ['', Validators.pattern(/^[0-9+\-\s()]+$/)],
    mfaEnabled: [false],
  });

  constructor() {
    // Field-initialiser context, so no manual Injector is needed. Re-fills the
    // form whenever the stored user changes (profile save, avatar upload).
    effect(() => {
      const user = this.user();
      if (!user) return;

      this.form.patchValue(
        {
          firstName: user.firstname ?? '',
          lastName: user.lastname ?? '',
          email: user.email ?? '',
          phoneNumber: user.phoneNumber ?? '',
          mfaEnabled: user.mfaEnabled ?? false,
        },
        { emitEvent: false }
      );
    });
  }

  protected onFileSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      this.notifications.error('profile.invalidImageType');
      return;
    }

    if (file.size > MAX_IMAGE_BYTES) {
      this.notifications.error('profile.imageTooLarge');
      return;
    }

    this.selectedFile.set(file);

    const reader = new FileReader();
    reader.onload = () => this.preview.set(reader.result as string);
    reader.readAsDataURL(file);
  }

  protected updateProfile(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.notifications.error('profile.fillFieldsCorrectly');
      return;
    }

    const user = this.user();
    if (!user) return;

    const values = this.form.getRawValue();
    const wantsMfa = this.isGoogleUser() ? false : values.mfaEnabled;

    const payload = new FormData();
    payload.append('userId', String(user.id));
    payload.append('firstName', values.firstName);
    payload.append('lastName', values.lastName);
    payload.append('email', values.email);
    payload.append('phoneNumber', values.phoneNumber);
    payload.append('mfaEnabled', String(wantsMfa));

    const file = this.selectedFile();
    if (file) payload.append('image', file, file.name);

    this.saving.set(true);

    this.userService.updateProfileWithFormData(payload).subscribe({
      next: (response: any) => {
        this.saving.set(false);

        // The endpoint is inconsistent about casing between fields, so each one
        // is read defensively and falls back to what we just submitted.
        this.userState.updateUser({
          firstname: response?.firstName ?? response?.firstname ?? values.firstName,
          lastname: response?.lastName ?? response?.lastname ?? values.lastName,
          email: response?.email ?? values.email,
          phoneNumber: response?.phoneNumber ?? values.phoneNumber,
          image: response?.imageUrl ?? response?.image ?? user.image ?? null,
          mfaEnabled: response?.mfaEnabled ?? wantsMfa,
        });

        this.selectedFile.set(null);
        this.preview.set(null);
        this.notifications.success('profile.profileUpdated');

        // Turning 2FA on invalidates the current session: the next sign-in has
        // to go through the authenticator.
        if (wantsMfa && !user.mfaEnabled) {
          this.notifications.info('profile.2FAEnabled');
          this.signOut();
        }
      },
      error: error => {
        this.saving.set(false);
        this.notifications.error(
          'profile.somethingWentWrong',
          typeof error?.error?.message === 'string' ? error.error.message : undefined
        );
      },
    });
  }

  protected deleteAccount(): void {
    const dialogRef = this.dialog.open(ConfirmDeleteComponent, {
      width: '420px',
      data: {
        // `message` is already-translated body text; the rest are keys. The old
        // call passed translated strings as `title`/`confirmText`/`cancelText`,
        // which the dialog does not read at all.
        message: this.translate.instant('profile.confirmDelete.message'),
        titleKey: 'profile.confirmDelete.title',
        confirmKey: 'profile.confirmDelete.confirmText',
        cancelKey: 'profile.confirmDelete.cancelText',
        destructive: true,
      },
    });

    dialogRef.afterClosed().subscribe(confirmed => {
      if (confirmed !== true) return;

      const userId = this.user()?.id;
      if (userId == null) {
        this.notifications.error('profile.userIdNotFound');
        return;
      }

      this.userService.deleteAccount(userId).subscribe({
        next: () => {
          this.notifications.success('profile.accountDeleted');
          this.userState.clearUser();
          this.themeService.resetToDefaultTheme();
          this.lang.resetToDefaultLanguage();
          this.router.navigateByUrl('/register');
        },
        error: error => {
          const key =
            error?.status === 403
              ? 'profile.deleteOwnAccount'
              : error?.status === 404
                ? 'profile.accountNotFound'
                : 'profile.somethingWentWrong';
          this.notifications.error(key);
        },
      });
    });
  }

  protected signOut(): void {
    this.userState.clearUser();
    this.themeService.resetToDefaultTheme();
    this.lang.resetToDefaultLanguage();
    this.router.navigateByUrl('/login');
  }

  protected goToGoogleAccount(): void {
    window.open('https://myaccount.google.com/security', '_blank', 'noopener');
  }
}

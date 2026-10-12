import { Injectable, inject } from '@angular/core';
import { MatSnackBar, MatSnackBarConfig } from '@angular/material/snack-bar';
import { TranslateService } from '@ngx-translate/core';

type Variant = 'success' | 'error' | 'warning' | 'info';

const DURATIONS: Record<Variant, number> = {
  success: 3500,
  info: 3500,
  warning: 5000,
  error: 6000,
};

/**
 * The single way to show a transient message in the app.
 *
 * Replaces the mix of raw `MatSnackBar` calls (19 components) and
 * `NzMessageService` calls (5 components), and takes translation keys so no
 * component has to call `translate.instant()` just to show a toast.
 */
@Injectable({ providedIn: 'root' })
export class NotificationService {
  private readonly snackBar = inject(MatSnackBar);
  private readonly translate = inject(TranslateService);

  /**
   * @param key       Translation key, or literal text if no key matches.
   * @param fallback  Raw message (e.g. straight from the backend) preferred
   *                  over the translated key when present.
   */
  success(key: string, fallback?: string): void {
    this.show('success', key, fallback);
  }

  error(key: string, fallback?: string): void {
    this.show('error', key, fallback);
  }

  warning(key: string, fallback?: string): void {
    this.show('warning', key, fallback);
  }

  info(key: string, fallback?: string): void {
    this.show('info', key, fallback);
  }

  private show(variant: Variant, key: string, fallback?: string): void {
    const config: MatSnackBarConfig = {
      duration: DURATIONS[variant],
      horizontalPosition: 'center',
      verticalPosition: 'bottom',
      panelClass: ['app-snackbar', `app-snackbar--${variant}`],
    };

    this.snackBar.open(
      fallback ?? this.translateOrLiteral(key),
      this.translateOrLiteral('common.close'),
      config
    );
  }

  /** `instant()` echoes the key back when it is missing — treat that as literal text. */
  private translateOrLiteral(key: string): string {
    const translated = this.translate.instant(key);
    return typeof translated === 'string' ? translated : key;
  }
}

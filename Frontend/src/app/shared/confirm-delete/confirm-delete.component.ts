import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule } from '@ngx-translate/core';

export interface ConfirmDialogData {
  /** Already-translated body text. */
  message: string;
  /** Translation keys; sensible destructive defaults when omitted. */
  titleKey?: string;
  confirmKey?: string;
  cancelKey?: string;
  icon?: string;
  /** `false` renders a neutral confirm button instead of a destructive one. */
  destructive?: boolean;
}

/**
 * Confirmation dialog for destructive actions.
 *
 * Its title and buttons used to be hardcoded English ("Delete warning",
 * "Cancel", "Delete") — the only untranslated UI left in the app. The labels
 * are now configurable so it can also confirm non-delete actions such as
 * emptying the cart.
 */
@Component({
  selector: 'app-confirm-delete',
  standalone: true,
  imports: [MatDialogModule, MatButtonModule, MatIconModule, TranslateModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './confirm-delete.component.html',
  styleUrl: './confirm-delete.component.scss',
})
export class ConfirmDeleteComponent {
  protected readonly dialogRef = inject<MatDialogRef<ConfirmDeleteComponent, boolean>>(MatDialogRef);
  protected readonly data = inject<ConfirmDialogData>(MAT_DIALOG_DATA);

  protected readonly titleKey = this.data.titleKey ?? 'confirm.defaultTitle';
  protected readonly confirmKey = this.data.confirmKey ?? 'common.delete';
  protected readonly cancelKey = this.data.cancelKey ?? 'common.cancel';
  protected readonly icon = this.data.icon ?? 'warning';
  protected readonly destructive = this.data.destructive ?? true;
}

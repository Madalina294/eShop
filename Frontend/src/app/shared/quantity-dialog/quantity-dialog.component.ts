import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { PricePipe } from '../pipes/price.pipe';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule } from '@ngx-translate/core';
import { QuantityStepperComponent } from '../ui/quantity-stepper/quantity-stepper.component';

export interface QuantityDialogData {
  productId: number;
  productName: string;
  maxQuantity: number;
  /** Optional, so the dialog can show a running total. */
  unitPrice?: number;
}

export interface QuantityDialogResult {
  quantity: number;
}

/**
 * Asks how many units to add to the cart.
 *
 * Was the only component in the app with an inline template, and used
 * `@Inject(MAT_DIALOG_DATA)` plus a raw `<input type="number">` with `ngModel`
 * that let the user type past the available stock.
 */
@Component({
  selector: 'app-quantity-dialog',
  standalone: true,
  imports: [
    PricePipe,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    TranslateModule,
    QuantityStepperComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './quantity-dialog.component.html',
  styleUrl: './quantity-dialog.component.scss',
})
export class QuantityDialogComponent {
  private readonly dialogRef =
    inject<MatDialogRef<QuantityDialogComponent, QuantityDialogResult>>(MatDialogRef);

  protected readonly data = inject<QuantityDialogData>(MAT_DIALOG_DATA);
  protected readonly quantity = signal(1);

  protected readonly max = computed(() => Math.max(1, this.data.maxQuantity || 1));
  protected readonly total = computed(() => (this.data.unitPrice ?? 0) * this.quantity());

  protected confirm(): void {
    this.dialogRef.close({ quantity: this.quantity() });
  }

  protected cancel(): void {
    this.dialogRef.close();
  }
}

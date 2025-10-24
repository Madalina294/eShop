import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { CommonModule } from '@angular/common';

export interface QuantityDialogData {
  productId: number;
  productName: string;
  maxQuantity: number;
}

@Component({
  selector: 'app-quantity-dialog',
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    FormsModule,
    TranslateModule
  ],
  template: `
    <div class="quantity-dialog">
      <h2 mat-dialog-title class="dialog-title">
        <mat-icon>shopping_cart</mat-icon>
        {{ "cart.selectQuantity" | translate }}
      </h2>

      <mat-dialog-content class="dialog-content">
        <div class="product-info">
          <p class="product-name">{{ data.productName }}</p>
          <p class="max-quantity" *ngIf="data.maxQuantity > 0">
            {{ "cart.maxAvailable" | translate }}: {{ data.maxQuantity }}
          </p>
        </div>

        <mat-form-field class="quantity-field" appearance="outline">
          <mat-label>{{ "cart.quantity" | translate }}</mat-label>
          <input
            matInput
            type="number"
            [(ngModel)]="quantity"
            min="1"
            [max]="data.maxQuantity || 99"
            class="quantity-input"
            #quantityInput
            (keyup.enter)="onConfirm()"
          />
          <mat-hint>{{ "cart.enterQuantity" | translate }}</mat-hint>
        </mat-form-field>
      </mat-dialog-content>

      <mat-dialog-actions class="dialog-actions">
        <button mat-button (click)="onCancel()" class="cancel-btn">
          <mat-icon>close</mat-icon>
          {{ "cart.cancel" | translate }}
        </button>
        <button
          mat-raised-button
          color="primary"
          (click)="onConfirm()"
          [disabled]="quantity <= 0 || quantity > (data.maxQuantity || 99)"
          class="confirm-btn"
        >
          <mat-icon>add_shopping_cart</mat-icon>
          {{ "cart.addToCart" | translate }}
        </button>
      </mat-dialog-actions>
    </div>
  `,
  styles: [`
    .quantity-dialog {
      min-width: 400px;
    }

    .dialog-title {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 16px;
      color: #1976d2;

      mat-icon {
        font-size: 24px;
        width: 24px;
        height: 24px;
      }
    }

    .dialog-content {
      padding: 16px 16px;

      .product-info {
        margin-bottom: 20px;

        .product-name {
          font-size: 16px;
          font-weight: 600;
          color: #333;
          margin: 0 0 8px 0;
        }

        .max-quantity {
          font-size: 14px;
          color: #666;
          margin: 0;
        }
      }

      .quantity-field {
        width: 100%;

        .quantity-input {
          text-align: center;
          font-size: 18px;
          font-weight: 600;
        }
      }
    }

    .dialog-actions {
      display: flex;
      justify-content: flex-end;
      gap: 12px;
      padding: 16px 0 0 0;
      border-top: 1px solid #eee;
      margin-bottom: 10px;

      .cancel-btn {
        color: white !important;
        background: #d13223 !important;
      }

      .confirm-btn {
        min-width: 140px;
        margin-right: 10px;

        mat-icon {
          margin-right: 8px;
        }
      }
    }

    @media (max-width: 480px) {
      .quantity-dialog {
        min-width: 300px;
      }
    }
  `]
})
export class QuantityDialogComponent {
  quantity = 1;

  constructor(
    public dialogRef: MatDialogRef<QuantityDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: QuantityDialogData
  ) {
    // Setează cantitatea maximă dacă este disponibilă
    if (this.data.maxQuantity > 0 && this.data.maxQuantity < 10) {
      this.quantity = Math.min(this.data.maxQuantity, 1);
    }
  }

  onConfirm() {
    if (this.quantity > 0 && this.quantity <= (this.data.maxQuantity || 99)) {
      this.dialogRef.close({
        quantity: this.quantity,
        productId: this.data.productId,
        productName: this.data.productName
      });
    }
  }

  onCancel() {
    this.dialogRef.close();
  }
}

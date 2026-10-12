import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CurrencyPipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

import { UserService } from '../../services/user/user.service';
import { NotificationService } from '../../shared/notification/notification.service';
import { CartStateService } from '../../shared/state/cart-state.service';
import { ConfirmDeleteComponent } from '../../shared/confirm-delete/confirm-delete.component';
import { PageHeaderComponent } from '../../shared/ui/page-header/page-header.component';
import { QuantityStepperComponent } from '../../shared/ui/quantity-stepper/quantity-stepper.component';
import { LoadingStateComponent } from '../../shared/ui/loading-state/loading-state.component';
import { EmptyStateComponent } from '../../shared/ui/empty-state/empty-state.component';
import { ErrorStateComponent } from '../../shared/ui/error-state/error-state.component';
import { ViewState } from '../../models/ui-state';
import { productImageUrl } from '../../core/http/image-url';

/** Shape the cart endpoint returns for a line item. */
interface CartLine {
  productId: number;
  productName: string;
  productPrice: number;
  productImage?: string | null;
  quantity: number;
  availableQuantity?: number;
}

/** A line enriched with everything the template needs, computed once. */
interface CartRow extends CartLine {
  readonly imageUrl: string;
  readonly lineTotal: number;
  readonly maxQuantity: number;
}

/** No stock figure from the backend means we cannot cap the stepper. */
const FALLBACK_MAX_QUANTITY = 99;

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [
    RouterLink,
    CurrencyPipe,
    MatButtonModule,
    MatDividerModule,
    MatIconModule,
    MatTooltipModule,
    TranslateModule,
    PageHeaderComponent,
    QuantityStepperComponent,
    LoadingStateComponent,
    EmptyStateComponent,
    ErrorStateComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './cart.component.html',
  styleUrl: './cart.component.scss',
})
export class CartComponent {
  private readonly userService = inject(UserService);
  private readonly notifications = inject(NotificationService);
  private readonly cartState = inject(CartStateService);
  private readonly translate = inject(TranslateService);
  private readonly dialog = inject(MatDialog);

  protected readonly state = signal<ViewState>('loading');
  protected readonly lines = signal<CartLine[]>([]);
  /** Product ids with a request in flight, so their row can show as busy. */
  protected readonly pending = signal<ReadonlySet<number>>(new Set());

  protected readonly rows = computed<CartRow[]>(() =>
    this.lines().map(line => ({
      ...line,
      imageUrl: productImageUrl(line.productImage),
      lineTotal: line.productPrice * line.quantity,
      maxQuantity: line.availableQuantity ?? FALLBACK_MAX_QUANTITY,
    }))
  );

  /** Total units, not line count — the old helper ignored its own argument. */
  protected readonly totalUnits = computed(() =>
    this.lines().reduce((sum, line) => sum + line.quantity, 0)
  );

  protected readonly subtotal = computed(() =>
    this.lines().reduce((sum, line) => sum + line.productPrice * line.quantity, 0)
  );

  protected readonly itemsLabel = computed(() => {
    const count = this.lines().length;
    return count === 1
      ? this.translate.instant('cart.itemsOne')
      : this.translate.instant('cart.itemsMany', { count });
  });

  constructor() {
    this.load();
  }

  protected load(): void {
    this.state.set('loading');

    this.userService.getUserCart().subscribe({
      next: (items: CartLine[]) => {
        this.lines.set(items ?? []);
        this.state.set(items?.length ? 'ready' : 'empty');
      },
      error: () => this.state.set('error'),
    });
  }

  protected isPending(productId: number): boolean {
    return this.pending().has(productId);
  }

  /**
   * Called when the stepper settles on a new value. The old version fired a
   * request on every `ngModelChange`, so typing "12" sent one update for 1 and
   * another for 12, and a mistyped digit hit the backend too.
   */
  protected onQuantityChange(row: CartRow, quantity: number): void {
    if (quantity === row.quantity) return;

    if (quantity <= 0) {
      this.remove(row);
      return;
    }

    const previous = row.quantity;
    this.patchLine(row.productId, { quantity });
    this.markPending(row.productId, true);

    this.userService.updateCartItemQuantity(row.productId, quantity).subscribe({
      next: () => {
        this.markPending(row.productId, false);
        this.cartState.refreshCart();
      },
      error: () => {
        // Put the old quantity back so the UI never lies about what is stored.
        this.patchLine(row.productId, { quantity: previous });
        this.markPending(row.productId, false);
      },
    });
  }

  protected remove(row: CartRow): void {
    this.markPending(row.productId, true);

    this.userService.removeFromCart(row.productId).subscribe({
      next: () => {
        this.lines.update(lines => lines.filter(line => line.productId !== row.productId));
        this.markPending(row.productId, false);
        this.cartState.refreshCart();
        this.notifications.success('cart.removed');

        if (!this.lines().length) this.state.set('empty');
      },
      error: () => this.markPending(row.productId, false),
    });
  }

  /** Emptying the cart is destructive and used to happen without asking. */
  protected clearCart(): void {
    const dialogRef = this.dialog.open(ConfirmDeleteComponent, {
      width: '420px',
      data: {
        message: this.translate.instant('cart.confirmClear'),
        titleKey: 'cart.confirmClearTitle',
        confirmKey: 'cart.clearCart',
        icon: 'remove_shopping_cart',
      },
    });

    dialogRef.afterClosed().subscribe(confirmed => {
      if (confirmed !== true) return;

      this.userService.clearCart().subscribe({
        next: () => {
          this.lines.set([]);
          this.state.set('empty');
          this.cartState.refreshCart();
          this.notifications.success('cart.cleared');
        },
        error: () => undefined,
      });
    });
  }

  private patchLine(productId: number, changes: Partial<CartLine>): void {
    this.lines.update(lines =>
      lines.map(line => (line.productId === productId ? { ...line, ...changes } : line))
    );
  }

  private markPending(productId: number, busy: boolean): void {
    this.pending.update(ids => {
      const next = new Set(ids);
      if (busy) next.add(productId);
      else next.delete(productId);
      return next;
    });
  }
}

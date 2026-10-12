import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

import { UserService } from '../../services/user/user.service';
import { NotificationService } from '../../shared/notification/notification.service';
import { CartStateService } from '../../shared/state/cart-state.service';
import {
  QuantityDialogComponent,
  QuantityDialogData,
  QuantityDialogResult,
} from '../../shared/quantity-dialog/quantity-dialog.component';
import { PageHeaderComponent } from '../../shared/ui/page-header/page-header.component';
import { ProductCardComponent } from '../../shared/ui/product-card/product-card.component';
import { LoadingStateComponent } from '../../shared/ui/loading-state/loading-state.component';
import { EmptyStateComponent } from '../../shared/ui/empty-state/empty-state.component';
import { ErrorStateComponent } from '../../shared/ui/error-state/error-state.component';
import { Product } from '../../models/product';
import { ViewState } from '../../models/ui-state';

/** Shape the wishlist endpoint returns. */
interface WishlistLine {
  productId: number;
  productName: string;
  productPrice: number;
  productImage?: string | null;
  productQuantity?: number;
  categoryId?: number;
  addedAt?: string;
}

/** A line adapted to `Product` so `app-product-card` can render it. */
interface WishlistEntry {
  readonly product: Product;
  readonly addedAt?: string;
}

@Component({
  selector: 'app-wishlist',
  standalone: true,
  imports: [
    RouterLink,
    MatButtonModule,
    MatIconModule,
    TranslateModule,
    PageHeaderComponent,
    ProductCardComponent,
    LoadingStateComponent,
    EmptyStateComponent,
    ErrorStateComponent,
  ],
  // `DatePipe` is not root-provided; the class injects it to format the date.
  providers: [DatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './wishlist.component.html',
  styleUrl: './wishlist.component.scss',
})
export class WishlistComponent {
  private readonly userService = inject(UserService);
  private readonly notifications = inject(NotificationService);
  private readonly cartState = inject(CartStateService);
  private readonly translate = inject(TranslateService);
  private readonly dialog = inject(MatDialog);
  private readonly datePipe = inject(DatePipe);

  protected readonly state = signal<ViewState>('loading');
  protected readonly lines = signal<WishlistLine[]>([]);

  protected readonly entries = computed<WishlistEntry[]>(() =>
    this.lines().map(line => ({
      addedAt: line.addedAt,
      // The wishlist DTO uses `product*` field names; the card speaks `Product`.
      product: {
        id: line.productId,
        name: line.productName,
        price: line.productPrice,
        image: line.productImage ?? null,
        quantity: line.productQuantity ?? 0,
        categoryId: line.categoryId ?? 0,
        description: '',
      },
    }))
  );

  protected readonly itemsLabel = computed(() => {
    const count = this.lines().length;
    return count === 1
      ? this.translate.instant('wishlist.itemsOne')
      : this.translate.instant('wishlist.itemsMany', { count });
  });

  constructor() {
    this.load();
  }

  protected load(): void {
    this.state.set('loading');

    this.userService.getUserWishlist().subscribe({
      next: (items: WishlistLine[]) => {
        this.lines.set(items ?? []);
        this.state.set(items?.length ? 'ready' : 'empty');
      },
      error: () => this.state.set('error'),
    });
  }

  /** "Added on 3 Mar 2026", or nothing when the backend omits the date. */
  protected footnote(entry: WishlistEntry): string {
    if (!entry.addedAt) return '';

    const formatted = this.datePipe.transform(entry.addedAt, 'mediumDate');
    if (!formatted) return '';

    return `${this.translate.instant('wishlist.addedOn')} ${formatted}`;
  }

  protected remove(product: Product): void {
    this.userService.removeFromWishlist(product.id).subscribe({
      next: () => {
        this.lines.update(lines => lines.filter(line => line.productId !== product.id));
        this.cartState.optimisticWishlistRemove();
        this.notifications.success('product.removedFromWishlist');

        if (!this.lines().length) this.state.set('empty');
      },
      // The error interceptor already surfaces the failure.
      error: () => undefined,
    });
  }

  protected openQuantityDialog(product: Product): void {
    const data: QuantityDialogData = {
      productId: product.id,
      productName: product.name,
      maxQuantity: product.quantity || 99,
      unitPrice: product.price,
    };

    this.dialog
      .open(QuantityDialogComponent, { width: '440px', maxWidth: '92vw', data })
      .afterClosed()
      .subscribe((result?: QuantityDialogResult) => {
        if (result?.quantity) this.addToCart(product.id, result.quantity);
      });
  }

  private addToCart(productId: number, quantity: number): void {
    this.userService.addToCart(productId, quantity).subscribe({
      next: () => {
        this.cartState.optimisticCartAdd(quantity);
        this.notifications.success('product.addedToCart');
      },
      error: () => undefined,
    });
  }
}

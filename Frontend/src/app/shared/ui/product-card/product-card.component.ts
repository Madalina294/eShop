import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { CurrencyPipe, NgTemplateOutlet } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { Product } from '../../../models/product';
import { productImageUrl } from '../../../core/http/image-url';

/**
 * One product tile, shared by the catalog, the wishlist and the admin grid.
 *
 * The card itself is a real `<a>`, so it is keyboard reachable — the old
 * `<mat-card (click)>` was mouse-only. Secondary actions sit in their own
 * buttons and stop propagation so they never trigger navigation.
 */
@Component({
  selector: 'app-product-card',
  standalone: true,
  imports: [
    CurrencyPipe,
    NgTemplateOutlet,
    RouterLink,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    TranslateModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './product-card.component.html',
  styleUrl: './product-card.component.scss',
})
export class ProductCardComponent {
  readonly product = input.required<Product>();
  readonly categoryName = input<string>('');
  readonly currency = input<string>('RON');
  /** Router link for the whole card. */
  readonly link = input<unknown[] | string | null>(null);

  readonly showAddToCart = input<boolean>(false);
  readonly showWishlist = input<boolean>(false);
  readonly inWishlist = input<boolean>(false);
  /** Set on the first row of a grid so the hero images are not lazy-loaded. */
  readonly eager = input<boolean>(false);

  readonly addToCart = output<Product>();
  readonly toggleWishlist = output<Product>();
  readonly open = output<Product>();

  protected readonly imageUrl = computed(() => productImageUrl(this.product().image));
  protected readonly outOfStock = computed(() => (this.product().quantity ?? 0) <= 0);

  protected onAction(event: Event, emit: 'cart' | 'wishlist'): void {
    event.stopPropagation();
    event.preventDefault();
    if (emit === 'cart') this.addToCart.emit(this.product());
    else this.toggleWishlist.emit(this.product());
  }
}

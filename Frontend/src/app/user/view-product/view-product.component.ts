import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { PricePipe } from '../../shared/pipes/price.pipe';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

import { UserService } from '../../services/user/user.service';
import { NotificationService } from '../../shared/notification/notification.service';
import { CartStateService } from '../../shared/state/cart-state.service';
import { QuantityStepperComponent } from '../../shared/ui/quantity-stepper/quantity-stepper.component';
import { ProductCardComponent } from '../../shared/ui/product-card/product-card.component';
import { LoadingStateComponent } from '../../shared/ui/loading-state/loading-state.component';
import { ErrorStateComponent } from '../../shared/ui/error-state/error-state.component';
import { BreadcrumbsComponent, Crumb } from '../../shared/ui/breadcrumbs/breadcrumbs.component';
import { EmptyStateComponent } from '../../shared/ui/empty-state/empty-state.component';
import { Category, Page, Product } from '../../models/product';
import { ViewState } from '../../models/ui-state';
import { productImageUrl } from '../../core/http/image-url';

/** Below this many units left, the stock line turns into a nudge. */
const LOW_STOCK_THRESHOLD = 5;
const RELATED_COUNT = 4;

interface Spec {
  readonly label: string;
  readonly value: string;
}

@Component({
  selector: 'app-view-product',
  standalone: true,
  imports: [
    RouterLink,
    PricePipe,
    MatButtonModule,
    MatChipsModule,
    MatDividerModule,
    MatIconModule,
    MatTabsModule,
    MatTooltipModule,
    TranslateModule,
    QuantityStepperComponent,
    ProductCardComponent,
    LoadingStateComponent,
    ErrorStateComponent,
    EmptyStateComponent,
    BreadcrumbsComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './view-product.component.html',
  styleUrl: './view-product.component.scss',
})
export class ViewProductComponent {
  private readonly userService = inject(UserService);
  private readonly notifications = inject(NotificationService);
  private readonly cartState = inject(CartStateService);
  private readonly route = inject(ActivatedRoute);
  private readonly translate = inject(TranslateService);

  protected readonly state = signal<ViewState>('loading');
  protected readonly product = signal<Product | null>(null);
  protected readonly related = signal<Product[]>([]);
  protected readonly categories = signal<Category[]>([]);
  protected readonly isInWishlist = signal(false);
  protected readonly quantity = signal(1);

  /** Read from the URL so the browser's back/forward buttons reload correctly. */
  private readonly params = toSignal(this.route.queryParams, {
    initialValue: this.route.snapshot.queryParams,
  });

  protected readonly imageUrl = computed(() => productImageUrl(this.product()?.image));

  protected readonly categoryName = computed(() => {
    const product = this.product();
    if (!product) return '';
    return this.categories().find(c => c.id === product.categoryId)?.name ?? '';
  });

  protected readonly stock = computed(() => this.product()?.quantity ?? 0);
  protected readonly outOfStock = computed(() => this.stock() <= 0);
  protected readonly lowStock = computed(() => this.stock() > 0 && this.stock() <= LOW_STOCK_THRESHOLD);

  /** Live total for the chosen quantity, so the price is never a surprise. */
  protected readonly subtotal = computed(() => (this.product()?.price ?? 0) * this.quantity());

  /** Only the specs the product actually has — no empty rows. */
  protected readonly specs = computed<Spec[]>(() => {
    const product = this.product();
    if (!product) return [];

    const candidates: ReadonlyArray<[string, string | undefined]> = [
      ['viewProduct.details.color', product.color],
      ['viewProduct.details.dimensions', product.dimensions],
      ['viewProduct.details.material', product.material],
      ['viewProduct.details.weight', product.weight],
    ];

    return candidates.flatMap(([label, value]) =>
      value ? [{ label, value }] : []
    );
  });

  /** Catalogue › category › product. */
  protected readonly crumbs = computed<Crumb[]>(() => {
    const product = this.product();
    if (!product) return [];

    const trail: Crumb[] = [
      { label: this.translate.instant('allProducts.title'), link: '/user/all-products' },
    ];

    const category = this.categoryName();
    if (category) {
      trail.push({
        label: category,
        link: '/user/all-products',
        queryParams: { category: product.categoryId },
      });
    }

    trail.push({ label: product.name });
    return trail;
  });

  constructor() {
    this.loadCategories();

    // Re-fetch whenever the `?id=` changes, including via related products.
    this.route.queryParams
      .pipe(takeUntilDestroyed())
      .subscribe(params => this.load(Number(params['id'])));
  }

  protected reload(): void {
    this.load(Number(this.params()['id']));
  }

  protected addToCart(): void {
    const product = this.product();
    if (!product || this.outOfStock()) return;

    const quantity = this.quantity();

    this.userService.addToCart(product.id, quantity).subscribe({
      next: () => {
        this.cartState.optimisticCartAdd(quantity);
        this.notifications.success('product.addedToCart');
      },
      // The error interceptor already surfaces the failure.
      error: () => undefined,
    });
  }

  protected toggleWishlist(): void {
    const product = this.product();
    if (!product) return;

    const wasIn = this.isInWishlist();
    const request = wasIn
      ? this.userService.removeFromWishlist(product.id)
      : this.userService.addToWishlist(product.id);

    request.subscribe({
      next: () => {
        this.isInWishlist.set(!wasIn);

        if (wasIn) {
          this.cartState.optimisticWishlistRemove();
          this.notifications.success('product.removedFromWishlist');
        } else {
          this.cartState.optimisticWishlistAdd();
          this.notifications.success('product.addedToWishlist');
        }
      },
      error: () => undefined,
    });
  }

  // --- Data ------------------------------------------------------------------

  private load(id: number): void {
    if (!Number.isFinite(id) || id <= 0) {
      // A missing or malformed id is a dead link, not a server error. The old
      // version flashed a toast and silently bounced to the catalogue.
      this.state.set('empty');
      return;
    }

    this.state.set('loading');
    this.quantity.set(1);
    this.related.set([]);

    this.userService.getProduct(id).subscribe({
      next: product => {
        this.product.set(product);
        this.state.set('ready');
        this.checkWishlist(id);
        this.loadRelated(product);
      },
      error: () => this.state.set('error'),
    });
  }

  private checkWishlist(productId: number): void {
    this.userService.checkIfInWishlist(productId).subscribe({
      next: isIn => this.isInWishlist.set(isIn),
      error: () => this.isInWishlist.set(false),
    });
  }

  /** Same category, current product excluded. */
  private loadRelated(product: Product): void {
    this.userService
      .getProductsPaginated(0, RELATED_COUNT + 1, 'id', 'desc', product.categoryId)
      .subscribe({
        next: (response: Page<Product>) =>
          this.related.set(
            (response.content ?? []).filter(p => p.id !== product.id).slice(0, RELATED_COUNT)
          ),
        error: () => this.related.set([]),
      });
  }

  private loadCategories(): void {
    this.userService.getCategories().subscribe({
      next: categories => this.categories.set(categories ?? []),
      error: () => this.categories.set([]),
    });
  }
}

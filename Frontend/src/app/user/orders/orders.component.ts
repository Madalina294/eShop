import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { PricePipe } from '../../shared/pipes/price.pipe';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule } from '@ngx-translate/core';

import { CheckoutService } from '../../services/checkout/checkout.service';
import { Order, OrderStatus } from '../../models/order';
import { ViewState } from '../../models/ui-state';
import { productImageUrl } from '../../core/http/image-url';

import { PageHeaderComponent } from '../../shared/ui/page-header/page-header.component';
import { LoadingStateComponent } from '../../shared/ui/loading-state/loading-state.component';
import { EmptyStateComponent } from '../../shared/ui/empty-state/empty-state.component';
import { ErrorStateComponent } from '../../shared/ui/error-state/error-state.component';
import { StatusBadgeComponent } from '../../shared/ui/status-badge/status-badge.component';

/** `all` plus the five real statuses, in the order the filter row shows them. */
const FILTERS: readonly (OrderStatus | 'all')[] = [
  'all',
  'PENDING',
  'CONFIRMED',
  'SHIPPED',
  'DELIVERED',
  'CANCELLED',
];

/** How many product thumbnails fit on a card before we collapse to "+N". */
const MAX_THUMBS = 4;

/**
 * The customer's order history.
 *
 * `CheckoutService.getUserOrders()` and `GET /api/checkout/orders` were both
 * fully implemented and had no caller at all — there was no way to see a past
 * order except by keeping its confirmation URL.
 */
@Component({
  selector: 'app-orders',
  standalone: true,
  imports: [
    RouterLink,
    PricePipe,
    DatePipe,
    MatButtonModule,
    MatIconModule,
    TranslateModule,
    PageHeaderComponent,
    LoadingStateComponent,
    EmptyStateComponent,
    ErrorStateComponent,
    StatusBadgeComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './orders.component.html',
  styleUrl: './orders.component.scss',
})
export class OrdersComponent {
  private readonly checkoutService = inject(CheckoutService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  protected readonly filters = FILTERS;
  protected readonly state = signal<ViewState>('loading');
  protected readonly orders = signal<readonly Order[]>([]);

  /** Kept in the URL so a filtered view survives a refresh and can be shared. */
  private readonly queryParams = toSignal(this.route.queryParams, { initialValue: {} as any });

  protected readonly activeFilter = computed<OrderStatus | 'all'>(() => {
    const status = this.queryParams()['status'];
    return FILTERS.includes(status) ? status : 'all';
  });

  protected readonly visibleOrders = computed(() => {
    const filter = this.activeFilter();
    const all = this.orders();
    return filter === 'all' ? all : all.filter(order => order.status === filter);
  });

  /** Per-status counts for the filter row, so empty filters are visibly empty. */
  protected readonly counts = computed(() => {
    const tally = new Map<string, number>();
    for (const order of this.orders()) {
      tally.set(order.status, (tally.get(order.status) ?? 0) + 1);
    }
    tally.set('all', this.orders().length);
    return tally;
  });

  constructor() {
    this.load();
  }

  protected load(): void {
    this.state.set('loading');

    this.checkoutService.getUserOrders().subscribe({
      next: orders => {
        // Newest first: the backend's own ordering is not guaranteed on this
        // endpoint (it uses `findByUserId`, not the ...OrderByOrderDateDesc one).
        const sorted = [...orders].sort(
          (a, b) => new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime()
        );
        this.orders.set(sorted);
        this.state.set(sorted.length ? 'ready' : 'empty');
      },
      error: () => this.state.set('error'),
    });
  }

  protected goShopping(): void {
    this.router.navigateByUrl('/user/all-products');
  }

  protected setFilter(status: OrderStatus | 'all'): void {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { status: status === 'all' ? null : status },
      queryParamsHandling: 'merge',
    });
  }

  protected countFor(status: OrderStatus | 'all'): number {
    return this.counts().get(status) ?? 0;
  }

  protected thumbnails(order: Order): readonly string[] {
    return order.orderItems.slice(0, MAX_THUMBS).map(item => productImageUrl(item.productImage));
  }

  protected hiddenCount(order: Order): number {
    return Math.max(0, order.orderItems.length - MAX_THUMBS);
  }

  protected itemCount(order: Order): number {
    return order.orderItems.reduce((total, item) => total + item.quantity, 0);
  }
}

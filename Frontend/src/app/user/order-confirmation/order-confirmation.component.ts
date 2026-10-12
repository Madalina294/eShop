import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  signal,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule } from '@ngx-translate/core';

import { CheckoutService } from '../../services/checkout/checkout.service';
import { LoadingStateComponent } from '../../shared/ui/loading-state/loading-state.component';
import { EmptyStateComponent } from '../../shared/ui/empty-state/empty-state.component';
import { ErrorStateComponent } from '../../shared/ui/error-state/error-state.component';
import { ORDER_PROGRESS, Order, OrderStatus } from '../../models/order';
import { ViewState } from '../../models/ui-state';
import { productImageUrl } from '../../core/http/image-url';

interface TimelineStep {
  readonly status: OrderStatus;
  readonly icon: string;
  readonly done: boolean;
  readonly current: boolean;
}

const STATUS_ICONS: Record<OrderStatus, string> = {
  PENDING: 'schedule',
  CONFIRMED: 'task_alt',
  SHIPPED: 'local_shipping',
  DELIVERED: 'inventory',
  CANCELLED: 'cancel',
};

@Component({
  selector: 'app-order-confirmation',
  standalone: true,
  imports: [
    RouterLink,
    CurrencyPipe,
    DatePipe,
    MatButtonModule,
    MatDividerModule,
    MatIconModule,
    TranslateModule,
    LoadingStateComponent,
    EmptyStateComponent,
    ErrorStateComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './order-confirmation.component.html',
  styleUrl: './order-confirmation.component.scss',
})
export class OrderConfirmationComponent {
  private readonly checkoutService = inject(CheckoutService);

  /** Bound from the `:id` route param by `withComponentInputBinding()`. */
  readonly id = input<string>();

  protected readonly state = signal<ViewState>('loading');
  protected readonly order = signal<Order | null>(null);

  protected readonly cancelled = computed(() => this.order()?.status === 'CANCELLED');

  /** Line totals only; the backend's `totalAmount` also carries shipping. */
  protected readonly itemsSubtotal = computed(() =>
    (this.order()?.orderItems ?? []).reduce((sum, item) => sum + item.totalPrice, 0)
  );

  /** Derived rather than guessed, so it always reconciles with the total paid. */
  protected readonly shippingCost = computed(() => {
    const order = this.order();
    if (!order) return 0;
    return Math.max(0, order.totalAmount - this.itemsSubtotal());
  });

  protected readonly totalUnits = computed(() =>
    (this.order()?.orderItems ?? []).reduce((sum, item) => sum + item.quantity, 0)
  );

  protected readonly timeline = computed<TimelineStep[]>(() => {
    const status = this.order()?.status;
    if (!status || status === 'CANCELLED') return [];

    const reached = ORDER_PROGRESS.indexOf(status);

    return ORDER_PROGRESS.map((step, index) => ({
      status: step,
      icon: STATUS_ICONS[step],
      done: index < reached,
      current: index === reached,
    }));
  });

  constructor() {
    // `id` arrives through route input binding; reacting to it also covers
    // navigating straight from one order to another.
    effect(() => {
      this.id();
      this.load();
    });
  }

  protected load(): void {
    const orderId = Number(this.id());

    if (!Number.isFinite(orderId) || orderId <= 0) {
      this.state.set('empty');
      return;
    }

    this.state.set('loading');

    this.checkoutService.getOrder(orderId).subscribe({
      next: order => {
        // Normalise at the boundary so the template never guards for null.
        this.order.set({ ...order, orderItems: order.orderItems ?? [] });
        this.state.set('ready');
      },
      // A missing or forbidden order is a dead link, not a server fault.
      error: error => this.state.set(error?.status === 404 ? 'empty' : 'error'),
    });
  }

  protected itemImage(item: { productImage?: string | null }): string {
    return productImageUrl(item.productImage);
  }

  protected statusIcon(status: OrderStatus): string {
    return STATUS_ICONS[status];
  }
}

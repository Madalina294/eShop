import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule } from '@ngx-translate/core';

import { OrderStatus } from '../../../models/order';

interface Look {
  readonly icon: string;
  readonly tone: string;
}

/**
 * Icon + tone per order status. Colour alone would not survive a colour-blind
 * read, so every badge carries its own glyph as well.
 */
const LOOKS: Record<OrderStatus, Look> = {
  PENDING: { icon: 'schedule', tone: 'warning' },
  CONFIRMED: { icon: 'task_alt', tone: 'info' },
  SHIPPED: { icon: 'local_shipping', tone: 'brand' },
  DELIVERED: { icon: 'inventory', tone: 'success' },
  CANCELLED: { icon: 'cancel', tone: 'error' },
};

/** Coloured status pill for an order. */
@Component({
  selector: 'app-status-badge',
  standalone: true,
  imports: [MatIconModule, TranslateModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './status-badge.component.html',
  styleUrl: './status-badge.component.scss',
})
export class StatusBadgeComponent {
  readonly status = input.required<OrderStatus>();

  protected readonly look = computed(() => LOOKS[this.status()] ?? LOOKS.PENDING);
}

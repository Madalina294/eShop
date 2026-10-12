import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { PricePipe } from '../../shared/pipes/price.pipe';
import { forkJoin } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule } from '@ngx-translate/core';

import { AdminService } from '../../services/admin/admin.service';
import { AverageCart, TopCustomer, UserOrderCount } from '../../models/admin';
import { ViewState } from '../../models/ui-state';
import { PageHeaderComponent } from '../../shared/ui/page-header/page-header.component';
import { StatCardComponent } from '../../shared/ui/stat-card/stat-card.component';
import { LoadingStateComponent } from '../../shared/ui/loading-state/loading-state.component';
import { EmptyStateComponent } from '../../shared/ui/empty-state/empty-state.component';
import { ErrorStateComponent } from '../../shared/ui/error-state/error-state.component';

/**
 * Admin statistics.
 *
 * The three endpoints are now loaded as one `forkJoin` behind a single
 * `ViewState` instead of three independent requests with three booleans — and
 * its error messages were hardcoded English strings straight into `MatSnackBar`
 * while the rest of the app was translated.
 */
@Component({
  selector: 'app-statistics',
  standalone: true,
  imports: [
    PricePipe,
    MatButtonModule,
    MatIconModule,
    TranslateModule,
    PageHeaderComponent,
    StatCardComponent,
    LoadingStateComponent,
    EmptyStateComponent,
    ErrorStateComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './statistics.component.html',
  styleUrl: './statistics.component.scss',
})
export class StatisticsComponent {
  private readonly adminService = inject(AdminService);

  protected readonly state = signal<ViewState>('loading');
  protected readonly ordersByUser = signal<readonly UserOrderCount[]>([]);
  protected readonly topCustomers = signal<readonly TopCustomer[]>([]);
  protected readonly averageCart = signal<AverageCart | null>(null);

  constructor() {
    this.load();
  }

  protected load(): void {
    this.state.set('loading');

    forkJoin({
      ordersByUser: this.adminService.getOrdersCountByUser(),
      topCustomers: this.adminService.getTopCustomers(10),
      averageCart: this.adminService.getAverageCartValue(),
    }).subscribe({
      next: ({ ordersByUser, topCustomers, averageCart }) => {
        this.ordersByUser.set(ordersByUser);
        this.topCustomers.set(topCustomers);
        this.averageCart.set(averageCart);

        const hasAnything = ordersByUser.length > 0 || topCustomers.length > 0 || !!averageCart;
        this.state.set(hasAnything ? 'ready' : 'empty');
      },
      error: () => this.state.set('error'),
    });
  }
}

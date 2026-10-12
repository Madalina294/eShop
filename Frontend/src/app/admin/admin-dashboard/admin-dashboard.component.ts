import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { PricePipe } from '../../shared/pipes/price.pipe';
import { RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule } from '@ngx-translate/core';

import { AdminService } from '../../services/admin/admin.service';
import { AverageCart } from '../../models/admin';
import { ViewState } from '../../models/ui-state';
import { PageHeaderComponent } from '../../shared/ui/page-header/page-header.component';
import { StatCardComponent } from '../../shared/ui/stat-card/stat-card.component';
import { LoadingStateComponent } from '../../shared/ui/loading-state/loading-state.component';
import { ErrorStateComponent } from '../../shared/ui/error-state/error-state.component';

interface Tile {
  readonly title: string;
  readonly description: string;
  readonly icon: string;
  readonly route: string;
}

/**
 * Quick-access tiles. Previously built by a `get dashboardItems()` getter that
 * called `translate.instant()` twelve times on every change-detection cycle;
 * the keys are now constants and the template translates them once each.
 *
 * The `/admin/settings` tile is gone: the route never existed, so it 404ed.
 */
const TILES: readonly Tile[] = [
  {
    title: 'adminDashboard.manageUsers.title',
    description: 'adminDashboard.manageUsers.description',
    icon: 'supervisor_account',
    route: '/admin/all-users',
  },
  {
    title: 'adminDashboard.manageCategories.title',
    description: 'adminDashboard.manageCategories.description',
    icon: 'category',
    route: '/admin/view-categories',
  },
  {
    title: 'adminDashboard.manageProducts.title',
    description: 'adminDashboard.manageProducts.description',
    icon: 'inventory_2',
    route: '/admin/view-products',
  },
  {
    title: 'adminDashboard.statistics.title',
    description: 'adminDashboard.statistics.description',
    icon: 'insights',
    route: '/admin/statistics',
  },
  {
    title: 'adminDashboard.activityLogs.title',
    description: 'adminDashboard.activityLogs.description',
    icon: 'history',
    route: '/admin/activity-logs',
  },
];

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [
    RouterLink,
    PricePipe,
    MatIconModule,
    TranslateModule,
    PageHeaderComponent,
    StatCardComponent,
    LoadingStateComponent,
    ErrorStateComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './admin-dashboard.component.html',
  styleUrl: './admin-dashboard.component.scss',
})
export class AdminDashboardComponent {
  private readonly adminService = inject(AdminService);

  protected readonly tiles = TILES;
  protected readonly state = signal<ViewState>('loading');

  protected readonly cart = signal<AverageCart | null>(null);
  protected readonly customerCount = signal(0);

  constructor() {
    this.load();
  }

  protected load(): void {
    this.state.set('loading');

    // The only statistics the frozen backend exposes.
    forkJoin({
      cart: this.adminService.getAverageCartValue(),
      byUser: this.adminService.getOrdersCountByUser(),
    }).subscribe({
      next: ({ cart, byUser }) => {
        this.cart.set(cart);
        this.customerCount.set(byUser.length);
        this.state.set('ready');
      },
      error: () => this.state.set('error'),
    });
  }
}

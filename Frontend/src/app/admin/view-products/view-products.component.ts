import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { PricePipe } from '../../shared/pipes/price.pipe';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatPaginatorIntl, MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

import { AdminService } from '../../services/admin/admin.service';
import { ProductData } from '../../models/admin';
import { ViewState } from '../../models/ui-state';
import { productImageUrl } from '../../core/http/image-url';
import { NotificationService } from '../../shared/notification/notification.service';
import { ConfirmDeleteComponent } from '../../shared/confirm-delete/confirm-delete.component';
import { TranslatedPaginatorIntl } from '../../shared/paginator/translated-paginator-intl';
import { PageHeaderComponent } from '../../shared/ui/page-header/page-header.component';
import { LoadingStateComponent } from '../../shared/ui/loading-state/loading-state.component';
import { EmptyStateComponent } from '../../shared/ui/empty-state/empty-state.component';
import { ErrorStateComponent } from '../../shared/ui/error-state/error-state.component';

type SortKey = 'id' | 'name' | 'price' | 'quantity';

/**
 * Product listing.
 *
 * The old version declared a second, private copy of `CustomPaginatorIntl` that
 * it never provided — so the paginator stayed in English — hand-rolled its row
 * menu with an `activeMenuId` signal, and exposed `Math` on the class so the
 * template could call it.
 */
@Component({
  selector: 'app-view-products',
  standalone: true,
  imports: [
    RouterLink,
    PricePipe,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatPaginatorModule,
    TranslateModule,
    PageHeaderComponent,
    LoadingStateComponent,
    EmptyStateComponent,
    ErrorStateComponent,
  ],
  providers: [{ provide: MatPaginatorIntl, useClass: TranslatedPaginatorIntl }],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './view-products.component.html',
  styleUrl: './view-products.component.scss',
})
export class ViewProductsComponent {
  private readonly adminService = inject(AdminService);
  private readonly notifications = inject(NotificationService);
  private readonly translate = inject(TranslateService);
  private readonly dialog = inject(MatDialog);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  protected readonly state = signal<ViewState>('loading');
  protected readonly products = signal<readonly ProductData[]>([]);
  protected readonly total = signal(0);

  /** Paging and sorting live in the URL, so a view can be shared or refreshed. */
  private readonly params = toSignal(this.route.queryParams, { initialValue: {} as any });

  protected readonly page = computed(() => Number(this.params()['page'] ?? 0));
  protected readonly size = computed(() => Number(this.params()['size'] ?? 10));
  protected readonly sortBy = computed<SortKey>(() => (this.params()['sortBy'] ?? 'id') as SortKey);
  protected readonly sortDir = computed<'asc' | 'desc'>(() =>
    this.params()['sortDir'] === 'desc' ? 'desc' : 'asc'
  );

  /** Client-side filter over the current page, for quick narrowing. */
  protected readonly search = signal('');

  protected readonly visible = computed(() => {
    const term = this.search().trim().toLowerCase();
    if (!term) return this.products();

    return this.products().filter(
      product =>
        product.name?.toLowerCase().includes(term) ||
        product.categoryName?.toLowerCase().includes(term) ||
        product.material?.toLowerCase().includes(term)
    );
  });

  constructor() {
    // Re-fetch whenever paging or sorting changes in the URL.
    this.params();
    this.load();
  }

  protected load(): void {
    this.state.set('loading');

    this.adminService
      .getProductsPaginated(this.page(), this.size(), this.sortBy(), this.sortDir())
      .subscribe({
        next: result => {
          this.products.set(result.content ?? []);
          this.total.set(result.totalElements ?? 0);
          this.state.set(result.content?.length ? 'ready' : 'empty');
        },
        error: () => this.state.set('error'),
      });
  }

  protected sort(key: SortKey): void {
    const dir = this.sortBy() === key && this.sortDir() === 'asc' ? 'desc' : 'asc';
    this.navigate({ sortBy: key, sortDir: dir, page: 0 });
  }

  protected onPage(event: PageEvent): void {
    this.navigate({ page: event.pageIndex, size: event.pageSize });
  }

  protected imageFor(product: ProductData): string {
    return productImageUrl(product.image);
  }

  protected goToAdd(): void {
    this.router.navigateByUrl('/admin/add-product');
  }

  protected confirmDelete(product: ProductData): void {
    const dialogRef = this.dialog.open(ConfirmDeleteComponent, {
      width: '420px',
      data: {
        message: this.translate.instant('viewProducts.confirmDelete'),
        titleKey: 'viewProducts.deleteProduct',
        destructive: true,
      },
    });

    dialogRef.afterClosed().subscribe(confirmed => {
      if (confirmed !== true) return;

      this.adminService.deleteProduct(product.id).subscribe({
        next: () => {
          this.notifications.success('viewProducts.productDeletedSuccess');
          this.load();
        },
        error: () => this.notifications.error('viewProducts.deleteError'),
      });
    });
  }

  private navigate(queryParams: Record<string, unknown>): void {
    this.router
      .navigate([], { relativeTo: this.route, queryParams, queryParamsHandling: 'merge' })
      .then(() => this.load());
  }
}

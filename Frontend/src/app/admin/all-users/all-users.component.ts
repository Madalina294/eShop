import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatPaginatorIntl, MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

import { AdminService } from '../../services/admin/admin.service';
import { UserData } from '../../models/admin';
import { ViewState } from '../../models/ui-state';
import { avatarUrl } from '../../core/http/image-url';
import { NotificationService } from '../../shared/notification/notification.service';
import { ConfirmDeleteComponent } from '../../shared/confirm-delete/confirm-delete.component';
import { TranslatedPaginatorIntl } from '../../shared/paginator/translated-paginator-intl';
import { PageHeaderComponent } from '../../shared/ui/page-header/page-header.component';
import { LoadingStateComponent } from '../../shared/ui/loading-state/loading-state.component';
import { EmptyStateComponent } from '../../shared/ui/empty-state/empty-state.component';
import { ErrorStateComponent } from '../../shared/ui/error-state/error-state.component';

type SortKey = 'id' | 'firstname' | 'lastname' | 'email';

/**
 * User listing.
 *
 * Was a card grid with its own inline `CustomPaginatorIntl` duplicate; it now
 * uses the shared table and the shared paginator translations.
 */
@Component({
  selector: 'app-all-users',
  standalone: true,
  imports: [
    RouterLink,
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
  templateUrl: './all-users.component.html',
  styleUrl: './all-users.component.scss',
})
export class AllUsersComponent {
  private readonly adminService = inject(AdminService);
  private readonly notifications = inject(NotificationService);
  private readonly translate = inject(TranslateService);
  private readonly dialog = inject(MatDialog);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  protected readonly state = signal<ViewState>('loading');
  protected readonly users = signal<readonly UserData[]>([]);
  protected readonly total = signal(0);
  protected readonly search = signal('');

  private readonly params = toSignal(this.route.queryParams, { initialValue: {} as any });

  protected readonly page = computed(() => Number(this.params()['page'] ?? 0));
  protected readonly size = computed(() => Number(this.params()['size'] ?? 10));
  protected readonly sortBy = computed<SortKey>(() => (this.params()['sortBy'] ?? 'id') as SortKey);
  protected readonly sortDir = computed<'asc' | 'desc'>(() =>
    this.params()['sortDir'] === 'desc' ? 'desc' : 'asc'
  );

  protected readonly visible = computed(() => {
    const term = this.search().trim().toLowerCase();
    if (!term) return this.users();

    return this.users().filter(
      user =>
        user.firstName?.toLowerCase().includes(term) ||
        user.lastName?.toLowerCase().includes(term) ||
        user.email?.toLowerCase().includes(term)
    );
  });

  constructor() {
    this.params();
    this.load();
  }

  protected load(): void {
    this.state.set('loading');

    this.adminService
      .getUsersPaginated(this.page(), this.size(), this.sortBy(), this.sortDir())
      .subscribe({
        next: result => {
          this.users.set(result.content ?? []);
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

  protected avatarFor(user: UserData): string {
    return avatarUrl(user.imageUrl);
  }

  protected confirmDelete(user: UserData): void {
    const dialogRef = this.dialog.open(ConfirmDeleteComponent, {
      width: '420px',
      data: {
        message: this.translate.instant('allUsers.confirmDelete'),
        titleKey: 'allUsers.deleteButton',
        destructive: true,
      },
    });

    dialogRef.afterClosed().subscribe(confirmed => {
      if (confirmed !== true) return;

      this.adminService.deleteUser(user.userId).subscribe({
        next: () => {
          this.notifications.success('allUsers.userDeletedSuccess');
          this.load();
        },
        error: () => this.notifications.error('allUsers.deleteError'),
      });
    });
  }

  private navigate(queryParams: Record<string, unknown>): void {
    this.router
      .navigate([], { relativeTo: this.route, queryParams, queryParamsHandling: 'merge' })
      .then(() => this.load());
  }
}

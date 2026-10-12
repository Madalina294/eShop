import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatPaginatorIntl, MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatSelectModule } from '@angular/material/select';
import { TranslateModule } from '@ngx-translate/core';

import { AdminService } from '../../services/admin/admin.service';
import { ActivityLog, ActivityLogFilters } from '../../models/admin';
import { ViewState } from '../../models/ui-state';
import { TranslatedPaginatorIntl } from '../../shared/paginator/translated-paginator-intl';
import { PageHeaderComponent } from '../../shared/ui/page-header/page-header.component';
import { LoadingStateComponent } from '../../shared/ui/loading-state/loading-state.component';
import { EmptyStateComponent } from '../../shared/ui/empty-state/empty-state.component';
import { ErrorStateComponent } from '../../shared/ui/error-state/error-state.component';

/** Statuses the backend records; `''` means "no filter". */
const STATUSES = ['', 'SUCCESS', 'FAILURE', 'ERROR'] as const;

/**
 * Activity log with server-side filtering.
 *
 * The `ActivityLog` shapes used to be declared in this file, and the filters
 * were assembled into a raw query string by hand — they now go through the
 * typed `ActivityLogFilters` the service accepts.
 */
@Component({
  selector: 'app-activity-logs',
  standalone: true,
  imports: [
    DatePipe,
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatPaginatorModule,
    MatSelectModule,
    TranslateModule,
    PageHeaderComponent,
    LoadingStateComponent,
    EmptyStateComponent,
    ErrorStateComponent,
  ],
  providers: [{ provide: MatPaginatorIntl, useClass: TranslatedPaginatorIntl }],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './activity-logs.component.html',
  styleUrl: './activity-logs.component.scss',
})
export class ActivityLogsComponent {
  private readonly adminService = inject(AdminService);
  private readonly fb = inject(FormBuilder);

  protected readonly statuses = STATUSES;
  protected readonly state = signal<ViewState>('loading');
  protected readonly logs = signal<readonly ActivityLog[]>([]);
  protected readonly total = signal(0);
  protected readonly page = signal(0);
  protected readonly size = signal(10);

  protected readonly filters = this.fb.nonNullable.group({
    actionType: [''],
    status: [''],
    startDate: [''],
    endDate: [''],
  });

  /** Only enabled once at least one filter is set. */
  protected readonly hasFilters = computed(() => {
    const value = this.filters.getRawValue();
    return !!(value.actionType || value.status || value.startDate || value.endDate);
  });

  constructor() {
    this.load();
  }

  protected load(): void {
    this.state.set('loading');

    const value = this.filters.getRawValue();
    const request: ActivityLogFilters = {
      page: this.page(),
      size: this.size(),
      actionType: value.actionType || null,
      status: value.status || null,
      // The endpoint parses ISO_LOCAL_DATE_TIME; a date input yields a date.
      startDate: value.startDate ? `${value.startDate}T00:00:00` : null,
      endDate: value.endDate ? `${value.endDate}T23:59:59` : null,
    };

    this.adminService.getActivityLogs(request).subscribe({
      next: result => {
        this.logs.set(result.content ?? []);
        this.total.set(result.totalElements ?? 0);
        this.state.set(result.content?.length ? 'ready' : 'empty');
      },
      error: () => this.state.set('error'),
    });
  }

  protected applyFilters(): void {
    this.page.set(0);
    this.load();
  }

  protected clearFilters(): void {
    this.filters.reset();
    this.applyFilters();
  }

  protected onPage(event: PageEvent): void {
    this.page.set(event.pageIndex);
    this.size.set(event.pageSize);
    this.load();
  }

  protected statusTone(status: string): string {
    const value = status?.toUpperCase();
    if (value === 'SUCCESS') return 'success';
    if (value === 'FAILURE' || value === 'ERROR') return 'error';
    return 'neutral';
  }
}

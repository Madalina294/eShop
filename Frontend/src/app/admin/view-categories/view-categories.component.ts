import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

import { AdminService } from '../../services/admin/admin.service';
import { CategoryData } from '../../models/admin';
import { ViewState } from '../../models/ui-state';
import { NotificationService } from '../../shared/notification/notification.service';
import { ConfirmDeleteComponent } from '../../shared/confirm-delete/confirm-delete.component';
import { CategoryEditDialogComponent } from '../category-edit-dialog/category-edit-dialog.component';
import { PageHeaderComponent } from '../../shared/ui/page-header/page-header.component';
import { LoadingStateComponent } from '../../shared/ui/loading-state/loading-state.component';
import { EmptyStateComponent } from '../../shared/ui/empty-state/empty-state.component';
import { ErrorStateComponent } from '../../shared/ui/error-state/error-state.component';

/** Category listing, with rename handled in a dialog rather than a page hop. */
@Component({
  selector: 'app-view-categories',
  standalone: true,
  imports: [
    RouterLink,
    MatButtonModule,
    MatIconModule,
    TranslateModule,
    PageHeaderComponent,
    LoadingStateComponent,
    EmptyStateComponent,
    ErrorStateComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './view-categories.component.html',
  styleUrl: './view-categories.component.scss',
})
export class ViewCategoriesComponent {
  private readonly adminService = inject(AdminService);
  private readonly notifications = inject(NotificationService);
  private readonly translate = inject(TranslateService);
  private readonly dialog = inject(MatDialog);
  private readonly router = inject(Router);

  protected readonly state = signal<ViewState>('loading');
  protected readonly categories = signal<readonly CategoryData[]>([]);

  constructor() {
    this.load();
  }

  protected load(): void {
    this.state.set('loading');

    this.adminService.getCategories().subscribe({
      next: categories => {
        this.categories.set(categories ?? []);
        this.state.set(categories?.length ? 'ready' : 'empty');
      },
      error: () => this.state.set('error'),
    });
  }

  protected goToCreate(): void {
    this.router.navigateByUrl('/admin/create-category');
  }

  protected edit(category: CategoryData): void {
    const dialogRef = this.dialog.open(CategoryEditDialogComponent, {
      width: '480px',
      data: category,
    });

    dialogRef.afterClosed().subscribe(saved => {
      if (saved) this.load();
    });
  }

  protected confirmDelete(category: CategoryData): void {
    const dialogRef = this.dialog.open(ConfirmDeleteComponent, {
      width: '420px',
      data: {
        message: this.translate.instant('viewCategories.confirmDelete'),
        titleKey: 'viewCategories.deleteButton',
        destructive: true,
      },
    });

    dialogRef.afterClosed().subscribe(confirmed => {
      if (confirmed !== true) return;

      this.adminService.deleteCategory(category.id).subscribe({
        next: () => {
          this.notifications.success('viewCategories.categoryDeletedSuccess');
          this.load();
        },
        error: () => this.notifications.error('viewCategories.deleteError'),
      });
    });
  }
}

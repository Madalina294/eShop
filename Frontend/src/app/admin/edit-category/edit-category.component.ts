import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { TranslateModule } from '@ngx-translate/core';

import { AdminService } from '../../services/admin/admin.service';
import { ViewState } from '../../models/ui-state';
import { NotificationService } from '../../shared/notification/notification.service';
import { PageHeaderComponent } from '../../shared/ui/page-header/page-header.component';
import { LoadingStateComponent } from '../../shared/ui/loading-state/loading-state.component';
import { ErrorStateComponent } from '../../shared/ui/error-state/error-state.component';

@Component({
  selector: 'app-edit-category',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule,
    TranslateModule,
    PageHeaderComponent,
    LoadingStateComponent,
    ErrorStateComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './edit-category.component.html',
  styleUrl: './edit-category.component.scss',
})
export class EditCategoryComponent {
  private readonly fb = inject(FormBuilder);
  private readonly adminService = inject(AdminService);
  private readonly notifications = inject(NotificationService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  private readonly categoryId = Number(this.route.snapshot.queryParams['categoryId']);

  protected readonly state = signal<ViewState>('loading');
  protected readonly saving = signal(false);

  protected readonly form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    description: ['', Validators.required],
  });

  constructor() {
    this.load();
  }

  protected load(): void {
    if (!this.categoryId) {
      this.state.set('error');
      return;
    }

    this.state.set('loading');

    this.adminService.getCategoryById(this.categoryId).subscribe({
      next: category => {
        this.form.patchValue({
          name: category.name ?? '',
          description: category.description ?? '',
        });
        this.state.set('ready');
      },
      error: () => this.state.set('error'),
    });
  }

  protected submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.saving.set(true);

    this.adminService
      .updateCategory({ id: this.categoryId, ...this.form.getRawValue() })
      .subscribe({
        next: () => {
          this.saving.set(false);
          this.notifications.success('editCategory.successMessage');
          this.router.navigateByUrl('/admin/view-categories');
        },
        error: () => {
          this.saving.set(false);
          this.notifications.error('editCategory.errorMessage');
        },
      });
  }
}

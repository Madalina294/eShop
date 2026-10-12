import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { TranslateModule } from '@ngx-translate/core';

import { AdminService } from '../../services/admin/admin.service';
import { CategoryData } from '../../models/admin';
import { NotificationService } from '../../shared/notification/notification.service';

/**
 * Quick edit for a category, so renaming one does not mean leaving the list,
 * loading a separate page and coming back.
 */
@Component({
  selector: 'app-category-edit-dialog',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule,
    TranslateModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './category-edit-dialog.component.html',
  styles: `
    .cat-dialog__content {
      display: flex;
      flex-direction: column;
      gap: var(--space-2);
      min-width: 320px;
      padding-top: var(--space-2);
    }
  `,
})
export class CategoryEditDialogComponent {
  private readonly fb = inject(FormBuilder);
  private readonly adminService = inject(AdminService);
  private readonly notifications = inject(NotificationService);
  private readonly dialogRef = inject(MatDialogRef<CategoryEditDialogComponent, boolean>);

  protected readonly category = inject<CategoryData>(MAT_DIALOG_DATA);
  protected readonly saving = signal(false);

  protected readonly form = this.fb.nonNullable.group({
    name: [this.category.name ?? '', [Validators.required, Validators.minLength(2)]],
    description: [this.category.description ?? ''],
  });

  protected save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.saving.set(true);
    const { name, description } = this.form.getRawValue();

    this.adminService.updateCategory({ id: this.category.id, name, description }).subscribe({
      next: () => {
        this.saving.set(false);
        this.notifications.success('editCategory.successMessage');
        this.dialogRef.close(true);
      },
      error: () => {
        this.saving.set(false);
        this.notifications.error('editCategory.errorMessage');
      },
    });
  }

  protected cancel(): void {
    this.dialogRef.close(false);
  }
}

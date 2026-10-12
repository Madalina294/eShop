import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { TranslateModule } from '@ngx-translate/core';

import { AdminService } from '../../services/admin/admin.service';
import { CategoryData } from '../../models/admin';
import { NotificationService } from '../../shared/notification/notification.service';
import { PageHeaderComponent } from '../../shared/ui/page-header/page-header.component';
import { buildProductForm, toProductFormData } from '../product-form/product-form';

@Component({
  selector: 'app-add-product',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    TranslateModule,
    PageHeaderComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './add-product.component.html',
  styleUrl: './add-product.component.scss',
})
export class AddProductComponent {
  private readonly fb = inject(FormBuilder);
  private readonly adminService = inject(AdminService);
  private readonly notifications = inject(NotificationService);
  private readonly router = inject(Router);

  protected readonly saving = signal(false);
  protected readonly categories = signal<readonly CategoryData[]>([]);
  protected readonly selectedFile = signal<File | null>(null);
  protected readonly preview = signal<string | null>(null);

  protected readonly form = buildProductForm(this.fb);

  constructor() {
    this.adminService.getCategories().subscribe({
      next: categories => this.categories.set(categories ?? []),
      error: () => this.notifications.error('createProduct.errorLoadingCategories'),
    });
  }

  protected onFileSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file || !file.type.startsWith('image/')) return;

    this.selectedFile.set(file);

    const reader = new FileReader();
    reader.onload = () => this.preview.set(reader.result as string);
    reader.readAsDataURL(file);
  }

  protected submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.saving.set(true);

    this.adminService
      .addProduct(toProductFormData(this.form.getRawValue(), this.selectedFile()))
      .subscribe({
        next: () => {
          this.saving.set(false);
          this.notifications.success('createProduct.successMessage');
          this.router.navigateByUrl('/admin/view-products');
        },
        error: () => {
          this.saving.set(false);
          this.notifications.error('createProduct.errorMessage');
        },
      });
  }
}

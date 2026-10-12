import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { TranslateModule } from '@ngx-translate/core';

import { AdminService } from '../../services/admin/admin.service';
import { CategoryData } from '../../models/admin';
import { ViewState } from '../../models/ui-state';
import { productImageUrl } from '../../core/http/image-url';
import { NotificationService } from '../../shared/notification/notification.service';
import { PageHeaderComponent } from '../../shared/ui/page-header/page-header.component';
import { LoadingStateComponent } from '../../shared/ui/loading-state/loading-state.component';
import { ErrorStateComponent } from '../../shared/ui/error-state/error-state.component';
import { buildProductForm, toProductFormData } from '../product-form/product-form';

@Component({
  selector: 'app-edit-product',
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
    LoadingStateComponent,
    ErrorStateComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './edit-product.component.html',
  styleUrl: './edit-product.component.scss',
})
export class EditProductComponent {
  private readonly fb = inject(FormBuilder);
  private readonly adminService = inject(AdminService);
  private readonly notifications = inject(NotificationService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  private readonly productId = Number(this.route.snapshot.queryParams['productId']);

  protected readonly state = signal<ViewState>('loading');
  protected readonly saving = signal(false);
  protected readonly categories = signal<readonly CategoryData[]>([]);
  protected readonly selectedFile = signal<File | null>(null);
  /** Local preview if a new file was picked, otherwise the stored image. */
  protected readonly preview = signal<string | null>(null);

  protected readonly form = buildProductForm(this.fb);

  constructor() {
    this.load();
  }

  protected load(): void {
    if (!this.productId) {
      this.state.set('error');
      return;
    }

    this.state.set('loading');

    forkJoin({
      product: this.adminService.getProduct(this.productId),
      categories: this.adminService.getCategories(),
    }).subscribe({
      next: ({ product, categories }) => {
        this.categories.set(categories ?? []);

        this.form.patchValue({
          name: product.name ?? '',
          price: product.price ?? 0,
          description: product.description ?? '',
          color: product.color ?? '',
          dimensions: product.dimensions ?? '',
          material: product.material ?? '',
          weight: product.weight ?? '',
          quantity: product.quantity ?? 0,
          categoryId: product.categoryId ?? 0,
        });

        // Was built by hand with a hardcoded `http://localhost:8080` prefix.
        this.preview.set(product.image ? productImageUrl(product.image) : null);
        this.state.set('ready');
      },
      error: () => this.state.set('error'),
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
      .updateProduct(
        toProductFormData(this.form.getRawValue(), this.selectedFile(), this.productId)
      )
      .subscribe({
        next: () => {
          this.saving.set(false);
          this.notifications.success('editProduct.successMessage');
          this.router.navigateByUrl('/admin/view-products');
        },
        error: () => {
          this.saving.set(false);
          this.notifications.error('editProduct.errorMessage');
        },
      });
  }
}

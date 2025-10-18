import {ChangeDetectorRef, Component, computed, OnInit, signal} from '@angular/core';
import {FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators} from '@angular/forms';
import {AdminService, ProductData} from '../../services/admin/admin.service';
import {MatSnackBar} from '@angular/material/snack-bar';
import {TranslatePipe, TranslateService} from '@ngx-translate/core';
import {ActivatedRoute, Router} from '@angular/router';
import {BreadcrumbComponent} from '../../shared/breadcrumb/breadcrumb.component';
import {MatButton} from '@angular/material/button';
import {MatCard, MatCardAvatar, MatCardHeader, MatCardSubtitle, MatCardTitle} from '@angular/material/card';
import {MatInput, MatLabel} from '@angular/material/input';
import {NgFor, NgIf} from '@angular/common';
import {MatError, MatFormField} from '@angular/material/form-field';
import {MatIcon} from '@angular/material/icon';
import {MatProgressSpinner} from '@angular/material/progress-spinner';
import {MatOption, MatSelect} from '@angular/material/select';

@Component({
  selector: 'app-edit-product',
  imports: [
    BreadcrumbComponent,
    FormsModule,
    MatButton,
    MatCard,
    MatCardAvatar,
    MatCardHeader,
    MatCardSubtitle,
    MatCardTitle,
    MatError,
    MatFormField,
    MatIcon,
    MatInput,
    MatLabel,
    MatProgressSpinner,
    NgIf,
    NgFor,
    ReactiveFormsModule,
    TranslatePipe,
    MatSelect,
    MatOption
  ],
  templateUrl: './edit-product.component.html',
  styleUrl: './edit-product.component.scss'
})
export class EditProductComponent implements OnInit {
  isLoading = signal(false);
  updateProductForm!: FormGroup;
  productId!: number;
  selectedFile: File | null = null;
  tempImagePreview = signal<string | null>(null);
  existingImage = signal<string | null>(null);
  categories: any[] = [];

  imageToDisplay = computed(() => {
    const tempImage = this.tempImagePreview();
    const existing = this.existingImage();
    
    // Dacă există imagine temporară (nou selectată), afișează-o
    if (tempImage) {
      return tempImage;
    }
    
    // Dacă există imagine existentă, afișează-o
    if (existing && existing.startsWith('/uploads/')) {
      return 'http://localhost:8080' + existing;
    }
    
    return existing || 'assets/default-avatar.png';
  });

  constructor(
    private fb: FormBuilder,
    private adminService: AdminService,
    private snackBar: MatSnackBar,
    private translate: TranslateService,
    private router: Router,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef
  ) {
    // Inițializează formularul mai întâi (gol)
    this.updateProductForm = this.fb.group({
      name: ['', [Validators.required]],
      price: ['', [Validators.required]],
      image: [''], // Nu este required pentru update
      description: ['', Validators.required],
      categoryId: ['', Validators.required],
      color: ['', Validators.required],
      dimensions: ['', Validators.required],
      material: ['', Validators.required],
      weight: ['', Validators.required],
      quantity: ['', Validators.required]
    });

    // Extrage ID-ul produsului
    this.productId = this.route.snapshot.queryParams['productId'];
  }

  ngOnInit() {
    this.loadCategories();
    this.loadProduct();
  }

  loadCategories() {
    this.adminService.getCategories().subscribe({
      next: (data) => {
        this.categories = data;
      },
      error: (err) => {
        this.snackBar.open(
          this.translate.instant('editProduct.errorLoadingCategories'),
          this.translate.instant('editProduct.ok'),
          {duration: 3000}
        );
      }
    });
  }

  loadProduct() {
    this.isLoading.set(true);
    this.adminService.getProduct(this.productId).subscribe({
      next: (product: ProductData) => {
        this.isLoading.set(false);
        // Populează formularul cu datele primite
        this.updateProductForm.patchValue({
          name: product.name,
          price: product.price,
          description: product.description,
          categoryId: product.categoryId,
          color: product.color,
          dimensions: product.dimensions,
          material: product.material,
          weight: product.weight,
          quantity: product.quantity
        });
        
        // Salvează URL-ul imaginii existente
        if (product.image) {
          this.existingImage.set(product.image);
          console.log('Loaded product image:', product.image);
        }
      },
      error: (err) => {
        this.isLoading.set(false);
        this.snackBar.open(
          this.translate.instant('editProduct.errorMessage'),
          this.translate.instant('editProduct.ok'),
          {duration: 3000}
        );
      }
    });
  }

  onSubmit() {
    if (this.updateProductForm.invalid) {
      this.snackBar.open(
        this.translate.instant('editProduct.errorMessage'),
        this.translate.instant('editProduct.ok'),
        {duration: 3000}
      );
      return;
    }

    this.isLoading.set(true);

    const formData = new FormData();
    
    // IMPORTANT: Trimite ID-ul!
    formData.append('id', this.productId.toString());
    formData.append('name', this.updateProductForm.get('name')?.value);
    formData.append('price', this.updateProductForm.get('price')?.value);
    formData.append('description', this.updateProductForm.get('description')?.value);
    formData.append('color', this.updateProductForm.get('color')?.value);
    formData.append('dimensions', this.updateProductForm.get('dimensions')?.value);
    formData.append('material', this.updateProductForm.get('material')?.value);
    formData.append('weight', this.updateProductForm.get('weight')?.value);
    formData.append('quantity', this.updateProductForm.get('quantity')?.value);
    formData.append('categoryId', this.updateProductForm.get('categoryId')?.value);

    // Trimite imaginea doar dacă a fost selectată una nouă
    if (this.selectedFile) {
      formData.append('image', this.selectedFile, this.selectedFile.name);
      console.log('Sending new image:', this.selectedFile.name);
    } else {
      console.log('No new image selected, keeping existing image:', this.existingImage());
    }

    this.adminService.updateProduct(formData).subscribe({
      next: (response) => {
        this.isLoading.set(false);
        console.log('Product updated successfully:', response);
        console.log('Updated product image:', response.image);
        this.snackBar.open(
          this.translate.instant('editProduct.successMessage'),
          this.translate.instant('editProduct.ok'),
          {duration: 3000}
        );
        // Redirect înapoi la lista de produse după 1 secundă
        setTimeout(() => {
          this.router.navigate(['/admin/view-products']);
        }, 1000);
      },
      error: (err) => {
        this.isLoading.set(false);
        console.error('Error updating product:', err);
        this.snackBar.open(
          this.translate.instant('editProduct.errorMessage'),
          this.translate.instant('editProduct.ok'),
          {duration: 3000}
        );
      }
    });
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (file) {
      // Validate type
      if (!file.type.startsWith('image/')) {
        this.snackBar.open(
          this.translate.instant('profile.invalidImageType'),
          this.translate.instant('profile.ok')
        );
        return;
      }

      // Validate size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        this.snackBar.open(
          this.translate.instant('profile.imageTooLarge'),
          this.translate.instant('profile.ok')
        );
        return;
      }

      // Save file for upload (exact ca la user)
      this.selectedFile = file;

      // Generate preview pentru UI
      const reader = new FileReader();
      reader.onload = () => {
        this.tempImagePreview.set(reader.result as string); // base64 string doar pentru preview
        this.updateProductForm.patchValue({ image: 'selected' }); // marchează că există imagine
        this.cdr.markForCheck(); // force UI update (OnPush)
      };
      reader.readAsDataURL(file);
    }
  }

  onCancel() {
    this.router.navigate(['/admin/view-products']);
  }
}

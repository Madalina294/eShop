import {ChangeDetectorRef, Component, computed, OnInit, signal} from '@angular/core';
import {FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators} from '@angular/forms';
import {AdminService} from '../../services/admin/admin.service';
import {MatSnackBar} from '@angular/material/snack-bar';
import {TranslatePipe, TranslateService} from '@ngx-translate/core';
import {Router} from '@angular/router';
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
  selector: 'app-add-product',
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
  templateUrl: './add-product.component.html',
  styleUrl: './add-product.component.scss'
})
export class AddProductComponent implements OnInit {
  isSpinning = signal(false);
  createProductForm!: FormGroup;
  selectedFile: File | null = null;
  tempImagePreview = signal<string | null>(null);
  categories: any[] = [];

  imageToDisplay = computed(() => {
    const image = this.tempImagePreview();
    if (image && image.startsWith('/uploads/')) {
      return 'http://localhost:8080' + image;
    }
    return image || 'assets/default-avatar.png';
  });

  constructor(private fb: FormBuilder,
              private adminService: AdminService,
              private snackBar: MatSnackBar,
              private translate: TranslateService,
              private route: Router,
              private cdr: ChangeDetectorRef) {
    this.createProductForm = this.fb.group({
      name: ['', [Validators.required]],
      price:['', [Validators.required]],
      image:['', Validators.required],
      description: ['', Validators.required],
      categoryId:['', Validators.required],
      color:['', Validators.required],
      dimensions:['', Validators.required],
      material:['', Validators.required],
      weight:['', Validators.required],
      quantity:['', Validators.required]
    });
  }

  ngOnInit() {
    this.loadCategories();
  }

  loadCategories() {
    this.adminService.getCategories().subscribe({
      next: (data) => {
        this.categories = data;
      },
      error: (err) => {
        this.snackBar.open(
          this.translate.instant('createProduct.errorLoadingCategories'),
          this.translate.instant('createProduct.ok'),
          {duration: 3000}
        );
      }
    });
  }

  onSubmit(){
    if (!this.createProductForm.valid){
      return;
    }

    // Verifică dacă imaginea a fost selectată
    if (!this.selectedFile) {
      this.snackBar.open(
        this.translate.instant('createProduct.imageRequired'),
        this.translate.instant('createProduct.ok'),
        {duration: 3000}
      );
      return;
    }

    this.isSpinning.set(true);

    const formData = new FormData();

    formData.append("name", this.createProductForm.get('name')?.value);
    formData.append("price", this.createProductForm.get('price')?.value);
    formData.append("description", this.createProductForm.get('description')?.value);
    formData.append("color", this.createProductForm.get('color')?.value);
    formData.append("dimensions", this.createProductForm.get('dimensions')?.value);
    formData.append("material", this.createProductForm.get('material')?.value);
    formData.append("weight", this.createProductForm.get('weight')?.value);
    formData.append("quantity", this.createProductForm.get('quantity')?.value);
    formData.append("categoryId", this.createProductForm.get('categoryId')?.value);
    
    // Trimite imaginea ca fișier (exact ca la user)
    if (this.selectedFile) {
      formData.append("image", this.selectedFile, this.selectedFile.name);
    }

    this.adminService.addProduct(formData).subscribe({
      next: value => {
        this.isSpinning.set(false);
        this.snackBar.open(
          this.translate.instant('createProduct.successMessage'),
          this.translate.instant('createProduct.ok'),
          {duration: 3000}
        );
        this.route.navigateByUrl("/admin/view-products");
      },
      error: err => {
        this.isSpinning.set(false);
        this.snackBar.open(
          this.translate.instant('createProduct.errorMessage'),
          this.translate.instant('createProduct.ok'),
          {duration: 3000}
        );
      }
    })
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (file) {
      // Validate type
      if (!file.type.startsWith('image/')) {
        this.snackBar.open(this.translate.instant('profile.invalidImageType'), this.translate.instant('profile.ok'));
        return;
      }

      // Validate size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        this.snackBar.open(this.translate.instant('profile.imageTooLarge'), this.translate.instant('profile.ok'));
        return;
      }

      // Save file for upload (exact ca la user)
      this.selectedFile = file;

      // Generate preview pentru UI
      const reader = new FileReader();
      reader.onload = () => {
        this.tempImagePreview.set(reader.result as string); // base64 string doar pentru preview
        this.createProductForm.patchValue({ image: 'selected' }); // marchează că există imagine
        this.cdr.markForCheck(); // force UI update (OnPush)
      };
      reader.readAsDataURL(file);
    }
  }
}

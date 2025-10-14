import {Component, signal} from '@angular/core';
import {FormBuilder, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {AdminService} from '../../services/admin/admin.service';
import {ActivatedRoute, Router} from '@angular/router';
import {MatSnackBar} from '@angular/material/snack-bar';
import {MatFormField, MatLabel, MatError} from '@angular/material/form-field';
import {MatInput} from '@angular/material/input';
import {MatButton} from '@angular/material/button';
import {MatProgressSpinner} from '@angular/material/progress-spinner';
import {MatCard, MatCardHeader, MatCardTitle, MatCardSubtitle} from '@angular/material/card';
import {MatIcon} from '@angular/material/icon';
import {CommonModule} from '@angular/common';
import {TranslateModule, TranslateService} from '@ngx-translate/core';
import {BreadcrumbComponent} from '../../shared/breadcrumb/breadcrumb.component';


@Component({
  selector: 'app-edit-category',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    TranslateModule,
    MatFormField,
    MatInput,
    MatButton,
    MatProgressSpinner,
    MatLabel,
    MatError,
    MatCard,
    MatCardHeader,
    MatCardTitle,
    MatCardSubtitle,
    MatIcon,
    BreadcrumbComponent
  ],
  templateUrl: './edit-category.component.html',
  styleUrl: './edit-category.component.scss'
})
export class EditCategoryComponent {

  isLoading = signal(false);
  updateForm!: FormGroup;
  categoryId!: number;

  constructor(private fb: FormBuilder,
              private adminService: AdminService,
              private route: ActivatedRoute,
              private router: Router,
              private snackBar: MatSnackBar,
              private translate: TranslateService) {
    // Inițializează formularul mai întâi (gol)
    this.updateForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      description: ['', [Validators.required, Validators.minLength(10)]]
    });

    // Extrage ID-ul categoriei
    this.categoryId = this.route.snapshot.queryParams["categoryId"];
    
    // Încarcă datele categoriei și populează formularul
    this.loadCategory();
  }

  loadCategory() {
    this.isLoading.set(true);
    this.adminService.getCategoryById(this.categoryId).subscribe({
      next: (res) => {
        this.isLoading.set(false);
        // Populează formularul cu datele primite
        this.updateForm.patchValue({
          name: res.name,
          description: res.description
        });
      },
      error: (err) => {
        this.isLoading.set(false);
        this.snackBar.open(
          this.translate.instant('editCategory.errorMessage'), 
          this.translate.instant('editCategory.ok'), 
          {duration: 3000}
        );
      }
    });
  }

  onSubmit(){
    if (this.updateForm.invalid) {
      this.snackBar.open(
        this.translate.instant('editCategory.errorMessage'), 
        this.translate.instant('editCategory.ok'), 
        {duration: 3000}
      );
      return;
    }

    const data = {
      id: this.categoryId,  // IMPORTANT: Trimite ID-ul!
      name: this.updateForm.get('name')?.value,
      description: this.updateForm.get('description')?.value
    }
    
    this.isLoading.set(true);
    this.adminService.updateCategory(data).subscribe({
      next: response => {
        this.isLoading.set(false);
        this.snackBar.open(
          this.translate.instant('editCategory.successMessage'), 
          this.translate.instant('editCategory.ok'), 
          {duration: 3000}
        );
        // Redirect înapoi la lista de categorii după 1 secundă
        setTimeout(() => {
          this.router.navigate(['/admin/view-categories']);
        }, 1000);
      },
      error: err => {
        this.isLoading.set(false);
        this.snackBar.open(
          this.translate.instant('editCategory.errorMessage'), 
          this.translate.instant('editCategory.ok'), 
          {duration: 3000}
        );
      }
    });
  }

  onCancel() {
    this.router.navigate(['/admin/view-categories']);
  }
}

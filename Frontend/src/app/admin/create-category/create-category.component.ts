import {Component, signal} from '@angular/core';
import {FormBuilder, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {AdminService} from '../../services/admin/admin.service';
import {MatSnackBar} from '@angular/material/snack-bar';
import {TranslateModule, TranslateService} from '@ngx-translate/core';
import {MatCardModule} from '@angular/material/card';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatInputModule} from '@angular/material/input';
import {MatButtonModule} from '@angular/material/button';
import {MatProgressSpinnerModule} from '@angular/material/progress-spinner';
import {MatIconModule} from '@angular/material/icon';
import {CommonModule} from '@angular/common';
import {BreadcrumbComponent} from '../../shared/breadcrumb/breadcrumb.component';
import {Router} from '@angular/router';

@Component({
  selector: 'app-create-category',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatIconModule,
    TranslateModule,
    BreadcrumbComponent
  ],
  templateUrl: './create-category.component.html',
  styleUrl: './create-category.component.scss'
})
export class CreateCategoryComponent {

  isSpinning = signal(false);
  createCategoryForm!: FormGroup;

  constructor(private fb: FormBuilder,
              private adminService: AdminService,
              private snackBar: MatSnackBar,
              private translate: TranslateService,
              private route: Router) {

    this.createCategoryForm = this.fb.group({
      name: ['', [Validators.required]],
      description: ['', Validators.required]
    })
  }

  onSubmit(){
    if (!this.createCategoryForm.valid){
      return;
    }

    this.isSpinning.set(true);

    const categoryData = {
      name: this.createCategoryForm.get('name')?.value,
      description: this.createCategoryForm.get('description')?.value
    };

    this.adminService.createCategory(categoryData).subscribe({
      next: (response) => {
        this.isSpinning.set(false);
        this.snackBar.open(
          this.translate.instant('createCategory.successMessage'),
          this.translate.instant('createCategory.ok'),
          {duration: 3000}
        );
        this.route.navigateByUrl("/view-categories");
      },
      error: (error) => {
        this.isSpinning.set(false);
        this.snackBar.open(
          this.translate.instant('createCategory.errorMessage'),
          this.translate.instant('createCategory.ok'),
          {duration: 3000}
        );
      }
    })

  }
}

import {Component, signal} from '@angular/core';
import {FormBuilder, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {AdminService} from '../../services/admin/admin.service';
import {ActivatedRoute, Router} from '@angular/router';
import {MatSnackBar} from '@angular/material/snack-bar';
import {MatFormField, MatLabel, MatError} from '@angular/material/form-field';
import {MatInput} from '@angular/material/input';
import {MatButton} from '@angular/material/button';
import {MatProgressSpinner} from '@angular/material/progress-spinner';
import {MatCard, MatCardContent, MatCardHeader, MatCardTitle} from '@angular/material/card';
import {CommonModule} from '@angular/common';


@Component({
  selector: 'app-edit-category',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormField,
    MatInput,
    MatButton,
    MatProgressSpinner,
    MatLabel,
    MatError,
    MatCard,
    MatCardHeader,
    MatCardTitle,
    MatCardContent
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
              private snackBar: MatSnackBar) {
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
        this.snackBar.open("Eroare la încărcarea categoriei!", "Ok", {duration: 3000});
      }
    });
  }

  onSubmit(){
    if (this.updateForm.invalid) {
      this.snackBar.open("Te rog completează toate câmpurile corect!", "Ok", {duration: 3000});
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
        this.snackBar.open("Categoria a fost actualizată cu succes!", "Ok", {duration: 3000});
        // Redirect înapoi la lista de categorii după 1 secundă
        setTimeout(() => {
          this.router.navigate(['/admin/view-categories']);
        }, 1000);
      },
      error: err => {
        this.isLoading.set(false);
        this.snackBar.open("Ceva nu a mers bine! Te rog încearcă din nou!", "Ok", {duration: 3000});
      }
    });
  }

  onCancel() {
    this.router.navigate(['/admin/view-categories']);
  }
}

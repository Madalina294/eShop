import {Component, OnInit, signal} from '@angular/core';
import {AdminService} from '../../services/admin/admin.service';
import {MatSnackBar} from '@angular/material/snack-bar';
import {CommonModule} from '@angular/common';
import {MatButton} from '@angular/material/button';
import {MatCard, MatCardHeader, MatCardTitle, MatCardContent, MatCardActions, MatCardSubtitle} from '@angular/material/card';
import {MatIcon} from '@angular/material/icon';
import {MatProgressSpinner} from '@angular/material/progress-spinner';
import {TranslateModule, TranslateService} from '@ngx-translate/core';
import {ConfirmDeleteComponent} from '../../shared/confirm-delete/confirm-delete.component';
import {MatDialog} from '@angular/material/dialog';

export interface CategoryDto {
  id: number;
  name: string;
  description: string;
}

@Component({
  selector: 'app-view-categories',
  imports: [
    CommonModule,
    MatButton,
    MatCard,
    MatCardHeader,
    MatCardTitle,
    MatCardSubtitle,
    MatCardContent,
    MatCardActions,
    MatIcon,
    MatProgressSpinner,
    TranslateModule
  ],
  templateUrl: './view-categories.component.html',
  styleUrl: './view-categories.component.scss'
})
export class ViewCategoriesComponent implements OnInit{
  isSpinning = signal(false);
  categories = signal<CategoryDto[]>([]);
  loading = signal(false);

  constructor(private adminService: AdminService,
              private snackBar: MatSnackBar,
              private translate: TranslateService,
              private dialog: MatDialog) {
  }
  ngOnInit(){
    this.loadCategories();
  }

  loadCategories(){
    this.isSpinning.set(true);
    this.adminService.getCategories().subscribe({
      next: (response) => {
        this.isSpinning.set(false);
        this.categories.set(response as CategoryDto[]);
      },
      error: err => {
        this.isSpinning.set(false);
        this.snackBar.open(
          this.translate.instant('viewCategories.loadError'),
          this.translate.instant('viewCategories.ok'),
          {duration: 3000}
        );
      }
    })
  }

  deleteCategory(id: number){
    const dialogRef = this.dialog.open(ConfirmDeleteComponent, {
      width: '400px',
      data: { message: this.translate.instant('viewCategories.confirmDelete') }
    });

    dialogRef.afterClosed().subscribe(result => {
      if(result === true){
        this.loading.set(true);
        this.adminService.deleteCategory(id).subscribe({
          next: () => {
            this.loading.set(false);
            this.snackBar.open(this.translate.instant('viewCategories.categoryDeletedSuccess'), this.translate.instant('allUsers.ok'), {duration: 3000});
            this.loadCategories();
          },
          error: () =>{
            this.loading.set(false);
            this.snackBar.open(this.translate.instant('viewCategories.deleteError'), this.translate.instant('allUsers.ok'), {duration: 3000});
          }
        })
      }
    })
  }
}

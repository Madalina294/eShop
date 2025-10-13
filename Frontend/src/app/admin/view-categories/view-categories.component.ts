import {Component, OnInit, signal} from '@angular/core';
import {AdminService} from '../../services/admin/admin.service';
import {MatSnackBar} from '@angular/material/snack-bar';
import {CommonModule} from '@angular/common';
import {MatButton} from '@angular/material/button';
import {MatCard, MatCardHeader, MatCardTitle, MatCardContent, MatCardActions, MatCardSubtitle} from '@angular/material/card';
import {MatIcon} from '@angular/material/icon';
import {MatProgressSpinner} from '@angular/material/progress-spinner';
import {TranslateModule, TranslateService} from '@ngx-translate/core';

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

  constructor(private adminService: AdminService,
              private snackBar: MatSnackBar,
              private translate: TranslateService) {
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
}

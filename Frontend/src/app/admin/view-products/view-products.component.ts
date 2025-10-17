import {Component, Injectable, OnInit, signal} from '@angular/core';
import {MatButton, MatIconButton} from "@angular/material/button";
import {MatCard, MatCardHeader, MatCardSubtitle, MatCardTitle} from "@angular/material/card";
import {Router, RouterLink} from "@angular/router";
import {TranslatePipe, TranslateService} from "@ngx-translate/core";
import {MatIcon} from '@angular/material/icon';
import {NgForOf, NgIf} from '@angular/common';
import {
  AdminService,
  PaginatedResponse,
  ProductData,
  ProductPaginatedResponse
} from '../../services/admin/admin.service';
import {MatSnackBar} from '@angular/material/snack-bar';
import {MatDialog} from '@angular/material/dialog';
import {MatProgressSpinner} from '@angular/material/progress-spinner';
import {MatPaginator, MatPaginatorIntl, PageEvent} from '@angular/material/paginator';
import {MatFormField, MatLabel} from '@angular/material/form-field';
import {MatSelect} from '@angular/material/select';
import {MatOption} from '@angular/material/core';
@Injectable()
export class CustomPaginatorIntl extends MatPaginatorIntl {
  constructor(private translate: TranslateService) {
    super();
    this.translate.onLangChange.subscribe(() => {
      this.getTranslations();
    });
    this.getTranslations();
  }

  getTranslations() {
    this.itemsPerPageLabel = this.translate.instant('viewProducts.paginator.itemsPerPage');
    this.nextPageLabel = this.translate.instant('viewProducts.paginator.nextPage');
    this.previousPageLabel = this.translate.instant('viewProducts.paginator.previousPage');
    this.firstPageLabel = this.translate.instant('viewProducts.paginator.firstPage');
    this.lastPageLabel = this.translate.instant('viewProducts.paginator.lastPage');
    this.changes.next();
  }

  override getRangeLabel = (page: number, pageSize: number, length: number): string => {
    if (length === 0 || pageSize === 0) {
      return this.translate.instant('viewProducts.showing') + ` 0 ` + this.translate.instant('viewProducts.paginator.ofLabel') + ` ${length}`;
    }
    const startIndex = page * pageSize;
    const endIndex = startIndex < length ? Math.min(startIndex + pageSize, length) : startIndex + pageSize;
    return `${startIndex + 1} - ${endIndex} ` + this.translate.instant('viewProducts.paginator.ofLabel') + ` ${length}`;
  };
}
@Component({
  selector: 'app-view-products',
  imports: [
    MatButton,
    MatCard,
    MatCardHeader,
    MatCardSubtitle,
    MatCardTitle,
    MatIcon,
    RouterLink,
    TranslatePipe,
    MatProgressSpinner,
    NgIf,
    MatFormField,
    MatLabel,
    MatOption,
    MatSelect,
    MatIconButton,
    NgForOf,
    MatPaginator
  ],
  templateUrl: './view-products.component.html',
  styleUrl: './view-products.component.scss'
})
export class ViewProductsComponent implements OnInit{
  products = signal<ProductData[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);
  categories = signal<Map<number, string>>(new Map());

  // Pagination properties
  totalElements = signal(0);
  pageSize = signal(10);
  currentPage = signal(0);
  pageSizeOptions = [5, 10, 20, 50];
  sortBy = signal('id');
  sortDir = signal('asc');

  // Make Math available in template
  Math = Math;

  constructor(
    private adminService: AdminService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog,
    private router: Router,
    private translate: TranslateService
  ) {}

  ngOnInit(){
    this.loadCategories();
    this.loadProducts();
  }

  loadCategories() {
    this.adminService.getCategories().subscribe({
      next: (categories: any[]) => {
        const categoryMap = new Map<number, string>();
        categories.forEach(category => {
          categoryMap.set(category.id, category.name);
        });
        this.categories.set(categoryMap);
        console.log('Categories loaded:', categoryMap);
      },
      error: (error) => {
        console.error('Error loading categories:', error);
      }
    });
  }

  loadProducts(){
    this.loading.set(true);
    this.error.set(null);

    this.adminService.getProductsPaginated(
      this.currentPage(),
      this.pageSize(),
      this.sortBy(),
      this.sortDir()
    ).subscribe({
      next: (response: ProductPaginatedResponse) => {
        this.loading.set(false);
        this.products.set(response.content);
        this.totalElements.set(response.totalElements);
        console.log('Products loaded:', this.products());
        console.log('Pagination info:', {
          totalElements: response.totalElements,
          totalPages: response.totalPages,
          currentPage: response.number,
          pageSize: response.size
        });
      },
      error: (error) => {
        console.error('Error loading users:', error);
        this.loading.set(false);
        this.error.set(this.translate.instant('viewProducts.loadError'));
        this.snackBar.open(this.translate.instant('viewProducts.loadError'), this.translate.instant('viewProducts.close'), {
          duration: 3000
        });
      }
    });
  }

  // Pagination methods
  onPageChange(event: PageEvent) {
    this.currentPage.set(event.pageIndex);
    this.pageSize.set(event.pageSize);
    this.loadProducts();
  }

  onSortChange(sortBy: string) {
    this.sortBy.set(sortBy);
    this.currentPage.set(0); // Reset to first page when sorting changes
    this.loadProducts();
  }

  onSortDirectionChange() {
    this.sortDir.set(this.sortDir() === 'asc' ? 'desc' : 'asc');
    this.currentPage.set(0); // Reset to first page when sort direction changes
    this.loadProducts();
  }

  getCategoryName(categoryId: number): string {
    return this.categories().get(categoryId) || 'No Category';
  }
}

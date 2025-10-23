import {Component, Injectable, OnInit, signal} from '@angular/core';
import {UserService} from '../../services/user/user.service';
import {ProductData} from '../../services/admin/admin.service';
import {MatSnackBar} from '@angular/material/snack-bar';
import {MatCard, MatCardContent, MatCardHeader, MatCardSubtitle, MatCardTitle} from '@angular/material/card';
import {MatProgressSpinner} from '@angular/material/progress-spinner';
import {NgForOf, NgIf} from '@angular/common';
import {MatIcon} from '@angular/material/icon';
import {MatPaginator, MatPaginatorIntl, PageEvent} from '@angular/material/paginator';
import {TranslatePipe, TranslateService} from '@ngx-translate/core';
import {MatList, MatListItem} from '@angular/material/list';
import {Router} from '@angular/router';

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
    this.itemsPerPageLabel = this.translate.instant('allProducts.paginator.itemsPerPage');
    this.nextPageLabel = this.translate.instant('allProducts.paginator.nextPage');
    this.previousPageLabel = this.translate.instant('allProducts.paginator.previousPage');
    this.firstPageLabel = this.translate.instant('allProducts.paginator.firstPage');
    this.lastPageLabel = this.translate.instant('allProducts.paginator.lastPage');
    this.changes.next();
  }

  override getRangeLabel = (page: number, pageSize: number, length: number): string => {
    if (length === 0 || pageSize === 0) {
      return this.translate.instant('allProducts.showing') + ` 0 ` + this.translate.instant('allProducts.paginator.ofLabel') + ` ${length}`;
    }
    const startIndex = page * pageSize;
    const endIndex = startIndex < length ? Math.min(startIndex + pageSize, length) : startIndex + pageSize;
    return `${startIndex + 1} - ${endIndex} ` + this.translate.instant('allProducts.paginator.ofLabel') + ` ${length}`;
  };
}

@Component({
  selector: 'app-all-products',
  imports: [
    MatCard,
    MatCardHeader,
    MatCardTitle,
    MatCardSubtitle,
    MatCardContent,
    MatProgressSpinner,
    NgIf,
    MatIcon,
    MatPaginator,
    NgForOf,
    TranslatePipe,
    MatList,
    MatListItem
  ],
  templateUrl: './all-products.component.html',
  styleUrl: './all-products.component.scss'
})
export class AllProductsComponent implements OnInit{

  loading = signal(false);
  products = signal<ProductData[]>([]);
  categories = signal<any[]>([]);
  selectedCategoryId = signal<number | null>(null);

  // Pagination properties
  totalElements = signal(0);
  pageSize = signal(12);
  currentPage = signal(0);
  pageSizeOptions = [6, 12, 24, 48];
  sortBy = signal('id');
  sortDir = signal('asc');

  // Make Math available in template
  Math = Math;

  constructor(
    private userService: UserService,
    private snackBar: MatSnackBar,
    private translate: TranslateService,
    private router: Router
  ) {}

  ngOnInit() {
    this.loadCategories();
    this.loadProducts();
  }

  loadCategories() {
    this.userService.getCategories().subscribe({
      next: (categories: any[]) => {
        this.categories.set(categories);
        console.log('Categories loaded:', categories);
      },
      error: (error) => {
        console.error('Error loading categories:', error);
      }
    });
  }

  loadProducts(){
    this.loading.set(true);

    this.userService.getProductsPaginated(
      this.currentPage(),
      this.pageSize(),
      this.sortBy(),
      this.sortDir(),
      this.selectedCategoryId() || undefined
    ).subscribe({
      next: (response: any) => {
        this.loading.set(false);
        this.products.set(response.content);
        this.totalElements.set(response.totalElements);
        console.log('Products loaded:', response);
      },
      error: err => {
        this.loading.set(false);
        this.snackBar.open(
          this.translate.instant('allProducts.loadError'),
          this.translate.instant('allProducts.ok'),
          {duration: 3000}
        );
      }
    })
  }

  // Pagination methods
  onPageChange(event: PageEvent) {
    this.currentPage.set(event.pageIndex);
    this.pageSize.set(event.pageSize);
    this.loadProducts();
  }

  // Category filter
  onCategorySelect(categoryId: number | null) {
    this.selectedCategoryId.set(categoryId);
    this.currentPage.set(0); // Reset to first page when category changes
    this.loadProducts();
  }

  getCategoryName(categoryId: number): string {
    const category = this.categories().find(c => c.id === categoryId);
    return category ? category.name : 'No Category';
  }

  getProductImage(product: ProductData): string {
    if (product.image) {
      // Verifică dacă path-ul începe deja cu /
      if (product.image.startsWith('/')) {
        return `http://localhost:8080${product.image}`;
      }
      return `http://localhost:8080/${product.image}`;
    }
    return 'user.png';
  }

  goToViewProduct(id: number) {
    this.router.navigate(["/user/view-product"], {
      queryParams: {
        id: id
      }
    });
  }
}

import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatPaginatorIntl, MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatSelectModule } from '@angular/material/select';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

import { UserService } from '../../services/user/user.service';
import { NotificationService } from '../../shared/notification/notification.service';
import { CartStateService } from '../../shared/state/cart-state.service';
import { TranslatedPaginatorIntl } from '../../shared/paginator/translated-paginator-intl';
import { PageHeaderComponent } from '../../shared/ui/page-header/page-header.component';
import { ProductCardComponent } from '../../shared/ui/product-card/product-card.component';
import { LoadingStateComponent } from '../../shared/ui/loading-state/loading-state.component';
import { EmptyStateComponent } from '../../shared/ui/empty-state/empty-state.component';
import { ErrorStateComponent } from '../../shared/ui/error-state/error-state.component';
import { Category, Page, Product } from '../../models/product';
import { ViewState } from '../../models/ui-state';

/** `sortBy`/`sortDir` pairs the backend understands, behind one select value. */
const SORT_OPTIONS = [
  { value: 'newest', label: 'allProducts.sortNewest', sortBy: 'id', sortDir: 'desc' },
  { value: 'name-asc', label: 'allProducts.sortNameAsc', sortBy: 'name', sortDir: 'asc' },
  { value: 'name-desc', label: 'allProducts.sortNameDesc', sortBy: 'name', sortDir: 'desc' },
  { value: 'price-asc', label: 'allProducts.sortPriceAsc', sortBy: 'price', sortDir: 'asc' },
  { value: 'price-desc', label: 'allProducts.sortPriceDesc', sortBy: 'price', sortDir: 'desc' },
] as const;

type SortValue = (typeof SORT_OPTIONS)[number]['value'];

const DEFAULT_SORT: SortValue = 'newest';
const PAGE_SIZE_OPTIONS = [12, 24, 48];
const DEFAULT_PAGE_SIZE = 12;

@Component({
  selector: 'app-all-products',
  standalone: true,
  imports: [
    MatButtonModule,
    MatChipsModule,
    MatFormFieldModule,
    MatIconModule,
    MatPaginatorModule,
    MatSelectModule,
    TranslateModule,
    PageHeaderComponent,
    ProductCardComponent,
    LoadingStateComponent,
    EmptyStateComponent,
    ErrorStateComponent,
  ],
  // The duplicated copies of this class were never registered, so the
  // paginator silently stayed in English.
  providers: [{ provide: MatPaginatorIntl, useClass: TranslatedPaginatorIntl }],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './all-products.component.html',
  styleUrl: './all-products.component.scss',
})
export class AllProductsComponent {
  private readonly userService = inject(UserService);
  private readonly notifications = inject(NotificationService);
  private readonly translate = inject(TranslateService);
  private readonly cartState = inject(CartStateService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  protected readonly sortOptions = SORT_OPTIONS;
  protected readonly pageSizeOptions = PAGE_SIZE_OPTIONS;

  protected readonly state = signal<ViewState>('loading');
  protected readonly products = signal<Product[]>([]);
  protected readonly categories = signal<Category[]>([]);
  protected readonly totalElements = signal(0);
  protected readonly wishlistIds = signal<ReadonlySet<number>>(new Set());
  protected readonly filtersOpen = signal(false);

  /**
   * All view state lives in the URL, so a filtered or searched catalogue is a
   * shareable link and survives a reload or the browser's back button.
   */
  private readonly params = toSignal(this.route.queryParams, { initialValue: {} as Params });

  protected readonly searchTerm = computed(() => String(this.params()['q'] ?? '').trim());
  protected readonly categoryId = computed(() => {
    const raw = this.params()['category'];
    const parsed = Number(raw);
    return raw != null && Number.isFinite(parsed) ? parsed : null;
  });
  protected readonly sort = computed<SortValue>(() => {
    const raw = String(this.params()['sort'] ?? '');
    return SORT_OPTIONS.some(o => o.value === raw) ? (raw as SortValue) : DEFAULT_SORT;
  });
  protected readonly pageIndex = computed(() => Math.max(0, Number(this.params()['page'] ?? 0) || 0));
  protected readonly pageSize = computed(() => {
    const raw = Number(this.params()['size'] ?? DEFAULT_PAGE_SIZE);
    return PAGE_SIZE_OPTIONS.includes(raw) ? raw : DEFAULT_PAGE_SIZE;
  });

  protected readonly isSearching = computed(() => this.searchTerm().length > 0);
  protected readonly hasActiveFilters = computed(
    () => this.isSearching() || this.categoryId() !== null || this.sort() !== DEFAULT_SORT
  );

  protected readonly categoryNames = computed(() => {
    const map = new Map<number, string>();
    for (const category of this.categories()) map.set(category.id, category.name);
    return map;
  });

  protected readonly resultsLabel = computed(() => {
    const count = this.totalElements();
    return count === 1
      ? this.translate.instant('allProducts.resultsOne')
      : this.translate.instant('allProducts.resultsMany', { count });
  });

  constructor() {
    this.loadCategories();
    this.loadWishlist();

    // Any URL change — filter, sort, page, search — reloads the catalogue.
    // `effect` is not used here because the fetch is an explicit side effect
    // keyed on the parsed params rather than derived state.
    this.route.queryParams.pipe(takeUntilDestroyed()).subscribe(() => this.loadProducts());
  }

  protected reload(): void {
    this.loadProducts();
  }

  protected onCategorySelect(categoryId: number | null): void {
    this.patchParams({ category: categoryId, page: null });
    this.filtersOpen.set(false);
  }

  protected onSortChange(value: SortValue): void {
    this.patchParams({ sort: value === DEFAULT_SORT ? null : value, page: null });
  }

  protected onPageChange(event: PageEvent): void {
    this.patchParams({
      page: event.pageIndex === 0 ? null : event.pageIndex,
      size: event.pageSize === DEFAULT_PAGE_SIZE ? null : event.pageSize,
    });
  }

  protected clearFilters(): void {
    this.router.navigate([], { relativeTo: this.route, queryParams: {} });
  }

  protected toggleFilters(): void {
    this.filtersOpen.update(open => !open);
  }

  protected addToCart(product: Product): void {
    this.userService.addToCart(product.id, 1).subscribe({
      next: () => {
        this.cartState.optimisticCartAdd(1);
        this.notifications.success('product.addedToCart');
      },
      // The error interceptor already reports the failure.
      error: () => undefined,
    });
  }

  protected toggleWishlist(product: Product): void {
    const inWishlist = this.wishlistIds().has(product.id);

    const request = inWishlist
      ? this.userService.removeFromWishlist(product.id)
      : this.userService.addToWishlist(product.id);

    request.subscribe({
      next: () => {
        this.wishlistIds.update(ids => {
          const next = new Set(ids);
          if (inWishlist) next.delete(product.id);
          else next.add(product.id);
          return next;
        });

        if (inWishlist) {
          this.cartState.optimisticWishlistRemove();
          this.notifications.success('product.removedFromWishlist');
        } else {
          this.cartState.optimisticWishlistAdd();
          this.notifications.success('product.addedToWishlist');
        }
      },
      error: () => undefined,
    });
  }

  protected categoryName(categoryId: number): string {
    return this.categoryNames().get(categoryId) ?? '';
  }

  // --- Data ------------------------------------------------------------------

  private loadProducts(): void {
    this.state.set('loading');

    // The backend has no search endpoint, so a search reads the full catalogue
    // once and filters, sorts and paginates in memory. Browsing still uses
    // server-side pagination.
    if (this.isSearching()) {
      this.loadSearchResults();
      return;
    }

    const { sortBy, sortDir } = this.resolveSort();

    this.userService
      .getProductsPaginated(
        this.pageIndex(),
        this.pageSize(),
        sortBy,
        sortDir,
        this.categoryId() ?? undefined
      )
      .subscribe({
        next: (response: Page<Product>) => {
          this.products.set(response.content ?? []);
          this.totalElements.set(response.totalElements ?? 0);
          this.state.set(response.content?.length ? 'ready' : 'empty');
        },
        error: () => this.state.set('error'),
      });
  }

  private loadSearchResults(): void {
    const term = this.searchTerm().toLocaleLowerCase();
    const category = this.categoryId();

    this.userService.getAllProducts().subscribe({
      next: (all: Product[]) => {
        const matches = (all ?? [])
          .filter(product => category === null || product.categoryId === category)
          .filter(product => this.matchesTerm(product, term));

        this.totalElements.set(matches.length);

        const sorted = this.sortInMemory(matches);
        const start = this.pageIndex() * this.pageSize();

        this.products.set(sorted.slice(start, start + this.pageSize()));
        this.state.set(matches.length ? 'ready' : 'empty');
      },
      error: () => this.state.set('error'),
    });
  }

  private matchesTerm(product: Product, term: string): boolean {
    const haystack = [product.name, product.description, this.categoryName(product.categoryId)]
      .filter(Boolean)
      .join(' ')
      .toLocaleLowerCase();

    // Every word must appear, so "blue chair" does not match a red chair.
    return term.split(/\s+/).every(word => haystack.includes(word));
  }

  private sortInMemory(products: Product[]): Product[] {
    const { sortBy, sortDir } = this.resolveSort();
    const direction = sortDir === 'desc' ? -1 : 1;

    return [...products].sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name) * direction;
        case 'price':
          return (a.price - b.price) * direction;
        default:
          return (a.id - b.id) * direction;
      }
    });
  }

  private resolveSort(): { sortBy: string; sortDir: string } {
    const option = SORT_OPTIONS.find(o => o.value === this.sort()) ?? SORT_OPTIONS[0];
    return { sortBy: option.sortBy, sortDir: option.sortDir };
  }

  private loadCategories(): void {
    this.userService.getCategories().subscribe({
      next: (categories: Category[]) => this.categories.set(categories ?? []),
      // Losing the category list only costs us the filter, not the page.
      error: () => this.categories.set([]),
    });
  }

  private loadWishlist(): void {
    this.userService.getUserWishlist().subscribe({
      next: items =>
        this.wishlistIds.set(new Set((items ?? []).map(item => item.productId ?? item.id))),
      error: () => this.wishlistIds.set(new Set()),
    });
  }

  /** Merges into the existing query params and drops the nulls. */
  private patchParams(changes: Record<string, string | number | null>): void {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: changes,
      queryParamsHandling: 'merge',
    });
  }
}

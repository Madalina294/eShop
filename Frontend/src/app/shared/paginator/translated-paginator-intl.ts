import { DestroyRef, Injectable, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatPaginatorIntl } from '@angular/material/paginator';
import { TranslateService } from '@ngx-translate/core';

/**
 * Translated `mat-paginator` labels.
 *
 * This logic existed twice, copy-pasted verbatim into `all-products` and
 * `view-products`, and neither copy was ever registered as a provider — so the
 * paginators kept showing the English defaults. Register it per component:
 *
 *   providers: [{ provide: MatPaginatorIntl, useClass: TranslatedPaginatorIntl }]
 */
@Injectable()
export class TranslatedPaginatorIntl extends MatPaginatorIntl {
  private readonly translate = inject(TranslateService);
  private readonly destroyRef = inject(DestroyRef);

  constructor() {
    super();

    this.applyLabels();
    this.translate.onLangChange
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.applyLabels());
  }

  override getRangeLabel = (page: number, pageSize: number, length: number): string => {
    const of = this.translate.instant('paginator.of');

    if (length === 0 || pageSize === 0) {
      return `0 ${of} ${length}`;
    }

    const start = page * pageSize;
    const end = Math.min(start + pageSize, length);
    return `${start + 1} – ${end} ${of} ${length}`;
  };

  private applyLabels(): void {
    this.itemsPerPageLabel = this.translate.instant('paginator.itemsPerPage');
    this.nextPageLabel = this.translate.instant('paginator.nextPage');
    this.previousPageLabel = this.translate.instant('paginator.previousPage');
    this.firstPageLabel = this.translate.instant('paginator.firstPage');
    this.lastPageLabel = this.translate.instant('paginator.lastPage');
    this.changes.next();
  }
}

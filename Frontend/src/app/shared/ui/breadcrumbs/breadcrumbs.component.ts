import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule } from '@ngx-translate/core';

export interface Crumb {
  /** Already-resolved text — the caller translates, so this stays dumb. */
  readonly label: string;
  readonly link?: unknown[] | string;
  readonly queryParams?: Record<string, string | number>;
}

/**
 * An explicit breadcrumb trail, built from items the page supplies.
 *
 * Complements `shared/breadcrumb`, which derives crumbs from URL segments and
 * only has labels for admin routes — that one cannot express a product name or
 * a category, which are data rather than route segments.
 */
@Component({
  selector: 'app-breadcrumbs',
  standalone: true,
  imports: [RouterLink, MatIconModule, TranslateModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './breadcrumbs.component.html',
  styleUrl: './breadcrumbs.component.scss',
})
export class BreadcrumbsComponent {
  readonly items = input.required<readonly Crumb[]>();
}

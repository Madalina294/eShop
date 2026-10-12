import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

/**
 * The page title block, previously re-implemented as a `mat-card` with an
 * avatar in ~8 pages. Projects actions into the trailing slot:
 *
 * <app-page-header icon="shopping_bag" title="..." subtitle="...">
 *   <button mat-flat-button>New</button>
 * </app-page-header>
 */
@Component({
  selector: 'app-page-header',
  standalone: true,
  imports: [MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './page-header.component.html',
  styleUrl: './page-header.component.scss',
})
export class PageHeaderComponent {
  readonly icon = input<string>('');
  readonly title = input.required<string>();
  readonly subtitle = input<string>('');
  /** `h1` for the main page title, `h2` when nested under one. */
  readonly level = input<'h1' | 'h2'>('h1');
}

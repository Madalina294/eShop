import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

/**
 * Loading feedback, in two flavours:
 *
 * - `variant="spinner"` — centred spinner, for forms and detail pages.
 * - `variant="grid"` / `"list"` / `"table"` — skeleton placeholders that keep
 *   the page height stable instead of collapsing and then reflowing, which is
 *   what the hand-rolled spinner in 10+ pages used to do.
 */
@Component({
  selector: 'app-loading-state',
  standalone: true,
  imports: [MatProgressSpinnerModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './loading-state.component.html',
  styleUrl: './loading-state.component.scss',
})
export class LoadingStateComponent {
  readonly variant = input<'spinner' | 'grid' | 'list' | 'table'>('spinner');
  readonly count = input<number>(8);
  /** Announced to screen readers; also shown under the spinner. */
  readonly label = input<string>('');

  protected readonly placeholders = computed(() =>
    Array.from({ length: this.count() }, (_, i) => i)
  );
}

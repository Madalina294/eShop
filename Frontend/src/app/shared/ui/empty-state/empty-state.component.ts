import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

/**
 * Shown when a list loaded successfully but has nothing in it.
 * Replaces `.no-products`, `.empty-wishlist`, `.no-users` and friends.
 */
@Component({
  selector: 'app-empty-state',
  standalone: true,
  imports: [MatButtonModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './empty-state.component.html',
  styleUrl: './empty-state.component.scss',
})
export class EmptyStateComponent {
  readonly icon = input<string>('inbox');
  readonly title = input.required<string>();
  readonly description = input<string>('');
  /** Omit to render no call to action. */
  readonly actionLabel = input<string>('');
  readonly actionIcon = input<string>('');

  readonly action = output<void>();
}

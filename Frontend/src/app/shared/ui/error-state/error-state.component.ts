import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

/**
 * Shown when a request failed. The app had no such state before: a network
 * error looked exactly like an empty catalog, with only a 3-second toast.
 */
@Component({
  selector: 'app-error-state',
  standalone: true,
  imports: [MatButtonModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './error-state.component.html',
  styleUrl: './error-state.component.scss',
})
export class ErrorStateComponent {
  readonly title = input.required<string>();
  readonly description = input<string>('');
  readonly retryLabel = input<string>('');

  readonly retry = output<void>();
}

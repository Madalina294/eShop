import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';

export type StatTone = 'brand' | 'success' | 'warning' | 'error' | 'info' | 'neutral';

/**
 * A single KPI tile for the admin dashboard and the statistics page.
 * Becomes a link when `link` is set, so dashboard tiles are navigable.
 */
@Component({
  selector: 'app-stat-card',
  standalone: true,
  imports: [NgTemplateOutlet, MatIconModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './stat-card.component.html',
  styleUrl: './stat-card.component.scss',
})
export class StatCardComponent {
  readonly label = input.required<string>();
  /** Pre-formatted by the caller (currency/number pipe), so the tile stays dumb. */
  readonly value = input.required<string | number>();
  readonly icon = input<string>('insights');
  readonly tone = input<StatTone>('brand');
  readonly hint = input<string>('');
  readonly link = input<unknown[] | string | null>(null);
}

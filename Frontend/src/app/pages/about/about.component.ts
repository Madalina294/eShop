import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule } from '@ngx-translate/core';

import { PageHeaderComponent } from '../../shared/ui/page-header/page-header.component';

interface Value {
  readonly icon: string;
  readonly title: string;
  readonly text: string;
}

interface Stat {
  readonly icon: string;
  readonly value: string;
  readonly label: string;
}

/**
 * Static "About us" page. All copy is fictional and lives in the translation
 * bundles, so the two locales stay in step.
 */
const VALUES: readonly Value[] = [
  { icon: 'eco', title: 'about.values.curated.title', text: 'about.values.curated.text' },
  { icon: 'handshake', title: 'about.values.fair.title', text: 'about.values.fair.text' },
  { icon: 'local_shipping', title: 'about.values.delivery.title', text: 'about.values.delivery.text' },
  { icon: 'support_agent', title: 'about.values.support.title', text: 'about.values.support.text' },
];

const STATS: readonly Stat[] = [
  { icon: 'inventory_2', value: '4.200+', label: 'about.stats.products' },
  { icon: 'group', value: '38.000+', label: 'about.stats.customers' },
  { icon: 'local_shipping', value: '2–3', label: 'about.stats.delivery' },
  { icon: 'star', value: '4,8/5', label: 'about.stats.rating' },
];

@Component({
  selector: 'app-about',
  standalone: true,
  imports: [RouterLink, MatButtonModule, MatIconModule, TranslateModule, PageHeaderComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './about.component.html',
  styleUrl: './about.component.scss',
})
export class AboutComponent {
  protected readonly values = VALUES;
  protected readonly stats = STATS;
  protected readonly year = new Date().getFullYear();
}

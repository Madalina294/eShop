import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule } from '@ngx-translate/core';

import { NavItem } from '../nav-item';

/**
 * The narrow-screen navigation drawer.
 *
 * Split out of `AppHeaderComponent`, which was carrying the toolbar and the
 * drawer in one template and one stylesheet — two unrelated layouts sharing a
 * per-component style budget, so routine work on the toolbar kept pushing the
 * file over it. The parent still owns the open/closed state and only renders
 * this when the drawer is open.
 */
@Component({
  selector: 'app-mobile-nav',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, MatDividerModule, MatIconModule, TranslateModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './mobile-nav.component.html',
  styleUrl: './mobile-nav.component.scss',
})
export class MobileNavComponent {
  readonly items = input.required<readonly NavItem[]>();

  readonly dismiss = output<void>();
  readonly signOut = output<void>();
}

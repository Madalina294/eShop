import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { filter, map, startWith } from 'rxjs';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TranslateModule } from '@ngx-translate/core';

import { NavItem } from '../../shared/layout/nav-item';

const STORAGE_KEY = 'admin.sidebar.collapsed';

const ADMIN_NAV: readonly NavItem[] = [
  { label: 'header.dashboardAdmin', link: '/admin/dashboard', icon: 'dashboard' },
  { label: 'viewProducts.title', link: '/admin/view-products', icon: 'inventory_2' },
  { label: 'viewCategories.title', link: '/admin/view-categories', icon: 'category' },
  { label: 'header.manageUsers', link: '/admin/all-users', icon: 'supervisor_account' },
  { label: 'adminStatistics.title', link: '/admin/statistics', icon: 'insights' },
  { label: 'activityLogs.title', link: '/admin/activity-logs', icon: 'history' },
  { label: 'sendEmail.title', link: '/admin/send-email', icon: 'mail' },
];

/**
 * Shell for every `/admin` page: a collapsible sidebar plus the routed outlet.
 *
 * The admin area previously had no shell at all — each page reached for the
 * global header, which carried a duplicate copy of this navigation.
 */
@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    MatIconModule,
    MatTooltipModule,
    TranslateModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './admin-layout.component.html',
  styleUrl: './admin-layout.component.scss',
  host: {
    '[class.is-collapsed]': 'collapsed()',
  },
})
export class AdminLayoutComponent {
  private readonly router = inject(Router);

  protected readonly navItems = ADMIN_NAV;

  /** Desktop preference, remembered across visits. */
  protected readonly collapsed = signal(readStoredCollapsed());

  /** Mobile off-canvas state — separate, because it must not persist. */
  protected readonly drawerOpen = signal(false);

  private readonly url = toSignal(
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd),
      map(() => this.router.url),
      startWith(this.router.url)
    ),
    { initialValue: this.router.url }
  );

  /** Label for the current page, shown in the mobile top bar. */
  protected readonly currentLabel = computed(() => {
    const url = this.url();
    return ADMIN_NAV.find(item => url.startsWith(item.link))?.label ?? 'header.adminPanel';
  });

  protected toggleCollapsed(): void {
    const next = !this.collapsed();
    this.collapsed.set(next);

    try {
      localStorage.setItem(STORAGE_KEY, String(next));
    } catch {
      // Private mode or blocked storage: the preference simply does not stick.
    }
  }

  protected toggleDrawer(): void {
    this.drawerOpen.set(!this.drawerOpen());
  }

  protected closeDrawer(): void {
    this.drawerOpen.set(false);
  }
}

function readStoredCollapsed(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === 'true';
  } catch {
    return false;
  }
}

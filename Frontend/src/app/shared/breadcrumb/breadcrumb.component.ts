import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, NavigationEnd, ActivatedRoute, RouterModule } from '@angular/router';
import { MatIcon } from '@angular/material/icon';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { filter } from 'rxjs/operators';

interface BreadcrumbItem {
  label: string;
  url: string;
  active: boolean;
}

@Component({
  selector: 'app-breadcrumb',
  standalone: true,
  imports: [CommonModule, RouterModule, MatIcon, TranslateModule],
  templateUrl: './breadcrumb.component.html',
  styleUrl: './breadcrumb.component.scss'
})
export class BreadcrumbComponent implements OnInit {
  breadcrumbs: BreadcrumbItem[] = [];

  private routeLabels: { [key: string]: string } = {
    'admin': 'breadcrumb.adminDashboard',
    'dashboard': 'breadcrumb.dashboard',
    'all-users': 'breadcrumb.manageUsers',
    'statistics': 'breadcrumb.statistics',
    'settings': 'breadcrumb.settings',
    'activity-logs': 'breadcrumb.activityLogs',
    'create-category': 'breadcrumb.createCategory',
    'edit-category': 'breadcrumb.editCategory',
    'view-categories': 'breadcrumb.viewCategories',
    'send-email': 'breadcrumb.sendEmail',
    'view-user-account': 'breadcrumb.viewUserAccount'
  };

  constructor(
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private translate: TranslateService
  ) {}

  ngOnInit() {
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe(() => {
        this.buildBreadcrumbs();
      });

    // Construiește breadcrumbs la inițializare
    this.buildBreadcrumbs();

    // Ascultă schimbările de limbă
    this.translate.onLangChange.subscribe(() => {
      this.buildBreadcrumbs();
    });
  }

  private buildBreadcrumbs() {
    const url = this.router.url;
    // Elimină query parameters și fragment din URL pentru a obține doar path-ul
    const cleanUrl = url.split('?')[0].split('#')[0];
    const urlSegments = cleanUrl.split('/').filter(segment => segment);

    this.breadcrumbs = [];

    // Adaugă Home doar dacă nu suntem pe pagina principală
    if (urlSegments.length > 0) {
      this.breadcrumbs.push({
        label: this.translate.instant('breadcrumb.home'),
        url: '/welcome',
        active: false
      });
    }

    let currentPath = '';

    urlSegments.forEach((segment, index) => {
      currentPath += `/${segment}`;
      const isLast = index === urlSegments.length - 1;

      const labelKey = this.routeLabels[segment];
      const label = labelKey ? this.translate.instant(labelKey) : this.formatLabel(segment);
      
      this.breadcrumbs.push({
        label: label,
        url: currentPath,
        active: isLast
      });
    });
  }

  private formatLabel(segment: string): string {
    return segment
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }
}

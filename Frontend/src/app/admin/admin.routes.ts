import { Routes } from '@angular/router';
import { adminGuard } from '../auth/guard/admin.guard';
import { AdminLayoutComponent } from './admin-layout/admin-layout.component';

/**
 * Admin area routes.
 *
 * Replaces `admin.module.ts` + `admin-routing.module.ts`: the NgModule declared
 * nothing (every component is standalone) and referenced each component
 * eagerly, so opening any admin page pulled in all twelve. The guard now sits
 * once on the shell route instead of being repeated on every child.
 */
export const ADMIN_ROUTES: Routes = [
  {
    path: '',
    component: AdminLayoutComponent,
    canActivate: [adminGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      {
        path: 'dashboard',
        title: 'adminDashboard.title',
        loadComponent: () =>
          import('./admin-dashboard/admin-dashboard.component').then(m => m.AdminDashboardComponent),
      },
      {
        path: 'all-users',
        title: 'allUsers.title',
        loadComponent: () =>
          import('./all-users/all-users.component').then(m => m.AllUsersComponent),
      },
      {
        path: 'send-email',
        title: 'sendEmail.title',
        loadComponent: () =>
          import('./send-email/send-email.component').then(m => m.SendEmailComponent),
      },
      {
        path: 'view-categories',
        title: 'viewCategories.title',
        loadComponent: () =>
          import('./view-categories/view-categories.component').then(m => m.ViewCategoriesComponent),
      },
      {
        path: 'create-category',
        title: 'createCategory.title',
        loadComponent: () =>
          import('./create-category/create-category.component').then(m => m.CreateCategoryComponent),
      },
      {
        path: 'edit-category',
        title: 'editCategory.title',
        loadComponent: () =>
          import('./edit-category/edit-category.component').then(m => m.EditCategoryComponent),
      },
      {
        path: 'view-products',
        title: 'viewProducts.title',
        loadComponent: () =>
          import('./view-products/view-products.component').then(m => m.ViewProductsComponent),
      },
      {
        path: 'add-product',
        title: 'createProduct.title',
        loadComponent: () =>
          import('./add-product/add-product.component').then(m => m.AddProductComponent),
      },
      {
        path: 'edit-product',
        title: 'editProduct.title',
        loadComponent: () =>
          import('./edit-product/edit-product.component').then(m => m.EditProductComponent),
      },
      {
        path: 'view-user-account',
        title: 'viewUserAccount.title',
        loadComponent: () =>
          import('./view-user-account/view-user-account.component').then(
            m => m.ViewUserAccountComponent
          ),
      },
      {
        path: 'statistics',
        title: 'adminStatistics.title',
        loadComponent: () =>
          import('./statistics/statistics.component').then(m => m.StatisticsComponent),
      },
      {
        path: 'activity-logs',
        title: 'activityLogs.title',
        loadComponent: () =>
          import('./activity-logs/activity-logs.component').then(m => m.ActivityLogsComponent),
      },
    ],
  },
];

import { Routes } from '@angular/router';
import { authGuard } from './auth/guard/auth.guard';

/**
 * Root routes.
 *
 * Every page is lazy-loaded via `loadComponent` so the login screen no longer
 * ships the profile, preferences and password pages with it. `title` holds a
 * translation key, resolved by `TranslatedTitleStrategy`.
 */
export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },

  {
    path: 'login',
    title: 'titles.login',
    loadComponent: () => import('./auth/login/login.component').then(m => m.LoginComponent),
  },
  {
    path: 'register',
    title: 'titles.register',
    loadComponent: () => import('./auth/register/register.component').then(m => m.RegisterComponent),
  },
  {
    path: 'oauth-callback',
    loadComponent: () =>
      import('./auth/oauth-callback/oauth-callback.component').then(m => m.OAuthCallbackComponent),
  },
  {
    path: 'reset-password',
    title: 'titles.resetPassword',
    loadComponent: () =>
      import('./pages/reset-password/reset-password.component').then(m => m.ResetPasswordComponent),
  },
  {
    path: 'enter-email',
    title: 'titles.enterEmail',
    loadComponent: () =>
      import('./pages/enter-email/enter-email.component').then(m => m.EnterEmailComponent),
  },

  {
    path: 'welcome',
    title: 'titles.welcome',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/welcome/welcome.component').then(m => m.WelcomeComponent),
  },
  {
    path: 'profile',
    title: 'titles.profile',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/profile/profile.component').then(m => m.ProfileComponent),
  },
  {
    path: 'update-password',
    title: 'titles.updatePassword',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./pages/update-password/update-password.component').then(m => m.UpdatePasswordComponent),
  },
  {
    path: 'edit-preferences',
    title: 'titles.preferences',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./pages/edit-preferences/edit-preferences.component').then(m => m.EditPreferencesComponent),
  },

  {
    path: 'admin',
    loadChildren: () => import('./admin/admin.module').then(m => m.AdminModule),
  },
  {
    path: 'user',
    loadChildren: () => import('./user/user.module').then(m => m.UserModule),
  },

  {
    path: '**',
    title: 'titles.notFound',
    loadComponent: () => import('./pages/not-found/not-found.component').then(m => m.NotFoundComponent),
  },
];

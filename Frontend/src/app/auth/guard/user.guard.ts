import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { UserStateService } from '../../services/user-state/user-state.service';

export const userGuard: CanActivateFn = (route, state) => {
  const userStateService = inject(UserStateService);
  const router = inject(Router);

  console.log('=== DEBUG: userGuard ===');
  console.log('User role:', userStateService.userRole());
  console.log('Is customer:', userStateService.isCustomer());
  console.log('User data:', userStateService.user());
  console.log('=== END DEBUG ===');

  // Verifică dacă utilizatorul este customer (USER)
  if (userStateService.isCustomer()) {
    return true;
  }

  // Dacă nu este user, redirecționează către login
  router.navigate(['/login'], {
    queryParams: { returnUrl: state.url }
  });
  return false;
};

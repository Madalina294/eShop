import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { UserStateService } from '../../services/user-state/user-state.service';

export const userGuard: CanActivateFn = (route, state) => {
  const userStateService = inject(UserStateService);
  const router = inject(Router);


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

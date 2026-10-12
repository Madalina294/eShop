import {CanActivateFn, Router} from '@angular/router';
import {inject} from '@angular/core';
import {StorageService} from '../../services/storage/storage.service';

export const authGuard: CanActivateFn = () => {
  const router = inject(Router);
  
  // Verifică dacă suntem în browser (nu în SSR)
  if (typeof window !== 'undefined' && window.localStorage) {
    const token = StorageService.getToken();
    if(!token){
      router.navigate(['login']);
      return false;
    }
    return true;
  }
  
  // Dacă suntem în SSR, permite accesul temporar
  return true;
};

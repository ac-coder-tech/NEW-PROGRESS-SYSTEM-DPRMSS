import { inject } from '@angular/core';
import { CanActivateFn, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { AuthService } from '../services/auth.service';

export function roleGuard(allowedRoles: string[]): CanActivateFn {
  return (route: ActivatedRouteSnapshot, state: RouterStateSnapshot) => {
    const auth = inject(AuthService);
    const router = inject(Router);
    const role = auth.getStaffRole().toLowerCase();

    if (allowedRoles.includes(role)) {
      return true;
    }

    if (role === 'admin') router.navigate(['/manage-staff']);
    else if (role === 'doctor') router.navigate(['/doctor-dashboard']);
    else router.navigate(['/dashboard']);

    return false;
  };
}
import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../../features/auth/auth.service';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (!authService.isAuthenticated()) {
    return router.createUrlTree(['/login']);
  }

  const allowedRoles = route.data?.['roles'] as string[];
  if (allowedRoles && allowedRoles.length > 0) {
    const userRole = authService.getCurrentUserRole();
    if (!userRole || !allowedRoles.includes(userRole.toUpperCase())) {
      // If the user's role is not authorized, redirect them to dashboard
      return router.createUrlTree(['/dashboard']);
    }
  }

  return true;
};

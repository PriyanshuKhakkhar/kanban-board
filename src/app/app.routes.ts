import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { guestGuard } from './core/guards/guest.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./features/landing/landing.component').then(
        m => m.LandingComponent
      )
  },
  {
    path: 'login',
    canActivate: [guestGuard],
    loadComponent: () =>
      import('./features/auth/login/login.component')
        .then(m => m.LoginComponent)
  },
  {
    path: 'dashboard',
    canActivate: [authGuard],
    data: { roles: ['ADMIN', 'HR', 'USER'] },
    loadComponent: () =>
      import('./features/dashboard/dashboard/dashboard.component')
        .then(m => m.DashboardComponent)
  },
  {
    path: 'boards',
    canActivate: [authGuard],
    data: { roles: ['ADMIN', 'HR'] },
    loadComponent: () =>
      import('./features/boards/boards.component').then(
        m => m.BoardsComponent
      )
  },
  {
    path: 'register',
    canActivate: [guestGuard],
    loadComponent: () =>
      import('./features/auth/register/register.component')
        .then(m => m.RegisterComponent)
  }
];
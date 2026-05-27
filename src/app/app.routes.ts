import { Routes } from '@angular/router';

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
    loadComponent: () =>
      import('./features/auth/login/login.component')
        .then(m => m.LoginComponent)
  },
  {
    path: 'dashboard',
    loadComponent: () =>
      import('./features/dashboard/dashboard/dashboard.component')
        .then(m => m.DashboardComponent)
  },
  {
    path: 'board',
    loadComponent: () =>
      import('./features/board/kanban-board/kanban-board.component')
        .then(m => m.KanbanBoardComponent)
  }
];
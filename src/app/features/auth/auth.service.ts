import { Injectable } from '@angular/core';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  constructor(private router: Router) {}

  login(email: string, password: string): boolean {

    if (email === 'admin@gmail.com' && password === '123456') {

      localStorage.setItem('isLoggedIn', 'true');

      this.router.navigate(['/dashboard']);

      return true;
    }

    return false;
  }

  logout(): void {
    localStorage.removeItem('isLoggedIn');
    this.router.navigate(['/login']);
  }

  isAuthenticated(): boolean {
    return localStorage.getItem('isLoggedIn') === 'true';
  }
}
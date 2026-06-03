import { Injectable } from '@angular/core';
import { Router } from '@angular/router';

export interface User {
  fullName: string;
  email: string;
  password: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  constructor(private router: Router) {}

  // ── Registration ────────────────────────────────────────────────────────────

  /**
   * Reads existing users from localStorage, checks for duplicate email,
   * and saves the new user if the email is not already taken.
   * @returns true on success, false if email already exists.
   */
  register(user: User): boolean {
    const users = this.getUsers();

    const emailExists = users.some(
      (u) => u.email.toLowerCase() === user.email.toLowerCase()
    );

    if (emailExists) {
      return false;
    }

    users.push({ fullName: user.fullName, email: user.email, password: user.password });
    localStorage.setItem('users', JSON.stringify(users));
    return true;
  }

  /** Retrieves the full list of registered users from localStorage. */
  private getUsers(): User[] {
    const raw = localStorage.getItem('users');
    if (!raw) return [];
    try {
      return JSON.parse(raw) as User[];
    } catch {
      return [];
    }
  }

  // ── Login ───────────────────────────────────────────────────────────────────

  login(email: string, password: string): boolean {
    // Check hardcoded admin account
    if (email === 'admin@gmail.com' && password === '123456') {
      localStorage.setItem('isLoggedIn', 'true');
      this.router.navigate(['/dashboard']);
      return true;
    }

    // Check registered users stored in localStorage
    const users = this.getUsers();
    const match = users.find(
      (u) => u.email.toLowerCase() === email.toLowerCase() && u.password === password
    );

    if (match) {
      localStorage.setItem('isLoggedIn', 'true');
      this.router.navigate(['/dashboard']);
      return true;
    }

    return false;
  }

  // ── Logout ──────────────────────────────────────────────────────────────────

  logout(): void {
    localStorage.removeItem('isLoggedIn');
    this.router.navigate(['/login']);
  }

  // ── Auth Check ──────────────────────────────────────────────────────────────

  isAuthenticated(): boolean {
    return localStorage.getItem('isLoggedIn') === 'true';
  }
}
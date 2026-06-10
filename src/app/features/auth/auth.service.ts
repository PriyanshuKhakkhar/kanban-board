import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';

export interface User {
  id?: string | number;
  fullName: string;
  name?: string; // compatibility with legacy name properties
  email: string;
  password: string;
  role: 'ADMIN' | 'HR' | 'USER';
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = 'http://localhost:3000/users';

  constructor(private router: Router, private http: HttpClient) {
    this.syncUsersWithDb();
  }

  private syncUsersWithDb(): void {
    this.http.get<User[]>(this.apiUrl).subscribe({
      next: (users) => {
        localStorage.setItem('users', JSON.stringify(users));
      },
      error: (err) => console.error('Failed to load users from db.json:', err)
    });
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

    const newUser: User = {
      fullName: user.fullName,
      name: user.fullName,
      email: user.email,
      password: user.password,
      role: user.role || 'USER'
    };

    users.push(newUser);
    localStorage.setItem('users', JSON.stringify(users));

    // Post to db.json to persist it in the JSON server too
    this.http.post<User>(this.apiUrl, newUser).subscribe({
      error: (err) => console.error('Failed to post new user to db.json:', err)
    });

    return true;
  }

  // ── Login ───────────────────────────────────────────────────────────────────

  login(email: string, password: string): User | null {
    // Perform background sync to keep database updated
    this.syncUsersWithDb();

    const users = this.getUsers();
    const match = users.find(
      (u) => u.email.toLowerCase() === email.toLowerCase() && u.password === password
    );

    if (match) {
      localStorage.setItem('isLoggedIn', 'true');
      localStorage.setItem('currentUserEmail', match.email.toLowerCase());
      localStorage.setItem(
        'currentUser',
        JSON.stringify({
          fullName: match.fullName || match.name || 'User',
          email: match.email,
          role: (match.role || 'USER').toUpperCase() as 'ADMIN' | 'HR' | 'USER'
        })
      );
      this.router.navigate(['/dashboard']);
      return match;
    }

    return null;
  }

  // ── Logout ──────────────────────────────────────────────────────────────────

  logout(): void {
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('currentUserEmail');
    localStorage.removeItem('currentUser');
    this.router.navigate(['/login']);
  }

  // ── Auth Checks & Helpers ───────────────────────────────────────────────────

  isLoggedIn(): boolean {
    return localStorage.getItem('isLoggedIn') === 'true' && localStorage.getItem('currentUser') !== null;
  }

  getCurrentUser(): User | null {
    const raw = localStorage.getItem('currentUser');
    if (!raw) return null;
    try {
      return JSON.parse(raw) as User;
    } catch {
      return null;
    }
  }

  getRole(): 'ADMIN' | 'HR' | 'USER' | null {
    const user = this.getCurrentUser();
    return user && user.role ? (user.role.toUpperCase() as 'ADMIN' | 'HR' | 'USER') : null;
  }

  // ── Legacy Compatibility Aliases ───────────────────────────────────────────

  isAuthenticated(): boolean {
    return this.isLoggedIn();
  }

  getCurrentUserRole(): 'ADMIN' | 'HR' | 'USER' | null {
    return this.getRole();
  }

  getCurrentUserEmail(): string | null {
    const user = this.getCurrentUser();
    return user ? user.email : localStorage.getItem('currentUserEmail');
  }
}
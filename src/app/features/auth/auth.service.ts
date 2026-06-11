import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError, switchMap } from 'rxjs/operators';

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
  private apiUrl = 'https://kanban-api-1-vbym.onrender.com/users';

  constructor(private router: Router, private http: HttpClient) {}

  // ── Registration ────────────────────────────────────────────────────────────

  /**
   * Checks db.json for a duplicate email, then POSTs the new user if none found.
   * @returns Observable<true> on success, Observable<false> if email already exists.
   */
  register(user: User): Observable<boolean> {
    return this.http.get<User[]>(this.apiUrl).pipe(
      switchMap((users) => {
        const emailExists = users.some(
          (u) => u.email.toLowerCase() === user.email.toLowerCase()
        );

        if (emailExists) {
          return of(false);
        }

        const newUser: User = {
          fullName: user.fullName,
          name: user.fullName,
          email: user.email,
          password: user.password,
          role: user.role || 'USER'
        };

        return this.http.post<User>(this.apiUrl, newUser).pipe(
          map(() => true),
          catchError((err) => {
            console.error('Failed to register user:', err);
            return of(false);
          })
        );
      }),
      catchError((err) => {
        console.error('Failed to fetch users for registration check:', err);
        return of(false);
      })
    );
  }

  // ── Login ───────────────────────────────────────────────────────────────────
  // Trims input, checks db.json for matching email/password, and sets localStorage on success.
  login(email: string, password: string): Observable<User | null> {
    const trimmedEmail = email.trim().toLowerCase();
    const trimmedPassword = password.trim();

    return this.http.get<User[]>(this.apiUrl).pipe(
      map((users) => {
        const match = users.find(
          (u) => u.email.toLowerCase() === trimmedEmail && u.password === trimmedPassword
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
      }),
      catchError(() => {
        return of(null);
      })
    );
  }

  // ── Logout ──────────────────────────────────────────────────────────────────
  // Clears all auth-related localStorage items and redirects to login page.
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

  getAllUsers(): Observable<User[]> {
    return this.http.get<User[]>(this.apiUrl).pipe(
      catchError(() => {
        return of([]);
      })
    );
  }
}
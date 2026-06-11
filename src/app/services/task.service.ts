import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class TaskService {
  private http = inject(HttpClient);
  private apiUrl = 'https://kanban-api-1-vbym.onrender.com/tasks';

  // ── Load ──────────────────────────────────────────────────────────────────
  // Always fetches fresh data from db.json. No localStorage involvement.

  getTasks(): Observable<any[]> {
    return this.http.get<any[]>(this.apiUrl).pipe(
      catchError((err) => {
        console.error('Failed to load tasks from server:', err);
        return throwError(() => err);
      })
    );
  }

  // ── Create ────────────────────────────────────────────────────────────────
  // POSTs directly to db.json. No temporary IDs or local caching.

  createTask(task: any): Observable<any> {
    return this.http.post<any>(this.apiUrl, task).pipe(
      catchError((err) => {
        console.error('Failed to create task on server:', err);
        return throwError(() => err);
      })
    );
  }

  // ── Update ────────────────────────────────────────────────────────────────
  // PUTs to db.json. No localStorage pre-update.

  updateTask(task: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${task.id}`, task).pipe(
      catchError((err) => {
        console.error('Failed to update task on server:', err);
        return throwError(() => err);
      })
    );
  }

  // ── Delete ────────────────────────────────────────────────────────────────
  // DELETEs from db.json. No localStorage pre-delete.

  deleteTask(id: any): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${id}`).pipe(
      catchError((err) => {
        console.error('Failed to delete task on server:', err);
        return throwError(() => err);
      })
    );
  }
}

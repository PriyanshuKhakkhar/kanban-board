import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class TaskService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:3000/tasks';

  constructor() { }

  private getLocalTasks(): any[] {
    const raw = localStorage.getItem('tasks_local');
    if (!raw) {
      const defaultTasks = [
        { id: "2", boardId: 1, title: "Integrate API", status: "Review", priority: "MEDIUM" },
        { id: "3", boardId: 1, title: "Review Dashboard", status: "In Progress", priority: "LOW", dueDate: "2026-06-11T00:00:00.000Z" },
        { id: "4", boardId: 1, title: "Deploy App", status: "Done", priority: "HIGH", dueDate: "2026-07-09T00:00:00.000Z" }
      ];
      localStorage.setItem('tasks_local', JSON.stringify(defaultTasks));
      return defaultTasks;
    }
    try {
      return JSON.parse(raw) as any[];
    } catch {
      return [];
    }
  }

  private saveLocalTasks(tasks: any[]): void {
    localStorage.setItem('tasks_local', JSON.stringify(tasks));
  }

  getTasks(): Observable<any[]> {
    return this.http.get<any[]>(this.apiUrl).pipe(
      tap(tasks => this.saveLocalTasks(tasks)),
      catchError(() => {
        console.warn('json-server tasks endpoint offline. Using local tasks fallback.');
        return of(this.getLocalTasks());
      })
    );
  }

  createTask(task: any): Observable<any> {
    const tasks = this.getLocalTasks();
    const tempId = task.id || 'local_' + Math.random().toString(36).substring(2, 11);
    const newTask = { ...task, id: tempId };
    tasks.push(newTask);
    this.saveLocalTasks(tasks);

    return this.http.post<any>(this.apiUrl, task).pipe(
      tap(savedTask => {
        const currentTasks = this.getLocalTasks();
        const idx = currentTasks.findIndex(t => String(t.id) === String(tempId));
        if (idx !== -1) {
          currentTasks[idx] = savedTask;
          this.saveLocalTasks(currentTasks);
        }
      }),
      catchError(() => {
        console.warn('json-server offline. Saved task locally.');
        return of(newTask);
      })
    );
  }

  updateTask(task: any): Observable<any> {
    const tasks = this.getLocalTasks();
    const idx = tasks.findIndex(t => String(t.id) === String(task.id));
    if (idx !== -1) {
      tasks[idx] = task;
      this.saveLocalTasks(tasks);
    }

    return this.http.put<any>(`${this.apiUrl}/${task.id}`, task).pipe(
      catchError(() => {
        console.warn('json-server offline. Updated task locally.');
        return of(task);
      })
    );
  }

  deleteTask(id: any): Observable<any> {
    const tasks = this.getLocalTasks();
    const filtered = tasks.filter(t => String(t.id) !== String(id));
    this.saveLocalTasks(filtered);

    return this.http.delete<any>(`${this.apiUrl}/${id}`).pipe(
      catchError(() => {
        console.warn('json-server offline. Deleted task locally.');
        return of({ id });
      })
    );
  }
}

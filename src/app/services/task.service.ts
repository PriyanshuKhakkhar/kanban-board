import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class TaskService {

  private http = inject(HttpClient);

  private apiUrl = 'http://localhost:3000/tasks';

  constructor() { }

  getTasks() {
    return this.http.get<any[]>(this.apiUrl);
  }

  createTask(task: any) {
    return this.http.post<any>(this.apiUrl, task);
  }

  updateTask(task: any) {
    return this.http.put<any>(`${this.apiUrl}/${task.id}`, task);
  }

  deleteTask(id: any) {
    return this.http.delete<any>(`${this.apiUrl}/${id}`);
  }
}

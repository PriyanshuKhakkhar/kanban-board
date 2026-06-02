import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavbarComponent } from '../../../shared/components/navbar/navbar.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, NavbarComponent],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent {
  addCard(column: string): void {
      console.log(`Add card to ${column} column`);
  }
  // Task arrays for each column
  todoTasks: Array<{ title: string }> = [];
  inprogressTasks: Array<{ title: string }> = [];
  reviewTasks: Array<{ title: string }> = [];
  doneTasks: Array<{ title: string }> = [];

  // Flags to show inline add input per column
  showAddInput = {
    todo: false,
    inprogress: false,
    review: false,
    done: false,
  };

  toggleAdd(column: 'todo' | 'inprogress' | 'review' | 'done') {
    this.showAddInput[column] = !this.showAddInput[column];
  }

  createTask(column: 'todo' | 'inprogress' | 'review' | 'done', title: string) {
    const text = (title || '').trim();
    if (!text) return;
    const task = { title: text };
    if (column === 'todo') this.todoTasks.push(task);
    else if (column === 'inprogress') this.inprogressTasks.push(task);
    else if (column === 'review') this.reviewTasks.push(task);
    else if (column === 'done') this.doneTasks.push(task);

    // hide input for the column after adding
    this.showAddInput[column] = false;
  }
}



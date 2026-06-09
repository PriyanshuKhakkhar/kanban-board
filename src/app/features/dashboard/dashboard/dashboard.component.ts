import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavbarComponent } from '../../../shared/components/navbar/navbar.component';
import { RouterModule, Router } from '@angular/router';
import { BoardService, Board, Task } from '../../../core/services/board.service';
import { TaskService } from '../../../services/task.service';
import { Observable, BehaviorSubject, combineLatest } from 'rxjs';
import { map } from 'rxjs/operators';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { CreateBoardDialogComponent } from '../../../shared/components/create-board-dialog/create-board-dialog.component';
import { TaskDialogComponent, TaskDialogData } from '../../../shared/components/task-dialog/task-dialog.component';
import { ConfirmDialogComponent, ConfirmDialogData } from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import { TaskFormDialogComponent, TaskFormDialogData } from '../../../shared/components/task-form-dialog/task-form-dialog.component';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { DragDropModule, CdkDragDrop, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    NavbarComponent,
    RouterModule,
    MatDialogModule,
    MatIconModule,
    MatMenuModule,
    MatButtonModule,
    MatDividerModule,
    DragDropModule,
    TaskFormDialogComponent
  ],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {
  boards$!: Observable<Board[]>;
  active$!: Observable<Board | null>;
  filteredBoard$!: Observable<Board | null>;

  tasks: any[] = [];
  filteredTodoTasks: any[] = [];
  filteredInprogressTasks: any[] = [];
  filteredReviewTasks: any[] = [];
  filteredDoneTasks: any[] = [];

  private activeFilterSubject = new BehaviorSubject<string | null>(null);
  activeFilter$ = this.activeFilterSubject.asObservable();

  get activeFilter(): string | null {
    return this.activeFilterSubject.getValue();
  }

  constructor(
    private boardService: BoardService,
    private router: Router,
    private dialog: MatDialog,
    private taskService: TaskService
  ) {
    this.boards$ = this.boardService.boards$;
    this.active$ = this.boardService.active$;

    this.filteredBoard$ = combineLatest([
      this.boardService.active$,
      this.activeFilter$
    ]).pipe(
      map(([board, filter]) => {
        if (!board) return null;
        if (!filter) return board;

        const cols = board.columns;
        if (!cols) return board;

        return {
          ...board,
          columns: {
            todo: this.filterColumnTasks(cols.todo, 'todo', filter),
            inprogress: this.filterColumnTasks(cols.inprogress, 'inprogress', filter),
            review: this.filterColumnTasks(cols.review, 'review', filter),
            done: this.filterColumnTasks(cols.done, 'done', filter)
          }
        };
      })
    );
  }

  toggleFavoriteBoard(b: Board | null) {
    if (!b) return;
    this.boardService.toggleFavorite(b.id);
  }

  applyFilter(filter: string | null) {
    this.activeFilterSubject.next(filter);
  }

  private filterColumnTasks(tasks: any[] | undefined, column: string, filter: string | null): any[] {
    if (!tasks) return [];
    if (!filter) return tasks;
    return tasks.filter(task => {
      switch (filter) {
        case 'Overdue':
          return this.isOverdue(task, column);
        case 'Due Today':
          return this.isDueToday(task.dueDate);
        case 'Due This Week':
          return this.isDueThisWeek(task.dueDate);
        case 'High Priority':
          return task.priority === 'HIGH';
        case 'Medium Priority':
          return task.priority === 'MEDIUM';
        case 'Low Priority':
          return task.priority === 'LOW';
        default:
          return true;
      }
    });
  }

  isOverdue(task: Task, column: string): boolean {
    if (column === 'done') return false;
    if (!task.dueDate) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(task.dueDate);
    due.setHours(0, 0, 0, 0);
    return due.getTime() < today.getTime();
  }

  isDueToday(dueDate: any): boolean {
    if (!dueDate) return false;
    const today = new Date();
    const due = new Date(dueDate);
    return today.getDate() === due.getDate() &&
           today.getMonth() === due.getMonth() &&
           today.getFullYear() === due.getFullYear();
  }

  isDueThisWeek(dueDate: any): boolean {
    if (!dueDate) return false;
    const due = new Date(dueDate);
    due.setHours(0, 0, 0, 0);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const currentDay = today.getDay();
    const distanceToMonday = currentDay === 0 ? -6 : 1 - currentDay;

    const monday = new Date(today);
    monday.setDate(today.getDate() + distanceToMonday);

    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    sunday.setHours(23, 59, 59, 999);

    return due >= monday && due <= sunday;
  }

  getPriorityClass(priority: string): string {
    if (!priority) return '';
    return 'priority-' + priority.toLowerCase();
  }

  openBoardDetails(b: Board | null) {
    if (!b) return;
    // Board details shown via the existing board header — no browser alert needed
    console.log('Board details:', b);
  }

  renameBoard(b: Board | null) {
    if (!b) return;
    const data: TaskDialogData = {
      title: 'Rename Board',
      label: 'Board name',
      value: b.name,
      placeholder: 'Enter board name'
    };
    const ref = this.dialog.open(TaskDialogComponent, {
      width: '400px',
      panelClass: 'kb-dialog-panel',
      data
    });
    ref.afterClosed().subscribe((name: string | null) => {
      if (!name) return;
      this.boardService.renameBoard(b.id, name);
      this.boardService.setActive(b.id);
    });
  }

  duplicateBoard(b: Board | null) {
    if (!b) return;
    this.boardService.duplicateBoard(b.id);
  }

  deleteBoard(b: Board | null) {
    if (!b) return;
    const data: ConfirmDialogData = {
      title: 'Delete Board',
      message: `Delete board "${b.name}"? This cannot be undone.`,
      confirmLabel: 'Delete',
      danger: true
    };
    const ref = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      panelClass: 'kb-dialog-panel',
      data
    });
    ref.afterClosed().subscribe((confirmed: boolean) => {
      if (confirmed) this.boardService.deleteBoard(b.id);
    });
  }

  setActive(b: Board) {
    this.boardService.setActive(b.id);
    // ensure we're on dashboard
    this.router.navigate(['/dashboard']);
  }

  openCreateDialog() {
    const ref = this.dialog.open(CreateBoardDialogComponent, { width: '420px' });
    ref.afterClosed().subscribe((board) => {
      if (board) {
        this.boardService.addBoard(board);
      }
    });
  }
  // keep local reference for convenience when adding tasks
  private currentBoard: Board | null = null;
  ngOnInit(): void {
    // Reload boards for the current user (important after login)
    this.boardService.loadBoards();
    this.boardService.active$.subscribe(b => (this.currentBoard = b));

    // Load API tasks on init
    this.loadApiTasks();

    // Subscribe to filter changes
    this.activeFilter$.subscribe(() => {
      this.updateFilteredTasks();
    });
  }
  
  editTask(column: 'todo' | 'inprogress' | 'review' | 'done', index: number, task: any) {
    const data: TaskFormDialogData = {
      title: 'Edit Task',
      task,
      submitLabel: 'Save'
    };
    const ref = this.dialog.open(TaskFormDialogComponent, {
      width: '400px',
      panelClass: 'kb-dialog-panel',
      data
    });
    ref.afterClosed().subscribe((updatedTask: Partial<Task> | null) => {
      if (!updatedTask) return;

      const apiTask = {
        ...task,
        title: updatedTask.title,
        priority: updatedTask.priority,
        dueDate: updatedTask.dueDate
      };

      this.taskService.updateTask(apiTask).subscribe({
        next: () => {
          this.loadApiTasks();
        },
        error: (err) => console.error('Error updating task:', err)
      });
    });
  }

  deleteTask(column: 'todo' | 'inprogress' | 'review' | 'done', index: number, task: any) {
    const data: ConfirmDialogData = {
      title: 'Delete Task',
      message: `Delete task "${task.title}"?`,
      confirmLabel: 'Delete',
      danger: true
    };
    const ref = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      panelClass: 'kb-dialog-panel',
      data
    });
    ref.afterClosed().subscribe((confirmed: boolean) => {
      if (confirmed) {
        this.taskService.deleteTask(task.id).subscribe({
          next: () => {
            this.loadApiTasks();
          },
          error: (err) => console.error('Error deleting task:', err)
        });
      }
    });
  }

  addCard(column: 'todo' | 'inprogress' | 'review' | 'done'): void {
    const data: TaskFormDialogData = {
      title: 'Add Task',
      submitLabel: 'Add'
    };
    const ref = this.dialog.open(TaskFormDialogComponent, {
      width: '400px',
      panelClass: 'kb-dialog-panel',
      data
    });
    ref.afterClosed().subscribe((newTask: Partial<Task> | null) => {
      if (!newTask) return;

      const apiTask = {
        title: newTask.title,
        priority: newTask.priority || 'MEDIUM',
        dueDate: newTask.dueDate,
        status: this.getStatusFromColumnId(column)
      };

      this.taskService.createTask(apiTask).subscribe({
        next: () => {
          this.loadApiTasks();
        },
        error: (err) => console.error('Error creating task:', err)
      });
    });
  }

  // Task arrays for each column
  todoTasks: any[] = [];
  inprogressTasks: any[] = [];
  reviewTasks: any[] = [];
  doneTasks: any[] = [];

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

    const apiTask = {
      title: text,
      priority: 'MEDIUM',
      dueDate: new Date(),
      status: this.getStatusFromColumnId(column)
    };

    this.taskService.createTask(apiTask).subscribe({
      next: () => {
        this.loadApiTasks();
        this.showAddInput[column] = false;
      },
      error: (err) => console.error('Error creating task inline:', err)
    });
  }

  drop(event: CdkDragDrop<any[]>) {
    const previousColumn = event.previousContainer.id as 'todo' | 'inprogress' | 'review' | 'done';
    const currentColumn = event.container.id as 'todo' | 'inprogress' | 'review' | 'done';
    const draggedTask = event.previousContainer.data[event.previousIndex];

    if (event.previousContainer === event.container) {
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
    } else {
      transferArrayItem(
        event.previousContainer.data,
        event.container.data,
        event.previousIndex,
        event.currentIndex
      );

      draggedTask.status = this.getStatusFromColumnId(currentColumn);
      this.taskService.updateTask(draggedTask).subscribe({
        next: () => {
          this.loadApiTasks();
        },
        error: (err) => {
          console.error('Failed to update task status:', err);
          this.loadApiTasks();
        }
      });
    }
  }

  loadApiTasks() {
    this.taskService.getTasks().subscribe({
      next: (data) => {
        this.tasks = data.map(task => ({
          ...task,
          priority: task.priority ? task.priority.toUpperCase() : 'MEDIUM',
          dueDate: task.dueDate ? new Date(task.dueDate) : undefined
        }));
        this.updateFilteredTasks();
      },
      error: (err) => console.error('Failed to load tasks:', err)
    });
  }

  updateFilteredTasks() {
    this.todoTasks = this.tasks.filter(t => t.status === 'Todo');
    this.inprogressTasks = this.tasks.filter(t => t.status === 'In Progress');
    this.reviewTasks = this.tasks.filter(t => t.status === 'Review');
    this.doneTasks = this.tasks.filter(t => t.status === 'Done');

    const filter = this.activeFilter;
    this.filteredTodoTasks = this.filterColumnTasks(this.todoTasks, 'todo', filter);
    this.filteredInprogressTasks = this.filterColumnTasks(this.inprogressTasks, 'inprogress', filter);
    this.filteredReviewTasks = this.filterColumnTasks(this.reviewTasks, 'review', filter);
    this.filteredDoneTasks = this.filterColumnTasks(this.doneTasks, 'done', filter);
  }

  getStatusFromColumnId(columnId: string): string {
    switch (columnId) {
      case 'todo': return 'Todo';
      case 'inprogress': return 'In Progress';
      case 'review': return 'Review';
      case 'done': return 'Done';
      default: return 'Todo';
    }
  }
}



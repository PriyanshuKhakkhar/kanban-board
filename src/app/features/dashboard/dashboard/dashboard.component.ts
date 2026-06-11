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
import { BoardDetailsDialogComponent } from '../../../shared/components/board-details-dialog/board-details-dialog.component';
import { AuthService } from '../../../features/auth/auth.service';
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
    TaskFormDialogComponent,
    BoardDetailsDialogComponent
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

  get isAdmin(): boolean {
    return this.authService.getCurrentUserRole() === 'ADMIN';
  }

  get isHR(): boolean {
    return this.authService.getCurrentUserRole() === 'HR';
  }

  get isUser(): boolean {
    return this.authService.getCurrentUserRole() === 'USER';
  }

  get canManageBoards(): boolean {
    return this.isAdmin;
  }

  get canWriteTasks(): boolean {
    return this.isAdmin || this.isHR;
  }

  get canDeleteTasks(): boolean {
    return this.isAdmin;
  }

  get currentUserId(): string | null {
    // Resolve from the current session — ID is stored on the user object
    // stored in currentUser if available, otherwise fall back to null
    // and let the name/email fallbacks in isAssignedToCurrentUser handle it.
    const currentUser = this.authService.getCurrentUser() as any;
    if (!currentUser) return null;
    if (currentUser.id !== undefined && currentUser.id !== null) return String(currentUser.id);
    return null;
  }

  isAssignedToCurrentUser(task: any): boolean {
    const loggedInId = this.currentUserId;
    if (loggedInId && task.assigneeId && String(task.assigneeId) === String(loggedInId)) {
      return true;
    }
    const currentUser = this.authService.getCurrentUser();
    if (currentUser) {
      if (task.assigneeName && currentUser.fullName && task.assigneeName.toLowerCase() === currentUser.fullName.toLowerCase()) {
        return true;
      }
      if (task.assigneeId && currentUser.email && String(task.assigneeId).toLowerCase() === currentUser.email.toLowerCase()) {
        return true;
      }
    }
    return false;
  }

  canEditTask(task: any): boolean {
    // Done tasks are immutable — nobody can edit them
    if (task.status?.toLowerCase() === 'done') return false;
    // Only Admin or the assigned user can edit
    if (this.isAdmin) return true;
    if (this.isAssignedToCurrentUser(task)) return true;
    return false;
  }

  canDeleteTask(task: any): boolean {
    // Done tasks are immutable — nobody can delete them
    if (task.status?.toLowerCase() === 'done') return false;
    // Only Admin can delete tasks
    if (this.isAdmin) return true;
    return false;
  }

  constructor(
    private boardService: BoardService,
    private router: Router,
    private dialog: MatDialog,
    private taskService: TaskService,
    private authService: AuthService
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
    this.dialog.open(BoardDetailsDialogComponent, {
      width: '500px',
      data: {
        boardName: b.name,
        owner: this.authService.getCurrentUserEmail() ?? 'guest',
        createdDate: b.createdAt,
        todoCount: this.filteredTodoTasks.length,
        inprogressCount: this.filteredInprogressTasks.length,
        reviewCount: this.filteredReviewTasks.length,
        doneCount: this.filteredDoneTasks.length
      }
    });
  }

  renameBoard(b: Board | null) {
    if (!this.canManageBoards || !b) return;
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
    if (!this.canManageBoards || !b) return;
    this.boardService.duplicateBoard(b.id);
  }

  deleteBoard(b: Board | null) {
    if (!this.canManageBoards || !b) return;
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
    if (!this.canManageBoards) return;
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
    this.boardService.active$.subscribe(b => {
      this.currentBoard = b;
      this.updateFilteredTasks();
    });

    // Load API tasks on init
    this.loadApiTasks();

    // Subscribe to filter changes
    this.activeFilter$.subscribe(() => {
      this.updateFilteredTasks();
    });
  }
  
  editTask(column: 'todo' | 'inprogress' | 'review' | 'done', index: number, task: any) {
    if (!this.canEditTask(task)) return;
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
        title: updatedTask.title ? updatedTask.title.trim() : task.title,
        description: (updatedTask.description && updatedTask.description.trim()) ? updatedTask.description.trim() : task.description,
        priority: updatedTask.priority ? updatedTask.priority : task.priority,
        dueDate: updatedTask.dueDate ? updatedTask.dueDate : task.dueDate,
        assigneeId: updatedTask.assigneeId ? updatedTask.assigneeId : task.assigneeId,
        assigneeName: updatedTask.assigneeName ? updatedTask.assigneeName : task.assigneeName,
        isComplete: updatedTask.isComplete !== undefined ? updatedTask.isComplete : task.isComplete
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
    if (!this.canDeleteTask(task)) return;
    const data: ConfirmDialogData = {
      title: 'Delete Task',
      message: 'Are you sure you want to delete this task?',
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
    if (column !== 'todo') return;
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
        description: newTask.description,
        priority: newTask.priority || 'MEDIUM',
        dueDate: newTask.dueDate,
        assigneeId: newTask.assigneeId,
        assigneeName: newTask.assigneeName,
        isComplete: newTask.isComplete || false,
        status: this.getStatusFromColumnId(column),
        boardId: this.currentBoard?.id
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
    if (column !== 'todo') return;
    const text = (title || '').trim();
    if (!text) return;

    const apiTask = {
      title: text,
      priority: 'MEDIUM',
      dueDate: new Date(),
      status: this.getStatusFromColumnId(column),
      boardId: this.currentBoard?.id
    };

    this.taskService.createTask(apiTask).subscribe({
      next: () => {
        this.loadApiTasks();
        this.showAddInput[column] = false;
      },
      error: (err) => console.error('Error creating task inline:', err)
    });
  }

  isMoveAllowed(previousColumn: string, currentColumn: string, task: any): boolean {
    const role = this.authService.getCurrentUserRole() || 'USER';

    // Done is immutable — nobody can move out of Done
    if (previousColumn === 'done') {
      return false;
    }

    // ADMIN: can move any non-Done task forward through the pipeline
    if (role === 'ADMIN') {
      return true;
    }

    // HR:
    //   - Todo → In Progress  (only if HR is the assignee)
    //   - In Progress → Review (task must be marked complete first — checked in drop())
    // HR cannot move Review → Done (only Admin can do that)
    if (role === 'HR') {
      if (previousColumn === 'todo' && currentColumn === 'inprogress') {
        return this.isAssignedToCurrentUser(task);
      }
      if (previousColumn === 'inprogress' && currentColumn === 'review') {
        return true;
      }
      return false;
    }

    // USER: Todo → In Progress only, and only if the task is assigned to them
    if (role === 'USER') {
      if (previousColumn === 'todo' && currentColumn === 'inprogress') {
        if (!this.isAssignedToCurrentUser(task)) {
          alert('You can only move tasks that are assigned to you.');
          return false;
        }
        return true;
      }
      return false;
    }

    return false;
  }

  drop(event: CdkDragDrop<any[]>) {
    const previousColumn = event.previousContainer.id as 'todo' | 'inprogress' | 'review' | 'done';
    const currentColumn = event.container.id as 'todo' | 'inprogress' | 'review' | 'done';

    if (event.previousContainer === event.container) {
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
    } else {
      const draggedTask = event.previousContainer.data[event.previousIndex];

      // 1. Check if the role is allowed to perform this transition
      if (!this.isMoveAllowed(previousColumn, currentColumn, draggedTask)) {
        alert("You are not authorized to move this task to that status.");
        this.loadApiTasks();
        return;
      }

      // 2. Validate the isComplete condition for In Progress -> Review
      if (previousColumn === 'inprogress' && currentColumn === 'review') {
        if (!draggedTask.isComplete && !draggedTask.isCompleted) {
          alert("Please mark the task as complete before moving it to Review.");
          this.loadApiTasks();
          return;
        }
      }

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
    const activeBoardId = this.currentBoard?.id;
    let boardTasks = this.tasks.filter(t => 
      !t.boardId || 
      (activeBoardId !== undefined && activeBoardId !== null && String(t.boardId) === String(activeBoardId))
    );

    this.todoTasks = boardTasks.filter(t => t.status?.toLowerCase() === 'todo');
    this.inprogressTasks = boardTasks.filter(t => t.status?.toLowerCase() === 'in progress');
    this.reviewTasks = boardTasks.filter(t => t.status?.toLowerCase() === 'review');
    this.doneTasks = boardTasks.filter(t => t.status?.toLowerCase() === 'done');

    const filter = this.activeFilter;
    this.filteredTodoTasks = this.sortByPriority(this.filterColumnTasks(this.todoTasks, 'todo', filter));
    this.filteredInprogressTasks = this.sortByPriority(this.filterColumnTasks(this.inprogressTasks, 'inprogress', filter));
    this.filteredReviewTasks = this.sortByPriority(this.filterColumnTasks(this.reviewTasks, 'review', filter));
    this.filteredDoneTasks = this.sortByPriority(this.filterColumnTasks(this.doneTasks, 'done', filter));
  }

  private sortByPriority(tasks: any[]): any[] {
    const order: Record<string, number> = { HIGH: 0, MEDIUM: 1, LOW: 2 };
    return [...tasks].sort((a, b) => {
      const pa = order[(a.priority || '').toUpperCase()] ?? 99;
      const pb = order[(b.priority || '').toUpperCase()] ?? 99;
      return pa - pb;
    });
  }

  canMarkAsComplete(task: any): boolean {
    // Done tasks are already complete — hide the button
    if (task.status?.toLowerCase() === 'done') return false;
    // Already marked complete — hide the button
    if (task.isComplete || task.isCompleted) return false;
    // Only Admin or the assigned user can mark complete
    if (this.isAdmin) return true;
    if (this.isAssignedToCurrentUser(task)) return true;
    return false;
  }

  markAsCompleted(task: any): void {
    const updated = {
      ...task,
      isComplete: true,
      isCompleted: true
    };
    this.taskService.updateTask(updated).subscribe({
      next: () => {
        this.loadApiTasks();
      },
      error: (err) => console.error('Error marking task as complete:', err)
    });
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



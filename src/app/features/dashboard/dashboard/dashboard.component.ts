import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavbarComponent } from '../../../shared/components/navbar/navbar.component';
import { RouterModule, Router } from '@angular/router';
import { BoardService, Board } from '../../../core/services/board.service';
import { Observable } from 'rxjs';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { CreateBoardDialogComponent } from '../../../shared/components/create-board-dialog/create-board-dialog.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, NavbarComponent, RouterModule, MatDialogModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent {
  boards$!: Observable<Board[]>;
  active$!: Observable<Board | null>;

  constructor(private boardService: BoardService, private router: Router, private dialog: MatDialog) {
    this.boards$ = this.boardService.boards$;
    this.active$ = this.boardService.active$;
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
    this.boardService.active$.subscribe(b => (this.currentBoard = b));
  }
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
    if (!this.currentBoard) return;
    this.boardService.addTask(this.currentBoard.id, column, text);
    // hide input for the column after adding
    this.showAddInput[column] = false;
  }
}



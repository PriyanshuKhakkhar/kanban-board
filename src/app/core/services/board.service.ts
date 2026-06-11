import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
import { AuthService } from '../../features/auth/auth.service';

export interface Task {
  id?: any;
  boardId?: any;
  status?: string;
  title: string;
  description?: string;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  dueDate: Date;
  assigneeId?: any;
  assigneeName?: string;
  isComplete?: boolean;
  isCompleted?: boolean;
}

export interface Board {
  id: number;
  name: string;
  createdAt: string;
  favorite?: boolean;
  columns?: {
    todo: Task[];
    inprogress: Task[];
    review: Task[];
    done: Task[];
  };
}

@Injectable({ providedIn: 'root' })
export class BoardService {
  private boardsSubject = new BehaviorSubject<Board[]>([]);
  boards$ = this.boardsSubject.asObservable();
  private activeSubject = new BehaviorSubject<Board | null>(null);
  active$ = this.activeSubject.asObservable();

  constructor(private authService: AuthService) {
    // Load persisted boards for the currently logged-in user on startup
    this.loadBoards();
  }

  get boards() {
    return this.boardsSubject.getValue();
  }

  // ── LocalStorage Keys ────────────────────────────────────────────────────────

  private getBoardsKey(): string {
    const email = this.authService.getCurrentUserEmail() ?? 'guest';
    return `boards_${email}`;
  }

  // ── Persistence ──────────────────────────────────────────────────────────────

  /** Persists the current boards array to localStorage under a user-specific key. */
  saveBoards(): void {
    const key = this.getBoardsKey();
    localStorage.setItem(key, JSON.stringify(this.boards));
  }

  /**
   * Loads boards from localStorage for the current user and pushes them into
   * the reactive stream. If the active board was set before, it is restored too.
   */
  loadBoards(): void {
    const key = this.getBoardsKey();
    const raw = localStorage.getItem(key);
    if (!raw) {
      const defaultBoard: Board = {
        id: 1,
        name: 'CR-205',
        createdAt: new Date().toISOString(),
        columns: {
          todo: [],
          inprogress: [],
          review: [],
          done: []
        }
      };
      this.boardsSubject.next([defaultBoard]);
      this.activeSubject.next(defaultBoard);
      localStorage.setItem(key, JSON.stringify([defaultBoard]));
      return;
    }
    try {
      let boards = JSON.parse(raw) as Board[];
      
      // Migration: Ensure any board named 'CR-205' has ID 1 to match the db.json task seeds
      let migrated = false;
      boards = boards.map(b => {
        if (b.name === 'CR-205' && b.id !== 1) {
          migrated = true;
          return { ...b, id: 1 };
        }
        return b;
      });
      if (migrated) {
        localStorage.setItem(key, JSON.stringify(boards));
      }

      this.boardsSubject.next(boards);
      // Restore active board (first board by default if previously active is gone)
      const active = this.activeSubject.getValue();
      if (active) {
        const found = boards.find(b => b.id === active.id) ?? (boards.length ? boards[0] : null);
        this.activeSubject.next(found);
      } else if (boards.length) {
        this.activeSubject.next(boards[0]);
      }
    } catch {
      this.boardsSubject.next([]);
      this.activeSubject.next(null);
    }
  }

  // ── Tasks ────────────────────────────────────────────────────────────────────

  /**
   * Alias kept for API symmetry. Tasks are stored inline within boards,
   * so saveTasks / loadTasks delegate to saveBoards / loadBoards.
   */
  saveTasks(): void {
    this.saveBoards();
  }

  loadTasks(): void {
    this.loadBoards();
  }

  // ── Board Mutations ──────────────────────────────────────────────────────────

  addBoard(board: Board) {
    const b: Board = {
      ...board,
      favorite: board.favorite || false,
      columns: {
        todo: [],
        inprogress: [],
        review: [],
        done: []
      }
    };
    const next = [...this.boards, b];
    this.boardsSubject.next(next);
    // set newly created board as active
    this.activeSubject.next(b);
    this.saveBoards();
  }

  toggleFavorite(boardId: number) {
    const boards = this.boards.map(b => b.id === boardId ? { ...b, favorite: !b.favorite } : b);
    this.boardsSubject.next(boards);
    const active = this.activeSubject.getValue();
    if (active && active.id === boardId) {
      this.activeSubject.next(boards.find(x => x.id === boardId) || null);
    }
    this.saveBoards();
  }

  renameBoard(boardId: number, name: string) {
    const boards = this.boards.map(b => b.id === boardId ? { ...b, name } : b);
    this.boardsSubject.next(boards);
    const active = this.activeSubject.getValue();
    if (active && active.id === boardId) {
      this.activeSubject.next(boards.find(x => x.id === boardId) || null);
    }
    this.saveBoards();
  }

  deleteBoard(boardId: number) {
    const boards = this.boards.filter(b => b.id !== boardId);
    this.boardsSubject.next(boards);
    const active = this.activeSubject.getValue();
    if (active && active.id === boardId) {
      this.activeSubject.next(boards.length ? boards[0] : null);
    }
    this.saveBoards();
  }

  duplicateBoard(boardId: number) {
    const found = this.boards.find(b => b.id === boardId);
    if (!found) return;
    const copy: Board = {
      ...found,
      id: Math.max(0, ...this.boards.map(b => b.id)) + 1,
      name: `${found.name} (Copy)`,
      createdAt: new Date().toISOString(),
    };
    this.boardsSubject.next([...this.boards, copy]);
    this.saveBoards();
  }

  setActive(boardId: number) {
    const found = this.boards.find(b => b.id === boardId) || null;
    this.activeSubject.next(found);
  }

  // ── Task Mutations ────────────────────────────────────────────────────────────

  addTask(
    boardId: number,
    column: keyof NonNullable<Board['columns']>,
    title: string,
    priority: 'HIGH' | 'MEDIUM' | 'LOW',
    dueDate: Date
  ) {
    const boards = this.boards.map(b => {
      if (b.id !== boardId) return b;
      const copy: Board = { ...b, columns: { ...(b.columns as any) } };
      (copy.columns as any)[column] = [
        ...((copy.columns as any)[column] || []),
        { title, priority, dueDate }
      ];
      return copy;
    });
    this.boardsSubject.next(boards);
    // update active if it was the same board
    const active = this.activeSubject.getValue();
    if (active && active.id === boardId) {
      const updated = boards.find(x => x.id === boardId) || null;
      this.activeSubject.next(updated);
    }
    this.saveBoards();
  }

  updateTask(
    boardId: number,
    column: keyof NonNullable<Board['columns']>,
    index: number,
    title: string,
    priority: 'HIGH' | 'MEDIUM' | 'LOW',
    dueDate: Date
  ) {
    const boards = this.boards.map(b => {
      if (b.id !== boardId) return b;
      const copy: Board = { ...b, columns: { ...(b.columns as any) } };
      const col = ((copy.columns as any)[column] || []).slice();
      if (index >= 0 && index < col.length) {
        col[index] = { ...col[index], title, priority, dueDate };
      }
      (copy.columns as any)[column] = col;
      return copy;
    });
    this.boardsSubject.next(boards);
    const active = this.activeSubject.getValue();
    if (active && active.id === boardId) {
      this.activeSubject.next(boards.find(x => x.id === boardId) || null);
    }
    this.saveBoards();
  }

  deleteTask(boardId: number, column: keyof NonNullable<Board['columns']>, index: number) {
    const boards = this.boards.map(b => {
      if (b.id !== boardId) return b;
      const copy: Board = { ...b, columns: { ...(b.columns as any) } };
      const col = ((copy.columns as any)[column] || []).slice();
      if (index >= 0 && index < col.length) {
        col.splice(index, 1);
      }
      (copy.columns as any)[column] = col;
      return copy;
    });
    this.boardsSubject.next(boards);
    const active = this.activeSubject.getValue();
    if (active && active.id === boardId) {
      this.activeSubject.next(boards.find(x => x.id === boardId) || null);
    }
    this.saveBoards();
  }

  moveTask(
    boardId: number,
    previousColumn: keyof NonNullable<Board['columns']>,
    currentColumn: keyof NonNullable<Board['columns']>,
    previousIndex: number,
    currentIndex: number
  ) {
    const boards = this.boards.map(b => {
      if (b.id !== boardId) return b;
      const copy: Board = { ...b, columns: { ...(b.columns as any) } };
      
      const prevCol = ((copy.columns as any)[previousColumn] || []).slice();
      const currCol = previousColumn === currentColumn ? prevCol : ((copy.columns as any)[currentColumn] || []).slice();
      
      if (previousColumn === currentColumn) {
        moveItemInArray(prevCol, previousIndex, currentIndex);
        (copy.columns as any)[previousColumn] = prevCol;
      } else {
        transferArrayItem(prevCol, currCol, previousIndex, currentIndex);
        (copy.columns as any)[previousColumn] = prevCol;
        (copy.columns as any)[currentColumn] = currCol;
      }
      return copy;
    });
    this.boardsSubject.next(boards);
    
    const active = this.activeSubject.getValue();
    if (active && active.id === boardId) {
      this.activeSubject.next(boards.find(x => x.id === boardId) || null);
    }
    this.saveBoards();
  }
}
